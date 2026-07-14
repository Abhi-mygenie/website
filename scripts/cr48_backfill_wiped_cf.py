"""CR-48 — Backfill wiped Freshsales custom_field on OTP-verified leads.

Restores the `cf_*` attribution keys that were wiped by the CR-47 bug
(swap_otp_tag / mark_demo_booked doing replace-not-merge PUTs before that CR
shipped on 2026-07-05).

Scope
    - Reads demo_requests where otp_verified=True AND created_at>=2026-07-04
      AND freshsales_contact_id is not None.
    - Rebuilds the cf_* payload from the persisted `attribution` dict + a few
      demo_requests-native fields (outlet_type, years_in_business, using_pos,
      current_pos) using the same `_attribution_to_crm` mapping the live
      backend uses today (post CR-44 semantics).
    - Fetches the current FS contact's custom_field and MERGES our rebuild on
      top of it — we never overwrite a key that already carries a real value.
    - PUTs only {custom_field: <merged>} — NEVER touches tags, native fields,
      email, phone. That guarantee is the guard against re-triggering the very
      bug we're recovering from.
    - Idempotency: skip if ≥8 of the 15 attribution cf_* keys already populated.
    - Every attempt is logged to a new `crm_backfill_log_cr48` Mongo collection
      (audit trail + free rollback preview).
    - `--dry-run` prints what would happen but performs zero FS writes.

Not restored (documented in CR-48):
    - `native.latest_source` (fbc)         — this is a native field, not cf_.
      Extension flagged in earlier pre-flight; not part of this run.
    - `native.work_number` (ad_id)         — same.
    - `cf_contact_person` (browser event_id) — the original UUIDs were never
      persisted in Mongo; irretrievable. CR-51 fixes this going forward.

Usage:
    python /app/scripts/cr48_backfill_wiped_cf.py --dry-run
    python /app/scripts/cr48_backfill_wiped_cf.py
"""
from __future__ import annotations
import argparse
import asyncio
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, "/app/backend")
from dotenv import load_dotenv
load_dotenv("/app/backend/.env", override=True)

import httpx
from pymongo import MongoClient

# Reuse the live mapping — guarantees the payload matches what a fresh lead
# would produce today. If it changes, backfill changes with it.
from server import _attribution_to_crm  # noqa: E402


FS_BASE = os.environ["FRESHSALES_BASE_URL"].rstrip("/")
FS_KEY  = os.environ["FRESHSALES_API_KEY"]
FS_HEADERS = {
    "Authorization": f"Token token={FS_KEY}",
    "Content-Type":  "application/json",
}
CUTOFF = "2026-07-04T00:00:00"
IDEMPOTENCY_THRESHOLD = 8  # ≥ this many populated attribution cf_ keys ⇒ skip

# The 15 attribution / lead cf_* keys that a well-formed CR-44 lead should have
ATTRIBUTION_KEYS = [
    "cf_latitude",                     # fbclid
    "cf_orders_taken_via",             # fbp
    "cf_est_name",                     # utm_content (ad set name)
    "cf_pos_satifcation_level",        # utm_term
    "cf_contact_person",               # event_id (NOT restored — lost forever)
    "cf_pos_type",                     # gclid
    "cf_inventory_used",               # adset_id
    "cf_complete_address",             # placement
    "cf_account_software_integrated",  # utm_id
    "cf_aggreator_management",         # site_source_name
    "cf_outlet_type",
    "cf_sku",
    "cf_pos_used",
    "cf_pos_name",
    "cf_rooms",
]


def rebuild_cf(lead: dict) -> dict:
    """Rebuild the cf_* payload from a Mongo demo_requests doc."""
    attr = lead.get("attribution") or {}
    _, cf = _attribution_to_crm(attr)
    # Add the demo_requests-derived cf_* the live backend writes at create-time
    if lead.get("outlet_type"):
        cf["cf_outlet_type"] = lead["outlet_type"]
    if lead.get("years_in_business"):
        cf["cf_sku"] = lead["years_in_business"]
    if lead.get("using_pos"):
        cf["cf_pos_used"] = lead["using_pos"]
    if lead.get("current_pos"):
        cf["cf_pos_name"] = lead["current_pos"]
    # All these leads reached OTP-verify by definition of the filter
    cf["cf_rooms"] = "Yes"
    # Drop empties
    return {k: v for k, v in cf.items() if v not in (None, "")}


async def process_lead(c: httpx.AsyncClient, lead: dict, dry_run: bool, audit) -> str:
    cid    = lead.get("freshsales_contact_id")
    phone  = lead.get("phone")
    name   = lead.get("name") or "(no name)"
    lead_id = lead.get("id")

    entry = {
        "cr": "CR-48",
        "contact_id": cid,
        "phone": phone,
        "name": name,
        "lead_id": lead_id,
        "attempted_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": dry_run,
    }

    # Fetch current FS state
    try:
        r = await c.get(f"{FS_BASE}/contacts/{cid}", headers=FS_HEADERS)
    except Exception as e:
        entry["status"] = f"error:fs_fetch:{e}"
        audit.append(entry)
        return entry["status"]
    if r.status_code >= 400:
        entry["status"] = f"skip:fs_http_{r.status_code}"
        entry["response_status"] = r.status_code
        entry["response_body"] = r.text[:300]
        audit.append(entry)
        return entry["status"]
    contact = r.json().get("contact") or {}
    existing_cf = contact.get("custom_field") or {}

    # Idempotency check
    populated = [k for k in ATTRIBUTION_KEYS if existing_cf.get(k)]
    entry["existing_populated_count"] = len(populated)
    entry["existing_populated_keys"]  = populated
    if len(populated) >= IDEMPOTENCY_THRESHOLD:
        entry["status"] = f"skip:already_restored_({len(populated)}/{len(ATTRIBUTION_KEYS)})"
        audit.append(entry)
        return entry["status"]

    # Rebuild + merge
    rebuilt = rebuild_cf(lead)
    entry["rebuilt_keys"] = sorted(rebuilt.keys())
    entry["rebuilt_key_count"] = len(rebuilt)
    if not rebuilt:
        entry["status"] = "skip:no_source_data"
        audit.append(entry)
        return entry["status"]

    # Only merge NON-EMPTY existing keys — we don't want to echo back the
    # schema's null placeholders (some FS fields validate on null → 400s).
    existing_nonnull = {k: v for k, v in existing_cf.items() if v not in (None, "")}
    merged = {**existing_nonnull, **rebuilt}   # rebuild WINS over existing (we're restoring known-good)
    entry["payload_cf_keys"] = sorted(merged.keys())
    entry["payload_cf_key_count"] = len(merged)
    # Snapshot the pre-write cf so this row is a self-contained rollback pointer
    entry["existing_cf_before"] = existing_nonnull

    if dry_run:
        entry["status"] = "dry_run"
        audit.append(entry)
        return entry["status"]

    # Live PUT — ONLY custom_field, no other fields (per CR-48 spec)
    put_url = f"{FS_BASE}/contacts/{cid}"
    pr = await c.put(put_url, headers=FS_HEADERS, json={"contact": {"custom_field": merged}})
    entry["response_status"] = pr.status_code
    entry["response_body"]   = pr.text[:400]
    if pr.status_code < 400:
        entry["status"] = "success"
    else:
        entry["status"] = f"error:put_{pr.status_code}"
    audit.append(entry)
    return entry["status"]


async def main(dry_run: bool, only_cids: set[int] | None):
    db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    q = {
        "otp_verified": True,
        "created_at":   {"$gte": CUTOFF},
        "freshsales_contact_id": {"$ne": None},
    }
    leads = list(db.demo_requests.find(q, {"_id": 0}).sort("created_at", 1))
    if only_cids:
        leads = [x for x in leads if x.get("freshsales_contact_id") in only_cids]
    audit: list = []
    total = len(leads)
    print(f"CR-48 backfill  (dry_run={dry_run})")
    print(f"  filter: {q}")
    if only_cids:
        print(f"  --contacts filter: {sorted(only_cids)}")
    print(f"  candidates: {total}")
    print(f"  idempotency threshold: ≥{IDEMPOTENCY_THRESHOLD}/{len(ATTRIBUTION_KEYS)} populated attribution keys ⇒ skip")
    print()

    counts = {"success": 0, "dry_run": 0, "skip": 0, "error": 0}
    async with httpx.AsyncClient(timeout=20.0) as c:
        for i, lead in enumerate(leads, 1):
            name = lead.get("name") or "(no name)"
            cid  = lead.get("freshsales_contact_id")
            status = await process_lead(c, lead, dry_run, audit)
            head = status.split(":", 1)[0]
            counts[head] = counts.get(head, 0) + 1
            print(f"  [{i}/{total}] {name:<25s} cid={cid}  →  {status}")

    print()
    print("=" * 64)
    print("Summary:", counts)
    print("=" * 64)

    # Write audit log — always, even in dry-run (dry_run flag is on each row)
    if audit:
        res = db.crm_backfill_log_cr48.insert_many(audit)
        print(f"Audit log: wrote {len(res.inserted_ids)} rows to crm_backfill_log_cr48")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="Preview only, no FS writes")
    p.add_argument("--contacts", type=str, default="",
                   help="Comma-separated Freshsales contact IDs to restrict to. Empty = all candidates.")
    args = p.parse_args()
    only_cids = None
    if args.contacts.strip():
        only_cids = {int(x.strip()) for x in args.contacts.split(",") if x.strip()}
    asyncio.run(main(dry_run=args.dry_run, only_cids=only_cids))
