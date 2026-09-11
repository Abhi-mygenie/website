# MyGenie Website — Deployment PRD

## Overview
Full-stack deployment of the MyGenie restaurant POS & billing software marketing/product website.

## Source
- Repo: https://github.com/Abhi-mygenie/website.git (branch: main)
- Type: Full-stack (FastAPI backend + React frontend, pre-built static serving)

## Architecture
- **Backend**: FastAPI (server.py + modules: leads, otp, payments, cms_auth, crm_sync, freshsales, storage, recommendations, funnel, etc.)
- **Frontend**: React (craco build → static bundle served via `node scripts/static-server.js`)
- **Database**: Remote MongoDB at `mongodb://appuser:...@52.66.232.149:27017/mygenie`
- **Storage**: Local (`STORAGE_BACKEND=local`)

## What Was Done (2026-09-11)
1. Cloned repo from GitHub to `/tmp/repo-full`
2. Rsynced all source files into `/app` (preserving `.emergent` markers, `.env` files)
3. Written backend `.env` with all provided env variables (remote Mongo, CRM keys, Calendly, GST, CMS, etc.)
4. Preserved platform `frontend/.env` (REACT_APP_BACKEND_URL = Emergent preview URL, WDS_SOCKET_PORT=443)
5. Installed backend Python dependencies (`pip install -r requirements.txt`)
6. Installed frontend Node dependencies (`yarn install`)
7. Built React app (`yarn build` → craco build + prerender)
8. Restarted backend and frontend services via supervisor
9. Memory directory synced from repo (handover notes, customer logos, etc.)

## Environment Variables (Backend)
- MONGO_URL: Remote MongoDB (52.66.232.149:27017/mygenie)
- DB_NAME: test_database
- CORS_ORIGINS: *
- STORAGE_BACKEND: local
- CRM_SYNC_ENABLED: true
- CALENDLY_API_TOKEN: configured
- FRESHSALES_*: all lead/lifecycle/status IDs configured
- GST_*: seller details configured
- CMS credentials: admin/admin123, editor/editor123
- EMERGENT_LLM_KEY: configured

## Services Status
- Backend: RUNNING (port 8001) — FastAPI with APScheduler, Calendly webhook, CRM sync
- Frontend: RUNNING (port 3000) — Static pre-built React bundle
- MongoDB (local): RUNNING (backup/unused, using remote)

## P0 Backlog
- Razorpay, Meta Ads, Google Ads, Freshsales API keys are commented out (inactive)
- Calendly webhook signing key not configured (non-blocking warning)
- RECEIPT_EMAIL_* not configured

## P1 Backlog
- Set up S3 storage for production (STORAGE_BACKEND=s3 with AWS keys)
- Configure Razorpay keys for payment flows
- Enable Freshsales CRM API key for live CRM sync
