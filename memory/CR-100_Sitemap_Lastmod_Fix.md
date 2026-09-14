# CR-100 — Fix Sitemap lastmod Dates (Remove Bulk Timestamp)

**Type:** Technical SEO / Sitemap  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M12  
**Effort:** 1 hr  
**Improves:** SEO · Crawl Freshness  
**Scope:** `frontend/public/sitemap.xml`  
**Related:** CR-90 (hub pages in sitemap)

---

## 1. Problem Statement

All 22 non-blog pages in `sitemap.xml` share an identical `<lastmod>2026-06-07</lastmod>` date. This bulk-stamped date tells Googlebot that every page was last modified on the same day — which is false and makes the sitemap appear auto-generated. Crawlers may deprioritise re-crawling pages with stale, inaccurate lastmod dates.

---

## 2. Exact Changes Required

### Option A (Quick) — Manually update dates in sitemap.xml
Update each `<lastmod>` to reflect the actual last content change date:

```xml
<!-- Homepage: last major copy update -->
<lastmod>2026-08-20</lastmod>

<!-- /petpooja-alternative: VSP content last updated -->
<lastmod>2026-06-25</lastmod>  <!-- already correct in current sitemap -->

<!-- /pricing: last pricing change -->
<lastmod>2026-07-01</lastmod>

<!-- /solutions/* and /product/*: last H1/copy update (after CR-83) -->
<lastmod>2026-08-20</lastmod>

<!-- /blog: each post has its own date (already correct) -->
```

### Option B (Sustainable) — Generate sitemap at build time
Add a `scripts/generate-sitemap.js` Node.js script that:
1. Reads page list + last git commit date per file
2. Writes `sitemap.xml` with accurate `lastmod` dates
3. Runs as `npm run build:sitemap` before the main build

This prevents the bulk-stamp issue from recurring on future deploys.

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/public/sitemap.xml` | Update lastmod dates to reflect actual content change dates |
| `scripts/generate-sitemap.js` (optional) | New build script for accurate lastmod |

---

## 4. Definition of Done

- [ ] No two unrelated pages share the same `lastmod` date
- [ ] lastmod dates are plausible (match approximate content change dates)
- [ ] sitemap.xml remains valid XML (validate online)
- [ ] Google Search Console: re-submit sitemap after update

---

*CR-100 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M12.*
