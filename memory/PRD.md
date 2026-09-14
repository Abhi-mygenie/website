# MyGenie Website – Deployment Record

## Original Problem Statement
Deploy the existing React frontend repo (https://github.com/Abhi-mygenie/website.git, branch: main) directly into /app and run it as-is, with no code edits.

## Architecture
- **Frontend**: React (CRACO) — static pre-rendered build served via `scripts/static-server.js` on port 3000
- **Backend**: FastAPI (multi-module) — MongoDB on external host 52.66.232.149 — port 8001
- **REACT_APP_BACKEND_URL**: https://beta.mygenie.online (external backend)

## What Was Done (2026-09-14)
1. Cloned https://github.com/Abhi-mygenie/website.git (branch: main) into /tmp/website_inspect
2. rsync'd repo's `/frontend/` → `/app/frontend/` and `/backend/` → `/app/backend/`
3. Created `/app/backend/.env` with all provided environment variables
4. Created `/app/frontend/.env` with REACT_APP_BACKEND_URL=https://beta.mygenie.online + platform vars
5. Installed backend pip dependencies (`--use-deprecated=legacy-resolver` for emergentintegrations/litellm conflict)
6. Installed frontend yarn dependencies
7. Built the React frontend: `yarn build` (CRACO build + prerender.js)
8. Restarted both services via supervisorctl
9. Site confirmed live at preview URL

## Key Notes
- Frontend `start` script runs `node scripts/static-server.js` (serves pre-built static files)
- Dev server available via `yarn dev` (craco start)
- Backend has Razorpay, Freshsales, Calendly, Meta Ads, Google Ads integrations (many commented/disabled)
- Calendly webhook signing key not set — non-blocking warning at startup
- CRM sync disabled (Freshsales API key not set)

## Backlog / P2
- Enable Razorpay, Freshsales, Meta Ads integrations when keys are ready
- Set CALENDLY_WEBHOOK_SIGNING_KEY to fix webhook registration
- Switch STORAGE_BACKEND to s3 for production with AWS keys
