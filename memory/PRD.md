# MyGenie Website — Platform PRD

## Original Problem Statement
Deploy the existing React frontend repo (https://github.com/Abhi-mygenie/website.git, branch: main) directly into `/app` and run it as-is, with no code edits.

## Architecture
- **Backend**: FastAPI (Python) — `/app/backend/server.py`, port 8001
- **Frontend**: React + CRACO — `/app/frontend/`, static build served on port 3000 via `node scripts/static-server.js`
- **Database**: Remote MongoDB at `52.66.232.149:27017/mygenie`

## What Was Done (2026-09-05)

### Deploy Session
- Added git remote: `https://github.com/Abhi-mygenie/website.git`
- Checked out `main` branch content into `/app` (backend, frontend, memory, tests)
- Wrote all provided env vars to `/app/backend/.env`
- Preserved platform env vars in `/app/frontend/.env` (REACT_APP_BACKEND_URL, WDS_SOCKET_PORT, ENABLE_HEALTH_CHECK)
- Ran `pip install -r requirements.txt --use-deprecated=legacy-resolver`
- Ran `yarn install` in `/app/frontend`
- Built: `yarn build` (craco build + prerender) → 65+ routes prerendered
- Restarted supervisor: backend + frontend both RUNNING
- Site confirmed live: MyGenie Restaurant POS homepage serving correctly

## Core Requirements
- No code edits — deploy as-is from repo
- Platform files preserved (supervisor configs, platform .env vars)
- Both backend (8001) and frontend (3000) must be running

## Known Non-Blocking Issues
- Calendly webhook registration returns 400 (signing_key not configured) — non-blocking
- Freshsales CRM sync skipped (API key not configured) — non-blocking

## Env Vars Applied
- `MONGO_URL` → remote MongoDB at 52.66.232.149
- `DB_NAME=test_database`
- `OTP_SMS_ENABLED=true`, SMS keys set
- `CALENDLY_API_TOKEN` set
- `EMERGENT_LLM_KEY` set
- CMS credentials: admin/admin123, editor/editor123
- All Freshsales lifecycle/status IDs set
- `STORAGE_BACKEND=local`

## Backlog / Next Steps
- P0: Deploy to production (mygenie.online) when ready
- P1: Add CALENDLY_WEBHOOK_SIGNING_KEY
- P1: Enable AWS S3 (STORAGE_BACKEND=s3 + AWS keys)
- P1: Add FRESHSALES_API_KEY + FRESHSALES_BASE_URL
- P2: Enable Razorpay payment keys
