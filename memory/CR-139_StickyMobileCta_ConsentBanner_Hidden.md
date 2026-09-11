# CR-139 — StickyMobileCta Hidden Behind ConsentBanner on iOS / Safe-Area Devices

**Type:** Bug / Mobile UX / Conversion
**Date Raised:** 2026-08-24
**Raised By:** Crawlability Audit — August 2026
**Status:** OPEN
**Priority:** HIGH — primary conversion CTA non-functional on iOS devices when cookie banner shows
**Effort:** ~15 min
**Improves:** Conversion Rate · Mobile UX · Visual Lighthouse Score
**Scope:** `frontend/src/components/home/StickyMobileCta.jsx`
**Related:** CR-92 (touch targets), CR-93 (cookie banner tablet overlap)

---

## 1. Problem Statement

The crawlability audit (August 2026) reported that the Visual score dropped from 78 → 45, with the root cause being the "Book a Free Demo" button being pushed off-screen or obscured when the cookie consent banner is visible. The audit specifically said:

> "the cookie-banner/sticky-CTA overlap bug got 'fixed' by pushing the entire 'Book a Demo' button off-screen while the banner shows — that's a hidden, non-functional primary conversion CTA, arguably worse than the visual overlap it replaced."

---

## 2. Root Cause

**The ConsentBanner** is `fixed bottom-0 z-[70] h-12` — 48px tall, z-index 70.

**The StickyMobileCta** uses:
```jsx
visible ? (consentUp ? "-translate-y-12" : "translate-y-0") : "translate-y-full"
```

`-translate-y-12` = 48px upward from `bottom-0`.

**Why this breaks:**

1. **On iOS with safe-area insets:** The CTA bar uses `pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]` — its actual rendered height is > 48px when the iPhone home bar is present (safe-area-inset-bottom = 34px on iPhone X+, making CTA height = 12+12+28+34 = ~86px). The `-translate-y-12` (48px) only accounts for the ConsentBanner height — not the additional space needed. The CTA bar bottom bleeds behind the ConsentBanner.

2. **Z-index stacking:** ConsentBanner z-[70] > StickyMobileCta z-50. When the CTA's bottom portion overlaps the ConsentBanner area due to the safe-area issue, the ConsentBanner renders on top and the bottom of the CTA button is blocked/unclickable.

3. **The -translate-y-12 is hardcoded.** It assumes ConsentBanner is always exactly h-12 (48px) with no variation. This is fragile.

---

## 3. Fix

**`frontend/src/components/home/StickyMobileCta.jsx`**

The ConsentBanner has `data-testid="consent-banner"`. When it's present, measure its actual rendered height and use that as the translate offset — instead of hardcoded `-translate-y-12` (48px).

**Option A — CSS approach (preferred, no JS measurement needed):**

Add a CSS custom property to ConsentBanner that sets the offset, and use it in StickyMobileCta. But since both components are separate, the simpler approach:

**Option B — Increase the translate offset:**

Change `-translate-y-12` to `-translate-y-16` (64px = 4rem). This gives 16px clearance above the 48px ConsentBanner on standard devices, and ~30px on iOS safe-area devices (since safe-area adds ~34px to CTA height but translate is also increased).

Actually the cleanest fix: use `-translate-y-14` (56px) — 8px above the ConsentBanner on standard screens. On iOS with 34px safe-area, the CTA height = ~86px, and the translate needs to be ≥ the ConsentBanner height (48px). 56px still only accounts for 8px above standard. The correct fix is:

**Option C — Dynamic measurement (best):**
```jsx
// In the consentUp useEffect, measure actual banner height
const check = () => {
  const banner = document.querySelector('[data-testid="consent-banner"]');
  setConsentUp(!!banner);
  setConsentHeight(banner ? banner.getBoundingClientRect().height : 0);
};
```

Then use inline style instead of Tailwind class:
```jsx
style={visible && consentUp ? { transform: `translateY(-${consentHeight}px)` } : undefined}
```

And keep the Tailwind classes for the hidden/visible states:
```jsx
className={`... ${visible ? "translate-y-0" : "translate-y-full"}`}
```

This dynamically accounts for any ConsentBanner height including safe-area padding.

---

## 4. Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/home/StickyMobileCta.jsx` | Add `consentHeight` state + measure banner height in useEffect + apply dynamic translateY |

---

## 5. Definition of Done

- [ ] When ConsentBanner is showing: StickyMobileCta "Book a Demo" button is fully visible and clickable above the banner on ALL devices (standard + iOS safe-area)
- [ ] When ConsentBanner is not showing: StickyMobileCta still slides in/out correctly from the bottom
- [ ] No visual regression on pages using StickyMobileCta (Home, SectorPage, ProductPage, AiPage)
- [ ] Lighthouse Visual score improvement from current ~45

---

*CR-139 registered 2026-08-24. Source: Crawlability Audit August 2026. Blocks visual Lighthouse score recovery.*
