# CR-93 — Fix Cookie Banner Overlap at 768px Tablet Breakpoint

**Type:** Mobile/Tablet UX Fix  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M13 (GAP-2)  
**Effort:** 30 min  
**Improves:** UX · Conv · Mobile LP Experience  
**Scope:** `frontend/src/components/site/ConsentBanner.jsx`, `frontend/src/components/home/Hero.jsx`  
**Related:** CR-92 (touch target size fix)

---

## 1. Problem Statement

At the 768px tablet breakpoint, the fixed consent banner (`z-[70]`, `bottom-0`) overlaps with the hero CTA area and potentially the Navbar. The audit’s “Also Worth Fixing” section explicitly flags “cookie-banner overlap with the hero/CTA area at the 768px tablet breakpoint.”

This was NOT covered in the original plan and was identified during audit cross-check (GAP-2).

---

## 2. Root Cause

The consent banner is `position: fixed; bottom: 0; z-index: 70`. At 768px the banner height (now ~56px after CR-92) can overlap the bottom of the hero section or floating CTA elements.

The `StickyMobileCta` already handles banner offset via `consentUp` state:
```js
const [consentUp, setConsentUp] = useState(!hasConsentChoice());
// renders: bottom-12 when banner showing, bottom-0 when not
```

But other fixed/sticky elements and the hero section itself don’t account for the banner height at the tablet breakpoint.

---

## 3. Exact Changes Required

### Change 1 — Add body padding-bottom when banner is visible
The cleanest fix: add `padding-bottom` to the page root when banner is visible, preventing any content from being hidden under it.

In `ConsentBanner.jsx`, add a `useEffect` that toggles a CSS class on `<body>`:
```jsx
useEffect(() => {
  if (show) {
    document.body.classList.add('consent-banner-open');
  } else {
    document.body.classList.remove('consent-banner-open');
  }
  return () => document.body.classList.remove('consent-banner-open');
}, [show]);
```

In `frontend/src/index.css`, add:
```css
body.consent-banner-open {
  padding-bottom: 56px; /* banner height */
}

@media (min-width: 1024px) {
  body.consent-banner-open {
    padding-bottom: 0; /* desktop: banner is thin strip, no overlap issue */
  }
}
```

### Change 2 — Verify hero bottom padding at sm: breakpoint
Inspect `Hero.jsx` at 768px to confirm the hero’s bottom padding (`pb-20 lg:pb-28`) doesn’t create overlap with the fixed banner. If needed, add:
```jsx
// Hero section classname — ensure bottom gives room for banner on sm: only
"... pb-28 sm:pb-32 lg:pb-28 ..."
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/site/ConsentBanner.jsx` | Add body class toggle when banner visible |
| `frontend/src/index.css` | Add `.consent-banner-open` padding rule |

---

## 5. Definition of Done

- [ ] At 768px viewport: no CTA elements hidden behind the consent banner
- [ ] Banner shows correctly at mobile (375px), tablet (768px), and desktop (1440px)
- [ ] After accepting/declining: padding-bottom removed, layout restores
- [ ] StickyMobileCta still adjusts correctly (existing consentUp logic)

---

*CR-93 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M13 (GAP-2).*
