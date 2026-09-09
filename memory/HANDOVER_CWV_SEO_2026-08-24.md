# HANDOVER — CWV + SEO + Performance Optimisation Workstream
## From: E1 (session ending 2026-08-24)
## To: Next agent

**Repo:** `https://github.com/Abhi-mygenie/website.git` · Branch: `main`
**Preview URL:** `https://frontend-deploy-live.preview.emergentagent.com`
**Production URL:** `https://beta.mygenie.online` (behind Cloudflare)
**Emergent Environment ID:** `frontend-deploy-live`

---

## 1. CRITICAL — Read First

### Serving mode
The frontend is running in **static-server mode** (NOT `yarn start`):
```
Supervisor: command=/usr/bin/node /app/frontend/scripts/static-server.js
```
`static-server.js` serves the prerendered `build/` directory.
**No hot reload.** After ANY source change you MUST:
```bash
cd /app/frontend && yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

### ⚠️ IMPORTANT: Build NOT prerendered as of handover

The `build/` directory exists (`yarn build` was run) but `node scripts/prerender.js` was NOT re-run after the final rebuild. The static server is currently serving the **CRA shell** (empty `<div id="root">`), not prerendered content.

**The next agent's first action after implementing CR-130 must be to run prerender.**

Verification (run BEFORE touching anything):
```bash
python3 -c "
html = open('/app/frontend/build/index.html').read()
print('Prerendered:', 'boosts profit by up to' in html)
"
# If False → must run: cd /app/frontend && node scripts/prerender.js
```

---

## 2. What Was Done This Session

### Deployment
- Cloned `https://github.com/Abhi-mygenie/website.git` (main branch) into `/app`
- Synced frontend + backend, installed dependencies
- Fixed `REACT_APP_CALENDLY_URL` from PLACEHOLDER → real URL

### CRs Implemented (all tested and verified)

| CR | Title | Files | Lines | Test |
|---|---|---|---|---|
| **CR-50** | Calendly overlay CSS + `initPopupWidget` fix | pre-existing | pre-existing | iteration_1.json ✅ |
| **CR-124** | `hydrateRoot` + `createRoot` fallback for empty root | `index.js` | 12 | iteration_2.json ✅ |
| **CR-125** | CMS fetch conditional (blog + admin only) | `CmsProvider.jsx` | 15 | iteration_2.json ✅ |
| **CR-116** | Gzip in `static-server.js` | `static-server.js` | 8 | iteration_4.json ✅ |
| **CR-128** | Logo SVG: `width={156}→{61}`, `height={82}→{32}` | `Logo.jsx` | 2 | iteration_5.json ✅ |
| **CR-129** | Cache headers in `static-server.js` | `static-server.js` | 12 | iteration_5.json ✅ |
| **CR-132** | StickyMobileCta: `transition-all+bottom` → `transition-transform+translateY` | `StickyMobileCta.jsx` | 2 | iteration_5.json ✅ |
| **CR-131** | Tailwind: exclude unused shadcn/ui (CSS 94.8 KB → 71.5 KB, −23.3 KB) | `tailwind.config.js` | 1 | iteration_6.json ✅ |

### New CRs Registered
- **Batch F**: CR-124, CR-125, CR-126, CR-127 (production CWV gaps)
- **Batch G**: CR-128, CR-129, CR-130, CR-131, CR-132 (Lighthouse 90–95 gap closers)

---

## 3. Current State

### Lighthouse scores (from preview URL, Batch G partial)
Measured after CR-116/128/129/131/132 but BEFORE CR-130:
- Performance: **84** (up from 50 at session start)
- LCP: 2.2s ✅
- TBT: 490ms ❌ (target ~400ms)
- CLS: 0.003 ✅
- Speed Index: 3.0s ✅

### On beta.mygenie.online (production, Cloudflare CDN)
- Cloudflare adds ~3–4 pts (lower TTFB)
- Expected after all Batch G: **~88–92**

### Source files changed this session (ALL correct in `/app/frontend/src/`)

```
src/index.js                              → hydrateRoot + createRoot fallback
src/lib/cms/CmsProvider.jsx               → conditional CMS fetch, localStorage to useEffect
src/components/site/DemoForm.jsx          → isMobile safe default (false)
src/components/site/Logo.jsx              → width=61, height=32
src/components/home/StickyMobileCta.jsx   → transition-transform, -translate-y-12
scripts/static-server.js                  → gzip + cache headers
tailwind.config.js                        → !./src/components/ui/** exclusion
```

---

## 4. Next Task — CR-130 (READY TO IMPLEMENT)

**Impact analysis and line-by-line plan are complete. Just implement.**

### File: `src/App.js`

**Change 1 — Line 25** (1 word change):
```js
// BEFORE
import CmsAdminLayer from "@/components/cms/CmsAdminLayer";

// AFTER
const CmsAdminLayer = lazy(() => import("@/components/cms/CmsAdminLayer"));
```

**Change 2 — Line 100** (wrap in Suspense):
```jsx
// BEFORE
<CmsAdminLayer />

// AFTER
<Suspense fallback={null}><CmsAdminLayer /></Suspense>
```

`lazy` and `Suspense` are already imported on line 2. **Zero new imports.**

### After implementing CR-130:
```bash
cd /app/frontend && yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

### Expected result after CR-130 + rebuild:
- Main bundle: ~967 KB → ~950 KB (−14–18 KB)
- A new CmsAdminLayer chunk appears in `build/static/js/`
- TBT: ~460–475ms (from 490ms)
- Admin login modal still works (appears ~200ms after page load instead of immediately — acceptable)

---

## 5. Priority Queue After CR-130

### P1 — Next recommended: CR-127 (WebP for data files)

**File**: `src/data/products.js` (5 lines) + `src/data/stories.js` (11 lines)

Currently: `image: "/brand/feature1.png"` (167 KB each)
After: `image: "/brand/feature1.webp"` (17 KB each)

WebP files already exist on disk for features. Some story images need conversion (run `cwebp`).

Fixes Lighthouse: "Serve images in next-gen formats — Est savings of 170 KiB" → +3–5 pts

### P2 — Attribution fixes (from HANDOVER_NEXT_AGENT.md)

Two remaining attribution fixes from the previous session's Batch C (the user's "one at a time" cadence):

**Fix G5** — UTM + ad params in dataLayer payload
**File**: `frontend/src/lib/gtm.js` `buildLeadPayload` function (~L200-215)
Add 8 fields: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `ad_id`, `adset_id`
(Full spec in `/app/memory/HANDOVER_NEXT_AGENT.md` Fix #6)

**Fix G6** — Format `fbc` as `fb.1.<unix_ms>.<fbclid>`
**File**: `frontend/src/lib/attribution.js`
(Full spec in `/app/memory/HANDOVER_NEXT_AGENT.md` Fix #7)

### P3 — Hero banner on beta still has CMS PNG

The beta.mygenie.online CMS still has `home.hero.banner_image` pointing to the old slow PNG.
Go to CMS editor on beta → set hero image to `/brand/banner.webp` → Publish → rebuild.
Until done, LCP on beta is still ~4.3s.

### P4 — CR-82 (img width/height)

`ProofSection.jsx`, `TrustBand.jsx`, `SuccessStories.jsx`, `Blog.jsx`, `BlogPost.jsx` — add explicit `width` and `height` HTML attributes. Fixes remaining CLS contributions (+1 pt).

---

## 6. Key Files Reference

### Prerender pipeline
```
scripts/prerender.js     — visits all 53 routes, injects hero preload, cleans snapshot
scripts/static-server.js — serves build/ with gzip + cache headers
```

### Structural gate check (run after every prerender)
```bash
python3 << 'PYEOF'
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)
g = {
  "hero text present":    'boosts profit by up to' in html,
  "canonical == 1":       len(re.findall(r'<link[^>]*canonical[^>]*>', html)) == 1,
  "image preload == 1":   len([l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]) == 1,
  "font preloads == 3":   len([l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]) == 3,
  "no googleapis":        'googleapis' not in html,
  "noscript in head == 0": len(re.findall(r'<noscript>', head)) == 0,
  "root has content":     'boosts profit' in html,
}
for k, v in g.items(): print(f"{'PASS' if v else 'FAIL'} {k}")
PYEOF
```

### Environment
```
frontend/.env:
  REACT_APP_BACKEND_URL=https://frontend-deploy-live.preview.emergentagent.com
  REACT_APP_SITE_URL=https://www.mygenie.online
  REACT_APP_CALENDLY_URL=https://calendly.com/mygenie-abhishek/mygenie-demo
  REACT_APP_WHATSAPP_ENABLED=false

backend/.env:
  MONGO_URL="mongodb://localhost:27017"
  DB_NAME="test_database"
  CMS_USER_1=admin / CMS_PASS_1=changeme
  All FRESHSALES_*, META_*, RAZORPAY_* = PLACEHOLDER
```

### CMS admin credentials
```
URL:      https://frontend-deploy-live.preview.emergentagent.com/leads
Username: admin
Password: changeme
```

---

## 7. Architecture (Current)

```
Browser
  → Nginx/Cloudflare (port 443)
  → static-server.js (port 3000) — gzip + cache headers
  → build/{route}/index.html (prerendered HTML)
     → hydrateRoot attaches React to prerendered DOM
     → CMS fetch only on /blog/* or admin token
     → Lazy chunks load for: 8 below-fold sections, all route pages, CmsAdminLayer
```

**Key architectural decisions made this session:**
- `hydrateRoot` (not `createRoot`) — prevents sections collapsing during hydration, CLS fixed
- CMS fetch conditional — removes 31-component re-render from TBT on non-blog pages
- `static-server.js` serves prerendered `build/` — DO NOT switch to `yarn start`

---

## 8. Test Reports This Session

```
iteration_1.json — CR-50 Calendly (7/7 PASS)
iteration_2.json — CR-124/125 hydrateRoot + CMS fetch (7/7 PASS)
iteration_3.json — full static-server mode (7/7 PASS)
iteration_4.json — gzip verification (100% PASS)
iteration_5.json — CR-128/129/132 batch (100% PASS)
iteration_6.json — CR-131 CSS exclusion (6/6 PASS)
```

---

## 9. Do NOT Do

- Do NOT switch supervisor back to `yarn start`
- Do NOT implement G2/G7/G8 (user explicitly skipped — see HANDOVER_NEXT_AGENT.md)
- Do NOT implement CR-53 (backend Meta CAPI) — user said NO
- Do NOT add new env vars without asking the user first
- Do NOT skip `node scripts/prerender.js` after `yarn build`

---

*Handover written 2026-08-24. All Batch G CRs except CR-130 are complete. CR-130 implementation plan is written and ready — 2 lines in App.js.*
