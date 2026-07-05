# CR-19 Phase 4 — Attribution Breakdown Dashboard
## Implementation Planning Document

**Feature:** Keyword & Ad Set performance breakdown (conversion intelligence)
**Scope:** New data only — leads with `keyword` / `ad_set` populated from UTM attribution
**Date:** 2026-06-24
**Status:** PLANNING → READY TO IMPLEMENT

---

## 1. Goal

Surface which specific keywords and ad sets are producing demos, and at what conversion
rate and cost — so the marketing team can reallocate budget toward what works.

**Output (two new tables in the Funnel Dashboard):**
- Table A: Performance by Keyword (`utm_term`)
- Table B: Performance by Ad Set (`utm_content`)

---

## 2. Data Available

### Lead data (MongoDB — `demo_requests`, `quotes`, `contact_messages`)
Every lead captured from the new website (post go-live) carries these fields in the
`attribution` sub-object, now also extracted as top-level fields by `leads.py`:

| Field | Source | Populated for |
|---|---|---|
| `keyword` | `utm_term` | Google Search leads (search term typed by user) |
| `ad_set` | `utm_content` | Google + Meta paid leads (ad set name) |
| `ad_name` | `utm_ad` | Google + Meta paid leads (specific ad/creative) |
| `crm_status` | Freshsales sync | All leads with CRM stage updates |
| `source` | `utm_source` / gclid / fbclid | All leads |

### Spend data (MongoDB — `ad_spend`)
Uploaded via CSV. Currently stored at **campaign + ad_set level**.

| Field | Available |
|---|---|
| Spend by ad_set | ✅ (from uploaded CSVs) |
| Spend by keyword | ❌ (needs separate Keyword CSV upload — Phase B) |

### Filtering Rule (new data only)
A lead is included in these tables **only if** the dimension field is non-null and non-empty:
- Keyword table: `keyword` IS NOT NULL AND NOT ""
- Ad Set table: `ad_set` IS NOT NULL AND NOT ""

Historical / backfilled leads (no UTM attribution) are automatically excluded by this filter.

---

## 3. API Design

### Single new endpoint
```
GET /api/cms/funnel/by-attribution
```

**Query params:**
| Param | Type | Description |
|---|---|---|
| `date_from` | string (ISO date) | Filter leads from this date |
| `date_to` | string (ISO date) | Filter leads to this date |
| `dimension` | `keyword` \| `ad_set` | Which dimension to group by (default: `keyword`) |
| `source` | string (optional) | Filter to google_paid / meta only |

**Response shape:**
```json
{
  "dimension": "keyword",
  "rows": [
    {
      "value": "restaurant pos software",
      "source": "google_paid",
      "lead_in": 42,
      "demo_scheduled": 18,
      "schedule_rate": 42.9,
      "demo_given": 14,
      "given_rate": 77.8,
      "won": 3,
      "won_rate": 21.4,
      "lost": 2,
      "lead_to_win_pct": 7.1,
      "spend": null,
      "cpl": null,
      "cp_sched": null,
      "cp_demo": null,
      "cp_win": null
    }
  ],
  "total_new_leads": 42,
  "note": "Shows only leads with UTM attribution data (post go-live)"
}
```

**Cost fields for Ad Set dimension:**
- Join `ad_spend` collection on `ad_set` field (exact string match between lead's `ad_set`
  and `ad_spend.ad_set` column)
- If no spend record found for that ad set → cost fields = null (shown as "—")

**Cost fields for Keyword dimension (Phase B):**
- Requires keyword-level spend CSV upload → null until then

---

## 4. Backend Changes

### 4.1 `funnel.py` — new function `get_funnel_by_attribution()`

```python
async def get_funnel_by_attribution(db, dimension="keyword", date_from=None,
                                     date_to=None, source=None):
```

**Logic:**
1. Load all leads via existing `_load_all()` — respects date filters, excludes backfilled
   (backfilled leads never have `attribution` sub-object with keyword/ad_set)
2. Filter: keep only rows where `attribution[dimension_utm_key]` is not null/empty
   - For `keyword` → check `attribution.utm_term`
   - For `ad_set`  → check `attribution.utm_content`
3. Optional source filter (google_paid / meta)
4. Group by the dimension value
5. For each group: count lead_in, demo_scheduled, demo_given, won, lost + compute rates
6. For `ad_set` dimension: look up spend in `ad_spend` collection by ad_set name
   (join: `ad_spend.ad_set == group_key`)
7. Sort by `lead_in` descending
8. Return rows + metadata

**Spend lookup for ad set (new helper `_get_spend_by_adset()`):**
```python
async def _get_spend_by_adset(db) -> dict:
    # Returns { "Restaurants_AdSet_June": 18400.0, ... }
    pipeline = [
        {"$group": {"_id": "$ad_set", "total": {"$sum": "$spend"}}}
    ]
    docs = await db.ad_spend.aggregate(pipeline).to_list(1000)
    return {d["_id"]: d["total"] for d in docs if d["_id"]}
```

### 4.2 `server.py` — new route

```python
@api_router.get("/cms/funnel/by-attribution")
async def cms_funnel_by_attribution(
    admin: str = Depends(cms_auth.get_current_admin),
    dimension: str = "keyword",
    date_from: str | None = None,
    date_to: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_by_attribution(
        db, dimension=dimension, date_from=date_from,
        date_to=date_to, source=source
    )
```

---

## 5. Frontend Changes

### 5.1 New component: `AttributionBreakdown.jsx`

**Location:** `/app/frontend/src/components/funnel/AttributionBreakdown.jsx`

**Props:**
```jsx
<AttributionBreakdown token={token} funnelFilters={funnelFilters} />
```

**Component structure:**
```
<section>
  <TabBar>  [By Keyword]  [By Ad Set]  </TabBar>
  <Table>
    Columns (keyword):  Keyword | Source | Leads | Demo Sched. | Demo Given | Won | Lost | Lead→Win%
    Columns (ad_set):   Ad Set  | Source | Leads | Demo Sched. | Demo Given | Won | Lost | Lead→Win% | Spend | CPL | CP Sched | CP Demo | CP Win
  </Table>
  <EmptyState if no data: "No attribution data yet. Update your ad URLs with utm_term and utm_content to start tracking.">
</section>
```

**Internal state:**
- `dimension`: `"keyword"` | `"ad_set"` (tab toggle)
- `data`: API response rows
- `loading`: boolean

**Data fetch:**
```js
fetch(`${API}/api/cms/funnel/by-attribution?dimension=${dimension}&${funnelParams}`)
```
Re-fetches when `dimension` or `funnelFilters` changes.

**Cost columns:** only rendered when `dimension === "ad_set"` (keyword has no spend data yet)

**Sorting:** client-side, default by `lead_in` desc; click column header to re-sort

### 5.2 `LeadsView.jsx` — integration

Add `AttributionBreakdown` below `FunnelBySource`:
```jsx
<FunnelBySource data={funnelBySource} loading={!funnelBySource} />
<AttributionBreakdown token={token} funnelFilters={funnelFilters} />
```

No new state needed in `LeadsView.jsx` — component manages its own fetch.

---

## 6. Visual Design

- **Tab bar:** "By Keyword" / "By Ad Set" — pill toggle, same style as existing filter buttons
- **Keyword column:** monospace font chip (same style as Search Term in leads table)
- **Source dot:** colour-coded dot (blue = Google, indigo = Meta) same as FunnelBySource
- **Won column:** green background highlight (same as FunnelBySource)
- **Lead→Win% badge:** green = best, grey = worst (same PctBadge as FunnelBySource)
- **Cost columns:** amber header (same as FunnelBySource)
- **Empty state:** slate-bordered box with instruction text — not a spinner, not blank
- **Loading state:** skeleton pulse rows (4 rows, same height as real rows)

---

## 7. Edge Cases & Rules

| Case | Handling |
|---|---|
| Lead has `ad_set` but no `crm_status` | Counted in `lead_in`, all stage counts = 0 |
| Multiple leads with same keyword but different sources | Grouped by keyword value only; source shown as "Mixed" if >1 source |
| Ad set name in lead doesn't match any `ad_spend.ad_set` | Cost columns = null / shown as "—" |
| No leads with attribution data at all | Empty state message (not error) |
| `dimension` param not `keyword` or `ad_set` | Backend returns 400 |
| Very long keyword string | Truncated with title tooltip |

---

## 8. What Is NOT in Scope (Phase B — future)

| Item | Reason deferred |
|---|---|
| Keyword-level cost (CPL/CPDemo/CPWin per keyword) | Requires Google Ads Keyword Report CSV upload |
| Ad Name (`utm_ad`) breakdown table | Requires ad URLs to be updated with `&utm_ad=` first — no data yet |
| Campaign-level breakdown | Already covered by FunnelBySource + campaign in leads table |
| Trend over time (week-on-week) | Separate feature, needs chart library |

---

## 9. File Change Summary

| File | Change type | What changes |
|---|---|---|
| `backend/funnel.py` | Add function | `get_funnel_by_attribution()` + `_get_spend_by_adset()` helper |
| `backend/server.py` | Add route | `GET /api/cms/funnel/by-attribution` |
| `frontend/src/components/funnel/AttributionBreakdown.jsx` | New file | Full component |
| `frontend/src/pages/LeadsView.jsx` | Small edit | Add `<AttributionBreakdown>` below FunnelBySource, import it |

**No schema changes. No new MongoDB collections. No new env vars.**

---

## 10. Testing Checklist (post-implementation)

- [ ] API returns empty rows (no error) when no leads have keyword/ad_set data
- [ ] API returns correct counts when test lead with `utm_term` submitted
- [ ] Tab switch between Keyword / Ad Set works, re-fetches
- [ ] Funnel date filter applied to attribution tables
- [ ] Ad Set table shows cost columns; Keyword table does NOT show cost columns
- [ ] Ad set spend join works when ad_set string matches exactly
- [ ] Empty state message shows when dimension has no data
- [ ] Sorting by clicking column headers works
- [ ] CSV export in leads table includes ad_set, keyword, ad_name columns (already done)

---

*Ready to implement. All dependencies already in place.*
