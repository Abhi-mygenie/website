# CR-90 — Add /product and /solutions Hub Pages to sitemap.xml

**Type:** Technical SEO / Sitemap  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M2  
**Effort:** 5 min  
**Improves:** SEO · Crawl  
**Scope:** `frontend/public/sitemap.xml`  
**Related:** CR-78 (apex/www), Marketing brief Issue 4

---

## 1. Problem Statement

The `/product` and `/solutions` hub index pages (which render `ProductIndex` and `SolutionsIndex` components) are valid routes but absent from `sitemap.xml`. All child pages (`/product/sell-serve`, `/solutions/cloud-kitchens`, etc.) are listed, but their parent hubs are not. Googlebot may under-value the hub pages due to lack of explicit sitemap declaration.

---

## 2. Exact Change

**`frontend/public/sitemap.xml` — add two `<url>` entries after the `/customers` entry:**
```xml
<url>
  <loc>https://www.mygenie.online/product</loc>
  <lastmod>2026-08-20</lastmod>
  <priority>0.8</priority>
  <changefreq>monthly</changefreq>
</url>
<url>
  <loc>https://www.mygenie.online/solutions</loc>
  <lastmod>2026-08-20</lastmod>
  <priority>0.8</priority>
  <changefreq>monthly</changefreq>
</url>
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/public/sitemap.xml` | Add 2 URL entries for hub pages |

---

## 4. Definition of Done

- [ ] `/product` and `/solutions` appear in sitemap.xml
- [ ] Google Search Console: submit updated sitemap; confirm both URLs are indexed
- [ ] `sitemap.xml` remains valid XML (validate with sitemap validator)

---

*CR-90 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M2.*
