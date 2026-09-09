# CR-24 — Ads Intelligence Platform
## Full Gap Analysis, Impact Assessment & Implementation Plan

**Raised:** 2026-06-26
**Owner:** MyGenie POS
**Status:** PHASE A + B + C COMPLETE ✅ — Phase D (Google API) and Phase E (Attribution/CRM) pending
**Priority:** P0

---

## 1. REQUIREMENT SUMMARY

Build a complete Ads Intelligence layer on top of the existing leads panel that tells us:
- Which Meta campaigns / ad sets / creatives / placements / audiences are producing quality leads
- Which Google campaigns / keywords / search terms should be scaled or blocked
- Which source gives the best CPL → demo → won conversion path
- Which landing page converts better
- AI-generated recommendations from all the above

---

## 2. ORIGINAL BRIEF PHASES (Planned vs. Actual)

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Discovery and field mapping | DONE |
| Phase 2 | Google Ads intelligence validation | PARTIAL (UTM-based only, no Google API) |
| Phase 3 | Meta/Facebook API integration | COMPLETE ✅ (all levels synced + 3 new panels) |
| Phase 4 | DB normalization and CRM mapping | MISSING |
| Phase 5 | Website leads panel enhancement | DONE |
| Phase 6 | Dashboard and reports | MOSTLY DONE (Lead Quality + ROI pending) |
| Phase 7 | AI recommendation layer | PARTIAL (rule-based only, LLM not wired) |
| Phase 8 | QA and validation | IN PROGRESS |

---

## 3. WHAT IS ALREADY BUILT (Confirmed)

### Backend
- `funnel.py` — get_funnel_by_landing_page, by_device, by_city, get_executive_summary, get_funnel_by_attribution
- `ad_spend.py` — CSV parsers for Google and Meta exports
- `ads_mcp.py` — Meta Graph API v21.0 live sync (campaign + adset + ad levels stored in DB)
- `recommendations.py` — Rules-based SCALE/PAUSE/BLOCK/FATIGUED/REVIEW signals
- `server.py` — 10+ CMS/ads endpoints

### Frontend
- `AdsIntelTab.jsx` — Container with date filter, Meta Sync button
- `ExecutiveSummary.jsx` — 6 KPI cards (spend, leads, CPL, CP Demo, CP Win, Won)
- `CampaignTable.jsx` — Campaign-level Meta API data (spend, impressions, clicks, 4 pixel events)
- `KeywordIntelTable.jsx` — UTM keyword funnel table with SCALE/BLOCK signals
- `MetaCreativeTable.jsx` — UTM utm_content (ad set) funnel table (NOTE: UTM-based, not Meta API)
- `LandingPagePanel.jsx` — Landing page funnel cards
- `DeviceCityPanel.jsx` — Device breakdown + top cities
- `AiRecommendations.jsx` — Signal cards

### Database (MongoDB)
- `ad_spend` collection — has campaign/adset/ad level rows with `source: meta_api`, `level: campaign/adset/ad`
- `demo_requests`, `quotes`, `contact_messages`, `backfilled_leads` — leads with UTM attribution
- `ad_spend_uploads` — CSV upload records

---

## 4. GAP REGISTER

### GAP-01 — CRITICAL BUG: Pixel events show zero in date-filtered view
- **Severity:** P0
- **Description:** Book Demo, Schedule, Demo Given, Purchase all show "—" (zero) when a date range is applied via the date picker. Only works on full history sync (no date filter).
- **Root Cause:** In `ads_mcp.py` `sync_meta()`, when `date_from/date_to` are provided, raw API rows are fetched and stored directly. The doc-building loop then calls `row.get("book_demo_count", 0)` which returns 0 because `_extract_actions()` is **never called** on date-specific raw rows. `_extract_actions()` is only invoked inside `_merge_rows()` which is the full-history path.
- **Raw API Evidence (Jun 21-26):**
  - AK: Test | Leads | LP | 07 Jul → `conversions: [offsite_conversion.fb_pixel_custom.Book demo = 2]`
  - AK: Scaling | Leads → `conversions: [offsite_conversion.fb_pixel_custom.Book demo = 2, schedule_total = 3]`
- **Impact:** Dashboard always shows 0 for all conversion events when date filter is used. User cannot validate ad ROI by date.
- **File:** `backend/ads_mcp.py` → `sync_meta()` → date-specific path (lines ~203-207)
- **Fix scope:** 3-5 lines

---

### GAP-02 — CRITICAL BUG: Schedule event double-counted
- **Severity:** P0
- **Description:** `schedule_total=3` and `schedule_website=3` both match "schedule" in `_extract_actions()` → count becomes 6 instead of 3.
- **Root Cause:** `elif "schedule" in at` matches BOTH `schedule_total` AND `schedule_website` in the conversions array.
- **Impact:** Schedule count is 2x inflated on any campaign that has Calendly/schedule tracking.
- **File:** `backend/ads_mcp.py` → `_extract_actions()` (lines ~114-128)
- **Fix scope:** 2 lines

---

### GAP-03 — MISSING: Meta Ad Set Intelligence Panel (from Meta API data)
- **Severity:** P0
- **Description:** Meta API syncs ad set rows to MongoDB (`level: "adset"`) but there is NO API endpoint and NO UI component to display this data.
- **Current state of MetaCreativeTable.jsx:** It reads from `GET /api/cms/funnel/by-attribution?dimension=ad_set` which is UTM utm_content attribution data — completely different from Meta API adset data. Most Meta ads don't have utm_content so this table is almost always empty.
- **What needs to be built:**
  - New GET endpoint: `/api/cms/ads/adset-performance` reading `ad_spend` where `source=meta_api` and `level=adset`
  - New UI: Table showing AdSet Name, Campaign, Status, Spend, Impressions, Clicks, CPC, Book Demo, Schedule, Demo Given, Purchase, Cost/Event
- **Data available in DB:** adset_name, adset_id, campaign_name, spend, impressions, clicks, reach, frequency, date_start, date_stop, synced_at
- **Missing in DB:** book_demo_count, schedule_count, demo_given_count, purchase_count at adset level (same extraction bug as GAP-01 but also _extract_actions not called for adset rows)
- **Files:** `backend/funnel.py` (new query), `backend/server.py` (new endpoint), `frontend/ads/AdSetTable.jsx` (new component)

---

### GAP-04 — MISSING: Meta Individual Ad Performance Panel
- **Severity:** P0
- **Description:** Meta API syncs individual ad rows to MongoDB (`level: "ad"`) — 6 ads active in Jun 21-26. No endpoint, no UI.
- **What needs to be built:**
  - New GET endpoint: `/api/cms/ads/ad-performance`
  - New UI: Table showing Ad Name → Ad Set → Campaign → Spend → Clicks → CTR → Book Demo → Schedule → CPC → Frequency
- **Why it matters:** The user's question "which ad is working?" can only be answered here. Jun 21-26 data shows:
  - "Video: Winner 01" → 1 Book Demo + 2 Schedule (highest ROI)
  - "Image: Winner 01" → 1 Book Demo + 1 Schedule
  - "Video: Winner 02" → ₹1,445 spend, 0 conversions (should review)
  - "Ad Test: DCA | Images 02" → ₹1,848 spend, 0 conversions (should review)
- **Files:** `backend/funnel.py`, `backend/server.py`, `frontend/ads/AdPerformanceTable.jsx`

---

### GAP-05 — MISSING: Placement Breakdown Panel
- **Severity:** P0
- **Description:** Zero placement data synced or displayed. Meta API supports `breakdowns=publisher_platform,platform_position`.
- **Diagnostic finding (Jun 21-26):** Placement data exists — Facebook Reels, Facebook Feed, Facebook Stories, Instagram Feed, Instagram Reels, Instagram Stories, Marketplace — each with distinct spend and impressions.
- **What needs to be built:**
  - During `sync_meta()`, add an extra API call with placement breakdown and store as `level: "placement"` docs
  - New GET endpoint: `/api/cms/ads/placement-breakdown`
  - New UI: Panel showing Platform → Placement Position → Spend → Impressions → Clicks → CTR
- **Files:** `backend/ads_mcp.py`, `backend/funnel.py`, `backend/server.py`, `frontend/ads/PlacementPanel.jsx`

---

### GAP-06 — MISSING: Audience / Targeting Info Per Ad Set
- **Severity:** P1
- **Description:** Each active ad set has targeting config (age range, geo cities/countries, gender) retrievable from `/act_{id}/adsets` endpoint — NOT from insights. This data is not stored or displayed.
- **Diagnostic finding:**
  - Broad Targeting: India-wide, Age 24-65
  - All other active adsets: India-wide, Age 25-55
  - All genders (no gender filter on active campaigns)
- **What needs to be built:**
  - During `sync_meta()`, fetch adset targeting from `/act_{id}/adsets` and merge into adset rows
  - Store: `age_min`, `age_max`, `geo_countries`, `geo_cities`, `gender_targeting`, `optimization_goal`
  - Display in AdSet table as an "Audience" column
- **Files:** `backend/ads_mcp.py`, DB schema (adset row fields)

---

### GAP-07 — MISSING: Google Ads API Integration
- **Severity:** P1 (blocked on owner providing Developer Token)
- **Description:** Zero Google Ads API integration. All Google data is 100% UTM-dependent. If a user lands without UTM tags, zero attribution.
- **What's missing:**
  - No campaign-level spend from Google Ads API
  - No ad group level data
  - No search term reports (only utm_term = keyword, not what user actually searched)
  - No match type data
  - No Quality Score
  - No impression share
- **Blocker:** Requires Google Ads Developer Token + Customer ID from owner
- **Files:** `backend/ads_mcp.py` (sync_google stub already exists), new frontend Google panels

---

### GAP-08 — MISSING: Meta → Lead Attribution Stitching
- **Severity:** P1
- **Description:** Meta pixel fires a "Book Demo" conversion event, but we cannot link that pixel fire to a specific lead record in MongoDB. `fbclid` is captured in attribution but is NOT used to match Meta click → ad → lead.
- **Current state:** We count pixel fires (GAP-01 shows 4 total Book Demo fires Jun 21-26) but cannot say "this specific lead came from this specific ad."
- **Impact:** Cannot answer "which Meta ad produced the highest quality lead" because pixel events and CRM leads are in separate data silos.
- **What's needed:**
  - Store `campaign_id` and `ad_id` from fbclid decode OR via Meta Conversions API server-side matching
  - Match `fbclid` in lead attribution → Meta ad click log
- **Complexity:** High — requires Meta Conversions API or fbclid → ad lookup

---

### GAP-09 — MISSING: CRM Fields (Sales Owner, Deal Value, Proposal Stage)
- **Severity:** P2
- **Description:**
  - No sales owner field captured or displayed — cannot attribute lead quality to sales person
  - No deal value / revenue — cannot calculate true ROI (spend vs. revenue)
  - No "proposal sent" funnel stage
  - No first response time
  - No last activity timestamp
- **Impact:** Campaign ROI dashboard cannot show actual revenue vs spend ratio

---

### GAP-10 — MISSING: Lead Quality Scoring
- **Severity:** P2
- **Description:** Currently, "valid lead" = OTP verified. No other quality dimensions. Cannot distinguish between high-intent qualified lead vs. accidental form submission.
- **What's needed:**
  - Lead quality dimensions: OTP verified, demo booked, demo attended, follow-up responsive
  - Junk/duplicate detection beyond honeypot
  - CPL calculated against valid leads only (not raw form submissions)

---

### GAP-11 — MISSING: LLM-Powered AI Recommendations
- **Severity:** P2
- **Description:** AI recommendations are rule-based (hardcoded thresholds). The `use_llm=True` flag exists in the endpoint but the actual LLM call is not implemented.
- **What's needed:** Wire Emergent LLM key to generate narrative recommendations based on campaign data context

---

### GAP-12 — DATA QUALITY: MetaCreativeTable reads wrong data source
- **Severity:** P1
- **Description:** `MetaCreativeTable.jsx` is labeled "Meta Ad Set Intelligence" but reads from `GET /api/cms/funnel/by-attribution?dimension=ad_set` — this is UTM-based attribution (utm_content parameter), NOT Meta API ad set data.
- **Impact:** Table is empty for almost all Meta leads because most Meta ads don't include utm_content in the URL. It creates a false impression that the panel exists when it has no useful data.
- **Fix:** Either repurpose this table to show Meta API adset data (from GAP-03 fix) or clearly label it as "UTM-attributed ad sets only"

---

## 5. GAP SUMMARY TABLE

| Gap ID | Description | Severity | Type | Blocker? |
|---|---|---|---|---|
| GAP-01 | Pixel events show zero in date filter | P0 | Bug | No |
| GAP-02 | Schedule double-counted | P0 | Bug | No |
| GAP-03 | Meta Ad Set panel (from API data) | P0 | Missing Feature | No |
| GAP-04 | Meta Individual Ad panel | P0 | Missing Feature | No |
| GAP-05 | Placement breakdown panel | P0 | Missing Feature | No |
| GAP-06 | Audience / targeting per ad set | P1 | Missing Feature | No |
| GAP-07 | Google Ads API | P1 | Missing Feature | Yes (needs token) |
| GAP-08 | Meta → Lead attribution stitching | P1 | Architecture Gap | Yes (high complexity) |
| GAP-09 | CRM fields (owner, deal value, stages) | P2 | Missing Feature | Partial |
| GAP-10 | Lead quality scoring | P2 | Missing Feature | No |
| GAP-11 | LLM recommendations | P2 | Missing Feature | No |
| GAP-12 | MetaCreativeTable wrong data source | P1 | Data Quality | No |

---

## 6. DATA JOURNEY MAP (Current vs. Required)

### Current (what exists today)
```
Meta Ad → fbclid captured in lead → Freshsales CRM
Meta Pixel → fires Book Demo event → stored in ad_spend (but shows 0 due to bug)
Google Ad → gclid + utm_term captured → Freshsales CRM
Lead → MongoDB → Freshsales → Stage (scheduled/given/won/lost)
```

### Required (full intelligence chain)
```
Meta Ad (campaign_id, adset_id, ad_id, placement, audience)
  → Click → fbclid + UTM tags
  → Landing Page → Lead Form
  → MongoDB lead (with campaign_id, adset_id, ad_id attached)
  → Freshsales CRM (with full ad attribution)
  → Stage journey (scheduled → demo given → proposal → won)
  → Deal value captured
  → Attribution: which ad → which lead → which stage → how much revenue

Google Ad (campaign, adgroup, keyword, search_term, match_type)
  → Click → gclid + utm_term
  → Landing Page → Lead Form
  → MongoDB lead
  → Freshsales CRM
  → Stage journey → Deal value
```

---

## 7. DASHBOARD PANEL STATUS

| Panel | Status | Data Source | Gap Ref |
|---|---|---|---|
| Executive Summary (6 KPIs) | LIVE | MongoDB funnel + ad_spend | - |
| Campaign Table (Meta) | LIVE but buggy | Meta API → ad_spend | GAP-01, GAP-02 |
| Meta Ad Set Intelligence | MISSING | ad_spend (level=adset) exists in DB | GAP-03, GAP-12 |
| Meta Individual Ad Table | MISSING | ad_spend (level=ad) exists in DB | GAP-04 |
| Meta Placement Breakdown | MISSING | Not synced yet | GAP-05 |
| Meta Audience Panel | MISSING | Not synced yet | GAP-06 |
| Google Keyword Intelligence | LIVE (UTM only) | MongoDB UTM attribution | GAP-07 |
| Google Search Terms | MISSING | Not available | GAP-07 |
| Google Ad Group Panel | MISSING | Not available | GAP-07 |
| Landing Page Panel | LIVE | MongoDB UTM attribution | - |
| Device / City Panel | LIVE | MongoDB UTM + IP geo | - |
| AI Recommendations | LIVE (rules only) | MongoDB aggregates | GAP-11 |
| Lead Quality Dashboard | MISSING | Not built | GAP-10 |
| Campaign ROI (revenue vs spend) | MISSING | No deal value data | GAP-09 |

---

## 8. API ENDPOINTS STATUS

| Endpoint | Status | Notes |
|---|---|---|
| GET /api/cms/ads/executive-summary | LIVE | Includes campaign list |
| POST /api/cms/ads/mcp/meta/sync | LIVE | Has date filter bug (GAP-01) |
| GET /api/cms/ads/recommendations | LIVE | Rules-based |
| GET /api/cms/funnel/by-attribution | LIVE | UTM-based (keyword + ad set) |
| GET /api/cms/funnel/by-landing-page | LIVE | |
| GET /api/cms/funnel/by-device | LIVE | |
| GET /api/cms/funnel/by-city | LIVE | |
| GET /api/cms/ads/adset-performance | MISSING | GAP-03 |
| GET /api/cms/ads/ad-performance | MISSING | GAP-04 |
| GET /api/cms/ads/placement-breakdown | MISSING | GAP-05 |

---

## 9. DATABASE COLLECTION STATUS

| Collection | Status | Notes |
|---|---|---|
| ad_spend (level=campaign) | LIVE | Full Meta API campaign data |
| ad_spend (level=adset) | LIVE in DB | No endpoint/UI yet (GAP-03) |
| ad_spend (level=ad) | LIVE in DB | No endpoint/UI yet (GAP-04) |
| ad_spend (level=placement) | MISSING | Not synced (GAP-05) |
| ad_spend (audience fields) | MISSING | age_min/max, geo not stored (GAP-06) |
| demo_requests | LIVE | Full UTM + OTP + geo |
| backfilled_leads | LIVE | Freshsales backfill |
| crm_stage_events | LIVE | Webhook events |

---

## 10. META API CONFIRMED DATA (Jun 21-26, 2026)

### Campaigns (2 active)
| Campaign | Spend | Book Demo | Schedule | Status |
|---|---|---|---|---|
| AK: Test \| Leads \| LP \| 07 Jul | ₹5,396.88 | 2 | 0 | ACTIVE |
| AK: Scaling \| Leads | ₹1,989.67 | 2 | 3 | ACTIVE |

### Ad Sets (4 active)
| Ad Set | Campaign | Spend | Book Demo | Audience |
|---|---|---|---|---|
| Test: DCA \| Image Ad | AK: Test | ₹1,804 | 1 | India, 25-55 |
| Test: DCA \| Video AD - Square | AK: Test | ₹1,744 | 1 | India, 25-55 |
| Test: DCA \| Image Ad - 20 Jul | AK: Test | ₹1,848 | 0 | India, 25-55 |
| Broad Targeting | AK: Scaling | ₹1,989 | 2 + 3 schedule | India, 24-65 |

### Individual Ads (6 active)
| Ad | Spend | Book Demo | Schedule | Verdict |
|---|---|---|---|---|
| Video: Winner 01 | ₹102 | 1 | 2 | BEST ROI |
| Image: Winner 01 | ₹441 | 1 | 1 | GOOD |
| Ad Test: DCA \| Images 01 | ₹1,804 | 1 | 0 | REVIEW |
| Ad Test: DCA \| Video 02 | ₹1,744 | 1 | 0 | REVIEW |
| Ad Test: DCA \| Images 02 | ₹1,848 | 0 | 0 | LOW ROI |
| Video: Winner 02 | ₹1,445 | 0 | 0 | LOW ROI |

### Placements (confirmed available from API)
- Facebook: Reels, Feed, Stories, Profile Feed, Marketplace, Instream Video
- Instagram: Feed, Reels, Stories, Explore
- Audience Network: Rewarded Video

---

## 11. RISKS & ASSUMPTIONS

| Risk | Impact | Mitigation |
|---|---|---|
| Meta access token expires (current expiry: 2026-08-25) | Sync stops | Auto-exchange logic already built |
| Google Ads Developer Token not provided | Google API stays as UTM-only | Block on owner |
| Meta pixel custom event names change | Conversions go to zero | Use exact string matching + alert if zero |
| fbclid-to-lead stitching not possible without Conversions API | Attribution gap remains | Document as known gap |
| Ad sets paused mid-period change data | Historical numbers shift | Store sync timestamp per row |
| Schedule double-counting inflates numbers | Wrong ROI calculations | Fix GAP-02 immediately |

---

## 12. OPEN QUESTIONS FOR OWNER

1. **Google Ads Developer Token** — Can you provide this? Required for any Google Ads API integration.
2. **Google Customer ID** — What is your Google Ads Customer ID?
3. **Deal Value** — Is deal/contract value recorded in Freshsales? Which field? This is needed for true ROI calculation.
4. **Sales Owner** — Is there a sales owner field in Freshsales that should be shown on the dashboard?
5. **Meta Pixel Event Names** — The pixel fires `offsite_conversion.fb_pixel_custom.Book demo` (with space). Is this the exact name set in Events Manager? Will it change?
6. **"Demo Given" pixel event** — Diagnostic shows zero `Demo Given` pixel fires in Jun 21-26. Is this event actually configured in Meta Events Manager?
7. **"Purchase" pixel event** — Zero fires in Jun 21-26. Is this event set up for Meta pixel? What constitutes a purchase event for MyGenie?
8. **UTM tagging on Meta ads** — Most Meta leads have no utm_content (ad set name). Should we mandate UTM tags on all Meta ads going forward so the MetaCreativeTable is useful?
9. **Lead quality definition** — Beyond OTP verification, what makes a lead "qualified"? (e.g., has a business name, specific outlet type, city?)
10. **Historical data accuracy** — The "full history sync" (last_year + this_year) merges two API calls. Should this be replaced with a single API call for a user-defined date range?

---

*CR-24 Gap Analysis Document — Created 2026-06-26 by E1, Emergent Labs*
*Next: Step 2 — Impact Analysis | Step 3 — Planning | Step 4 — UI Mockup*

---

## 13. NEW GAPS FOUND — POST PHASE B+C INVESTIGATION (2026-06-26)

*These gaps were discovered after Phase A, B, C were built and validated with live data.*

---

### GAP-13 — CRITICAL BUG: Ad Set / Ad / Placement panels do not refresh after sync

- **Severity:** P0
- **Discovered:** 2026-06-26
- **Description:** After clicking "Sync from Meta" or "Apply" (date range sync), only the Campaign table refreshes. The three new panels — Ad Set Intelligence, Individual Ad Performance, Placement Breakdown — keep showing stale data from the PREVIOUS sync.
- **Root Cause (confirmed by DB inspection):**
  - `handleMetaSync()` and `handleApply()` in `AdsIntelTab.jsx` only call `loadSummary()` after sync completes
  - `loadSummary()` refreshes `ExecutiveSummary` → updates Campaign table ✅
  - `AdSetTable`, `AdPerformanceTable`, `PlacementPanel` have their own fetch that fires only on `[dateFrom, dateTo]` change — never on sync completion ❌
- **Evidence:**
  - DB confirmed has 39 adsets (after full history sync at 09:55:24)
  - UI shows only 4 adsets (stale from previous Jun 21-26 sync)
  - Campaign table correctly showed 17 campaigns (refreshed by loadSummary)
- **Impact:** User sees Campaign table with full history (₹7L+ spend) alongside Ad Set table with Jun 21-26 data (₹2,333) — appears as a major data inconsistency.
- **Fix:** Add `syncVersion` counter in `AdsIntelTab.jsx` that increments after every sync and Apply. Pass as prop to all 3 panels. Include in their `useEffect` dep arrays.
- **Fix scope:** 5-8 lines

---

### GAP-14 — BUG: Backend date filter passed to Ad Set / Ad / Placement endpoints but ignored

- **Severity:** P1
- **Discovered:** 2026-06-26
- **Description:** Frontend passes `date_from` and `date_to` to all 3 new panel API endpoints. Backend receives them but the MongoDB query ignores them — always returns ALL rows regardless of selected date range.
- **Root Cause:** `get_adset_performance()`, `get_ad_performance()`, `get_placement_breakdown()` in `funnel.py` accept `date_from/date_to` params but do not apply them as a filter in the `$match` stage.
- **Impact:** Selecting Jan 2025 vs Jun 2026 returns identical data. Date filter in the UI gives the user a false sense of control.
- **Correct Behaviour:** When a date range is selected, the panels should read only rows from the DB whose `date_start`/`date_stop` or `synced_at` falls within that range — OR trigger a fresh Meta API sync for that period and display the result.
- **Note:** The correct long-term approach is that a date range selection = re-sync from Meta API for that period + display results. Currently only the Campaign table benefits from this because it reads from `executive_summary` which is freshly computed after sync.
- **Fix scope:** Medium — add `date_start`/`date_stop` filter in each query function

---

### GAP-15 — ARCHITECTURE GAP: Demo Given and Won cannot be attributed to individual Meta ads

- **Severity:** P1 (architectural limitation, not a code bug)
- **Discovered:** 2026-06-26
- **Description:** `demo_given_count` and `purchase_count` are always 0 at the ad and ad-set level from Meta API. The columns exist in the UI and DB but will never populate with meaningful data from Meta API alone.
- **Root Cause:**
  - `demo_given` = Freshsales CRM stage (demo attended in a Zoom call) — this is an **offline event**, no Meta pixel fires for it
  - `won` = Freshsales CRM deal closed — same, **offline event**
  - Meta pixel can only fire events that happen on the website. Demo attendance and deal close happen in Zoom/CRM.
  - Confirmed: Meta API diagnostic for Jun 21-26 shows ZERO `Demo Given` or `Purchase` pixel events in `conversions` array for any campaign
- **What IS available from Meta API:** Book Demo (pixel fires on booking form submit), Schedule (Calendly pixel)
- **What requires attribution stitching to get:** Demo Given, Won per ad/adset
- **Fix Path (high complexity):**
  - Option A: Meta Conversions API server-side — send CRM stage events back to Meta with hashed phone/email → Meta attributes to correct ad. Requires Meta Business Manager setup + new backend endpoint.
  - Option B: UTM mandate — `utm_term={ad_id}` on all Meta ad URLs → capture ad_id in Freshsales → match CRM outcomes per ad_id in DB. Simpler but requires UTM tagging on every ad.
- **Action required from owner:** Confirm which option to pursue. Until resolved, Demo Given and Won columns at ad level should show "N/A — attribution required" instead of 0.

---

### GAP-16 — BUG: Rule-based signals never fire for live Meta API data

- **Severity:** P1
- **Discovered:** 2026-06-26
- **Description:** The AI Recommendations panel shows "No rule-based signals yet" even after Meta API sync. All three signal generators are broken for live API data.
- **Sub-issues:**

  **16a — Creative fatigue rule uses wrong source field**
  ```python
  # BROKEN: looks for CSV upload format
  {"source": "meta_ad", "frequency": {"$gt": FATIGUE_FREQUENCY}}
  # All live data is stored as:
  {"source": "meta_api"}   # never matches
  ```
  FATIGUED signals will never fire for live Meta API data.

  **16b — Campaign signals read UTM attribution, not Meta API data**
  ```python
  funnel_data = await funnel_module.get_funnel_by_attribution(db, dimension="campaign")
  # Returns leads where utm_campaign = campaign_name
  # Meta ads rarely have utm_campaign set → leads = 0 for all Meta campaigns
  # Rule: if spend > threshold AND leads > 5 AND demos == 0 → PAUSE
  # But leads = 0 → condition `leads > 5` never met → PAUSE never fires
  ```

  **16c — No signals generated from Meta API ad/adset data at all**
  The `ad_spend` collection has rich Meta API data (spend, frequency, book_demo_count, schedule_count per adset and ad), but the signals engine never reads from it. All signals are based on UTM-attributed CRM funnel data only.

- **Impact:** The recommendations panel is completely silent for Meta API campaigns. The only output is the LLM analysis (which works but requires button click).
- **Fix:** Add a new `_meta_api_signals()` function that reads directly from `ad_spend` collection for signals.

---

### GAP-17 — INTELLIGENCE GAP: No funnel drop-off analysis

- **Severity:** P1
- **Discovered:** 2026-06-26
- **Description:** The recommendations engine cannot identify WHERE conversion is breaking down in the funnel. The user specifically needs to know: "Is the ad wrong? Is CTR wrong? Or is the landing page wrong? Where is the conversion stopping?"
- **Missing intelligence chain:**
  ```
  Meta API (per ad):     Clicks → Book Demo → Schedule
  CRM (per campaign):    Lead → Demo Scheduled → Demo Given → Won

  Conversion rates needed:
  1. Click-to-BookDemo rate   = Book Demo ÷ Clicks          → measures ad + offer quality
  2. BookDemo-to-Demo rate    = Demo Given ÷ Book Demo       → measures follow-up + no-show
  3. Demo-to-Won rate         = Won ÷ Demo Given             → measures sales + product fit
  4. Click-to-Lead rate       = CRM Leads ÷ Meta Clicks      → measures landing page quality
  ```
- **Currently computable (Meta API only):**
  - Click-to-BookDemo rate per ad ✅ (both data points from Meta API)
  - Frequency fatigue detection ✅ (from Meta API)
- **Currently NOT computable (missing attribution):**
  - BookDemo-to-Demo rate per ad ❌ (requires fbclid stitching)
  - Demo-to-Won rate per ad ❌ (requires fbclid stitching)
  - Click-to-Lead rate per campaign ❌ (requires UTM tags on Meta ads)
- **What CAN be built now (without attribution stitching):**
  - Detect high-CTR + low-BookDemo → flag as LP problem
  - Detect high-BookDemo + low-Schedule → flag as Calendly friction
  - Detect low frequency + low CTR → flag as creative/audience problem
  - Detect high spend + zero conversions per ad → flag as creative failure
- **Fix:** Add conversion rate calculations and diagnostic signals to recommendations engine using Meta API data only (no CRM stitching needed for the partial analysis).

---

### GAP-18 — INTELLIGENCE GAP: No campaign age context in recommendations

- **Severity:** P2
- **Discovered:** 2026-06-26
- **Description:** Rules fire purely on spend/conversion thresholds with no awareness of how long a campaign has been running. A 7-day-old campaign with ₹5,000 spend gets the same REVIEW signal as a 6-month-old campaign with the same spend.
- **Root Cause:** `_campaign_signals()` never reads `date_start` from campaign rows.
- **Impact:** Premature PAUSE/REVIEW signals on new campaigns. Creates noise and erodes trust in recommendations.
- **Correct Behaviour:** 
  - Campaign < 7 days old → suppress PAUSE/REVIEW, show "TOO EARLY — campaign needs 7+ days of data"
  - Campaign 7-30 days old → use conservative thresholds
  - Campaign > 30 days old → use full thresholds
- **Fix:** Read `date_start` from `ad_spend` campaign rows, calculate campaign age in days, apply age gates to all signals.

---

### GAP-19 — INTELLIGENCE GAP: Rule thresholds are hardcoded without business context

- **Severity:** P2
- **Discovered:** 2026-06-26
- **Description:** All thresholds in `recommendations.py` are arbitrary hardcoded numbers with no business logic behind them.
  ```python
  PAUSE_SPEND_THRESHOLD  = ₹22,000  # why this number?
  REVIEW_SPEND_THRESHOLD = ₹5,000   # why this number?
  BLOCK_SPEND_THRESHOLD  = ₹1,000   # why this number?
  ```
- **What thresholds SHOULD be based on:**
  - **Target CPL (Cost Per Lead)** — If target CPL is ₹800, then ₹5,000 spend with 0 leads → review at 6+ leads expected
  - **Deal value** — If deal = ₹50,000, acceptable CP-Win is up to ₹10,000. Thresholds should scale accordingly
  - **Historical CPL** — Compare current CPL to same campaign's historical baseline
  - **Campaign daily budget** — If daily budget is ₹500, ₹22,000 threshold means PAUSE fires after 44 days only
- **Fix:** Add configurable threshold settings (can be hardcoded as named constants with comments explaining the business rationale, OR stored as DB config per campaign).

---

### GAP-20 — INTELLIGENCE GAP: No CTR / conversion rate benchmarks

- **Severity:** P2
- **Discovered:** 2026-06-26
- **Description:** The system cannot tell whether a 1.47% CTR is good or bad because there are no benchmark values defined.
- **Needed benchmarks (India B2B SaaS, Meta Leads campaigns):**
  - Industry CTR benchmark: 0.9% - 1.5% for B2B lead gen on Meta
  - Good CTR threshold: > 2.0% → signal SCALE creative
  - Weak CTR threshold: < 0.7% → signal REVIEW creative
  - Click-to-BookDemo: < 0.5% → LP problem signal
  - BookDemo-to-Schedule: < 50% → Calendly friction signal
- **Fix:** Define benchmarks as configurable constants in `recommendations.py` with clear documentation.

---

## 14. UPDATED GAP SUMMARY TABLE (All Gaps)

| Gap ID | Description | Severity | Type | Status | Fix Complexity |
|---|---|---|---|---|---|
| GAP-01 | Pixel events show zero in date filter | P0 | Bug | FIXED ✅ | S |
| GAP-02 | Schedule double-counted | P0 | Bug | FIXED ✅ | S |
| GAP-03 | Meta Ad Set panel | P0 | Missing Feature | DONE ✅ | M |
| GAP-04 | Meta Individual Ad panel | P0 | Missing Feature | DONE ✅ | M |
| GAP-05 | Placement breakdown panel | P0 | Missing Feature | DONE ✅ | M |
| GAP-06 | Audience targeting per ad set | P1 | Missing Feature | DONE ✅ | S |
| GAP-07 | Google Ads API | P1 | Missing Feature | PENDING (needs owner token) | XL |
| GAP-08 | Meta → Lead attribution stitching | P1 | Architecture Gap | PENDING | XL |
| GAP-09 | CRM fields (owner, deal value) | P2 | Missing Feature | PENDING (owner input) | M |
| GAP-10 | Lead quality scoring | P2 | Missing Feature | DONE ✅ | M |
| GAP-11 | LLM recommendations | P2 | Missing Feature | DONE ✅ | M |
| GAP-12 | MetaCreativeTable wrong data source | P1 | Data Quality | PARTIAL (UTM label needed) | S |
| GAP-13 | Panels don't refresh after sync | P0 | Bug | OPEN ❌ | S |
| GAP-14 | Date filter ignored in Ad Set/Ad/Placement queries | P1 | Bug | OPEN ❌ | M |
| GAP-15 | Demo Given / Won = 0 at ad level (structural) | P1 | Architecture Gap | OPEN (needs GAP-08 first) | XL |
| GAP-16 | Rule signals never fire for Meta API data | P1 | Bug | OPEN ❌ | M |
| GAP-17 | No funnel drop-off analysis | P1 | Intelligence Gap | OPEN ❌ | M |
| GAP-18 | No campaign age context in recommendations | P2 | Intelligence Gap | OPEN ❌ | S |
| GAP-19 | Rule thresholds hardcoded / no business context | P2 | Intelligence Gap | OPEN ❌ | S |
| GAP-20 | No CTR / conversion rate benchmarks | P2 | Intelligence Gap | OPEN ❌ | S |

---

## 15. OPEN GAPS BY PRIORITY

### P0 — Fix immediately (blocks accurate data display)
- GAP-13: Panels not refreshing after sync
- GAP-16: Rule signals never fire for Meta API data

### P1 — Fix in next phase (significant intelligence gaps)
- GAP-14: Date filter ignored in queries
- GAP-15: Demo Given / Won structural gap (needs GAP-08 / attribution stitching decision)
- GAP-17: No funnel drop-off analysis
- GAP-07: Google Ads API (blocked on owner)
- GAP-08: Meta attribution stitching (architectural decision needed)

### P2 — Improve intelligence quality
- GAP-18: Campaign age context
- GAP-19: Hardcoded thresholds
- GAP-20: No CTR benchmarks
- GAP-09: CRM depth (deal value, sales owner)

---

## GAP-21 — FEATURE REQUEST: Strategy Lab — Intelligent Brainstorm Card

**Priority: P1 | Status: PLANNED — Phase H | Requested: 2026-06-26**

### What is Missing
The platform currently generates **reactive signals** (SCALE / REVIEW / LP_FRICTION etc.) and an LLM narrative that explains what the data shows. There is no mechanism for **proactive strategic ideation** — helping the user brainstorm what to *test next*, not just what to pause or review.

### What It Should Do
A **"Strategy Lab"** panel powered by Claude Sonnet that:
1. Reads current live signal data (all rule-based signals + funnel rates + placement split + audience data)
2. Uses Claude to generate **4–5 testable strategic hypotheses** from the signal context
3. Each hypothesis is a card with: title, reasoning (why this signal suggests this test), what to test (specific action), confidence level, effort estimate, and category
4. User can tag each card as **Explore / Save to Backlog / Skip** (frontend state only, no DB)
5. **No execution** — pure strategic ideation output

### Input Signals Used
| Data Source | What's Sent |
|---|---|
| `_meta_api_signals()` | SCALE, REVIEW, PAUSE signals with CPL data |
| `_funnel_dropoff_signals()` | LP_FRICTION, WEAK_CREATIVE, CALENDLY_FRICTION + CTR/C2B/B2S rates |
| `_creative_signals()` | FATIGUED signals with frequency data |
| Executive Summary | Total spend, leads, CPL, source split |
| Ad set rows | Audience (age, geo, optimization goal) |
| Placement rows | Instagram vs Facebook vs Audience Network split + CTR per placement |
| Business context | Industry (India B2B SaaS), Target CPL ₹800, sector (restaurant POS) |

### Expected Output Schema
```json
{
  "hypotheses": [
    {
      "title": "Add calendar embed above the fold on the landing page",
      "reasoning": "CTR across 3 ad sets is 1.1–2.2% but click-to-book is only 0–0.31%. Leads are clicking but not converting — LP is the bottleneck.",
      "what_to_test": "Create an LP variant where a Calendly booking widget appears above the hero fold. Measure click-to-book rate over 7 days vs current LP.",
      "confidence": "high",
      "effort": "low",
      "category": "landing_page"
    }
  ]
}
```

### Hypothesis Card Categories
| Category | What it covers |
|---|---|
| `landing_page` | LP UX, offer positioning, CTA placement, friction reduction |
| `audience` | Segment splitting, age targeting, geo refinement, exclusions |
| `creative` | Ad copy, format (video/image/carousel), hook, visual |
| `budget` | Placement concentration, bid strategy, budget reallocation |
| `offer` | Lead magnet, demo vs trial, pricing angle, social proof |

### User Interaction States
- **Idle:** Panel with "Brainstorm" button, no cards yet
- **Loading:** Spinner, "Analysing X signals across Y ad sets…"
- **Generated:** 4–5 hypothesis cards in 2-column grid
- **Tagged:** Each card independently markable as Explore (green) / Skip (dimmed) / Saved (bookmarked)

### Files to Create/Modify
| File | Action |
|---|---|
| `backend/recommendations.py` | Add `_strategy_lab_hypotheses(db)` function |
| `backend/server.py` | Add `POST /api/cms/ads/strategy-brainstorm` endpoint |
| `frontend/src/components/ads/StrategyLabPanel.jsx` | CREATE new panel |
| `frontend/src/components/ads/AdsIntelTab.jsx` | Render `<StrategyLabPanel>` after `<AiRecommendations>` |

### DB Impact: NONE (read-only, no writes)
### Regression Risk: NONE (fully additive)
### Effort: M (3–4 hrs)

---

*Updated: 2026-06-26 — GAP-21 Strategy Lab registered. Phases D+E complete.*

