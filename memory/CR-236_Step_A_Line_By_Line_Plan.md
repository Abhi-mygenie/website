# CR-236 Step A — Line-by-Line Implementation Plan

**Date:** 2026-09-08
**Priority:** P2 — CWV / LCP
**Total ops:** 1 search-replace + 1 build + 1 restart
**Estimated time:** ~3 min edit + ~2 min build

---

## Pre-flight Checks (confirm before touching anything)

```bash
# 1. Confirm current state — 0 image preloads on product pages
for p in sell-serve run-property customers protect-profit see-everything central-inventory; do
  echo -n "/product/$p → preload count: "
  grep -c 'rel="preload" as="image"' /app/frontend/build/product/$p/index.html 2>/dev/null || echo "0"
done
# Expected: all 0

# 2. Confirm the img tag has no testid yet (exact line)
grep -n 'data-testid' /app/frontend/src/pages/ProductPage.jsx | grep -v "product-"
# Expected: nothing matching hero img (line 97–105 has no data-testid)

# 3. Confirm image files exist
ls -lh /app/frontend/public/brand/feature{1,2,3,4,5}.webp
# Expected: 5 files, 15–20 KB each
```

---

## Op 1 — `src/pages/ProductPage.jsx` lines 97–105

**File:** `/app/frontend/src/pages/ProductPage.jsx`
**Lines:** 97–105

**Find (exact — must match character for character including indentation):**
```jsx
                <img
                  src={p.image}
                  alt={`${p.title} — MyGenie POS`}
                  width={480}
                  height={480}
                  className="w-full h-[400px] object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
```

**Replace with:**
```jsx
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

**What changed:** One line inserted — `data-testid="product-hero-image"` — after the `alt` attribute on line 99.
**What did NOT change:** `src`, `alt`, `width`, `height`, `className`, `loading`, `fetchPriority` — all identical, no reordering.

**Why this position:** Placing testid after `alt` and before `width` is consistent with every other
`<img>` in the codebase that carries a `data-testid` (see `pos-lp-hero-image`, `billing-lp-hero-image`).

---

## Post-edit Verification (before build)

```bash
# Confirm the new line is present and correct
grep -n 'data-testid="product-hero-image"' /app/frontend/src/pages/ProductPage.jsx
# Expected: 1 result on line 100 (shifted by +1 from the insertion)

# Confirm no surrounding lines were accidentally changed
sed -n '95,110p' /app/frontend/src/pages/ProductPage.jsx
# Expected: only line 100 is new; all other lines unchanged
```

---

## Build

```bash
# Run from /app/frontend — yarn build compiles React then runs prerender.js
cd /app/frontend && yarn build
```

**What yarn build does:**
1. `craco build` — Webpack compiles all JS/CSS into `build/static/`
2. `node scripts/prerender.js` — Puppeteer visits all 65 routes, injects preloads, writes HTML

**During prerender — what will happen for each product page:**
- Puppeteer loads `/product/sell-serve` → React renders `<img data-testid="product-hero-image" src="http://localhost:4321/brand/feature1.webp" ...>`
- `document.querySelector('img[data-testid$="-hero-image"]')` → finds it ✅
- `heroImg.src` = `"http://localhost:4321/brand/feature1.webp"` → truthy ✅
- No `srcset` → falls to else branch → `preload.href = "/brand/feature1.webp"`
- Injects `<link rel="preload" as="image" fetchpriority="high" href="/brand/feature1.webp">` into `<head>`
- Repeats for all 5 image-bearing routes

**During prerender — central-inventory:**
- Puppeteer loads `/product/central-inventory` → `p.image = ""` → falsy → dark card renders → **no `<img>` in DOM**
- `document.querySelector('img[data-testid$="-hero-image"]')` → `null`
- `if (heroImg && heroImg.src)` → false → no preload element created → **safe** ✅

---

## Restart

```bash
sudo supervisorctl restart frontend
# Static server reloads, begins serving the new build/
```

---

## Post-Deploy Verification Checklist

### 1. Confirm preloads injected (5 routes)
```bash
for p in sell-serve run-property customers protect-profit see-everything; do
  echo -n "/product/$p → "
  grep 'rel="preload" as="image"' /app/frontend/build/product/$p/index.html || echo "MISSING ❌"
done
```
**Expected output for each route:**
```html
<link rel="preload" as="image" fetchpriority="high" href="/brand/featureN.webp">
```

### 2. Confirm central-inventory has NO image preload
```bash
grep 'rel="preload" as="image"' /app/frontend/build/product/central-inventory/index.html
# Expected: empty (no output)
```

### 3. Confirm chunk preloads (CR-238) still present on all product pages
```bash
grep -c 'rel="preload" as="script"' /app/frontend/build/product/sell-serve/index.html
# Expected: 1 or more (CR-238 chunk preloads must not have been removed)
```

### 4. Visual check — page loads unchanged
```bash
# Screenshot sell-serve — hero image must still appear, no layout change
```

### 5. Confirm testid present in live DOM
Open `/product/sell-serve` in browser → DevTools → `document.querySelector('img[data-testid="product-hero-image"]')` → must return the `<img>` element.

---

## Rollback (if anything goes wrong)

```bash
# Remove the one added line and rebuild
# Find: data-testid="product-hero-image"
# Replace with: (delete the line)
cd /app/frontend && yarn build && sudo supervisorctl restart frontend
```

---

## What Does NOT Change

| Item | Status |
|---|---|
| `prerender.js` | No change — existing selector already handles it |
| `routes.js` | No change |
| `products.js` (data) | No change |
| `public/brand/` images | No change — files already exist |
| Any other page or component | No change — `ProductPage.jsx` is self-contained |
| CR-238 chunk preload logic | No conflict — different `as` value (`script` vs `image`) |
| `central-inventory` dark card | No change — rendered when `p.image` is falsy, testid not added there |

---

## Explicitly Out of Scope (Step B — blocked)

| Item | Why blocked |
|---|---|
| `srcSet="/brand/feature1-mobile.webp 400w, /brand/feature1.webp 480w"` | Mobile asset files (`feature1-mobile.webp` … `feature5-mobile.webp`) do not exist yet |
| `sizes="(max-width: 1023px) 400px, 480px"` | Depends on mobile assets above |
| Mobile LCP saving (~12–15 KB per visit) | Will be addressed in Step B once assets are provided |

Step A ships independently. Step B can be added in any future session once the design team provides the 5 mobile-sized webp files.

---

## Summary Table

| Op | File | Line | Change | Lines affected |
|---|---|---|---|---|
| 1 | `src/pages/ProductPage.jsx` | 100 (after insertion) | Add `data-testid="product-hero-image"` | 1 line added |

**Total code change: 1 line.**
**Total rebuild: 1 (`yarn build` — ~2 min).**
**Total restarts: 1 (`supervisorctl restart frontend`).**

---

*Plan written 2026-09-08. Ready for implementation on owner go-ahead.*
