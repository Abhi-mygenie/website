"""Register (or list) the Calendly `invitee.created` webhook subscription.

Usage:
    # 1) Put your Calendly Personal Access Token in backend/.env as CALENDLY_API_TOKEN
    # 2) Set the public callback URL in backend/.env (recommended for deploy):
    #       CALENDLY_WEBHOOK_CALLBACK_URL=https://yourdomain.com/api/calendly/webhook
    #    After deploying to production, just update this env var and re-run this script.
    # 3) Run (callback URL resolution order: CLI arg > CALENDLY_WEBHOOK_CALLBACK_URL env
    #    > REACT_APP_BACKEND_URL + /api/calendly/webhook):
    python scripts/register_calendly_webhook.py
    python scripts/register_calendly_webhook.py https://yourdomain.com/api/calendly/webhook
    python scripts/register_calendly_webhook.py --list

The signing key (CALENDLY_WEBHOOK_SIGNING_KEY) is sent at creation time and used
by the backend to verify every incoming webhook.
"""
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

API = "https://api.calendly.com"
TOKEN = os.environ.get("CALENDLY_API_TOKEN")
SIGNING_KEY = os.environ.get("CALENDLY_WEBHOOK_SIGNING_KEY")
CALLBACK_URL = os.environ.get("CALENDLY_WEBHOOK_CALLBACK_URL")


def _headers():
    return {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


def _default_callback() -> str:
    # Prefer the explicit env var (set this to your production URL after deploy).
    if CALLBACK_URL:
        return CALLBACK_URL.strip().rstrip("/")
    fe_env = ROOT.parent / "frontend" / ".env"
    base = ""
    if fe_env.exists():
        for line in fe_env.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                base = line.split("=", 1)[1].strip().strip('"')
    return f"{base.rstrip('/')}/api/calendly/webhook"


def main():
    if not TOKEN:
        sys.exit("ERROR: set CALENDLY_API_TOKEN in backend/.env first.")
    me = httpx.get(f"{API}/users/me", headers=_headers(), timeout=20)
    me.raise_for_status()
    res = me.json()["resource"]
    user_uri, org_uri = res["uri"], res["current_organization"]
    print(f"User: {user_uri}\nOrg:  {org_uri}")

    if "--list" in sys.argv:
        r = httpx.get(
            f"{API}/webhook_subscriptions",
            headers=_headers(),
            params={"organization": org_uri, "scope": "user", "user": user_uri},
            timeout=20,
        )
        print(r.status_code, r.text)
        return

    callback = next((a for a in sys.argv[1:] if a.startswith("http")), None) or _default_callback()
    print(f"Callback: {callback}")
    body = {
        "url": callback,
        "events": ["invitee.created"],
        "organization": org_uri,
        "user": user_uri,
        "scope": "user",
        "signing_key": SIGNING_KEY,
    }
    r = httpx.post(f"{API}/webhook_subscriptions", headers=_headers(), json=body, timeout=20)
    print(r.status_code)
    print(r.text)
    if r.status_code in (200, 201):
        print("\n✅ Webhook registered. Bookings will now POST to your backend.")
    elif r.status_code == 409:
        print("\nℹ️  A subscription for this URL already exists (run with --list to view).")


if __name__ == "__main__":
    main()
