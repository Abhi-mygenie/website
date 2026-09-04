# MyGenie Website — Deploy As-Is

## Problem Statement
Deploy the existing React frontend repo (https://github.com/Abhi-mygenie/website.git, branch: main) directly into /app and run it as-is, with no code edits.

## Architecture
- **Frontend**: React (CRACO) → pre-built static site served by custom `scripts/static-server.js` on port 3000
- **Backend**: FastAPI (uvicorn) on port 8001 connecting to external MongoDB at 52.66.232.149
- **Supervisor**: manages both processes

## Current Build
**main.1273e3d6.js** — 2026-09-04 — CLEAN (CR-207 iconMap build, 402 KB main bundle)

## Session History

### Session 1 (2026-09-02) — Initial Deploy
- Synced repo, installed dependencies, built frontend, wrote all .env credentials

### Session 2 (2026-09-02) — Gap Investigation
- Investigated GA/GTM gaps: GTM not in HTML, no REACT_APP_GTM_ID, old build on production
- Registered CR-198, CR-199, CR-200

### Session 3 (2026-09-02) — Batch AB + Regression
- Implemented CR-198 (GTM ID in .env), CR-199 (GTM in <head>)
- Ran regression T1–T8 → found T2 #418, T3 bakeries, T6 dead routes
- Registered CR-201 to CR-204 (Batch AC)

### Session 6 (2026-09-04) — Batch AD Performance Fixes
- Production audit: LCP 5.1s / TBT 2.9s / Score 51 on www. Explained gap vs preview (GTM, CF beacon, TTFB)
- CR-206 (browserslist) → Score 76→84 (+8), TBT 852ms→80ms, bundle 958→937KB
- CR-207 (iconMap): Found `import * as Icons` in 15 files bundled all 3,624 icons. Created `src/lib/iconMap.js`, fixed all 15 files → bundle 937→402KB (−535KB, −57%)
- Registered CR-208 (Suspense split). Revised impact to +0–1pt after CR-207 shrunk chunks to 34KB total
- Wrote full handover at /app/memory/HANDOVER_2026-09-04_Session6.md

### Session 5 (2026-09-04) — Fresh Re-sync
- Pulled latest main from GitHub (origin/main, 34 commits)
- Installed missing backend deps: razorpay, apscheduler
- Rebuilt frontend with REACT_APP_BACKEND_URL=https://beta.mygenie.online → new build main.3e4ae81a.js
- All env vars from problem statement written to /app/backend/.env
- Both frontend and backend RUNNING, website rendering correctly

### Session 4 (2026-09-03) — Batch AC + CR-205 (#418 fix)
- Implemented CR-201 (ConsentBanner mountedRef), CR-202/203 (_redirects), CR-204 (bakeries h1)
- Investigated React #418 across 9 test iterations
- Root cause: hydrateRoot requires Suspense markers Puppeteer doesn't emit
- Fix: createRoot replaces hydrateRoot; LP() helper per route; hydrated gate for CmsAdminLayer
- Additional fixes: QSR h1, bars-and-pubs SPA redirect, bars-pubs h1+meta
- **Final regression iteration_12: 100% — all T1–T8 PASS**

## What's Been Implemented (complete)
- CR-70–72: Font preloading, hero LCP image, React.lazy code splitting
- CR-73–76, 111–113: Petpooja landing page UX
- CR-77–100: SEO/schema/crawlability (batch A–D)
- CR-114–116: LCP/CWV closeout (Batch E)
- CR-124–127: Production CWV gaps (Batch F)
- CR-128–132: Lighthouse gap closers (Batch G)
- CR-133–135: Prerender SEO bug fixes (Batch H)
- CR-136–137 (partial): Schema gaps (Batch I)
- CR-139–143: Crawlability/touch target fixes (Batches J/K)
- CR-147: Customer logo refresh (Batch L)
- CR-148–152: Google Ads LPs (Batch M)
- CR-153: ENV-gated lead dashboard
- CR-154–164: UX/SEO audit fixes (Batches N/O)
- CR-165–166: QA-found bugs
- CR-167–171: Homepage SEO gaps (Batch Q)
- CR-173–177: UAT audit dev fixes (Batch R)
- CR-178–179: Keyword density (Batches S/T)
- CR-181: Meta description lengths
- CR-183–185: Lighthouse mobile gaps (Batch W)
- CR-187–190: Keyword body coverage (Batches X/Y)
- CR-191–196: PageSpeed/LCP fixes (Batches Z/AA)
- CR-198–199: GTM ID + GTM in head (Batch AB)
- CR-201–205: Regression fixes + React #418 (Batch AC)

## Open P0 (Owner Action)
- CR-200: Deploy build/ to www.mygenie.online
- CR-151: Google Ads negative keywords
- CR-180: Domain canonical strategy decision
- CR-77, CR-78: Cloudflare WAF + DNS

## Open P1 (Next Agent — Code)
- CR-191–196: LCP landing page fixes (fetchPriority, Reveal removal, /demo noindex+font)
- CR-126: Lock prerender in build pipeline (package.json)
- CR-146: beta robots.txt Disallow
- CR-182: Hero banner srcset (mobile)

## Open P1 (Blocked on Owner Data)
- CR-172: AggregateRating (needs review source)
- CR-88: Blog author names
- CR-89: Testimonials reviewer names

## Regression Brief Gates (T1–T8)
All currently PASSING on main.3e4ae81a.js. Run after every code change before beta promotion.
Full brief in problem statement / handover docs.

## Key Technical Rules
- yarn start = static server (NOT webpack dev server) — every code change needs yarn build + restart
- createRoot (not hydrateRoot) — Puppeteer prerender doesn't emit Suspense markers
- LP() wrapper on all lazy routes in App.js — Suspense scoped per route
- GTM only fires on www.mygenie.online (host guard) — never on preview/beta
- GTM conversion events: thankyou_conversion fires at OTP (Stage 2) — owner confirmed intentional
- CMS overrides: trust_logos, testimonials, hero.banner_image, sector faqs, pricing plans via MongoDB
- Always edit sectors via sectors.js, products via products.js — never edit SectorPage/ProductPage directly

