# MyGenie Website — Deployment PRD

## Original Problem Statement
Deploy the existing React frontend repo directly into `/app` and run it as-is, with no code edits.
- Source: https://github.com/Abhi-mygenie/website.git (main branch)
- Public repo, no auth required
- Use provided env variables

## Architecture

### Frontend
- React 19 app (CRA + CRACO) pre-built as static HTML
- Served by custom Node.js static server (`scripts/static-server.js`)
- Pre-built output at `/app/frontend/build/` (copied from `builds/prod-2026-09-06/`)
- Port: 3000

### Backend
- FastAPI (Python) with many modules:
  - `server.py` — main app
  - `freshsales.py` — CRM integration
  - `leads.py` — lead management
  - `otp.py` — OTP via SMS
  - `payments.py` — Razorpay integration
  - `storage.py` — local/S3 file storage
  - `cms_auth.py` — CMS JWT auth
  - `funnel.py`, `crm_sync.py`, `geo.py`, `ad_spend.py`, etc.
- Port: 8001
- Database: External MongoDB at 52.66.232.149

## What Was Done (2026-09-07)
1. Cloned repo from https://github.com/Abhi-mygenie/website.git into /tmp/website_repo
2. Copied backend files to /app/backend/ (preserving .env)
3. Copied frontend src files to /app/frontend/ (preserving .env)
4. Copied pre-built static site from builds/prod-2026-09-06/ to /app/frontend/build/
5. Synced /app/memory/ and /app/memory_repo/ from repo
6. Updated /app/backend/.env with all provided env variables
7. Installed all Python dependencies (razorpay separately due to pip conflict)
8. Restarted backend + frontend via supervisorctl
9. Both services confirmed RUNNING

## Environment Variables Set
- MONGO_URL: External MongoDB at 52.66.232.149/mygenie
- DB_NAME: test_database
- CORS_ORIGINS: *
- STORAGE_BACKEND: local
- OTP_SMS_ENABLED: true
- EMERGENT_LLM_KEY: set
- CALENDLY_API_TOKEN: set
- All FRESHSALES_* vars: set
- All GST_* vars: set
- CMS credentials: admin/admin123, editor/editor123

## Service Status
- Frontend: RUNNING (static server on port 3000, serving pre-built HTML)
- Backend: RUNNING (FastAPI on port 8001)
- Note: REACT_APP_BACKEND_URL in frontend build is baked-in as https://beta.mygenie.online


## Implemented — 2026-09-08 (Session 10)
- **CR-238 Suspense-flash on direct load of lazy routes — FIXED (Option C, both parts).**
  - New `src/lib/lazyRoute.js` (lazy + `.preload()`, sync render once loaded, useState-pinned Impl).
  - New `src/routes.js` (single `ROUTES` table + `preloadRoute(pathname)` via `matchPath` + `REDIRECTS`).
  - `src/App.js` maps `ROUTES`; `/`, REDIRECTS and `*` unchanged. `src/index.js` awaits `preloadRoute()` (3 s race) before `createRoot().render()`; records `window.__pageChunks`.
  - `scripts/prerender.js` injects `<link rel="preload" as="script">` for page chunks (none on `/`, CmsAdminLayer excluded).
  - Verified: MutationObserver trace shows 0 fallback frames on all direct loads; testing_agent iteration_2 all pass (33 routes, redirects, legal docs, preload hrefs 200, client-side nav, mobile).
  - Known/accepted: redirect-only URLs (`/solutions/bars-and-pubs`) still show a ~6 ms empty frame while `<Navigate>` fires (pre-existing; nginx 301s these in prod).

## Backlog
### P0/P1 — Pending batch (next session)
- **GTM dashboard batch (CR-216 + CR-220 A+C + CR-221/222)** — PLANNED, NOT EXECUTED. Owner action in GTM container `GTM-K5D84Z3L`. 7 steps in `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md`. Code prerequisite (CR-220 Fix B, `user_data` in dataLayer) already shipped.
- **CR-200** — Deploy production build. `www.mygenie.online` is still on an older hash; Sessions 9–10 work is live only on pod/beta. Owner action.

### P2 — Dev
- CR-236 Step A: add `data-testid="product-hero-image"` to ProductPage hero `<img>` (1 line + rebuild).
- CR-236 Step B: `srcSet`/`sizes` — blocked on `feature1-5-mobile.webp` assets from design.
- CR-52: server-observable browser pixel heartbeat (needs plan).

### Blocked — owner
- CR-146: Cloudflare `X-Robots-Tag: noindex` on beta subdomain.
- CR-88: individual blog author names (content decision).
- CR-48: approve attribution backfill script run.

## Handover
Latest: `/app/memory/HANDOVER_2026-09-08_Session10.md`
Current pod build: `main.68115448.js`

## Session 12 Implementation (2026-09-08 — Agent)
- **CR-259 DONE**: Extracted `QuickDemoSheet` → shared `DemoBottomSheet.jsx` (sector prop). Wired to all 15 pages. Navbar CTA now opens bottom sheet on every page — "leaves page" bug fixed on SectorPage + ProductPage.
- **CR-260 DONE**: Added `sector` prop to 6 embedded DemoForms (solutions, product-index, ai, about, contact, product). All leads now arrive in Freshsales with correct `source_page`.
- **CR-261 DONE (auto-closed)**: Center modal block removed from all 5 Google Ads LPs; replaced by DemoBottomSheet.
- **CR-243 DONE (register was stale)**: Section already existed in code + prerendered build.
- Build: `yarn build` + prerender completed. Frontend serving updated static build.

## QA Run 1 — CR-259/260/261/220B (2026-09-08 — Agent)
- All 11 tests PASSED via testing_agent (iteration_4.json)
- CR-259: DemoBottomSheet opens from Navbar, hero CTAs, StickyMobileCta on all tested pages ✅
- CR-261: pos-demo-modal-overlay confirmed removed; single form in DOM ✅
- CR-220B: dataLayer user_data (email_address, phone_number, address.first_name) confirmed ✅
- CR-260: sector attribution confirmed (outlet_type + source_page populated correctly)
- Post-QA fix: SectorPage DemoForm `sector={s.name}` → `sector={s.slug}` (capitalization consistency)

## QA Run 2 — Content & Copy (2026-09-08 — Agent)
- 16/17 passed via testing_agent (iteration_5.json)
- CR-239 PASS: ₹799/outlet/month present, ₹4,000/year gone on /qsr-pos-system
- CR-240 PASS: 75 cities on 3 key pages
- CR-241 PASS: 24hr go-live present, no 48hr
- CR-242 PASS: 'take orders' / 'ordering app' on /product/sell-serve
- CR-243 PASS: mgmt-lp-ordering section present
- CR-244 PASS: Swiggy/Zomato badges + fast food copy on /qsr-pos-system
- CR-245 PASS: 1.5 lakh restaurants on /petpooja-alternative
- CR-246 PASS: footnote present below comparison table
- CR-255 PASS: WORKS WITH badges, free migration text, testimonials on all 3 LPs tested
- CR-258 PASS: H1 in first fold, no See Pricing in hero on all pages
- WhatsApp FAB FAIL → FIXED: Added REACT_APP_WHATSAPP_ENABLED=false to frontend/.env, rebuilt
- Post-fix screenshot + DOM check confirmed FAB removed

## QA Run 3+4 — Visual/Performance (2026-09-08 — Agent)
- 12/13 checks passed via testing_agent (iteration_6.json)
- CR-255 PASS: WORKS WITH badges, free migration, testimonials on /cloud-kitchen-pos and /qsr-pos-system ✅
- Mobile navbar PASS: Book Free Demo button visible at 375px on /, /solutions/restaurants, /restaurant-pos-system ✅
- CR-233 PASS: preload links confirmed on all 5 LPs (imagesrcset attribute) ✅
- CR-236 Step A PASS: preload link on all 6 real product pages confirmed (/product/sell-serve, run-property, customers, protect-profit, see-everything, central-inventory) ✅
- WhatsApp FAB PASS: confirmed removed (REACT_APP_WHATSAPP_ENABLED=false) ✅
- /product/billing FAIL → N/A: Agent tested non-existent route. Not a real page (no slug in products.js, redirects to /). Closed as false alarm.

## Session 13 — GTM Enhanced Conversions (2026-09-09 — Agent)

### CR-264 CLOSED
- Owner confirmed GTM-K5D84Z3L IS live on `www.mygenie.online` via HTML source inspection.
- Consent mode, host guard, interaction-first defer all confirmed present.

### CR-220 FULLY DONE — Enhanced Conversions all 3 fixes complete
- **Fix B** (code, done prev session): `user_data: { email_address, phone_number, address }` in `buildLeadPayload()` ✅
- **GTM Variable created**: `user_data` (User-Provided Data, Manual configuration): Email→{{email}}, Phone→{{phone}}, First Name→{{DLV First Name}}, Last Name→{{DLV Last Name}}, Country→Constant-IN, Postal Code→DLV-Postal Code
- **Fix A** (GTM): `user_data` added as event parameter to "GA4 - Book demo" tag
- **Step B** (GTM): Tag 85 "Google Analytics - GA4" → Shared event settings → `user_data: {{user_data}}`
- **Step C** (GTM): Tag 100 "Google Tag AW-16740091756" → Shared event settings → `user_data: {{user_data}}`
- **Step D**: Published as GTM Version "Step A-D" — live on production
- **Full tag registry created**: `/app/memory/GTM_TAG_REGISTRY.md` — all 13 tags documented
- **Monitor**: Google Ads console → Last ping date updates within 2h of next conversion; "Needs attention" clears in 24-72h

### Open GTM CRs Remaining
- **CR-216**: Verify Tag 85+100 truly share one gtag.js library (open — GTM owner check)
- **CR-221/222**: ✅ CLOSED 2026-09-09 — Incognito test confirmed remarketing pixel (16740091756) returns 200. Root cause was ad blocker in test browser. No code/GTM change needed.
- **Handover written**: `/app/memory/HANDOVER_GTM_TRACKING_2026-09-09.md`
