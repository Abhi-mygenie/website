# CR-128 — Logo SVG Explicit Rendered Dimensions

**Type:** Performance / CLS
**Date Raised:** 2026-08-24
**Status:** 🔲 OPEN
**Priority:** P1
**Effort:** 1 line
**Improves:** CLS · "Media element lacking an explicit size" Lighthouse diagnostic
**Score gain:** +0.5 pt
**Scope:** `frontend/src/components/site/Navbar.jsx` (or wherever logo img is rendered)
**Related:** CR-82 (img dimensions), local CLS investigation

---

## Problem Statement

Lighthouse CLS detail flags this element repeatedly:

```html
<img alt="MyGenie POS" class="h-8 w-auto" width="156" height="82" src="/brand/logo-light.svg">
Media element lacking an explicit size
```

The HTML attributes `width="156" height="82"` are set to the **SVG's intrinsic dimensions**, but the CSS class `w-auto` overrides the `width` attribute with `width: auto`. The browser cannot pre-compute the rendered width before the SVG loads, so it cannot reserve the correct space — causing a small layout shift when the SVG dimensions resolve.

**Why `w-auto` defeats the HTML attribute:**
- CSS specificity: inline CSS (`h-8 w-auto`) beats HTML presentation attributes
- `w-auto` = `width: auto` → browser must load the image to determine width
- Despite `width="156"` being present, the computed width is `auto` → no reserved space

**Correct fix:** Set `width` and `height` HTML attributes to match the **actual rendered size**, not the intrinsic SVG size.

Rendered size calculation:
- `h-8` = `height: 2rem` = 32px
- Aspect ratio: 156 / 82 = 1.902
- Rendered width: 32 × 1.902 = **~61px**

---

## Exact Change

Find the logo `<img>` tag (in Navbar, LandingNavbar, or wherever `logo-light.svg` is rendered):

```jsx
// BEFORE
<img alt="MyGenie POS" className="h-8 w-auto" width="156" height="82" src="/brand/logo-light.svg" />

// AFTER
<img alt="MyGenie POS" className="h-8 w-auto" width="61" height="32" src="/brand/logo-light.svg" />
```

**Why this works:** The HTML `width="61" height="32"` now matches what the CSS actually renders. Browser reserves exactly 61×32px before image loads. No shift.

---

## Files to Check

Search for `logo-light.svg` and `logo.svg` across all component files — the logo appears in Navbar, LandingNavbar, and possibly Footer.

---

## Definition of Done

- [ ] Lighthouse "Media element lacking an explicit size" warning gone for logo
- [ ] Logo renders visually identical
- [ ] CLS shifts from logo eliminated

---

*CR-128 registered 2026-08-24. Identified from Lighthouse CLS detail on preview URL.*
