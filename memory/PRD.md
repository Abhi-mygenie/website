# MyGenie POS Website — PRD

## Original Problem Statement
Pull code from `https://github.com/Abhi-mygenie/website.git` (branch `30-june`), wipe /app, preserve workspace files, set up the project, install dependencies, make it run. Then read HANDOVER.md and summarize next tasks.

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Craco + Radix UI + ShadCN components
- **Backend:** Python FastAPI + Motor (async MongoDB driver) + APScheduler
- **Database:** MongoDB Atlas (remote, user-managed)
- **Integrations:** Freshsales CRM, Meta Ads API, Google Ads API, Razorpay, S3 storage, Calendly

## What's Been Done (2026-06-30)
- Cloned repo from GitHub (branch `30-june`) into /app
- Preserved `.git`, `.emergent`, `frontend/.env`, `backend/.env`, supervisor configs
- Installed all Python (pip) and Node (yarn) dependencies
- Started backend (FastAPI on port 8001) and frontend (React on port 3000) via supervisor
- Both services running and website loads successfully
- Read and summarized HANDOVER.md for next task discovery

## Current State
- Website is up and running at preview URL
- Backend API responding on /api routes
- Frontend compiled successfully (minor lint warnings only)
- User will manually configure `.env` files for production DB and API keys

## Pending CRs (from HANDOVER.md)
### P0 — Critical
- **CR-35:** Leads Table to include `backfilled_leads` + Direct Lead Attribution default
- **CR-36:** Meta Spend Date Filtering (funnel shows lifetime instead of selected period)
- **CR-37:** Google Ads Spend Missing Date Ranges

### P1 — Medium
- **CR-38:** Move Ad Spend Upload Widget to Ads Intelligence Screen (UX cleanup)

### P2 — Verify
- **CR-34:** Verify Historical Lead Backfill (1,613+ docs, 919+ attributed)

## Next Tasks
- Owner to update `.env` files with production credentials
- Discovery + impact analysis for CR-35, CR-36, CR-37, CR-38
- Verify CR-34 backfill results
