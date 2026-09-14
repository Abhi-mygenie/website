# CR-131 — Tailwind Unused CSS: Exclude Never-Imported shadcn/ui Components

**Type:** Performance / CSS Bundle
**Date Raised:** 2026-08-24
**Investigated:** 2026-08-24
**Status:** 🔲 OPEN — ready for implementation
**Priority:** P2
**Effort:** 1 line in `tailwind.config.js`
**Improves:** "Reduce unused CSS — Est savings of 14 KiB" Lighthouse diagnostic
**Score gain:** +0.5–1 pt
**Scope:** `frontend/tailwind.config.js`
**Related:** CR-130 (lazy CmsAdminLayer), CR-128 (logo SVG)

---

## Root Cause — Confirmed by Investigation

**All 45 shadcn UI components in `/src/components/ui/` are imported by zero app files.**

Confirmed by exhaustive grep:
```bash
grep -rn "@/components/ui" /app/frontend/src/ --include="*.jsx" --include="*.js"
# Excluding /src/components/ui/ itself: 0 matches
```

Tailwind's content scanner reads every file matching `./src/**/*.{js,jsx,ts,tsx}`, including the 45 shadcn component files. It finds and generates CSS for all their Radix-specific classes — none of which ever render in the browser because the components are never imported.

---

## Classes Being Generated Unnecessarily

All of these appear in the current CSS bundle but are generated ONLY by `/src/components/ui/` files that are never imported:

```css
/* From context-menu.jsx, dropdown-menu.jsx, hover-card.jsx, etc. */
.origin-\[--radix-context-menu-content-transform-origin\]
.origin-\[--radix-dropdown-menu-content-transform-origin\]
.origin-\[--radix-hover-card-content-transform-origin\]
.origin-\[--radix-menubar-content-transform-origin\]
.origin-\[--radix-popover-content-transform-origin\]
.origin-\[--radix-select-content-transform-origin\]
.origin-\[--radix-tooltip-content-transform-origin\]

/* From select.jsx, dropdown-menu.jsx, context-menu.jsx */
.max-h-\[--radix-select-content-available-height\]
.max-h-\[--radix-context-menu-content-available-height\]
.max-h-\[--radix-dropdown-menu-content-available-height\]
.min-w-\[var\(--radix-select-trigger-width\)\]
.h-\[var\(--radix-select-trigger-height\)\]
.h-\[var\(--radix-navigation-menu-viewport-height\)\]

/* From alert-dialog.jsx, dialog.jsx, context-menu.jsx — animate-in variants */
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95
data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-left-1/2
data-[state=open]:slide-in-from-left-1/2
data-[state=closed]:slide-out-to-top-\[48\%\]
data-[state=open]:slide-in-from-top-\[48\%\]

/* From accordion.jsx */
data-[state=closed]:animate-accordion-up
data-[state=open]:animate-accordion-down

/* From various ui/ components — directional slide variants */
data-[side=bottom]:slide-in-from-top-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
data-[side=top]:slide-in-from-bottom-2
```

---

## What's Legitimately Using `tailwindcss-animate`

Only ONE public app file uses `tailwindcss-animate` classes directly:

```jsx
// frontend/src/components/pricing/PlanShowcase.jsx line 17
className="grid md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
```

The plugin is still needed. `PlanShowcase` continues generating its classes after the fix. Only the dead shadcn variants disappear.

The `accordion-down` / `accordion-up` keyframes defined in `tailwind.config.js` still generate `.animate-accordion-down` and `.animate-accordion-up` utility classes — only the `data-[state=*]:` variants from accordion.jsx are removed. No regression.

---

## What Cannot Be Removed (Admin/Funnel CSS)

Lighthouse measures "unused CSS" against the **homepage only**. The admin/funnel/ads components (LeadsView, AdsIntelTab, ChurnPanel, FunnelPanel, AttributionBreakdown etc.) generate many `slate-*`, `violet-*`, `amber-*`, `indigo-*` color variants. These appear unused on the homepage but are needed when the admin navigates to `/leads`.

Since CRA produces a **single CSS bundle**, this admin CSS cannot be split out without a major build architecture change. ~5–6 KiB of the 14 KiB "unused CSS" is legitimately needed for admin pages and cannot be removed.

**Total achievable savings: ~8–10 KiB raw / ~3–4 KiB gzip** (not the full 14 KiB).

---

## The Fix — 1 Line in `tailwind.config.js`

```js
// tailwind.config.js — BEFORE
content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],

// tailwind.config.js — AFTER
content: [
  "./src/**/*.{js,jsx,ts,tsx}",
  "!./src/components/ui/**",      // exclude never-imported shadcn components
  "./public/index.html"
],
```

Tailwind v3.4.17 supports negation patterns in the content array. Excluding `/ui/` removes all CSS generated solely from those files.

---

## Risk Assessment

**Low.** Confirmed: zero app files import from `/src/components/ui/`.

| Risk | Likelihood | Mitigation |
|---|---|---|
| App code breaks because a component was missed | None | 0 imports confirmed by grep |
| PlanShowcase's `animate-in` stops working | None | PlanShowcase.jsx is outside `/ui/` — still scanned |
| Accordion animation breaks | None | Accordion never used in app; keyframes stay in tailwind.config.js |
| Admin panel breaks visually | None | Admin colors come from LeadsView/funnel files, not from `/ui/` |

---

## Savings Summary

| Metric | Before | After |
|---|---|---|
| CSS bundle (raw) | 95 KB | ~85–87 KB (−8–10 KB) |
| CSS bundle (gzip) | ~28 KB | ~24–25 KB (−3–4 KB) |
| Lighthouse "Reduce unused CSS" | 14 KiB | ~5–6 KiB (−8–9 KiB) |
| Lighthouse Performance score | baseline | **+0.5–1 pt** |

Remaining ~5–6 KiB of "unused CSS" after the fix is admin/funnel CSS — unavoidable with single-bundle CRA architecture.

---

## Files Changed

| File | Change | Lines |
|---|---|---|
| `frontend/tailwind.config.js` | Add `"!./src/components/ui/**"` negation to content array | 1 |

---

## Definition of Done

- [ ] `yarn build` succeeds with no errors
- [ ] CSS bundle size decreases from 95 KB to ~85–87 KB
- [ ] Lighthouse "Reduce unused CSS" drops from 14 KiB to ~5–6 KiB
- [ ] No visual regression on homepage, pricing, solutions, blog
- [ ] PlanShowcase animate-in effect still works (pricing page plan cards)
- [ ] Admin `/leads` page still works correctly (admin colors intact)
- [ ] Rebuild + prerender required after this change

---

*CR-131 raised 2026-08-24. Investigated 2026-08-24. Root cause: 45 shadcn UI components installed but never imported by any app code — Tailwind generates ~8–10 KB of dead CSS for them. Fix: 1-line negation in tailwind.config.js content array.*
