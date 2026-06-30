# MyGenie POS Website — PRD

## Original Problem Statement
Pull code from `https://github.com/Abhi-mygenie/website.git` (branch `30-june`), set up the project, install dependencies, make it run. Read HANDOVER.md, do discovery + impact analysis for CR-34 to CR-38, then implement.

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Craco + Radix UI + ShadCN components
- **Backend:** Python FastAPI + Motor (async MongoDB driver) + APScheduler
- **Database:** MongoDB Atlas (remote, production)
- **Integrations:** Freshsales CRM, Meta Ads API, Google Ads API, Razorpay, S3 storage, Calendly
- **Production site:** https://www.mygenie.online
- **Production DB:** `test_database` on Atlas cluster `mygenie.xdqqdpi.mongodb.net`

## What's Been Done (2026-06-30)
- Cloned repo, installed dependencies, services running
- CR-34 verified: 1,615 backfilled_leads (919 with first_source) ✅
- Discovery + impact analysis completed for CR-35, CR-36, CR-37, CR-38
- Implementation plan written and approved by owner

## Current DB State
```
backfilled_leads:  1,615 docs (919 with first_source)
demo_requests:     16 docs
quotes:            1 doc
contact_messages:  0
ad_spend:          152 docs (143 meta_api + 9 google)
```

## Implementation Queue

### Phase 1: CR-35 — Patch 3 Lost Leads (DB operation, no code)
- Gffh (+919165729923) — fetch from Freshsales API → demo_requests
- Himanshu Gupta (7368833274) — copy from backfilled_leads → demo_requests
- Prajwal Chaubey (9120292964) — fetch from Freshsales API → demo_requests
- Status: **READY TO EXECUTE** (owner approved)

### Phase 2: CR-36 + CR-37 — Ad Spend Date Filtering (code changes)
- **CR-36:** Meta sync → daily breakdowns + incremental sync + date-filtered spend
- **CR-37:** Google sync → add segments.date + date fields + incremental sync
- Files: `ads_mcp.py`, `funnel.py` (4 functions total)
- Approach: Option A (daily breakdowns) + Option X (clean slate first sync, then incremental)
- Status: **READY TO EXECUTE** (owner approved)

### Deferred
- **CR-38:** Move AdSpendUpload widget to Ads Intelligence tab — owner will decide later
- **CR-35 Part B:** Direct lead attribution default (`first_source = "website"`) — deferred, not in scope

## Detailed Plan
See `/app/memory/IMPLEMENTATION_PLAN_CR35_36_37.md`

## Key Reference
- CMS Auth: `admin` / `admin123`
- POS DB: `mygenie_db` — DO NOT TOUCH
- Website DB: `test_database`
