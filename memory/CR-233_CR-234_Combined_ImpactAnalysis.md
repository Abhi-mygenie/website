# CR-233 + CR-234 — Combined Impact Analysis: prerender.js Hero Preload Fixes

**Date:** 2026-09-08 (updated after full-site audit)
**Priority:** P1 (CR-233) + P2 (CR-234)
**Batch:** AM-B — Both fixes in one `prerender.js` block, one rebuild

---

## Full-Site Audit Results

Every page was checked for:
(a) Does it have a dominant LCP hero image?
(b) Does prerender.js inject a preload for it?
(c) Is the preload using `imagesrcset` (correct) or single `href` (incorrect on mobile)?

| Page | Hero img testid | prerender.js finds it? | Preload injected? | srcSet on img? | CR-233 affected | CR-234 affected |
|---|---|---|---|---|---|---|
| `/` (Homepage) | `[data-testid="hero-visual"] img` | ✅ Yes | ✅ Yes | ✅ Yes | No | ✅ Yes — single `href`, wrong on mobile |
| `/restaurant-pos-system` | `img[data-testid="pos-lp-hero-image"]` | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes — no preload at all |
| `/restaurant-billing-software` | `img[data-testid="billing-lp-hero-image"]` | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| `/restaurant-management-software` | `img[data-testid="mgmt-lp-hero-image"]` | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| `/cloud-kitchen-pos` | `img[data-testid="ck-lp-hero-image"]` | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| `/qsr-pos-system` | `img[data-testid="qsr-lp-hero-image"]` | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| `/product/*` (5 pages) | No `data-testid` on img | ❌ No | ❌ No | ❌ No (no mobile variants) | **Out of scope** | **Out of scope** |
| All other pages | No dominant LCP img | — | — | — | Not affected | Not affected |

**CR-233 affects:** 5 ad landing pages
**CR-234 affects:** Homepage + 5 ad landing pages = **6 pages total**

---

## Why ProductPage is Out of This Batch

`/product/*` (5 pages with images: `feature1–5.webp`) has `fetchPriority="high"` on the hero `<img>` but:

1. **No `data-testid`** on the `<img>` — prerender.js cannot target it. Fix requires a JSX change to `ProductPage.jsx` (add `data-testid="product-hero-image"`).
2. **No `srcSet`** — no mobile variants of `feature*.webp` exist (`feature1-mobile.webp` etc. not created). Cannot add `imagesrcset` without creating new image assets.
3. **1 of 6 product pages has no image** (`/product/central-inventory`) — conditional render `{p.image ? <img> : <icon>}` must be handled carefully.

**Decision:** Separate finding. Logged for follow-up. Not in this batch.

---

## CR-233 — Prerender Selector Misses 5 Ad Landing Pages

### Problem

`prerender.js` hero preload block uses:
```js
const heroImg = document.querySelector('[data-testid="hero-visual"] img');
```

This only matches the homepage's `<div data-testid="hero-visual"><EditableImage ...></div>` wrapper pattern. The 5 ad landing pages place `data-testid` **directly on the `<img>`** tag:

```jsx
<img ... data-testid="pos-lp-hero-image" />  // RestaurantPosSystem.jsx:158
<img ... data-testid="billing-lp-hero-image" />
<img ... data-testid="mgmt-lp-hero-image" />
<img ... data-testid="ck-lp-hero-image" />
<img ... data-testid="qsr-lp-hero-image" />
```

Result: `document.querySelector('[data-testid="hero-visual"] img')` returns `null` on all 5 pages → the `if (heroImg && heroImg.src)` block is skipped → **zero `<link rel="preload">` tag injected into `<head>`** for any of the 5 pages.

### Confirmed Impact
Browser discovers the hero `<img>` tag only when it reaches that point in the HTML body (~6–8KB into a 9–11KB page). With a preload hint in `<head>`, the browser starts the fetch ~200–400ms earlier.

These are **paid ad landing pages** — every millisecond of LCP delay reduces Google Ads Quality Score and costs more per click.

---

## CR-234 — Preload Uses Single `href` — Wrong Image on Mobile

### Problem

When the preload block does fire (homepage today; all 6 pages after CR-233 fix), it writes:
```html
<link rel="preload" as="image" fetchpriority="high" href="/brand/banner.webp">
```

The `<img>` tag itself has:
```html
<img srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
     sizes="(max-width: 1023px) 400px, 776px">
```

| Viewport | srcset picks | Preload fetches | Result |
|---|---|---|---|
| Desktop ≥1024px | `banner.webp` — 776px, 38KB | `banner.webp` — 38KB | ✅ Match |
| Mobile <1024px | `banner-mobile.webp` — 400px, 18KB | `banner.webp` — 38KB | ❌ Wrong — 20KB wasted |

On mobile:
- 38KB `banner.webp` is prefetched (never used on mobile)
- 18KB `banner-mobile.webp` is fetched again separately when `<img srcset>` is processed
- Net: 38KB wasted bandwidth + correct LCP image arrives later than necessary

### Fix

Read `srcset` and `sizes` directly from the found `<img>` element and write them as `imagesrcset` + `imagesizes` on the preload:

```html
<!-- After fix -->
<link rel="preload" as="image" fetchpriority="high"
  imagesrcset="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
  imagesizes="(max-width: 1023px) 400px, 776px">
```

Browser now selects the correct image for the current viewport at preload time — saving 20KB on every mobile visit.

**Benefit of reading from element:** If `srcSet`/`sizes` ever change in JSX, the preload automatically stays in sync. No hardcoding.

**Fallback:** If the found img has no `srcset` (edge case), fall back to `preload.href`. Safe.

---

## Combined Scope Summary

| CR | Pages fixed | What changes |
|---|---|---|
| **CR-233** | 5 ad landing pages | Selector extended → preload now injected where it was missing |
| **CR-234** | Homepage + 5 ad pages = 6 pages | Preload switches from `href` to `imagesrcset + imagesizes` → correct image on mobile |

---

## What Does NOT Change

| Item | Reason |
|---|---|
| All JSX/React files | No JSX changes — prerender.js only runs at build time |
| `<img>` tags on any page | Untouched |
| `srcSet`/`sizes` values on img tags | Read at build time, not modified |
| Blog, sector, solution, contact pages | No dominant hero img → not affected |
| ProductPage | Out of scope — separate finding (needs JSX + new image assets) |

---

## Risk

**Very low.**
- prerender.js runs only at `yarn build` time, not at runtime
- A selector that finds nothing → no preload injected (safe, page still renders)
- A preload with wrong `imagesrcset` → browser ignores and fetches via `<img srcset>` as fallback
- Zero runtime JS changes

---

## Effort

| Item | Count |
|---|---|
| Files edited | 1 (`prerender.js`) |
| Search-replace ops | 1 |
| `yarn build` | 1 |
| Lines changed | ~14 lines (replace with ~22) |
| New dependencies | 0 |
| CF Purge after prod deploy | Yes |

**Estimated dev time: 5 minutes.**

---

*Written 2026-09-08. Updated after full-site audit confirming 6 affected pages (homepage + 5 ad LPs). ProductPage gap noted separately.*
