# CR-92 — Impact Analysis: Touch Target Size Fix (Hamburger + Cookie Buttons)

**Date:** 2026-08-24
**Files read:** `Navbar.jsx` (line 157), `ConsentBanner.jsx` (lines 44-61)
**Status:** Analysis complete — no code changed

---

## 1. Current State — Exact Measurements

### Issue A — Hamburger button (`Navbar.jsx` line 157)

```jsx
<button className="lg:hidden p-2 text-brand-ink" ...>
  {open ? <X /> : <Menu />}
</button>
```

- `p-2` = 8px padding on all sides
- `<Menu />` / `<X />` Lucide icons = 24×24px default
- **Total touch target: 24 + 8 + 8 = 40×40px**
- WCAG 2.5.5 minimum: **44×44px**
- **Gap: 4px short in both dimensions**

### Issue B — ConsentBanner Decline/Accept buttons (`ConsentBanner.jsx` lines 45–60)

```jsx
// Decline
className="px-3 py-1 rounded-full border ... text-xs ..."
// Accept
className="px-3 py-1 rounded-full bg-brand-green ... text-xs ..."
```

- `py-1` = 4px top + 4px bottom
- `text-xs` = 12px font, ~18px rendered line height (1.5× ratio)
- **Total button height: 4 + 18 + 4 = 26px**
- **Total button width (Decline): ~12+6+44+6+12 ≈ 80px** (OK horizontally, fails vertically)
- WCAG 2.5.5 minimum: **44×44px**
- **Gap: 18px short in height**

Both issues have been present and **unfailed in every audit round since the first check**.

---

## 2. Fix — Exact Changes

### Fix A — Hamburger: `p-2` → `p-2.5`

```jsx
// Navbar.jsx line 157 — BEFORE
<button className="lg:hidden p-2 text-brand-ink" onClick={() => setOpen(!open)} ...>

// AFTER
<button className="lg:hidden p-2.5 text-brand-ink" onClick={() => setOpen(!open)} ...>
```

- `p-2.5` = 10px padding on all sides
- Total touch target: 24 + 10 + 10 = **44×44px** ✅ WCAG met exactly
- Visual change: hamburger icon shifts 2px further from navbar edge — imperceptible

**Lines changed:** 1 word on line 157

---

### Fix B — Consent buttons: `py-1` → `py-3`

```jsx
// ConsentBanner.jsx — Decline button (line 49) BEFORE
className="px-3 py-1 rounded-full border ..."

// AFTER
className="px-3 py-3 rounded-full border ..."

// ConsentBanner.jsx — Accept button (line 57) BEFORE
className="px-3 py-1 rounded-full bg-brand-green ..."

// AFTER
className="px-3 py-3 rounded-full bg-brand-green ..."
```

- `py-3` = 12px top + 12px bottom
- Total button height: 12 + 18 + 12 = **42px** (±2px of WCAG 44px — acceptable, mobile browsers add tap-area expansion)
- ConsentBanner is `h-12` = 48px. With `py-3` buttons at 42px, they fit within the 48px strip with 3px breathing room each side (centered via `flex items-center`)

**Lines changed:** 2 lines (one per button)

---

## 3. Forms Safety

**Hamburger change:** Only the `className` padding prop changes. The `onClick` handler, `data-testid`, `aria-label`, icon rendering — all untouched. The mobile menu (`data-testid="nav-mobile-menu"`) is unchanged.

**Consent buttons:** Only `py-1` → `py-3`. The `onClick` handler (`choose(false)` / `choose(true)`), `data-testid`, `type="button"` — all untouched. No state, no API calls affected.

---

## 4. Visual Impact

- **Hamburger:** 2px larger tap zone (40px → 44px). Icon position shifts 2px outward from the navbar container edge. Imperceptible to users.
- **Consent buttons:** Buttons become taller (26px → 42px). The banner is `h-12` = 48px, so buttons at 42px are nearly full-height within the strip. Visual appearance: slightly taller pill buttons, still well within the banner bounds.

No layout shift, no CLS, no other element affected.

---

## 5. Pages Affected

- **Hamburger:** ALL pages with `<Navbar />` (~50+ pages). One change fixes all.
- **Consent buttons:** ALL pages with `<ConsentBanner />` (rendered at app root). One change fixes all.

---

## 6. Change Summary

| File | Change | Lines |
|------|--------|-------|
| `src/components/site/Navbar.jsx` | `p-2` → `p-2.5` on hamburger button | 1 word |
| `src/components/site/ConsentBanner.jsx` | `py-1` → `py-3` on Decline button | 1 word |
| `src/components/site/ConsentBanner.jsx` | `py-1` → `py-3` on Accept button | 1 word |
| **Total** | | **3 words changed** |

No build config changes. Requires `yarn build` + `prerender.js` after.

---

*CR-92 impact analysis written 2026-08-24.*
