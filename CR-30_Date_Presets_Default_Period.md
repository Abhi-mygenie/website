# CR-30 — Date Presets + Default 30-Day Period on Ads Intelligence

**Opened:** 2026-06-27
**Status:** G2 — Implementation Planning COMPLETE
**Priority:** P1 (usability)
**Effort:** ~45 minutes
**Risk:** ZERO — single frontend file, no backend changes

---

## Problem Statement

The Ads Intelligence dashboard loads with **no date filter** (all-time data). Users must manually pick dates and click Apply every time they visit. This adds friction and means the initial view is often too broad to be actionable.

## Owner Decisions (27 Jun 2026)

1. **Default on page load:** Last 30 days
2. **Preset options:** Last 7 days / Last 30 days / Last 90 days / All Time / Custom
3. **All syncs (Meta + Google) triggered via Apply should use the active date range** (last 30 days by default)

---

## Current Behavior

- `dateFrom=""` and `dateTo=""` on mount → no date params → ALL-TIME data
- User must manually pick dates + click Apply
- Meta sync on Apply only fires when `dateFrom && dateTo` are both set — currently empty on load, so Apply without manual date pick does nothing for Meta sync

## Target Behavior

- Page loads with **"Last 30 days"** pre-selected
- `dateFrom` = today minus 30 days, `dateTo` = today — auto-computed on mount
- All 12 child components fetch with the 30-day range immediately
- Apply button triggers Meta/Google sync for the 30-day range (since dates are pre-filled)
- Dropdown presets let user switch to 7d / 30d / 90d / All Time / Custom
- "Custom" makes date pickers editable
- "All Time" clears dates → unfiltered data

---

## Impact Analysis

### What currently uses dateFrom/dateTo (12 consumers)

| Component | How it receives dates | Behavior on change |
|---|---|---|
| `AdsIntelTab.loadSummary()` | Direct state | Auto-refetches (useCallback dep) |
| `AdsIntelTab.handleApply()` | Direct state | Syncs Meta if dates + enabled, then reloads |
| `CrossChannelPanel` | Props | Auto-refetches (useCallback dep) |
| `CampaignTable` | Via executive-summary response | Reloads with parent |
| `AdSetTable` | Props | Auto-refetches (useCallback dep) |
| `AdPerformanceTable` | Props | Auto-refetches (useCallback dep) |
| `PlacementPanel` | Props | Auto-refetches (useCallback dep) |
| `KeywordIntelTable` | Props | Auto-refetches (useCallback dep) |
| `MetaCreativeTable` | Props | Auto-refetches (useCallback dep) |
| `LandingPagePanel` | Props | Auto-refetches (useCallback dep) |
| `DeviceCityPanel` | Props → 2 fetches | Auto-refetches (useCallback dep) |
| `ExecutiveSummary` | Via loadSummary response | Reloads with parent |

**Key:** ALL components auto-refetch when `dateFrom`/`dateTo` change. No gating by Apply button. Changing the initial state values is all that's needed — every component will pick up the dates automatically.

### Backend endpoints receiving dates (no changes needed)

All 14+ endpoints already accept optional `date_from`/`date_to` params. When provided:
- **Leads** (`_load_all`): filters `created_at` via ISO datetime comparison
- **Ad spend** (campaigns/adsets/ads): filters `date_start` string comparison. Google rows always included (bypass)
- **Attribution stitching**: filters `created_at` on `backfilled_leads`

### Data availability for "Last 30 days" default

| Data source | Last 30 days coverage | Notes |
|---|---|---|
| `backfilled_leads` | ✅ Recent CRM syncs bring in contacts up to today | 1,388 contacts, latest created_at = 2026-06-27 |
| `ad_spend` (Meta) | ⚠️ Current data has date_start=2025-01-01 (full-year sync) | Won't match 2026 range until re-synced with recent dates |
| `ad_spend` (Google) | ✅ Always included (no date_start filter on Google) | 3 campaigns, 3 adsets, 3 ads |
| `demo_requests` | ✅ 2 leads from 2026-06-27 | Within range |

**Note:** On production, Meta is synced with specific date ranges, so the 30-day default will surface relevant spend data. The Apply button also triggers a fresh Meta sync with the active date range.

---

## Implementation Plan

### Single file: `frontend/src/components/ads/AdsIntelTab.jsx`

#### Change 1: Add preset constants and date computation helper

```js
const DATE_PRESETS = [
  { key: "7d",     label: "Last 7 days",  days: 7 },
  { key: "30d",    label: "Last 30 days", days: 30 },
  { key: "90d",    label: "Last 90 days", days: 90 },
  { key: "all",    label: "All time",     days: null },
  { key: "custom", label: "Custom",       days: null },
];

function computeDateRange(days) {
  if (!days) return { from: "", to: "" };
  const to = new Date();
  const from = new Date(Date.now() - days * 86400000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
```

#### Change 2: Initialize state with 30-day default

**Before:**
```js
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo]     = useState("");
```

**After:**
```js
const defaultRange = computeDateRange(30);
const [preset, setPreset]     = useState("30d");
const [dateFrom, setDateFrom] = useState(defaultRange.from);
const [dateTo, setDateTo]     = useState(defaultRange.to);
```

#### Change 3: Add preset change handler

```js
const handlePresetChange = (key) => {
  setPreset(key);
  const def = DATE_PRESETS.find(p => p.key === key);
  if (def?.days) {
    const range = computeDateRange(def.days);
    setDateFrom(range.from);
    setDateTo(range.to);
  } else if (key === "all") {
    setDateFrom("");
    setDateTo("");
  }
  // "custom" — keep current dates, let user edit
};
```

#### Change 4: Replace controls bar UI

**Before:**
```
[PERIOD] [date-input] to [date-input] [Apply] [Live Only] ...
```

**After:**
```
[PERIOD] [▾ Last 30 days] [date-input] to [date-input] [Apply] [Live Only] ...
```

- `<select>` dropdown with 5 preset options
- Date pickers: visible always, **disabled** when preset is not "custom"
- When user manually edits a date picker, auto-switch preset to "custom"
- All existing elements (Apply, Live Only, Sync buttons) unchanged

#### Change 5: Auto-switch to "custom" when dates manually edited

```js
// In the date input onChange handlers:
onChange={e => { setDateFrom(e.target.value); setPreset("custom"); }}
onChange={e => { setDateTo(e.target.value); setPreset("custom"); }}
```

---

## Files Impact Summary

| File | Change | Lines added/modified |
|---|---|---|
| `frontend/src/components/ads/AdsIntelTab.jsx` | Add DATE_PRESETS constant, computeDateRange helper, preset state, handlePresetChange, dropdown UI, default 30d initialization, auto-custom on manual edit | ~30 lines |

**Total files:** 1
**Backend changes:** 0
**New files:** 0
**New endpoints:** 0
**New packages:** 0
**Env changes:** 0

---

## Acceptance Criteria

| # | Criterion | How to verify |
|---|---|---|
| 1 | Page loads with "Last 30 days" pre-selected in dropdown | Screenshot on load |
| 2 | Date pickers show today and today-30 on load | Inspect values |
| 3 | All panels load with 30-day filtered data immediately (no manual click) | Check API calls in network tab |
| 4 | Selecting "Last 7 days" auto-fills dates and re-fetches all panels | Click + observe data change |
| 5 | Selecting "Last 90 days" auto-fills dates and re-fetches all panels | Click + observe |
| 6 | Selecting "All time" clears dates and shows unfiltered data | Click + verify all-time counts |
| 7 | Selecting "Custom" keeps current dates and makes pickers editable | Click + try editing |
| 8 | Manually editing a date auto-switches dropdown to "Custom" | Edit date + check dropdown label |
| 9 | Apply button syncs Meta/Google for the active date range (30d default) | Click Apply + check sync result |
| 10 | Switching preset then clicking Apply syncs for the new range | Select 7d → Apply → verify sync period |

---

## Dependencies & Blockers

- **None.** Pure frontend state change. All backend endpoints already support the date params.

---

## Gate Progress
- [x] **G1 Discovery & Impact** — DONE (2026-06-27)
- [x] **G2 Planning** — DONE (2026-06-27). Owner decisions locked, single-file approach confirmed
- [ ] **G3 Implementation** — Ready to build (~45 min)
- [ ] **G4 QA**
- [ ] **G5 Owner Smoke Test**

---

*CR-30 registered by E1, Emergent Labs. 27 June 2026.*
