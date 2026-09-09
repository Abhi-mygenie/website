# MyGenie Website — Deployment PRD

## Source
- Repo: https://github.com/Abhi-mygenie/website.git
- Branch: main

## Architecture
- **Frontend**: React (craco build) → prerendered static site served via `scripts/static-server.js` on port 3000
- **Backend**: FastAPI (server.py + leads.py, otp.py, payments.py, cms_auth.py, freshsales.py, crm_sync.py, storage.py, funnel.py, geo.py, etc.) on port 8001
- **Database**: External MongoDB at 52.66.232.149:27017 (mygenie DB, authSource=admin)
- **Routing**: All backend routes prefixed `/api`

## What's Been Implemented (2026-09-09)
- Cloned `main` branch of `https://github.com/Abhi-mygenie/website.git` into `/app`
- Synced `backend/` and `frontend/` directories (rsync, preserving platform files)
- Written `backend/.env` with all provided env vars (Mongo, SMS, Freshsales, Calendly, GST, CMS, etc.)
- Installed all Python dependencies (`requirements.txt` + `razorpay`)
- Built frontend (`yarn build` → craco build + prerender, ~155s)
- Both backend and frontend running via supervisor
- Site loading at preview URL

## Environment
- `frontend/.env`: `REACT_APP_BACKEND_URL` = platform preview URL (protected), `WDS_SOCKET_PORT=443`
- `backend/.env`: External Mongo, all feature flags, SMS/OTP, Freshsales IDs, Calendly token

## Backend Routes (key)
- `GET /api/` — health
- `POST /api/demo-request` — lead capture
- `POST /api/otp/send`, `POST /api/otp/verify` — OTP flow
- `POST /api/quote`, `POST /api/contact`
- `GET/POST /api/cms/*` — CMS management
- `POST /api/calendly/webhook` — Calendly webhook

## Preserved Platform Files
- `/app/.emergent/` — platform markers & cron
- `/app/memory/` — this folder
- Supervisor configs (`/etc/supervisor/conf.d/`)
- Nginx configs (`/etc/nginx/`)
