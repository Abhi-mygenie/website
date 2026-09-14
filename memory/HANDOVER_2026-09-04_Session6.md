# Agent Handover — 2026-09-04 (Session 6)
**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Dev Preview URL:** https://react-frontend-live.preview.emergentagent.com
**Production:** https://www.mygenie.online / https://beta.mygenie.online
**Current Build (pod):** main.1273e3d6.js ✅ (CR-207 build — CLEAN)

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| frontend (static-server.js) | RUNNING | 3000 |
| backend (uvicorn) | RUNNING | 8001 |
| MongoDB | remote 52.66.232.149 | — |

**Pod build:** main.1273e3d6.js (built with `REACT_APP_BACKEND_URL=https://beta.mygenie.online`)
**Prerendered routes:** 63
**Production build:** main.690a6fee.js (different — production served its own build)

---

## 2. What Was Done This Session

### 2A — Re-sync & Env Setup
- `git fetch origin main` + `git checkout origin/main -- .` to pull latest repo
- Wrote all 50+ env vars to `/app/backend/.env` (remote MongoDB, SMS, Freshsales, GST, CMS, Calendly, etc.)
- Updated `REACT_APP_BACKEND_URL=https://beta.mygenie.online` in frontend `.env`
- Installed missing Python deps: `razorpay`, `apscheduler`
- Both services RUNNING

### 2B — Production Audit
- Confirmed production was serving prerendered content ✅
- Found: every route had a **301 trailing-slash redirect** (nginx `try_files` issue)
- Built production zip `mygenie-prod-build.zip` at `/app/mygenie-prod-build.zip` (13 MB)
  - Also at `https://react-frontend-live.preview.emergentagent.com/mygenie-prod-build.zip` for download
  - Built with `REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L`
- Production nginx fix needed: `try_files $uri $uri/index.html /index.html`

### 2C — Lighthouse Audit & Analysis
Ran PageSpeed on all three environments (India mobile):

| Environment | Performance | LCP | TBT | Notes |
|---|---|---|---|---|
| Preview pod | 76 | 2.2s | 852ms | Fast TTFB, no GTM |
| beta.mygenie.online | 62 | — | — | Cloudflare origin, no GTM |
| www.mygenie.online | 51 | 5.1s | 2.9s | GTM fires, CF beacon |

**Why they differ:**
- Preview fast: direct Kubernetes pod (TTFB 0.3s), no GTM (host guard)
- www slow: TTFB 1.1s + GTM fires (GA4 + Ads + Remarketing = +2.1s TBT) + Cloudflare RUM beacon (+2s critical path)
- Beta middle: same TTFB as www, but GTM doesn't fire (not in host guard whitelist)

### 2D — Diagnosed Production Performance Issues
9 Lighthouse diagnostics analysed:
1. JS execution 4.1s → GTM scripts (2.1s) + app (2.0s)
2. Main-thread work 6.0s → same
3. LCP 5,160ms → TTFB + GTM blocking
4. Third-party code blocked 1,640ms → CF beacon + GTM tags
5. Unused JS 341 KB → mostly Google's own scripts (GA4, Ads)
6. Cache policy 40 resources → production server not setting headers
7. Legacy JS 23 KB → browserslist too broad
8. Unused CSS 10 KB → Tailwind
9. DOM size 1,079 elements

### 2E — Batch AD: Performance Code Fixes

#### CR-206: browserslist Modern Targets ✅ DONE
- Changed `">0.2%, not dead, not op_mini all"` → 5 modern targets
- Build: main.b6403ff7 → main.dde43c90
- **Score: 76 → 84 (+8 points)**
- TBT: 852ms → 80ms (likely includes some Lighthouse variance)
- Best Practices: 82 → 100
- Bundle: 958 KB → 937 KB (−21 KB)

#### CR-207: iconMap — Remove lucide-react wildcard import ✅ DONE
**Root cause found:** `import * as Icons from "lucide-react"` in **15 files** bundled all 3,624 icons.

Fix: Created `src/lib/iconMap.js` (68 named icons) → all 15 files now import `{ ICONS }` from there.

- Build: main.dde43c90 → main.1273e3d6 (**current**)
- **Main bundle: 937 KB → 402 KB (−535 KB, −57%)**
- lucide sources in main: 3,624 → 85
- Google PSI was throttled during measurement — live score pending
- Expected score improvement: +5–8 points (84 → ~89–92)

#### CR-208: Homepage Suspense Split — PLAN WRITTEN, NOT IMPLEMENTED
**Revised finding:** After CR-207, the 9 home section chunks shrank from ~100 KB each to **2–8 KB each (34 KB total = 0.17s download)**. Original premise (large chunk competition) no longer valid.

**Revised impact: +0 to +1 point.** Downgraded from P1 to P2.
Plan recommends **Option A only** (split 1 Suspense into 2 — 1 edit, no new APIs).
Plan at: `/app/memory/CR-208_Line_By_Line_Plan.md`

---

## 3. Files Modified This Session

| File | Change | CR |
|---|---|---|
| `/app/backend/.env` | All production env vars written | Deploy |
| `/app/frontend/.env` | REACT_APP_BACKEND_URL=https://beta.mygenie.online | Deploy |
| `package.json` (browserslist) | Modern targets only | CR-206 |
| `src/lib/iconMap.js` | NEW FILE — 68 named icon exports | CR-207 |
| `src/components/site/Navbar.jsx` | Removed wildcard, added ICONS import | CR-207 |
| `src/components/home/ProblemGrid.jsx` | Same | CR-207 |
| `src/components/home/OutcomePillars.jsx` | Same | CR-207 |
| `src/components/home/SectorSelector.jsx` | Same | CR-207 |
| `src/components/home/AIBand.jsx` | Same | CR-207 |
| `src/components/home/ModuleOverview.jsx` | Same | CR-207 |
| `src/pages/SectorPage.jsx` | Same | CR-207 |
| `src/pages/ProductPage.jsx` | Same | CR-207 |
| `src/pages/ProductIndex.jsx` | Same | CR-207 |
| `src/pages/SolutionsIndex.jsx` | Same | CR-207 |
| `src/pages/AiPage.jsx` | Same | CR-207 |
| `src/components/pricing/AddonCard.jsx` | Same | CR-207 |
| `src/components/pricing/PlanCard.jsx` | Same | CR-207 |
| `src/components/pricing/PlanShowcase.jsx` | Same | CR-207 |
| `src/components/pricing/ComparisonTable.jsx` | Same | CR-207 |

---

## 4. Score Tracker — Batch AD

| Build | CR | Bundle | Preview Score | Action |
|---|---|---|---|---|
| main.b6403ff7 | Baseline | 958 KB | 76 | Starting point this session |
| main.dde43c90 | CR-206 browserslist | 937 KB | **84** (+8) | ✅ Done |
| main.1273e3d6 | CR-207 iconMap | **402 KB** | **TBD (PSI throttled)** | ✅ Done |
| next build | CR-208 Suspense split | ~402 KB | **+0–1 expected** | 🔲 Plan ready |

**Production baseline:** 51 (www.mygenie.online, with GTM, Cloudflare)
**Production ceiling with code fixes:** ~76 (GTM will always cost ~9–10 points)

---

## 5. Open Items — Priority Order

### P0 — Owner Action (no code needed)
| Item | What | Where |
|---|---|---|
| nginx trailing-slash fix | `try_files $uri $uri/index.html /index.html` | Production nginx config |
| Deploy new production build | `/app/mygenie-prod-build.zip` already built | Copy to www.mygenie.online |
| Disable Cloudflare RUM beacon (CR-186) | Single toggle in Cloudflare → Analytics & Logs → Web Analytics | Dashboard |
| Add Cloudflare cache rule for `/static/*` | `max-age=31536000, immutable` | Dashboard |

### P1 — Next Agent (code, quick wins)
| CR | What | File | Effort |
|---|---|---|---|
| CR-208 | Implement Suspense split (plan ready) | `Home.jsx` — 1 edit | 5 min |
| CR-126 | Lock prerender in `package.json` build script | `package.json` | 1 line |
| CR-146 | beta.mygenie.online `robots.txt Disallow` | `public/robots.txt` | 1 line |
| CR-196 | `/demo` H1 font-extrabold → font-bold (NO_LCP fix) | `DemoLanding.jsx:94` | 1 word |

### P1 — Blocked on Owner Data
| CR | What's needed |
|---|---|
| CR-172 | AggregateRating — provide Google Business / G2 review count |
| CR-88 | Blog author names |
| CR-89 | Testimonials Review schema — individual reviewer names |

### P2 — Performance (next batch, lower priority now)
| CR | What | Revised Priority |
|---|---|---|
| CR-208 | Homepage Suspense split | P2 (was P1 — chunks tiny after CR-207) |
| DOM size 1,079 | Lazy-render below-fold sections | P3 |

---

## 6. Technical Architecture — Key Rules

### Build Pipeline
```bash
# Dev/beta build (this pod)
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build

# Production build (for www.mygenie.online)
cd /app/frontend && REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build

# yarn start = node scripts/static-server.js (NOT webpack dev server)
# Every code change needs yarn build + supervisorctl restart frontend
```

### iconMap.js — Maintenance Rule (NEW — CR-207)
`src/lib/iconMap.js` is the single source of truth for all icons used via dynamic lookup.
When any data file (`sectors.js`, `products.js`, `pricing.js`, `content.js`, `ai.js`) gets a new `icon:` string, add it to BOTH:
1. The `import { ... }` block in `iconMap.js`
2. The `export const ICONS = { ... }` object

The fallback (`ICONS.Box`, `ICONS.Store`, `ICONS.AlertCircle`) prevents crashes.

### GTM Architecture
- GTM `GTM-K5D84Z3L` fires ONLY on `www.mygenie.online` and `mygenie.online` (host guard in `public/index.html`)
- Preview / beta URLs: GTM script present in HTML but runtime check prevents firing
- This is why preview/beta score higher than production on TBT

### React Architecture (CR-205)
- Uses `createRoot` (NOT `hydrateRoot`) — no Suspense marker mismatch
- `LP()` helper wraps all lazy routes in `App.js`
- All pages are `lazy()` imported in `App.js`

### Known-Bad Build Hashes (React #418 present)
`107ff3e9 · 04593470 · 8fe91636 · ea6df739 · b8f96c28 · a65c8c10 · f330ce78 · af722274 · a5f22153`

### CMS Admin
`Ctrl+Shift+E` on any page → login with `admin / admin123` or `editor / editor123`

---

## 7. Production Server Fix — Action Required

Production currently returns **301 trailing-slash redirect on every sub-route**.
Root HTML is prerendered correctly, but every `/demo`, `/pricing`, etc. redirects first.

**nginx fix (one line):**
```nginx
# Change:
try_files $uri /index.html;
# To:
try_files $uri $uri/index.html /index.html;
```

This makes nginx serve `demo/index.html` for `/demo` without redirecting.

---

## 8. Production Lighthouse Scores (Measured This Session)

### www.mygenie.online — Mobile (Lab)
```
Performance:  51  (GTM + CF beacon + TTFB 1.1s)
LCP:          5.1s
TBT:          2.9s
FCP:          1.7s
CLS:          0
SEO:          92
```

### Preview pod — Mobile (Lab, after CR-207 build)
```
Performance:  84  (measured after CR-206, CR-207 PSI throttled)
Main bundle:  402 KB (CR-207, was 958 KB)
Expected:     ~89–92 (PSI throttled — measure on next session)
```

---

## 9. Documents Written This Session

| File | Content |
|---|---|
| `/app/memory/CR-206_ImpactAnalysis.md` | browserslist analysis — Babel already modern, small savings |
| `/app/memory/CR-206_Line_By_Line_Plan.md` | Exact search/replace, validation |
| `/app/memory/CR-207_ImpactAnalysis.md` | Bundle analysis, −535 KB, revised composition |
| `/app/memory/CR-207_Line_By_Line_Plan.md` | Full 39-edit plan, iconMap.js content, all 15 files |
| `/app/memory/CR-208_Homepage_Below_Fold_Defer.md` | CR registration |
| `/app/memory/CR-208_Line_By_Line_Plan.md` | Option A plan, honest revised impact (+0–1 pt) |

---

## 10. Quick Health Check Commands

```bash
# Services running?
sudo supervisorctl status

# Current build hash?
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Should be: main.1273e3d6.js

# Route count?
find /app/frontend/build -name "index.html" | wc -l
# Should be: 63

# Bundle size?
ls -lh /app/frontend/build/static/js/main.*.js | grep -v ".map"
# Should be: ~402 KB

# Wildcard imports gone?
grep -rn "import \* as Icons from" /app/frontend/src/
# Expected: no output (only iconMap.js comment line)

# Backend errors?
tail -n 20 /var/log/supervisor/backend.err.log

# Lighthouse (when PSI not throttled):
# https://pagespeed.web.dev/report?url=https://react-frontend-live.preview.emergentagent.com/
```

---

## 11. Next Agent — Suggested First Actions

1. **Check Lighthouse score** — PSI was throttled at session end. Run it first to confirm CR-207's actual score impact.
2. **Implement CR-208** — 1-line edit in `Home.jsx` (plan at `/app/memory/CR-208_Line_By_Line_Plan.md`). Low priority but quick.
3. **CR-196** — Change `font-extrabold` → `font-bold` on `/demo` H1 (`DemoLanding.jsx:94`). Fixes NO_LCP issue on demo page.
4. **CR-126** — Add `&& node scripts/prerender.js` to `package.json` build script (currently prerender is manual).
5. **Confirm production zip download** — `https://react-frontend-live.preview.emergentagent.com/mygenie-prod-build.zip` should still be accessible.

*Handover written 2026-09-04. E1 Agent. Session 6.*
*Previous handover: `/app/memory/HANDOVER_2026-09-03_Final.md`*
*Full CR register: `/app/memory/CR_INTAKE_REGISTER.md`*
