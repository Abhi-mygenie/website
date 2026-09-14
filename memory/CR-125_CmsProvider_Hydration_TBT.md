# CR-125 — CmsProvider Blocking Hydration → TBT Contribution

**Type:** Performance / CWV
**Date Raised:** 2026-08-24
**Raised By:** CWV investigation session (E1)
**Status:** 🔲 OPEN
**Priority:** P1
**Effort:** Low (~1 hr)
**Improves:** TBT · Lighthouse Performance score (~5–8 pts)
**Scope:** `frontend/src/lib/cms/CmsProvider.jsx` · `frontend/src/App.js`
**Related:** CR-124 (Suspense hydration gap), CR-115 (TBT reduction)

---

## 1. Problem Statement

`CmsProvider` is statically imported in `App.js` and wraps the entire app. On every page load it fires `GET /api/cms/content` during the React mount cycle. This backend API call:

1. Executes synchronously on the main thread during initial hydration
2. Blocks React from completing the hydration pass until the fetch resolves
3. Contributes ~200–400ms to TBT on mobile (Slow 4G, backend round-trip ~200ms)

This is visible in the Lighthouse diagnostic: **"Reduce JavaScript execution time — 1.9s"** and **"Minimize main-thread work — 3.1s"**.

---

## 2. Root Cause

```
App.js (static imports)
  └── CmsProvider (wraps entire app)
        └── useEffect: fetch('/api/cms/content')  ← fires on EVERY page mount
              └── Sets CMS content in context
              └── All components using EditableText/EditableImage re-render
```

The fetch itself is async, but:
- The CmsProvider `useEffect` sets up a loading state on mount
- All `EditableText` / `EditableImage` components read from context
- Context update triggers a re-render of the entire app tree
- On a mobile device (4× CPU throttle), this re-render takes 150–300ms

**Impact:** Every single page visit incurs a full-app context re-render triggered by the CMS API response.

---

## 3. Fix Design

### Option A — Defer CmsProvider fetch past TTI (preferred)

Use `startTransition` or `setTimeout(fn, 0)` to push the CMS fetch out of the critical hydration path:

```jsx
// CmsProvider.jsx — inside the fetch useEffect
useEffect(() => {
  // Defer CMS fetch until after initial paint — doesn't affect visual above-fold content
  // (CMS content has prerendered fallbacks; no visible change until CMS overrides load)
  const timer = setTimeout(() => {
    fetch('/api/cms/content').then(/* ... existing logic ... */);
  }, 0); // defers past hydration commit
  return () => clearTimeout(timer);
}, []);
```

**Why safe:** All `EditableText` / `EditableImage` components already have `fallback` props (the hardcoded defaults). The prerendered HTML shows fallback values. The CMS fetch only matters if the CMS has active overrides. Deferring by one tick means users see the correct content (prerendered) immediately, and CMS overrides apply ~100ms later — imperceptible.

### Option B — Lazy load CmsProvider entirely

Wrap `CmsProvider` in `React.lazy` and only load it after TTI. More aggressive, slightly riskier if CMS overrides are above the fold.

**Recommendation: Option A** — minimal change, safe.

---

## 4. Impact Prediction

| Metric | Current | After CR-125 | Δ |
|--------|---------|-------------|---|
| TBT | 820ms (after CR-124: ~600ms) | ~400–500ms | −100–200ms |
| JS execution | 1.9s | ~1.6s | −300ms |
| Performance | ~80 (after CR-124) | ~85–88 | +5–8 pts |

Combined CR-124 + CR-125 predicted performance: **~85–90**.

---

## 5. Files Changed

| File | Change |
|---|---|
| `src/lib/cms/CmsProvider.jsx` | Wrap fetch in `setTimeout(fn, 0)` (~2 lines) |

---

## 6. Definition of Done

- [ ] TBT ≤ 500ms on Lighthouse mobile after CR-124 + CR-125
- [ ] CMS content (EditableText overrides) still loads correctly — spot-check 3 pages
- [ ] No flash of default content visible to users (prerendered HTML shows fallbacks anyway)
- [ ] Testing agent confirms CmsProvider context still works

---

*CR-125 registered 2026-08-24. Identified during TBT investigation on beta.mygenie.online — CmsProvider API call on every page mount contributes to main-thread blocking during hydration.*
