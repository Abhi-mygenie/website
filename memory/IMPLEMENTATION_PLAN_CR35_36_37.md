# Implementation Plan — CR-35, CR-36, CR-37
## Date: 2026-06-30
## Status: APPROVED (pending final "go" from owner)

---

## CR-35: Patch 3 Lost Leads into `demo_requests`

### Background
During MongoDB Atlas quota issue, 3 leads were captured in Freshsales but failed MongoDB `insert_one`. They need to be recovered into `demo_requests` so they appear in the leads table.

### Leads to Recover

| # | Name | Phone | Current DB State | Recovery Method |
|---|---|---|---|---|
| 1 | Gffh | +919165729923 | NOT in any collection | Fetch from Freshsales API → insert into demo_requests |
| 2 | Himanshu Gupta | 7368833274 | In backfilled_leads (crm_status: demo_scheduled, first_source: null) | Copy from backfilled_leads → demo_requests (schema reshape) |
| 3 | Prajwal Chaubey | 9120292964 | NOT in any collection | Fetch from Freshsales API → insert into demo_requests |

### Execution Steps (DB operations only, no code edits)

**Step 1: Fetch Gffh + Prajwal from Freshsales API**
- Use `GET /crm/sales/api/contacts/search?phone=<number>` or `filtered_search`
- Extract: name, phone, email, city, freshsales_contact_id, created_at, custom_fields
- Map to demo_requests schema

**Step 2: Copy Himanshu Gupta from backfilled_leads**
- Already has: name, phone, email, city, freshsales_contact_id, created_at, crm_status
- Schema reshape: backfilled flat fields → demo_requests nested attribution format
- Since first_source is null (direct visitor), attribution will be empty

**Step 3: Insert all 3 into demo_requests**
- Add `recovered: true` flag for traceability
- Add `recovery_source: "freshsales_patch_2026-06-30"` for audit trail
- Verify each appears in leads table after insert

### demo_requests Schema (target)
```json
{
  "id": "<uuid>",
  "name": "...",
  "phone": "...",
  "email": "...",
  "city": "...",
  "business_name": "",
  "outlet_type": "",
  "created_at": "<from freshsales>",
  "otp_verified": false,
  "freshsales_contact_id": <from freshsales>,
  "crm_status": "<from freshsales or backfilled>",
  "crm_lost_reason": null,
  "attribution": {},
  "geo": {},
  "recovered": true,
  "recovery_source": "freshsales_patch_2026-06-30"
}
```

### Risk
- Zero code changes — DB insert only
- No impact on any other leads
- Recoverable: can delete by `recovered: true` flag if needed

### Files Modified: NONE (DB operation only)

---

## CR-36: Meta Spend Date Filtering

### Problem
Dashboard shows ₹11,07,220 Meta spend for any date range (Jun 21-30 or Jan-Dec). This is LIFETIME spend because:
1. `_get_spend_by_source()` in funnel.py doesn't accept/filter dates
2. Meta sync stores lifetime aggregated rows (date_start="2025-01-01", date_stop="2025-12-31")

### Root Cause Chain
```
sync_meta() → date_preset="last_year" + "this_year" → _merge_rows() 
  → 17 campaign docs with date_start="2025-01-01", date_stop="2025-12-31"
  → _get_spend_by_source() sums ALL → shows lifetime total regardless of filter
```

### Solution: Daily Breakdowns + Incremental Sync + Date-Filtered Spend

### Files Modified

| File | Function | Change | Lines |
|---|---|---|---|
| `backend/ads_mcp.py` | `sync_meta()` | Remove lifetime preset logic. Use time_range[since/until] always. Add incremental sync logic. | 135-465 |
| `backend/funnel.py` | `_get_spend_by_source()` | Add date_from/date_to params + $match filter | 191-243 |
| `backend/funnel.py` | `get_funnel_by_source()` | Pass date_from/date_to to _get_spend_by_source | Line 254 |
| `backend/funnel.py` | `get_executive_summary()` | Pass date_from/date_to to _get_spend_by_source | Line 587 |

### Files NOT Modified
- server.py — routes already pass date params through
- frontend/* — date filters already sent to backend
- leads.py — unrelated
- crm_sync.py — unrelated
- freshsales.py — unrelated
- .env — no new env vars

### Detailed Changes

#### 1. `ads_mcp.py` → `sync_meta()` (lines 135-465)

**REMOVE:**
- The `else` branch (lines 258-286) that uses `date_preset="last_year"/"this_year"` + `_merge_rows()`
- The blanket `delete_many({"source": "meta_api"})` (line 451)

**ADD — Incremental sync logic:**
```
def _get_last_sync_date(db, source):
    # Query: db.ad_spend.find_one({"source": source}, sort=[("date_stop", -1)])
    # Returns max date_stop string "YYYY-MM-DD" or None

On sync_meta() entry (when no explicit date_from/date_to):
    last_date = await _get_last_sync_date(db, "meta_api")
    if last_date:
        since = last_date           # Re-sync last day (catches late data)
        until = today (YYYY-MM-DD)
        # Delete overlapping: WHERE source="meta_api" AND date_start >= since
    else:
        since = "2025-01-01"        # First sync: full history (Option X)
        until = today
        # Delete all: WHERE source="meta_api"
```

**KEEP UNCHANGED:**
- `_meta_insights()` helper — already supports time_range[since/until]
- `_extract_actions()` — unchanged
- Doc structure for campaign/adset/ad/placement rows — unchanged
- Campaign status fetch + adset targeting fetch — unchanged
- All the doc-building loops (lines 304-448) — unchanged, they already read date_start/date_stop from API response

**Key insight:** The `_meta_insights()` function with `since/until` params already returns rows with correct per-day `date_start`/`date_stop`. The only change is removing the lifetime preset path and adding incremental range calculation.

#### 2. `funnel.py` → `_get_spend_by_source()` (lines 191-243)

**CHANGE signature:**
```python
# FROM:
async def _get_spend_by_source(db) -> dict:

# TO:
async def _get_spend_by_source(db, date_from=None, date_to=None) -> dict:
```

**ADD to the live API aggregation $match (lines 220-221):**
```python
match = {"source": api_source}
if level_filter:
    match["level"] = level_filter
# NEW: date range filter
if date_from:
    match["date_start"] = {"$gte": date_from}
if date_to:
    match["date_stop"] = {"$lte": date_to}
```

**UNCHANGED:**
- CSV upload path (lines 196-211) — untouched
- Aggregation $group stage — same
- Return structure — same

**Backwards compatible:** No dates = no filter = sums everything (same as before).

#### 3. `funnel.py` → `get_funnel_by_source()` (line 254)

**ONE LINE CHANGE:**
```python
# FROM:
spend_map = await _get_spend_by_source(db)

# TO:
spend_map = await _get_spend_by_source(db, date_from, date_to)
```
Function already receives date_from/date_to as params (line 252).

#### 4. `funnel.py` → `get_executive_summary()` (line 587)

**ONE LINE CHANGE:**
```python
# FROM:
spend_map = await _get_spend_by_source(db)

# TO:
spend_map = await _get_spend_by_source(db, date_from, date_to)
```
Function already receives date_from/date_to as params (line 584).

---

## CR-37: Google Ads Spend Missing Date Ranges

### Problem
Google ad_spend docs have `date_start: None, date_stop: None`. 9 docs, ₹27,965 spend, no date filtering possible.

### Root Cause
`_run_google_ads_sync()` builds docs without date fields. GAQL queries don't include `segments.date`.

### Solution: Add segments.date to GAQL + Incremental Sync

### Files Modified

| File | Function | Change | Lines |
|---|---|---|---|
| `backend/ads_mcp.py` | `_run_google_ads_sync()` | Add segments.date to all GAQL queries. Group by (entity, date). Add date_start/date_stop to output docs. | 485-703 |
| `backend/ads_mcp.py` | `sync_google()` | Add incremental sync logic (same pattern as Meta) | 706-753 |

### Files NOT Modified
- Same as CR-36 list — no server.py, no frontend, no leads.py etc.

### Detailed Changes

#### 1. `ads_mcp.py` → `_run_google_ads_sync()` (lines 485-703)

**CHANGE all 6 GAQL queries to include `segments.date`:**

Campaign base (line 522-529):
```sql
-- FROM:
SELECT campaign.id, campaign.name,
       metrics.cost_micros, metrics.clicks, metrics.impressions
FROM campaign
WHERE segments.date DURING LAST_30_DAYS ...

-- TO:
SELECT campaign.id, campaign.name, segments.date,
       metrics.cost_micros, metrics.clicks, metrics.impressions
FROM campaign
WHERE segments.date BETWEEN '{date_from}' AND '{date_to}' ...
```

Same pattern for: campaign conv, ad_group base, ad_group conv, ad base, ad conv (6 queries total).

**CHANGE grouping key:**
```python
# FROM (campaign example, line 533):
base[row.campaign.name] = { ... }

# TO:
date_str = row.segments.date  # "YYYY-MM-DD"
key = f"{row.campaign.name}|{date_str}"
base[key] = {
    ...,
    "date": date_str,
}
```

Same pattern for adgroups and ads dictionaries.

**ADD date fields to output docs:**
```python
# Campaign docs (line 564-578):
{
    ...,
    "date_start": v["date"],    # NEW
    "date_stop":  v["date"],    # NEW (same day)
    "synced_at": now,
}
```

Same for adgroup_docs and ad_docs.

#### 2. `ads_mcp.py` → `sync_google()` (lines 706-753)

**ADD incremental sync logic (same pattern as Meta):**
```
last_date = await _get_last_sync_date(db, "google")
if last_date:
    date_from = last_date       # Re-sync last day
    date_to = today
    # Delete WHERE source="google" AND date_start >= last_date
else:
    date_from = "2025-01-01"    # First sync: full history
    date_to = today
    # Delete all WHERE source="google"
```

**REMOVE blanket delete (line 736):**
```python
# FROM:
await db.ad_spend.delete_many({"source": "google"})

# TO: conditional delete based on incremental range (as above)
```

---

## Shared Helper: `_get_last_sync_date()` (NEW — added to ads_mcp.py)

```python
async def _get_last_sync_date(db, source: str) -> str | None:
    """Find the latest date_stop for a given source in ad_spend.
    Returns 'YYYY-MM-DD' string or None if no data exists."""
    doc = await db.ad_spend.find_one(
        {"source": source, "date_stop": {"$ne": None}},
        {"date_stop": 1},
        sort=[("date_stop", -1)]
    )
    return doc["date_stop"] if doc else None
```

---

## Risk Register

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | First sync after change takes longer | One-time delay | Subsequent syncs are 1-2 days only (incremental) |
| 2 | Meta API rate limits | Sync fails | Already has 90s timeout + pagination. Daily breakdowns are standard API usage |
| 3 | Google `segments.date` increases row count | More DB docs | Expected and desired — enables date filtering |
| 4 | Old lifetime rows double-count with new daily rows | Wrong spend | Option X: first sync deletes all old rows before inserting daily |
| 5 | `_get_spend_by_source()` returns 0 before first sync | Dashboard shows no spend | Only between deploy and first sync trigger — acceptable |
| 6 | Other callers of `_get_spend_by_source()` break | Wrong data | Only 2 callers exist: `get_funnel_by_source`, `get_executive_summary` — both updated |
| 7 | Ads Intelligence tab (`AdsIntelTab`) affected | Broken display | NO — it queries ad_spend directly with own filters, doesn't use `_get_spend_by_source()` |
| 8 | CR-35 insert creates duplicates | Double-counted leads | Insert with `recovered: true` flag. Pre-check by phone before insert |
| 9 | `_get_last_sync_date()` returns corrupted date | Wrong sync range | Fallback: if parse fails, do full sync |
| 10 | Freshsales API down during CR-35 fetch | Can't recover Gffh + Prajwal | Retry later. Himanshu can still be copied from backfilled_leads |

## Execution Order

```
Phase 1: CR-35 (DB operations, no code)
  1. Fetch Gffh (+919165729923) from Freshsales API
  2. Fetch Prajwal Chaubey (9120292964) from Freshsales API  
  3. Copy Himanshu Gupta (7368833274) from backfilled_leads
  4. Insert all 3 into demo_requests with recovered=true flag
  5. Verify all 3 appear in leads table

Phase 2: CR-36 + CR-37 (code changes)
  1. Add _get_last_sync_date() helper to ads_mcp.py
  2. Update _get_spend_by_source() signature + date filter in funnel.py
  3. Update 2 callers in funnel.py (one-line each)
  4. Update sync_meta() — remove lifetime preset, add incremental logic
  5. Update _run_google_ads_sync() — add segments.date to GAQL
  6. Update sync_google() — add incremental logic
  7. Test: trigger Meta sync → verify daily rows with correct date_start/date_stop
  8. Test: trigger Google sync → verify daily rows with date fields
  9. Test: funnel date filter → verify spend matches selected period
```

---

*Plan prepared: 2026-06-30. Agent: E1, Emergent Labs.*
