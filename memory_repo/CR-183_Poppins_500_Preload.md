# CR-183 — Preload Poppins 500 Weight (Font Critical Path)

**Type:** Performance / CWV
**Date Raised:** 2026-09-02
**Status:** OPEN
**Priority:** P2
**Source:** Lighthouse mobile audit — Network dependency tree, fonts loading at 1,400ms+
**Batch:** W — Lighthouse Audit Gaps

---

## Problem

Lighthouse shows 3 Poppins weights in the critical path loading at 1,400–1,486ms each:

```
/fonts/poppins-500.woff2  — 1,486ms, 8.30 KiB
/fonts/poppins-600.woff2  — 1,476ms, 8.55 KiB
/fonts/poppins-700.woff2  — 1,472ms, 8.41 KiB
```

`public/index.html` preloads Clash Display + Poppins 400 only:
```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-700.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-600.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-400.woff2">
<!-- poppins-500, poppins-600, poppins-700 ← NOT preloaded -->
```

Poppins 500 (`font-medium`) is the most used weight in the navbar, hero subtext, and body — it loads at 1,486ms causing text to render with fallback font until then.

---

## Fix

Add one preload line to `public/index.html` for Poppins 500 (highest-use above-fold weight):

```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-500.woff2">
```

Poppins 600 and 700 are used less above-fold (bold headings use Clash Display) — lower priority but can be added in the same change.

---

## Files to Change

| File | Line | Change |
|---|---|---|
| `public/index.html` | After poppins-400 preload | Add `<link rel="preload">` for poppins-500.woff2 |

---

## Expected Outcome

Poppins 500 text renders correctly from first paint instead of swapping from fallback at 1,486ms. Reduces FOUT (Flash Of Unstyled Text) on mobile.

*CR-183 registered 2026-09-02. Source: Lighthouse mobile audit.*
