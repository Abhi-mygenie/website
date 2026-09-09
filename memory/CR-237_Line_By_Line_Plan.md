# CR-237 — Line-by-Line Plan: Reveal.jsx setVisible(false) Flash Fix

**Date:** 2026-09-08
**Priority:** P1 — UX / CWV
**File:** `src/components/site/Reveal.jsx`
**Total ops:** 1 search-replace
**Lines changed:** +3 lines (guard added inside useEffect)

---

## Decision Log

| Decision | Rationale |
|---|---|
| Guard in `useEffect`, not in `useState` initialiser | `useState` runs during SSR/prerender; `useEffect` runs only in browser. The guard must be browser-only. |
| Threshold `window.innerHeight - 80` | Mirrors `rootMargin: "-80px"` on the IntersectionObserver — same viewport definition, consistent behaviour. |
| `rect.bottom > 0` check | Ensures element is actually below the top of the viewport (not scrolled past). |
| No change to below-fold elements | Elements where `rect.top >= window.innerHeight - 80` still go through the full hide→reveal cycle. Scroll-in animation fully preserved. |
| Null-safe `ref.current?.getBoundingClientRect()` | If ref is null (edge case), `alreadyInView` is falsy → falls through to `setVisible(false)` — no regression. |

---

## Pre-Implementation Check

```bash
grep -n "setVisible\|IntersectionObserver\|alreadyInView\|rootMargin" /app/frontend/src/components/site/Reveal.jsx
# Expected: no "alreadyInView" (not yet added)
# Expected: setVisible(false) at ~line 13, rootMargin: "-80px" at ~line 17
```

---

## Op 1 — `src/components/site/Reveal.jsx`

### Find (exact current useEffect):

```jsx
  useEffect(() => {
    // Respect reduced-motion preference — skip animation entirely
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Skip re-hide during Puppeteer prerender (navigator.webdriver = true)
    // so the static snapshot has opacity:1 on all elements
    if (navigator.webdriver) return;
    // Re-hide for animation, then reveal on intersection
    setVisible(false);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "-80px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
```

### Replace with:

```jsx
  useEffect(() => {
    // Respect reduced-motion preference — skip animation entirely
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Skip re-hide during Puppeteer prerender (navigator.webdriver = true)
    // so the static snapshot has opacity:1 on all elements
    if (navigator.webdriver) return;
    // CR-237: skip animation for elements already in the viewport at mount time.
    // Prevents above-fold Reveal elements from flashing opacity:0 during hydration.
    // Threshold mirrors rootMargin:"-80px" — element must be 80px inside viewport.
    const rect = ref.current?.getBoundingClientRect();
    const alreadyInView = rect && rect.top < (window.innerHeight - 80) && rect.bottom > 0;
    if (alreadyInView) return;
    // Re-hide for animation, then reveal on intersection
    setVisible(false);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "-80px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
```

**Lines added:** 4 (comment + 2 logic lines + blank line)
**Lines changed:** 0 (all existing lines preserved)

---

## Post-Edit Verification

```bash
# 1. Guard is present
grep -n "alreadyInView\|getBoundingClientRect\|CR-237" /app/frontend/src/components/site/Reveal.jsx
# Expected: 3 lines (comment, rect declaration, if guard)

# 2. setVisible(false) still present (below-fold animation preserved)
grep -n "setVisible(false)" /app/frontend/src/components/site/Reveal.jsx
# Expected: 1 match (still in useEffect, after the guard)

# 3. IntersectionObserver still present
grep -n "IntersectionObserver\|rootMargin" /app/frontend/src/components/site/Reveal.jsx
# Expected: both present (below-fold scroll-in animation unchanged)
```

---

## Build & Restart

```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

---

## Manual Test Plan

| Test | How | Expected |
|---|---|---|
| Direct load `/product` | Paste URL in address bar | No blank flash — product cards visible immediately after page load |
| Client-side nav to `/product` | Click "Product" in navbar | LP Suspense sand flash still present (~100ms) but NO secondary blank flash after |
| Below-fold scroll on `/product` | Scroll down slowly | Product cards below viewport still animate in on scroll |
| Direct load `/solutions/restaurants` | Paste URL | No blank flash |
| Direct load `/pricing` | Paste URL | No blank flash on pricing cards |
| Reduced-motion | Set `prefers-reduced-motion: reduce` in OS | No animation at all (unchanged) |

---

## Production Build (when deploying)

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
cd /app && zip -r mygenie-prod-build.zip frontend/build/
```

---

*Plan written 2026-09-08. 1 file, 1 op, +4 lines.*
