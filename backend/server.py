from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
import hmac
import hashlib
import json
from fastapi import Request, Header, HTTPException, Depends, UploadFile, File, Form, Response
from fastapi.responses import JSONResponse

import cms_auth
import storage as cms_storage
import ad_spend as ad_spend_module


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import freshsales
import antijunk
import otp
import geo
import leads as leads_view
import payments as payments_module
import crm_sync
import funnel as funnel_module
from apscheduler.schedulers.asyncio import AsyncIOScheduler

_scheduler = AsyncIOScheduler(timezone="UTC")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class DemoRequestCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    outlet_type: str | None = None
    business_name: str | None = None
    city: str | None = None
    years_in_business: str | None = None
    using_pos: str | None = None
    current_pos: str | None = None
    source_page: str | None = None
    event_id: str | None = None
    otp_token: str | None = None
    attribution: dict | None = None
    hp: str | None = None
    elapsed_ms: int | None = None


class DemoRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: str | None = None
    outlet_type: str | None = None
    business_name: str | None = None
    city: str | None = None
    years_in_business: str | None = None
    using_pos: str | None = None
    current_pos: str | None = None
    source_page: str | None = None
    freshsales_contact_id: int | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

def _client_meta(request: Request) -> tuple[str | None, str | None]:
    """Best-effort client IP + User-Agent for CRM attribution fields.

    Behind the Kubernetes ingress the real client IP is in X-Forwarded-For;
    fall back to the socket peer. Returns (ip, user_agent)."""
    xff = request.headers.get("x-forwarded-for")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else None)
    ua = request.headers.get("user-agent")
    return ip, ua


def _trunc(v, n: int = 255):
    if v in (None, ""):
        return None
    return str(v)[:n]


def _derive_lead_source_id(a: dict) -> int | None:
    """Derive Freshsales lead_source_id from UTM params and click IDs (CR-18).

    Priority order matches CR-18 §4. IDs read from env (CR-26).
    """
    LS_PAID_SEARCH  = int(os.environ.get("FRESHSALES_LEAD_SOURCE_PAID_SEARCH", "402001798783") or 0)
    LS_FACEBOOK     = int(os.environ.get("FRESHSALES_LEAD_SOURCE_FACEBOOK_LEAD", "402002468721") or 0)
    LS_SOCIAL       = int(os.environ.get("FRESHSALES_LEAD_SOURCE_SOCIAL_MEDIA", "402001798785") or 0)
    LS_DISPLAY      = int(os.environ.get("FRESHSALES_LEAD_SOURCE_DISPLAY", "402001798786") or 0)
    LS_EMAIL        = int(os.environ.get("FRESHSALES_LEAD_SOURCE_EMAIL", "402001798777") or 0)
    LS_REFERRAL     = int(os.environ.get("FRESHSALES_LEAD_SOURCE_REFERRAL", "402001798781") or 0)
    LS_ORGANIC      = int(os.environ.get("FRESHSALES_LEAD_SOURCE_ORGANIC", "402001798776") or 0)
    LS_WEB          = int(os.environ.get("FRESHSALES_LEAD_SOURCE_WEB", "402001798775") or 0)
    LS_DIRECT       = int(os.environ.get("FRESHSALES_LEAD_SOURCE_DIRECT", "402001798782") or 0)

    gclid = a.get("gclid")
    fbclid = a.get("fbclid")
    src = (a.get("last_utm_source") or a.get("first_utm_source") or "").lower().strip()
    med = (a.get("last_utm_medium") or a.get("first_utm_medium") or "").lower().strip()

    if gclid or med in ("cpc", "ppc", "paid", "paidsearch"):
        return LS_PAID_SEARCH
    if fbclid:
        return LS_FACEBOOK
    if med in ("social", "social-media") or src in ("facebook", "instagram", "meta"):
        return LS_SOCIAL
    if med == "display":
        return LS_DISPLAY
    if med == "email":
        return LS_EMAIL
    if med == "referral":
        return LS_REFERRAL
    if src == "google" and not gclid:
        return LS_ORGANIC
    if src:
        return LS_WEB
    return LS_DIRECT


def _attribution_to_crm(attr: dict | None) -> tuple[dict, dict]:
    """Map the website attribution object -> (Freshsales native fields, cf_ fields).

    Owner-confirmed mapping (2026-06-08, updated CR-18 2026-06-24, CR-25 2026-06-27):
      first_utm_*  -> first_source/medium/campaign   (first touch, set-once)
      last_utm_*   -> latest_source/medium/campaign  (last touch, refreshes)
                   -> last_source/medium/campaign    (CR-18: creation snapshot, set-once)
      gclid        -> latest_source                  (Option B; falls back to last utm_source)
      utm_term     -> cf_pos_satifcation_level + keyword (CR-18)
      utm_content  -> cf_est_name ("AD SET")
      utm_ad       -> cf_contact_person ("Ad Name / Event ID") (CR-25: moved from cf_demo_fixed which was dropdown)
      fbclid       -> cf_latitude ("fbclid")
      _fbp cookie  -> cf_orders_taken_via ("fpb")
      CR-18 new:   -> lead_source_id, country, keyword, medium, locale (all native)
      CR-25 new:   -> cf_self_delivery_take_away (ad_id), cf_inventory_used (adset_id),
                      cf_complete_address (placement), cf_account_software_integrated (utm_id),
                      cf_aggreator_management (site_source_name)
    """
    a = attr or {}
    native: dict = {}

    # ── First-touch (set-once on create) ─────────────────────────────────────
    # CR-39: Default to "website" for direct visitors (no UTM source)
    native["first_source"] = _trunc(a.get("first_utm_source")) or "website"
    if _trunc(a.get("first_utm_medium")):
        native["first_medium"] = _trunc(a.get("first_utm_medium"))
    if _trunc(a.get("first_utm_campaign")):
        native["first_campaign"] = _trunc(a.get("first_utm_campaign"))

    # ── Last-touch refreshing ─────────────────────────────────────────────────
    latest_source = _trunc(a.get("last_utm_source"))
    if latest_source:
        native["latest_source"] = latest_source
    if _trunc(a.get("last_utm_medium")):
        native["latest_medium"] = _trunc(a.get("last_utm_medium"))
    if _trunc(a.get("last_utm_campaign")):
        native["latest_campaign"] = _trunc(a.get("last_utm_campaign"))

    # ── CR-18: Creation-time snapshot fields (set-once — guard in upsert_contact) ──
    if _trunc(a.get("last_utm_source")):
        native["last_source"] = _trunc(a.get("last_utm_source"))
    if _trunc(a.get("last_utm_medium")):
        native["last_medium"] = _trunc(a.get("last_utm_medium"))
    if _trunc(a.get("last_utm_campaign")):
        native["last_campaign"] = _trunc(a.get("last_utm_campaign"))
    native["country"] = os.environ.get("DEFAULT_COUNTRY", "India")
    lsid = _derive_lead_source_id(a)
    if lsid:
        native["lead_source_id"] = lsid

    # ── CR-18: Refreshing native fields ──────────────────────────────────────
    if _trunc(a.get("utm_term")):
        native["keyword"] = _trunc(a.get("utm_term"))
    last_med = _trunc(a.get("last_utm_medium")) or _trunc(a.get("first_utm_medium"))
    if last_med:
        native["medium"] = last_med
    if _trunc(a.get("language")):
        native["locale"] = _trunc(a.get("language"), 20)

    cf: dict = {}
    if _trunc(a.get("utm_term")):
        cf["cf_pos_satifcation_level"] = _trunc(a.get("utm_term"))
    if _trunc(a.get("utm_content")):
        cf["cf_est_name"] = _trunc(a.get("utm_content"))
    if _trunc(a.get("utm_ad")):
        cf["cf_contact_person"] = _trunc(a.get("utm_ad"))
    if _trunc(a.get("fbclid")):
        cf["cf_latitude"] = _trunc(a.get("fbclid"))
    if _trunc(a.get("gclid")):
        cf["cf_pos_type"] = _trunc(a.get("gclid"))  # CR-28: gclid in own field (was polluting latest_source)
    if _trunc(a.get("fbp")):
        cf["cf_orders_taken_via"] = _trunc(a.get("fbp"))
    # CR-25: ad identifiers for attribution stitching
    if _trunc(a.get("ad_id")):
        cf["cf_self_delivery_take_away"] = _trunc(a.get("ad_id"))
    if _trunc(a.get("adset_id")):
        cf["cf_inventory_used"] = _trunc(a.get("adset_id"))
    if _trunc(a.get("placement")):
        cf["cf_complete_address"] = _trunc(a.get("placement"))
    if _trunc(a.get("utm_id")):
        cf["cf_account_software_integrated"] = _trunc(a.get("utm_id"))
    if _trunc(a.get("site_source_name")):
        cf["cf_aggreator_management"] = _trunc(a.get("site_source_name"))
    return native, cf


@api_router.post("/demo-request", response_model=DemoRequest)
async def create_demo_request(payload: DemoRequestCreate, request: Request):
    if antijunk.looks_like_bot(payload.hp, payload.elapsed_ms):
        return JSONResponse(content={"saved": False})
    await antijunk.enforce_rate_limit(db, request, payload.phone)
    obj = DemoRequest(**payload.model_dump())
    # OTP gate (CR-4B): a valid token bound to this phone marks the lead verified;
    # otherwise we STILL save the lead but flag it `OTP-Unverified` (graceful — a
    # missing token or SMS-panel outage must never cost a Demo lead).
    otp_verified = otp.verify_token(payload.otp_token, payload.phone)
    demo_tags = ["Website Demo Lead"] if otp_verified else ["Website Demo Lead", "OTP-Unverified"]
    # Fix CR-21: tag the landing page source so sales can filter by origin in CRM
    if obj.source_page and obj.source_page != "homepage":
        demo_tags.append(obj.source_page.replace("sector:", "src:"))
    # Best-effort CRM sync (never blocks lead capture)
    ip, ua = _client_meta(request)
    geo_data = await geo.lookup_city(ip)
    attr_native, attr_cf = _attribution_to_crm(payload.attribution)
    obj.freshsales_contact_id = await freshsales.upsert_contact(
        name=obj.name,
        email=obj.email,
        phone=obj.phone,
        external_id=f"web_{obj.phone}",
        city=obj.city or geo_data.get("city"),
        state=geo_data.get("region"),
        job_title=obj.business_name,
        tags=demo_tags,
        custom_field={
            "cf_outlet_type": obj.outlet_type,
            "cf_sku": obj.years_in_business,
            "cf_pos_used": obj.using_pos,
            "cf_pos_name": obj.current_pos,
            "cf_longitude": ip,
            "cf_category": ua,
            "cf_rooms": "Yes" if otp_verified else "No",
            **attr_cf,
            **({"cf_contact_person": payload.event_id} if payload.event_id else {}),  # event_id wins over utm_ad when present
        },
        extra_fields=attr_native,
    )
    doc = obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['otp_verified'] = otp_verified
    doc['attribution'] = payload.attribution
    doc['geo'] = geo_data
    await db.demo_requests.insert_one(doc)
    return obj


# ----------------------- OTP (CR-4B, Demo form only) -----------------------
class OtpSendRequest(BaseModel):
    phone: str


class OtpVerifyRequest(BaseModel):
    phone: str
    code: str


@api_router.post("/otp/send")
async def otp_send(payload: OtpSendRequest):
    try:
        result = await otp.send_otp(db, payload.phone)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))
    return result


@api_router.post("/otp/verify")
async def otp_verify(payload: OtpVerifyRequest):
    try:
        token = await otp.verify_otp(db, payload.phone, payload.code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"verified": True, "otp_token": token}


class DemoBookedCreate(BaseModel):
    freshsales_contact_id: int | None = None
    email: str | None = None
    lead_id: str | None = None


@api_router.post("/demo-booked")
async def demo_booked(payload: DemoBookedCreate):
    cid = await freshsales.mark_demo_booked(
        contact_id=payload.freshsales_contact_id, email=payload.email
    )
    query = None
    if payload.lead_id:
        query = {"id": payload.lead_id}
    elif payload.email:
        query = {"email": payload.email}
    if query:
        await db.demo_requests.update_many(
            query,
            {"$set": {
                "status": "demo_booked",
                "demo_booked_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
    return {"ok": True, "freshsales_contact_id": cid}


CALENDLY_WEBHOOK_SIGNING_KEY = os.environ.get("CALENDLY_WEBHOOK_SIGNING_KEY")


def _verify_calendly_signature(body: bytes, signature_header: str | None) -> None:
    """Verify Calendly's HMAC-SHA256 webhook signature. No-op if no key set."""
    if not CALENDLY_WEBHOOK_SIGNING_KEY:
        return
    if not signature_header:
        raise HTTPException(status_code=400, detail="Missing Calendly signature")
    try:
        parts = dict(p.split("=", 1) for p in signature_header.split(","))
        timestamp, provided = parts["t"], parts["v1"]
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Malformed signature") from exc
    signed = f"{timestamp}.{body.decode('utf-8')}"
    digest = hmac.new(
        CALENDLY_WEBHOOK_SIGNING_KEY.encode("utf-8"),
        signed.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(digest, provided):
        raise HTTPException(status_code=401, detail="Invalid Calendly signature")


@api_router.post("/calendly/webhook")
async def calendly_webhook(
    request: Request,
    calendly_webhook_signature: str | None = Header(default=None),
):
    body = await request.body()
    _verify_calendly_signature(body, calendly_webhook_signature)
    try:
        data = json.loads(body.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON") from exc
    if data.get("event") != "invitee.created":
        return {"status": "ignored", "event": data.get("event")}

    payload = data.get("payload", {}) or {}
    invitee = payload.get("invitee") or payload  # v2 puts invitee fields in payload
    email = invitee.get("email")
    tracking = invitee.get("tracking") or {}
    raw_contact = tracking.get("utm_content")
    lead_id = tracking.get("utm_term")
    contact_id = int(raw_contact) if raw_contact and str(raw_contact).isdigit() else None

    # Extract Google Meet link + scheduled time from Calendly event
    scheduled = payload.get("scheduled_event") or {}
    location  = scheduled.get("location") or {}
    join_url  = location.get("join_url") or None
    raw_start = scheduled.get("start_time")   # "2026-01-15T10:00:00.000000Z"
    raw_end   = scheduled.get("end_time")

    # Convert UTC → IST (UTC+5:30), format human-readable for WhatsApp template
    IST = timezone(timedelta(hours=5, minutes=30))
    def _fmt_ist(iso: str | None) -> str | None:
        if not iso:
            return None
        try:
            dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(IST)
            return dt.strftime("%-d %b %Y, %-I:%M %p IST")
        except Exception:
            return iso
    demo_at     = _fmt_ist(raw_start)
    demo_end_at = _fmt_ist(raw_end)

    fcid = await freshsales.mark_demo_booked(
        contact_id=contact_id,
        email=email,
        meet_link=join_url,
        demo_at=demo_at,
    )
    query = {"id": lead_id} if lead_id else ({"email": email} if email else None)
    if query:
        update_fields = {
            "status": "demo_booked",
            "demo_booked_at": datetime.now(timezone.utc).isoformat(),
        }
        if join_url:
            update_fields["meet_link"] = join_url
        if demo_at:
            update_fields["demo_at"] = demo_at
        if demo_end_at:
            update_fields["demo_end_at"] = demo_end_at
        await db.demo_requests.update_many(query, {"$set": update_fields})
    logger.info("Calendly invitee.created processed email=%s contact=%s", email, fcid)
    return {"status": "ok", "freshsales_contact_id": fcid}


@api_router.get("/demo-requests", response_model=List[DemoRequest])
async def get_demo_requests():
    items = await db.demo_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        if isinstance(it.get('created_at'), str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items


class QuoteCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    business_name: str | None = None
    city: str | None = None
    outlet_type: str | None = None
    intent: str = "demo"  # 'buy' | 'demo'
    plan_id: str
    plan_name: str
    billing_cycle: str = "annual"  # annual-only (no monthly plan)
    addon_ids: List[str] = []
    addon_names: List[str] = []
    total_amount: float = 0
    was_recommended: bool = False
    attribution: dict | None = None
    hp: str | None = None
    elapsed_ms: int | None = None


class Quote(QuoteCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.post("/quote", response_model=Quote)
async def create_quote(payload: QuoteCreate, request: Request):
    if antijunk.looks_like_bot(payload.hp, payload.elapsed_ms):
        return JSONResponse(content={"saved": False})
    await antijunk.enforce_rate_limit(db, request, payload.phone)
    obj = Quote(**payload.model_dump())
    doc = obj.model_dump()
    doc.pop('hp', None)
    doc.pop('elapsed_ms', None)
    doc['created_at'] = doc['created_at'].isoformat()
    # Best-effort CRM sync (never blocks lead capture)
    ip, ua = _client_meta(request)
    geo_data = await geo.lookup_city(ip)
    attr_native, attr_cf = _attribution_to_crm(payload.attribution)
    doc['geo'] = geo_data
    doc['freshsales_contact_id'] = await freshsales.upsert_contact(
        name=obj.name,
        email=obj.email,
        phone=obj.phone,
        external_id=f"web_{obj.phone}",
        city=obj.city or geo_data.get("city"),
        state=geo_data.get("region"),
        job_title=obj.business_name,
        tags=["Buy Online" if obj.intent == "buy" else "Website Quote"],
        custom_field={
            "cf_outlet_type": obj.outlet_type,
            "cf_longitude": ip,
            "cf_category": ua,
            **attr_cf,
        },
        extra_fields=attr_native,
    )
    await db.quotes.insert_one(doc)
    return obj


@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes():
    items = await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        if isinstance(it.get('created_at'), str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items


class ContactMessageCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    message: str
    preferred_contact: str = "whatsapp"  # 'whatsapp' | 'phone' | 'email'
    source_page: str | None = None
    attribution: dict | None = None
    hp: str | None = None
    elapsed_ms: int | None = None


class ContactMessage(ContactMessageCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    freshsales_contact_id: int | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(payload: ContactMessageCreate, request: Request):
    if antijunk.looks_like_bot(payload.hp, payload.elapsed_ms):
        return ContactMessage(**payload.model_dump())
    await antijunk.enforce_rate_limit(db, request, payload.phone)
    obj = ContactMessage(**payload.model_dump())
    # Best-effort CRM sync (never blocks the message capture)
    ip, ua = _client_meta(request)
    geo_data = await geo.lookup_city(ip)
    attr_native, attr_cf = _attribution_to_crm(payload.attribution)
    obj.freshsales_contact_id = await freshsales.upsert_contact(
        name=obj.name,
        email=obj.email,
        phone=obj.phone,
        external_id=f"web_{obj.phone}",
        city=geo_data.get("city"),
        state=geo_data.get("region"),
        tags=["Website Contact"],
        custom_field={
            "cf_first_interest": obj.message,
            "cf_longitude": ip,
            "cf_category": ua,
            **attr_cf,
        },
        extra_fields=attr_native,
    )
    doc = obj.model_dump()
    doc.pop('hp', None)
    doc.pop('elapsed_ms', None)
    doc['created_at'] = doc['created_at'].isoformat()
    doc['geo'] = geo_data
    await db.contact_messages.insert_one(doc)
    return obj


@api_router.get("/contact-messages", response_model=List[ContactMessage])
async def get_contact_messages():
    items = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        if isinstance(it.get('created_at'), str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items


# ----------------------- CMS (Content Management) -----------------------
CMS_ALLOWED_EXT = {"png", "jpg", "jpeg", "webp", "gif", "svg", "mp4", "webm", "mov"}
CMS_MAX_BYTES = 50 * 1024 * 1024


class CmsLogin(BaseModel):
    username: str
    password: str


class CmsField(BaseModel):
    key: str
    type: str = "text"
    value: str | None = None


@api_router.post("/cms/login")
async def cms_login(payload: CmsLogin):
    user = cms_auth.authenticate(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": cms_auth.create_token(user), "user": user}


@api_router.get("/cms/me")
async def cms_me(admin: str = Depends(cms_auth.get_current_admin)):
    return {"user": admin}


@api_router.get("/cms/content")
async def cms_content_public():
    docs = await db.cms_content.find({}, {"_id": 0}).to_list(5000)
    return {d["key"]: d.get("published_value") for d in docs if d.get("published_value") is not None}


@api_router.get("/cms/content/draft")
async def cms_content_draft(admin: str = Depends(cms_auth.get_current_admin)):
    docs = await db.cms_content.find({}, {"_id": 0}).to_list(5000)
    out, has_draft = {}, False
    for d in docs:
        dv, pv = d.get("draft_value"), d.get("published_value")
        out[d["key"]] = dv if dv is not None else pv
        if dv is not None and dv != pv:
            has_draft = True
    return {"content": out, "has_draft": has_draft}


@api_router.put("/cms/content")
async def cms_put(field: CmsField, admin: str = Depends(cms_auth.get_current_admin)):
    await db.cms_content.update_one(
        {"key": field.key},
        {"$set": {"key": field.key, "type": field.type, "draft_value": field.value,
                  "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": admin}},
        upsert=True,
    )
    return {"ok": True}


@api_router.post("/cms/publish")
async def cms_publish(admin: str = Depends(cms_auth.get_current_admin)):
    docs = await db.cms_content.find({}).to_list(5000)
    count = 0
    for d in docs:
        dv = d.get("draft_value")
        if dv is not None and dv != d.get("published_value"):
            await db.cms_content.update_one({"_id": d["_id"]}, {"$set": {"published_value": dv}})
            count += 1
    if count:
        await db.cms_meta.update_one(
            {"_id": "publish"},
            {"$set": {
                "last_published_by": admin,
                "last_published_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
    return {"published": count}


@api_router.get("/cms/meta")
async def cms_meta(admin: str = Depends(cms_auth.get_current_admin)):
    doc = await db.cms_meta.find_one({"_id": "publish"}, {"_id": 0})
    return doc or {}


@api_router.post("/cms/discard")
async def cms_discard(admin: str = Depends(cms_auth.get_current_admin)):
    docs = await db.cms_content.find({}).to_list(5000)
    for d in docs:
        await db.cms_content.update_one({"_id": d["_id"]}, {"$set": {"draft_value": d.get("published_value")}})
    return {"ok": True}


@api_router.post("/cms/media/presign")
async def cms_media_presign(body: dict, admin: str = Depends(cms_auth.get_current_admin)):
    """Return a presigned S3 PUT URL so the browser can upload directly to S3 (bypasses nginx)."""
    ext = (body.get("ext") or "").lower()
    if ext not in CMS_ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    backend = os.environ.get("STORAGE_BACKEND", "local").lower()
    if backend != "s3":
        return {"presign_url": None}  # frontend falls back to multipart POST
    storage = cms_storage.get_storage()
    name = f"{uuid.uuid4().hex}.{ext}"
    ct = cms_storage.MIME.get(ext, "application/octet-stream")
    presign_url = storage.client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": storage.bucket,
            "Key": name,
            "ContentType": ct,
            "CacheControl": "public, max-age=31536000, immutable",
        },
        ExpiresIn=900,  # 15 minutes
    )
    return {"presign_url": presign_url, "name": name, "url": f"{cms_storage.PUBLIC_PREFIX}/{name}"}


@api_router.post("/cms/media/confirm")
async def cms_media_confirm(body: dict, admin: str = Depends(cms_auth.get_current_admin)):
    """Save the MongoDB record after the browser has completed a direct S3 upload."""
    name = body.get("name", "")
    filename = body.get("filename", name)
    size = body.get("size", 0)
    if not name:
        raise HTTPException(status_code=400, detail="name required")
    url = f"{cms_storage.PUBLIC_PREFIX}/{name}"
    await db.cms_media.insert_one({
        "id": str(uuid.uuid4()), "url": url, "filename": filename,
        "size": size, "uploaded_by": admin,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": url}


@api_router.post("/cms/media")
async def cms_media_upload(file: UploadFile = File(...), admin: str = Depends(cms_auth.get_current_admin)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "").lower()
    if ext not in CMS_ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    backend = os.environ.get("STORAGE_BACKEND", "local").lower()
    if backend == "s3":
        storage = cms_storage.get_storage()
        name = f"{uuid.uuid4().hex}.{ext}"
        ct = cms_storage.MIME.get(ext, "application/octet-stream")
        storage.client.upload_fileobj(
            file.file,
            storage.bucket,
            name,
            ExtraArgs={"ContentType": ct, "CacheControl": "public, max-age=31536000, immutable"},
        )
        url = f"{cms_storage.PUBLIC_PREFIX}/{name}"
        size = 0
    else:
        data = await file.read()
        if len(data) > CMS_MAX_BYTES:
            raise HTTPException(status_code=400, detail="File too large (max 50MB)")
        url = cms_storage.get_storage().save(data, ext)
        size = len(data)

    await db.cms_media.insert_one({"id": str(uuid.uuid4()), "url": url, "filename": file.filename,
                                   "size": size, "uploaded_by": admin,
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": url}


@api_router.get("/cms/media/{name}")
async def cms_media_serve(name: str):
    backend = os.environ.get("STORAGE_BACKEND", "local").lower()
    if backend == "s3":
        from fastapi.responses import RedirectResponse
        url = cms_storage.get_storage().public_url(name)
        return RedirectResponse(url=url, status_code=302)
    try:
        data, ct = cms_storage.get_storage().read_with_type(name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=data, media_type=ct)


# ----------------------- CR-7: Internal Leads View (read-only) -----------------------
@api_router.get("/cms/leads")
async def cms_leads(
    admin: str = Depends(cms_auth.get_current_admin),
    type: str | None = None,
    verified: bool | None = None,
    paid: bool | None = None,
    city: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 25,
    stage: str | None = None,
):
    page_size = max(1, min(page_size, 1000))
    return await leads_view.query_leads(
        db, type=type, verified=verified, paid=paid, city=city,
        date_from=date_from, date_to=date_to, q=q, page=page, page_size=page_size,
        stage=stage,
    )


# ── CR-19 Funnel endpoints ─────────────────────────────────────────────────

@api_router.get("/cms/funnel/by-attribution")
async def cms_funnel_by_attribution(
    admin: str = Depends(cms_auth.get_current_admin),
    dimension: str = "keyword",
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_by_attribution(
        db, dimension=dimension, date_from=date_from,
        date_to=date_to, source=source,
    )


@api_router.get("/cms/funnel/summary")
async def cms_funnel_summary(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    type: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_summary(
        db, date_from=date_from, date_to=date_to, lead_type=type, source=source
    )


@api_router.get("/cms/funnel/by-source")
async def cms_funnel_by_source(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    type: str | None = None,
):
    return await funnel_module.get_funnel_by_source(
        db, date_from=date_from, date_to=date_to, lead_type=type
    )


@api_router.get("/cms/funnel/lost")
async def cms_funnel_lost(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_lost_breakdown(db, date_from=date_from, date_to=date_to)


# ── CR-24 Phase 1: New funnel + ads endpoints ─────────────────────────────

@api_router.get("/cms/funnel/by-landing-page")
async def cms_funnel_by_landing_page(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_by_landing_page(
        db, date_from=date_from, date_to=date_to, source=source
    )


@api_router.get("/cms/funnel/by-device")
async def cms_funnel_by_device(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_by_device(
        db, date_from=date_from, date_to=date_to, source=source
    )


@api_router.get("/cms/funnel/by-city")
async def cms_funnel_by_city(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
    top_n: int = 20,
):
    return await funnel_module.get_funnel_by_city(
        db, date_from=date_from, date_to=date_to, source=source, top_n=top_n
    )


@api_router.get("/cms/ads/executive-summary")
async def cms_ads_executive_summary(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    status: str | None = None,
):
    return await funnel_module.get_executive_summary(db, date_from=date_from, date_to=date_to, status=status)


@api_router.get("/cms/ads/recommendations")
async def cms_ads_recommendations(
    admin: str = Depends(cms_auth.get_current_admin),
    use_llm: bool = False,
):
    import recommendations as recommendations_module
    return await recommendations_module.get_recommendations(db, use_llm=use_llm)


@api_router.get("/cms/ads/mcp/status")
async def cms_ads_mcp_status(admin: str = Depends(cms_auth.get_current_admin)):
    import ads_mcp as ads_mcp_module
    status = ads_mcp_module.get_status()
    # Enrich Google status with OAuth connection from DB
    google_token_doc = await db.google_ads_tokens.find_one({"user_id": "admin", "active": True})
    status["google"]["oauth_connected"] = bool(google_token_doc and google_token_doc.get("refresh_token"))
    status["google"]["enabled"] = status["google"]["oauth_connected"] and bool(status["google"].get("customer_id") or os.environ.get("GOOGLE_ADS_CUSTOMER_ID"))
    return status


@api_router.post("/cms/ads/mcp/meta/sync")
async def cms_ads_mcp_meta_sync(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    import ads_mcp as ads_mcp_module
    return await ads_mcp_module.sync_meta(db, date_from=date_from, date_to=date_to)


@api_router.post("/cms/ads/mcp/meta/refresh-token")
async def cms_ads_mcp_meta_refresh_token(admin: str = Depends(cms_auth.get_current_admin)):
    """Exchange the current short-lived token for a 60-day long-lived token."""
    import ads_mcp as ads_mcp_module
    current_token = os.environ.get("META_ACCESS_TOKEN", "")
    if not current_token:
        return {"success": False, "message": "No META_ACCESS_TOKEN configured"}
    new_token = await ads_mcp_module._exchange_long_lived_token(current_token)
    if new_token != current_token:
        os.environ["META_ACCESS_TOKEN"] = new_token
        return {
            "success": True,
            "message": "Token extended to 60 days. Update META_ACCESS_TOKEN in backend/.env with this new token.",
            "new_token": new_token,
        }
    return {"success": False, "message": "Could not exchange token. Check META_APP_ID and META_APP_SECRET in .env"}


@api_router.post("/cms/ads/mcp/google/sync")
async def cms_ads_mcp_google_sync(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    import ads_mcp as ads_mcp_module
    return await ads_mcp_module.sync_google(db, date_from=date_from, date_to=date_to)


@api_router.get("/cms/ads/adset-performance")
async def cms_ads_adset_performance(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    status: str | None = None,
):
    return await funnel_module.get_adset_performance(db, date_from=date_from, date_to=date_to, status=status)


@api_router.get("/cms/ads/ad-performance")
async def cms_ads_ad_performance(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_ad_performance(db, date_from=date_from, date_to=date_to)


@api_router.get("/cms/ads/placement-breakdown")
async def cms_ads_placement_breakdown(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    status: str | None = None,
):
    return await funnel_module.get_placement_breakdown(db, date_from=date_from, date_to=date_to, status=status)


@api_router.get("/cms/leads/quality-summary")
async def cms_leads_quality_summary(admin: str = Depends(cms_auth.get_current_admin)):
    return await funnel_module.get_lead_quality_breakdown(db)


@api_router.post("/cms/ads/ai-insights")
async def cms_ads_ai_insights(admin: str = Depends(cms_auth.get_current_admin)):
    import recommendations as recs_module
    return await recs_module.generate_ai_insights(db)


@api_router.post("/cms/ads/strategy-brainstorm")
async def cms_ads_strategy_brainstorm(admin: str = Depends(cms_auth.get_current_admin)):
    """GAP-21: Strategy Lab — generate 4–5 testable strategic hypotheses using Claude Sonnet.
    Read-only: no DB writes. User-triggered only (not auto-run on page load)."""
    import recommendations as recs_module
    return await recs_module._strategy_lab_hypotheses(db)


# ── CR-27 Phase G: Attribution Stitching endpoints ───────────────────────────

@api_router.get("/cms/ads/attribution-by-campaign")
async def cms_ads_attribution_by_campaign(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_attribution_by_campaign(db, date_from=date_from, date_to=date_to)


@api_router.get("/cms/ads/attribution-by-adset")
async def cms_ads_attribution_by_adset(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_attribution_by_adset(db, date_from=date_from, date_to=date_to)


@api_router.get("/cms/ads/attribution-by-ad")
async def cms_ads_attribution_by_ad(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_attribution_by_ad(db, date_from=date_from, date_to=date_to)


@api_router.get("/cms/ads/cross-channel-summary")
async def cms_ads_cross_channel_summary(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_cross_channel_summary(db, date_from=date_from, date_to=date_to)


# ─── Phase F: Google Ads OAuth 2.0 Flow ──────────────────────────────────────

_GOOGLE_SCOPES = ["https://www.googleapis.com/auth/adwords"]
_GOOGLE_AUTH_URI = "https://accounts.google.com/o/oauth2/auth"
_GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"


def _build_google_oauth_flow(redirect_uri: str):
    """Build a google-auth-oauthlib Flow for web-app OAuth."""
    from google_auth_oauthlib.flow import Flow
    client_config = {
        "web": {
            "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
            "auth_uri": _GOOGLE_AUTH_URI,
            "token_uri": _GOOGLE_TOKEN_URI,
        }
    }
    return Flow.from_client_config(client_config, scopes=_GOOGLE_SCOPES, redirect_uri=redirect_uri)


@api_router.get("/cms/google-ads/auth-url")
async def google_ads_auth_url(request: Request, admin: str = Depends(cms_auth.get_current_admin)):
    """Return the Google OAuth consent URL so the frontend can redirect the browser."""
    import secrets as _secrets
    redirect_uri = f"{os.environ.get('REACT_APP_BACKEND_URL', str(request.base_url).rstrip('/'))}/api/cms/google-ads/oauth-callback"
    flow = _build_google_oauth_flow(redirect_uri)
    state = _secrets.token_urlsafe(32)
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    # Save state + code_verifier (for PKCE) to DB
    await db.google_ads_oauth_states.insert_one({
        "_id": state,
        "redirect_uri": redirect_uri,
        "code_verifier": flow.code_verifier,  # may be None if PKCE disabled
        "created_at": datetime.now(timezone.utc),
    })
    return {"auth_url": auth_url}


@api_router.get("/cms/google-ads/oauth-callback")
async def google_ads_oauth_callback(request: Request):
    """Google redirects here after the user grants consent. Exchanges code → refresh_token and saves to DB."""
    from fastapi.responses import RedirectResponse as _Redirect
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    error = request.query_params.get("error")

    # Determine frontend origin for redirect
    frontend_origin = os.environ.get("REACT_APP_BACKEND_URL", str(request.base_url).rstrip("/"))
    # frontend is served from the same origin (React on same domain via proxy)

    if error:
        return _Redirect(f"{frontend_origin}/?google_ads_error={error}")

    if not code or not state:
        return _Redirect(f"{frontend_origin}/?google_ads_error=missing_params")

    state_doc = await db.google_ads_oauth_states.find_one({"_id": state})
    if not state_doc:
        return _Redirect(f"{frontend_origin}/?google_ads_error=invalid_state")

    redirect_uri = state_doc["redirect_uri"]
    try:
        flow = _build_google_oauth_flow(redirect_uri)
        # Restore PKCE code_verifier if it was used when generating the auth URL
        if state_doc.get("code_verifier"):
            flow.code_verifier = state_doc["code_verifier"]
        flow.fetch_token(code=code)
        credentials = flow.credentials
        refresh_token = credentials.refresh_token
        if not refresh_token:
            return _Redirect(f"{frontend_origin}/?google_ads_error=no_refresh_token")

        # Upsert token into DB (single-admin app, use fixed user_id)
        await db.google_ads_tokens.update_one(
            {"user_id": "admin"},
            {"$set": {
                "user_id": "admin",
                "refresh_token": refresh_token,
                "customer_id": os.environ.get("GOOGLE_ADS_CUSTOMER_ID", ""),
                "scopes": " ".join(credentials.scopes or []),
                "updated_at": datetime.now(timezone.utc),
                "active": True,
            }, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
        await db.google_ads_oauth_states.delete_one({"_id": state})
        return _Redirect(f"{frontend_origin}/?google_ads=connected")
    except Exception as exc:
        logger.error("Google Ads OAuth callback error: %s", exc)
        return _Redirect(f"{frontend_origin}/?google_ads_error=callback_failed")


@api_router.get("/cms/google-ads/status")
async def google_ads_status(admin: str = Depends(cms_auth.get_current_admin)):
    """Returns whether a Google Ads refresh token is stored and active."""
    doc = await db.google_ads_tokens.find_one({"user_id": "admin", "active": True})
    if doc:
        return {
            "connected": True,
            "customer_id": doc.get("customer_id"),
            "connected_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else None,
        }
    return {"connected": False}


@api_router.get("/cms/sync/status")
async def cms_sync_status(admin: str = Depends(cms_auth.get_current_admin)):
    return await funnel_module.get_sync_status(db)


@api_router.post("/cms/sync/trigger")
async def cms_sync_trigger(admin: str = Depends(cms_auth.get_current_admin)):
    import asyncio as _asyncio
    async def _full_sync():
        await crm_sync.run_sync(db)
        await crm_sync.run_source_sync(db)
    _asyncio.ensure_future(_full_sync())
    return {"ok": True, "message": "Stage sync + source sync started in background"}


@api_router.post("/cms/sync/backfill")
async def cms_sync_backfill(admin: str = Depends(cms_auth.get_current_admin)):
    import asyncio as _asyncio
    _asyncio.ensure_future(crm_sync.run_sync(db))
    return {"ok": True, "message": "Backfill started in background"}


@api_router.post("/cms/sync/source-backfill")
async def cms_sync_source_backfill(admin: str = Depends(cms_auth.get_current_admin)):
    """Trigger one-time Google/Facebook paid source backfill (Jul 2025–Jun 2026)."""
    import asyncio as _asyncio
    _asyncio.ensure_future(crm_sync.run_source_backfill(db))
    return {"ok": True, "message": "Source backfill started in background (~5 mins)"}


@api_router.post("/cms/sync/otp-backfill")
async def cms_sync_otp_backfill(admin: str = Depends(cms_auth.get_current_admin)):
    """Mark backfilled paid contacts as otp_verified using Freshsales cf_rooms field."""
    result = await crm_sync.run_otp_backfill(db)
    return {"ok": True, **result}


@api_router.post("/cms/sync/source-sync")
async def cms_sync_source_sync(admin: str = Depends(cms_auth.get_current_admin)):
    """CR-26: Pull all contacts where first_source is not null. Fills attribution gaps."""
    import asyncio as _asyncio
    _asyncio.ensure_future(crm_sync.run_source_sync(db))
    return {"ok": True, "message": "Source sync started in background"}


# ── CR-26: Lead Delete (MongoDB only) ────────────────────────────────────────

_DELETE_COLLECTION_MAP = {
    "demo": "demo_requests",
    "quote": "quotes",
    "contact": "contact_messages",
    "backfilled": "backfilled_leads",
}


@api_router.delete("/cms/leads/{lead_type}/{lead_id}")
async def cms_delete_lead(
    lead_type: str,
    lead_id: str,
    admin: str = Depends(cms_auth.get_current_admin),
):
    """Delete a lead from MongoDB only. Does NOT delete from Freshsales."""
    col_name = _DELETE_COLLECTION_MAP.get(lead_type)
    if not col_name:
        raise HTTPException(status_code=400, detail=f"Unknown lead type: {lead_type}")

    col = db[col_name]
    if lead_type == "backfilled":
        try:
            result = await col.delete_one({"freshsales_contact_id": int(lead_id)})
        except (ValueError, TypeError):
            result = await col.delete_one({"freshsales_contact_id": lead_id})
    else:
        result = await col.delete_one({"id": lead_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True, "deleted": result.deleted_count}


# ── CR-19 Phase 3: Ad Spend Upload ───────────────────────────────────────────

@api_router.post("/cms/ad-spend/upload")
async def ad_spend_upload(
    file: UploadFile = File(...),
    period_start: str = Form(""),
    period_end: str = Form(""),
    admin: str = Depends(cms_auth.get_current_admin),
):
    """Parse and store a Google Ads or Meta Ads Manager CSV cost report."""
    content = await file.read()
    try:
        result = ad_spend_module.parse_csv(content, period_start=period_start, period_end=period_end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    upload_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    docs = [
        {
            "upload_id":    upload_id,
            "source":       result.source,
            "period_start": result.period_start,
            "period_end":   result.period_end,
            "campaign":     r.campaign,
            "ad_set":       r.ad_set,
            "keyword":      r.keyword,
            "search_term":  r.search_term,
            "match_type":   r.match_type,
            "headline":     r.headline,
            "placement":    r.placement,
            "age_range":    r.age_range,
            "gender":       r.gender,
            "reach":        r.reach,
            "frequency":    r.frequency,
            "ad_name":      r.ad_name,
            "spend":        r.spend,
            "impressions":  r.impressions,
            "clicks":       r.clicks,
            "meta_results": r.meta_results,
            "currency":     r.currency,
            "uploaded_by":  admin,
            "uploaded_at":  now,
        }
        for r in result.rows
    ]
    if docs:
        await db.ad_spend.insert_many(docs)

    await db.ad_spend_uploads.insert_one({
        "upload_id":    upload_id,
        "source":       result.source,
        "period_start": result.period_start,
        "period_end":   result.period_end,
        "total_spend":  result.total_spend,
        "row_count":    result.row_count,
        "filename":     file.filename or "",
        "uploaded_by":  admin,
        "uploaded_at":  now,
    })

    preview = [
        {"campaign": r.campaign, "ad_set": r.ad_set, "keyword": r.keyword, "spend": r.spend}
        for r in result.rows[:5]
    ]
    return {
        "upload_id":    upload_id,
        "source":       result.source,
        "period_start": result.period_start,
        "period_end":   result.period_end,
        "total_spend":  result.total_spend,
        "row_count":    result.row_count,
        "preview":      preview,
    }


@api_router.get("/cms/ad-spend/history")
async def ad_spend_history(admin: str = Depends(cms_auth.get_current_admin)):
    """Return last 20 ad spend uploads."""
    docs = await db.ad_spend_uploads.find(
        {}, {"_id": 0}, sort=[("uploaded_at", -1)]
    ).to_list(20)
    return docs


@api_router.delete("/cms/ad-spend/{upload_id}")
async def ad_spend_delete(upload_id: str, admin: str = Depends(cms_auth.get_current_admin)):
    """Delete all rows and the upload record for a given upload_id."""
    r1 = await db.ad_spend.delete_many({"upload_id": upload_id})
    r2 = await db.ad_spend_uploads.delete_one({"upload_id": upload_id})
    if r2.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Upload not found")
    return {"deleted_rows": r1.deleted_count}


# ── CR-19 Phase 2: Freshsales Journey Webhook ────────────────────────────────

_VALID_STAGES = {"demo_scheduled", "demo_given", "won", "lost"}

class FreshsalesStageEvent(BaseModel):
    contact_id: str | int | None = None
    email: str | None = None
    phone: str | None = None
    stage: str | None = None
    updated_at: str | None = None

@api_router.post("/webhooks/freshsales/stage")
async def freshsales_stage_webhook(payload: FreshsalesStageEvent):
    """Receives contact stage-change events from Freshsales Journeys (Simple payload).
    Always returns 200 so Freshsales does not retry on validation errors."""
    stage = (payload.stage or "").strip().lower()
    logger.info("Freshsales webhook: contact=%s stage=%s", payload.contact_id, stage)

    if stage not in _VALID_STAGES:
        logger.warning("Freshsales webhook: unknown stage=%r — ignoring", stage)
        return {"ok": True}

    try:
        contact_id = int(payload.contact_id) if payload.contact_id else None
    except (ValueError, TypeError):
        contact_id = None

    now = datetime.now(timezone.utc)

    # 1. Persist the event log (source of truth for cumulative funnel counts)
    await db.crm_stage_events.insert_one({
        "contact_id": contact_id,
        "email": payload.email,
        "phone": payload.phone,
        "stage": stage,
        "event_at": payload.updated_at or now.isoformat(),
        "received_at": now.isoformat(),
    })

    # 2. Update crm_status on any matching lead documents
    if contact_id:
        update = {"$set": {
            "crm_status": stage,
            "crm_status_updated_at": now.isoformat(),
        }}
        for col in (db.demo_requests, db.quotes, db.contact_messages, db.backfilled_leads):
            await col.update_many({"freshsales_contact_id": contact_id}, update)

    return {"ok": True}


# Include the router in the main app
app.include_router(api_router)
app.include_router(payments_module.make_payments_router(db), prefix="/api")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def ensure_indexes():
    await antijunk.ensure_indexes(db)
    await otp.ensure_indexes(db)
    await db.cms_content.create_index("key", unique=True)
    # CR-19: funnel indexes
    for col in (db.demo_requests, db.quotes, db.contact_messages):
        await col.create_index("freshsales_contact_id")
        await col.create_index("crm_status")
    try:
        await db.backfilled_leads.create_index("freshsales_contact_id", unique=True)
    except Exception:
        pass  # already exists
    await db.backfilled_leads.create_index("crm_status")
    await db.crm_sync_log.create_index("started_at", expireAfterSeconds=2592000)
    # CR-19 Phase 2: webhook stage events index
    await db.crm_stage_events.create_index("contact_id")
    await db.crm_stage_events.create_index("stage")
    await db.crm_stage_events.create_index([("contact_id", 1), ("stage", 1)])
    # CR-19: start 6-hour CRM sync scheduler
    async def _sync_job():
        await crm_sync.run_sync(db)
        await crm_sync.run_source_sync(db, after_date=crm_sync.SOURCE_SYNC_SCHEDULED_AFTER_DATE)

    _scheduler.add_job(
        _sync_job,
        "interval",
        hours=6,
        id="crm_sync",
        next_run_time=datetime.now(timezone.utc),
    )
    _scheduler.start()


@app.on_event("shutdown")
async def shutdown_db_client():
    _scheduler.shutdown(wait=False)
    client.close()