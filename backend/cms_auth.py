"""CMS auth — exactly 2 fixed admin users from environment (no signup, no users DB).

Stateless JWT: the env credentials are the source of truth, so we don't persist users.
Configure in backend/.env:
    CMS_JWT_SECRET, CMS_USER_1, CMS_PASS_1, CMS_USER_2, CMS_PASS_2
"""
import os
import hmac
from datetime import datetime, timezone, timedelta

import jwt
from fastapi import Request, HTTPException

ALGO = "HS256"
SESSION_HOURS = int(os.environ.get("CMS_SESSION_HOURS", "12"))


def _users() -> dict:
    users = {}
    for i in (1, 2):
        u = os.environ.get(f"CMS_USER_{i}")
        p = os.environ.get(f"CMS_PASS_{i}")
        if u and p:
            users[u.strip().lower()] = p
    return users


def _secret() -> str:
    return os.environ.get("CMS_JWT_SECRET", "change-me-in-env")


def authenticate(username: str, password: str):
    u = (username or "").strip().lower()
    stored = _users().get(u)
    if stored and hmac.compare_digest(stored, password or ""):
        return u
    return None


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "role": "admin",
        "type": "cms",
        "exp": datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS),
    }
    return jwt.encode(payload, _secret(), algorithm=ALGO)


def get_current_admin(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("cms_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[ALGO])
        if payload.get("type") != "cms":
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
