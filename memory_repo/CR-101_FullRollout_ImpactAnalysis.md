# CR-101 Full Rollout — End-to-End Impact Analysis
## Extend Prerendering from Homepage `/` to All 53 Routes

**Date:** 2026-08-23
**Status:** OPEN — ready for implementation
**Author:** E1 analysis agent

---

## 1. Executive Summary

The prerender POC proved that static HTML snapshots of React pages improve LCP, CLS, and SEO significantly. The POC was intentionally limited to the homepage (`/`). This CR extends the same mechanism to all **53 routes** in `sitemap.xml`.

**The change is 2 lines + 1 comment update in `prerender.js`** — no React source files, no CSS, no build config.

**Correcting the "1-line" claim:** The ROUTES array change is 1 logical change but requires ~55 lines of array content. More importantly, a second fix is required: the `waitForSelector('[data-testid="hero"]')` only works on the homepage — all other pages use different testids (`sector-hero`, `ai-page`, `blog-post-page`, etc.) and would timeout after 30 seconds without the fix.

| Metric | Homepage (POC) | All 53 pages (rollout) |
|--------|---------------|----------------------|
| Pages with content in raw HTML | 1 | **53** |
| Pages with JSON-LD in raw HTML | 1 | **53** |
| LCP improvement | ✅ Done | Applied to all pages |
| SEO structured data | Homepage only | All sector, product, blog pages |
| Prerender time | ~2.4s | **~2 minutes** (53 × 2.4s) |

---

## 2. Current State

### What the POC already does (for `/`)
1. Takes a Puppeteer snapshot of the rendered page
2. Cleans up artefacts (Sonner CSS dedup, noscript removal, canonical dedup)
3. Removes googleapis.com links (Poppins now self-hosted)
4. Injects hero image preload into `<head>`
5. Writes `build/index.html`

**All of this runs inside a `for (const route of ROUTES)` loop.** The loop already handles any number of routes. The POC just happens to have `ROUTES = ["/"]`.

---

## 3. The Two Code Changes Required

### Change A — Line 7: ROUTES array

**Current:**
```js
const ROUTES = ["/"];                       // POC: homepage only
```

**After rollout:**
```js
const ROUTES = (() => {
  const xml = require("fs").readFileSync(
    require("path").resolve(__dirname, "../public/sitemap.xml"), "utf8"
  );
  return [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
})();
// 53 routes — auto-synced with sitemap.xml
```

**Why read from sitemap (not hard-code):**
- Stays in sync automatically — adding a URL to sitemap auto-includes it in prerender
- No manual maintenance of two separate lists
- Adding a new blog post to sitemap → it gets prerendered on next build
- The sitemap is already the authoritative list of public pages

**Confirmed: 53 routes from sitemap.xml:**
```
Core:     / /petpooja-alternative /pricing /customers /roi /resources
          /blog /ai /about /contact
Legal:    /terms /privacy /refund
Hubs:     /solutions /product
Sectors:  /solutions/restaurants /solutions/cafes /solutions/qsr
          /solutions/cloud-kitchens /solutions/hotels-resorts
          /solutions/food-courts /solutions/canteens /solutions/chains
          /solutions/bars-pubs /solutions/bakeries /solutions/ice-cream-desserts
Products: /product/sell-serve /product/run-property /product/customers
          /product/protect-profit /product/see-everything /product/central-inventory
Blog:     21 blog post URLs
```

---

### Change B — Line 43: waitForSelector (critical fix)

**Current:**
```js
await page.waitForSelector('[data-testid="hero"]', { timeout: 30000 });
```

**Problem:** `[data-testid="hero"]` only exists in `Hero.jsx` (homepage). Every other page type uses a different testid for its above-fold section.

**Confirmed testid audit across all 53 page types:**

| Page/component | data-testid | CSS match |
|----------------|-------------|-----------|
| Home.jsx | `hero` | exact |
| Hero.jsx | `hero` | exact |
| SectorPage.jsx | `sector-hero` | `$="-hero"` |
| ProductPage.jsx | `product-hero` | `$="-hero"` |
| SolutionsIndex.jsx | `solutions-hero` | `$="-hero"` |
| ProductIndex.jsx | `product-index-hero` | `$="-hero"` |
| AiPage.jsx | `ai-hero` | `$="-hero"` |
| SuccessStories.jsx | `stories-hero` | `$="-hero"` |
| PetpoojaAlternative.jsx | `vsp-hero` | `$="-hero"` |
| Blog.jsx | `blog-page` | `$="-page"` |
| BlogPost.jsx | `blog-post-page` | `$="-page"` |
| About.jsx | `about-page` | `$="-page"` |
| Contact.jsx | `contact-page` | `$="-page"` |
| Pricing.jsx | `pricing-page` | `$="-page"` |
| AiPage.jsx | `ai-page` | `$="-page"` |
| RoiCalculator.jsx | `roi-page` | `$="-page"` |
| Resources.jsx | `resources-page` | `$="-page"` |
| Legal.jsx | `legal-page-${doc}` | `^="legal-page"` |

**Pattern:** All non-homepage pages use either `*-hero` or `*-page` testids. A single CSS compound selector covers all:

```js
await page.waitForSelector(
  '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
  { timeout: 30000 }
);
```

**Verification:**
- `[data-testid="hero"]` → homepage ✅
- `[data-testid$="-hero"]` → 8 page types (sector, product, solutions, product-index, ai, stories, vsp, ...) ✅
- `[data-testid$="-page"]` → 8 page types (blog, blog-post, about, contact, pricing, ai, roi, resources) ✅
- `[data-testid^="legal-page"]` → 3 legal pages (terms, privacy, refund) ✅

**Note about StickyMobileCta.jsx:** This component already implements the same multi-page pattern internally — confirming the testid inventory is correct.

---

### Change C — Line 1 comment (cosmetic)

```js
// scripts/prerender.js — POC: prerender ONLY "/" into build/index.html
```
→
```js
// scripts/prerender.js — Full rollout: prerender all routes from sitemap.xml
```

---

## 4. What Each Page Type Gets from Prerendering

### 4a. All pages

- **Content in raw HTML** — text visible to Googlebot without JS execution
- **JSON-LD in raw HTML** — structured data immediately available (not JavaScript-rendered)
- **Self-hosted font preloads** — Clash Display + Poppins in every page's `<head>`
- **Clean `<head>`** — no Sonner CSS duplicates, no googleapis, no duplicate canonicals

### 4b. Sector pages (`/solutions/restaurants`, etc.)

Each has page-specific JSON-LD:
- `SectorPage` renders with `SECTORS` data for the specific slug
- JSON-LD includes sector-specific `WebPage` schema
- H1 is sector-specific: "POS for Restaurants", "POS for Hotels", etc.
- Current (CSR): Google has to render JS to see "POS for Restaurants" H1 → slow indexing
- After rollout: H1 is in raw HTML → immediate indexing ✅

### 4c. Product pages (`/product/sell-serve`, etc.)

Similar to sector pages. Product-specific titles, H1s, and JSON-LD baked into HTML.

### 4d. Blog posts (`/blog/:slug`)

- 21 blog posts currently serve CSR HTML (empty `<div id="root">`)
- After rollout: full article text, H1, meta description, article schema in raw HTML
- Googlebot can read blog content without JS execution
- Critical for blog ranking — blog content is text-heavy and benefits most from prerendering

### 4e. Legal pages (`/terms`, `/privacy`, `/refund`)

- Simple content pages. Prerendering ensures full text is in raw HTML.
- Low-priority but zero risk — Puppeteer renders them in ~2s.

### 4f. Hub pages (`/solutions`, `/product`)

- Both emit `CollectionPage` JSON-LD with `hasPart` linking to sub-pages
- After prerendering: this JSON-LD is in raw HTML → stronger SEO signal

---

## 5. Hero Image Preload — Per-Page Behaviour

The current prerender.js injects a hero image preload for pages that have `[data-testid="hero-visual"] img`. This testid only exists in `Hero.jsx` (homepage). The code has a null check:

```js
const heroImg = document.querySelector('[data-testid="hero-visual"] img');
if (heroImg && heroImg.src) { /* only runs on homepage */ }
```

For all other pages, `heroImg` is `null` → the condition fails → no preload injected → **safe for all pages**. ✅

For pages like SectorPage and ProductPage that have their own hero images, a future enhancement could inject their hero preloads too. That's out of scope for this CR.

---

## 6. Prerender Time Estimate

```
Single page prerender time: ~2.4 seconds (measured)
53 pages × 2.4s = ~127 seconds = ~2.1 minutes
```

Puppeteer opens pages sequentially (one at a time). Parallel prerendering would be faster but adds complexity — out of scope.

**Build pipeline:**
```bash
yarn build      → ~20 seconds
prerender.js    → ~2 minutes
Total           → ~2.5 minutes
```

This runs at deploy time, not at request time. Users are not affected.

---

## 7. Output Structure After Rollout

The prerender script writes each route as `build/{route}/index.html`:

```
build/
├── index.html                              ← / (homepage)
├── pricing/index.html                      ← /pricing
├── blog/index.html                         ← /blog
├── blog/How-Small-Changes-.../index.html   ← /blog/:slug
├── solutions/restaurants/index.html       ← /solutions/restaurants
├── product/sell-serve/index.html          ← /product/sell-serve
└── ... (53 total)
```

The `static-server.js` already handles this with SPA fallback — it looks for `build/{route}/index.html` and serves it if found. ✅

---

## 8. Risk Assessment

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|-----------|
| A page times out (waitForSelector doesn't match) | Very Low | Medium | Combined selector covers all testids; confirmed via audit |
| Blog post slug has special characters | Very Low | Low | `/blog/How-Indian...game!` has `!` — `mkdirSync` handles it |
| Pages with API calls fail mid-render | Low | Low | `networkidle0` + failed XHR = settled network; page renders with fallback content |
| CMS content not matching production | Low | Low | Fallback text renders; identical to current CSR behaviour |
| Prerender of 53 pages too slow | None | None | 2.1 minutes is acceptable; runs at build time |

---

## 9. Pages NOT Included (by design)

| Route | Why excluded |
|-------|-------------|
| `/leads` | Admin-only page; not in sitemap; requires auth |
| `/demo` | Landing page; not in sitemap; dynamic UTM params |
| `/payment-success` | Transactional; dynamic state; not in sitemap |

---

## 10. Impact Summary

| Dimension | Before | After |
|-----------|--------|-------|
| Pages with prerendered HTML | 1 | **53** |
| Pages with JSON-LD in raw HTML | 1 | **53** |
| Blog posts indexable without JS | 0 | **21** |
| Sector pages with H1 in raw HTML | 0 | **11** |
| Product pages with H1 in raw HTML | 0 | **6** |
| Build pipeline time | ~20s | **~2.5 min** |
| Code changes | — | **2 lines + 1 comment** |

---

*Impact analysis written 2026-08-23. No code changed.*
