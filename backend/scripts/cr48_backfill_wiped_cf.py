"""CR-48: Backfill wiped cf_* attribution in Freshsales.

Usage:
    python scripts/cr48_backfill_wiped_cf.py --dry-run    # preview payloads
    python scripts/cr48_backfill_wiped_cf.py              # apply

Depends on CR-47 being live. Idempotent: skips contacts whose current
custom_field already has >=8 attribution cf_* keys populated.
"""
import argparse
import asyncio
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/backend/.env", override=True)
sys.path.insert(0, "/app/backend")
import freshsales  # noqa: E402
from server import _attribution_to_crm  # noqa: E402

MONGO = MongoClient(os.environ["MONGO_URL"])
db = MONGO[os.environ["DB_NAME"]]
CUTOFF = "2026-07-04T00:00:00"

ATTRIBUTION_CF_KEYS = [
    "cf_latitude", "cf_orders_taken_via", "cf_est_name", "cf_contact_person",
    "cf_pos_satifcation_level", "cf_inventory_used", "cf_complete_address",
    "cf_account_software_integrated", "cf_aggreator_management", "cf_pos_type",
    "cf_outlet_type", "cf_sku",
]


def build_cf(lead: dict) -> dict:
    _native, attr_cf = _attribution_to_crm(lead.get("attribution") or {})
    cf = dict(attr_cf)
    if lead.get("outlet_type"):
        cf["cf_outlet_type"] = lead["outlet_type"]
    if lead.get("years_in_business"):
        cf["cf_sku"] = lead["years_in_business"]
    if lead.get("using_pos"):
        cf["cf_pos_used"] = lead["using_pos"]
    if lead.get("current_pos"):
        cf["cf_pos_name"] = lead["current_pos"]
    if lead.get("otp_verified"):
        cf["cf_rooms"] = "Yes"
    if lead.get("event_id"):
        cf["cf_contact_person"] = lead["event_id"]
    return {k: v for k, v in cf.items() if v not in (None, "")}


async def restore_one(lead: dict, dry_run: bool) -> tuple[int, str]:
    cid = lead["freshsales_contact_id"]
    rebuilt_cf = build_cf(lead)

    r0 = await freshsales._request("GET", f"/contacts/{cid}")
    if r0.status_code == 404:
        return (cid, "skip:deleted_in_fs")
    if r0.status_code >= 400:
        return (cid, f"error:fetch_http_{r0.status_code}")
    contact = r0.json().get("contact") or {}
    existing_cf = contact.get("custom_field") or {}

    populated_now = sum(1 for k in ATTRIBUTION_CF_KEYS if existing_cf.get(k))
    # restore-only semantics for event_id: never replace an existing non-empty one
    if existing_cf.get("cf_contact_person") and "cf_contact_person" in rebuilt_cf:
        rebuilt_cf.pop("cf_contact_person")
    changed_keys = [k for k, v in rebuilt_cf.items() if existing_cf.get(k) != v]
    if not changed_keys:
        return (cid, f"skip:no_changes({populated_now}_keys_intact)")

    merged = {**existing_cf, **rebuilt_cf}
    audit = {
        "cr": "CR-48",
        "contact_id": cid,
        "name": lead.get("name"),
        "phone": lead.get("phone"),
        "lead_id": lead.get("id"),
        "attempted_at": datetime.now(timezone.utc).isoformat(),
        "populated_before": populated_now,
        "existing_cf_before": existing_cf,
        "payload_cf": merged,
        "dry_run": dry_run,
    }

    if dry_run:
        print(f"DRY-RUN {cid} | {lead.get('name')} | populated_now={populated_now} | "
              f"would set {len(rebuilt_cf)} rebuilt keys (merged total {len(merged)})")
        for k in sorted(rebuilt_cf):
            print(f"    {k} = {str(rebuilt_cf[k])[:80]}")
        db.crm_backfill_log_cr48.insert_one({**audit, "status": "dry_run"})
        return (cid, "dry_run")

    r = await freshsales._request("PUT", f"/contacts/{cid}", json={"contact": {"custom_field": merged}})
    audit["response_status"] = r.status_code
    audit["response_body"] = r.text[:500]
    db.crm_backfill_log_cr48.insert_one({**audit, "status": "success" if r.status_code < 400 else "error"})
    print(f"{'OK  ' if r.status_code < 400 else 'FAIL'} {cid} | {lead.get('name')} | http_{r.status_code} | set {len(rebuilt_cf)} keys")
    return (cid, f"http_{r.status_code}")


async def main(dry_run: bool):
    leads = list(db.demo_requests.find({
        "otp_verified": True,
        "created_at": {"$gte": CUTOFF},
        "freshsales_contact_id": {"$ne": None},
    }).sort("created_at", 1))
    seen: set = set()
    uniq = []
    for l in leads:
        if l["freshsales_contact_id"] not in seen:
            seen.add(l["freshsales_contact_id"])
            uniq.append(l)
    print(f"CR-48: {len(uniq)} unique contact(s) to inspect (dry_run={dry_run})")
    counts: dict = {}
    failed = False
    for lead in uniq:
        try:
            cid, status = await restore_one(lead, dry_run)
        except Exception as e:
            cid, status = lead.get("freshsales_contact_id"), f"error:{e}"
        if not status.startswith("dry_run"):
            print(f"  {cid}: {status}")
        counts[status.split('(')[0]] = counts.get(status.split('(')[0], 0) + 1
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
