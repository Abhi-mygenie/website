"""CR-59: Backfill Freshsales Demo Time + Meeting Link for bookings lost during
the preview webhook hijack window (2026-07-13T05:56:40Z -> restore).
Usage: python3 cr59_backfill_calendly_webhook_gap.py [--live]
"""
import os, sys, asyncio, httpx
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
sys.path.insert(0, "/app/backend")
import freshsales  # noqa: E402

HIJACK_START = "2026-07-13T05:56:40"
API = "https://api.calendly.com"
LIVE = "--live" in sys.argv
IST = timezone(timedelta(hours=5, minutes=30))


def fmt_ist(iso):
    if not iso:
        return None
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(IST)
    return dt.strftime("%-d %b %Y, %-I:%M %p IST")


async def main():
    h = {"Authorization": f"Bearer {os.environ['CALENDLY_API_TOKEN']}"}
    async with httpx.AsyncClient(timeout=20.0) as c:
        me = (await c.get(f"{API}/users/me", headers=h)).json()["resource"]
        ev = (await c.get(f"{API}/scheduled_events", headers=h, params={
            "user": me["uri"], "min_start_time": "2026-07-13T00:00:00Z",
            "count": 100, "sort": "start_time:asc"})).json()["collection"]
        affected = [e for e in ev if e["created_at"][:19] >= HIJACK_START and e["status"] == "active"]
        print(f"Affected active events created after {HIJACK_START}Z: {len(affected)}\n")

        results = []
        for e in affected:
            loc = e.get("location") or {}
            raw_join = loc.get("join_url") or ""
            join_url = raw_join.split("/events/", 1)[-1] if "/events/" in raw_join else raw_join or None
            demo_at = fmt_ist(e.get("start_time"))
            inv = (await c.get(f"{e['uri']}/invitees", headers=h)).json()["collection"]
            for i in inv:
                if i.get("status") != "active":
                    continue
                tracking = i.get("tracking") or {}
                raw_contact = tracking.get("utm_content")
                contact_id = int(raw_contact) if raw_contact and str(raw_contact).isdigit() else None
                email = i.get("email")
                row = {"name": i.get("name"), "email": email, "contact_id": contact_id,
                       "demo_at": demo_at, "meet_link": join_url,
                       "event_created": e["created_at"][:16], "utm_medium": tracking.get("utm_medium")}
                if LIVE:
                    fcid = await freshsales.mark_demo_booked(
                        contact_id=contact_id, email=email, meet_link=join_url,
                        demo_at=demo_at, meet_link_full=raw_join or None)
                    row["result_fcid"] = fcid
                results.append(row)

    print(f"{'MODE: LIVE' if LIVE else 'MODE: DRY-RUN (pass --live to write)'}\n")
    for r in results:
        print(r)

    if LIVE:
        from motor.motor_asyncio import AsyncIOMotorClient
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        await db.crm_backfill_log_cr59.insert_many([
            {**r, "run_at": datetime.now(timezone.utc).isoformat()} for r in results])
        ok = sum(1 for r in results if r.get("result_fcid"))
        print(f"\nDONE: {ok}/{len(results)} written to Freshsales. Trail in db.crm_backfill_log_cr59")


asyncio.run(main())
