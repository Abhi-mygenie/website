# Agent Handover — 2026-09-03 (Final Session)
**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Dev Preview URL:** https://frontend-as-is-run.preview.emergentagent.com
**Production:** https://www.mygenie.online / https://beta.mygenie.online
**Current Build:** main.bfda52c2.js ✅ (clean — 100% regression pass)

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| backend | RUNNING | 8001 |
| frontend (static server) | RUNNING | 3000 |
| MongoDB | remote 52.66.232.149 | — |

**Last build:** 2026-09-03 11:10 UTC
**Prerendered routes:** 63
**Build log:** `/app/memory/build-final-regression.log`

---

## 2. What Was Done This Session

### 2A — Initial Deploy
- Synced `/app` to repo HEAD via `git reset --hard origin/main`
- Wrote all production credentials to `/app/backend/.env`
- Set `REACT_APP_BACKEND_URL=https://beta.mygenie.online` in `frontend/.env`
- `yarn install` + `yarn build` — 63 routes prerendered

### 2B — Gap Investigation & CR Registration
- Investigated production HTML: confirmed no GTM in static HTML, old non-prerendered build on production
- Registered **CR-198, CR-199, CR-200** (Batch AB — GA/GTM tracking gap)
- Wrote line-by-line implementation plan: `/app/memory/CR-198-199_Line_By_Line_Plan.md`

### 2C — Batch AB Implementation (CR-198 + CR-199)
- `REACT_APP_GTM_ID=GTM-K5D84Z3L` added to `frontend/.env`
- GTM Consent Mode v2 defaults + GTM loader moved to `public/index.html <head>` (host-gated to www.mygenie.online only)
- `initGtm()` → `setDefaultConsent()` in `App.js`
- 12/12 verification gates passed

### 2D — Regression Suite T1–T8 (First Run)
- Full regression revealed: T2 FAIL (#418), T3 FAIL (bakeries), T6 FAIL (dead routes)
- Registered **CR-201, CR-202, CR-203, CR-204** (Batch AC)
- Wrote line-by-line plan: `/app/memory/CR-201-204_Line_By_Line_Plan.md`

### 2E — Batch AC Implementation
- **CR-201**: `mountedRef` guard in `ConsentBanner.jsx` (body class timing fix)
- **CR-202**: `/solutions/bars-and-pubs → /solutions/bars-pubs 301` in `_redirects`
- **CR-203**: `/solutions/hotels → /solutions/hotels-resorts 301` in `_redirects`
- **CR-204**: `bakeries h1` updated to "Bakery POS system & billing software…"

### 2F — React #418 Root Cause Investigation (CR-205) — 9 Iterations
- Added `onRecoverableError` to `hydrateRoot` → diagnostic confirmed site-wide Suspense mismatch
- Root cause: `hydrateRoot` requires `<!--$?-->` Suspense markers that Puppeteer doesn't emit
- 3 nested sources found: CmsAdminLayer Suspense → Routes Suspense → NavDropdown Link
- **Fix:** `createRoot` replaces `hydrateRoot` in `index.js`; `LP()` helper moves Suspense inside routes; `{hydrated &&}` defers CmsAdminLayer
- T2 PASS confirmed (iteration_9)

### 2G — Final Full Regression (iterations 10–12)
- Found T5 fail (qsr h1 missing 'qsr'), T6 fail (bars-and-pubs in SPA mode)
- Fixed: `QsrPosSystem.jsx` h1 → "QSR POS system…"; `redirects.js` + bars-pubs h1 + meta desc
- **iteration_12: 100% — all 8 T-gates + all functional tests PASS**

---

## 3. Files Modified This Session (complete list)

| File | Change | CR |
|---|---|---|
| `frontend/.env` | Added `REACT_APP_GTM_ID=GTM-K5D84Z3L` | CR-198 |
| `public/index.html` | Consent Mode v2 + GTM loader in `<head>` | CR-199 |
| `src/App.js` | `initGtm→setDefaultConsent`; `LP()` helper; `hydrated` state; `{hydrated && CmsAdminLayer}` | CR-199, CR-205 |
| `src/index.js` | `hydrateRoot → createRoot` | CR-205 |
| `src/components/site/ConsentBanner.jsx` | `mountedRef` guard (body class timing) | CR-201 |
| `public/_redirects` | bars-and-pubs + hotels 301 redirects | CR-202, CR-203 |
| `src/data/sectors.js` | bakeries h1 + bars-pubs h1 + bars-pubs sub | CR-204, bonus |
| `src/data/redirects.js` | `/solutions/bars-and-pubs` + `/solutions/hotels` SPA redirects | T6 fix |
| `src/pages/QsrPosSystem.jsx` | h1 starts with "QSR POS system…" | T5 fix |
| `backend/.env` | All production credentials written | Deploy |

---

## 4. Final Regression Results — main.bfda52c2.js

```
ENV:   dev (https://frontend-as-is-run.preview.emergentagent.com)
BUILD: main.bfda52c2.js  (CLEAN — not in known-bad list)
DATE:  2026-09-03

T1  Bundle hash          PASS   bfda52c2 — clean
T2  React #418           PASS   Zero errors (createRoot)
T3  h1 keywords          PASS   7/7 incl. bars-pubs bonus
T4  Meta desc lengths    PASS   18/18 ≤160ch
T5  SEO landing pages    PASS   6/6 HTTP 200 + correct h1/title
T6  Dead routes          PASS   bars-and-pubs → bars-pubs ✓  hotels → hotels-resorts ✓
T7  Canonical tags       PASS   All → www.mygenie.online
T8  Title uniqueness     PASS   16 unique titles

FUNCTIONAL:
  SPA navigation         PASS   Pricing, Solutions dropdowns work
  Consent banner         PASS   Appears post-mount, Accept works, mg_consent set
  GTM dataLayer          PASS   window.dataLayer exists with Consent Mode defaults
  404 page               PASS   /unknown → Page Not Found (not homepage)
  Blog lazy load         PASS   LP() lazy Blog renders correctly
```

**Dev→Beta gate: CLEARED.**

---

## 5. Open P0 Items (blocks production push)

### CR-200 — Production Deploy (Owner action only)
Production `www.mygenie.online` still serves old build `main.cf3fd6a7.js` (pre-prerender).

**Build command for production:**
```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
```
Then copy `build/` to production nginx/S3 document root.

**Verify after deploy:**
```bash
curl -s https://www.mygenie.online/ | grep -c "Restaurant POS"
# Expected: 1+ (prerendered content visible in HTML)
curl -s https://www.mygenie.online/ | grep "GTM-K5D84Z3L"
# Expected: 2 occurrences (consent script + GTM loader)
```

---

## 6. Open CRs — Priority Order

### P0 — Owner Action
| CR | Action |
|---|---|
| CR-200 | Deploy `build/` to `www.mygenie.online` |
| CR-151 | Add negative keywords in Google Ads console (₹2.4L wasted, 0 conv) |
| CR-180 | Decide domain strategy: `www` vs `beta` permanent |
| CR-77 | Whitelist Googlebot in Cloudflare WAF |
| CR-78 | 301 apex→www + fix duplicate sitemap (Cloudflare DNS) |
| CR-186 | Disable Cloudflare RUM beacon (adds 2,003ms critical path) |

### P1 — Next Agent (code work)
| CR | What | File |
|---|---|---|
| CR-191 | `/demo` noindex={true} → remove | `DemoLanding.jsx:77` |
| CR-192+193 | fetchPriority + remove Reveal from 6 landing page heroes | 6 LP files |
| CR-194 | petpooja-alternative above-fold trust logos lazy→eager | `PetpoojaAlternative.jsx` |
| CR-195 | restaurant-pos-comparison stat cards remove Reveal | `RestaurantPosComparison.jsx` |
| CR-196 | /demo H1 font-extrabold → font-bold (NO_LCP fix) | `DemoLanding.jsx:94` |
| CR-126 | Lock prerender in build pipeline | `package.json` build script |
| CR-146 | beta robots.txt Disallow for Googlebot | `public/robots.txt` |
| CR-182 | Hero banner srcset (banner-mobile.webp 400px) | `Hero.jsx` |

### P1 — Blocked on Owner Data
| CR | What's needed |
|---|---|
| CR-172 | AggregateRating schema → provide Google Business / G2 / Capterra review count + rating |
| CR-88 | Blog author names → provide individual names/bios for 21 posts |
| CR-89 | Testimonials Review schema → provide individual reviewer names |

---

## 7. Technical Architecture Notes

### Build Pipeline
```bash
# Dev/preview build
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build

# Production build
cd /app/frontend && REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build

# yarn start = node scripts/static-server.js (NOT webpack dev server)
# Every code change needs a rebuild + supervisorctl restart frontend
# Build time: ~3 min (craco ~60s + Puppeteer prerender ~2 min)
```

### React #418 Resolution (CR-205)
- **Root cause:** `hydrateRoot` requires `<!--$?-->` Suspense markers; Puppeteer prerender doesn't emit them
- **Fix:** `createRoot` in `index.js` — React re-renders from scratch; prerendered HTML still serves for SEO/LCP
- **SEO preserved:** Prerendered HTML (63 routes) is still what Google/crawlers see
- **LP() pattern:** All lazy routes use `<LP>` wrapper inside `<Route element=...>` — Suspense scoped per route, not at shell level

### GTM Architecture
- GTM container `GTM-K5D84Z3L` loads in `public/index.html <head>` (host-gated: www.mygenie.online only)
- Consent Mode v2 defaults fire before GTM (correct EEA order)
- Preview/beta URLs: GTM does NOT load (host guard) — no GA4 pollution
- `pushEvent()` / `pushLead()` still work from React components via `window.dataLayer`

### Known-Bad Build Hashes (React #418 present)
`main.107ff3e9.js` · `main.04593470.js` · `main.8fe91636.js` · `main.ea6df739.js` · `main.b8f96c28.js` · `main.a65c8c10.js` · `main.f330ce78.js` · `main.af722274.js` · `main.a5f22153.js`

### CMS Admin
Ctrl+Shift+E on any page → admin login.
Credentials: `admin / admin123` · `editor / editor123`
`CMS_JWT_SECRET` is the default placeholder — change before production.

### GTM Conversion Events (SACRED — do not move)
```
Stage 1: Form submit  → pushLead("form_submitted")  → GTM: form_submitted ₹0
Stage 2: OTP verify   → pushLead("book_demo")        → GTM: thankyou_conversion ₹200  ← DO NOT MOVE
Stage 3: Calendly     → navigate("/thank-you")       → no separate GTM event
```

### Template Architecture
- Solution pages: edit `src/data/sectors.js` ONLY
- Product pages: edit `src/data/products.js` ONLY
- Home sections: `src/data/content.js` or component directly

---

## 8. Quick Health Check Commands

```bash
# Services running?
sudo supervisorctl status

# Current build hash?
ls /app/frontend/build/static/js/main.*.js

# Route count (should be 63)?
find /app/frontend/build -name "index.html" | wc -l

# Backend errors?
tail -n 30 /var/log/supervisor/backend.err.log

# T2 quick check (no #418)?
grep -c "consent-banner-open" /app/frontend/build/index.html
# Expected: 0

# GTM in head?
grep -c "GTM-K5D84Z3L" /app/frontend/build/index.html
# Expected: 2 (consent script + GTM loader)

# Bars-pubs redirect in redirects.js?
grep "bars-and-pubs\|/solutions/hotels" /app/frontend/src/data/redirects.js
# Expected: 2 entries
```

---

## 9. Regression Brief Summary (for next agent)

The regression brief (T1–T8) is documented in the problem statement. All 8 gates currently PASS on build `main.bfda52c2.js`. Run it after any future code change before promoting to beta.

Known hash history for T1 gate:
- Clean: `main.74f504ee.js`, `main.bfda52c2.js`
- #418 present: `main.107ff3e9.js`, `04593470.js`, `8fe91636.js`, `ea6df739.js`, `b8f96c28.js`, `a65c8c10.js`, `f330ce78.js`, `af722274.js`, `a5f22153.js`

---

## 10. CRM Admin Credentials

See `/app/memory/test_credentials.md`
CMS: `admin / admin123` · `editor / editor123`

---

*Handover written 2026-09-03. E1 Agent. Session closed.*
*Previous handover: `/app/memory/HANDOVER_2026-09-02_Session5.md`*
*Full CR register: `/app/memory/CR_INTAKE_REGISTER.md`*
