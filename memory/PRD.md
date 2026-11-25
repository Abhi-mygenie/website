# MyGenie Website — PRD & Deployment Log

## Original Problem Statement
Deploy the existing React frontend repo (https://github.com/Abhi-mygenie/website.git, branch: main) directly into `/app` and run it as-is with no code edits.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + craco, built to static files, served by `node scripts/static-server.js` on port 3000
- **Backend**: FastAPI (Python) on port 8001, MongoDB via motor
- **Static Serving**: Pre-rendered 40+ routes via puppeteer in `yarn build`, then served with gzip + SPA fallback

## What Was Done (2026-11-25)
- Cloned `https://github.com/Abhi-mygenie/website.git` (main) into `/tmp/website-clone`
- Synced `backend/` and `frontend/` to `/app` via rsync (platform files preserved: .emergent, .git, memory)
- Wrote `backend/.env` with all provided env vars (Mongo, SMS/OTP, Freshsales, Calendly, GST, CMS, etc.)
- Collected secrets securely via UI: SMS_API_KEY, CMS_JWT_SECRET, CALENDLY_API_TOKEN, RECEIPT_EMAIL_API_KEY
- EMERGENT_LLM_KEY managed automatically by platform
- Installed missing Python packages: razorpay, reportlab, svglib, APScheduler, google-ads
- Ran `yarn install` (added react-helmet-async, react-markdown, remark-gfm, xlsx)
- Ran `yarn build` → craco webpack build + prerender (40+ routes)
- Restarted backend + frontend via supervisorctl
- Backend live at `/api/`, frontend static server serving pre-rendered build on port 3000

## Core Requirements
- No code edits — repo deployed as-is
- Platform files preserved during sync
- All env vars applied from problem statement

## Env Variables Applied
### Backend (.env)
- MONGO_URL, DB_NAME, CORS_ORIGINS (protected/system)
- STORAGE_BACKEND=local
- OTP_SMS_ENABLED=true, SMS_BASE_URL, SMS_USERNAME, SMS_SENDER, SMS_ROUTE, SMS_TEMPLATE_ID
- All FRESHSALES_* vars (lead sources, lifecycle, status IDs, tags)
- GST_* vars (seller name, GSTIN, address, HSN/SAC, invoice prefix)
- CMS_USER_1=admin, CMS_PASS_1=admin123, CMS_USER_2=editor, CMS_PASS_2=editor123
- CRM_SYNC_ENABLED=true, PAYMENT_CURRENCY=INR
- META_GRAPH_API_VERSION=v21.0, CALENDLY_WEBHOOK_CALLBACK_URL
- Secrets (injected by platform): SMS_API_KEY, CMS_JWT_SECRET, CALENDLY_API_TOKEN, RECEIPT_EMAIL_API_KEY, EMERGENT_LLM_KEY

### Frontend (.env)
- REACT_APP_BACKEND_URL (platform-managed, points to preview backend)
- WDS_SOCKET_PORT=443, ENABLE_HEALTH_CHECK=false

## Backlog / Not Yet Set
- FRESHSALES_API_KEY / FRESHSALES_BASE_URL (CRM sync disabled — needs keys)
- CALENDLY_WEBHOOK_SIGNING_KEY (Calendly webhook signing — startup warning only)
- RECEIPT_EMAIL_FROM / RECEIPT_EMAIL_PROVIDER (email receipts)
- Google Ads OAuth (GOOGLE_ADS_CLIENT_ID, etc.)
- META_ACCESS_TOKEN (Meta ad spend tracking)
- AWS S3 (production only: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME)
