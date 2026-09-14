# Prerender SEO Audit — Complete Impact Analysis

**Date:** 2026-08-24
**Type:** Critical Bug Investigation
**Status:** Investigation complete — no code changed

---

## Executive Summary

**Three distinct issues found.** The most severe is a react-helmet-async 3.0 timing bug that causes ALL 53 prerendered pages to carry the homepage's `<title>`, `<canonical>`, and `<meta description>` — telling Google every page on the site is the same page. Body content per page IS correctly prerendered. Sitemap coverage is complete.

---

## Issue 1 — Critical: All 53 Pages Have Identical Head Tags

### Scope
**53/53 pages** affected. No exceptions.

| Tag | All 53 pages show | Should show |
|-----|------------------|-------------|
| `<title>` | `POS System for Restaurants & Cafes \| Best Billing Software - MyGenie` | Per-page title |
| `<link rel="canonical">` | `https://www.mygenie.online/` (homepage) | Per-page URL |
| `<meta name="description">` | Homepage default + correct description (duplicated) | Per-page only |
| `<meta property="og:title">` | Homepage title + correct title (duplicated) | Per-page title only |

### What it means to Google
Google sees 53 different URLs, but every single one declares:
- `<canonical>` → homepage (`https://www.mygenie.online/`)
- `<title>` → homepage title

**Effect:** Google interprets all 53 pages as duplicates of the homepage. It will consolidate them into one, deindex the non-homepage URLs, and assign all link equity to the homepage. Pages like `/pricing`, `/solutions/restaurants`, `/blog/[post]` will not appear in search results with their own titles.

### What it does NOT affect
- **Body content is correct** — `/solutions/restaurants` has Restaurants sector content, `/pricing` has pricing content. Not a single page shows homepage body content bleeding through. The prerender got the body right — only the `<head>` is wrong.
- **User experience** — browsers use `document.title` which react-helmet-async updates correctly after hydration. Users see the right title in their browser tab.
- **JSON-LD schemas** — structured data (FAQPage, BlogPosting, SoftwareApplication etc.) is correctly injected per page. react-helmet-async adds these but the static ones from public/index.html corrupt title/canonical.

### Root cause
`react-helmet-async 3.0.0` was newly installed in this deployment (it was missing in the previous environment, causing compile errors). Version 3.0 changed its internal architecture — it now manages `<title>` and `<canonical>` via React portals committed to the `<head>`.

The `prerender.js` script:
1. Loads the CRA shell (`build/index.html`) for each route — this shell has the homepage `<title>` and no canonical (just the default from `public/index.html`)
2. React renders the correct page content (body correctly prerendered)
3. `waitForSelector` fires when the component's root `data-testid` appears in the DOM
4. **At this exact moment,** react-helmet-async has committed og:title, og:description etc. (via portals, synchronous) BUT has NOT yet updated `<title>` (updated via a separate async mechanism / effect)
5. `page.evaluate()` runs the canonical deduplication: keeps FIRST canonical, removes the rest — the first canonical is the shell's homepage canonical, the correct per-page one is removed
6. `page.content()` captures the DOM — wrong title (shell default), wrong canonical (deduplicated to wrong one)

**Proof:** Live browser test with 3s delay shows CORRECT titles and TWO canonicals:
```
/pricing live: title = "MyGenie POS Pricing | Transparent Restaurant POS Plans..."  ✅
/pricing live: ALL canonicals = ['https://www.mygenie.online/', 'https://www.mygenie.online/pricing']
              ↑ shell canonical (first)                        ↑ correct canonical (second, removed by dedup)
```

### Fix required (2 lines in `scripts/prerender.js`)
**Fix A — Wait for title update before snapshot:**
```js
// After waitForSelector — wait for react-helmet-async to update title
await page.waitForFunction(
  (shellTitle) => document.title !== shellTitle,
  { timeout: 5000 },
  'POS System for Restaurants & Cafes | Best Billing Software - MyGenie'
).catch(() => {}); // non-fatal: homepage itself has this title
```

**Fix B — Keep LAST canonical, not FIRST:**
```js
// CURRENT (keeps shell canonical = wrong):
Array.from(canonicals).slice(1).forEach((c) => c.remove());

// FIX (keeps react-helmet canonical = correct):
Array.from(canonicals).slice(0, -1).forEach((c) => c.remove());
```

After both fixes: full re-prerender (53 routes) needed.

---

## Issue 2 — Body Content Leak Investigation

### Claim investigated
"Homepage content appearing on demo and other pages"

### Finding: FALSE for prerendered pages, TRUE for non-prerendered pages

**No prerendered page has homepage body content.** Checked all 53 built pages for 6 homepage-specific DOM markers:
- `"Run a more profitable hospitality business"` (H1 text)
- `"TRUSTED BY RESTAURANTS"` (TrustBand)
- `data-testid="sector-selector"` (SectorSelector)
- `data-testid="proof-section"` (ProofSection)
- `data-testid="hero-badge"` (Hero badge)
- `data-testid="module-overview"` (ModuleOverview)

**Result: 0 pages show any homepage body content** (except the homepage itself).

### BUT — 3 pages serve homepage HTML to crawlers and first-time visitors

Three routes exist in the app but were NOT prerendered:

| Route | Why not prerendered | What static server serves |
|-------|-------------------|--------------------------|
| `/demo` | Not in `sitemap.xml` → prerender.js reads sitemap to build its route list | `build/index.html` = **homepage prerender** |
| `/payment-success` | Same reason | `build/index.html` = **homepage prerender** |
| `/leads` | Same reason | `build/index.html` = **homepage prerender** |

**For `/demo`:** A visitor landing on this URL (e.g. from a Google Ads click) will briefly see the MyGenie homepage hero, TrustBand, and ProofSection until React downloads and hydrates — replacing it with the demo form. This is the "homepage content appearing on demo page" the audit flagged. The flash duration depends on JS download speed (1–3s on mobile).

**For `/leads` and `/payment-success`:** Same behavior but lower traffic impact.

### SEO impact of /demo serving homepage HTML
**Low** — `/demo` has `noindex={true}` in the `<Seo>` component (correct: it's an ad landing page, should not be indexed). Google will not index it regardless.

**User experience impact:** High for paid ad traffic. A user who clicks a Google Ad landing on `/demo` sees the homepage flash for 1–3s before the demo form appears. This increases bounce rate and wastes ad spend.

### Additional bug discovered: `canonical` prop silently ignored on /demo

`DemoLanding.jsx` passes `canonical="/demo"` to `<Seo>`, but `Seo.jsx` does NOT accept a `canonical` prop — it only accepts `path`. The `canonical="/demo"` prop is silently ignored. The canonical resolves to `${SITE_URL}${""}` = `https://www.mygenie.online/` (homepage).

Since `/demo` has `noindex=true`, this doesn't harm Google. But it is a code bug.

**Fix required:** Either rename prop in `DemoLanding.jsx` from `canonical` to `path`, OR add `canonical` as an accepted prop in `Seo.jsx`.

---

## Issue 3 — Sitemap Coverage

### Finding: Sitemap is COMPLETE for indexable pages

| Category | Count | Status |
|----------|-------|--------|
| Core pages (/, /pricing, /customers, etc.) | 9 | ✅ All in sitemap |
| Legal pages (/terms, /privacy, /refund) | 3 | ✅ All in sitemap |
| Hub pages (/solutions, /product) | 2 | ✅ Added (CR-121 was implemented) |
| Solution pages (/solutions/restaurants etc.) | 11 | ✅ All in sitemap |
| Product pages (/product/sell-serve etc.) | 6 | ✅ All in sitemap |
| Blog listing (/blog) | 1 | ✅ In sitemap |
| Blog posts (21 posts) | 21 | ✅ All in sitemap |
| **Total** | **53** | **✅ Matches prerendered build exactly** |

### Pages correctly excluded from sitemap

| Route | Why excluded | Correct? |
|-------|-------------|----------|
| `/demo` | `noindex=true` — paid ad landing page | ✅ Correct |
| `/leads` | Admin/internal CRM dashboard | ✅ Correct |
| `/payment-success` | Transactional confirmation page | ✅ Correct |
| `/solutions/:slug` | Dynamic — instances covered | ✅ Correct |
| `/product/:bucket` | Dynamic — instances covered | ✅ Correct |
| `/blog/:slug` | Dynamic — instances covered | ✅ Correct |

### Stale lastmod dates (known gap from CR-122)
29 non-blog pages still have `lastmod: 2026-06-07`. This is a separate issue (CR-122) not related to this audit. See CR-122_Sitemap_Stale_Lastmod_Dates.md.

---

## Priority Summary

| # | Issue | Severity | Pages | Fix effort |
|---|-------|----------|-------|-----------|
| 1 | All 53 pages: wrong `<title>`, `<canonical>`, duplicate `<description>` | **CRITICAL** | 53/53 | 2-line fix in prerender.js + full re-prerender |
| 2 | `/demo`, `/leads`, `/payment-success` serve homepage HTML until JS loads | HIGH (UX) / LOW (SEO) | 3 pages | Add 3 routes to prerender.js ROUTES list |
| 3 | `DemoLanding.jsx` passes `canonical` prop that Seo.jsx silently ignores | MEDIUM | 1 page | Rename prop from `canonical` → `path` |
| 4 | Sitemap stale lastmod dates | MEDIUM | 29 pages | CR-122 (separate) |

---

## What This Means for the Lighthouse Score

Issue 1 does NOT affect Lighthouse score (Lighthouse doesn't audit canonical or title uniqueness).
Issue 2 DOES affect Lighthouse — `/demo` serving 1.5MB homepage HTML before hydration inflates FCP on the demo landing page (relevant for Google Ads Quality Score).

---

*Investigation complete 2026-08-24. No code changed. 4 issues identified, all requiring prerender.js and/or Seo.jsx changes.*
