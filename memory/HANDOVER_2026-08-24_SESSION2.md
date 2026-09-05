# HANDOVER — SEO + CWV + Crawlability Workstream
## From: E1 (session ending 2026-08-24)
## To: Next agent

**Repo:** `https://github.com/Abhi-mygenie/website.git` · Branch: `main`
**Preview URL:** `https://react-app-preview-10.preview.emergentagent.com`
**Production URL:** `https://beta.mygenie.online` (behind Cloudflare)
**Environment ID:** `react-app-preview-10`

---

## ⚠️ CRITICAL — Read First

### Pod restart wipes `build/` — must rebuild after any restart

`/app/frontend/build/` is created by `yarn build` but does NOT survive pod restarts reliably. After any pod restart, the static-server crashes with `ENOENT: build/index.html`.

**Immediate check on session start:**
```bash
ls /app/frontend/build/index.html 2>/dev/null && echo "BUILD OK" || echo "NEED REBUILD"
```

**If rebuild needed (~5 min):**
```bash
cd /app/frontend && yarn build
node scripts/prerender.js
sudo supervisorctl restart frontend
```

### Serving mode
Frontend is in **static-server mode** (NOT `yarn start`):
```
Supervisor command: yarn start → maps to: node scripts/static-server.js
(package.json "start": "node scripts/static-server.js")
```
No hot reload. After ANY source change you MUST run:
```bash
cd /app/frontend && yarn build && node scripts/prerender.js && sudo supervisorctl restart frontend
```

### Prerender pipeline
- `scripts/prerender.js` visits all sitemap routes + extra routes
- Produces 56 `build/*/index.html` files
- Route count: 53 sitemap + `/demo` + `/payment-success` + `/404` = **56 total**

---

## 1. What Was Done This Session (Complete)

### Deployment
- Cloned `https://github.com/Abhi-mygenie/website.git` (main) into `/app`
- Set up backend `.env` with all production credentials
- Installed missing npm packages: `xlsx`, `react-markdown`, `remark-gfm`, `react-helmet-async`
- Installed missing Python packages: `apscheduler`, `razorpay`, `reportlab`, `svglib`, `google-ads`
- Switched frontend from `craco start` (dev) to `node scripts/static-server.js` (static)
- Full build + 53-route prerender done

### CRs Implemented This Session

| CR | Title | Status |
|----|-------|--------|
| CR-91 | BreadcrumbList schema on SectorPage, Blog, BlogPost, Pricing | ✅ |
| CR-106 | FAQPage deprecated → QAPage on 4 pages | ✅ |
| CR-123 | Markdown img fallback width/height | ✅ |
| CR-133 | **Prerender head tag poisoning** — all 56 pages now have unique title/canonical/description | ✅ |
| CR-134 | /demo + /payment-success prerendered | ✅ |
| CR-135 | DemoLanding `canonical` prop → `path` | ✅ |
| CR-136 | ORG_JSONLD added to /about | ✅ |
| CR-137 | SoftwareApplication schema on /petpooja-alternative | ✅ |
| CR-139 | StickyMobileCta race condition — CTA no longer covered by consent banner | ✅ |
| CR-92  | Touch targets: hamburger 40→44px, cookie buttons 26→42px | ✅ |
| CR-140 | 404 pages now serve NotFound HTML (not homepage HTML) | ✅ |
| CR-141 | 6 sector template headings fixed ("qsr / fast food" → "QSR and fast food restaurants") | ✅ |
| static-server routing | All prerendered routes serve correctly; SPA fallback returns HTTP 404 | ✅ |

### Technical fixes discovered and resolved
1. **react-helmet-async 3.0 timing** — prerender.js now waits for `og:title count > 1` before snapshot + syncs `<title>` from last og:title + deduplicates all duplicate head tags
2. **static-server directory routing** — was serving homepage for ALL routes; fixed by checking `dirIndex = path.join(file, 'index.html')` when path is directory
3. **static-server 404 content** — now serves `build/404/index.html` for unknown routes

---

## 2. Current State

### Lighthouse scores
- Measured after Batch G + all Wave 1/Wave 2 fixes
- Preview URL: ~84 pts (no CDN)
- beta.mygenie.online (Cloudflare CDN): estimated **~88–92** pts
- Main remaining gap: CR-127 (PNG→WebP, +3–5 pts)

### Crawlability audit status
- **Technical SEO score: 84** (up from 46)
- **GEO score: 68** (up from 28)
- **Visual score: ~45** (was 78 before StickyMobileCta issue appeared; CR-139 fix is deployed but awaiting external audit re-check)
- All 56 pages: unique title, canonical, description ✅
- Schema: Organization, SoftwareApplication (home+pricing+petpooja), QAPage+BreadcrumbList (sector+product+blog pages), BlogPosting (blog posts), Organization (about) ✅
- Soft 404s: HTTP 404 status + NotFound content ✅
- Prerendered body content: all correct per-route ✅

### Known audit items still pending external re-check
The audit at end of session was done against a **stale build** (pod had restarted and wiped `build/`). The fix was redeployed. Awaiting external auditor to re-run on live URL.

---

## 3. Open CRs — Priority Queue

### P0 — Implement immediately
*(None remaining — CR-133 the P0 prerender fix is done)*

### P1 — High impact, code-ready
| CR | Title | Effort | Notes |
|----|-------|--------|-------|
| **CR-88** | Blog author attribution (21 posts) | 30 min | Use `"MyGenie Editorial Team"` default; no owner input needed. Code: add `author` field to `blogPosts.json` + update `BlogPost.jsx` JSON-LD |
| **CR-127** | `products.js` + `stories.js` PNG → WebP (170 KiB savings) | 15 min | +3–5 Lighthouse pts. WebP files already exist on disk. Just change `.png` → `.webp` in data files |
| **CR-130** | Lazy-load CmsAdminLayer (~17–21 KB bundle reduction) | 5 min | Already planned, 2 lines in `App.js`. See `CR-130_LazyLoad_CmsAdminLayer_UnusedJS.md` |

### P2 — Medium impact
| CR | Title | Notes |
|----|-------|-------|
| **CR-142** | /petpooja-alternative zero internal links | Owner decision on link placement needed |
| **CR-89** | /customers Review + AggregateRating schema | Owner must supply reviewer names first |
| **CR-99** | Expand thin product/sector pages | Content work |

### P3 — Blocked on owner content
| CR | Blocked on |
|----|-----------|
| CR-88 (individual names) | Owner to supply real author names |
| CR-89 | Owner to supply reviewer names + ratings |
| CR-85, CR-86 | New landing pages — need copy approval |
| CR-102 | Blog publishing — owner to write posts |

---

## 4. Architecture (Current)

```
Browser
  → Nginx/Cloudflare (port 443)
  → static-server.js (port 3000) — gzip + cache headers
  → build/{route}/index.html (prerendered HTML for 56 routes)
     → hydrateRoot attaches React to prerendered DOM
     → CMS fetch only on /blog/* or admin token
     → Lazy chunks load for: all route pages, below-fold home sections, CmsAdminLayer
```

### Key files
```
scripts/prerender.js        — visits 56 routes, syncs <head> tags, writes static HTML
scripts/static-server.js    — serves build/ with gzip + cache headers + proper 404 routing
src/index.js                — hydrateRoot + createRoot fallback (CR-124)
src/lib/cms/CmsProvider.jsx — conditional CMS fetch (CR-125)
src/components/home/StickyMobileCta.jsx — fixed race condition (CR-139)
src/data/sectors.js         — has nameLower fields on 6 sectors (CR-141)
```

### Environment
```
frontend/.env:
  REACT_APP_BACKEND_URL=https://react-app-preview-10.preview.emergentagent.com
  WDS_SOCKET_PORT=443
  ENABLE_HEALTH_CHECK=false

backend/.env: (all production keys set — see file)
  MONGO_URL=mongodb://appuser:i6FB0atA40qw@52.66.232.149:27017/mygenie?authSource=admin
  DB_NAME=test_database
  STORAGE_BACKEND=local
  CMS_USER_1=admin / CMS_PASS_1=admin123
  CMS_USER_2=editor / CMS_PASS_2=editor123
  EMERGENT_LLM_KEY=sk-emergent-b46Be54C869A5D1D83
  (Freshsales, Razorpay, Meta Ads, Google Ads commented out — not active)
```

### CMS credentials
```
URL:      https://react-app-preview-10.preview.emergentagent.com/leads
Username: admin
Password: admin123
```

---

## 5. Structural Gate Check (run after every prerender)

```bash
python3 << 'PYEOF'
import re, json
from pathlib import Path
build = Path("/app/frontend/build")

# Gate 1: head tags unique
SHELL_TITLE = "POS System for Restaurants &amp; Cafes | Best Billing Software - MyGenie"
errors = []
for f in build.rglob("index.html"):
    route = str(f.relative_to(build).parent); route = "/" if route=="." else "/"+route
    html = f.read_text(errors="ignore")
    t = (re.search(r'<title>(.*?)</title>',html) or type('',(),{'group':lambda s,x:''})()).group(1)
    c = (re.search(r'<link rel="canonical" href="([^"]*)"',html) or type('',(),{'group':lambda s,x:''})()).group(1)
    if t==SHELL_TITLE and route!="/": errors.append(f"BAD_TITLE:{route}")
    if c=="https://www.mygenie.online/" and route not in ("/","/404"): errors.append(f"BAD_CANON:{route}")
total = sum(1 for _ in build.rglob("index.html"))
[print(e) for e in errors[:5]]
print(f"{'PASS' if not errors else 'FAIL'} — {total} pages, {len(errors)} issues")
PYEOF
```

Expected: `PASS — 56 pages, 0 issues`

---

## 6. Next Session Recommended Actions

1. **Verify audit re-run passes** — the external audit was done against a stale build. Run against the live URL now and confirm CR-92 (touch targets), CR-139 (sticky CTA), CR-141 (sector headings) show as fixed.

2. **Implement CR-127** (PNG→WebP) — highest Lighthouse score gain remaining. 2-line change in `products.js` and `stories.js`. Build + prerender required.

3. **Implement CR-88** (blog authors) — use `"MyGenie Editorial Team"` default. Improves E-E-A-T immediately.

4. **Implement CR-130** (lazy CmsAdminLayer) — 2 lines, removes 17KB from initial bundle, TBT improvement.

5. **Promote to production** — the preview is fully functional. To push to `beta.mygenie.online`:
   - Update `REACT_APP_BACKEND_URL` to `https://beta.mygenie.online` in `frontend/.env`
   - Run `yarn build && node scripts/prerender.js`
   - Deploy to production server

---

## 7. Do NOT Do

- **Do NOT switch supervisor back to `craco start`** — must stay on `node scripts/static-server.js`
- **Do NOT skip `node scripts/prerender.js` after `yarn build`** — the static server serves prerendered files; without prerender, all pages serve the homepage HTML
- **Do NOT add new env vars without checking backend/.env** — many keys are already set
- **Do NOT implement CR-53 (backend Meta CAPI)** — user explicitly said NO previously
- **Do NOT skip rebuild check at session start** — pod restarts wipe `build/`

---

## 8. Test Reports This Session

```
iteration_1.json — CR-139 StickyMobileCta race condition (8/8 PASS)
iteration_2.json — Wave 2: CR-92, CR-137, CR-140, CR-141 (12/12 PASS)
```

---

*Handover written 2026-08-24. All Waves 1+2 CRs complete. Next priority: CR-127 WebP (quickest Lighthouse gain), CR-88 blog authors, CR-130 CmsAdminLayer lazy load.*
