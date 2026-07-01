# HANDOVER — Session 2026-06-30

## For: Next Agent
## Task: Discovery + Impact Analysis for CR-35, CR-36, CR-37, CR-38 (and verify CR-34)
## IMPORTANT: Do NOT start implementation planning. Complete discovery, then STOP and ask all questions before proceeding.

---

## 1. What Was Done This Session

### 1.1 Codebase Setup
- Cloned `https://github.com/Abhi-mygenie/website.git` into `/app`
- Preserved `.git` and `.emergent` platform folders
- Installed all dependencies (pip + yarn), services running on supervisor
- Connected to **production MongoDB Atlas** cluster: `mongodb+srv://mygenie:***@mygenie.xdqqdpi.mongodb.net`
- Production website DB: `test_database` (NOT `mygenie_db` — that's the POS product DB)
- Production site: `https://www.mygenie.online`

### 1.2 Issues Found & Resolved

#### Issue 1: MongoDB Writes Blocked (CRITICAL — RESOLVED)
- **Root cause:** Atlas free tier quota full (514 MB / 512 MB limit)
- **Impact:** All MongoDB `insert_one` calls failing. Leads went to Freshsales (called first in code) but NOT to MongoDB
- **3 lost leads:** Gffh (facebook), Himanshu Gupta (facebook), Prajjwal Chaubey (google) — in Freshsales with `Website Demo Lead` tag but missing from `demo_requests`
- **Fix:** Dropped stale `pos_request_logs` (26.5 MB, debug logs May-Jun 2025). User also upgraded Atlas tier.
- **Verified:** Writes working. New lead "gyan" captured successfully after fix.

#### Issue 2: Meta Events Not Showing (CRITICAL — RESOLVED)
- **Root cause:** GTM Facebook Conversion API tag had `TEST13788` Test ID. This sandboxed ALL events — both server-side (CAPI) and browser-side (via event_id deduplication).
- **Fix:** User removed Test ID from GTM CAPI tag and published container.

#### Issue 3: Sync Data in Wrong DB (RESOLVED)
- When investigation started, `backend/.env` had `DB_NAME=mygenie_db`. The sync ran and wrote 1,606 `backfilled_leads` to `mygenie_db` (POS DB) instead of `test_database` (website DB).
- **Fix:** Merged all 1,606 docs from `mygenie_db.backfilled_leads` → `test_database.backfilled_leads` using `$ifNull` merge pattern (preserves existing non-null values, fills gaps from source).
- Cleaned up 9 website collections accidentally created in `mygenie_db` (all dropped).
- `mygenie_db` is back to POS-only (31 collections).

### 1.3 CR-34 Implemented (Historical Lead Backfill)

**What changed:**
1. `backend/crm_sync.py` line 485: `SOURCE_SYNC_AFTER_DATE` default changed from `"2026-06-20"` → `"2025-07-01"`
2. `backend/crm_sync.py` line 486: Added `SOURCE_SYNC_SCHEDULED_AFTER_DATE = "2026-06-20"` (for 6-hour scheduler — only recent leads)
3. `backend/crm_sync.py` line 495: `run_source_sync()` now accepts optional `after_date` parameter
4. `backend/server.py` line 1430: 6-hour `_sync_job` now also calls `run_source_sync(db, after_date=crm_sync.SOURCE_SYNC_SCHEDULED_AFTER_DATE)`
5. `backend/.env`: `SOURCE_SYNC_AFTER_DATE=2025-07-01`

**Result:**
- `test_database.backfilled_leads`: 1,613 docs (was 644)
- With `first_source` attribution: 919 (was 20)
- 3 lost leads now in `backfilled_leads` with full attribution

**IMPORTANT for production deployment:** The production `backend/.env` also needs `SOURCE_SYNC_AFTER_DATE=2025-07-01` (or remove the line to use code default). Also ensure `DB_NAME=test_database` in production.

---

## 2. Current Database State

### test_database (PRODUCTION WEBSITE DB)
```
backfilled_leads:  1,613 docs (919 with first_source)
demo_requests:     16 docs (Jun 24-30)
quotes:            1 doc
contact_messages:  0
ad_spend:          152 docs (143 meta_api + 9 google)
ad_spend_uploads:  0 (no CSV uploads — all data from live API)
crm_sync_log:      49
cms_content:       5
```

### mygenie_db (POS PRODUCT DB — DO NOT TOUCH)
- 31 POS collections (orders: 120K, order_items: 225K, customers: 12K, etc.)
- Zero website collections (cleaned up this session)
- `pos_request_logs` was dropped (stale debug data)

---

## 3. CRs Requiring Discovery + Impact Analysis

### CR-35: Leads Table to Include `backfilled_leads` + Direct Lead Attribution

**TWO parts:**

**Part A — Leads table gap:**
- `backend/leads.py` → `query_leads()` (line 150-159) reads ONLY from `demo_requests`, `quotes`, `contact_messages`
- It does NOT include `backfilled_leads` (1,613 docs synced from Freshsales)
- The funnel section (`funnel.py` → `_load_all()` line 116) DOES include `backfilled_leads`
- Result: Funnel shows 40 leads, leads table shows fewer. Lost leads (Gffh, Himanshu, Prajjwal) visible in funnel but not in leads table.
- **Needs:** A `_normalise_backfilled()` function in `leads.py` and adding `backfilled_leads` to the `sources` list in `query_leads()`
- **Watch out:** `backfilled_leads` has a different schema than `demo_requests`. Fields: `name`, `phone`, `email`, `city`, `first_source`, `first_medium`, `first_campaign`, `crm_status`, `freshsales_contact_id`, etc. No `attribution` nested object — attribution is flat fields.

**Part B — Direct lead attribution gap:**
- When a visitor comes to the website without UTM params (direct/organic) and submits the form:
  - `attribution.js` captures `first_utm_source: null` (nothing in URL to read)
  - Backend `_attribution_to_crm()` (line 204): skips setting `first_source` because value is null
  - Freshsales contact gets NO `first_source`
  - Source sync (`run_source_sync`) filters `first_source is NOT null` — these leads are invisible to sync
  - If MongoDB write fails (like the quota issue), these leads are unrecoverable
- **Fix agreed with owner:** Pass `first_source = "website"` as default in the backend when no UTM source is present
- **Where:** `_attribution_to_crm()` in `server.py` line 200-209 — add fallback
- **Impact:** Affects Freshsales native field mapping. All future direct leads will have `first_source: "website"`. The funnel already has a "Website" bucket that handles this.

**Key files:**
- `backend/leads.py` — lines 145-195 (query_leads, _normalise_* functions)
- `backend/server.py` — lines 182-240 (_attribution_to_crm)
- `backend/funnel.py` — lines 101-136 (_load_all — reference for how backfilled_leads is loaded)
- `frontend/src/lib/attribution.js` — lines 23-30, 64-84 (readParams, initAttribution)
- `frontend/src/pages/LeadsView.jsx` — the leads page

---

### CR-36: Meta Spend Date Filtering — Funnel Shows Lifetime Instead of Selected Period

**Problem:**
- Dashboard shows ₹11,07,220 Meta spend for Jun 21-30. This is actually LIFETIME spend (Jan 2025 – Dec 2025).
- `funnel.py` → `_get_spend_by_source()` (line 191-243) sums ALL `ad_spend` docs for a source — does NOT filter by `date_from`/`date_to` from the dashboard.
- The function receives no date parameters at all — see `get_funnel_by_source()` line 252-254: it passes dates to `_load_all()` (for leads) but NOT to `_get_spend_by_source()`.

**Data in ad_spend (Meta):**
- 143 docs with `source: "meta_api"`
- 17 campaign-level docs — all have `date_start: 2025-01-01, date_stop: 2025-12-31` (lifetime range from API sync)
- 40 adset-level, 86 ad-level (same spend, same dates — triple-counted if not filtered by level)
- The code correctly filters campaign-level only for the funnel (line 222: `match["level"] = "campaign"`)

**Root issue is TWO-fold:**
1. `_get_spend_by_source()` doesn't accept or use date filters
2. The Meta API sync (`ads_mcp.py` → `sync_meta()`) may be pulling lifetime data instead of daily breakdowns. Need to check what date_range params are being sent to the Graph API.

**Key files:**
- `backend/funnel.py` — lines 191-243 (_get_spend_by_source), lines 252-310 (get_funnel_by_source)
- `backend/ads_mcp.py` — lines 135-452 (sync_meta — check date_range params sent to Graph API)
- `frontend/src/components/funnel/FunnelBySource.jsx` — displays spend/CPL columns

---

### CR-37: Google Ads Spend Missing Date Ranges

**Problem:**
- Google's 9 `ad_spend` docs have `date_start: None, date_stop: None`
- Google spend shows ₹27,965 (also no date filtering, same issue as CR-36)
- `ads_mcp.py` → `sync_google()` (line 706) — need to check if date fields are being populated on insert

**Data:**
```
google / campaign: 3 docs, spend=₹27,965
google / adset:    3 docs, spend=₹27,965
google / ad:       3 docs, spend=₹27,965
```

**Tied to CR-36** — both need:
1. Date fields populated correctly during sync
2. `_get_spend_by_source()` to filter by date range

**Key files:**
- `backend/ads_mcp.py` — lines 706-740 (sync_google)
- `backend/funnel.py` — same as CR-36

---

### CR-38: Move Ad Spend Upload Widget to Ads Intelligence Screen

**Problem:**
- `AdSpendUpload.jsx` component is on the Leads page (`LeadsView.jsx` line 450)
- The leads table has zero dependency on ad spend data
- The funnel section on the same page DOES use ad spend for CPL columns
- With live Meta + Google API connections, the CSV upload is a backup/legacy feature
- Natural home: Ads Intelligence screen (where the live API sync controls already are)

**Key files:**
- `frontend/src/components/funnel/AdSpendUpload.jsx` — the upload component
- `frontend/src/pages/LeadsView.jsx` — line 11 (import), line 450 (render)
- Ads Intelligence page location: check `frontend/src/pages/` or `frontend/src/components/ads/`

**Low priority — UX cleanup only.**

---

## 4. Architecture Quick Reference

### Backend Flow: Lead Submission
```
User fills form → POST /api/demo-request
  → antijunk.looks_like_bot() check
  → antijunk.enforce_rate_limit()
  → freshsales.upsert_contact()     ← FIRST (CRM)
  → db.demo_requests.insert_one()   ← SECOND (MongoDB)
  → return response
```
If MongoDB fails after Freshsales succeeds → lead in CRM but not in DB.

### Backend Flow: CRM Sync (every 6 hours + manual trigger)
```
_sync_job():
  → crm_sync.run_sync(db)           ← Stage sync: pulls contacts at demo_scheduled/given/won/lost
  → crm_sync.run_source_sync(db, after_date="2026-06-20")  ← Source sync: pulls contacts with first_source
```

### Key Env Vars (backend/.env)
```
MONGO_URL=mongodb+srv://...@mygenie.xdqqdpi.mongodb.net/mygenie?retryWrites=true&w=majority
DB_NAME=test_database
SOURCE_SYNC_AFTER_DATE=2025-07-01
FRESHSALES_API_KEY=...
FRESHSALES_BASE_URL=https://mygenie-1.myfreshworks.com/crm/sales/api
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
```

### CMS Auth
- Username: `admin`, Password: `admin123` (from env vars `CMS_USER_*`)
- JWT auth on all `/cms/*` endpoints

---

## 5. Instructions for Next Agent

1. **Read this document fully before starting**
2. **Read `CR_Control_Dashboard.md`** — has all CR history and the 5-gate model
3. **Read `PROJECT_DOCS_INDEX.md`** — master doc map
4. **Connect to production DB** — verify `DB_NAME=test_database` in `backend/.env`
5. **For each CR (35, 36, 37, 38):**
   - Do discovery: read the relevant code files listed above
   - Do impact analysis: what changes, what breaks, what's the blast radius
   - **STOP and ask all questions** before planning implementation
   - Do NOT start implementation planning until owner approves
6. **Verify CR-34** — run `db.backfilled_leads.count_documents({})` and confirm 1,613+ docs with 919+ attributed
7. **Do NOT write to `mygenie_db`** — that's the POS product database. All website operations use `test_database`.

---

## 6. Known Issues / Warnings

- **Atlas storage:** User upgraded from free tier but monitor usage. `mygenie_db` has ~333 MB of POS data.
- **Production deployment:** Code changes from this session (CR-34) are in this pod only. Need to be deployed to production (`www.mygenie.online`). Production env needs `SOURCE_SYNC_AFTER_DATE=2025-07-01`.
- **Meta API token:** Check if `META_ACCESS_TOKEN` is still valid (60-day tokens). There's a refresh endpoint at `POST /api/cms/ads/meta/refresh-token`.
- **6-hour scheduler source sync** uses `2026-06-20` cutoff (intentional — only recent leads for scheduled runs). Manual trigger uses `2025-07-01` (historical).
- **`pos_request_logs` dropped** from `mygenie_db` — was 16,190 stale debug logs (May-Jun 2025). Cannot be restored.

---

*Handover prepared: 2026-06-30. Session agent: E1, Emergent Labs.*
