# CR-132 — StickyMobileCta Non-Composited Animation

**Type:** Performance / Animation
**Date Raised:** 2026-08-24
**Status:** 🔲 OPEN
**Priority:** P2
**Effort:** ~10 lines
**Improves:** "Avoid non-composited animations" Lighthouse diagnostic · TBT
**Score gain:** +0.5–1 pt
**Scope:** `frontend/src/components/home/StickyMobileCta.jsx`
**Related:** CR-124 (CLS/TBT), CR-128 (logo CLS)

---

## Problem Statement

Lighthouse flags: **"Avoid non-composited animations — 1 animated element found"**

The `StickyMobileCta` component uses `transition-all` with position changes:

```jsx
// StickyMobileCta.jsx line ~67-69
className={`lg:hidden fixed left-0 right-0 z-50 transition-all duration-300 ease-out ${
  visible ? "translate-y-0" : "translate-y-full"
} ${consentUp ? "bottom-12" : "bottom-0"}`}
```

**Two problems:**

**Problem A — `transition-all`**
`transition: all` includes properties like `bottom`, `padding`, `border`, and anything else that might change. If `bottom` transitions (from `bottom-0` to `bottom-12`), the browser must trigger a **layout recalculation** on every animation frame — not compositor-only.

CSS transitions on `transform` and `opacity` run on the **GPU compositor thread** (zero main thread cost). Transitions on `bottom`, `top`, `left`, `right`, `width`, `height`, `margin`, `padding` trigger **layout on the main thread** — blocking and expensive.

**Problem B — `bottom-12` / `bottom-0` transition**
When the consent banner appears, `consentUp` changes from `false` to `true`, and `bottom` transitions from `0` to `3rem` (48px). `bottom` is a layout property — its animation is non-composited. Lighthouse catches exactly this pattern.

---

## Fix

Replace the `bottom` position transition with `transform: translateY()` — compositor-only:

```jsx
// BEFORE — bottom changes, triggers layout
className={`lg:hidden fixed left-0 right-0 z-50 transition-all duration-300 ease-out
  ${visible ? "translate-y-0" : "translate-y-full"}
  ${consentUp ? "bottom-12" : "bottom-0"}`}

// AFTER — only transform changes, compositor-only
// Always bottom-0, shift upward via translateY when consent banner is present
className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out
  ${visible ? (consentUp ? "-translate-y-12" : "translate-y-0") : "translate-y-full"}`}
```

**What changed:**
- `transition-all` → `transition-transform` (only animate transform, not every property)
- `bottom-12` position → `-translate-y-12` (same visual result, compositor-only)
- `bottom-0` stays fixed as a constant — only transform changes

**Why this is equivalent visually:**
- `bottom-0 + translate-y-0` = stuck to bottom ← same as before
- `bottom-0 + -translate-y-12` = 3rem (48px) above bottom ← same as `bottom-12`
- `bottom-0 + translate-y-full` = hidden below screen ← same as before

All three states are visually identical. The difference is `bottom` never changes — only `transform` changes. Transform animations run on the GPU, zero main thread cost.

---

## Files Changed

| File | Line | Change |
|---|---|---|
| `src/components/home/StickyMobileCta.jsx` | ~67–69 | Replace `transition-all` + `bottom-12/bottom-0` with `transition-transform` + `translate-y` |

---

## Definition of Done

- [ ] Lighthouse "Avoid non-composited animations" warning resolved
- [ ] StickyMobileCta visually identical in all 3 states (hidden / visible / consent-up)
- [ ] No layout recalculation on consent banner appear/dismiss (DevTools → Performance → no "Layout" tasks during animation)

---

*CR-132 registered 2026-08-24. `transition-all` on `bottom` property identified as the non-composited animation from Lighthouse diagnostics.*
