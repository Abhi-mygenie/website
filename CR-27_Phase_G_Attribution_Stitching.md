# CR-27 — Phase G: Attribution Stitching (Campaign + Ad Set + Ad Level)

**Date:** 2026-06-27
**Priority:** P1
**Status:** G2 — Impact Analysis + Planning Complete

---

## 1. OBJECTIVE

Join CRM outcomes (leads, demo_scheduled, demo_given, won, lost) from `backfilled_leads` with ad spend data from `ad_spend` — at **3 levels**: campaign, ad set, and individual ad. This answers "which campaign/ad set/ad made us money?"

---

## 2. DATA AUDIT — WHAT WE HAVE

### 2A. backfilled_leads (1,387 total)

| Field | Count | Join Level | Notes |
|---|---|---|---|
| `first_campaign` | 203 | Campaign | **Text name** for Meta (e.g. `"AK: Test | Leads | LP | 07 Jul - Copy"`), **numeric ID** for Google (e.g. `"23284649500"`) |
| `first_source` | 990 | — | facebook / google / website / chat |
| `keyword` | 1,060 | Ad (Meta) | In Meta context, utm_term = ad name (e.g. `"Ad Test: DCA | Video 02"`) |
| `ad_set` | 770 | Ad Set | From utm_content / cf_est_name (e.g. `"Test: DCA | Image Ad"`) |
| `ad_id` | 769 | Ad | Numeric Meta/Google ad creative ID — **from CR-25, only for future leads** |
| `adset_id` | 769 | Ad Set | Numeric Meta/Google adset/adgroup ID — **from CR-25, only for future leads** |
| `utm_id` | 769 | Campaign | Numeric campaign ID — **from CR-25, only for future leads** |

### 2B. ad_spend (66 rows: 39 Meta + 9 Google + 18 CSV)

| Level | Source | Join Key Available | Example |
|---|---|---|---|
| `campaign` | meta_api | `campaign` (text name) | `"AK: Test | Leads | LP | 07 Jul"` |
| `campaign` | google | `campaign` (text name) + `campaign_id` (numeric) | `"AK: Search | Competitors"` / `"22893707509"` |
| `adset` | meta_api | `ad_set` (text name) + `adset_id` (numeric) | `"Test: DCA | Image Ad"` / `"120231417796010558"` |
| `adset` | google | `ad_set` (text name) | `"Petpooja"` / `"Alpha Terms"` |
| `ad` | meta_api | `ad_name` (text name) + `ad_id` (numeric) | `"Ad Test: DCA | Images 01"` / `"120231417796040558"` |
| `ad` | google | `ad_name` (text) | `"Ad 762973214065"` |

### 2C. Join Key Analysis

**Campaign level:**
| Scenario | Join Key | Coverage |
|---|---|---|
| Meta leads → Meta ad_spend | `first_campaign` (text) = `ad_spend.campaign` (text) | ✅ 2/2 Meta campaigns match. 1 has `" - Copy"` suffix → needs fuzzy/contains match |
| Google leads → Google ad_spend | `first_campaign` (numeric ID) = `ad_spend.campaign_id` | ✅ 45 Google leads have numeric campaign IDs matching ad_spend.campaign_id |

**Ad Set level:**
| Scenario | Join Key | Coverage |
|---|---|---|
| Historical leads | `ad_set` (text name from utm_content) = `ad_spend.ad_set` (text name) | ✅ 2/7 ad sets match exactly. Others need future UTM tagging |
| Future leads (CR-25) | `adset_id` (numeric) = `ad_spend.adset_id` (numeric) | ✅ Exact match — best join key once URL templates are updated |

**Ad level:**
| Scenario | Join Key | Coverage |
|---|---|---|
| Historical leads | `keyword` (utm_term = ad name) = `ad_spend.ad_name` | ✅ 2/6 ads match. Works for Meta leads with utm_term set |
| Future leads (CR-25) | `ad_id` (numeric) = `ad_spend.ad_id` (numeric) | ✅ Exact match — best join key once URL templates are updated |

**Key insight:** Historical leads use TEXT name matching (fuzzy). Future leads (after CR-25 URL template update) will use NUMERIC ID matching (exact). The code must support BOTH.

---

## 3. JOIN STRATEGY

### 3A. Campaign Level — Multi-key match

```
Match order (try in sequence, use first hit):
1. EXACT:  backfilled_leads.first_campaign == ad_spend.campaign
2. NUMERIC: backfilled_leads.first_campaign == ad_spend.campaign_id  (Google leads)
3. NUMERIC: backfilled_leads.utm_id == ad_spend.campaign_id  (CR-25 future leads)
4. FUZZY:  ad_spend.campaign CONTAINS backfilled_leads.first_campaign (handles " - Copy" suffix)
```

### 3B. Ad Set Level — Multi-key match

```
Match order:
1. EXACT:  backfilled_leads.adset_id == ad_spend.adset_id  (CR-25 numeric, best)
2. EXACT:  backfilled_leads.ad_set == ad_spend.ad_set  (text name from utm_content)
3. No fuzzy needed — ad set names are usually exact
```

### 3C. Ad Level — Multi-key match

```
Match order:
1. EXACT:  backfilled_leads.ad_id == ad_spend.ad_id  (CR-25 numeric, best)
2. EXACT:  backfilled_leads.keyword == ad_spend.ad_name  (utm_term = ad name in Meta)
3. No fuzzy needed
```

---

## 4. NEW API ENDPOINTS

### 4A. GET /api/cms/ads/attribution-by-campaign

**Response:**
```json
{
  "rows": [
    {
      "campaign": "AK: Test | Leads | LP | 07 Jul",
      "source": "meta_api",
      "spend": 5396.88,
      "impressions": 68460,
      "clicks": 1141,
      "leads": 42,
      "demo_scheduled": 18,
      "demo_given": 15,
      "won": 8,
      "lost": 3,
      "cpl_crm": 128.49,
      "cp_won": 674.61
    }
  ]
}
```

### 4B. GET /api/cms/ads/attribution-by-adset

Same structure, grouped by ad set name.

### 4C. GET /api/cms/ads/attribution-by-ad

Same structure, grouped by ad name.

---

## 5. FILES CHANGED

| File | Change | Risk |
|---|---|---|
| `backend/funnel.py` | Add 3 new functions: `get_attribution_by_campaign()`, `get_attribution_by_adset()`, `get_attribution_by_ad()` | LOW — new functions |
| `backend/server.py` | Add 3 new endpoints | LOW — new endpoints |
| `frontend/src/components/ads/CampaignTable.jsx` | Add columns: Leads, Demo Sched, Demo Given, Won, CPL(CRM), CP Won | MEDIUM — modifying existing table |
| `frontend/src/components/ads/AdSetTable.jsx` | Add same CRM columns | MEDIUM |
| `frontend/src/components/ads/AdPerformanceTable.jsx` | Add same CRM columns | MEDIUM |
| `frontend/src/components/ads/AdsIntelTab.jsx` | Fetch attribution data and pass to tables | LOW |

---

## 6. BACKEND QUERY LOGIC (funnel.py)

### Campaign level aggregation:

```python
# Step 1: Aggregate CRM outcomes from backfilled_leads
pipeline = [
    {"$match": {"first_campaign": {"$ne": None}}},
    {"$group": {
        "_id": "$first_campaign",
        "leads": {"$sum": 1},
        "demo_scheduled": {"$sum": {"$cond": [{"$in": ["$crm_status", ["demo_scheduled","demo_given","won"]]}, 1, 0]}},
        "demo_given": {"$sum": {"$cond": [{"$in": ["$crm_status", ["demo_given","won"]]}, 1, 0]}},
        "won": {"$sum": {"$cond": [{"$eq": ["$crm_status", "won"]}, 1, 0]}},
        "lost": {"$sum": {"$cond": [{"$eq": ["$crm_status", "lost"]}, 1, 0]}},
    }},
]

# Step 2: Build campaign→spend map from ad_spend (campaign level)
# Include both text name and campaign_id for matching

# Step 3: Multi-key LEFT JOIN in Python
# For each CRM campaign group, try to find matching ad_spend row
```

### Ad Set and Ad level: Same pattern with appropriate join keys.

---

## 7. FRONTEND CHANGES

### Existing table columns (stay as-is):
Campaign/AdSet/Ad Name, Status, Spend, Impressions, Clicks, CTR, CPC, Book Demo, Schedule

### New columns added (from CRM attribution):
| Column | Source | Color |
|---|---|---|
| **CRM Leads** | backfilled_leads count | slate |
| **Demo Sched.** | crm_status in (demo_scheduled, demo_given, won) | indigo |
| **Demo Given** | crm_status in (demo_given, won) | violet |
| **Won** | crm_status = won | emerald |
| **CPL (CRM)** | spend ÷ leads | — |
| **CP Won** | spend ÷ won | — |

### Visual treatment:
- CRM columns grouped with a subtle left border separator
- "CRM Leads" column shows count + small "from Freshsales" tooltip
- Campaigns with no CRM match show "—" (not 0)
- Won column highlighted green when > 0

---

## 8. FUZZY MATCH HANDLING

The `" - Copy"` suffix on campaign names (Meta duplicates campaigns with this suffix):

```
ad_spend:         "AK: Test | Leads | LP | 07 Jul"
backfilled_leads: "AK: Test | Leads | LP | 07 Jul - Copy"
```

**Approach:** Normalise both sides before matching:
1. Strip trailing ` - Copy`, ` - Copy 2`, ` (copy)` etc.
2. Strip trailing whitespace
3. Case-insensitive compare

This is a Python-side normalisation, not a MongoDB change.

---

## 9. REGRESSION RISK

| Area | Risk | Why |
|---|---|---|
| Existing CampaignTable | LOW | Adding columns, not changing existing ones |
| Existing AdSetTable | LOW | Same |
| Existing AdPerformanceTable | LOW | Same |
| Backend endpoints | NONE | New endpoints, no existing ones modified |
| Attribution accuracy | MEDIUM | Fuzzy campaign matching may have false positives. Mitigation: multi-key match with strict priority |

---

## 10. IMPLEMENTATION ORDER

```
Step 1 — Backend: 3 new aggregation functions in funnel.py (2 hrs)
  ├── get_attribution_by_campaign() — aggregate + multi-key join
  ├── get_attribution_by_adset() — aggregate + multi-key join
  └── get_attribution_by_ad() — aggregate + multi-key join

Step 2 — Backend: 3 new API endpoints in server.py (30 min)
  ├── GET /api/cms/ads/attribution-by-campaign
  ├── GET /api/cms/ads/attribution-by-adset
  └── GET /api/cms/ads/attribution-by-ad

Step 3 — Frontend: Add CRM columns to all 3 tables (1.5 hrs)
  ├── AdsIntelTab.jsx — fetch attribution data
  ├── CampaignTable.jsx — add 6 CRM columns
  ├── AdSetTable.jsx — add 6 CRM columns
  └── AdPerformanceTable.jsx — add 6 CRM columns

Step 4 — Validate with known data (30 min)
  ├── "AK: Scaling | Leads" should show leads + won from CRM
  ├── "Test: DCA | Image Ad" should show ad set level CRM data
  └── "Ad Test: DCA | Video 02" should show ad level CRM data
```

**Total effort: ~4-5 hrs**

---

## 11. EXPECTED COVERAGE (current data)

| Level | Total in ad_spend | Can match to CRM leads | Why |
|---|---|---|---|
| Campaign | 5 | 4 of 5 (80%) | 2 Meta exact match, 1 Meta fuzzy (" - Copy"), 3 Google via campaign_id (2 have leads) |
| Ad Set | 7 | 2 of 7 (29%) | Only 2 have matching utm_content in leads. Will improve after Meta URL template update |
| Ad | 6 | 2 of 6 (33%) | Only 2 have matching utm_term in leads. Will improve after Meta URL template update |

**After you update Meta URL template (CR-25):** All future leads will have numeric ad_id/adset_id → 100% exact match at all 3 levels.

---

*CR-27 Phase G Planning — Created 2026-06-27 by E1, Emergent Labs*
*Status: G2 Planning Complete. Ready for G3 implementation.*
