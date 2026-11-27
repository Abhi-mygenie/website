# MyGenie Website — PRD & Decision Log
**Last updated:** 2026-11-27  
**Repo:** https://github.com/Abhi-mygenie/website.git (main)

---

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Clash Display + Poppins, built to static HTML via `yarn build` (craco + puppeteer prerender 40+ routes), served by `node scripts/static-server.js` on port 3000
- **Backend:** FastAPI (Python) on port 8001, MongoDB via motor, uvicorn with hot-reload
- **CRM:** Freshsales Suite (Freshworks Neo) — contacts created on form submit, updated on Calendly booking
- **AI voice agent:** Asha — calls every lead within 60s of Freshsales contact creation
- **Payments:** Razorpay
- **SMS/OTP:** Custom SMS panel (OTP_SMS_ENABLED)
- **Storage:** Local (dev) / AWS S3 (production)

---

## Campaign Pages (live, paid traffic)
| Page | Route | Form mode | Traffic source |
|------|-------|-----------|---------------|
| Homepage | `/` | Full form (6 fields) | Google Ads + Meta |
| Petpooja comparison | `/petpooja-alternative` | shortForm (3 req + 1 opt) ← **CR-261 will fix** | Google Ads |

---

## CR Registry

| CR | Title | Priority | Status | File |
|----|-------|----------|--------|------|
| CR-260 | Calendly Webhook Self-Recovery & Missed-Booking Backfill | P0 | Implemented — **pending production deploy** | `memory/CR-260.md` |
| CR-261 | Lead Form Unification + Asha Fields | P1 | Open — **awaiting Abhishek approval** + Freshsales CF creation | `memory/CR-261.md` |

---

## What Was Done — 2026-11-25 (Session 1: Initial Deployment)
- Cloned `https://github.com/Abhi-mygenie/website.git` (main) into `/app` via rsync (platform files preserved)
- Wrote `backend/.env` with all env vars from brief
- Collected secrets via UI: SMS_API_KEY, CMS_JWT_SECRET, CALENDLY_API_TOKEN, RECEIPT_EMAIL_API_KEY
- Installed missing Python packages: razorpay, reportlab, svglib, APScheduler, google-ads
- Built frontend (`yarn build` → 40+ routes prerendered) and restarted both services
- Site live on preview environment

## What Was Done — 2026-11-27 (Session 2: Bug Investigation + CR Registration)

### Calendly (CR-260)
- Discovered Calendly webhook subscription disabled since **6 Nov 2026** (203 missed bookings)
- Root-cause traced to 3 bugs in `server.py` (`_sync_calendly_webhook` + `_verify_calendly_signature`)
- Registered CR-260 covering Bug A (disabled state not cleaned up) + Bug B (early return ignores key mismatch) + Bug C (module-level frozen signing key)
- Manually deleted disabled subscription + re-registered with correct signing key (`...74cd`, 64 chars)
- Implemented CR-260 fix: 5 lines changed in `backend/server.py` — 8/8 tests passed
- Provided `server_cr260.zip` (at `/app/memory/server_cr260.zip`) for production deployment
- **Action required:** Deploy `server_cr260.py` to production + `sudo supervisorctl restart backend`
- **Action required:** Confirm production `CALENDLY_WEBHOOK_SIGNING_KEY` = key ending `...74cd`
- Identified **203 missed bookings** (6 Nov–25 Nov) needing backfill — script not yet built

### Lead Form Unification (CR-261)
- Read and analysed Asha brief (`memory/brief_asha_lead_form.md`) — Asha calls leads within 60s, needs context upfront
- Full investigation: mapped all current form fields → Freshsales CF names → gaps
- Registered CR-261 with field-by-field spec, Freshsales mapping, per-page changes, acceptance criteria
- Called design agent → `design_guidelines.json` updated with two-tier form architecture + chip spec
- **Rev 2:** Merged "Business Status" + "Years in business" into single 3-chip row ("How long running?") — eliminates duplicate, reduces Tier 1 to 6 elements

---

## Key Decisions Made (2026-11-27)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Calendly subscription manually re-registered with new key | Subscription disabled since 6 Nov — 203 missed bookings. Immediate fix before code fix reaches production |
| 2 | CR-260 fixes Bug A + C only; Bug B deferred | Bug C (module-level key) covers the production failure. Bug B (signing key rotation detection) needs MongoDB storage to implement cleanly — deferred to future CR |
| 3 | Merge Business Status + Years in Business into single chip | "Opening soon" = "Yet to open" — exact duplicate. 3-chip "How long running?" answers both. Shorter form = better conversion |
| 4 | Business status derived from vintage chip server-side | No extra question. `yet-to-open` → `cf_business_status=Opening soon`; `0-2` or `2+` → `cf_business_status=Running`. Both CFs written from one answer |
| 5 | Petpooja page: pre-select Software + Petpooja chips | Visitors arriving on Petpooja comparison page are almost certainly Petpooja users. Pre-selection = 0 clicks for most |
| 6 | Tier 2 (outlet type, outlet count) goes on thank-you page | These fields are nice-to-have for the demo specialist, not critical for Asha's 60s call. Post-submit avoids friction |
| 7 | `cf_lead_page` new CF to clean landing page tracking | `cf_outlet_type` currently polluted with landing page slugs. New dedicated CF frees it for clean segment data |

---

## Env Secrets (set via secure UI)

| Key | Status | Notes |
|-----|--------|-------|
| EMERGENT_LLM_KEY | Managed | Auto by platform |
| SMS_API_KEY | Set | OTP SMS |
| CMS_JWT_SECRET | Set | CMS admin login |
| CALENDLY_API_TOKEN | Set | Calendly API |
| CALENDLY_WEBHOOK_SIGNING_KEY | Set | 64-char key ending `...74cd` |
| RECEIPT_EMAIL_API_KEY | Set | Email receipts |

---

## Pending Actions (priority order)

### P0 — Do today
1. **Deploy CR-260** to production (`server_cr260.zip` → replace `backend/server.py` → restart)
2. **Confirm** production `CALENDLY_WEBHOOK_SIGNING_KEY` ends `...74cd` (subscription expires ~09:05 UTC 28 Nov if key mismatch persists)

### P1 — This week
3. **Abhishek approve CR-261** form design proposal
4. **Sales Ops create 3 Freshsales CFs:** `cf_business_status`, `cf_outlet_count`, `cf_lead_page`
5. **Build CR-261** (after approval + CFs created)
6. **Build backfill script** for 203 missed Calendly bookings (6 Nov–25 Nov)

### P2 — When ready
7. Add `FRESHSALES_API_KEY` + `FRESHSALES_BASE_URL` → enable live CRM sync
8. Add `META_ACCESS_TOKEN` → Meta ad spend dashboard
9. Set `RECEIPT_EMAIL_FROM` + `RECEIPT_EMAIL_PROVIDER` → email receipts
10. AWS S3 credentials for production media storage

---

## Backlog / Not yet started
- Google Ads OAuth (GOOGLE_ADS_CLIENT_ID, etc.)
- Calendly backfill script (CR-260 Part 2 — 203 missed bookings)
- Bug B from CR-260 (signing key rotation detection — MongoDB fingerprint approach)
- Email receipt flow
- AWS S3 production storage

---

## Key File Map

| File | Purpose |
|------|---------|
| `memory/CR-260.md` | Calendly fix spec — implemented, pending prod deploy |
| `memory/CR-261.md` | Lead form unification spec — awaiting approval |
| `memory/HANDOVER.md` | Full session handover |
| `memory/brief_asha_lead_form.md` | Original Asha brief from Abhishek (27 Nov 2026) |
| `design_guidelines.json` | Two-tier form design spec + chip component spec |
| `memory/server_cr260.py` | Fixed server.py ready for production deploy |
| `memory/server_cr260.zip` | Zipped version for download |
| `memory/server_production.py` | Production server.py as of 27 Nov (pre-fix, for reference) |
| `backend/tests/test_calendly_webhook_cr260.py` | 8 tests verifying CR-260 |
| `memory/test_credentials.md` | CMS login: admin/admin123, editor/editor123 |
