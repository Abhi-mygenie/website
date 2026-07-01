"""CR-4B — Phone OTP verification for the Demo form (graceful, never-block).

Flow:
  POST /api/otp/send   -> generate 4-digit OTP, store hashed in Mongo (`otp_codes`),
                          send via the owner's SMS panel (gated by OTP_SMS_ENABLED;
                          when OFF we just log the code for testing).
  POST /api/otp/verify -> check code -> issue a short-lived signed token bound to phone.
  /api/demo-request    -> accepts an optional `otp_token`. Valid => verified lead;
                          missing/invalid => lead is STILL saved, tagged `OTP-Unverified`.

Design notes:
  - No Redis in this stack -> rate windows are tracked in Mongo. Docs carry a 1-hour
    TTL (for send/hour counting); the 10-minute OTP validity is enforced in code via
    `valid_until` (independent of the TTL sweep).
  - Phone normalisation reuses antijunk._norm_phone (last 10 digits) so OTP + anti-junk
    cooldowns line up.
  - SMS failures are ALWAYS soft: a panel outage must never cost a Demo lead.
"""
import os
import hmac
import hashlib
import logging
import secrets
from datetime import datetime, timezone, timedelta

import httpx
import jwt

import antijunk

logger = logging.getLogger(__name__)

# --- Policy (owner-locked, see CR-4B spec) ---
OTP_LENGTH = 4
OTP_TTL_SECONDS = 600          # OTP valid for 10 minutes
RESEND_COOLDOWN = 30           # seconds between sends for the same phone
MAX_SENDS_PER_HOUR = 5         # per phone
MAX_VERIFY_ATTEMPTS = 5        # per OTP doc, then locked (resend required)
DOC_TTL_SECONDS = 3600         # keep docs ~1h so send/hour windows work
TOKEN_TTL_MINUTES = 15         # verification token lifetime
TOKEN_TYPE = "otp"

# --- SMS panel contract (env-driven, see backend/.env) ---
SMS_BASE_URL = os.environ.get("SMS_BASE_URL")
SMS_USERNAME = os.environ.get("SMS_USERNAME")
SMS_API_KEY = os.environ.get("SMS_API_KEY")
SMS_SENDER = os.environ.get("SMS_SENDER", "HSEGNI")
SMS_ROUTE = os.environ.get("SMS_ROUTE", "TRANS")
SMS_TEMPLATE_ID = os.environ.get("SMS_TEMPLATE_ID")
OTP_SMS_ENABLED = os.environ.get("OTP_SMS_ENABLED", "false").lower() in ("1", "true", "yes")

# DLT-approved template (Option A: OTP in slot 1, "10" minutes in slot 2 — positional).
MESSAGE_TEMPLATE = (
    "Your One-Time Password (OTP) for verification is: {otp}. Mygenie "
    "This OTP is valid for {mins} minutes. Please do not share this OTP "
    "with anyone for security reasons. TEAM HOSIGENIE"
)


def _secret() -> str:
    return os.environ.get("CMS_JWT_SECRET", "change-me-in-env")


def _hash_code(phone: str, code: str) -> str:
    """Peppered HMAC-SHA256 of the OTP (never store the plaintext code)."""
    msg = f"{phone}:{code}".encode("utf-8")
    return hmac.new(_secret().encode("utf-8"), msg, hashlib.sha256).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


def _aware(dt):
    """Mongo returns naive UTC datetimes — normalise to tz-aware for comparison."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def ensure_indexes(db) -> None:
    try:
        await db.otp_codes.create_index("created_at", expireAfterSeconds=DOC_TTL_SECONDS)
        await db.otp_codes.create_index([("phone", 1), ("created_at", -1)])
    except Exception as e:  # noqa: BLE001 - indexing must never break startup
        logger.warning("otp.ensure_indexes error: %s", e)


def _render_message(code: str) -> str:
    return MESSAGE_TEMPLATE.format(otp=code, mins=OTP_TTL_SECONDS // 60)


async def _send_sms(phone: str, code: str) -> str:
    """Send the OTP via the owner's HTTP SMS panel. Returns a status string.

    Gated by OTP_SMS_ENABLED — when OFF we log the code and return 'mocked'
    so the flow is fully testable without live SMS. Self-signed IP cert => verify=False.
    """
    if not OTP_SMS_ENABLED:
        logger.info("[OTP mock] code for %s = %s (OTP_SMS_ENABLED is off)", phone, code)
        return "mocked"
    if not (SMS_BASE_URL and SMS_API_KEY and SMS_TEMPLATE_ID):
        logger.warning("OTP SMS enabled but SMS_* env incomplete; treating as mocked")
        return "misconfigured"
    params = {
        "username": SMS_USERNAME,
        "apikey": SMS_API_KEY,
        "apirequest": "Text",
        "sender": SMS_SENDER,
        "route": SMS_ROUTE,
        "TemplateID": SMS_TEMPLATE_ID,
        "mobile": phone,
        "message": _render_message(code),
        "format": "JSON",
    }
    try:
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            r = await client.get(SMS_BASE_URL, params=params)
        if r.status_code != 200:
            logger.warning("OTP SMS panel http %s: %s", r.status_code, r.text[:200])
            return f"http_{r.status_code}"
        return "sent"
    except Exception as e:  # noqa: BLE001 - panel outage must never hard-block
        logger.warning("OTP SMS send error: %s", e)
        return "panel_error"


async def send_otp(db, raw_phone: str) -> dict:
    """Rate-checked OTP generation + send. Returns {sent, cooldown, status}.

    Raises ValueError on bad phone; raises RuntimeError(message) when rate-limited
    (caller maps to HTTP 429). SMS failures are NOT raised — they return softly.
    """
    phone = antijunk._norm_phone(raw_phone)
    if not phone or len(phone) != 10:
        raise ValueError("Please enter a valid 10-digit phone number.")

    now = datetime.now(timezone.utc)
    # 30s resend cooldown
    last = await db.otp_codes.find_one({"phone": phone}, sort=[("created_at", -1)])
    if last and last.get("created_at"):
        elapsed = (now - _aware(last["created_at"])).total_seconds()
        if elapsed < RESEND_COOLDOWN:
            raise RuntimeError(f"Please wait {int(RESEND_COOLDOWN - elapsed)}s before resending.")
    # 5 sends / phone / hour
    sends = await db.otp_codes.count_documents(
        {"phone": phone, "created_at": {"$gte": now - timedelta(hours=1)}}
    )
    if sends >= MAX_SENDS_PER_HOUR:
        raise RuntimeError("Too many OTP requests. Please try again later.")

    code = _generate_code()
    await db.otp_codes.insert_one({
        "phone": phone,
        "code_hash": _hash_code(phone, code),
        "created_at": now,
        "valid_until": now + timedelta(seconds=OTP_TTL_SECONDS),
        "attempts": 0,
        "verified": False,
    })
    status = await _send_sms(phone, code)
    return {"sent": status in ("sent", "mocked"), "cooldown": RESEND_COOLDOWN, "status": status}


async def verify_otp(db, raw_phone: str, code: str) -> str:
    """Verify the latest OTP for a phone and return a signed token on success.

    Raises ValueError(message) on any failure (caller maps to HTTP 400/429).

    Checks ALL valid (non-expired, non-locked) docs for the phone — not just
    the latest — to tolerate the rare race condition where two OTPs are sent
    concurrently (double React effect fire) and the user enters the older code.
    """
    phone = antijunk._norm_phone(raw_phone)
    if not phone or len(phone) != 10:
        raise ValueError("Please enter a valid 10-digit phone number.")
    code = (code or "").strip()

    now = datetime.now(timezone.utc)
    # Fetch last 5 docs for this phone, newest first
    cursor = db.otp_codes.find({"phone": phone}, sort=[("created_at", -1)])
    docs = await cursor.to_list(5)

    if not docs:
        raise ValueError("No OTP found. Please request a new code.")

    # Filter to valid (non-expired, non-locked, unverified) docs
    valid_docs = [
        d for d in docs
        if not (d.get("valid_until") and now > _aware(d["valid_until"]))
        and int(d.get("attempts", 0)) < MAX_VERIFY_ATTEMPTS
        and not d.get("verified")
    ]

    if not valid_docs:
        # All docs expired or locked — surface the most useful error
        latest = docs[0]
        if latest.get("valid_until") and now > _aware(latest["valid_until"]):
            raise ValueError("This OTP has expired. Please request a new code.")
        raise ValueError("Too many incorrect attempts. Please request a new code.")

    # Try each valid doc — first match wins
    for doc in valid_docs:
        if hmac.compare_digest(doc["code_hash"], _hash_code(phone, code)):
            await db.otp_codes.update_one({"_id": doc["_id"]}, {"$set": {"verified": True}})
            return create_token(phone)

    # No match — increment attempts on the most recent valid doc
    await db.otp_codes.update_one(
        {"_id": valid_docs[0]["_id"]}, {"$inc": {"attempts": 1}}
    )
    raise ValueError("Incorrect OTP. Please try again.")


def create_token(raw_phone: str) -> str:
    phone = antijunk._norm_phone(raw_phone)
    payload = {
        "sub": phone,
        "type": TOKEN_TYPE,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MINUTES),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def verify_token(token: str | None, raw_phone: str | None) -> bool:
    """True only if `token` is a valid, unexpired OTP token bound to `raw_phone`."""
    if not token or not raw_phone:
        return False
    phone = antijunk._norm_phone(raw_phone)
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return False
    return payload.get("type") == TOKEN_TYPE and payload.get("sub") == phone
