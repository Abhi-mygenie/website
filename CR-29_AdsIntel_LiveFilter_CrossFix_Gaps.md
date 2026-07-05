# CR-29 — Ads Intelligence Dashboard: Live Filter, Cross-Contamination Fix, Landing Page & Device Gaps

**Opened:** 2026-06-27
**Status:** G2 — Implementation Planning COMPLETE
**Priority:** P0 (data accuracy + usability)
**Effort:** ~5 hours total
**Risk:** LOW — all changes are additive or filter-level; zero impact on lead capture, CRM sync, or payment flows

---

## Problem Statement

Four issues identified on the Ads Intelligence screen (`/leads` → Ads Intelligence tab):

1. **No "Live Only" filter** — paused/archived campaigns, ad sets, ads, and placements clutter the view. Users want to toggle to see only what's actively spending.
2. **Cross-contamination** — "Google Keyword Intelligence" shows Meta ad names (e.g., "Ad Test: DCA | Video 02"); "Meta Ad Set Intelligence" shows Google ad group IDs (e.g., "190599557224"). Root cause: neither table filters by source platform.
3. **Landing Page Performance** — shows `/solutions/cafes` but doesn't explain what data drives it. Excludes homepage `/`. Only shows website-submitted leads (2 on this DB) while 1,388 backfilled CRM leads are invisible. No explanatory context.
4. **Device Breakdown** — shows only Mobile leads; Desktop leads are invisible because backfilled CRM leads (99.8% of total) have no `device_type` data. No explanatory note.

---

## Part 1: Live Campaign Filter Toggle

### Root Cause
`ad_spend` collection stores `effective_status` with values: `ACTIVE`, `PAUSED`, `CAMPAIGN_PAUSED`, `UNKNOWN`, `null`. The frontend tables render status badges (e.g., "LIVE", "PAUSED") but **never filter by status**.

### Data Profile (production DB)
```
Campaign level:  2 ACTIVE, 13 PAUSED, 2 UNKNOWN (Meta) + 3 null (Google)
Ad Set level:    3 ACTIVE, 16 PAUSED, 18 CAMPAIGN_PAUSED, 2 UNKNOWN (Meta) + 3 null (Google)
Ad level:        85 null (Meta) + 3 null (Google)
Placement level: 0 rows (no placement data synced currently)
```

**Key insight:** Ad-level and Google rows have `null` status. The filter must handle this:
- When "Live Only" is ON: show `ACTIVE` + `null` (null = status unknown, don't hide)
- When "Live Only" is OFF: show everything (current behavior)

### Files Changed

| File | Change | Lines |
|---|---|---|
| `frontend/src/components/ads/AdsIntelTab.jsx` | Add `liveOnly` state + toggle button in controls bar. Pass as prop to Campaign/AdSet/Ad/Placement tables | ~15 lines |
| `frontend/src/components/ads/CampaignTable.jsx` | Accept `liveOnly` prop. Filter `campaigns` array client-side: keep rows where `status` is `ACTIVE` or falsy | ~5 lines |
| `frontend/src/components/ads/AdSetTable.jsx` | Accept `liveOnly` prop. Pass `?status=active` to backend when ON | ~3 lines |
| `frontend/src/components/ads/AdPerformanceTable.jsx` | Accept `liveOnly` prop. Pass `?status=active` to backend when ON | ~3 lines |
| `frontend/src/components/ads/PlacementPanel.jsx` | Accept `liveOnly` prop. Pass `?status=active` to backend when ON | ~3 lines |
| `backend/funnel.py` → `get_adset_performance()` | Add optional `status` param. When `status=active`: add `{"$or": [{"effective_status": "ACTIVE"}, {"effective_status": None}]}` to match | ~8 lines |
| `backend/funnel.py` → `get_ad_performance()` | Same `status` param filter | ~8 lines |
| `backend/funnel.py` → `get_placement_breakdown()` | Same `status` param filter | ~5 lines |
| `backend/funnel.py` → `get_executive_summary()` | Add `status` param to campaign aggregation pipeline (line 616-633). When active: add `{"effective_status": {"$in": ["ACTIVE", None]}}` | ~5 lines |
| `backend/server.py` | Add `status: str = None` query param to 4 endpoints: `/ads/executive-summary`, `/ads/adset-performance`, `/ads/ad-performance`, `/ads/placement-breakdown` | ~4 lines (1 per endpoint) |

### UX
- Toggle button in the controls bar: `[🟢 Live Only]` (green when active, outline when inactive)
- Persisted in component state (not localStorage — resets on page reload)
- When toggled, all 4 tables + executive summary re-fetch with the filter
- Campaign table is filtered client-side (data comes from executive-summary response)

### Risks
- **Google rows have null status** — the filter treats null as "show" (safe default; Google API doesn't return campaign status in the current GAQL query)
- **Meta ad-level rows have null status** — same treatment. Meta API returns status at campaign/adset level but not always at ad level
- No data loss — toggle is additive; default OFF shows everything as before

---

## Part 2: Cross-Contamination Fix (Google/Meta Source Filtering)

### Root Cause
Two tables use `get_funnel_by_attribution()` which groups `backfilled_leads` by UTM dimension:
- `KeywordIntelTable.jsx` → `dimension=keyword` → groups by `attribution.utm_term`
- `MetaCreativeTable.jsx` → `dimension=ad_set` → groups by `attribution.utm_content`

**Neither passes a `source` filter**, so ALL leads with that UTM param appear regardless of platform. A Meta lead with `utm_term="petpooja"` shows in "Google Keyword" table. A Google lead with `utm_content="190599557224"` shows in "Meta Ad Set" table.

The backend endpoint **already supports** a `source` query param (line 382-384 in `funnel.py`) — it's just never used by the frontend.

### Files Changed

| File | Change | Lines |
|---|---|---|
| `frontend/src/components/ads/KeywordIntelTable.jsx` | Add `source=google_paid` to the fetch URL params | 1 line |
| `frontend/src/components/ads/MetaCreativeTable.jsx` | Add `source=meta` to the fetch URL params | 1 line |

### Verification
After fix:
- "Google Keyword Intelligence" shows ONLY leads where `_source_label()` returns `google_paid` (i.e., has gclid OR source contains "google" OR medium is cpc/ppc/paid)
- "Meta Ad Set Intelligence" shows ONLY leads where `_source_label()` returns `meta` (i.e., has fbclid OR source contains "facebook"/"meta"/"fb")

### Risks
- **Near zero risk.** The backend filter already exists and is tested (used by other endpoints)
- If a lead has BOTH gclid and fbclid (edge case), `_source_label` returns `meta` (fbclid check comes first at line 55). This matches the current logic and is acceptable
- Tables may show fewer rows after fix — this is CORRECT (contaminated rows removed)

---

## Part 3: Landing Page Performance Gaps

### Root Cause
`get_funnel_by_landing_page()` (funnel.py line 463):
1. Line 466: **Excludes backfilled leads** — `r.get("_lead_type") != "backfilled"`. The 1,388 CRM-synced contacts have NO `attribution.landing_page` field so they can't contribute
2. Line 469: **Excludes homepage** — `_landing_page(r) not in ("", "/")`. Leads landing on `/` are filtered out
3. Only `demo_requests`, `quotes`, `contact_messages` contribute — currently 2 leads total on this DB

### Files Changed

| File | Change | Lines |
|---|---|---|
| `backend/funnel.py` → `get_funnel_by_landing_page()` | Remove the `"/"` exclusion from line 469 — keep `""` exclusion only. Homepage leads should show as "/ (Homepage)" | ~2 lines |
| `frontend/src/components/ads/LandingPagePanel.jsx` | Add a contextual note: "Based on website-submitted leads with UTM tracking. CRM-synced contacts do not carry landing page data." | ~3 lines |
| `frontend/src/components/ads/LandingPagePanel.jsx` | Display "/" as "Homepage" in the UI for readability | ~2 lines |

### Why NOT include backfilled leads
Backfilled CRM leads were synced from Freshsales and genuinely don't have landing page data. There's no field to infer it from. Adding them with "Unknown" would dilute the panel's usefulness. The note explains this.

### Risks
- **Zero risk.** Adding homepage back is a filter relaxation. Note is purely cosmetic.

---

## Part 4: Device Breakdown Gaps

### Root Cause
`get_funnel_by_device()` (funnel.py line 510):
1. Line 513: **Excludes backfilled leads** — same reason as landing page
2. `_device()` reads `attribution.device_type` — backfilled leads have NO `attribution` sub-document at all
3. Only 2 demo_requests exist; both are desktop. The "Mobile 55%" in the user's screenshot is from production with more website leads

### Files Changed

| File | Change | Lines |
|---|---|---|
| `frontend/src/components/ads/DeviceCityPanel.jsx` | Add a contextual note under device table: "Based on website-submitted leads only. CRM-synced contacts (X total) do not carry device data." Show the count of excluded backfilled leads for transparency | ~5 lines |
| `backend/funnel.py` → `get_funnel_by_device()` | Return `backfilled_count` in the response (count of excluded backfilled leads) so the frontend can display it | ~3 lines |

### Alternative considered & rejected
- **Infer device from User-Agent stored in `cf_category`** — Backfilled leads store UA in `cf_category` (a repurposed Freshsales field). We could parse this to derive mobile/desktop. However:
  - Not all backfilled leads have `cf_category` populated
  - UA parsing adds complexity and may be inaccurate
  - The field is a hack (repurposed CRM field, not a reliable device source)
  - **Verdict: Not worth the risk. A note is cleaner.**

### Risks
- **Zero risk.** Note is cosmetic. Backend returns one extra field.

---

## Implementation Plan (Build Order)

### Step 1: Part 2 — Cross-Contamination Fix (30 min, zero backend change)
- Edit `KeywordIntelTable.jsx`: add `p.set("source", "google_paid")` to fetch params
- Edit `MetaCreativeTable.jsx`: add `p.set("source", "meta")` to fetch params
- **Verify:** API returns filtered results; Meta ads no longer in Google table and vice versa

### Step 2: Part 1 — Live Filter Toggle (2.5 hrs)
- **Backend first:**
  - Add `status: str = None` param to 4 server.py endpoints
  - Add status filter logic to `get_executive_summary()`, `get_adset_performance()`, `get_ad_performance()`, `get_placement_breakdown()`
  - Active filter = `{"$or": [{"effective_status": "ACTIVE"}, {"effective_status": None}]}`
- **Frontend:**
  - Add `liveOnly` state + toggle button in `AdsIntelTab.jsx` controls bar
  - Pass `liveOnly` prop to `CampaignTable`, `AdSetTable`, `AdPerformanceTable`, `PlacementPanel`
  - `CampaignTable`: client-side filter (data from executive-summary)
  - `AdSetTable`, `AdPerformanceTable`, `PlacementPanel`: pass `?status=active` when liveOnly=true
- **Verify:** Toggle ON → only ACTIVE/null-status rows shown; Toggle OFF → all rows shown

### Step 3: Part 3 — Landing Page Fix (20 min)
- Backend: remove `"/"` from exclusion in `get_funnel_by_landing_page()`
- Frontend: add note text + "/" → "Homepage" display
- **Verify:** Homepage leads now visible; note renders

### Step 4: Part 4 — Device Breakdown Note (15 min)
- Backend: add `backfilled_count` to `get_funnel_by_device()` response
- Frontend: render note with backfilled count
- **Verify:** Note displays with correct count

---

## Acceptance Criteria

| # | Criterion | How to verify |
|---|---|---|
| 1.1 | "Live Only" toggle visible in controls bar | Screenshot |
| 1.2 | Toggle ON: campaigns with PAUSED/CAMPAIGN_PAUSED/ARCHIVED status hidden | Count rows before/after |
| 1.3 | Toggle ON: Google rows (null status) still visible | Check Google "G" badges still present |
| 1.4 | Toggle OFF: all rows visible (matches current behavior) | Row count matches pre-change |
| 2.1 | "Google Keyword Intelligence" shows only Google-sourced leads | No "Ad Test: DCA" rows |
| 2.2 | "Meta Ad Set Intelligence" shows only Meta-sourced leads | No "190599557224" numeric IDs |
| 3.1 | Homepage (`/`) appears in Landing Page Performance when leads exist | Check for "/" or "Homepage" row |
| 3.2 | Explanatory note visible under landing page panel | Screenshot |
| 4.1 | Explanatory note visible under device breakdown with backfilled count | Screenshot |
| 4.2 | Device breakdown data unchanged for website-submitted leads | Compare before/after |

---

## Files Impact Summary

| File | Parts | Type |
|---|---|---|
| `backend/funnel.py` | 1, 3, 4 | MOD — add status filter to 4 functions, relax landing page filter, add backfilled_count |
| `backend/server.py` | 1 | MOD — add `status` query param to 4 endpoints |
| `frontend/src/components/ads/AdsIntelTab.jsx` | 1 | MOD — add liveOnly state + toggle + prop passing |
| `frontend/src/components/ads/CampaignTable.jsx` | 1 | MOD — accept liveOnly prop, client-side filter |
| `frontend/src/components/ads/AdSetTable.jsx` | 1 | MOD — accept liveOnly prop, pass to backend |
| `frontend/src/components/ads/AdPerformanceTable.jsx` | 1 | MOD — accept liveOnly prop, pass to backend |
| `frontend/src/components/ads/PlacementPanel.jsx` | 1 | MOD — accept liveOnly prop, pass to backend |
| `frontend/src/components/ads/KeywordIntelTable.jsx` | 2 | MOD — add source=google_paid param (1 line) |
| `frontend/src/components/ads/MetaCreativeTable.jsx` | 2 | MOD — add source=meta param (1 line) |
| `frontend/src/components/ads/LandingPagePanel.jsx` | 3 | MOD — add note + "/" display |
| `frontend/src/components/ads/DeviceCityPanel.jsx` | 4 | MOD — add note with backfilled count |

**Total files:** 11 (2 backend, 9 frontend)
**New files:** 0
**Deleted files:** 0
**New endpoints:** 0
**Modified endpoints:** 4 (added optional query param)

---

## Dependencies & Blockers

- **None.** All changes are self-contained within existing files and endpoints
- No CRM, payment, or external API changes
- No new npm/pip packages
- No .env changes
- No database schema changes

---

## Gate Progress
- [x] **G1 Discovery & Impact** — DONE (2026-06-27)
- [x] **G2 Planning** — DONE (2026-06-27). Approach locked, files identified, acceptance criteria defined
- [ ] **G3 Implementation** — Ready to build (4 steps, ~5 hours)
- [ ] **G4 QA**
- [ ] **G5 Owner Smoke Test**

---

*CR-29 registered by E1, Emergent Labs. 27 June 2026.*
