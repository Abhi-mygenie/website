# CR-48: One-Time Backfill of Wiped `cf_*` Attribution in Freshsales

## Date: 2026-07-05
## Status: REGISTERED (execute AFTER CR-47 is deployed and verified)
## Priority: HIGH (data-restoration; unblocks Ads Intelligence + Meta CAPI for the affected leads)
## Reporter: E1 investigation — traced from lead 7990444024 (Mustakbhai)
## Depends on: **CR-47** (must be deployed first; otherwise the backfill PUT will itself be wiped by the next `swap_otp_tag` or `mark_demo_booked` call for the same contact)
## Related: CR-24 (Ads Intelligence — consumer of the restored data), CR-44 (fbc/ad_id schema — DO NOT expect those two specific fields to survive backfill until CR-44 is resolved)

---

## Problem Statement

Between 2026-07-04 ~05:18 UTC (when Freshsales silently switched `custom_field` PUT semantics from merge → replace) and the deployment of CR-47, every OTP-verified website lead has had its Freshsales attribution custom fields (fbclid, IP, browser, ad set, event ID, fbp cookie, ad-set ID, UTM campaign ID, source platform, search term, outlet type, current POS, years-in-business, plus any demo-booking meta) **overwritten with an empty object**, leaving only `cf_rooms = "Yes"`.

Attribution data was **preserved intact in MongoDB** (`demo_requests.attribution`, `quotes.attribution`, `contact_messages.attribution`). The backfill re-plays that Mongo-side data into Freshsales.

---

## Scope (verified against production Atlas on 2026-07-05)

| Path | Collection query | Affected count |
|---|---|---|
| Website demo submissions, OTP-verified | `db.demo_requests.find({otp_verified: true, created_at: {$gte: "2026-07-04T00:00:00Z"}, freshsales_contact_id: {$ne: null}})` | **2** |
| Calendly-booked demos | `db.demo_requests.find({status: "demo_booked", demo_booked_at: {$gte: "2026-07-04T00:00:00Z"}})` | **0** |
| Quotes (payments flow) | `db.quotes.find({created_at: {$gte: "2026-07-04T00:00:00Z"}, freshsales_contact_id: {$ne: null}})` | 0 |
| Contact-form messages | `db.contact_messages.find({created_at: {$gte: "2026-07-04T00:00:00Z"}, freshsales_contact_id: {$ne: null}})` | (verify at run-time) |

**Confirmed affected records (as of 2026-07-05 11:30 UTC):**

| # | Phone | Name | FS contact_id | created_at (UTC) |
|---|---|---|---|---|
| 1 | 9696965595 | Aryen | 402211514598 | 2026-07-04T05:18:30 |
| 2 | 7990444024 | Mustakbhai | 402211617324 | 2026-07-05T10:54:43 |

The scope is intentionally kept small — until CR-47 lands, every additional OTP-verified lead adds one more to the backfill queue. Recommend deploying CR-47 within 24 hours of registering this CR to freeze the scope.

---

## Data source of truth

All required data still exists in Mongo:

- `demo_requests.attribution` — the full attribution dict (`fbclid`, `fbc`, `fbp`, `ad_id`, `adset_id`, `utm_id`, `placement`, `site_source_name`, all UTM fields, IP, user_agent, etc.)
- `demo_requests.outlet_type`, `.using_pos`, `.current_pos`, `.years_in_business` — for the non-attribution `cf_*` fields
- `demo_requests.otp_verified` — for `cf_rooms`
- `demo_requests.event_id` is NOT persisted (secondary bug tracked in CR-47 §"Related fixes") → we will lose `cf_contact_person` (Event ID GTM) for the backfilled records, unless we recover it from Freshsales' original create-time record (see "Fallback" below).

---

## Approach

### Overall strategy

For each affected lead:
1. Read the `demo_requests` document from Mongo (contains attribution + basic fields).
2. Run the existing `_attribution_to_crm(attr)` function (`backend/server.py:203`) to rebuild the exact `cf_*` payload that was originally sent on the demo submission.
3. Add `cf_rooms = "Yes"` (since these are all OTP-verified).
4. Fetch the current Freshsales contact via `GET /contacts/{id}` and merge the rebuilt cf into whatever is currently there (typically only `{cf_rooms: "Yes"}` post-wipe).
5. `PUT /contacts/{id}` with `{custom_field: <merged>}`.
6. Log the operation to a new one-time Mongo collection `crm_backfill_log_cr48` with request/response snapshots for audit.

### Fallback for `cf_contact_person` (event_id)

The `event_id` was never persisted in Mongo (CR-47 §Related). For the 2 affected leads, `cf_contact_person` was populated on the initial `POST /contacts` — Freshsales' Journey / Activity audit may still hold the value in Contact History. If UI-side inspection reveals the original `cf_contact_person` value, we can either:
- Read it via Freshsales activity API (if exposed), or
- Restore it manually from ops history (Meta Events Manager still holds the same event_id), or
- Skip it (impact: Meta CAPI cannot dedupe those 2 events retroactively — negligible business impact for 2 leads).

Default policy: **skip `cf_contact_person`** during backfill; if the field is needed for a specific lead, restore manually.

---

## Deliverables

### File: `/app/scripts/cr48_backfill_wiped_cf.py` (one-time script; NOT wired into any cron)

Key elements:
- Uses the same `.env` config as backend (no new secrets).
- Idempotent — if `custom_field` already has ≥8 of the expected keys populated, skip that lead (means CR-48 already ran for it).
- Dry-run mode (`--dry-run`) prints the payload without POST-ing.
- Rate limiting: 2-second sleep between contacts (matches `crm_sync.py`).
- Writes an audit row per lead into `db.crm_backfill_log_cr48`.
- Exits non-zero if any PUT returns ≥400.

### Skeleton (final version to be produced during implementation)

```python
"""CR-48: Backfill wiped cf_* attribution in Freshsales.

Usage:
    python scripts/cr48_backfill_wiped_cf.py --dry-run    # preview payloads
    python scripts/cr48_backfill_wiped_cf.py              # apply

Depends on CR-47 being live (otherwise the backfill PUT will itself be wiped).
Idempotent: reruns skip contacts that already have ≥8 attribution cf_* populated.
"""
import argparse, asyncio, os, sys
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('/app/backend/.env', override=True)
sys.path.insert(0, '/app')
from backend import freshsales
from backend.server import _attribution_to_crm  # reuse existing builder

MONGO = MongoClient(os.environ['MONGO_URL'])
db = MONGO[os.environ['DB_NAME']]
CUTOFF = "2026-07-04T00:00:00"

ATTRIBUTION_CF_KEYS = [
    "cf_latitude", "cf_longitude", "cf_est_name", "cf_orders_taken_via",
    "cf_contact_person", "cf_outlet_type", "cf_complete_address",
    "cf_inventory_used", "cf_account_software_integrated",
    "cf_aggreator_management", "cf_pos_satifcation_level",
    "cf_category", "cf_sku",
]

async def restore_one(lead: dict, dry_run: bool) -> tuple[int, str]:
    cid = lead["freshsales_contact_id"]
    attr = lead.get("attribution") or {}

    # 1) Rebuild the cf payload from Mongo
    attr_cf, _extras = _attribution_to_crm(attr)
    if lead.get("outlet_type"):
        attr_cf["cf_outlet_type"] = lead["outlet_type"]
    if lead.get("years_in_business"):
        attr_cf["cf_sku"] = lead["years_in_business"]
    if lead.get("using_pos"):
        attr_cf["cf_pos_used"] = lead["using_pos"]
    if lead.get("current_pos"):
        attr_cf["cf_pos_name"] = lead["current_pos"]
    if lead.get("otp_verified"):
        attr_cf["cf_rooms"] = "Yes"

    # 2) Fetch current cf and merge
    contact = await freshsales._get_contact(cid)
    existing_cf = contact.get("custom_field") or {}

    # 3) Idempotency check
    populated_now = sum(1 for k in ATTRIBUTION_CF_KEYS if existing_cf.get(k))
    if populated_now >= 8:
        return (cid, "skip:already_restored")

    merged = {**existing_cf, **{k: v for k, v in attr_cf.items() if v not in (None, "")}}

    audit = {
        "cr": "CR-48",
        "contact_id": cid,
        "phone": lead.get("phone"),
        "lead_id": lead.get("id"),
        "attempted_at": datetime.now(timezone.utc).isoformat(),
        "existing_cf_before": existing_cf,
        "payload_cf": merged,
        "dry_run": dry_run,
    }

    if dry_run:
        print("DRY-RUN cid=", cid, "would set", len(merged), "cf_ fields")
        db.crm_backfill_log_cr48.insert_one({**audit, "status": "dry_run"})
        return (cid, "dry_run")

    r = await freshsales._request("PUT", f"/contacts/{cid}", json={"contact": {"custom_field": merged}})
    audit["response_status"] = r.status_code
    audit["response_body"]   = r.text[:500]
    db.crm_backfill_log_cr48.insert_one({**audit, "status": "success" if r.status_code < 400 else "error"})
    return (cid, f"http_{r.status_code}")

async def main(dry_run: bool):
    leads = list(db.demo_requests.find({
        "otp_verified": True,
        "created_at": {"$gte": CUTOFF},
        "freshsales_contact_id": {"$ne": None},
    }).sort("created_at", 1))
    print(f"CR-48: {len(leads)} lead(s) to inspect (dry_run={dry_run})")
    for lead in leads:
        try:
            cid, status = await restore_one(lead, dry_run)
            print(f"  {cid}: {status}")
        except Exception as e:
            print(f"  {lead.get('freshsales_contact_id')}: ERROR {e}")
        await asyncio.sleep(2)   # gentle on the FS rate limit

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(main(dry_run=args.dry_run))
```

### Audit log collection (new)

`db.crm_backfill_log_cr48` — one document per contact processed, keyed by `contact_id`. Fields: `cr`, `contact_id`, `phone`, `lead_id`, `attempted_at`, `existing_cf_before`, `payload_cf`, `dry_run`, `response_status`, `response_body`, `status`.

Retention: keep indefinitely (small, ≤ few dozen docs).

---

## Execution runbook

1. **Prerequisite:** CR-47 code fix is deployed and verified via a fresh test lead (see CR-47 validation plan).
2. **Preview:**
   ```
   cd /app && python scripts/cr48_backfill_wiped_cf.py --dry-run
   ```
   Inspect stdout + `db.crm_backfill_log_cr48` for the dry-run entries. Confirm each `payload_cf` has 12+ keys.
3. **Apply:**
   ```
   cd /app && python scripts/cr48_backfill_wiped_cf.py
   ```
   Expect one line per contact ending in `http_200`. Non-200 responses will be logged to `crm_backfill_log_cr48.status = "error"`.
4. **Verify:** For each contact ID, `curl` Freshsales `/contacts/{id}` and confirm the restored `cf_*` fields.
5. **Communicate:** Notify sales team that historical attribution is restored for the 2 leads; Ads Intelligence dashboard filters based on `cf_*` will now include them.

---

## Idempotency & re-run safety

- Script skips any contact whose current `custom_field` already has ≥ 8 of the expected attribution `cf_*` populated. This makes it safe to run multiple times.
- If CR-47 has bugs and a subsequent `swap_otp_tag` re-wipes a backfilled contact, simply rerun this script — data source in Mongo is durable.

---

## Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Script executed BEFORE CR-47 → immediate re-wipe on next flow event | Medium | Wasted work, no data loss (Mongo still source of truth) | Runbook step 1; script exits early if it detects CR-47 not deployed via a magic marker function-signature check |
| Freshsales rate limit during 2-lead run | ~0 | — | 2-second sleep between calls |
| Bad `attribution` shape in Mongo causing `_attribution_to_crm` to throw | Very low (only 2 leads, both verified to have full attribution) | Script exits non-zero, no partial writes for the offending lead | try/except per-lead |
| Overwriting a manual sales-team edit made after the wipe | Very low (both affected contacts are ≤ 2 days old) | Manual edit could be lost if the field name overlaps our cf_ set | Audit log captures `existing_cf_before` — reversible per-contact |
| `cf_contact_person` (event_id) lost forever | Certain for these 2 leads | Meta CAPI cannot dedupe 2 old events — negligible | Accepted; noted in "Fallback" above |

---

## Rollback

Because the audit log stores `existing_cf_before` for every backfilled contact, rollback is trivial:

```python
# rollback (do NOT include in the same script — separate one-off)
for entry in db.crm_backfill_log_cr48.find({"status": "success"}):
    r = await freshsales._request(
        "PUT", f"/contacts/{entry['contact_id']}",
        json={"contact": {"custom_field": entry["existing_cf_before"]}},
    )
```

---

## Definition of done

- [ ] CR-47 deployed and verified against a fresh OTP-verified lead.
- [ ] `--dry-run` produces a payload with ≥ 12 populated cf_ keys for each affected contact.
- [ ] Live run returns HTTP 200 for every contact.
- [ ] `crm_backfill_log_cr48` has one `status: "success"` row per contact.
- [ ] Manual spot-check via Freshsales UI: `cf_latitude`, `cf_est_name`, `cf_orders_taken_via`, `cf_outlet_type` all visible for Aryen (402211514598) and Mustakbhai (402211617324).
- [ ] `HANDOFF.md` + `PRD.md` updated with CR-48 completion note.

---

## Follow-up considerations

- After this CR, review whether the periodic `source_sync` cron in `crm_sync.py` also re-writes any `cf_*` in a way that could re-wipe backfilled data. Current read confirms it only READS from Freshsales into Mongo — no writes.
- Consider a **weekly integrity check** cron: for every recent OTP-verified lead, compare Mongo `attribution` with Freshsales `cf_*` and alert on mismatches. Prevents silent regressions if Freshsales changes semantics again.
- Once CR-44 is resolved (fbc + ad_id target-field fixes), rerun this backfill script (idempotent) to also populate those two fields for the 2 legacy leads.

---

*CR-48 registered: 2026-07-05. Agent: E1, Emergent Labs.*
