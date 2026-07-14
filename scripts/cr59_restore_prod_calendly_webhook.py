"""CR-59: Restore production Calendly webhook subscription (preview hijack repair)."""
import os, sys, httpx
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

PROD_CALLBACK = "https://mygenie.online/api/calendly/webhook"
API = "https://api.calendly.com"
token = os.environ["CALENDLY_API_TOKEN"]
signing_key = os.environ["CALENDLY_WEBHOOK_SIGNING_KEY"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

me = httpx.get(f"{API}/users/me", headers=h).json()["resource"]
user_uri, org_uri = me["uri"], me["current_organization"]

subs = httpx.get(f"{API}/webhook_subscriptions", headers=h,
                 params={"organization": org_uri, "scope": "user", "user": user_uri}).json()["collection"]

for s in subs:
    if s.get("state") == "active" and s.get("callback_url", "").rstrip("/") == PROD_CALLBACK.rstrip("/"):
        print(f"Prod subscription already active: {s['callback_url']} — nothing to do")
        sys.exit(0)

for s in subs:
    if s.get("state") == "active":
        sub_id = s["uri"].split("/")[-1]
        r = httpx.delete(f"{API}/webhook_subscriptions/{sub_id}", headers=h)
        print(f"Deleted {s['callback_url']} -> {r.status_code}")

reg = httpx.post(f"{API}/webhook_subscriptions", headers=h, json={
    "url": PROD_CALLBACK,
    "events": ["invitee.created"],
    "organization": org_uri,
    "user": user_uri,
    "scope": "user",
    "signing_key": signing_key,
})
print(f"Register prod: {reg.status_code} {reg.text[:300]}")

check = httpx.get(f"{API}/webhook_subscriptions", headers=h,
                  params={"organization": org_uri, "scope": "user", "user": user_uri}).json()["collection"]
for s in check:
    print("NOW:", s["state"], "|", s["callback_url"], "|", s["events"])
