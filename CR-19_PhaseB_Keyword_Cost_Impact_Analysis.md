# CR-19 Phase B — Keyword-Level Cost Data
## Impact Analysis & Implementation Plan

**Date:** 24 June 2026
**Status:** G1 Discovery + G2 Planning
**Effort estimate:** ~3 hours
**Risk:** LOW — additive feature, zero change to existing endpoints/parsers

---

## 1. Problem Statement

The "By Keyword" tab in the Attribution Breakdown dashboard shows **conversion data** (leads, demo scheduled, demo given, won, lead→win%) per keyword — but the **cost columns are blank**.

This is because:
- The current Google Ads CSV upload is a **Campaign-level report** (has `Campaign`, `Cost` — no keyword breakdown)
- The Meta CSV is an **Ad Set-level report** (no keyword concept in Meta)
- There is no keyword-level spend data in the system

**Result:** You can see *which keywords produce wins*, but not *what each keyword costs* — so you can't calculate keyword ROI.

---

## 2. What Changes

### Data Source: Google Ads "Search Keywords" Report

You export this from: **Google Ads → Reports → Predefined → Basic → "Search keywords"**

Expected columns:
```
Keyword | Campaign | Ad group | Match type | Clicks | Impressions | Cost | Currency
```

- **Join key:** CSV `Keyword` column ↔ Lead's `utm_term` (stored as `keyword` in MongoDB)
- **Important:** `utm_term={keyword}` in your ad URLs captures the *account keyword* that triggered the ad. This matches the Keywords report — NOT the Search Terms report (which shows what the user actually typed, may differ slightly).

### What The User Sees After

**BEFORE (current):**
| Keyword | Source | Leads | Demo Sched | Won | Lead→Win% | Spend | CPL | CP Demo | CP Win |
|---|---|---|---|---|---|---|---|---|---|
| restaurant pos | Google | 15 | 6 | 2 | 13.3% | **—** | **—** | **—** | **—** |
| billing software | Google | 8 | 3 | 1 | 12.5% | **—** | **—** | **—** | **—** |

**AFTER (with keyword CSV uploaded):**
| Keyword | Source | Leads | Demo Sched | Won | Lead→Win% | Spend | CPL | CP Demo | CP Win |
|---|---|---|---|---|---|---|---|---|---|
| restaurant pos | Google | 15 | 6 | 2 | 13.3% | **₹12,400** | **₹827** | **₹2,067** | **₹6,200** |
| billing software | Google | 8 | 3 | 1 | 12.5% | **₹6,800** | **₹850** | **₹2,267** | **₹6,800** |

The amber cost columns light up — same visual pattern as the existing "By Ad Set" tab.

---

## 3. Files Changed

| File | Change | Risk |
|---|---|---|
| `backend/ad_spend.py` | Add `parse_google_keywords_csv()` — new parser function | LOW — additive, existing parsers untouched |
| `backend/ad_spend.py` | Update `detect_platform()` to recognise keyword reports | LOW — adds a new detection branch |
| `backend/funnel.py` | Add `_get_spend_by_keyword()` helper | LOW — mirrors existing `_get_spend_by_adset()` |
| `backend/funnel.py` | Update `get_funnel_by_attribution()` — look up keyword spend when `dimension="keyword"` | LOW — 3-line change in existing function |
| `backend/server.py` | No change | NONE |
| `frontend/src/components/funnel/AttributionBreakdown.jsx` | Show cost columns for keyword tab too (currently gated to `ad_set` only) | LOW — change `showCost` condition |
| `frontend/src/components/funnel/AdSpendUpload.jsx` | No change needed — auto-detect handles it | NONE |

**Total:** 2 backend files (additive), 1 frontend file (1-line change)
**Zero changes to:** existing CSV parsers, existing API contracts, existing database schema

---

## 4. Backend Design

### 4.1 New parser: `parse_google_keywords_csv()`

```python
def parse_google_keywords_csv(content: bytes, period_start: str, period_end: str) -> ParseResult:
    """Parse Google Ads Keywords Performance report.
    
    Expected columns: Keyword, Campaign, Ad group, Match type, 
    Clicks, Impressions, Cost, Currency code
    
    Key difference from campaign CSV: has 'Keyword' column + 
    'Ad group' column. Spend is per-keyword row.
    """
```

**Detection logic** (in `detect_platform()`):
```python
# Current: "Campaign status" → google campaign
# New:     "Keyword" + "Ad group" → google_keywords
# Current: "Amount spent" → meta
```

Returns the same `ParseResult` and `SpendRow` dataclasses — but populates `ad_set` field with the keyword value (reusing the existing field for the join, or adding a new `keyword` field to `SpendRow`).

**Decision:** Add a `keyword` field to `SpendRow` (cleaner than overloading `ad_set`). The `ad_spend` MongoDB collection gets a `keyword` field on keyword-report rows.

### 4.2 New spend lookup: `_get_spend_by_keyword()`

Mirrors `_get_spend_by_adset()`:
```python
async def _get_spend_by_keyword(db) -> dict:
    pipeline = [
        {"$match": {"keyword": {"$ne": None}}},
        {"$group": {"_id": "$keyword", "total": {"$sum": "$spend"}}},
    ]
    docs = await db.ad_spend.aggregate(pipeline).to_list(1000)
    return {d["_id"]: d["total"] for d in docs if d["_id"]}
```

### 4.3 Funnel join update

In `get_funnel_by_attribution()`, line ~342:
```python
# Current:
spend_map = {}
if dimension == "ad_set":
    spend_map = await _get_spend_by_adset(db)

# After:
spend_map = {}
if dimension == "ad_set":
    spend_map = await _get_spend_by_adset(db)
elif dimension == "keyword":
    spend_map = await _get_spend_by_keyword(db)
```

And the spend lookup at line ~365:
```python
# Current:
spend = spend_map.get(key) if dimension == "ad_set" else None

# After:
spend = spend_map.get(key)
```

---

## 5. Frontend Design

### 5.1 Show cost columns on keyword tab

In `AttributionBreakdown.jsx`, line 102:
```javascript
// Current:
const showCost = dimension === "ad_set";

// After:
const showCost = true;  // Both tabs now show cost columns
```

Cost columns already render `—` when `spend` is null — so keywords without uploaded cost data gracefully show dashes.

### 5.2 Empty state update

Update the keyword empty-state hint to mention the Keywords CSV:
```
"Upload a Google Ads Keywords report to see CPL and cost per conversion for each keyword."
```

---

## 6. Data Flow (End to End)

```
                    YOUR AD URLS
                    utm_term={keyword}
                         │
                         ▼
              ┌─────────────────────┐
              │   LEAD SUBMITS FORM  │
              │   keyword stored in  │
              │   MongoDB attribution│
              └──────────┬──────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────┐      ┌─────────────┐      ┌────────────┐
│ Leads   │      │ CRM Sync    │      │ CSV Upload │
│ per     │      │ (stage data)│      │ (cost data)│
│ keyword │      │ won/lost/   │      │ per keyword│
│         │      │ demo given  │      │            │
└────┬────┘      └──────┬──────┘      └─────┬──────┘
     │                  │                    │
     └──────────────────┼────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  JOIN ON KEYWORD    │
              │  string match       │
              │  lead.keyword ==    │
              │  ad_spend.keyword   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  ATTRIBUTION TABLE  │
              │  Keyword | Leads |  │
              │  Demos | Won | CPL |│
              │  CP Demo | CP Win  │
              └─────────────────────┘
```

---

## 7. Join Accuracy & Limitations

| Factor | Impact | Mitigation |
|---|---|---|
| **Exact string match** — lead's `utm_term` must exactly match CSV's `Keyword` column | Keywords with typos or case differences won't join | Normalize both to lowercase + trim before join |
| **Broad match keywords** — one keyword can trigger many different search terms | Spend is allocated to the keyword, not the actual search term | This is standard; Google reports spend at keyword level |
| **Multiple campaigns with same keyword** — spend aggregates across campaigns | CPL may blend campaigns | Acceptable for overall ROI view; campaign-level breakdown exists separately |
| **Time period mismatch** — CSV covers a different period than the leads in dashboard | CPL calculation may be off | Show the spend period note (already implemented for ad set) |
| **Keywords not in CSV** — new keywords added after the CSV was exported | Cost columns show `—` for those keywords | User re-uploads fresh CSV periodically |

---

## 8. What You Need To Do (Your Action)

1. **Export the report from Google Ads:**
   - Google Ads → Reports → Predefined → Basic → **"Keywords"** (or create a custom report with Keyword + Cost + Clicks + Impressions)
   - Set date range to match the period you want to analyze
   - Download as CSV

2. **Upload it in the dashboard** — same Ad Spend Upload section you already use. Auto-detect will recognize it as a Google Keywords report.

3. **That's it.** The "By Keyword" tab will show cost columns.

---

## 9. What Is NOT In Scope

| Item | Why deferred |
|---|---|
| Search Terms report (actual queries typed) | Different granularity; would need a separate table. The keyword-level view is more actionable for budget allocation. |
| Automatic Google Ads API pull | Requires OAuth + API setup. Manual CSV upload is simpler and the user already does it for campaign data. |
| Keyword cost trend over time | Requires multiple CSV uploads with date ranges. Future enhancement. |
| Negative keyword analysis | Not in the current dashboard scope. |

---

## 10. Testing Checklist (post-build)

- [ ] Upload existing Google Campaign CSV → still works, no regression
- [ ] Upload existing Meta CSV → still works, no regression
- [ ] Upload Google Keywords CSV → parsed correctly, stored with `keyword` field
- [ ] "By Keyword" tab → cost columns now populated for matching keywords
- [ ] Keywords without CSV data → show `—` gracefully
- [ ] Keywords tab column sorting works on cost columns
- [ ] Delete keyword upload → cost columns revert to `—`
- [ ] Upload history shows keyword uploads with correct source label
- [ ] "By Ad Set" tab → unchanged, still works

---

*Ready to build on your go-ahead.*
