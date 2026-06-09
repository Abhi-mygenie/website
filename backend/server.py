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
from fastapi import Request, Header, HTTPException, Depends, UploadFile, File, Response

import cms_auth
import storage as cms_storage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import freshsales
import antijunk
import otp
import geo
import leads as leads_view

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


def _attribution_to_crm(attr: dict | None) -> tuple[dict, dict]:
    """Map the website attribution object -> (Freshsales native fields, cf_ fields).

    Owner-confirmed mapping (2026-06-08):
      first_utm_*  -> first_source/medium/campaign   (first touch, set-once)
      last_utm_*   -> latest_medium/latest_campaign  (last touch)
      gclid        -> latest_source                  (Option B; falls back to last utm_source)
      utm_term     -> cf_pos_satifcation_level ("Keywords (term)")
      utm_content  -> cf_est_name ("AD SET")
      fbclid       -> cf_latitude ("fbclid")
      _fbp cookie  -> cf_orders_taken_via ("fpb")
    Everything else is stored in Mongo only (no CRM field yet).
    """
    a = attr or {}
    native: dict = {}
    if _trunc(a.get("first_utm_source")):
        native["first_source"] = _trunc(a.get("first_utm_source"))
    if _trunc(a.get("first_utm_medium")):
        native["first_medium"] = _trunc(a.get("first_utm_medium"))
    if _trunc(a.get("first_utm_campaign")):
        native["first_campaign"] = _trunc(a.get("first_utm_campaign"))
    latest_source = _trunc(a.get("gclid")) or _trunc(a.get("last_utm_source"))
    if latest_source:
        native["latest_source"] = latest_source
    if _trunc(a.get("last_utm_medium")):
        native["latest_medium"] = _trunc(a.get("last_utm_medium"))
    if _trunc(a.get("last_utm_campaign")):
        native["latest_campaign"] = _trunc(a.get("last_utm_campaign"))

    cf: dict = {}
    if _trunc(a.get("utm_term")):
        cf["cf_pos_satifcation_level"] = _trunc(a.get("utm_term"))
    if _trunc(a.get("utm_content")):
        cf["cf_est_name"] = _trunc(a.get("utm_content"))
    if _trunc(a.get("fbclid")):
        cf["cf_latitude"] = _trunc(a.get("fbclid"))
    if _trunc(a.get("fbp")):
        cf["cf_orders_taken_via"] = _trunc(a.get("fbp"))
    return native, cf


@api_router.post("/demo-request", response_model=DemoRequest)
async def create_demo_request(payload: DemoRequestCreate, request: Request):
    if antijunk.looks_like_bot(payload.hp, payload.elapsed_ms):
        return DemoRequest(**payload.model_dump())
    await antijunk.enforce_rate_limit(db, request, payload.phone)
    obj = DemoRequest(**payload.model_dump())
    # OTP gate (CR-4B): a valid token bound to this phone marks the lead verified;
    # otherwise we STILL save the lead but flag it `OTP-Unverified` (graceful — a
    # missing token or SMS-panel outage must never cost a Demo lead).
    otp_verified = otp.verify_token(payload.otp_token, payload.phone)
    demo_tags = ["Website Demo Lead"] if otp_verified else ["Website Demo Lead", "OTP-Unverified"]
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

    fcid = await freshsales.mark_demo_booked(contact_id=contact_id, email=email)
    query = {"id": lead_id} if lead_id else ({"email": email} if email else None)
    if query:
        await db.demo_requests.update_many(
            query,
            {"$set": {
                "status": "demo_booked",
                "demo_booked_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
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
    billing_cycle: str = "monthly"  # 'monthly' | 'annual'
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
        return Quote(**payload.model_dump())
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


@api_router.post("/cms/media")
async def cms_media_upload(file: UploadFile = File(...), admin: str = Depends(cms_auth.get_current_admin)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "").lower()
    if ext not in CMS_ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    data = await file.read()
    if len(data) > CMS_MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    url = cms_storage.get_storage().save(data, ext)
    await db.cms_media.insert_one({"id": str(uuid.uuid4()), "url": url, "filename": file.filename,
                                   "size": len(data), "uploaded_by": admin,
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": url}


@api_router.get("/cms/media/{name}")
async def cms_media_serve(name: str):
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
):
    page_size = max(1, min(page_size, 1000))
    return await leads_view.query_leads(
        db, type=type, verified=verified, paid=paid, city=city,
        date_from=date_from, date_to=date_to, q=q, page=page, page_size=page_size,
    )


# Include the router in the main app
app.include_router(api_router)
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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()