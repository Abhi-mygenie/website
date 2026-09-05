# CR-101 — Implement SSR / Pre-rendering (Next.js Migration or react-snap)

**Type:** Architecture / Performance / SEO  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN — LONG-TERM BACKLOG  
**Priority:** LOW (High impact, high effort)  
**Plan ID:** L1  
**Effort:** 4–8 weeks  
**Improves:** Everything — SEO · QS · Perf · GEO · E-E-A-T  
**Scope:** Full framework migration or build pipeline change  
**Related:** ALL other CRs — this is the root fix for 60% of all audit findings

---

## 1. Problem Statement

The site is a pure CRA (Create React App) CSR SPA. The raw HTML served to any visitor (or crawler) contains only `<div id="root"></div>`. All content, metadata, schema, and canonical tags are injected by JavaScript.

This single architectural fact is responsible for:
- Google Ads Landing Page Experience rated "Below Average"
- SEO Health Score 41/100
- AI crawlers (GPTBot, PerplexityBot, CCBot) seeing a blank site
- All canonical tags invisible to non-JS crawlers
- All JSON-LD structured data invisible on first crawl wave

---

## 2. Options

### Option A — Next.js Migration (Recommended Long-Term)

**Effort:** 4–8 weeks

Migrate to Next.js 14+ with:
- `generateStaticParams` for static routes (all sector, product, blog pages)
- `SSR` for dynamic data (LeadsView, PaymentSuccess)
- App Router or Pages Router (Pages Router is simpler given the existing CRA structure)
- `next/image` for automatic WebP + lazy loading (addresses CR-81/CR-82)
- Built-in metadata API (replaces react-helmet-async — addresses all canonical issues)

**Benefits:** Permanent fix. Canonical in raw HTML. Schema in raw HTML. Font preloading native. Code splitting native.

### Option B — react-snap (Interim Pre-rendering)

**Effort:** 1–2 days

Add `react-snap` as a CRA post-build step:
```json
// package.json
"postbuild": "react-snap",
"reactSnap": {
  "puppeteerArgs": ["--no-sandbox"],
  "inlineCss": true,
  "skipThirdPartyRequests": true
}
```

`react-snap` crawls the built app with headless Chrome, captures the rendered HTML for each route, and saves static HTML snapshots. Googlebot receives fully rendered HTML.

**Limitations:** Not true SSR (can’t personalize per request). Dynamic pages (LeadsView) may not pre-render correctly. Requires all routes to be statically enumerable.

**Recommendation:** Implement Option B immediately as an interim fix while planning Option A. Option B can be deployed in days and will move LP Experience from Below Average to Average.

---

## 3. Pre-requisites Before Migration

- All C1–C10 Critical CRs should be deployed first (quick wins that don’t require SSR)
- H1–H10 High CRs can be done in parallel with the migration
- Test suite (current test_reports/) must be updated for SSR behavior

---

## 4. Definition of Done

**Option B (react-snap):**
- [ ] `curl https://www.mygenie.online/petpooja-alternative` returns HTML with H1 text visible
- [ ] Raw HTML `<title>` tag matches the page-specific title (not the generic CRA default)
- [ ] JSON-LD schema visible in raw HTML source
- [ ] Google PageSpeed Insights mobile score ≥60

**Option A (Next.js):**
- [ ] All of the above
- [ ] LCP ≤ 2.5s on mobile (measured in PageSpeed Insights)
- [ ] FCP ≤ 1.8s on mobile
- [ ] CrUX field data shows improvement over 28-day window

---

*CR-101 registered 2026-08-20. Source: SEO & QS Audit · Plan ID L1. This is the highest-impact single CR in the entire backlog.*
