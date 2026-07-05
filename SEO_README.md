# SEO Migration & Cutover — Documentation Index

> **📌 DURABLE SOURCE OF TRUTH — do not delete or overwrite.**
> This file (and the three SEO docs it lists) is the persistent record for all SEO work on this project.
> Unlike `/app/memory/PRD.md` (which agents rewrite), SEO facts/decisions/status live HERE.
> Any agent touching SEO must read and update this file, not duplicate detail into the PRD.

One place that maps every SEO deliverable for the MyGenie POS V2.4 migration.

## 📄 Documents
| Doc | Purpose |
|---|---|
| `/app/SEO_Migration_Strategy.md` | Full migration strategy: old-site footprint, URL redirect map, content-gap plan, technical-SEO plan, implementation-status. |
| `/app/SEO_Migration_Weekly_Monitoring_Report.md` | Closure report (A–K): verdicts, redirect QA, blog QA (21), sitemap/robots, meta/canonical, analytics, prerender risk, Week-0 baseline + 4-week monitoring tables. |
| `/app/SEO_Production_Cutover_Gate.md` | Production cutover gate (A–H): checklist, 301 readiness, canonical, sitemap/robots, analytics owner-pending, deploy-time QA commands, rollback triggers, go/no-go. |

## ⚙️ Redirect / SEO config files
| File | Where it applies |
|---|---|
| `/app/frontend/cloudflare-bulk-redirects.csv` | **Recommended** — import as a Cloudflare Bulk Redirect List (19 old→new 301s). Origin-agnostic. |
| `/app/frontend/nginx-redirects.conf` | If self-hosting the build on your nginx origin (19 path 301s + commented non-www→www host rule). |
| `/app/frontend/public/_redirects` | Netlify/Vercel-style fallback (19 × 301 + SPA 200 fallback). |
| `/app/frontend/public/sitemap.xml` | 48 URLs, single www host. Regenerate: `python3 scripts/generate_sitemap.py`. |
| `/app/frontend/public/robots.txt` | `Allow: /` + Sitemap (www). |
| `/app/scripts/scrape_blog.py` | Re-scrape the 21 live blog posts → `frontend/src/data/blogPosts.json` + `public/blog/` images. |

## 🔑 Key decisions on record
- **Canonical domain:** `https://www.mygenie.online` (www). non-www→www 301 already live; must be preserved.
- **Platform finding (Emergent support):** Emergent managed hosting does **NOT** support `_redirects`/nginx/edge 301s. Real 301s must be applied at **Cloudflare** (which already fronts the domain) or a self-hosted nginx origin.
- **Real HTTP 301 vs client-side:** old URLs return real 301 only after the Cloudflare list / nginx rules are applied; React `<Navigate>` is a fallback only.
- **GATE 3 (functional, P0):** `REACT_APP_BACKEND_URL` is still the preview URL — must be repointed to the production backend before/at cutover (the only non-SEO reference baked into the build). Also set `REACT_APP_SITE_URL=https://www.mygenie.online`.
- **Structured data:** per-page JSON-LD via `Seo` (accepts object OR array). Organization (home), FAQPage (resources/sector/product/AI), Article/Blog (blog), ContactPage (contact), **BreadcrumbList (/ai + all product pages — added June 2026)**.

## 🚦 Status
- **Build:** SEO-ready and validated (canonical/sitemap/robots/blog/meta/FB-verification; 0 preview leaks in sitemap).
- **Closure:** NOT fully closed — closes only when live on `www.mygenie.online` with old URLs returning server-side 301 and new + 21 blog pages returning 200 (per owner rule).
- **Owner-pending:** GA4 ID, Meta Pixel ID, GSC verify + sitemap submit, prerender/SSR (P1 risk).
