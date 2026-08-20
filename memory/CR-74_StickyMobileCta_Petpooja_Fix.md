# CR-74 — Fix Broken StickyMobileCta on /petpooja-alternative

**Type:** Bug Fix / Mobile Conversion  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit (code investigation)  
**Status:** OPEN — DESIGN APPROVED 2026-08-20
**Design decision:** Reuse exact same `StickyMobileCta` component and visual design from homepage. Tapping scrolls to `#vsp-demo`. Selector fix expanded to 4 testids so it works on all page types going forward.
**Priority:** CRITICAL  
**Plan ID:** C5  
**Effort:** 30 min  
**Improves:** Conv · QS LP Experience · Mobile CTA  
**Scope:** `frontend/src/pages/PetpoojaAlternative.jsx`, `frontend/src/components/home/StickyMobileCta.jsx`  
**Related:** CR-73 (footer fix), Marketing brief Issue 5

---

## 1. Problem Statement

`StickyMobileCta` — the persistent mobile bottom CTA bar that drives demo bookings on the homepage — is **completely absent** from `/petpooja-alternative`, the highest-spend ad landing page. On mobile, once a user scrolls past the hero, there is no persistent call-to-action.

Additionally, even if the component were imported, it would silently fail: it uses `document.querySelector('[data-testid="hero"]')` to detect scroll position, but the VSP hero uses `data-testid="vsp-hero"`. The component would never trigger.

---

## 2. Root Cause

**Gap 1 — Component not imported:**
`PetpoojaAlternative.jsx` has no import or usage of `StickyMobileCta`.

**Gap 2 — Hardcoded testid mismatch in `StickyMobileCta.jsx` (line 34):**
```js
heroRef.current = document.querySelector('[data-testid="hero"]');
```
The homepage `Hero.jsx` uses `data-testid="hero"` ✓. But `/petpooja-alternative`'s hero section uses `data-testid="vsp-hero"` ✗. The IntersectionObserver would never attach.

---

## 3. Exact Changes Required

### Change 1 — `frontend/src/components/home/StickyMobileCta.jsx`
Update the hero selector to accept multiple testids:
```js
// BEFORE (line 34)
heroRef.current = document.querySelector('[data-testid="hero"]');

// AFTER
heroRef.current =
  document.querySelector('[data-testid="hero"]') ||
  document.querySelector('[data-testid="vsp-hero"]') ||
  document.querySelector('[data-testid="sector-hero"]') ||
  document.querySelector('[data-testid="product-hero"]');
```
This makes the component work on all page types without any per-page configuration.

### Change 2 — `frontend/src/pages/PetpoojaAlternative.jsx`
Add import and usage:
```jsx
// Add to imports
import StickyMobileCta from "@/components/home/StickyMobileCta";

// Add at the bottom of the page shell, before closing </div>
<StickyMobileCta onDemo={() => document.getElementById("vsp-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/home/StickyMobileCta.jsx` | Update hero selector to match multiple page testids |
| `frontend/src/pages/PetpoojaAlternative.jsx` | Import + add StickyMobileCta with vsp-demo scroll target |

---

## 5. Definition of Done

- [ ] On /petpooja-alternative mobile: StickyMobileCta bar appears after scrolling past the hero
- [ ] Tapping the bar scrolls to the demo form (`#vsp-demo`)
- [ ] Homepage StickyMobileCta still works correctly (no regression)
- [ ] Component dismissed state works (✕ button hides bar)
- [ ] Bar adjusts position correctly when consent banner is showing

---

*CR-74 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C5.*
