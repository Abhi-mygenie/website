"""No-cost anti-junk layer for lead forms.

Three cheap, provider-free defences applied to every lead endpoint:
  1. Honeypot     — a hidden field only bots fill.
  2. Min fill time — humans take >2s to complete a form; instant submits are bots.
  3. Rate limiting — per-IP volume cap + per-phone cooldown (MongoDB-backed, TTL-cleaned).

All checks are defensive: a failure in rate-limit bookkeeping must NEVER block a
genuine lead from being captured. (OTP verification is a separate, later layer.)
"""
import logging
from datetime import datetime, timezone, timedelta

from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

IP_LIMIT = 8          # max lead submissions per IP within IP_WINDOW
IP_WINDOW = 600       # 10 minutes
PHONE_COOLDOWN = 45   # seconds between submits from the same phone
MIN_FILL_MS = 2000    # a human takes > 2s to fill a form
TTL_SECONDS = 3600    # auto-expire submission_log entries


def client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _norm_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = "".join(c for c in phone if c.isdigit())
    return digits[-10:] if len(digits) >= 10 else (digits or None)


def looks_like_bot(hp: str | None, elapsed_ms: int | None) -> bool:
    """Honeypot + minimum-fill-time heuristics (no external calls)."""
    if hp:  # hidden field that only bots populate
        return True
    if elapsed_ms is not None and elapsed_ms < MIN_FILL_MS:
        return True
    return False


async def enforce_rate_limit(db, request: Request, phone: str | None) -> None:
    """Raise HTTP 429 if the client/phone is submitting too frequently."""
    now = datetime.now(timezone.utc)
    ip = client_ip(request)
    coll = db.submission_log
    try:
        ip_count = await coll.count_documents(
            {"ip": ip, "ts": {"$gte": now - timedelta(seconds=IP_WINDOW)}}
        )
        if ip_count >= IP_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Too many submissions from your network. Please try again in a few minutes.",
            )
        norm = _norm_phone(phone)
        if norm:
            recent = await coll.count_documents(
                {"phone": norm, "ts": {"$gte": now - timedelta(seconds=PHONE_COOLDOWN)}}
            )
            if recent >= 1:
                raise HTTPException(
                    status_code=429,
                    detail="Please wait a moment before submitting again.",
                )
        await coll.insert_one({"ip": ip, "phone": norm, "ts": now})
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001 - never let rate-limiting break lead capture
        logger.warning("rate-limit check error: %s", e)


async def ensure_indexes(db) -> None:
    try:
        await db.submission_log.create_index("ts", expireAfterSeconds=TTL_SECONDS)
        await db.submission_log.create_index([("ip", 1), ("ts", 1)])
        await db.submission_log.create_index([("phone", 1), ("ts", 1)])
    except Exception as e:  # noqa: BLE001
        logger.warning("ensure_indexes error: %s", e)
