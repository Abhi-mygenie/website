# CR-26 — CRM Sync Overhaul + Lead Management + Hardcoding Removal

**Date:** 2026-06-27
**Raised by:** Owner
**Priority:** P0 (sync logic), P1 (delete, hardcoding), P2 (HTML docs)
**Status:** G2 — Planning Complete

---

## 1. SCOPE — 4 ITEMS

| # | Item | Priority | Effort |
|---|---|---|---|
| A | **Sync logic fix** — pull all Freshsales contacts where `first_source` is not null, regardless of stage | P0 | M (2-3 hrs) |
| B | **Delete button** — per-lead delete from MongoDB (not Freshsales) with warning modal | P1 | S (1 hr) |
| C | **Remove all hardcoding** — move 9 hardcoded values to .env | P1 | M (1.5 hrs) |
| D | **HTML versions** of Freshsales_Field_Contract_v2.md and CR-25_Attribution_Field_Expansion.md | P2 | S (30 min) |

---

## 2. ITEM A — SYNC LOGIC FIX

### 2A. Current Problem

The CRM sync has two code paths, both broken for "New" stage leads:

**Path 1 — Regular sync (`_run`, every 6 hours):**
```python
for crm_status, status_id in STAGE_STATUS_IDS.items():
    contacts = freshsales.get_contacts_by_status(status_id)
```
Only fetches: demo_scheduled, demo_given, won, lost.
**"New" stage is excluded** → 78+ leads invisible.

**Path 2 — Source backfill (`run_source_backfill`):**
- Fetches by `first_source` ✅ but...
- **Hardcoded date cutoff** `_BACKFILL_TO = "2026-06-24"` → leads after Jun 24 excluded
- Only matches specific string variants: `["google", "google1", "Google", "Facebook", "fb", ...]`
- Writes `first_source` from bucket label but `first_medium`, `first_campaign` etc. are all **None** (partial attribution)

**Result:** A lead like S Sayyad (Jun 26, first_source=facebook, status=New) has full data in Freshsales but arrives in MongoDB with all attribution fields null.

### 2B. New Logic

**Replace source backfill with a new sync pass that runs alongside the existing stage-based sync:**

```
New Pass — "Source Sync":
1. Query Freshsales: filtered_search where first_source IS NOT EMPTY
   (no stage filter, no date filter)
2. Paginate through ALL results (100 per page, 2s delay between pages)
3. For each contact:
   - Read native fields: first_source, first_medium, first_campaign, latest_*, keyword, city, state
   - Read cf_ fields: all 19 mapped fields from Field Contract v2
   - Determine crm_status from contact_status_id (use STATUS_ID_TO_STAGE map)
   - Upsert to backfilled_leads with $ifNull to preserve existing non-null values
```

**Key differences from current source_backfill:**
- No hardcoded date range — fetches ALL contacts with any source
- No hardcoded source string matching — any non-empty `first_source` qualifies
- Reads FULL attribution from Freshsales (native + cf_ fields), not partial
- Uses the STATUS_ID_TO_STAGE map (from .env) to determine stage, not a separate pass

### 2C. Files Changed

| File | Change | Risk |
|---|---|---|
| `backend/crm_sync.py` | Add `run_source_sync(db)` function — new sync pass for first_source IS NOT EMPTY | LOW — new function, existing code untouched |
| `backend/crm_sync.py` | Modify `_upsert_backfilled()` — read all 19 cf_ fields + native attribution into backfilled_leads | LOW — extends existing attribution dict |
| `backend/server.py` | Add `POST /api/cms/sync/source-sync` endpoint | LOW — new endpoint |
| `backend/server.py` | Wire `run_source_sync` into the 6-hourly scheduler (after existing `_run`) | LOW — additive |
| `frontend/src/pages/LeadsView.jsx` | Add "Sync Now" button in header (calls `/api/cms/sync/trigger`) | LOW — UI only |
| `frontend/src/pages/LeadsView.jsx` | Add "Source Sync" button (calls `/api/cms/sync/source-sync`) | LOW — UI only |

### 2D. Freshsales API Usage

**Query:** `filtered_search/contact` with filter `first_source` IS NOT EMPTY.

**Rate limit concern:** Freshsales allows ~30 requests/min. With 2s delay between pages and ~1300 contacts at 100/page = 13 pages = ~26 seconds total. Well within limits.

**Fields available in filtered_search response (partial contact):**
- ✅ id, first_name, last_name, email, mobile_number, work_number
- ✅ first_source, latest_source, city, created_at
- ✅ contact_status_id, lifecycle_stage_id, lost_reason_id
- ❌ first_medium, first_campaign, keyword, custom_field — **NOT in filtered_search response**

**Problem:** `filtered_search` returns partial contacts. Full native fields + cf_ fields require an individual `GET /contacts/{id}` call per contact. With 1300+ contacts, that's 1300 API calls → ~44 minutes at 2s delay → could hit rate limits.

**Mitigation options:**
1. **Option A (incremental):** Only do individual GET for contacts NOT already in MongoDB (new contacts). Existing contacts with attribution already have it from previous syncs.
2. **Option B (batched):** Do individual GETs in small batches (10 at a time, 5s between batches). ~130 batches × 5s = ~11 minutes. Run as background task.
3. **Option C (hybrid):** Use filtered_search for discovery (who has first_source?), then only GET contacts where MongoDB `backfilled_leads.first_source` is null (the gap contacts).

**Recommended: Option C** — Only GET contacts where we're missing attribution. This targets the 78 gap contacts, not all 1300. ~78 GETs × 2s delay = ~2.5 minutes.

### 2E. DB Impact

- `backfilled_leads` collection — upserted documents gain full attribution dict (all 19 cf_ fields + native fields)
- No schema change — attribution is a flexible dict
- No new collections

### 2F. Regression Risk

| Area | Risk | Why |
|---|---|---|
| Existing stage-based sync | NONE | Not modified, runs first as before |
| Existing backfilled_leads data | NONE | $ifNull preserves existing non-null values |
| Freshsales API | LOW | Additional calls, but within rate limits (Option C) |
| Funnel dashboard | POSITIVE — more leads visible | Currently missing 78 "New" stage leads |

---

## 3. ITEM B — DELETE BUTTON PER LEAD

### 3A. Scope

- Delete from MongoDB only (demo_requests OR quotes OR contact_messages OR backfilled_leads)
- NOT from Freshsales — lead stays in CRM
- Warning modal before delete: "This will permanently remove this lead from the dashboard. The contact will remain in Freshsales. This cannot be undone."

### 3B. Files Changed

| File | Change | Risk |
|---|---|---|
| `backend/server.py` | Add `DELETE /api/cms/leads/:type/:id` endpoint — deletes from correct collection based on type | LOW |
| `backend/leads.py` | Add `delete_lead(db, lead_type, lead_id)` function | LOW |
| `frontend/src/pages/LeadsView.jsx` | Add trash icon per row + confirmation modal + toast on success | LOW |

### 3C. Endpoint Design

```
DELETE /api/cms/leads/{type}/{id}
Auth: Bearer (CMS admin)
Path params:
  type: "demo" | "quote" | "contact" | "backfilled"
  id: lead id (string UUID for demo/quote/contact, or freshsales_contact_id for backfilled)
Response: { "ok": true, "deleted": 1 }
```

### 3D. Collection Mapping

| type param | MongoDB collection | ID field |
|---|---|---|
| `demo` | `demo_requests` | `id` (UUID) |
| `quote` | `quotes` | `id` (UUID) |
| `contact` | `contact_messages` | `id` (UUID) |
| `backfilled` | `backfilled_leads` | `freshsales_contact_id` (int) |

### 3E. Regression Risk

NONE — new endpoint, new UI element. No existing functionality changed.

---

## 4. ITEM C — REMOVE ALL HARDCODING

### 4A. Complete Hardcoding Register

| # | File:Line | Current Hardcoded Value | New .env Variable | Default |
|---|---|---|---|---|
| 1 | `crm_sync.py:262` | `_BACKFILL_FROM = "2025-07-01"` | `BACKFILL_DATE_FROM` | `"2025-07-01"` |
| 2 | `crm_sync.py:263` | `_BACKFILL_TO = "2026-06-24"` | `BACKFILL_DATE_TO` | `""` (empty = no cutoff) |
| 3 | `crm_sync.py:33` | `403021121245: "lead"` | `FRESHSALES_LIFECYCLE_MAP` | JSON: `{"403021121245":"lead","403021121246":"qualified","403021121247":"customer"}` |
| 4 | `crm_sync.py:38-48` | 9 lost reason IDs | `FRESHSALES_LOST_REASONS` | JSON: `{"403021121249":"Not able to reach",...}` |
| 5 | `crm_sync.py:266-271` | Source bucket string variants | `FRESHSALES_SOURCE_BUCKETS` | JSON: `{"google":["google","google1","Google"],...}` |
| 6 | `server.py:154-171` | 9 lead_source_id values | `FRESHSALES_LEAD_SOURCE_PAID_SEARCH`, `_FACEBOOK_LEAD`, `_SOCIAL_MEDIA`, `_DISPLAY`, `_EMAIL`, `_REFERRAL`, `_ORGANIC`, `_WEB`, `_DIRECT` | Current values as defaults |
| 7 | `server.py:219` | `"India"` | `DEFAULT_COUNTRY` | `"India"` |
| 8 | `payments.py:57` | `"402001783018"` | `FRESHSALES_STATUS_PAYMENT_AWAITED` | `""` |

### 4B. Implementation Approach

**For simple values (#1, #2, #7, #8):** Direct `os.environ.get("KEY", "default")`

**For maps (#3, #4, #5, #6):** Parse JSON from env var with fallback to current hardcoded values:
```python
import json
LIFECYCLE_MAP = json.loads(os.environ.get("FRESHSALES_LIFECYCLE_MAP", '{}')) or {403021121245: "lead", ...}
```

This way existing deploys work unchanged (fallback to current values), but owner can override in .env.

### 4C. Files Changed

| File | Change | Risk |
|---|---|---|
| `backend/crm_sync.py` | Replace 5 hardcoded blocks with env reads + JSON parse | LOW — fallback to current values |
| `backend/server.py` | Replace `_derive_lead_source_id()` IDs + `"India"` with env vars | LOW — fallback to current values |
| `backend/payments.py` | Replace 1 hardcoded status ID with env var | LOW |
| `backend/.env` | Add 9 new env vars with current values as defaults | NONE |

### 4D. Regression Risk

LOW — all changes have fallback defaults matching current hardcoded values. If .env is not updated, behavior is identical to today.

---

## 5. ITEM D — HTML DOCUMENTS

### 5A. Scope

Generate styled HTML versions of:
1. `/app/Freshsales_Field_Contract_v2.md` → `/app/frontend/public/docs/field-contract.html`
2. `/app/CR-25_Attribution_Field_Expansion.md` → `/app/frontend/public/docs/cr-25.html`

Accessible at:
- `{site}/docs/field-contract.html`
- `{site}/docs/cr-25.html`

### 5B. Regression Risk

NONE — static HTML files in /public, no routing changes.

---

## 6. IMPLEMENTATION ORDER

```
Phase 1 — Hardcoding removal (Item C)
  ├── Move all 9 values to .env with fallback defaults
  ├── Verify: backend starts, no behavior change
  └── This unblocks Item A (date cutoff removed)

Phase 2 — Sync logic fix (Item A)
  ├── New run_source_sync() function in crm_sync.py
  ├── New endpoint POST /api/cms/sync/source-sync
  ├── "Sync Now" + "Source Sync" buttons in LeadsView.jsx
  ├── Wire into 6-hourly scheduler
  └── Test: trigger source-sync, verify 78 gap contacts appear with full attribution

Phase 3 — Delete button (Item B)
  ├── DELETE /api/cms/leads/:type/:id endpoint
  ├── Trash icon + confirmation modal in LeadsView.jsx
  └── Test: delete a test lead, verify removed from dashboard, still in Freshsales

Phase 4 — HTML docs (Item D)
  ├── Generate styled HTML for both documents
  └── Place in /public/docs/
```

---

## 7. TOTAL EFFORT

| Item | Effort |
|---|---|
| A — Sync logic | 2-3 hrs |
| B — Delete button | 1 hr |
| C — Hardcoding removal | 1.5 hrs |
| D — HTML docs | 30 min |
| **Total** | **~5-6 hrs** |

---

## 8. NEW .ENV VARIABLES (to add to backend/.env)

```bash
# CR-26: Hardcoding removal — all have defaults matching current behavior
BACKFILL_DATE_FROM=2025-07-01
BACKFILL_DATE_TO=
DEFAULT_COUNTRY=India
FRESHSALES_STATUS_PAYMENT_AWAITED=402001783018
FRESHSALES_LIFECYCLE_MAP={"403021121245":"lead","403021121246":"qualified","403021121247":"customer"}
FRESHSALES_LOST_REASONS={"403021121249":"Not able to reach","403021121250":"Not interested","403021121251":"Budget","403021121252":"Lost to competitor","403025076872":"Small Set up","403025076881":"Personal reasons","403025081184":"Hotel only / small restaurant","403025085248":"Already using POS","403038210055":"Multiple Aggregator"}
FRESHSALES_SOURCE_BUCKETS={"google":["google","google1","Google","Google "],"facebook":["facebook","facebook-SiteLink","fb","Facebook"],"website":["website","Website","web","Web"],"chat":["chat","Chat","livechat","live_chat"]}
FRESHSALES_LEAD_SOURCE_PAID_SEARCH=402001798783
FRESHSALES_LEAD_SOURCE_FACEBOOK_LEAD=402002468721
FRESHSALES_LEAD_SOURCE_SOCIAL_MEDIA=402001798785
FRESHSALES_LEAD_SOURCE_DISPLAY=402001798786
FRESHSALES_LEAD_SOURCE_EMAIL=402001798777
FRESHSALES_LEAD_SOURCE_REFERRAL=402001798781
FRESHSALES_LEAD_SOURCE_ORGANIC=402001798776
FRESHSALES_LEAD_SOURCE_WEB=402001798775
FRESHSALES_LEAD_SOURCE_DIRECT=402001798782
FRESHSALES_STATUS_NEW_ID=402001137706
```

---

## 9. OWNER ACTION ITEMS

| # | Action | When |
|---|---|---|
| 1 | Review and approve this plan | Before implementation |
| 2 | If any Freshsales lifecycle/lost-reason IDs have changed, provide updated values | Before Phase 1 |
| 3 | Confirm: "New" stage status ID is `402001137706` (already in .env as `FRESHSALES_STATUS_NEW_ID`) | Before Phase 2 |

No other owner actions needed — all changes are code-side with safe defaults.

---

*CR-26 Planning Document — Created 2026-06-27 by E1, Emergent Labs*
*Status: G2 Planning Complete. Ready for G3 implementation on approval.*
