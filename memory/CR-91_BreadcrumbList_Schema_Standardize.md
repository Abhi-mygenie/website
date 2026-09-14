# CR-91 — Standardize BreadcrumbList Schema Across All Pages

**Type:** Schema / Structured Data  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M3  
**Effort:** 1 hr  
**Improves:** SEO · Schema  
**Scope:** `SectorPage.jsx`, `Blog.jsx`, `BlogPost.jsx`, `Pricing.jsx`  
**Related:** CR-80 (pricing schema)

---

## 1. Problem Statement

BreadcrumbList schema exists on `ProductPage.jsx` and `AiPage.jsx` but is missing from `SectorPage.jsx`, `Blog.jsx`, `BlogPost.jsx`, and `Pricing.jsx`. Inconsistent BreadcrumbList implementation reduces structured data coverage and eligibility for breadcrumb rich results in search.

---

## 2. Exact Changes Required

### `frontend/src/pages/SectorPage.jsx`
```js
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Solutions", item: `${SITE_URL}/solutions` },
    { "@type": "ListItem", position: 3, name: s.name, item: `${SITE_URL}/solutions/${slug}` },
  ],
};
// Pass to Seo: jsonLd={[faqJsonLd, breadcrumbJsonLd]}
```

### `frontend/src/pages/Blog.jsx`
```js
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
  ],
};
// Pass to Seo: jsonLd={[breadcrumbJsonLd]}
```

### `frontend/src/pages/BlogPost.jsx`
```js
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    { "@type": "ListItem", position: 3, name: post.heading || post.title, item: `${SITE_URL}/blog/${post.slug}` },
  ],
};
// Pass to Seo: jsonLd={[blogPostJsonLd, breadcrumbJsonLd]}
```

### `frontend/src/pages/Pricing.jsx`
```js
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/pricing` },
  ],
};
// Pass to Seo: jsonLd={[SOFTWARE_APP_JSONLD, breadcrumbJsonLd]} (combined with CR-80)
```

Import `SITE_URL` from `@/lib/seo` in each file.

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/SectorPage.jsx` | Add BreadcrumbList JSON-LD |
| `frontend/src/pages/Blog.jsx` | Add BreadcrumbList JSON-LD |
| `frontend/src/pages/BlogPost.jsx` | Add BreadcrumbList JSON-LD |
| `frontend/src/pages/Pricing.jsx` | Add BreadcrumbList JSON-LD (combine with CR-80) |

---

## 4. Definition of Done

- [ ] Rich Results Test shows valid BreadcrumbList for all 4 page types
- [ ] No validation errors in Google Search Console structured data report
- [ ] BreadcrumbList items match the visible URL path structure

---

*CR-91 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M3.*
