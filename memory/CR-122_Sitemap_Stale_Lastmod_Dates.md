# CR-122 — Sitemap Stale lastmod Dates on Non-Blog Pages

**Type:** SEO Fix / Sitemap
**Date Raised:** 2026-08-23
**Raised By:** Pre-rollout sitemap audit (CR-101 full rollout prep)
**Status:** OPEN
**Priority:** MEDIUM
**Effort:** ~10 min
**Improves:** Google re-crawl priority · Search Console freshness signals
**Scope:** `frontend/public/sitemap.xml` only
**Related:** CR-121 (sitemap hub pages), CR-101 (prerender rollout)

---

## 1. Problem Statement

29 of the 51 URLs in `sitemap.xml` have `lastmod: 2026-06-07` — a date from June 2026. Since then, significant changes have been made to every page's `<head>`, fonts, CSS, and JS bundle as part of the CWV POC (CR-114 through CR-120).

Google uses `lastmod` to prioritise re-crawling. Stale dates from June signal "nothing has changed" — Google may deprioritise these pages for re-indexing after production deployment, delaying the SEO benefits of the prerender rollout.

### Current date distribution

| Date | Count | Pages |
|------|-------|-------|
| `2026-06-07` | 29 | All core + solutions + product pages |
| `2026-06-25` | 1 | `/petpooja-alternative` |
| `2024-10-01` to `2025-05-23` | 21 | Blog posts |

### What changed since June 2026 (affects all non-blog pages)

- `<head>` structure: self-hosted fonts, preload tags, inline `@font-face` (CR-114, CR-118)
- Hero image preload injected into every prerendered page (CR-101 + hero preload)
- JS bundle split (React.lazy) — affects hydration of every page (CR-115)
- PostHog deferral — in `index.html` served to every page (CR-115)
- Prerender cleanup (no duplicate styles, no googleapis) — every page (CR-117)
- Image dimensions added — affects every page that uses images (CR-82)

These are genuine page changes. Updating `lastmod` to `2026-08-23` is accurate.

---

## 2. Scope — Which dates to update

| Pages | Current `lastmod` | Correct `lastmod` | Reason |
|-------|------------------|-------------------|--------|
| All 29 non-blog pages (`2026-06-07` + the one `2026-06-25`) | stale | **`2026-08-23`** | `<head>`, fonts, JS, prerender all changed |
| 21 blog posts (2024–2025 dates) | correct | **keep as-is** | Blog content hasn't changed; these dates reflect when posts were published/last edited |

**30 dates updated. 21 blog post dates unchanged.**

---

## 3. Fix

Update every `<lastmod>` value that predates `2026-08-23` AND belongs to a non-blog page:

Pages to update (30 total):
```
/                          2026-06-07 → 2026-08-23
/petpooja-alternative      2026-06-25 → 2026-08-23
/pricing                   2026-06-07 → 2026-08-23
/customers                 2026-06-07 → 2026-08-23
/roi                       2026-06-07 → 2026-08-23
/resources                 2026-06-07 → 2026-08-23
/blog                      2026-06-07 → 2026-08-23
/ai                        2026-06-07 → 2026-08-23
/about                     2026-06-07 → 2026-08-23
/contact                   2026-06-07 → 2026-08-23
/terms                     2026-06-07 → 2026-08-23
/privacy                   2026-06-07 → 2026-08-23
/refund                    2026-06-07 → 2026-08-23
/solutions (new — CR-121)  —          → 2026-08-23
/solutions/restaurants     2026-06-07 → 2026-08-23
/solutions/cafes           2026-06-07 → 2026-08-23
/solutions/qsr             2026-06-07 → 2026-08-23
/solutions/cloud-kitchens  2026-06-07 → 2026-08-23
/solutions/hotels-resorts  2026-06-07 → 2026-08-23
/solutions/food-courts     2026-06-07 → 2026-08-23
/solutions/canteens        2026-06-07 → 2026-08-23
/solutions/chains          2026-06-07 → 2026-08-23
/solutions/bars-pubs       2026-06-07 → 2026-08-23
/solutions/bakeries        2026-06-07 → 2026-08-23
/solutions/ice-cream-desserts  2026-06-07 → 2026-08-23
/product (new — CR-121)    —          → 2026-08-23
/product/sell-serve        2026-06-07 → 2026-08-23
/product/run-property      2026-06-07 → 2026-08-23
/product/customers         2026-06-07 → 2026-08-23
/product/protect-profit    2026-06-07 → 2026-08-23
/product/see-everything    2026-06-07 → 2026-08-23
/product/central-inventory 2026-06-07 → 2026-08-23
```

The simplest implementation: a `sed` command or Python script to replace `2026-06-07` → `2026-08-23` and `2026-06-25` → `2026-08-23` in the non-blog sections. Or edit manually in the XML file.

---

## 4. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `frontend/public/sitemap.xml` | Update 30 `<lastmod>` values | 30 lines changed |

No source code changes. No build required.

---

## 5. Implementation Note

CR-121 and CR-122 should be implemented **together in one edit pass** since both modify `sitemap.xml`. Doing them separately means two rounds of build verification for the same file.

---

## 6. Definition of Done

- [ ] All non-blog pages have `lastmod: 2026-08-23`
- [ ] All 21 blog post dates unchanged
- [ ] Sitemap validates as well-formed XML
- [ ] `sitemap.xml` is accessible at `/sitemap.xml` in the built app
- [ ] Total URL count correct: 53 (after CR-121 adds 2 hub pages)

---

*CR-122 registered 2026-08-23. Source: pre-rollout sitemap audit.*
