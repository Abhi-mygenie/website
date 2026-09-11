# CR-236 Step A — Impact Analysis: Add `data-testid="product-hero-image"` to ProductPage hero `<img>`

**Date:** 2026-09-08
**Priority:** P2 — CWV / LCP
**Effort:** 1 line + rebuild
**Risk:** Very low
**Blocked by:** Nothing (Step B is blocked by missing mobile assets — Step A is independent)

---

## Problem Statement

All 6 product sub-pages (`/product/sell-serve`, `/product/run-property`, `/product/customers`,
`/product/protect-profit`, `/product/see-everything`, `/product/central-inventory`) currently have
**zero hero image preload tags** in their pre-rendered HTML:

```
/product/sell-serve    → <link rel="preload" as="image"> count: 0  ← MISSING
/product/run-property  → count: 0  ← MISSING
/product/customers     → count: 0  ← MISSING
/product/protect-profit→ count: 0  ← MISSING
/product/see-everything→ count: 0  ← MISSING
/product/central-inventory → count: 0  (expected — no image on this page)
```

Without a preload, the browser cannot start downloading the hero image until
React has mounted and the `<img>` tag appears in the DOM — **3–4 pipeline steps after HTML arrives**.

---

## Root Cause

`prerender.js` already has a working hero-image preload injector (lines 122–146) with this selector:

```js
const heroImg =
  document.querySelector('[data-testid="hero-visual"] img') ||   // homepage
  document.querySelector('img[data-testid$="-hero-image"]');      // landing pages
```

The landing pages (`RestaurantPosSystem`, `RestaurantBillingSoftware`, etc.) already have
`data-testid="pos-lp-hero-image"`, `data-testid="billing-lp-hero-image"` etc. on their `<img>`
tags — the selector picks them up and injects preloads correctly.

`ProductPage.jsx` line 97 has `<img src={p.image} ... loading="eager" fetchPriority="high" />`
but **no `data-testid`** → selector misses it → no preload injected.

---

## Scope — What Pages Are Affected

`ProductPage.jsx` is a single template rendering 6 routes. The hero is conditional:

```jsx
{p.image ? (
  <img src={p.image} ... />     ← Step A adds data-testid here
) : (
  <div ...>                     ← dark card fallback (no img)
    <HeroIcon ... />
  </div>
)}
```

### Per-route analysis

| Route | `p.image` value | Image file exists? | File size | `<img>` rendered? | Preload after fix |
|---|---|---|---|---|---|
| `/product/sell-serve` | `/brand/feature1.webp` | ✅ | 17 KB | ✅ | ✅ injected |
| `/product/run-property` | `/brand/feature2.webp` | ✅ | 15 KB | ✅ | ✅ injected |
| `/product/customers` | `/brand/feature3.webp` | ✅ | 16 KB | ✅ | ✅ injected |
| `/product/protect-profit` | `/brand/feature4.webp` | ✅ | 18 KB | ✅ | ✅ injected |
| `/product/see-everything` | `/brand/feature5.webp` | ✅ | 20 KB | ✅ | ✅ injected |
| `/product/central-inventory` | `""` (empty string) | n/a | — | ❌ (dark card shown) | ✅ safe — no img, no preload, no crash |

**5 of 6 routes gain a preload. 1 route (central-inventory) safely produces no preload (expected).**

---

## The Fix

**File:** `src/pages/ProductPage.jsx` — line 97
**Change:** Add `data-testid="product-hero-image"` to the `<img>` tag.

```jsx
// BEFORE (line 97)
<img
  src={p.image}
  alt={`${p.title} — MyGenie POS`}
  width={480}
  height={480}
  className="w-full h-[400px] object-contain"
  loading="eager"
  fetchPriority="high"
/>

// AFTER
<img
  src={p.image}
  alt={`${p.title} — MyGenie POS`}
  data-testid="product-hero-image"
  width={480}
  height={480}
  className="w-full h-[400px] object-contain"
  loading="eager"
  fetchPriority="high"
/>
```

The testid `"product-hero-image"` ends in `"-hero-image"` → matched by the existing
`img[data-testid$="-hero-image"]` selector in `prerender.js` line 130. **No changes to prerender.js needed.**

---

## How prerender.js Handles It (trace)

During `yarn build`, Puppeteer visits each product route. For `/product/sell-serve`:

1. React renders → `p.image = "/brand/feature1.webp"` → `<img data-testid="product-hero-image" src="http://localhost:4321/brand/feature1.webp" ...>` is in DOM
2. `document.querySelector('img[data-testid$="-hero-image"]')` → finds the img ✅
3. `heroImg.src` = `"http://localhost:4321/brand/feature1.webp"` → truthy ✅
4. No `srcset` attribute on img → falls to `else` branch → `preload.href = new URL(heroImg.src).pathname` = `"/brand/feature1.webp"`
5. Injects: `<link rel="preload" as="image" fetchpriority="high" href="/brand/feature1.webp">` into `<head>`
6. Written into `build/product/sell-serve/index.html` ✅

For `/product/central-inventory`:
1. React renders → `p.image = ""` → empty string is falsy → dark card rendered → **no `<img>` in DOM**
2. `document.querySelector('img[data-testid$="-hero-image"]')` → `null`
3. `if (heroImg && heroImg.src)` → `false` → no preload element created → **safe, no crash** ✅

---

## No `srcset` / No Mobile Optimisation (Step B dependency)

The landing pages have `srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"` so prerender.js
uses `imagesrcset`/`imagesizes` — mobile gets the 18KB version instead of 38KB.

The product pages (`feature1-5.webp`) have **no mobile variants** — `feature1-mobile.webp` etc. do not exist.
So Step A gets a single-URL preload (`href="/brand/featureX.webp"`). No mobile saving yet.

Step B would add `srcSet` + create the mobile assets → upgrade the preload to `imagesrcset`. Step B is
**not a prerequisite for Step A** — they are fully independent.

---

## Expected LCP Improvement

| | Before | After |
|---|---|---|
| Browser discovers hero image | After JS bundle parses + React renders (~1.5–2 s on 3G) | At HTML parse time (first network round trip) |
| Download starts | ~1.5–2 s after navigation | Parallel with JS bundle |
| Estimated LCP saving | — | 300–600 ms on mobile 3G (images are 15–20 KB) |

Images are small (15–20 KB each) so the absolute saving on fast connections is modest.
The saving matters most on **mobile / slow connections** — the audience most likely to visit
product pages via ads or organic search on phone.

---

## Dependencies

| Item | Status |
|---|---|
| `prerender.js` selector change | None needed — existing `img[data-testid$="-hero-image"]` already matches |
| New image assets | None — feature1-5.webp all exist in `/public/brand/` |
| New npm packages | None |
| Backend changes | None |
| Other files | None |
| Step B (srcSet + mobile assets) | Independent — can be done any time after Step A |

---

## Risk Assessment

**Risk: Very low.**

| Concern | Assessment |
|---|---|
| `central-inventory` has no image → testid added but no `<img>` renders | Safe — testid is inside `{p.image ? <img ... /> : <div ...>}` conditional. Empty string is falsy, dark card renders, no `<img>` in DOM, prerender.js `if (heroImg && heroImg.src)` guard prevents any crash |
| Breaks existing behaviour | No — `data-testid` is metadata only, zero runtime effect |
| Breaks other prerender.js logic | No — logic is additive, selector already handles multiple matches |
| Conflicts with CR-238 (chunk preloads) | No — CR-238 injects `as="script"` preloads; this injects `as="image"` preloads. Both can coexist in `<head>` |
| Duplicate preloads for homepage | No — homepage uses `[data-testid="hero-visual"] img` selector, not `img[data-testid$="-hero-image"]`. Different selector, different page, no collision |

---

## Build & Deploy Steps

```bash
# 1. Edit: add data-testid="product-hero-image" to ProductPage.jsx line 97
# 2. Build + prerender
cd /app/frontend && yarn build
# 3. Restart static server
sudo supervisorctl restart frontend
```

Build time: ~2 min (pre-renders 65 routes).

---

## Verification After Deploy

For each of the 5 affected routes, confirm the preload tag is present in the built HTML:

```bash
for p in sell-serve run-property customers protect-profit see-everything; do
  echo -n "/product/$p → "
  grep 'rel="preload" as="image"' /app/frontend/build/product/$p/index.html
done
```

Expected output for each: one line containing `href="/brand/featureN.webp" fetchpriority="high"`.

For `central-inventory` — confirm **no** image preload (only chunk preloads):
```bash
grep 'rel="preload" as="image"' /app/frontend/build/product/central-inventory/index.html
# should return empty
```

---

## Summary

| Item | Detail |
|---|---|
| File changed | `src/pages/ProductPage.jsx` (1 line) |
| Pages gaining preload | 5 (`sell-serve`, `run-property`, `customers`, `protect-profit`, `see-everything`) |
| Pages unaffected | 1 (`central-inventory` — no image, safe) |
| prerender.js change needed | None |
| New assets needed | None |
| Expected LCP saving | 300–600 ms on mobile/slow connections |
| Risk | Very low |
| Blocked by | Nothing |
| Step B blocked by | Mobile asset creation (`feature1-5-mobile.webp`) |

**Ready to implement on owner go-ahead.**
