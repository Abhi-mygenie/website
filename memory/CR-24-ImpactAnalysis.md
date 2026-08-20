# CR-24 — Step 2: Complete Impact Analysis

**Document:** Impact Analysis for all 12 registered gaps
**Date:** 2026-06-26
**Prerequisite:** CR-24-AdsIntelligence.md (Gap Register)

---

## HOW TO READ THIS DOCUMENT

Each gap is analyzed across 6 dimensions:
1. **Files Touched** — exact file paths, what changes
2. **DB Impact** — collections read/written, schema changes
3. **API Impact** — endpoints added, modified, or removed
4. **Dependencies** — what must be done first
5. **Regression Risk** — what existing functionality could break
6. **Effort** — S (< 1 hr) / M (1-4 hrs) / L (4-8 hrs) / XL (> 8 hrs)

---

## GAP-01 — Pixel events show zero in date-filtered view

### Root Cause (confirmed by diagnostic)
In `sync_meta()`, the date-specific path returns raw API rows.
The doc-building loop calls `row.get("book_demo_count", 0)` — a key that doesn't exist in raw rows.
`_extract_actions()` is only called inside `_merge_rows()` (full history path). Never called on date-specific raw rows.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/ads_mcp.py` | MODIFY | In date-specific path (lines ~203-207), call `_extract_actions(row)` on each campaign row before doc-building loop |

### Exact Change Required
```python
# BEFORE (broken — date-specific path):
campaign_rows = await _meta_insights("campaign", campaign_fields, since=date_from, until=date_to)

# AFTER (fixed):
campaign_rows = await _meta_insights("campaign", campaign_fields, since=date_from, until=date_to)
for row in campaign_rows:
    row.update(_extract_actions(row))   # ← inject extracted counts into raw row
```

### DB Impact
- Collection: `ad_spend`
- Existing rows with `source: meta_api, level: campaign` re-written on next sync
- No schema change — `book_demo_count`, `schedule_count`, `demo_given_count`, `purchase_count` fields already exist in schema (just always 0 today)

### API Impact
- `POST /api/cms/ads/mcp/meta/sync` — behavior corrected, no signature change

### Dependencies
- Must fix GAP-02 in same commit (both are in `_extract_actions` area)

### Regression Risk
- **LOW** — Only changes behavior of date-specific sync. Full history sync path (`_merge_rows`) untouched.
- CampaignTable.jsx renders whatever `book_demo_count` the DB has — no frontend change needed.
- After fix: existing zero-value rows in DB will be replaced on next sync.

### Effort: S (30 mins)

---

## GAP-02 — Schedule event double-counted

### Root Cause
`_extract_actions()` checks `elif "schedule" in at.lower()`.
Meta API returns BOTH `schedule_total=3` AND `schedule_website=3` in the conversions array.
Both match "schedule" → count = 6 instead of 3.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/ads_mcp.py` | MODIFY | `_extract_actions()` function — tighten schedule matching |

### Exact Change Required
```python
# BEFORE (double-counts):
elif "schedule" in at:
    out["schedule_count"] += v

# AFTER (only count schedule_total, skip schedule_website):
elif at == "schedule_total" or "offsite_conversion.fb_pixel_custom.schedule" in at:
    out["schedule_count"] += v
```

### DB Impact
- All existing `schedule_count` values in DB are inflated 2x
- Corrects on next sync (rows deleted and re-inserted)

### API Impact: None

### Dependencies: Fix with GAP-01 in same pass

### Regression Risk
- **LOW** — Only reduces an inflated number. No other code reads schedule_count except display.
- After fix: schedule numbers halve for any campaign using Calendly tracking.

### Effort: S (15 mins)

---

## GAP-03 — Meta Ad Set Intelligence Panel (from Meta API data)

### Context
Ad set rows already exist in `ad_spend` collection with `level: "adset"`.
However: pixel event counts (book_demo_count etc.) are NOT stored in adset rows today.
This is the same `_extract_actions` omission as GAP-01 but for adset-level rows.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/ads_mcp.py` | MODIFY | Apply `_extract_actions()` to each adset row in both date-specific AND merge paths |
| `backend/funnel.py` | ADD | New function `get_adset_performance(db, date_from, date_to)` |
| `backend/server.py` | ADD | New endpoint `GET /api/cms/ads/adset-performance` |
| `frontend/src/components/ads/AdSetTable.jsx` | CREATE | New component — ad set intelligence table |
| `frontend/src/components/ads/AdsIntelTab.jsx` | MODIFY | Import and render AdSetTable |

### DB Impact
| Collection | Change |
|---|---|
| `ad_spend` (level=adset) | Add `book_demo_count`, `schedule_count`, `demo_given_count`, `purchase_count` fields on next sync |

### DB Query (new function in funnel.py)
```python
# Group by adset from ad_spend collection
pipeline = [
    {"$match": {"source": "meta_api", "level": "adset"}},
    {"$group": {
        "_id": "$ad_set",
        "campaign": {"$last": "$campaign"},
        "spend": {"$sum": "$spend"},
        "impressions": {"$sum": "$impressions"},
        "clicks": {"$sum": "$clicks"},
        "book_demo_count": {"$sum": "$book_demo_count"},
        "schedule_count": {"$sum": "$schedule_count"},
        "demo_given_count": {"$sum": "$demo_given_count"},
        "purchase_count": {"$sum": "$purchase_count"},
        "effective_status": {"$last": "$effective_status"},
        "date_start": {"$min": "$date_start"},
        "date_stop": {"$max": "$date_stop"},
    }},
    {"$sort": {"spend": -1}}
]
```

### API Impact
- New: `GET /api/cms/ads/adset-performance?date_from=&date_to=`
- Requires admin auth (same as all other CMS endpoints)

### New UI Component — AdSetTable.jsx
Columns:
- Ad Set Name | Campaign | Status | Spend | Impressions | Clicks | CPC | Book Demo | CP Book Demo | Schedule | CP Schedule | Audience

### Dependencies
- GAP-01 must be fixed first (same `_extract_actions` issue)
- GAP-06 (audience data) enhances this table but is not a blocker

### Regression Risk
- **NONE** — new endpoint, new component. No existing component is changed except AdsIntelTab (import added).
- MetaCreativeTable.jsx (UTM-based) stays untouched — both tables will coexist until GAP-12 is resolved.

### Effort: M (3 hrs)

---

## GAP-04 — Meta Individual Ad Performance Panel

### Context
Ad-level rows exist in `ad_spend` with `level: "ad"`. 6 ads active in Jun 21-26.
Same `_extract_actions` omission — pixel counts not stored at ad level either.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/ads_mcp.py` | MODIFY | Apply `_extract_actions()` to each ad row |
| `backend/funnel.py` | ADD | New function `get_ad_performance(db, date_from, date_to)` |
| `backend/server.py` | ADD | New endpoint `GET /api/cms/ads/ad-performance` |
| `frontend/src/components/ads/AdPerformanceTable.jsx` | CREATE | New component — individual ad table |
| `frontend/src/components/ads/AdsIntelTab.jsx` | MODIFY | Import and render AdPerformanceTable |

### DB Impact
| Collection | Change |
|---|---|
| `ad_spend` (level=ad) | Add `book_demo_count`, `schedule_count` fields on next sync |

### DB Query
```python
pipeline = [
    {"$match": {"source": "meta_api", "level": "ad"}},
    {"$group": {
        "_id": "$ad_name",
        "adset": {"$last": "$ad_set"},
        "campaign": {"$last": "$campaign"},
        "spend": {"$sum": "$spend"},
        "impressions": {"$sum": "$impressions"},
        "clicks": {"$sum": "$clicks"},
        "book_demo_count": {"$sum": "$book_demo_count"},
        "schedule_count": {"$sum": "$schedule_count"},
        "frequency": {"$avg": "$frequency"},
        "date_start": {"$min": "$date_start"},
        "date_stop": {"$max": "$date_stop"},
    }},
    {"$sort": {"spend": -1}}
]
```

### New UI Component — AdPerformanceTable.jsx
Columns:
- Ad Name | Ad Set | Spend | Impressions | Clicks | CTR | CPC | Book Demo | Schedule | Frequency | ROI Signal

ROI Signal logic:
- HIGH ROI: spend ≤ 500 with ≥ 1 conversion
- LOW ROI: spend ≥ 1000 with 0 conversions
- REVIEW: everything else

### Dependencies
- GAP-01 + GAP-03 should be fixed first (same extraction issue)

### Regression Risk: NONE (all new code)

### Effort: M (2.5 hrs)

---

## GAP-05 — Placement Breakdown Panel

### Context
Placement data does NOT exist in the DB yet. Requires a new API call to Meta with `breakdowns=publisher_platform,platform_position`.
Confirmed available from diagnostic — Facebook Reels, Feed, Stories, Instagram Feed, Reels, Stories, Marketplace, Audience Network.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/ads_mcp.py` | MODIFY | Add placement breakdown API call in `sync_meta()` |
| `backend/funnel.py` | ADD | New function `get_placement_breakdown(db, date_from, date_to)` |
| `backend/server.py` | ADD | New endpoint `GET /api/cms/ads/placement-breakdown` |
| `frontend/src/components/ads/PlacementPanel.jsx` | CREATE | New placement table/chart |
| `frontend/src/components/ads/AdsIntelTab.jsx` | MODIFY | Import PlacementPanel |

### New API Call in sync_meta()
```python
placement_fields = "campaign_name,spend,impressions,clicks"
placement_breakdowns = "publisher_platform,platform_position"
# Additional call to Meta insights API with breakdowns parameter
placement_rows = await _meta_insights_with_breakdown(
    fields=placement_fields,
    breakdowns=placement_breakdowns,
    since=date_from, until=date_to
)
```

### New DB Document Structure
```json
{
  "source": "meta_api",
  "level": "placement",
  "campaign": "AK: Test | Leads | LP | 07 Jul",
  "platform": "facebook",
  "placement_position": "facebook_reels",
  "spend": 956.97,
  "impressions": 13011,
  "clicks": 245,
  "synced_at": "2026-06-26T..."
}
```

### DB Impact
| Collection | Change |
|---|---|
| `ad_spend` | New document type with `level: "placement"` |

### API Impact
- New: `GET /api/cms/ads/placement-breakdown?date_from=&date_to=`

### UI — PlacementPanel.jsx
Displays:
- Platform cards: Facebook | Instagram | Audience Network
- Per platform: breakdown by position (Feed, Reels, Stories, etc.) with spend bar
- Columns: Platform | Position | Spend | Impressions | Clicks | CTR | % of Total Spend

### Dependencies
- GAP-01 should be fixed first (same sync call is being modified)
- Placement rows are independent — don't need pixel event extraction

### Regression Risk
- `_meta_insights` function needs a variant that accepts `breakdowns` param
- Existing `_meta_insights` calls (campaign/adset/ad level) do NOT use breakdowns — no conflict
- `delete_many({"source": "meta_api"})` in sync already clears all levels — placement rows will also be deleted on resync (correct behavior)

### Effort: M (3 hrs)

---

## GAP-06 — Audience / Targeting Info Per Ad Set

### Context
Targeting config (age, geo, gender) lives in the Campaign Manager objects endpoint (`/act_{id}/adsets`) NOT in the Insights endpoint. Requires a separate API call during sync.
Confirmed available: age_min/max, geo_locations (countries + cities), genders, optimization_goal.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/ads_mcp.py` | MODIFY | In `sync_meta()`, fetch adset targeting metadata and merge into adset rows |

### New Code in sync_meta()
```python
# Fetch adset targeting (separate from insights)
adset_targeting_map = {}
async with httpx.AsyncClient(timeout=30) as client:
    r = await client.get(
        f"{GRAPH_BASE}/act_{META_AD_ACCOUNT}/adsets",
        params={
            "access_token": META_TOKEN,
            "fields": "id,name,effective_status,targeting,optimization_goal",
            "limit": 200,
        }
    )
    for a in r.json().get("data", []):
        tgt = a.get("targeting") or {}
        geo = tgt.get("geo_locations") or {}
        adset_targeting_map[a["id"]] = {
            "age_min": tgt.get("age_min"),
            "age_max": tgt.get("age_max"),
            "geo_countries": geo.get("countries", []),
            "geo_cities": [c.get("name") for c in geo.get("cities", [])],
            "gender_targeting": tgt.get("genders"),
            "optimization_goal": a.get("optimization_goal"),
        }
```

### DB Impact
| Collection | Change |
|---|---|
| `ad_spend` (level=adset) | Add fields: `age_min`, `age_max`, `geo_countries`, `geo_cities`, `gender_targeting`, `optimization_goal` |

### API Impact
- No new endpoint — audience data surfaces through existing `GET /api/cms/ads/adset-performance` (GAP-03)
- AdSetTable.jsx gets an "Audience" column showing `Age 25-55 | India-wide`

### Dependencies
- Must be built alongside GAP-03 (adset table) — enhances it

### Regression Risk: LOW
- Only adds new fields to adset rows in DB
- No existing query reads these fields

### Effort: S (1 hr) — built alongside GAP-03

---

## GAP-07 — Google Ads API Integration

### Context
BLOCKED on owner providing Google Ads Developer Token + Customer ID.
`sync_google()` stub already exists in `ads_mcp.py` using MCP approach (placeholder).
Needs to be rewritten as direct Google Ads REST API call (same pattern as Meta).

### Files Touched (when unblocked)
| File | Change Type | What Changes |
|---|---|---|
| `backend/ads_mcp.py` | REWRITE | `sync_google()` — replace MCP stub with Google Ads REST API |
| `backend/funnel.py` | ADD | `get_google_keyword_performance()`, `get_google_adgroup_performance()`, `get_google_search_terms()` |
| `backend/server.py` | ADD | 3 new Google endpoints |
| `frontend/src/components/ads/GoogleCampaignTable.jsx` | CREATE | Campaign + ad group table |
| `frontend/src/components/ads/GoogleSearchTermTable.jsx` | CREATE | Search terms with negative keyword signals |

### New DB Documents (when synced)
```json
{
  "source": "google_api",
  "level": "campaign",
  "campaign": "MyGenie | Restaurant POS | Brand",
  "spend": 45000,
  "impressions": 12000,
  "clicks": 890,
  "conversions": 34
}
```

### Blocker: Owner must provide
1. Google Ads Developer Token
2. Google Ads Customer ID
3. OAuth2 refresh token (if using OAuth) OR service account key (if using service account)

### Effort: XL (requires owner credentials first)

---

## GAP-08 — Meta → Lead Attribution Stitching

### Context
`fbclid` is captured in lead attribution and stored in Freshsales (`cf_latitude`).
However we cannot reverse-map `fbclid` → specific Meta ad/adset/campaign without Meta Conversions API.

### Two possible approaches:
**Option A — UTM parameter enforcement (simple, partial)**
- Mandate utm_campaign=campaign_name, utm_content=adset_name, utm_term=ad_name on ALL Meta ad URLs
- This gives lead-level attribution to campaign/adset/ad
- Limitation: UTM tags are lost if user visits site multiple times

**Option B — Meta Conversions API (complete, complex)**
- Server-side event matching using hashed phone/email
- Sends lead data back to Meta → Meta attributes the conversion to correct ad
- Requires new server-side event endpoint
- High complexity, requires Meta Pixel Events API setup

### Files Touched (Option A — recommended first)
| File | Change Type | What Changes |
|---|---|---|
| Documentation | ADD | UTM tagging guide for Meta ads |
| `backend/funnel.py` | MODIFY | Improve source bucket mapping for `utm_campaign` matching |

### Regression Risk: LOW for Option A

### Effort: S for Option A (documentation only), XL for Option B

### Recommendation: Start with Option A (mandate UTM tags), plan Option B for Phase 2

---

## GAP-09 — CRM Fields (Sales Owner, Deal Value, Proposal Stage)

### Context
Freshsales has a sales owner (`owner_id`) field per contact.
Deal value would need a custom field added to Freshsales.
These fields need to be pulled via CRM sync.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/crm_sync.py` | MODIFY | Pull `owner_id` from Freshsales contact during sync |
| `backend/funnel.py` | MODIFY | Include `sales_owner` in funnel aggregations |
| `backend/server.py` | ADD | Filter by sales_owner in funnel endpoints |

### DB Impact
- `demo_requests`, `backfilled_leads` — add `sales_owner_id`, `sales_owner_name` fields
- New collection: `deal_values` OR custom field in Freshsales

### Dependencies
- Owner must add deal value custom field to Freshsales first
- Owner must confirm sales owner field name in Freshsales

### Effort: M (owner action required first)

---

## GAP-10 — Lead Quality Scoring

### Context
Currently "valid" = OTP verified (binary). Need multi-dimensional quality score.

### Proposed Quality Dimensions
| Dimension | Source | Weight |
|---|---|---|
| OTP verified | MongoDB | High |
| Demo actually attended (demo_given) | CRM stage | High |
| Valid business name (not empty/test) | Form field | Medium |
| City specified | Form field | Medium |
| Outlet type specified | Form field | Medium |
| Non-disposable email | Email check | Low |

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/funnel.py` | ADD | `compute_lead_quality_score()` function |
| `backend/server.py` | ADD | `GET /api/cms/leads/quality-summary` endpoint |
| `frontend/src/components/ads/LeadQualityPanel.jsx` | CREATE | New panel |

### Effort: M (2-3 hrs, no external dependencies)

---

## GAP-11 — LLM-Powered AI Recommendations

### Context
`GET /api/cms/ads/recommendations?use_llm=True` flag exists but LLM call is not wired.
Emergent LLM key is available. Claude Sonnet or GPT-5.2 can be used.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/recommendations.py` | MODIFY | Wire Emergent LLM key for narrative generation when `use_llm=True` |
| `frontend/src/components/ads/AiRecommendations.jsx` | MODIFY | Add "Generate AI Analysis" button |

### DB Impact: None (LLM response is not cached — generated on demand)

### Effort: M (2 hrs)

---

## GAP-12 — MetaCreativeTable reads wrong data source

### Context
`MetaCreativeTable.jsx` is labeled "Meta Ad Set Intelligence" but reads UTM attribution data, not Meta API data. Almost always shows empty for Meta campaigns because Meta ads rarely have utm_content set.

### Options
**Option A — Replace** with Meta API adset data (from GAP-03 fix)
**Option B — Keep both** — label UTM table separately as "UTM-tagged Ad Set Performance" and add a new Meta API adset table above it

### Impact of Option A
| File | Change | Risk |
|---|---|---|
| `MetaCreativeTable.jsx` | Repurpose to use new `/api/cms/ads/adset-performance` endpoint | LOW — table currently shows empty |

### Impact of Option B
- Both tables coexist
- MetaCreativeTable renamed to `UTMAdSetTable.jsx`
- New `AdSetTable.jsx` added (from GAP-03)

### Recommended: Option A — Replace with Meta API data. UTM ad set table has no useful data currently.

### Effort: S (30 mins — change API endpoint in existing component)

---

## CROSS-GAP DEPENDENCY MAP

```
GAP-02 (schedule fix)
  └── independent, fix alone

GAP-01 (pixel extraction bug)
  └── must fix before → GAP-03 (adset panel)
                     → GAP-04 (ad panel)
                     (same _extract_actions omission)

GAP-06 (audience data)
  └── must fix alongside → GAP-03 (adset table — adds audience column)

GAP-03 (adset panel)
  └── enables → GAP-12 fix (replace UTM table with API data)

GAP-05 (placement)
  └── independent, but shares sync_meta() modification with GAP-01

GAP-07 (Google Ads API)
  └── BLOCKED on owner (token + customer ID)

GAP-08 (Meta attribution)
  └── Option A independent, Option B complex

GAP-09, GAP-10, GAP-11
  └── independent, lower priority
```

---

## TOTAL FILE CHANGE SUMMARY

### Backend Files
| File | Changes Required | Gaps |
|---|---|---|
| `backend/ads_mcp.py` | 5 modifications | GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, GAP-06 |
| `backend/funnel.py` | 4 new functions | GAP-03, GAP-04, GAP-05, GAP-10 |
| `backend/server.py` | 4 new endpoints | GAP-03, GAP-04, GAP-05, GAP-10 |
| `backend/recommendations.py` | 1 modification | GAP-11 |
| `backend/crm_sync.py` | 1 modification | GAP-09 |

### Frontend Files
| File | Change Type | Gaps |
|---|---|---|
| `frontend/src/components/ads/AdSetTable.jsx` | CREATE NEW | GAP-03 |
| `frontend/src/components/ads/AdPerformanceTable.jsx` | CREATE NEW | GAP-04 |
| `frontend/src/components/ads/PlacementPanel.jsx` | CREATE NEW | GAP-05 |
| `frontend/src/components/ads/AdsIntelTab.jsx` | MODIFY (add imports) | GAP-03, GAP-04, GAP-05 |
| `frontend/src/components/ads/MetaCreativeTable.jsx` | MODIFY (change endpoint) | GAP-12 |
| `frontend/src/components/ads/AiRecommendations.jsx` | MODIFY (add LLM button) | GAP-11 |

### New DB Fields (no migration — added on next sync)
| Collection | New Fields |
|---|---|
| `ad_spend` (level=campaign) | book_demo_count, schedule_count fixed |
| `ad_spend` (level=adset) | book_demo_count, schedule_count, demo_given_count, purchase_count, age_min, age_max, geo_countries, geo_cities |
| `ad_spend` (level=ad) | book_demo_count, schedule_count |
| `ad_spend` (level=placement) | NEW DOCUMENT TYPE: platform, placement_position, spend, impressions, clicks |

---

## EFFORT SUMMARY TABLE

| Gap ID | Description | Effort | Blocked? |
|---|---|---|---|
| GAP-01 | Pixel extraction bug fix | S | No |
| GAP-02 | Schedule double-count fix | S | No |
| GAP-03 | Ad Set Intelligence panel | M | No |
| GAP-04 | Individual Ad panel | M | No |
| GAP-05 | Placement panel | M | No |
| GAP-06 | Audience data per adset | S | No |
| GAP-07 | Google Ads API | XL | Yes (token) |
| GAP-08 | Meta-Lead attribution | S (Option A) | No |
| GAP-09 | CRM fields | M | Partial (owner) |
| GAP-10 | Lead quality scoring | M | No |
| GAP-11 | LLM recommendations | M | No |
| GAP-12 | MetaCreativeTable source fix | S | No |

**Unblocked P0 work total: ~10-12 hrs**
**Unblocked P1 work total: ~6-8 hrs**

---

## REGRESSION RISK ASSESSMENT

| Risk Level | Gaps | Why |
|---|---|---|
| NONE | GAP-03, GAP-04, GAP-05, GAP-10 | All-new code, no existing paths touched |
| LOW | GAP-01, GAP-02 | Fixes bugs — numbers change from wrong to correct |
| LOW | GAP-06 | Only adds fields to existing rows |
| LOW | GAP-12 | Changes an empty table to use better data source |
| MEDIUM | GAP-11 | Adds LLM call — API key dependency, latency |
| HIGH | GAP-07 | New major integration — full testing needed |

---

---

## POST PHASE B+C — IMPACT ANALYSIS FOR GAP-13 to GAP-20

*Added: 2026-06-26 — Gaps discovered after Phases A, B, C were completed and validated with live data.*

---

## GAP-13 — CRITICAL BUG: Ad Set / Ad / Placement panels do not refresh after sync

### Root Cause
`handleMetaSync()` and `handleApply()` in `AdsIntelTab.jsx` call `loadSummary()` after sync, which only refreshes `ExecutiveSummary` and the `CampaignTable`. The three new panels (`AdSetTable`, `AdPerformanceTable`, `PlacementPanel`) fetch data independently on mount and on `[dateFrom, dateTo]` changes — **never on sync completion**.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `frontend/src/components/ads/AdsIntelTab.jsx` | MODIFY | Add `syncVersion` state counter; increment after every sync/apply; pass as prop to all 3 panels |
| `frontend/src/components/ads/AdSetTable.jsx` | MODIFY | Add `syncVersion` to `useEffect` dependency array |
| `frontend/src/components/ads/AdPerformanceTable.jsx` | MODIFY | Add `syncVersion` to `useEffect` dependency array |
| `frontend/src/components/ads/PlacementPanel.jsx` | MODIFY | Add `syncVersion` to `useEffect` dependency array |

### Exact Change Required
```javascript
// AdsIntelTab.jsx — add state
const [syncVersion, setSyncVersion] = useState(0);

// After sync completes in handleMetaSync() and handleApply():
setSyncVersion(v => v + 1);

// Pass to child panels:
<AdSetTable dateFrom={dateFrom} dateTo={dateTo} syncVersion={syncVersion} />
<AdPerformanceTable dateFrom={dateFrom} dateTo={dateTo} syncVersion={syncVersion} />
<PlacementPanel dateFrom={dateFrom} dateTo={dateTo} syncVersion={syncVersion} />

// In each child panel's useEffect:
useEffect(() => { fetchData(); }, [dateFrom, dateTo, syncVersion]);
```

### DB Impact
- **None** — pure frontend state management fix. No DB schema changes.

### API Impact
- **None** — same endpoints called, just triggered at the right time.

### Dependencies
- **None** — fully self-contained frontend change.

### Regression Risk
- **NONE** — adding a prop and incrementing a counter. Existing CampaignTable, ExecutiveSummary, and other panels are untouched.

### Evidence of Impact
- Before fix: DB had 39 adsets (full history), UI showed only 4 (stale Jun 21-26 sync). Appeared as a major data inconsistency with the Campaign table showing ₹7L+ spend.
- After fix: All panels refresh atomically on any sync.

### Effort: S (30 mins)

---

## GAP-14 — BUG: Backend date filter ignored in Ad Set / Ad / Placement queries

### Root Cause
`get_adset_performance()`, `get_ad_performance()`, `get_placement_breakdown()` in `funnel.py` accept `date_from` / `date_to` parameters but the MongoDB `$match` stage does not include any date filter. All rows are returned regardless of the date range selected in the UI.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/funnel.py` | MODIFY | Add date range `$match` filter in all 3 query functions |

### Exact Change Required
```python
# In each of the 3 functions, update the $match stage:
match = {"source": "meta_api", "level": "<level>"}

if date_from and date_to:
    match["$or"] = [
        {"date_start": {"$gte": date_from, "$lte": date_to}},
        {"synced_at": {"$gte": datetime.fromisoformat(date_from)}}
    ]

pipeline = [{"$match": match}, ...]
```

### DB Impact
- **None** — no schema changes. Query filters on existing `date_start`, `date_stop`, `synced_at` fields.

### API Impact
- `GET /api/cms/ads/adset-performance?date_from=&date_to=` — now actually filters by date ✅
- `GET /api/cms/ads/ad-performance?date_from=&date_to=` — now actually filters by date ✅
- `GET /api/cms/ads/placement-breakdown?date_from=&date_to=` — now actually filters by date ✅
- No endpoint signature changes.

### Dependencies
- **GAP-13 should be fixed first** — without the refresh trigger, users won't see the date filter effect even after it's working.
- Correct long-term behavior: date range = trigger fresh Meta API sync for that period (handled by the existing sync flow). The DB-side filter is for browsing already-synced data without re-syncing.

### Regression Risk
- **LOW** — only changes which rows are returned from the 3 new endpoints. Existing CampaignTable, KeywordIntelTable, LandingPagePanel endpoints are untouched.
- Existing behavior (no date filter = returns all data) is preserved when `date_from` / `date_to` are null.

### Effort: S (45 mins)

---

## GAP-15 — ARCHITECTURE GAP: Demo Given / Won = 0 at ad level (structural)

### Root Cause
`demo_given` and `won` are **offline CRM events** (Freshsales stage changes) — they do not fire as Meta pixel events. Confirmed: Meta API diagnostic for Jun 21-26 shows zero `Demo Given` or `Purchase` pixel events in the `conversions` array for any campaign.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `frontend/src/components/ads/AdSetTable.jsx` | MODIFY | Replace "Demo Given" and "Won" column values with "N/A — attribution required" tooltip |
| `frontend/src/components/ads/AdPerformanceTable.jsx` | MODIFY | Same — show N/A with tooltip explaining the gap |
| `backend/recommendations.py` | MODIFY | Do not include `demo_given_count` and `purchase_count` in rule evaluations for now |

### DB Impact
- **None for immediate fix** — columns remain in DB but are displayed with context.
- **Future (Option B — Meta Conversions API):** New collection `meta_conversions_api_events` would be required.

### Two Fix Paths
| Option | Complexity | What It Does |
|---|---|---|
| Option A — UTM mandate (recommended first) | S | Add `utm_term={ad_id}` to all Meta ad URLs → capture in Freshsales → match CRM stage to ad_id. 0 code change, just URL convention. |
| Option B — Meta Conversions API | XL | Server-side event matching with hashed phone/email sent back to Meta. Requires Meta Business Manager setup + new backend endpoint. |

### Dependencies
- Option A: No code dependency — just owner action (UTM template on all Meta ads)
- Option B: Requires Meta Conversions API setup (owner + developer effort)

### Regression Risk: NONE — only adds "N/A" display, no functional change.

### Effort: S (20 mins for UI label fix) | XL (Option B full implementation)

---

## GAP-16 — BUG: Rule-based signals never fire for live Meta API data

### Root Cause (3 sub-issues)

**16a — Wrong source field in creative fatigue rule:**
```python
# BROKEN (queries CSV upload format):
{"source": "meta_ad", "frequency": {"$gt": FATIGUE_FREQUENCY}}
# All live data is stored as source: "meta_api" → never matches
```

**16b — Campaign signals read UTM attribution (almost always empty for Meta):**
```python
funnel_data = await funnel_module.get_funnel_by_attribution(db, dimension="campaign")
# utm_campaign is rarely set on Meta ads → leads = 0 for all Meta campaigns
# Rule: leads > 5 AND demos == 0 → PAUSE → never fires because leads = 0
```

**16c — No signals read from `ad_spend` Meta API rows at all:**
Rich Meta API data (spend, frequency, book_demo_count, schedule_count at adset/ad level) exists in `ad_spend` collection but the signals engine never reads from it.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/recommendations.py` | MODIFY | Add `_meta_api_signals()` function that reads from `ad_spend` directly; fix source field in fatigue rule; remove UTM-attribution dependency for Meta campaigns |

### New Function: `_meta_api_signals()`
```python
async def _meta_api_signals(db):
    signals = []
    # Read adset and ad level rows directly
    adset_rows = await db["ad_spend"].find(
        {"source": "meta_api", "level": "adset"}
    ).to_list(length=200)
    
    for row in adset_rows:
        spend = row.get("spend", 0)
        book_demo = row.get("book_demo_count", 0)
        schedule = row.get("schedule_count", 0)
        freq = row.get("frequency", 0)
        total_conv = book_demo + schedule
        
        # FATIGUED signal (fixed source field)
        if freq > FATIGUE_FREQUENCY:
            signals.append({"type": "FATIGUED", "entity": row.get("ad_set"), ...})
        
        # HIGH SPEND + ZERO CONVERSIONS → REVIEW
        if spend >= REVIEW_SPEND_THRESHOLD and total_conv == 0:
            signals.append({"type": "REVIEW", "entity": row.get("ad_set"), ...})
        
        # HIGH CONVERSIONS + LOW SPEND → SCALE
        if total_conv >= 2 and spend <= 500:
            signals.append({"type": "SCALE", "entity": row.get("ad_set"), ...})
    
    return signals
```

### DB Impact
- **None** — reads from existing `ad_spend` collection. No writes.

### API Impact
- `POST /api/cms/ads/recommendations` — now returns actual signals for Meta API data. Response structure unchanged.

### Dependencies
- **GAP-13 should be fixed first** — so the Recommendations panel refreshes after sync.
- Phase B must be complete (it is ✅) — ensures `ad_spend` has adset/ad rows with pixel event counts.

### Regression Risk
- **LOW** — additive fix. The existing UTM-based signal logic is kept for Google/UTM campaigns. New `_meta_api_signals()` is added as a parallel function, results merged.

### Effort: M (2-3 hrs)

---

## GAP-17 — INTELLIGENCE GAP: No funnel drop-off analysis

### Root Cause
The recommendations engine evaluates spend vs. conversion thresholds but never computes **conversion rates between funnel stages**. There is no logic to diagnose WHERE in the funnel the conversion breaks — ad creative, landing page, follow-up, or sales.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/recommendations.py` | MODIFY | Add `_compute_funnel_dropoff()` function and funnel rate signals |
| `frontend/src/components/ads/AiRecommendations.jsx` | MODIFY | Display funnel conversion rates and drop-off signals in a new card |

### New Funnel Rate Calculations (computable without attribution stitching)
```python
def _compute_funnel_dropoff(ad_row):
    clicks = ad_row.get("clicks", 0)
    impressions = ad_row.get("impressions", 0)
    book_demo = ad_row.get("book_demo_count", 0)
    schedule = ad_row.get("schedule_count", 0)
    
    ctr = (clicks / impressions * 100) if impressions > 0 else 0
    click_to_book = (book_demo / clicks * 100) if clicks > 0 else 0
    book_to_schedule = (schedule / book_demo * 100) if book_demo > 0 else 0
    
    signals = []
    # High CTR but low book-demo → Landing Page problem
    if ctr > 2.0 and click_to_book < 0.5:
        signals.append("LP_FRICTION")
    # Low CTR → Creative/Audience problem
    if ctr < 0.7:
        signals.append("WEAK_CREATIVE")
    # High book-demo but low schedule → Calendly friction
    if book_demo >= 2 and book_to_schedule < 50:
        signals.append("CALENDLY_FRICTION")
    return signals
```

### Computable Now (Meta API only, no attribution needed)
| Rate | Formula | Signals |
|---|---|---|
| CTR | Clicks ÷ Impressions × 100 | < 0.7% → WEAK_CREATIVE, > 2.0% → SCALE |
| Click-to-BookDemo | Book Demo ÷ Clicks × 100 | < 0.5% → LP_FRICTION |
| BookDemo-to-Schedule | Schedule ÷ Book Demo × 100 | < 50% → CALENDLY_FRICTION |
| Spend-per-Conversion | Spend ÷ (BookDemo + Schedule) | > Target CPL → REVIEW |

### Not Computable Yet (needs GAP-08 attribution stitching)
- BookDemo-to-DemoGiven rate (offline CRM event)
- DemoGiven-to-Won rate (offline CRM event)

### DB Impact: None — computed on the fly from existing `ad_spend` rows.

### API Impact
- `POST /api/cms/ads/recommendations` — enriched with funnel rate fields.

### Dependencies
- GAP-16 fix first (ensures signals engine reads Meta API data).
- Phase B complete (it is ✅) — ad-level data exists in DB.

### Regression Risk: LOW — additive calculations, no existing logic changed.

### Effort: M (2 hrs)

---

## GAP-18 — INTELLIGENCE GAP: No campaign age context in recommendations

### Root Cause
`_campaign_signals()` never reads `date_start` from campaign rows. Rules fire purely on spend/conversion thresholds regardless of how long the campaign has been running. A 3-day-old campaign with ₹5,000 spend gets the same REVIEW signal as a 6-month-old campaign.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/recommendations.py` | MODIFY | Read `date_start` from `ad_spend` campaign rows; compute `campaign_age_days`; add age gates to all signal rules |

### Age Gate Logic
```python
from datetime import datetime, timezone

def _get_campaign_age(row):
    date_start_str = row.get("date_start")
    if not date_start_str:
        return None
    date_start = datetime.strptime(date_start_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - date_start).days

# In signal evaluation:
age = _get_campaign_age(row)
if age is not None and age < 7:
    signals.append({"type": "TOO_EARLY", "message": f"Campaign only {age}d old — needs 7+ days of data"})
    continue  # Skip all PAUSE/REVIEW rules for new campaigns
```

### Age Gate Table
| Campaign Age | Behavior |
|---|---|
| < 7 days | Suppress all PAUSE/REVIEW signals. Show "TOO_EARLY — needs 7+ days." |
| 7–30 days | Use conservative thresholds (1.5× normal) |
| > 30 days | Full thresholds active |

### DB Impact: None — reads existing `date_start` field from `ad_spend` rows.

### API Impact: None — signal list in response changes content, not structure.

### Dependencies: GAP-16 fix should come first (same function being modified).

### Regression Risk: LOW — only suppresses false signals on new campaigns. Never suppresses valid signals.

### Effort: S (1 hr)

---

## GAP-19 — INTELLIGENCE GAP: Rule thresholds hardcoded without business context

### Root Cause
All thresholds in `recommendations.py` are arbitrary numbers with no documented business rationale.
```python
PAUSE_SPEND_THRESHOLD  = 22000  # why?
REVIEW_SPEND_THRESHOLD = 5000   # why?
BLOCK_SPEND_THRESHOLD  = 1000   # why?
```

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/recommendations.py` | MODIFY | Replace arbitrary constants with documented, business-rationale-driven constants. Add Target CPL as the primary driver. |

### New Threshold Framework
```python
# ─────────────────────────────────────────
# BUSINESS CONTEXT CONSTANTS
# MyGenie POS — India B2B SaaS
# Target CPL (Cost Per Lead): ₹800
# Target CP Demo: ₹2,500
# Average Deal Value: ~₹50,000
# Acceptable CP-Win (10% of deal): ₹5,000
# ─────────────────────────────────────────

TARGET_CPL             = 800    # ₹ — trigger review when CPL exceeds this
TARGET_CP_DEMO         = 2500   # ₹ — trigger review when cost/demo exceeds this
REVIEW_SPEND_THRESHOLD = TARGET_CPL * 8   # ₹6,400 — review after 8 expected leads of spend
PAUSE_SPEND_THRESHOLD  = TARGET_CPL * 25  # ₹20,000 — pause after 25 expected leads of spend with 0 results
BLOCK_SPEND_THRESHOLD  = TARGET_CPL * 1.5 # ₹1,200 — block keyword after 1.5× CPL with no lead
FATIGUE_FREQUENCY      = 3.5    # flag creative fatigue above 3.5× frequency
```

### DB Impact: None.
### API Impact: None — changes thresholds, not structure.
### Dependencies: GAP-16 and GAP-18 should be complete first (same file).
### Regression Risk: LOW — numbers change from arbitrary to rationale-driven. Some signals that were previously firing (based on wrong numbers) may now be correctly suppressed or triggered.
### Effort: S (30 mins — mostly documentation + constant updates)

---

## GAP-20 — INTELLIGENCE GAP: No CTR / conversion rate benchmarks

### Root Cause
The system cannot contextualise whether a given CTR or conversion rate is good or bad because no benchmark values are defined. A 1.47% CTR could be excellent or poor depending on industry, objective, and placement.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/recommendations.py` | MODIFY | Add benchmark constants for India B2B SaaS Meta Leads campaigns |
| `frontend/src/components/ads/AiRecommendations.jsx` | MODIFY | Display benchmark comparisons in signal cards |

### Benchmark Constants (India B2B SaaS, Meta Leads Objective)
```python
# ─────────────────────────────────────────
# INDUSTRY BENCHMARKS — India B2B SaaS, Meta Lead Gen
# Source: Industry reports + MyGenie historical data
# ─────────────────────────────────────────

CTR_EXCELLENT      = 2.0   # % — SCALE creative signal
CTR_GOOD           = 1.0   # % — acceptable range
CTR_WEAK           = 0.7   # % — below this → REVIEW creative
CTR_POOR           = 0.3   # % — below this → BLOCK creative

CLICK_TO_BOOK_GOOD = 2.0   # % — healthy LP conversion
CLICK_TO_BOOK_WEAK = 0.5   # % — below this → LP problem signal

BOOK_TO_SCHED_GOOD = 60.0  # % — good Calendly conversion
BOOK_TO_SCHED_WEAK = 30.0  # % — below this → Calendly friction
```

### Benchmark Signal Labels (for UI)
| Rate | vs. Benchmark | Signal |
|---|---|---|
| CTR > 2.0% | Excellent | "SCALE — Creative performing above benchmark" |
| CTR 0.7%–2.0% | Normal | — (no signal) |
| CTR < 0.7% | Weak | "REVIEW — CTR below India B2B benchmark (0.9–1.5%)" |
| Click-to-BookDemo < 0.5% | Weak | "LP_FRICTION — Only X% of clicks become demos (benchmark: 2%+)" |
| BookDemo-to-Schedule < 30% | Weak | "CALENDLY_FRICTION — X% of booked demos schedule (benchmark: 60%+)" |

### DB Impact: None.
### API Impact: `POST /api/cms/ads/recommendations` — signal cards include benchmark comparison text.
### Dependencies: GAP-17 (funnel rate calculations) must be implemented first.
### Regression Risk: LOW — only adds context to existing output.
### Effort: S (45 mins — constants + UI labels)

---

## UPDATED CROSS-GAP DEPENDENCY MAP (All Gaps)

```
Phase A (COMPLETE ✅):
  GAP-01, GAP-02 fixed

Phase B (COMPLETE ✅):
  GAP-03, GAP-04, GAP-05, GAP-06, GAP-12 built

Phase C (COMPLETE ✅):
  GAP-10 (Lead Quality), GAP-11 (LLM) built

Phase D — New Urgent Fixes (NEXT):
  GAP-13 (UI refresh)
    └── must fix first → unblocks GAP-14 and GAP-16 to be visible in UI
  GAP-14 (date filter backend)
    └── depends on GAP-13 (user needs to see the fix)
  GAP-16 (rule signals source fix)
    └── depends on GAP-13 (recommendations panel needs refresh trigger)

Phase E — Intelligence Enhancement (AFTER PHASE D):
  GAP-16 fix → enables → GAP-17 (funnel drop-off)
  GAP-17 → enables → GAP-20 (CTR benchmarks)
  GAP-16 fix → enables → GAP-18 (campaign age context)
  GAP-18 + GAP-19 → enhance → GAP-16 signal quality
  
Phase F — Google Ads API (BLOCKED on owner token):
  GAP-07

Phase G — Attribution Stitching + CRM Depth (PARTIALLY BLOCKED):
  GAP-08, GAP-09, GAP-15
```

---

## UPDATED EFFORT SUMMARY (New Gaps Only)

| Gap ID | Description | Effort | Phase | Blocked? |
|---|---|---|---|---|
| GAP-13 | UI panels not refreshing after sync | S (30 min) | D | No |
| GAP-14 | Date filter ignored in queries | S (45 min) | D | No |
| GAP-15 | Demo Given/Won structural gap | S (20 min UI label) / XL (full) | G | Yes (GAP-08 first) |
| GAP-16 | Rule signals never fire for Meta API | M (2-3 hrs) | D | No |
| GAP-17 | No funnel drop-off analysis | M (2 hrs) | E | No |
| GAP-18 | No campaign age context | S (1 hr) | E | No |
| GAP-19 | Hardcoded rule thresholds | S (30 min) | E | No |
| GAP-20 | No CTR/conversion benchmarks | S (45 min) | E | No |

**Phase D total: ~4-5 hrs**
**Phase E total: ~4-5 hrs**

---

## UPDATED REGRESSION RISK (New Gaps Only)

| Risk Level | Gaps | Why |
|---|---|---|
| NONE | GAP-13 | Pure state management — no logic touched |
| LOW | GAP-14 | Only restricts query results, doesn't change structure |
| LOW | GAP-16 | Additive new function, existing UTM logic untouched |
| LOW | GAP-17, GAP-18, GAP-19, GAP-20 | All additive — new calculations, new constants, new signals |
| NONE | GAP-15 (UI label only) | Cosmetic change |

---

---

## GAP-21 — FEATURE REQUEST: Strategy Lab — Intelligent Brainstorm Card

### Root Cause
The signals engine (Phases D+E) is now excellent at telling the user *what is happening* ("Your LP conversion is 0.3%"). But it provides no forward-looking ideation: *what to try next*. The user explicitly asked for a panel that brainstorms strategic hypotheses — not a list of instructions but a set of structured, testable ideas derived from the live signal context.

### Files Touched
| File | Change Type | What Changes |
|---|---|---|
| `backend/recommendations.py` | ADD FUNCTION | `_strategy_lab_hypotheses(db)` — gathers context and builds LLM prompt |
| `backend/server.py` | ADD ENDPOINT | `POST /api/cms/ads/strategy-brainstorm` — calls function, returns hypotheses JSON |
| `frontend/src/components/ads/StrategyLabPanel.jsx` | CREATE | New component: idle/loading/generated/error states + hypothesis cards |
| `frontend/src/components/ads/AdsIntelTab.jsx` | MODIFY | Add `<StrategyLabPanel>` after `<AiRecommendations>` — one line change |

### DB Impact
- **NONE** — The function reads from `ad_spend` and `leads` collections but writes nothing.
- No new collections. No schema changes.
- Card states (Explore/Skip/Save) are ephemeral frontend-only — session memory, not persisted.

### API Impact
**New endpoint only:**
```
POST /api/cms/ads/strategy-brainstorm
Auth: Bearer token (existing CMS auth)
Request body: {} (optional date_from / date_to)
Response:
{
  "hypotheses": [
    {
      "title": "string (6–8 words)",
      "reasoning": "string (2–3 sentences, references the specific signal)",
      "what_to_test": "string (specific, actionable test description)",
      "confidence": "high | medium | low",
      "effort": "low | medium | high",
      "category": "landing_page | audience | creative | budget | offer"
    }
  ],
  "context_summary": "string (what signals were fed to Claude)",
  "generated_at": "ISO datetime",
  "model": "claude-sonnet-4-6",
  "signal_count": int
}
```
**No existing endpoints changed.**

### LLM Architecture
- **Model:** Claude Sonnet via Emergent Universal Key (same key as AI Insights)
- **Input:** Current signals (5–8 signals typically) + executive summary + audience data + placement split + business context paragraph
- **Output:** Structured JSON with 4–5 hypothesis objects
- **Prompt style:** Strategic ideation (not explanation). Claude instructed: "Generate testable hypotheses, not instructions. Do not recommend specific tools. Each hypothesis must cite the specific signal that motivated it."
- **Token estimate:** ~1,800 input + ~900 output = ~2,700 tokens ≈ **₹0.25 per brainstorm** (Emergent key pricing)
- **User-triggered:** Click "Brainstorm" button — NOT auto-run on page load (prevents unnecessary LLM spend)

### Context Passed to Claude (per brainstorm call)
```
1. Signals list (from existing signal functions):
   "- [LP_FRICTION] Broad Targeting: CTR 1.8% but click_to_book 0.31% (benchmark: 2%+)"
   "- [SCALE] Broad Targeting: ₹516 CPL < ₹800 target"
   ...

2. Executive snapshot:
   "Total spend: ₹8,589 | Leads: 981 | CPL: ₹573 | Meta 100% of tracked spend"

3. Ad set audience summary:
   "Broad Targeting: 24–65, All India | Test: DCA | Image Ad: 25–55, Tier 1-2 cities"

4. Placement split:
   "Instagram Feed: 55% | Facebook Feed: 45% | Audience Network: 0%"

5. Business context (static):
   "MyGenie POS — India B2B SaaS. Target: restaurant owners, cafes, hotel chains. 
    Target CPL: ₹800. Avg deal: ₹50,000/yr. Sales cycle: 7–14 days after demo."
```

### Frontend Component States
| State | Trigger | What User Sees |
|---|---|---|
| Idle | Page load | Panel header + "Brainstorm" button + placeholder text |
| Loading | Button click | Spinner + "Analysing X signals across Y ad sets…" |
| Generated | LLM response received | 4–5 hypothesis cards in 2-column grid |
| Card Explore | Click "Explore →" | Card gets green border, label → "Marked to Explore" |
| Card Saved | Click "Save" | Card gets bookmark icon, label → "Saved to Backlog" |
| Card Skipped | Click "Skip" | Card dims to 40% opacity, label → "Skipped" |
| Error | LLM fail / budget | Amber banner with friendly message |

### Hypothesis Card Anatomy
```
┌────────────────────────────────────────────────────────┐
│ [LP] [landing_page badge]   [High conf] [Low effort]   │
│                                                        │
│  Title: Add calendar embed above the fold              │
│                                                        │
│  Reasoning: CTR 1.8% is healthy but click-to-book      │
│  is 0.31% (LP bottleneck identified by LP_FRICTION     │
│  signal). Leads are clicking but not converting.       │
│                                                        │
│  What to Test: Create LP variant with Calendly embed   │
│  above hero fold. Run 7-day A/B test.                  │
│                                                        │
│  [Explore →]  [Save]  [Skip]                           │
└────────────────────────────────────────────────────────┘
```

### Dependencies
| Dependency | Status |
|---|---|
| Phase C (Emergent LLM Key integrated) | COMPLETE ✅ |
| Phase D (signals engine reading meta_api data) | COMPLETE ✅ |
| Phase E (funnel drop-off signals available as context) | COMPLETE ✅ |
| No new 3rd party APIs needed | — |

### Regression Risk
- **NONE** — Fully additive. One `<StrategyLabPanel />` line added to `AdsIntelTab.jsx`. Zero changes to existing signal logic, endpoints, or UI components.

### Effort Breakdown
| Task | Effort |
|---|---|
| `_strategy_lab_hypotheses(db)` backend function | 1 hr |
| `POST /api/cms/ads/strategy-brainstorm` endpoint | 30 min |
| `StrategyLabPanel.jsx` component (all states) | 1.5 hrs |
| Wire into `AdsIntelTab.jsx` + test | 30 min |
| **Total** | **3.5 hrs** |

---

*CR-24 Impact Analysis — GAP-21 Strategy Lab added. 2026-06-26.*
