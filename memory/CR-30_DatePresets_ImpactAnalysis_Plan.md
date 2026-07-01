# CR-30 — Date Presets + Default 7-Day Period on Ads Intelligence

**Status**: IMPLEMENTED ✅ — 2026-07-01  
**Scope**: Frontend only — `AdsIntelTab.jsx` (single file)  
**Risk**: Low — purely additive UI change, no backend changes needed

---

## 1. Problem Statement

`AdsIntelTab` currently opens with empty date inputs. The user must manually type
two dates before any filtered data loads. This creates friction and increases time-
to-insight for every Ads Intelligence session.

---

## 2. Impact Analysis

### What changes
| Area | Change | Risk |
|---|---|---|
| `AdsIntelTab.jsx` state init | `useState("")` → computed last-7-days dates | Very Low |
| `AdsIntelTab.jsx` render | New preset pill row injected above existing date pickers | Very Low |
| Auto-apply on mount | `useEffect` fires `handleApply` once after default dates are set | Low — same path as clicking Apply today |
| Auto-apply on preset click | Preset button sets dates then calls `handleApply` immediately | Low — same |
| Custom preset | Hides precomputed dates, shows date pickers; Apply button stays manual | None |

### What does NOT change
- `handleApply` logic (Meta sync + `loadSummary`) — untouched
- Date input fields — still present and editable in Custom mode
- All downstream panels (`ExecutiveSummary`, `CampaignTable`, etc.) — untouched
- Backend — no changes required

### Side-effect to watch
`handleApply` calls Meta sync when `metaEnabled && dateFrom && dateTo`. On first
load this means a Meta sync fires automatically for the last-7-day window. This is
**desirable** (fresh data) but should be noted.

---

## 3. Preset Definitions

| Label | date_from | date_to |
|---|---|---|
| Last 7d (default) | today − 6 days | today |
| Last 30d | today − 29 days | today |
| Last 90d | today − 89 days | today |
| This Month | 1st of current month | today |
| Custom | user-typed | user-typed |

All dates are `YYYY-MM-DD` strings (format already used by the existing inputs).

---

## 4. Implementation Plan

### Step 1 — Helper: `toISO(date)` and preset calculator
```js
const toISO = d => d.toISOString().slice(0, 10);

const today = new Date();

const PRESETS = [
  { label: "Last 7d",    from: () => { const d = new Date(today); d.setDate(d.getDate() - 6);  return toISO(d); }, to: () => toISO(today) },
  { label: "Last 30d",   from: () => { const d = new Date(today); d.setDate(d.getDate() - 29); return toISO(d); }, to: () => toISO(today) },
  { label: "Last 90d",   from: () => { const d = new Date(today); d.setDate(d.getDate() - 89); return toISO(d); }, to: () => toISO(today) },
  { label: "This Month", from: () => { const d = new Date(today); d.setDate(1);                return toISO(d); }, to: () => toISO(today) },
  { label: "Custom",     from: null, to: null },
];
```

### Step 2 — State changes
```js
// Replace:
const [dateFrom, setDateFrom] = useState("");
const [dateTo,   setDateTo]   = useState("");

// With:
const toISO = d => d.toISOString().slice(0, 10);
const _d7from = () => { const d = new Date(); d.setDate(d.getDate() - 6); return toISO(d); };
const [dateFrom,       setDateFrom]      = useState(_d7from);
const [dateTo,         setDateTo]        = useState(() => toISO(new Date()));
const [activePreset,   setActivePreset]  = useState("Last 7d");
```

### Step 3 — Preset handler
```js
const handlePreset = useCallback((preset) => {
  setActivePreset(preset.label);
  if (preset.label === "Custom") return;  // let user pick dates manually
  setDateFrom(preset.from());
  setDateTo(preset.to());
  // Auto-apply immediately (same as clicking Apply)
  // dates are set synchronously before handleApply reads them via params
}, []); // eslint-disable-line
```
> Note: Because React state updates are async, `handleApply` must read dates from
> local variables (not state) when called right after `setDateFrom/setDateTo`.
> The cleanest approach: compute `from` / `to` inside `handlePreset` and call a
> `_doApply(from, to)` variant that accepts explicit arguments. This avoids the
> stale-closure bug.

**Revised clean approach** (avoids stale-closure):
```js
// Extract apply logic to accept explicit date args (falls back to state)
const _applyDates = useCallback(async (from, to) => {
  const f = from ?? dateFrom;
  const t = to   ?? dateTo;
  if (metaEnabled && f && t) {
    setSyncing(true);
    setSyncResult(null);
    try {
      const p = new URLSearchParams({ date_from: f, date_to: t });
      const r = await fetch(`${API}/api/cms/ads/mcp/meta/sync?${p}`, { method: "POST", headers: h });
      setSyncResult(await r.json());
    } catch (e) { setSyncResult({ error: e.message }); }
    finally { setSyncing(false); }
  }
  await loadSummary();   // loadSummary already reads dateFrom/dateTo from state — needs update too
  setSyncVersion(v => v + 1);
}, [token, dateFrom, dateTo, metaEnabled, loadSummary]); // eslint-disable-line
```
> Actually simpler: move loadSummary to also accept explicit dates OR just trigger
> a dedicated `useEffect` that watches `[dateFrom, dateTo, activePreset]`. See Step 4.

### Step 4 — useEffect for auto-apply on preset change (cleanest pattern)
```js
// Auto-apply whenever activePreset changes (except "Custom" — manual)
const isFirstMount = useRef(true);
useEffect(() => {
  if (activePreset === "Custom") return;
  handleApply();  // dateFrom/dateTo already updated synchronously in handlePreset
}, [dateFrom, dateTo]); // eslint-disable-line
```
> This pattern: preset click → setDateFrom/setDateTo → useEffect fires → handleApply
> reads latest dates via closure. Clean and avoids stale state.

### Step 5 — UI: Preset pill row
Add above the existing `<input type="date" ...>` row:

```jsx
{/* Preset pills */}
<div className="flex flex-wrap gap-1.5">
  {PRESETS.map(p => (
    <button
      key={p.label}
      data-testid={`ads-preset-${p.label.toLowerCase().replace(/\s/g, "-")}`}
      onClick={() => {
        setActivePreset(p.label);
        if (p.label !== "Custom") {
          const f = p.from(); const t = p.to();
          setDateFrom(f); setDateTo(t);
        }
      }}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        activePreset === p.label
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-300 text-slate-600 hover:border-slate-700"
      }`}
    >
      {p.label}
    </button>
  ))}
</div>

{/* Date pickers — always visible, but highlighted only in Custom mode */}
```

### Step 6 — Initial load
Remove the explicit `useEffect → loadSummary()` call on mount.
Instead, the `useEffect([dateFrom, dateTo])` from Step 4 handles the initial load
because `dateFrom` / `dateTo` are initialized with values (not empty strings).

---

## 5. Files Changed

| File | Lines changed (est.) |
|---|---|
| `frontend/src/components/ads/AdsIntelTab.jsx` | ~40 lines net add/edit |

No backend changes. No new files.

---

## 6. Test Plan

| Scenario | Expected |
|---|---|
| Page load | Last 7d preset highlighted; data loads for last 7 days automatically |
| Click "Last 30d" | Dates update, data reloads, preset pill highlights |
| Click "Last 90d" | Same |
| Click "This Month" | date_from = 1st of current month, data reloads |
| Click "Custom" | Date pickers enabled, no auto-apply; Apply button required |
| Meta enabled + preset click | Meta sync fires for the selected range, then summary loads |
| Mobile layout | Pills wrap gracefully on small screens |
