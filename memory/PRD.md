# MyGenie Website — Deployment PRD

## Problem Statement
Deploy the existing React frontend + FastAPI backend repo (https://github.com/Abhi-mygenie/website.git, branch `14sep`) directly into `/app` and run it as-is, with no code edits.

## Architecture
- **Frontend**: React (CRACO) — pre-built static build served via `node scripts/static-server.js` on port 3000
- **Backend**: FastAPI (uvicorn) — multi-module Python app on port 8001
- **Database**: Remote MongoDB at `mongodb://appuser:***@52.66.232.149:27017/mygenie`
- **Platform**: Emergent preview (Kubernetes pod, supervisor-managed)

## What Was Done (2026-09-14)
1. Cloned repo (`branch: 14sep`) into `/tmp/repo_preview`
2. `rsync`'d `backend/` → `/app/backend/` (full replace)
3. `rsync`'d `frontend/` → `/app/frontend/` (excluded `.env` to preserve platform URL)
4. `rsync`'d `memory/` → `/app/memory/`
5. Wrote `/app/backend/.env` with all user-provided env variables (remote MongoDB, SMS, Freshsales, Calendly, GST, etc.)
6. Kept `/app/frontend/.env` platform values intact (`REACT_APP_BACKEND_URL`, `WDS_SOCKET_PORT=443`, `ENABLE_HEALTH_CHECK=false`)
7. Ran `yarn install` in `/app/frontend` (1112 packages)
8. Built frontend: `yarn build` → `craco build` + prerender (60+ routes)
9. Installed missing Python packages: `razorpay`, `apscheduler`
10. Restarted both services via supervisor

## Services Status
- Frontend: RUNNING — static build served on port 3000
- Backend: RUNNING — FastAPI on port 8001, connected to remote MongoDB

## Key Notes
- `yarn start` = `node scripts/static-server.js` (serves pre-built `build/`)
- `yarn dev` = `craco start` (hot-reload dev mode, not used)
- Backend Calendly webhook warning is expected (signing key commented out in env)
- No code edits made — deployed as-is from repo

## Backend Env Variables
See `/app/backend/.env` — includes MONGO_URL, DB_NAME, SMS, Freshsales, Calendly, GST, CMS, EMERGENT_LLM_KEY

## Backlog / Known Issues
- Calendly webhook signing key not set (intentional — commented out in provided env)
- AWS S3 keys not set (STORAGE_BACKEND=local, production-only)
- Razorpay/Meta/Google Ads keys commented out (not needed for preview)
