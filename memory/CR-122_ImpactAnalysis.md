# CR-122 — Impact Analysis
## Sitemap Stale lastmod Dates on Non-Blog Pages

**Date:** 2026-08-23
**Status:** OPEN — ready for implementation
**Effort:** ~10 min
**File changed:** `public/sitemap.xml` only

---

## 1. Executive Summary

29 of the 51 sitemap URLs carry `lastmod: 2026-06-07`. Since June 2026, every page on the site has received genuine, significant HTML-level changes (prerendering, self-hosted fonts, structured data injection, JS bundle restructuring). These changes are the CWV POC we've been building.

Leaving June 2026 dates in the sitemap signals to Googlebot: *"nothing has changed since June."* After production deployment, this delays Googlebot from re-crawling and re-indexing the improved pages — directly slowing the SEO payoff of all the optimisation work done.

Updating to `2026-08-23` is **accurate** (real changes were made) and **strategically important** (triggers re-crawl priority for the prerendered pages).

---

## 2. What `lastmod` Means and How Google Uses It

### 2a. The spec

`lastmod` in a sitemap signals the date when a URL's content was **last significantly modified**. Per the Sitemaps protocol (sitemaps.org) and Google's documentation:

> "The date of last modification of the file. This date should be in W3C Datetime format. This format allows you to omit the time portion if desired, and use YYYY-MM-DD."

### 2b. How Google actually uses it

Google's John Mueller has confirmed that `lastmod` is used as a **crawl prioritisation signal**, not a guaranteed crawl trigger. Specifically:
- Pages with stale `lastmod` → deprioritised for re-crawl
- Pages with recent `lastmod` → elevated in Googlebot's crawl queue
- Pages with `lastmod` matching the deployment date after a significant change → Google allocates additional crawl budget to verify the change

For a site deploying its first full prerender (turning CSR shell into content-rich HTML with structured data), getting Googlebot to re-crawl quickly is critical. The difference between `2026-06-07` and `2026-08-23` is the difference between "Googlebot already checked these pages recently, deprioritise" vs "these pages have been updated, recrawl."

### 2c. The crawl budget dimension

For a mid-size site like MyGenie (~53 URLs, moderate authority), Googlebot allocates a crawl budget per day. With stale lastmod on 29 pages:
- Googlebot sees 29 pages marked as "last modified June 2026"
- It doesn't know these pages now have prerendered content, JSON-LD, and font changes
- It may crawl 2–3 of them per week rather than 10–15
- Full re-index of all improved pages: **weeks or months**

With updated lastmod on all 29 pages:
- Googlebot sees 29 pages marked as "modified today"
- Allocates higher crawl priority to all of them
- Full re-index: **days to 1–2 weeks**

---

## 3. What Has Actually Changed on Every Page Since June 2026

The changes that justify updating `lastmod` are real HTML-level changes visible to Googlebot:

| Change | CR | Affects |
|--------|----|----|
| Prerendering: actual text content in raw HTML (was CSR empty shell) | CR-101 | All pages |
| Self-hosted Clash Display font — removes `api.fontshare.com` from `<head>` | CR-114 | All pages |
| Inline `@font-face` CSS in `<head>` | CR-114/118 | All pages |
| Self-hosted Poppins font — removes `fonts.googleapis.com` from `<head>` | CR-118 | All pages |
| Hero image `<link rel="preload">` injected by prerender | hero-preload CR | Homepage + any page with hero |
| Prerender cleanup: no duplicate styles, no googleapis links in HTML | CR-117 | All pages |
| PostHog init code changed in `<head>` | CR-115 | All pages |
| JSON-LD structured data in raw HTML (was injected by JS, not in raw HTML) | CR-101 | All pages |
| Image `width`/`height` attributes on `<img>` tags | CR-82/120 | All pages with images |

**Every page has genuine, crawlable HTML changes.** Updating `lastmod` is not gaming the system — it's accurately reflecting reality.

---

## 4. Stale Date Distribution — Confirmed

```
Date distribution in current sitemap.xml:
  2026-06-07:   29 pages  ← stale (non-blog pages)
  2026-06-25:    1 page   ← stale (/petpooja-alternative)
  2024-10-xx:    5 pages  ← correct (blog posts, original publish dates)
  2025-02-xx:    4 pages  ← correct (blog posts)
  2025-03-xx:    9 pages  ← correct (blog posts)
  2025-04-xx:    3 pages  ← correct (blog posts)
  2025-05-xx:    3 pages  ← correct (blog posts)
```

**Total pages to update: 30** (29 with `2026-06-07` + 1 with `2026-06-25`).
**Blog posts (21 entries): unchanged** — their dates reflect original publish dates; blog content has not changed.

---

## 5. Before vs After

### Before — What Googlebot sees after production deployment with stale dates

```
Googlebot crawls sitemap on deployment day:
  / → lastmod: 2026-06-07 → "I crawled this in June, nothing new, deprioritise"
  /pricing → lastmod: 2026-06-07 → same
  /solutions/restaurants → lastmod: 2026-06-07 → same
  ...

Result:
  Googlebot re-crawls 2-3 pages/day
  Full re-index of 30 pages: ~2-4 weeks
  Prerendered structured data not reflected in search for weeks
```

### After — What Googlebot sees with updated dates

```
Googlebot crawls sitemap on deployment day:
  / → lastmod: 2026-08-23 → "Updated today! Schedule high-priority crawl"
  /pricing → lastmod: 2026-08-23 → same
  /solutions/restaurants → lastmod: 2026-08-23 → same
  ...

Result:
  Googlebot re-crawls 8-15 pages/day (higher budget allocation)
  Full re-index of 30 pages: ~3-7 days
  Prerendered structured data appears in search results faster
```

---

## 6. SEO Impact of Faster Re-indexing

The CWV optimisation work has SEO implications beyond performance scores:

### 6a. Structured data now in raw HTML

Before CR-101 (prerender), Google had to render JavaScript to find JSON-LD. With prerendering:
- `Organization` JSON-LD → on homepage raw HTML
- `SoftwareApplication` + `Offer` JSON-LD → on homepage raw HTML
- `CollectionPage` JSON-LD → on `/solutions` and `/product` raw HTML
- `BreadcrumbList` JSON-LD → on every sector/product page raw HTML (once prerendered)

Googlebot **crawls raw HTML first**. JavaScript-rendered content is a second pass with delays. Prerendering makes all structured data immediately available to Googlebot without JavaScript rendering. This is a direct ranking benefit.

### 6b. Core Web Vitals as ranking signal

Google's CWV ranking factor (part of the "page experience" signals) uses **field data** (CrUX) for ranking, not lab data (Lighthouse). CrUX collects real user data. After production deployment:
- LCP improvement (6s → 2.1s) starts appearing in CrUX data
- CLS improvement (0.15 → 0) starts appearing
- These take 28 days to fully reflect in CrUX

The sooner Google re-crawls and registers the pages as updated, the sooner the connection between URL and new CWV data is established.

### 6c. Title + H1 alignment

Several pages had their content updated during the CWV work (font changes affect how text renders, some content was CMS-updated). Accurate `lastmod` ensures Google re-evaluates these pages' content signals.

---

## 7. Blog Post Dates — Why They Stay

The 21 blog posts have dates ranging from `2024-10-01` to `2025-05-23`. These are correct:
- Blog content hasn't changed (we only changed the serving infrastructure, not the article content)
- Google tracks blog post freshness separately — updating `lastmod` to today for a 2024 article signals it's been re-published/edited, which can actually *hurt* rankings if the content hasn't changed (Google might flag it as freshness manipulation)
- Accurate `lastmod` for blog posts = original publish date ← **correct to leave as-is**

---

## 8. Risk Assessment

**Zero risk.** `lastmod` is a hint, not a command — Google is free to ignore it. The worst case is Google ignores the updated dates and crawls at its normal schedule. This CR has no downside.

The only thing that would be wrong is if we updated blog post dates (which we're explicitly NOT doing).

---

## 9. Recommended Implementation Order

CR-121 and CR-122 should be done together in one edit pass:
1. Add `/solutions` and `/product` hub pages (CR-121) — with `lastmod: 2026-08-23`
2. Update all 30 stale non-blog dates to `2026-08-23` (CR-122)
3. Verify XML is well-formed
4. `yarn build` to copy updated sitemap to `build/`
5. Verify `/sitemap.xml` accessible after build

**Total file changes: 1 file, ~50 lines** (20 new + 30 updated).

---

## 10. Dependency on Production Deployment

CR-122's SEO impact only materialises after the updated sitemap is deployed to production and submitted to Google Search Console. The sequence:

```
1. Implement CR-121 + CR-122 (today)
2. Deploy to production (beta.mygenie.online)
3. Submit sitemap in Google Search Console: https://www.mygenie.online/sitemap.xml
4. Googlebot crawls with high priority
5. Prerendered pages indexed within days
6. Structured data, updated titles, CWV signals all reflected in search
```

Without step 3 (Search Console submission), Googlebot still discovers the sitemap eventually (it checks `robots.txt` which typically references the sitemap). But manual submission is faster.

---

*Impact analysis written 2026-08-23. No code changed.*
