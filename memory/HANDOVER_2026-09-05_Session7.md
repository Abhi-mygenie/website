# Agent Handover — 2026-09-05 (Session 7)
**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: 4sep
**Preview URL:** https://react-app-direct-2.preview.emergentagent.com
**Production:** https://www.mygenie.online

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| frontend (static-server.js) | RUNNING | 3000 |
| backend (uvicorn) | RUNNING | 8001 |
| MongoDB | remote 52.66.232.149 | — |

### ⚠️ Important: Current pod build is PRODUCTION build

```
/app/frontend/build/static/js/main.f2b8b6e8.js
```

This build was compiled with `REACT_APP_BACKEND_URL=https://www.mygenie.online`.
API calls from the preview URL go to the production backend.

**Before testing anything on the preview URL, rebuild with beta URL:**
```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /tmp/build-beta.log 2>&1 &
sudo supervisorctl restart frontend
```

### Production zip (ready to deploy)
```
/app/mygenie-prod-build.zip   (12 MB)
Download: https://react-app-direct-2.preview.emergentagent.com/mygenie-prod-build.zip
```
Built with `REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L`.
Contains all CRs from this session. Ready to copy to `www.mygenie.online` web root.

---

## 2. What Was Done This Session

### 2A — Full Repo Deploy (Session start)
- Cloned `4sep` branch from `github.com/Abhi-mygenie/website.git`
- Replaced `/app/backend` + `/app/frontend` with cloned contents
- Wrote all backend env vars to `/app/backend/.env` (MONGO_URL, SMS, Freshsales, etc.)
- Preserved platform files: supervisor configs, frontend `.env`
- Installed Python deps (`pip install --use-deprecated=legacy-resolver`) + Node deps (`yarn install`)
- Built and served successfully

### 2B — Performance CRs (Batch AD continued)

| CR | What | Build |
|---|---|---|
| CR-208 | Homepage Suspense split (2 boundaries) | main.a67281e4 |
| CR-209 | GTM interaction-first defer — fires on scroll/click/3s fallback | main.a67281e4 |

### 2C — SEO + Performance batch (CRs 210–214)

All implemented together in one build (`main.1ba1a67c`):

| CR | What |
|---|---|
| CR-210 | Ice cream H1: `"Ice cream shop POS —"` → `"Ice cream shop POS system & billing software —"` |
| CR-211 | Preconnect hints for FB Pixel + Cloudflare Insights in `index.html` |
| CR-212 | Added `/solutions/bars-and-pubs` + `/solutions/hotels` to prerender extraRoutes (HTTP 200 with correct canonical, was hard 404) |
| CR-213 | Added `nameSingular` to all 11 sectors + updated `SectorPage.jsx` title formula → all 11 solution page titles now singular |
| CR-214 | Updated 12 `lastmod` dates in `sitemap.xml` (stale since CR-187/189/208) |

### 2D — TrustBand Performance (CR-215A)

| CR | What | Build |
|---|---|---|
| CR-215 Part A | Added `will-change: transform; contain: layout style` to marquee div in `TrustBand.jsx` | main.7d5ff572 |

### 2E — Production build created

Production zip built and packaged:
```bash
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
zip -r /app/mygenie-prod-build.zip build/
```
Hash: `main.f2b8b6e8.js` | Routes: 65 | Bundle: 401KB

### 2F — Audits & Investigations

1. **Preview Lighthouse audit (83)** — analysed all diagnostics. Platform overhead (`jsd/main.js` 728ms) explains gap from predicted 89-92. True code score is ~89.

2. **Production Lighthouse audit (70)** — deep analysis confirmed:
   - Production serving OLD build `main.b6403ff7.js` (958KB, pre-CR-207) ← CR-200 (owner deploy)
   - FB Pixel blocking 932ms (caused by GTM firing at parse time on old build — fixed by deploying new build with CR-209)
   - 3 separate Google scripts 524KB (CR-216)
   - 40 resources with 4h cache (CR-217)

3. **Structured data audit** — Google Rich Results Test found Q&A schema INVALID on all 20 pages. Root cause: `answerCount` missing from all `Question` objects.

### 2G — New CRs Registered This Session

| CR | Title | Status | Priority |
|---|---|---|---|
| CR-215 | TrustBand marquee DOM + GPU | ✅ Part A done | P2 |
| CR-216 | GTM 3 separate Google scripts | 🔲 Owner (GTM dashboard) | P1 |
| CR-217 | Production nginx 4h cache on brand assets | 🔲 Owner (nginx/CF) | P1 |
| CR-218 | QAPage `answerCount` missing — schema INVALID on 20 pages | 🔲 **NEXT TASK** | P0 |

---

## 3. Files Modified This Session

| File | Change | CR |
|---|---|---|
| `src/pages/Home.jsx` | Suspense split | CR-208 |
| `public/index.html` | GTM defer + preconnects (GTM, FB, CF) | CR-209, CR-211 |
| `scripts/prerender.js` | Added bars-and-pubs + hotels to extraRoutes | CR-212 |
| `src/data/sectors.js` | Ice cream H1 fix + `nameSingular` for 11 sectors | CR-210, CR-213 |
| `src/pages/SectorPage.jsx` | `nameSingular || name` in seoTitle | CR-213 |
| `public/sitemap.xml` | 12 lastmod date updates | CR-214 |
| `src/components/home/TrustBand.jsx` | `will-change` + `contain` on marquee div | CR-215A |

---

## 4. Next Session — Priority Order

### 🔴 P0 — First task: Implement CR-218 (schema fix)

**Complete plan at:** `/app/memory/CR-218_Line_By_Line_Plan.md`

11 edits across 5 files, one rebuild:

| Edit | File | Change |
|---|---|---|
| 1–7 | `src/lib/seo.js` L89–144 | Add `answerCount: 1` + `upvoteCount: 0` to each of 7 homepage Questions |
| 8 | `src/pages/SectorPage.jsx` L66 | Inline map: add `answerCount: 1, acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a }` |
| 9 | `src/pages/AiPage.jsx` L102 | Same pattern |
| 10 | `src/pages/ProductPage.jsx` L59 | Same pattern |
| 11 | `src/pages/Resources.jsx` L65-68 | Multi-line map version |

After implementing: rebuild beta + validate with Python script in plan. Then rebuild PROD zip.

**CRITICAL:** Rebuild steps:
```bash
# Step 1: rebuild beta for testing
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build
sudo supervisorctl restart frontend

# Step 2: validate (script in plan file)

# Step 3: rebuild production zip
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
zip -r /app/mygenie-prod-build.zip build/
```

---

### 🟠 P1 — After CR-218: Owner Actions (relay these)

| CR | Action | Who | Dashboard/Location |
|---|---|---|---|
| **CR-200** | Deploy production zip to `www.mygenie.online` | Owner | Download zip from preview URL → copy to nginx web root |
| **CR-186** | Disable Cloudflare Web Analytics RUM beacon | Owner | Cloudflare → Analytics & Logs → Web Analytics → toggle off |
| **CR-77** | Whitelist Googlebot in Cloudflare WAF | Owner | Cloudflare → Security → WAF → Add rule: cf.client.bot = Allow |
| **CR-78** | 301 Apex → www redirect | Owner | Cloudflare → Rules → Redirect Rules |
| **CR-216** | Merge GA4 + Ads into single Google Tag | Owner | GTM dashboard → GTM-K5D84Z3L |
| **CR-217** | Set nginx cache headers (brand 7d, static 1yr) | Owner | Production nginx config or Cloudflare CF-5 cache rule |
| **CR-212 Part B** | Add nginx 301 for /solutions/bars-and-pubs + /solutions/hotels | Owner | Production nginx config |

---

### 🟡 P1 Code — After CR-218

| CR | What | Files | Effort |
|---|---|---|---|
| **CR-182** | Hero banner.webp missing responsive srcset → LCP 4.1s | `Hero.jsx` | Medium |
| **CR-192+193** | `fetchPriority="high"` + remove `<Reveal>` from hero imgs on 6 LPs | 6 landing page files | Medium |
| **CR-191** | /demo has `noindex={true}` — SEO score 61 | `DemoLanding.jsx:77` | 1 line |
| **CR-196** | /demo H1 uses `font-extrabold` (weight 800) not preloaded → NO_LCP | `DemoLanding.jsx:94` | 1 word |

---

### 🟢 P2 Code — Lower priority

| CR | What | Effort |
|---|---|---|
| **CR-215 Part B** | Reduce TRUST_LOGOS 56→~20 (owner must select logos) | Owner decision first |
| **CR-172** | AggregateRating JSON-LD (blocked on owner review data) | Owner data first |
| **CR-91** | BreadcrumbList missing from About, Contact, SuccessStories, RoiCalculator | Small |
| **CR-126** | Lock prerender in package.json build script | 1 line |
| **CR-204** | /solutions/bakeries h1 missing pos system + billing software | 1 line |

---

## 5. Build Pipeline Reference

```bash
# Beta/preview build (for testing on this pod)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /tmp/build.log 2>&1 &
sudo supervisorctl restart frontend

# Production build (for www.mygenie.online deployment)
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online \
REACT_APP_GTM_ID=GTM-K5D84Z3L \
yarn build > /tmp/build-prod.log 2>&1 &

# Package production zip
zip -r /app/mygenie-prod-build.zip build/
# Downloadable at: https://react-app-direct-2.preview.emergentagent.com/mygenie-prod-build.zip

# Pod restarts wipe the build/ folder → always rebuild after pod restart
# Check if build exists: ls /app/frontend/build/index.html 2>/dev/null || echo "REBUILD NEEDED"
```

---

## 6. Known-Bad Build Hashes (React #418)

Do NOT deploy these:
```
107ff3e9 · 04593470 · 8fe91636 · ea6df739 · b8f96c28 · a65c8c10 · f330ce78 · af722274 · a5f22153
```

Check after every build:
```bash
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "$BAD" | grep -q "$NEW" && echo "BAD HASH — do not deploy" || echo "HASH CLEAN: $NEW"
```

---

## 7. Score Tracker

### Preview URL (no platform overhead ideally)

| Build | CR | Bundle | Score | Notes |
|---|---|---|---|---|
| main.b6403ff7 | Baseline (session 6) | 958KB | 76 | Pre-CR-206 |
| main.dde43c90 | CR-206 browserslist | 937KB | 84 | |
| main.1273e3d6 | CR-207 iconMap | 402KB | TBD (PSI throttled) | |
| main.a67281e4 | CR-208+209 | 401KB | 83 (measured) | Platform adds ~6pts overhead |
| main.7d5ff572 | CR-215A marquee | 401KB | ~85-86 (expected) | |
| main.f2b8b6e8 | PROD build + CR-218 pending | 401KB | TBD | Current pod build (prod URLs) |

### Production (www.mygenie.online)

| State | Score | TBT | Notes |
|---|---|---|---|
| Old build b6403ff7 (current production) | 51→70 | 2,420ms | Pre-all-CRs |
| After deploying new build (CR-200) | ~82–86 | ~1,200ms | CR-207+209 live |
| + CF-1 (disable CF RUM) | ~84–88 | ~900ms | Owner action |
| + CR-216 (GTM merge) | ~86–90 | ~650ms | Owner GTM action |
| + CR-218 (schema fix) | Same score, +CTR | — | Q&A rich results unlocked |

---

## 8. CMS Access

```
Ctrl+Shift+E on any page → CMS login
admin / admin123  OR  editor / editor123
```

---

## 9. Key Files Reference

| File | Purpose |
|---|---|
| `/app/memory/CR-218_Line_By_Line_Plan.md` | **Next task — full plan with exact old/new str** |
| `/app/memory/CR_INTAKE_REGISTER.md` | Full CR register (218 CRs) |
| `/app/memory/HANDOVER_2026-09-04_Session6.md` | Previous session context |
| `/app/frontend/scripts/static-server.js` | Static file server (serves build/) |
| `/app/frontend/scripts/prerender.js` | Puppeteer prerender script |
| `/app/backend/.env` | All production env vars (MONGO_URL, SMS, Freshsales, etc.) |
| `/app/frontend/.env` | `REACT_APP_BACKEND_URL=https://react-app-direct-2.preview.emergentagent.com` |

---

## 10. Quick Health Check

```bash
# Services running?
sudo supervisorctl status

# Build exists?
ls /app/frontend/build/index.html 2>/dev/null && echo "BUILD OK" || echo "REBUILD NEEDED"

# Current build hash + URL target
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
grep -o "beta\.mygenie\.online\|www\.mygenie\.online" /app/frontend/build/index.html | head -1

# Backend responding?
curl -s http://localhost:8001/api/ | python3 -c "import sys,json; print(json.load(sys.stdin))"

# Route count
find /app/frontend/build -name "index.html" | wc -l  # Expected: 65
```

---

*Handover written 2026-09-05. E1 Agent. Session 7.*
*Previous handover: `/app/memory/HANDOVER_2026-09-04_Session6.md`*
*Next task: CR-218 (QAPage answerCount) — plan at `/app/memory/CR-218_Line_By_Line_Plan.md`*
*Full CR register: `/app/memory/CR_INTAKE_REGISTER.md`*
