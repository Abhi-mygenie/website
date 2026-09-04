# CR-124 — React.lazy Suspense Hydration Gap → CLS 0.212 + TBT on Production

**Type:** Performance / CWV
**Date Raised:** 2026-08-24
**Raised By:** CWV investigation session (E1)
**Status:** 🔲 OPEN
**Priority:** P0
**Effort:** Medium (~2 hrs)
**Improves:** CLS · TBT · Lighthouse Performance score (~25 pts combined with CR-125)
**Scope:** `frontend/src/pages/Home.jsx` — Suspense boundary strategy
**Related:** CR-115 (React.lazy implementation), CR-125 (CmsProvider TBT)

---

## 1. Problem Statement

Lighthouse mobile on `beta.mygenie.online` shows **CLS: 0.212** and **TBT: 820ms** despite:
- Prerendering active (all 53 routes prerendered ✅)
- framer-motion removed from Hero ✅
- React.lazy on 8 below-fold sections ✅
- PostHog deferred 6s ✅

Previous session (frontend-staging-12, localhost) recorded **CLS: 0, TBT: 452ms**.

**Root cause: Suspense `fallback={null}` on a real network causes prerendered sections to vanish during hydration.**

---

## 2. Root Cause Deep Dive

### What happens on production (real mobile network)

```
Timeline — production Slow 4G mobile
──────────────────────────────────────────
0.0s  HTML arrives — prerendered sections 1–8 visible in DOM (correct)
0.3s  JS bundle starts downloading
0.8s  React starts hydrating
0.8s  Hits <Suspense fallback={null}> boundary
0.8s  Lazy chunks NOT loaded yet → React renders fallback={null}
0.8s  Sections 1–8 REMOVED from DOM  ← CLS SHIFT (0.212)
      Page collapses: 8 below-fold sections disappear
1.4s  All 8 lazy chunks finish downloading (real network)
1.4s  React re-renders all 8 sections  ← reverse shift (partially measured)
──────────────────────────────────────────
```

**On localhost (previous session):** lazy chunks load in ~5ms → vanish/reappear gap is imperceptible → CLS registers as 0.

**On production:** chunks take 300–700ms over real mobile network → gap is large enough for Lighthouse to measure → CLS 0.212.

### Why CLS = 0.212 (single large shift)

The Suspense boundary wraps ALL 8 sections in one block. All go to `null` together. If Lighthouse's scroll simulation has moved the viewport past the hero fold at the moment of collapse, it records a single viewport-filling shift. Score = shifted_fraction × distance_fraction ≈ 0.212.

### TBT contribution

Without prerendered HTML to show, the `fallback={null}` Suspense doesn't allow React to yield the main thread effectively. The hydration of `CmsProvider` + `HelmetProvider` + `QueryClientProvider` + above-fold components still blocks for ~400ms before yielding.

---

## 3. Fix Design

### Option A — `startTransition` wrap (React 18, preferred)

Wrap the lazy hydration in `startTransition` so React deprioritises it and yields to the browser:

```jsx
// Home.jsx
import { useState, useCallback, lazy, Suspense, startTransition } from "react";

// Replace the single Suspense with a deferred render trigger
const [belowFoldReady, setBelowFoldReady] = useState(false);

useEffect(() => {
  startTransition(() => setBelowFoldReady(true));
}, []);

// In JSX:
<Suspense fallback={null}>
  {belowFoldReady && (
    <>
      <ProblemGrid />
      <BeforeAfter />
      {/* ... all 8 sections ... */}
    </>
  )}
</Suspense>
```

**Effect:** React defers rendering the below-fold sections to a low-priority transition. The prerendered HTML stays visible (no collapse). When the transition commits, sections hydrate in place without CLS.

### Option B — `fallback={<PrerenderedFallback />}` (simpler, less clean)

Instead of `null`, use a fallback component that preserves the DOM height matching the prerendered content. Requires measuring heights — brittle.

**Recommendation: Option A** — clean, React 18 native, no height calculations.

---

## 4. Impact Prediction

| Metric | Current | After CR-124 | Δ |
|--------|---------|-------------|---|
| CLS | 0.212 | ~0.01–0.05 | −0.16+ |
| TBT | 820ms | ~550–650ms | −170ms |
| Performance | ~72 | ~80 | +8 pts |

Remaining TBT gap (550–650ms) is addressed by CR-125 (CmsProvider).

---

## 5. Files Changed

| File | Change |
|---|---|
| `src/pages/Home.jsx` | Add `startTransition` + `belowFoldReady` state gate (~8 lines) |

---

## 6. Definition of Done

- [ ] CLS ≤ 0.05 on Lighthouse mobile (beta.mygenie.online)
- [ ] Below-fold sections do NOT disappear during hydration (screenshot at 0.5s shows sections still visible)
- [ ] TBT reduced from 820ms
- [ ] All prerender gate checks still pass (CR-117 structural gates)
- [ ] Testing agent confirms no visual regression

---

*CR-124 registered 2026-08-24. Identified during production Lighthouse investigation — gap between localhost (CLS:0) and production (CLS:0.212) caused by real network latency exposing Suspense hydration gap.*
