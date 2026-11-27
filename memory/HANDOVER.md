# Session Handover — MyGenie Website
**Date:** 2026-11-27  
**Session type:** Bug investigation, CR registration, implementation, deployment prep

---

## What Was Done This Session

### 1. Initial Deployment (task start)
- Cloned `https://github.com/Abhi-mygenie/website.git` (main) into `/app`
- Synced backend + frontend via rsync, preserved platform files
- Wrote `backend/.env` with all env vars from problem statement
- Collected secrets via UI: `SMS_API_KEY`, `CMS_JWT_SECRET`, `CALENDLY_API_TOKEN`, `RECEIPT_EMAIL_API_KEY`
- Installed missing Python packages (razorpay, reportlab, svglib, APScheduler, google-ads)
- Built frontend (`yarn build` → craco + prerender, 40+ routes)
- Both backend (port 8001) and frontend static server (port 3000) running

### 2. Calendly Bug Investigation
- Discovered Calendly webhook subscription had been **disabled since 6 Nov 2026**
- Root cause traced to 3 bugs in `_sync_calendly_webhook()` and `_verify_calendly_signature()`
- Registered as **CR-260** (see `/app/memory/CR-260.md`)

### 3. One-Time Manual Fix (this session)
- Deleted the disabled Calendly subscription via API (`DELETE /webhook_subscriptions/9169eafd-...`)
- Collected `CALENDLY_WEBHOOK_SIGNING_KEY` (64-char key, ends `...74cd`) via secrets UI
- Re-registered webhook subscription with correct signing key → **active** again
- Subscription UUID: `5fb6bf30-8c5f-4cfc-89a4-ba36974ca538`

### 4. CR-260 Code Fix — Implemented & Tested
- Fixed Bug C (line 482): removed frozen module-level `CALENDLY_WEBHOOK_SIGNING_KEY` variable
- Fixed Bug A (line 1679): `_sync_calendly_webhook()` now deletes `disabled` subscriptions too
- 8/8 tests passed — test file at `backend/tests/test_calendly_webhook_cr260.py`
- Deploy artifact validated: `server_cr260.zip` — diff confirmed only 6 lines differ from production

### 5. Missing Bookings Identified
- **203 bookings missed** between 6 Nov 2026 → 25 Nov 2026 (subscription disabled period)
- Backfill NOT yet run — pending production DB access
- All 203 emails/names/meeting-times available from Calendly API (see backfill plan in CR-260)

---

## Current State

| Component | Status |
|-----------|--------|
| Preview frontend | Running (static server port 3000) |
| Preview backend | Running (uvicorn port 8001), CR-260 fix applied |
| Calendly subscription | Active (`5fb6bf30-...`) — registered with `...74cd` key |
| Production (mygenie.online) | OLD `server.py` — CR-260 NOT yet deployed |
| Production subscription | Active but `retry_started_at` set (production still rejecting, old code) |

---

## Critical: What Must Happen Next

### Priority 1 — Deploy CR-260 to production (URGENT — within 24h of 09:05 UTC 27 Nov)
The production Calendly subscription will be **disabled again by ~09:05 UTC 28 Nov** if the fix is not deployed.

Steps:
1. Download `server_cr260.zip` from `https://mygenie-web--587byhb7.preview.emergentagent.com/server_cr260.zip`
2. On production server:
   ```bash
   cp /app/backend/server.py /app/backend/server.py.bak.20261127
   # Replace server.py with server_cr260.py from zip
   sudo supervisorctl restart backend
   tail -20 /var/log/supervisor/backend.err.log
   # Expect: "CR-40: Calendly webhook already active — no action needed"
   # No 400/401 errors = fix is working
   ```

### Priority 2 — Backfill 203 missed bookings
Once production DB is accessible:
```bash
python scripts/cr260_backfill_calendly.py --from 2026-11-06 --to 2026-11-25 --dry-run
python scripts/cr260_backfill_calendly.py --from 2026-11-06 --to 2026-11-25
```
*(Script needs to be built — see CR-260 spec)*

### Priority 3 — Set up Freshsales API key
CRM sync is currently disabled (`Freshsales not configured — skipping`).
Add `FRESHSALES_API_KEY` and `FRESHSALES_BASE_URL` to production environment.

### Priority 4 — CALENDLY_WEBHOOK_SIGNING_KEY on production
Confirm production server's `CALENDLY_WEBHOOK_SIGNING_KEY` = key ending `...74cd`.
If not, the webhook will reject again after restart.

---

## Env Secrets Set This Session (via secure UI)

| Key | Status | Notes |
|-----|--------|-------|
| `EMERGENT_LLM_KEY` | Managed | Auto-managed by platform |
| `SMS_API_KEY` | Set | For OTP SMS |
| `CMS_JWT_SECRET` | Set | CMS admin login |
| `CALENDLY_API_TOKEN` | Set | For Calendly API calls |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Set | 64-char key, ends `...74cd` |
| `RECEIPT_EMAIL_API_KEY` | Set | Email receipts |

---

## Key File Locations

| File | Purpose |
|------|---------|
| `/app/memory/CR-260.md` | Full CR spec — bugs, acceptance criteria, backfill plan |
| `/app/memory/server_cr260.py` | Fixed `server.py` ready for production deploy |
| `/app/memory/server_cr260.zip` | Zipped version for download |
| `/app/memory/server_production.py` | Production's current `server.py` as of 2026-11-27 (pre-fix) |
| `/app/memory/cr260_server.patch` | Git patch for the 6 changed lines |
| `/app/memory/PRD.md` | Full project PRD and architecture |
| `/app/memory/test_credentials.md` | CMS login credentials |
| `/app/backend/tests/test_calendly_webhook_cr260.py` | 8 tests for CR-260 verification |

---

## CMS Credentials (for reference)
- `/leads` login: `admin / admin123`
- Editor login: `editor / editor123`

---

## Backlog (not done this session)
- Freshsales API integration (needs `FRESHSALES_API_KEY`)
- Calendly backfill script (CR-260 Part 2)
- Google Ads / Meta API credentials
- Email receipts (`RECEIPT_EMAIL_FROM`, `RECEIPT_EMAIL_PROVIDER`)
- AWS S3 for production media storage
- Bug B from CR-260 (signing key rotation detection — deferred, covered by Bug C fix)
