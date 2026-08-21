# CR-72 — Benchmarking Report: Before & Projected After
**Date:** 2026-08-20  
**Status:** BEFORE captured. AFTER is projected — will be measured on implementation.  
**Method:** Production build (`yarn build`) on current codebase.

---

## BEFORE — Current State (Measured 2026-08-20)

### Production Build Output
```
File sizes after gzip:
  582.42 kB  build/static/js/main.js   ← SINGLE FILE, everything in it
  16.44 kB   build/static/css/main.css
```

### What's in that 582 kB
All 19 pages are eagerly imported and bundled into ONE file:

| Page | Source size | Notes |
|---|---|---|
| PetpoojaAlternative | 48 KB | Largest — includes QuickDemoSheet (CR-113) |
| LeadsView | 36 KB | Internal CRM dashboard — no visitor ever uses |
| SectorPage | 16 KB | Only needed on /solutions/:slug |
| ProductPage | 16 KB | Only needed on /product/:bucket |
| Pricing | 16 KB | Only needed on /pricing |
| AiPage | 16 KB | Only needed on /ai |
| RoiCalculator | 12 KB | Only needed on /roi |
| ProductIndex | 12 KB | Only needed on /product |
| DemoLanding | 12 KB | Only needed on /demo |
| PaymentSuccess | 12 KB | Only needed on /payment-success |
| SuccessStories | 8 KB | Only needed on /customers |
| SolutionsIndex | 8 KB | — |
| Resources | 8 KB | — |
| Contact | 8 KB | — |
| BlogPost | 8 KB | — |
| Blog | 8 KB | — |
| About | 8 KB | — |
| Legal | 4 KB | Terms/privacy/refund |
| **Home** | **4 KB** | **The only one visitors need on homepage** |
| **Total pages** | **~264 KB source** | All loaded even if user visits homepage only |

### The Problem in Numbers
A visitor who clicks a Google Ad landing on the **homepage** has to download and parse:
- The 4 KB Home page they need ✅
- **+578 KB of 18 other pages they don't need** ❌

That's **99% unnecessary code** on the most important page load.

**Webpack's own warning in the build output:**
> "The bundle size is significantly larger than recommended. Consider reducing it with code splitting."

---

## PROJECTED AFTER — Code Splitting Applied

### How it works
- `Home` stays eager (always needed, entry point)
- 5 non-page components stay eager: `CmsAdminLayer`, `ConsentBanner`, `Toaster`, `ScrollDepthTracker`, `WhatsAppFab`
- 18 pages become lazy chunks — downloaded only when the user navigates to that route

### Projected Build Output
```
Main chunk (eager):   ~180–220 kB gzip  (Home + vendor + 5 non-page components)
Lazy chunks (×18):    Each 5–50 kB gzip  (downloaded on first navigation to that route)
```

### Page-by-page loading behaviour

| Route | Loads with main bundle? | Chunk loads when |
|---|---|---|
| `/` homepage | ✅ Always (eager) | — |
| `/petpooja-alternative` | ❌ Not upfront | First visit to /petpooja-alternative |
| `/solutions/*` | ❌ Not upfront | First visit to any solution |
| `/product/*` | ❌ Not upfront | First visit to any product |
| `/leads` (internal) | ❌ Not upfront | Only when CMS admin opens it |

### Projected Impact

| Metric | Before | After (projected) |
|---|---|---|
| Initial JS bundle (gzip) | **582 kB** | **~200 kB** (~65% reduction) |
| Chunks | 1 monolithic file | 1 main + 18 lazy chunks |
| Homepage TTI (Indian 4G ~5 Mbps) | ~3.5–5s | ~1.5–2.5s |
| Petpooja page load (/petpooja-alternative) | Same 582 kB | Main (~200 kB) + PetpoojaAlternative chunk (~50 kB) = ~250 kB |
| Google Ads Landing Page Experience | Below Average | Expected: Average → Above Average |

### Risk: None for users
- Returning visitors: browser caches each chunk — repeat visits are instant
- Navigation within the site: chunks preload in the background as React Router prefetches
- The 5 non-page components kept eager: `CmsAdminLayer` (must render globally), `ConsentBanner` (must show on load), `Toaster` (must be ready for form errors), `ScrollDepthTracker`, `WhatsAppFab`

---

## Measurement Plan

### How to verify AFTER
Run `yarn build` after implementation and check:
1. `build/static/js/` should have **multiple `.js` files** instead of one `main.js`
2. The largest chunk should be significantly smaller than 582 kB
3. Per-route chunks should exist (names will match hashed filenames)

### Lighthouse audit (run on production after deploy)
- Before score: Run `Lighthouse → Performance` on `https://www.mygenie.online`
- After score: Run same test after deploying the code-split build
- Key metrics to watch: **FCP** (First Contentful Paint), **TTI** (Time to Interactive), **TBT** (Total Blocking Time)

---

*Benchmark captured 2026-08-20. Build tool: CRA + craco. Measurement command: `yarn build`. No code changes were made for this measurement.*
