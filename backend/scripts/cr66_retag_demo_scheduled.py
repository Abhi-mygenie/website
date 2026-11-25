"""CR-66: One-time sweep — retag "Demo Scheduled (Web)" → new tag + migrate status (FS + Mongo).

Usage:
    python scripts/cr66_retag_demo_scheduled.py --dry-run   # preview, no writes
    python scripts/cr66_retag_demo_scheduled.py             # apply

Scope: contacts from the last 30 days only (owner decision 2026-07-21).
Rules:
  - tags: remove OLD_TAG, add NEW_TAG (dedup). Only touched if OLD_TAG present.
  - contact_status_id: OLD_STATUS -> NEW_STATUS ONLY if currently at OLD_STATUS.
    Contacts moved by sales to Demo Given / Won / Lost keep their status.
  - custom_field: NEVER included in the PUT (CR-47 replace semantics).
  - Mongo: crm_status="demo_scheduled" set on matching docs ONLY when FS status migrated.
Audit: db.crm_retag_log_cr66 (tags_before, status_before per contact — rollback-able).
"""
import argparse
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/backend/.env", override=True)
sys.path.insert(0, "/app/backend")
import freshsales  # noqa: E402

OLD_TAG = "Demo Scheduled (Web)"
NEW_TAG = os.environ["FRESHSALES_DEMO_BOOKED_TAG"]
OLD_STATUS = 402001963264
NEW_STATUS = int(os.environ["FRESHSALES_STATUS_DEMO_BOOKED_ID"])
CUTOFF_DT = datetime.now(timezone.utc) - timedelta(days=30)
CUTOFF = CUTOFF_DT.isoformat()

client = MongoClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
MONGO_COLLECTIONS = ["demo_requests", "quotes", "contact_messages", "backfilled_leads"]


def _within_30d(iso_str) -> bool:
    if not iso_str:
        return False
    try:
        dt = datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt >= CUTOFF_DT
    except Exception:
        return False


def collect_candidate_ids() -> dict[int, str]:
    """Returns {contact_id: source_net} for last-30-day candidates."""
    ids: dict[int, str] = {}
    # Net A — Mongo demo_booked leads
    for doc in db.demo_requests.find(
        {"status": "demo_booked", "freshsales_contact_id": {"$ne": None}},
        {"freshsales_contact_id": 1, "demo_booked_at": 1, "created_at": 1},
    ):
        when = doc.get("demo_booked_at") or doc.get("created_at")
        if _within_30d(when):
            ids[int(doc["freshsales_contact_id"])] = "mongo"
    return ids


async def collect_fs_old_status_ids(ids: dict[int, str]):
    """Net B — Freshsales contacts still at OLD_STATUS (paginated)."""
    page = 1
    while True:
        data = await freshsales.get_contacts_by_status(OLD_STATUS, page=page)
        contacts = data.get("contacts") or []
        for c in contacts:
            if _within_30d(c.get("created_at")) and int(c["id"]) not in ids:
                ids[int(c["id"])] = "fs_old_status"
        total = (data.get("meta") or {}).get("total") or 0
        if page * 100 >= total or not contacts:
            break
        page += 1
        await asyncio.sleep(2)


async def process_contact(cid: int, source: str, dry_run: bool) -> str:
    r0 = await freshsales._request("GET", f"/contacts/{cid}?include=contact_status")
    contact = (r0.json().get("contact") or {}) if r0.status_code < 400 else {}
    if not contact:
        print(f"FETCH-FAIL {cid} (source={source}, http={r0.status_code})")
        return "error:fetch_failed"
    tags = contact.get("tags") or []
    status_id = contact.get("contact_status_id")
    name = contact.get("display_name") or contact.get("first_name") or "?"

    has_old_tag = OLD_TAG in tags
    at_old_status = status_id == OLD_STATUS
    if not has_old_tag and not at_old_status:
        return "skip:nothing_to_do"

    new_tags = [t for t in tags if t != OLD_TAG]
    if NEW_TAG not in new_tags:
        new_tags.append(NEW_TAG)

    update: dict = {}
    if has_old_tag or new_tags != tags:
        update["tags"] = new_tags
    if at_old_status:
        update["contact_status_id"] = NEW_STATUS

    audit = {
        "cr": "CR-66",
        "contact_id": cid,
        "name": name,
        "source_net": source,
        "tags_before": tags,
        "status_before": status_id,
        "payload": update,
        "migrate_status": at_old_status,
        "attempted_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": dry_run,
    }

    line = (f"{cid} | {name} | tags: {tags} -> {new_tags} | "
            f"status: {status_id}{' -> ' + str(NEW_STATUS) if at_old_status else ' (kept)'}")
    if dry_run:
        print("DRY-RUN", line)
        db.crm_retag_log_cr66.insert_one({**audit, "status": "dry_run"})
        return "dry_run"

    r = await freshsales._request("PUT", f"/contacts/{cid}", json={"contact": update})
    audit["response_status"] = r.status_code
    audit["response_body"] = r.text[:300]
    ok = r.status_code < 400

    mongo_updated = 0
    if ok and at_old_status:
        for col in MONGO_COLLECTIONS:
            res = db[col].update_many(
                {"freshsales_contact_id": cid},
                {"$set": {"crm_status": "demo_scheduled",
                          "crm_status_updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            mongo_updated += res.modified_count
    audit["mongo_docs_updated"] = mongo_updated
    db.crm_retag_log_cr66.insert_one({**audit, "status": "success" if ok else "error"})
    print(("OK   " if ok else "FAIL ") + line + f" | mongo_docs={mongo_updated}")
    return "success" if ok else f"error:http_{r.status_code}"


async def main(dry_run: bool):
    print(f"CR-66 sweep (dry_run={dry_run}) cutoff={CUTOFF}")
    print(f"OLD_TAG={OLD_TAG!r} NEW_TAG={NEW_TAG!r} OLD_STATUS={OLD_STATUS} NEW_STATUS={NEW_STATUS}")
    ids = collect_candidate_ids()
    print(f"Net A (mongo): {len(ids)} candidates")
    await collect_fs_old_status_ids(ids)
    print(f"Total candidates after Net B: {len(ids)}")

    counts: dict[str, int] = {}
    failed = False
    for cid, source in ids.items():
        try:
            status = await process_contact(cid, source, dry_run)
        except Exception as e:
            status = f"error:{e}"
            print(f"ERROR {cid}: {e}")
        counts[status] = counts.get(status, 0) + 1
        if status.startswith("error"):
            failed = True
        await asyncio.sleep(2)
    print("Summary:", counts)
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(main(dry_run=args.dry_run))
