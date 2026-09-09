# CR-237 — Impact Analysis: Reveal.jsx setVisible(false) Flash on Hydration

**Date:** 2026-09-08
**Priority:** P1 — UX / CWV
**Reported by:** Owner — 1–2s blank page on `/product`
**Root cause confirmed:** `src/components/site/Reveal.jsx`

---

## Problem Statement

On every page load (direct URL or client-side nav), React hydration runs the `Reveal` component's `useEffect`. This always calls `setVisible(false)` — hiding every Reveal-wrapped element to `opacity:0` and `translateY(28px)` — regardless of whether the element is already visible in the viewport.

For above-fold and near-fold elements that were already rendered in the prerendered HTML with `opacity:1`, this creates a perceptible blank flash:

```
1. Prerendered HTML arrives → all Reveal elements visible (opacity: 1)
2. React hydrates → useEffect fires → setVisible(false) → ALL opacity: 0 simultaneously
3. IntersectionObserver fires async → above-fold elements restored to opacity: 1
4. Page looks normal again

Gap between 2 and 3 = BLANK FLASH (100–500ms)
```

---

## Root Cause — `Reveal.jsx` lines 8–16

```jsx
const [visible, setVisible] = useState(true);   // starts visible (prerender-friendly)
useEffect(() => {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.webdriver) return;    // skip for Puppeteer prerender
  setVisible(false);                  // ← ALWAYS hides, even if already in viewport
  const obs = new IntersectionObserver(
    ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
    { threshold: 0.1, rootMargin: "-80px" }
  );
  if (ref.current) obs.observe(ref.current);
  return () => obs.disconnect();
}, []);
```

`setVisible(false)` runs synchronously inside `useEffect` — one render cycle after mount. The IntersectionObserver callback is asynchronous (fires on the next browser paint cycle or later). This gap = the blank flash.

---

## Why `/product` Is Most Affected

`ProductIndex.jsx` wraps nearly the entire visible page body in `<Reveal>` components:

| Element | Reveal-wrapped? | Above fold? |
|---|---|---|
| Hero left column (H1, text, CTA) | ❌ No | Yes |
| **Hero right column (card visual)** | ✅ Yes | Yes |
| **Product cards grid (all 5 cards)** | ✅ Yes (each card individually) | Partial |
| **Features/outcomes section** | ✅ Yes | Below fold |
| **DemoForm at bottom** | ✅ Yes | Below fold |

When hydration fires, 5+ Reveal components all call `setVisible(false)` simultaneously → the hero right column AND all product cards go invisible at once → page looks blank.

---

## Why Other Pages Are Less Affected

### `/solutions/:slug` (SectorPage)

- Hero left column (H1, text, CTA): NOT in Reveal → stays visible
- Hero right column: wrapped in Reveal at line 110 → briefly invisible
- Below-fold sections: Reveal-wrapped (user doesn't see the flash)
- Owner tests these pages via direct URL → no LP Suspense stacking

### Homepage `/`

- `<Home>` is NOT lazy → no LP Suspense flash
- Hero section uses `EditableImage` inside `[data-testid="hero-visual"]` — NOT in Reveal
- Most above-fold content is visible without Reveal wrapping

---

## Two Stacked Causes on `/product` (via navbar click)

| Cause | Duration | Visible as |
|---|---|---|
| **A: LP Suspense fallback** (`bg-brand-sand`) | ~100–500ms | Sand-colored blank while chunk downloads |
| **B: Reveal `setVisible(false)`** | ~100–500ms | White blank after hydration |
| **Combined** | **200ms–1s+** | Looks like page "takes a while to load" |

Cause A only happens on client-side navigation (clicking "Product" in navbar). Cause B happens on every load including direct URL.

---

## Fix Strategy

**Add an early-return guard in `useEffect`** — if the element is already in the viewport at mount time, skip the hide-and-reveal animation. The element stays `opacity:1` and no flash occurs. Elements below the fold still get the scroll-in animation as before.

**Viewport check:** `rect.top < window.innerHeight - 80` mirrors the existing `rootMargin: "-80px"` so the guard and the observer use the same threshold.

```jsx
// In useEffect, after the webdriver guard:
const rect = ref.current?.getBoundingClientRect();
const alreadyInView = rect && rect.top < (window.innerHeight - 80) && rect.bottom > 0;
if (alreadyInView) return;  // already visible — skip animation, no flash
setVisible(false);
// ... rest unchanged
```

---

## What Changes

| Scenario | Before | After |
|---|---|---|
| Above-fold Reveal element | Hides then re-appears (flash) | Stays visible immediately |
| Below-fold Reveal element | Scroll-in animation | Scroll-in animation (unchanged) |
| Prefers-reduced-motion | No animation (unchanged) | No animation (unchanged) |
| Puppeteer prerender | No animation (unchanged) | No animation (unchanged) |

---

## What Does NOT Change

- All below-fold scroll-in animations — fully preserved
- `prefers-reduced-motion` handling — unchanged
- Puppeteer prerender guard — unchanged
- `delay` prop behaviour — unchanged (only applies when animation runs)
- No changes to any page files — only `Reveal.jsx`

---

## Scope

| Item | Count |
|---|---|
| Files changed | 1 (`Reveal.jsx`) |
| Lines added | ~3 |
| Rebuild required | Yes |
| Pages improved | All pages using Reveal (every page) |
| Highest impact | `/product`, `/solutions/:slug`, `/ai`, `/pricing` |

**Estimated dev time: 5 minutes.**

---

## Risk

**Very low.** The guard only skips the animation for already-visible elements. If `getBoundingClientRect()` fails (SSR, null ref), the existing `setVisible(false)` path runs as before — no regression. The scroll-in animation is preserved for all below-fold elements.

---

*Written 2026-09-08. Root cause confirmed from `Reveal.jsx` source + `ProductIndex.jsx` Reveal usage map + owner report.*
