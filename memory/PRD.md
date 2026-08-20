# MyGenie Website — PRD & Project Memory

## Original Problem Statement
Deploy the existing React frontend repo directly into `/app` and run it as-is, with no code edits.
- Source: https://github.com/Abhi-mygenie/website.git (branch: main)
- No code edits — deploy and run as-is
- Env variables: placeholders for now; real values to be supplied later
- Platform files and folders preserved during the clear-and-clone
- No testing agent calls

## Architecture
- **Frontend**: React (CRA + CRACO) on port 3000 — MyGenie POS marketing website
- **Backend**: FastAPI on port 8001 — multi-module backend (leads, payments, CRM, OTP, geo, funnel, storage, CMS auth, ads)
- **Database**: MongoDB (local) — `test_database`
- **Supervisor**: manages frontend + backend hot-reload processes

## What Was Done (2026-08-20)
1. Cloned `https://github.com/Abhi-mygenie/website.git` (branch: main) to `/tmp/website_clone`
2. Rsync'd repo into `/app` — excluded `.git/` and `.emergent/` (preserved platform markers)
3. Platform `.env` files preserved: `/app/frontend/.env`, `/app/backend/.env`
4. Added placeholder env vars to both `.env` files (all 50+ backend vars, 12 frontend vars)
5. Fixed integer-type Freshsales status env vars (set to `0`) to prevent import errors
6. Fixed JSON-type env vars (`FRESHSALES_LIFECYCLE_MAP={}`, `FRESHSALES_LOST_REASONS={}`)
7. Installed Python deps via `pip install -r requirements.txt` (excluding litellm conflict)
8. Installed frontend deps via `yarn install`
9. Restarted both services via supervisorctl

## Frontend Pages
- `/` — Home (hero, stats, trust logos)
- `/pricing` — Pricing plans
- `/solutions` + `/solutions/:slug` — Sector pages
- `/product` + `/product/:bucket` — Product pages
- `/customers` — Success stories
- `/roi` — ROI calculator
- `/resources` — Resources
- `/ai` — AI page
- `/blog` + `/blog/:slug` — Blog
- `/about`, `/contact` — Company pages
- `/terms`, `/privacy`, `/refund` — Legal
- `/leads` — Internal leads view (CMS-auth gated)
- `/petpooja-alternative` — Competitor comparison LP
- `/demo` — Demo landing page
- `/payment-success` — Payment success page

## Backend Modules
- `server.py` — Main FastAPI app (1780 lines)
- `leads.py` — Lead capture and management
- `payments.py` — Razorpay integration
- `otp.py` — SMS OTP verification
- `freshsales.py` — Freshsales CRM API
- `crm_sync.py` — CRM sync scheduler
- `funnel.py` — Funnel analytics
- `cms_auth.py` — CMS admin authentication
- `storage.py` — File storage (local/S3)
- `geo.py` — IP geolocation
- `ad_spend.py` — Ad spend tracking
- `ads_mcp.py` — Meta/Google Ads
- `antijunk.py` — Spam filtering
- `recommendations.py` — Product recommendations

## Env Variables Status
All placeholder values set. Real values needed for:
- `FRESHSALES_API_KEY` + `FRESHSALES_BASE_URL` — CRM integration
- `META_ACCESS_TOKEN`, `META_APP_ID`, `META_APP_SECRET`, `META_AD_ACCOUNT_ID` — Meta Ads
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — Payments
- `CALENDLY_API_TOKEN`, `CALENDLY_WEBHOOK_SIGNING_KEY` — Demo booking
- `GOOGLE_ADS_*` — Google Ads integration
- `SMS_*` — OTP SMS sending
- `CMS_JWT_SECRET` — CMS admin panel security (change from placeholder)
- `EMERGENT_LLM_KEY` — AI features
- `FRESHSALES_STATUS_*` and `FRESHSALES_LIFECYCLE_*` — CRM stage IDs

## P0 Backlog (After Env Keys Are Supplied)
- Replace all placeholder env vars with real values
- Set a strong `CMS_JWT_SECRET`
- Test lead capture form end-to-end
- Test Razorpay payment flow
- Verify Freshsales CRM sync

## P1 Backlog
- Configure Calendly webhook
- Set up Meta CAPI pixel events
- Configure Google Ads conversion tracking

## P2 Backlog
- S3 storage setup (currently local)
- Production build optimization
