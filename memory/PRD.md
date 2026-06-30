# MyGenie POS Website - PRD

## Original Problem Statement
Pull code from https://github.com/Abhi-mygenie/website.git (branch: 30-june), wipe local /app, preserve workspace files (.git, .emergent, frontend/.env, backend/.env), set up the project, install dependencies, and make the website run. No code edits. Environment variables to be added manually by user post-deployment.

## Architecture
- **Frontend**: React (CRA + Craco) with Tailwind CSS, Radix UI, Framer Motion, Recharts
- **Backend**: Python FastAPI with Motor (async MongoDB driver)
- **Database**: MongoDB (external — user will configure MONGO_URL in backend/.env)
- **Integrations**: Freshsales CRM, Calendly, Razorpay, Google Ads OAuth, Meta Ads, OTP, S3 storage

## What's Been Implemented (2026-06-30)
- [x] Pulled repo from GitHub (branch: 30-june) into /app
- [x] Preserved workspace files (.git, .emergent, frontend/.env, backend/.env)
- [x] Installed backend Python dependencies (requirements.txt via pip --no-deps to resolve litellm conflict)
- [x] Installed frontend Node.js dependencies (yarn install)
- [x] Backend running on port 8001 (FastAPI + Uvicorn via Supervisor)
- [x] Frontend running on port 3000 (Craco/CRA dev server via Supervisor)
- [x] Website rendering correctly with all pages accessible

## Environment Variables (User Responsibility)
User will configure these in backend/.env after deployment:
- MONGO_URL (external MongoDB connection string)
- DB_NAME
- Freshsales API keys
- Razorpay keys
- Meta/Google Ads tokens
- OTP service credentials
- S3 storage config
- Other service-specific env vars

## CR-40: OTP-Verified Tag + Backfill (2026-06-30)
- [x] **Part 1**: `server.py:278` — new demo leads with verified OTP now get `"OTP-Verified"` tag in Freshsales (was missing)
- [x] **Part 2**: `crm_sync.py:run_otp_backfill()` — extended to also add `"OTP-Verified"` tag to existing Freshsales contacts where `cf_rooms = "Yes"`. Triggered via `POST /api/cms/sync/otp-backfill`
- Impact: Zero risk — tags are additive (merge, not replace). MongoDB `otp_verified` boolean unchanged. Funnel/leads queries unaffected.

## Backlog
- P0: Run backfill via POST /api/cms/sync/otp-backfill to tag ~633 existing verified contacts
- P0: ~~Register Calendly webhook to current env~~ ✅ DONE (2026-06-30)
- P1: **CR-42: Zero Hardcoded Values** — extract all hardcoded config to env vars (`/app/memory/CR-42_Zero_Hardcoded_Values.md`)
- P2: Production build optimization (yarn build)
- P3: SSL/domain configuration for production
