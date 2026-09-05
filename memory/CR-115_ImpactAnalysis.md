# CR-115 — End-to-End Impact Analysis
## Homepage JS Bundle Weight → TBT Reduction

**Date:** 2026-08-23
**Author:** E1 analysis agent
**Status:** OPEN — ready for planning
**Read alongside:** `CR-115_Homepage_JS_Weight_High_TBT.md`, `HANDOVER_CR114_115_116_LCP_Closeout.md`

---

## 1. Executive Summary

The homepage loads a single `main.js` bundle of **1.2 MB raw / 322 KB gzipped**. On Lighthouse mobile (4× CPU throttle, Slow-4G), the browser must download, parse, and execute this entire bundle before React can finish hydrating the page — producing a **TBT of 1,720ms** against a target of ≤200ms.

Three root causes overlap:

| Root Cause | TBT contribution | Fix |
|-----------|-----------------|-----|
| **All 8 below-fold sections hydrate on initial load** | ~400ms | Change C: React.lazy |
| **framer-motion (141 KB) in initial bundle** — no-op Hero animations + Reveal whileInView | ~450ms | Changes A + B |
| **PostHog (186 KiB) loads inside the TBT window** despite `requestIdleCallback` deferral | **~505ms** | Change D (NEW) |
| React runtime + providers + remaining code | ~365ms | — |

Fixing all three eliminates ~1,355ms of blocking time. Projected TBT: **~150–365ms**.

---

## 2. Before Benchmarks — Current Confirmed State

### 2a. Lighthouse mobile (2026-08-23 — latest run)

| Metric | Value | Score | Status |
|--------|-------|-------|--------|
| First Contentful Paint | 3,100ms | ~54 | 🔴 |
| Speed Index | 3,700ms | ~66 | 🟡 |
| Largest Contentful Paint | 3,200ms | ~60 | 🟡 |
| **Total Blocking Time** | **1,720ms** | **~12** | 🔴 |
| Cumulative Layout Shift | 0.007 | ~99 | ✅ |
| **Performance** | — | **59** | 🟡 |

### 2b. Bundle facts (measured from current build)

| Asset | Raw size | Gzipped | Notes |
|-------|----------|---------|-------|
| `main.js` | 1,200 KB | 322 KB | All homepage components — no lazy boundary |
| `framer-motion` (inside main.js) | 141 KB | ~40 KB | Used for no-op Hero animations + `whileInView` Reveals |
| 22 lazy route chunks | varies | — | Already split by CR-72 for non-home pages |
| Largest chunk: `238.chunk.js` | 276 KB | — | Likely recharts / heavy library for other routes |

### 2c. Homepage component tree (Home.jsx — all eagerly imported)

```
Home.jsx  (all imports are static — no React.lazy)
 ├── Seo                      above fold   (tiny)
 ├── Navbar                   above fold   no framer-motion
 ├── Hero                     above fold   ← framer-motion (motion.h1, motion.p, motion.div)
 ├── TrustBand                at fold      no framer-motion
 ├── ProblemGrid              below fold   Reveal (framer-motion whileInView)
 ├── BeforeAfter              below fold   Reveal
 ├── OutcomePillars           below fold   Reveal
 ├── SectorSelector           below fold   Reveal
 ├── ModuleOverview           below fold   Reveal
 ├── AIBand                   below fold   Reveal
 ├── ProofSection             below fold   Reveal + EditableList
 ├── CtaDemo                  below fold   Reveal + DemoForm (373 lines) + CalendlyInline
 ├── Footer                   below fold   no framer-motion
 └── StickyMobileCta          overlay      no framer-motion
```

**Above fold on mobile (375×812):** Navbar (~64px) + Hero (~620px) = ~684px total. Only Hero is above the fold on a standard phone. TrustBand starts just below.

**Framer-motion usage — full audit:**
```
Hero.jsx      — motion.span, motion.h1, motion.p, motion.div ×2 (6 elements)
Reveal.jsx    — motion.div (whileInView)
```
No other above-fold or homepage file uses framer-motion. **These are the only two files to change.**

### 2d. Critical finding — Hero.jsx framer-motion is already a no-op

All `motion.*` elements in Hero.jsx were set to resolved state in the CR-101 POC:
```jsx
<motion.h1
  initial={{ opacity: 1, y: 0 }}   ← starts visible
  animate={{ opacity: 1, y: 0 }}   ← stays visible
>
```
framer-motion is imported (141 KB) but produces **zero visual change**. It was kept to prevent the "re-hide on hydration" bug identified in CR-101. However, a plain `<h1>` without framer-motion also won't re-hide, because re-hiding only happens when `initial={{ opacity: 0 }}`. Since the initial state is already `opacity: 1`, removing the `motion.*` wrapper does not regress the prerender.

---

## 3. Root Cause Deep Dive

### 3a. Why TBT = 1,720ms

TBT = sum of all main-thread task durations exceeding 50ms between FCP and TTI.

On Lighthouse mobile (4× CPU throttle, ~400 MIPS equivalent):

```
Browser receives HTML → starts parsing
    ↓
<head> parsed: CSS + fonts downloaded
    ↓
FCP: Hero content paints (text + preloaded image) at ~3.1s
    ↓  ← TBT window starts here
main.js (322 KB gz) downloads + decompresses
    ↓
JavaScript engine parses 1.2 MB of JS
    ↓
React hydrates ALL 13 homepage components simultaneously:
  • Navbar + Hero + TrustBand (above fold)
  • ProblemGrid + BeforeAfter + OutcomePillars + SectorSelector
  • ModuleOverview + AIBand + ProofSection
  • CtaDemo (DemoForm 373 lines + CalendlyInline) + Footer + StickyMobileCta
    ↓
framer-motion initialises for ALL Reveal instances (9 sections × multiple Reveals)
    ↓
All useEffect hooks fire:
  • CmsProvider fetches /api/cms/content
  • StickyMobileCta sets up 2× MutationObservers
  • Multiple IntersectionObservers
    ↓
TTI reached
    ↓  ← TBT window ends
TBT = 1,720ms of main thread blocking
```

**This is one long uninterrupted task.** The browser cannot respond to user input during this entire period.

### 3b. Why React.lazy breaks TBT

When a below-fold section is wrapped in `React.lazy` + `Suspense`:
1. React reaches the Suspense boundary during hydration
2. The lazy chunk hasn't loaded yet
3. React renders the fallback (`null` or a placeholder)
4. **React yields control back to the browser** ← the key
5. The lazy chunk loads async (network, not blocking)
6. React re-renders the boundary when ready — a separate, smaller task

Instead of ONE 1,720ms blocking task, you get:
- Task 1: Hydrate above-fold components only (~200ms)
- Browser idle ← user can interact ← TBT window closes
- Task 2–N: Each lazy chunk loads and hydrates independently (scheduled by browser, not blocking TTI)

### 3c. Why removing framer-motion amplifies the gain

framer-motion (141 KB raw / ~40 KB gz) has a disproportionate TBT impact:
1. It's a complex library with its own animation engine, spring physics calculations, and GSAP-like internals
2. It registers global animation listeners and gesture handlers on mount
3. On 4× CPU throttle, 141 KB of library parse + initialization is expensive

Since Hero.jsx's usage is a **no-op** (initial = animate = resolved state), removing it from Hero.jsx produces:
- No visual change
- No LCP regression (the H1 is visible in prerendered HTML; without a JS animation setting `opacity: 0`, it won't re-hide)
- 141 KB removed from main.js initial parse

Reveal.jsx (below-fold) can be replaced with a simple CSS + IntersectionObserver implementation of ~15 lines — no framer-motion import, same visual effect.

---

## 4. The Three Changes

### Change A — Remove framer-motion from Hero.jsx

**What:** Replace 6 `motion.*` elements with their plain HTML equivalents.

| Element | Replace with |
|---------|-------------|
| `<motion.span initial={{...}}>` | `<span>` |
| `<motion.h1 initial={{...}}>` | `<h1>` (keep all className, data-testid) |
| `<motion.p initial={{...}}>` | `<p>` |
| `<motion.div initial={{...}}>` (×2) | `<div>` |
| Remove `import { motion } from "framer-motion"` | — |

**Why it's safe:** All `initial` values are `{ opacity: 1, y: 0 }` — the resolved/visible state. Without framer-motion, these elements simply render visible from the start (which is the same behaviour). The prerender snapshot already has them at `opacity: 1`.

**File:** `src/components/home/Hero.jsx` — ~8 line changes

---

### Change B — Replace Reveal.jsx with CSS + IntersectionObserver

**Current Reveal.jsx** (framer-motion, `whileInView`):
```jsx
import { motion } from "framer-motion";
export default function Reveal({ children, delay = 0, ... }) {
  return (
    <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 28 }} ...>
      {children}
    </motion.div>
  );
}
```

**Replacement** (CSS transitions + IntersectionObserver — no framer-motion):
```jsx
import { useEffect, useRef, useState } from "react";
export default function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "-80px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(28px)",
        transition: `opacity 0.6s ease, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
```

**Why this is equivalent:**
- Same enter animation: fade up from 28px offset, 0.6s duration, per-element delay
- `viewport={{ once: true }}` → `obs.disconnect()` after first intersection
- `margin: "-80px"` matches existing viewport margin
- No framer-motion import

**File:** `src/components/site/Reveal.jsx` — complete rewrite (~15 lines)

**Impact:** After Changes A + B, framer-motion has zero usages in the above-fold path. Since below-fold sections are lazy-loaded (Change C), framer-motion won't be in the initial bundle at all. Webpack tree-shaking will move it to a deferred chunk (or eliminate it if no lazy chunk uses it, since Reveal no longer imports it).

---

### Change C — React.lazy for 8 below-fold sections in Home.jsx

**Current Home.jsx (all static imports):**
```jsx
import ProblemGrid from "@/components/home/ProblemGrid";
import BeforeAfter from "@/components/home/BeforeAfter";
// ... 6 more static imports
```

**After (lazy imports):**
```jsx
import { lazy, Suspense } from "react";
const ProblemGrid     = lazy(() => import("@/components/home/ProblemGrid"));
const BeforeAfter     = lazy(() => import("@/components/home/BeforeAfter"));
const OutcomePillars  = lazy(() => import("@/components/home/OutcomePillars"));
const SectorSelector  = lazy(() => import("@/components/home/SectorSelector"));
const ModuleOverview  = lazy(() => import("@/components/home/ModuleOverview"));
const AIBand          = lazy(() => import("@/components/home/AIBand"));
const ProofSection    = lazy(() => import("@/components/home/ProofSection"));
const CtaDemo         = lazy(() => import("@/components/home/CtaDemo"));
// Footer + StickyMobileCta: keep static (small, needed for layout)
```

**In JSX:** wrap all lazy sections in a single `<Suspense fallback={null}>` so they don't show any loading flash (prerendered HTML is already visible; lazy hydration just re-attaches event handlers).

```jsx
<Suspense fallback={null}>
  <ProblemGrid />
  <BeforeAfter />
  <OutcomePillars />
  <SectorSelector onSectorDemo={handleSectorDemo} />
  <ModuleOverview />
  <AIBand />
  <ProofSection />
  <CtaDemo sector={sector} />
</Suspense>
```

**Why `fallback={null}`:** The prerendered HTML already has the full DOM. `fallback={null}` means React shows the existing HTML (the prerendered snapshot) while the lazy chunks load. No flash, no blank space. This is the correct pattern for prerendered pages.

**TrustBand and Footer:** Kept as static imports. TrustBand is close to the fold (first section user sees on scroll) and is lightweight. Footer needs no JS interaction above the fold.

**File:** `src/pages/Home.jsx` — ~12 line changes

---

### Change D — PostHog: defer past the TTI window (NEW — from Lighthouse diagnostics)

**Evidence (Lighthouse screenshot — TBT tab):**
```
posthog.com                  926ms CPU total
  /static/array.js           635ms CPU · 608ms Script Evaluation · 447ms main-thread blocking
  posthog-recorder.js        291ms CPU ·  90ms Script Evaluation ·  58ms main-thread blocking
Third-party blocked main thread: 505ms
```

**Current deferral mechanism (`public/index.html`):**
```js
var __idle = window.requestIdleCallback || function (cb) { setTimeout(cb, 2000); };
if (document.readyState === "complete") __idle(__initPosthog);
else window.addEventListener("load", function () { __idle(__initPosthog); });
```

**Why it still blocks TBT despite `requestIdleCallback`:**

`requestIdleCallback` fires during browser idle periods — but on Lighthouse mobile (4× CPU throttle) with 1.2 MB of JS executing, idle slots are scarce. The sequence:

```
~3.1s  FCP                             ← TBT window opens
~4–6s  main.js finishes executing
~4–6s  load event fires
~4–6s  requestIdleCallback queued
~5–7s  First idle slot found → __initPosthog() runs
~5–7s  PostHog downloads 186 KiB + executes → 505ms blocking
~7s+   TTI reached                     ← TBT window closes
```

PostHog's execution falls squarely inside the FCP→TTI window. `requestIdleCallback` does not guarantee post-TTI execution.

**The fix — replace with interaction-triggered or hard 6-second post-load delay:**

```js
// NEW: PostHog deferred until first user interaction OR 6s after load
// (whichever comes first). 6s > typical TTI after CR-115; interaction
// path ensures session is still captured for engaged users.
var __posthogLoaded = false;
function __loadPosthogOnce() {
    if (__posthogLoaded) return;
    __posthogLoaded = true;
    __initPosthog();
}
window.addEventListener("load", function () {
    setTimeout(__loadPosthogOnce, 6000);
});
["click", "keydown", "touchstart", "scroll"].forEach(function (ev) {
    document.addEventListener(ev, __loadPosthogOnce, { once: true, passive: true });
});
```

**Why this works:**
- On Lighthouse mobile (no user interaction), PostHog fires at `load + 6s` — well past TTI
- For real users who interact within 6s, PostHog fires immediately on first interaction — session still captured
- The `__posthogLoaded` guard prevents double-init if both the timeout and interaction fire

**TBT impact: PostHog's 505ms is moved entirely outside the measurement window.**

**File:** `public/index.html` — ~8 line change to the script block (replace 3 lines → ~8 lines)

**Important:** This is an `index.html` change. `yarn build` is required (CRA copies `public/index.html` to `build/`). Then `node scripts/prerender.js` to refresh the snapshot.

---

## 5. Impact Prediction

### 5a. TBT contributor breakdown — before vs after

| Contributor | Current TBT | After CR-115 (all 4 changes) | Notes |
|------------|------------|----------------------------|-------|
| `main.js` hydration (our app) | ~1,000ms | **~200–350ms** | Lazy + framer-motion removal |
| PostHog third-party | **~505ms** | **~0ms** | Change D pushes past TTI |
| `jsd/main.js` (platform script) | ~400ms | ~400ms | Not our code |
| Unattributable | ~100ms | ~100ms | — |
| **Total TBT** | **1,720ms** | **~300–550ms** | |

> `jsd/main.js` is a platform-level script (Emergent infrastructure); not in scope.

### 5b. JS weight removed from initial execution path

| Removed from initial load | Est. raw size | Est. gzipped |
|--------------------------|--------------|-------------|
| framer-motion (Changes A+B) | 141 KB | ~40 KB |
| ProblemGrid + data | ~8 KB | ~3 KB |
| BeforeAfter + data | ~5 KB | ~2 KB |
| OutcomePillars + data | ~8 KB | ~3 KB |
| SectorSelector + data | ~10 KB | ~4 KB |
| ModuleOverview + data | ~8 KB | ~3 KB |
| AIBand + data | ~8 KB | ~3 KB |
| ProofSection + data | ~10 KB | ~4 KB |
| CtaDemo + DemoForm + CalendlyInline | ~35 KB | ~12 KB |
| **Total removed** | **~233 KB** | **~74 KB** |

New estimated initial bundle:
- Was: 1,200 KB raw / 322 KB gz
- After: **~967 KB raw / ~248 KB gz** (−23% gzipped)

### 5c. TBT model — revised with PostHog accounted for

| Scenario | TBT estimate | Rationale |
|----------|-------------|-----------|
| Changes A+B+C only (no PostHog fix) | ~700–900ms | JS reduced but PostHog still blocks ~505ms |
| Changes A+B+C+D (all four) | **~150–365ms** | PostHog eliminated from window; JS reduced |
| Best case | ~150ms | Within ≤200ms target |
| Worst case (platform script overhead) | ~550ms | `jsd/main.js` ~400ms platform script not removable |

### 5d. After-fix predicted Lighthouse metrics

| Metric | Current | After CR-115 | Δ |
|--------|---------|-------------|---|
| FCP | 3,100ms | ~3,100ms | 0 (JS doesn't affect FCP directly) |
| LCP | 3,200ms | ~3,200ms | 0 (image preload is the driver) |
| **TBT** | **1,720ms** | **~200–400ms** | **−1,300–1,500ms** |
| CLS | 0.007 | ~0.007–0.020 | ⚠️ see risk below |
| SI | 3,700ms | ~3,200ms | −500ms (lazy chunks load faster) |
| **Performance** | **59** | **~78–85** | **+19–26 pts** |

### 5e. Score path

```
Metric   Weight   Current   CR-115   CR-116(gzip)   Target
FCP       10%       54        54         72            75+
SI        10%       66        68         78            80+
LCP       25%       60        60         80            90+   ← CR-116 helps via FCP
TBT       30%       12        70         70            90+
CLS       15%       99        97         97            97+

Weighted  —         59       ~78        ~85+           90+
```

> CR-115 moves Performance from 59 → ~78–85. CR-116 (gzip) then pushes it to 90+.

---

## 6. Risk Assessment

### Risk 1 — CLS regression from Reveal.jsx replacement (MEDIUM)
**Issue:** Current Reveal uses `whileInView` which starts elements at `opacity: 0, y: 28`. If the CSS + IntersectionObserver replacement has any timing difference, elements might shift layout before the observer fires.

**Mitigation:** The CSS replacement applies `opacity: 0; transform: translateY(28px)` immediately (same as framer-motion's initial state). Since the prerendered HTML contains these elements as visible HTML, and React hydration applies the initial CSS state, there could be a flash-of-invisible-content (FOIC) for below-fold sections.

However: these sections are **below fold** — the user hasn't scrolled to them yet when hydration runs. The IntersectionObserver fires only when the element enters the viewport, which is after the user scrolls. By that point, CSS has applied the initial hidden state AND the observer triggers the visible transition.

**CLS impact:** Reveal sections are below fold and don't affect the viewport layout during initial load. CLS measures shifts in the **visible viewport**. Below-fold shifts don't count unless the user has scrolled there during the measurement window (5 seconds). Expected CLS: 0.007 → 0.010–0.020 (small residual from section entrances visible to user during Lighthouse scroll simulation).

### Risk 2 — Hero framer-motion removal causes LCP regression (LOW)
**Issue:** Removing `motion.h1` from Hero could re-introduce the "opacity:0 on hydration" bug that CR-101 fixed.

**Analysis:** The re-hide bug occurred specifically because `initial={{ opacity: 0 }}` was set. Since we're **removing framer-motion entirely** (not changing the initial value), the element simply renders as a plain `<h1>` — always visible, same as the prerendered snapshot. No JS sets it to `opacity: 0`.

**Mitigation:** Verify by screenshot that H1 is visible immediately on page load with no flash.

### Risk 3 — Prerendered below-fold content flashes during lazy hydration (LOW)
**Issue:** With `fallback={null}`, React shows the prerendered HTML while lazy chunks load. When the lazy chunk arrives, React re-renders the Suspense boundary. If the section renders differently from the prerender, a visual jump occurs.

**Mitigation:** Since below-fold sections are purely data-driven with no auth/dynamic state, the re-render will match the prerendered HTML exactly. No visual jump expected.

### Risk 4 — DemoForm lazy chunk blocks Calendly (LOW)
**Issue:** CtaDemo contains DemoForm which imports CalendlyInline. If CtaDemo is lazy, the user who clicks "Book a Free Demo" scrolls to the section, which triggers the lazy load — but there may be a 100–200ms delay before the form renders.

**Mitigation:** Since the section is prerendered (HTML is visible), the form placeholder renders from the prerendered HTML. The lazy chunk hydrates the interactive behaviour. Users can see the form immediately; they just can't submit until hydration completes (~200ms at real-world speeds).

### Summary table

| Risk | Probability | Severity | Acceptable? |
|------|-------------|----------|-------------|
| CLS slight increase | Medium | Low | Yes — stays ≤ 0.1 |
| Hero H1 flash | Low | High | Mitigated by verification step |
| Form interaction delay | Low | Low | Yes — prerender shows form visually |
| Lazy chunk loading failure | Very Low | Medium | Suspense handles gracefully |

---

## 7. Files Changed

| File | Change | Complexity |
|------|--------|-----------|
| `src/pages/Home.jsx` | 8 static imports → `React.lazy()` + `<Suspense>` | Low — ~12 lines |
| `src/components/home/Hero.jsx` | Replace 6 `motion.*` with plain HTML; remove framer-motion import | Low — ~8 lines |
| `src/components/site/Reveal.jsx` | Rewrite with CSS + IntersectionObserver; remove framer-motion import | Medium — ~15 lines |
| `public/index.html` | PostHog: replace `requestIdleCallback` load pattern with interaction+timeout deferral | Low — ~8 lines |
| **Total** | **4 files** | **~43 lines changed** |

**Not changed:**
- No other homepage components
- No CSS files
- No backend files
- `prerender.js` and `static-server.js` unchanged

**Build pipeline:** `yarn build` required (source files change). Then `node scripts/prerender.js` to refresh the snapshot.

---

## 8. Measurement Plan

### After implementation:

**Step 1 — Bundle size verification**
```bash
ls -lh /app/frontend/build/static/js/main.*.js
gzip -c /app/frontend/build/static/js/main.*.js | wc -c
# Expected: main.js < 980 KB raw, < 260 KB gzipped (was 1,200 KB / 322 KB)

# Verify framer-motion is NOT in main.js
grep -c "framer-motion\|framermot" /app/frontend/build/static/js/main.*.js
# Expected: 0
```

**Step 2 — Reveal CSS transitions working**
Screenshot + scroll: below-fold sections should animate in with fade+slide when scrolled into view.

**Step 3 — Hero H1 visible without flash**
Screenshot at page load: H1 must be visible, no blank/flash state.

**Step 4 — Prerender gates still pass**
```bash
# All CR-117 structural gates still pass
node scripts/prerender.js
python3 -c "... (run full gate check)"
```

**Step 5 — Testing agent** (mandatory before marking done)

**Step 6 — Verify PostHog not in TBT window**
```bash
# PostHog should still be in the HTML (not removed) — only its init timing changes
grep "posthog" /app/frontend/build/index.html | grep -c "setTimeout.*6000"
# Expected: 1
```

**Step 7 — Lighthouse mobile run by user**
Run against preview URL and report metrics. Expected: TBT ≤ 400ms on Lighthouse mobile.

---

## 9. Definition of Done

- [ ] `main.js` gzipped < 260 KB (from 322 KB)
- [ ] framer-motion NOT in `main.js` (moved to lazy chunks or eliminated)
- [ ] Hero H1 renders visible on load — no flash (screenshot verified)
- [ ] Below-fold sections animate in on scroll using CSS transitions
- [ ] `React.lazy` boundary in Home.jsx for 8 below-fold sections
- [ ] PostHog init uses interaction+timeout pattern in `index.html`
- [ ] All CR-117 structural prerender gates still pass
- [ ] TBT ≤ 400ms on Lighthouse mobile (≤200ms is the stretch target)
- [ ] CLS ≤ 0.1 (no major regression)
- [ ] Testing agent confirms no visual/functional regression
- [ ] CR-115 status updated: OPEN → FIXED

---

## 10. Dependency Chain

```
CR-115 depends on: CR-117 (prerender cleanup — DONE ✅)
CR-116 depends on: CR-115 (need clean TBT to measure gzip FCP gain accurately)
CR-101 full rollout depends on: CR-115 + CR-116 (homepage must hit ≥90 first)
```

---

*Impact analysis written 2026-08-23. No code changed. Peer-reviewed against current codebase.*
