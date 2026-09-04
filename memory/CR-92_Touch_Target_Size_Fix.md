# CR-92 — Increase Touch Target Size: Cookie Banner Buttons + Hamburger Menu

**Type:** Mobile UX Fix  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M4 + M5  
**Effort:** 15 min  
**Improves:** UX · Mobile · LP Experience  
**Scope:** `frontend/src/components/site/ConsentBanner.jsx`, `frontend/src/components/site/Navbar.jsx`  
**Related:** CR-93 (cookie banner tablet overlap)

---

## 1. Problem Statement

**Issue A — Cookie banner buttons undersized (~20px height):**
Both “Decline” and “Accept” buttons use `py-1 text-xs` = ~20px total height. Google’s minimum touch target is 44px. Audited measurement: ~67×24px.

**Issue B — Hamburger menu button undersized (40px):**
The mobile nav toggle button uses `p-2` with a 24px Lucide `<Menu />` icon = 24 + 8 + 8 = 40px total. Just under the 44px minimum.

---

## 2. Exact Changes Required

### Change 1 — `frontend/src/components/site/ConsentBanner.jsx`
```jsx
// BEFORE: Decline button
className="px-3 py-1 rounded-full border border-white/20 text-xs ..."

// AFTER: py-1 → py-2.5 (brings height to ~44px)
className="px-3 py-2.5 rounded-full border border-white/20 text-xs ..."

// BEFORE: Accept button
className="px-3 py-1 rounded-full bg-brand-green ..."

// AFTER:
className="px-3 py-2.5 rounded-full bg-brand-green ..."
```

Also update the banner container from fixed `h-12` to `min-h-[56px]` to accommodate taller buttons:
```jsx
// BEFORE:
className="... h-12 flex items-center ..."
// AFTER:
className="... min-h-[56px] py-2 flex items-center ..."
```

### Change 2 — `frontend/src/components/site/Navbar.jsx`
```jsx
// BEFORE: Mobile toggle button
<button className="lg:hidden p-2 text-brand-ink" ...>

// AFTER: p-2 → p-2.5 (brings to 44px)
<button className="lg:hidden p-2.5 text-brand-ink" ...>
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/site/ConsentBanner.jsx` | `py-1` → `py-2.5` on both buttons; `h-12` → `min-h-[56px]` on banner |
| `frontend/src/components/site/Navbar.jsx` | `p-2` → `p-2.5` on mobile toggle button |

---

## 4. Definition of Done

- [ ] Cookie “Accept” and “Decline” buttons are ≥44px tall on mobile
- [ ] Hamburger button touch target is ≥44px
- [ ] Banner layout not broken (text still fits on one line at 375px viewport)
- [ ] No regression on desktop banner appearance

---

*CR-92 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M4 + M5.*
