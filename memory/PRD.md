# MyGenie Website — Deployment PRD

## Project
Deploy the existing MyGenie React/FastAPI website repo as-is into the Emergent platform environment.

## Source
- Repo: https://github.com/Abhi-mygenie/website.git
- Branch: 4sep
- Deployed: 2026-09-05

## Architecture
- **Frontend**: React (CRACO), pre-rendered static build served via `scripts/static-server.js` on port 3000
- **Backend**: FastAPI (uvicorn) with multiple modules on port 8001
- **Database**: Remote MongoDB at 52.66.232.149:27017 (mygenie db)
- **Supervisor**: manages both frontend and backend services

## What Was Done
1. Cloned repo (branch: 4sep) to /tmp/mygenie-repo
2. Replaced /app/backend and /app/frontend with cloned contents
3. Preserved supervisor configs (/etc/supervisor/conf.d/) and platform .env files
4. Wrote backend .env with all provided env variables (MONGO_URL, SMS, Freshsales, CMS, Calendly, etc.)
5. Frontend .env kept with platform REACT_APP_BACKEND_URL
6. Installed Python deps via `pip install -r requirements.txt --use-deprecated=legacy-resolver`
7. Installed Node deps via `yarn install --frozen-lockfile`
8. Built frontend via `yarn build` (craco build + prerender)
9. Restarted both services via supervisorctl

## Preserved Platform Files
- /app/frontend/.env (REACT_APP_BACKEND_URL, WDS_SOCKET_PORT, ENABLE_HEALTH_CHECK)
- /app/backend/.env (fully rewritten with provided env vars)
- /etc/supervisor/conf.d/ (all supervisor configs)

## Backend Modules
server.py, leads.py, otp.py, payments.py, freshsales.py, crm_sync.py, funnel.py, geo.py, storage.py, cms_auth.py, recommendations.py, ad_spend.py, ads_mcp.py, antijunk.py

## Status
- Backend: RUNNING (uvicorn on :8001) — responds to /api/
- Frontend: RUNNING (static-server.js on :3000) — full site with pre-rendered pages

## Notes
- Calendly webhook registration returned 400 (signing_key not provided) — non-blocking
- PRODUCTION AWS S3 and commented-out keys not written to .env (intentionally excluded)
- emergentintegrations + litellm version conflict resolved via --use-deprecated=legacy-resolver
