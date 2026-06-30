# CR-19 — Lead Funnel / Ad Performance Dashboard
## Implementation Handover (Updated: 2026-06-24)

---

## Status: IMPLEMENTED — Pending User Validation

All backend and frontend work is complete. User is validating data accuracy.

---

## What Was Built

### Backend Files

| File | Status | Notes |
|---|---|---|
| `backend/crm_sync.py` | ✅ Complete | 6-hour APScheduler sync + source backfill + OTP backfill |
| `backend/funnel.py` | ✅ Complete | Funnel aggregation, source label logic, by-source breakdown |
| `backend/freshsales.py` | ✅ Updated | Retry logic on 429/5xx added to `_request()` |
| `backend/server.py` | ✅ Updated | 8 new endpoints, APScheduler startup, webhook receiver |

### Frontend Files

| File | Status | Notes |
|---|---|---|
| `frontend/src/components/funnel/FunnelPanel.jsx` | ✅ Complete | Main funnel bar (OTP column hidden per user request) |
| `frontend/src/components/funnel/FunnelBySource.jsx` | ✅ Complete | Per-source breakdown table |
| `frontend/src/components/funnel/LostPanel.jsx` | ✅ Complete | Lost reasons breakdown |
| `frontend/src/components/funnel/SyncStatus.jsx` | ✅ Complete | Last sync time + manual trigger |
| `frontend/src/pages/LeadsView.jsx` | ✅ Updated | All 4 panels integrated above leads table |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cms/funnel/summary` | Admin | Overall funnel counts + rates |
| GET | `/api/cms/funnel/by-source` | Admin | Per-source breakdown |
| GET | `/api/cms/funnel/lost` | Admin | Lost reasons |
| GET | `/api/cms/sync/status` | Admin | Last sync time + stats |
| POST | `/api/cms/sync/trigger` | Admin | Manual 6-hour sync |
| POST | `/api/cms/sync/backfill` | Admin | General backfill (all funnel-stage contacts) |
| POST | `/api/cms/sync/source-backfill` | Admin | Paid source backfill (Google/Facebook, Jul 2025–Jun 2026) |
| POST | `/api/cms/sync/otp-backfill` | Admin | Mark otp_verified from Freshsales cf_rooms="Yes" |
| POST | `/api/webhooks/freshsales/stage` | None | Freshsales Journey webhook receiver |

---

## Data Architecture

### Source of Truth

| Stage | Source | Field |
|---|---|---|
| Lead In | MongoDB `backfilled_leads` (first_source ≠ null) + `demo_requests` | `created_at` |
| OTP Verified | MongoDB `otp_verified = True` (all collections) | `otp_verified` |
| Demo Scheduled | crm_status IN {demo_scheduled, demo_given, won, lost} | `crm_status` |
| Demo Given | crm_status IN {demo_given, won, lost} | `crm_status` |
| Won | crm_status = won | `crm_status` |
| Lost | crm_status = lost | `crm_status` |

### Collections

| Collection | Count | Contents |
|---|---|---|
| `backfilled_leads` | 1,252 | 970 with source (Google/Facebook, Jul 2025–Jun 2026) + 282 no-source |
| `demo_requests` | 0 (all test data deleted) | New website form submissions |
| `crm_stage_events` | 0 | Webhook stage transition log (forward-looking) |

### Key Design Decisions

1. **Funnel only counts `backfilled_leads` with `first_source ≠ null`** — prevents 282 no-source contacts from polluting the paid ad performance funnel.
2. **crm_status from stage-filtered queries** — Freshsales `contact_status_id` returns null on GET /contacts/{id} (write-only field). Status is inferred from which filter query matched the contact.
3. **Attribution preserved via `$ifNull`** — regular 6-hour sync won't overwrite `first_source`/`first_medium` set by the full source backfill.
4. **OTP Verified = `cf_rooms = "Yes"`** in Freshsales API (633 paid contacts marked).

---

## Historic Data Backfill Summary

### What Was Pulled
- **Source**: Google (`google`, `google1`, `Google`) + Facebook (`facebook`, `facebook-SiteLink`, `fb`)
- **Date range**: July 1, 2025 – June 24, 2026
- **Total**: 970 contacts
- **With funnel stage**: 213 contacts
  - demo_scheduled: 19 | demo_given: 47 | won: 71 | lost: 76
- **Pre-funnel (crm_status=None)**: 757 contacts — count as Lead In only
- **OTP verified**: 633 contacts marked from `cf_rooms="Yes"`

### What Was NOT Pulled (Accepted Gaps)
- Contacts with empty `first_source` (78,529) — not paid source, excluded from dashboard
- `website` source (6 contacts in range) — not yet added, pending user confirmation of label
- Stage journey history — current status only, no historical path tracking (by design)

---

## Freshsales Sync Configuration

### 6-Hour Background Sync
- Runs via APScheduler on app startup, every 6 hours
- Pulls contacts at 4 funnel stages (Demo Scheduled, Demo Given, Won, Lost)
- Updates `crm_status` in `backfilled_leads`, `demo_requests`, `quotes`, `contact_messages`
- Rate limiting: 2s sleep between pages, exponential backoff on 429 (up to 3 retries)

### Webhook (Phase 2 — Partial)
- Endpoint built: `POST /api/webhooks/freshsales/stage`
- Receives: `{contact_id, email, phone, stage, updated_at}` via Freshsales Journey (Simple payload)
- Logs to `crm_stage_events` collection
- **Blocked**: Preview URL blocked by Cloudflare (Freshworks IPs rejected). Will work on production domain.
- Freshsales setup: 4 Journeys required (one per stage: demo_scheduled, demo_given, won, lost)

---

## Env Vars Added

```
FRESHSALES_STATUS_DEMO_GIVEN_ID=402001226981
FRESHSALES_STATUS_WON_ID=402001137712
FRESHSALES_STATUS_LOST_ID=402001137713
CRM_SYNC_ENABLED=true
```

---

## Known Issues / Open Items

| Item | Priority | Notes |
|---|---|---|
| Webhook blocked on preview URL | P1 | Will work after production deploy |
| `website` source (6 contacts) not in backfill | P2 | User to confirm label before adding |
| Demo Scheduled/Given count = current stage only | By design | Journey history not available in Freshsales API |
| CR-18 (new field mapping from Jun 25) | P0 | Not yet implemented — next priority |

---

## Source Label Mapping

| `first_source` value(s) | Dashboard Label |
|---|---|
| google, google1, Google, or any containing "google" | Google |
| facebook, facebook-SiteLink, fb, or any containing "facebook" | Meta |
| gclid present | Google |
| fbclid present | Meta |
| backfilled=True, first_source=null | Legacy (pre-launch) — excluded from funnel |
| Other non-empty source | Other |

---

## Pending for Next Session (CR-19 Validation)

User is validating data. If issues found:
1. Check `first_source` breakdown: `db.backfilled_leads.distinct("first_source")`
2. Check funnel numbers: `GET /api/cms/funnel/summary`
3. Re-run OTP backfill if count seems low: `POST /api/cms/sync/otp-backfill`
4. For `website` source contacts: add to `_SOURCE_BUCKETS` in `crm_sync.py`
