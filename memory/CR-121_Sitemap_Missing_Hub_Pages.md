# CR-121 — Sitemap Missing Hub Pages: /solutions and /product

**Type:** SEO Fix / Sitemap
**Date Raised:** 2026-08-23
**Raised By:** Pre-rollout sitemap audit (CR-101 full rollout prep)
**Status:** OPEN
**Priority:** MEDIUM
**Effort:** ~5 min
**Improves:** SEO crawl coverage · Google index of hub pages
**Scope:** `frontend/public/sitemap.xml` only
**Related:** CR-101 (full prerender rollout), CR-121 (sitemap hub pages)

---

## 1. Problem Statement

`sitemap.xml` contains all 10 solutions sub-pages (`/solutions/restaurants`, etc.) and all 6 product sub-pages (`/product/sell-serve`, etc.), but is **missing the two hub/index pages** that link to them:

| Page | Route | In sitemap? | React Router | Component |
|------|-------|------------|-------------|-----------|
| Solutions hub | `/solutions` | ❌ Missing | ✅ Present | `<SolutionsIndex />` |
| Product hub | `/product` | ❌ Missing | ✅ Present | `<ProductIndex />` |

Both pages exist in the app, are accessible, and are linked from the navbar. Google cannot reliably discover them via sitemap since they're absent.

---

## 2. Fix

Add 2 `<url>` blocks to `sitemap.xml` after the existing legal pages and before the solutions sub-pages:

```xml
  <url>
    <loc>https://www.mygenie.online/solutions</loc>
    <lastmod>2026-08-23</lastmod>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>https://www.mygenie.online/product</loc>
    <lastmod>2026-08-23</lastmod>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
```

**Priority 0.8:** Same as `/blog` and `/ai` — hub pages that aggregate content are high-value for crawling.

**Placement:** After `/refund` (line 68), before `/solutions/restaurants` (line 70). Logical grouping: core pages first, then sub-pages.

After this fix: sitemap will have **53 URLs** (was 51).

---

## 3. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `frontend/public/sitemap.xml` | Add 2 `<url>` blocks (10 lines each) | +20 lines |

No source code changes. No build required — sitemap is a static file in `public/`, copied to `build/` by `yarn build`.

---

## 4. Definition of Done

- [ ] `/solutions` URL present in `sitemap.xml` with priority 0.8
- [ ] `/product` URL present in `sitemap.xml` with priority 0.8
- [ ] `sitemap.xml` has 53 total URLs (was 51)
- [ ] Both routes resolve correctly in the running app (HTTP 200)

---

*CR-121 registered 2026-08-23. Source: pre-rollout sitemap audit.*
