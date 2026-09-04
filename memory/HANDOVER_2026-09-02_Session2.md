# Agent Handover — 2026-09-02 (Session 2)
**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Preview URL:** https://frontend-deploy-31.preview.emergentagent.com
**Production:** https://beta.mygenie.online

---

## 1. What This Codebase Is

MyGenie POS — a React marketing website for a restaurant/hospitality POS product sold in India.
Primary goals: Google Ads Quality Score, organic SEO, and Core Web Vitals.

**Stack:**
- Frontend: React 19 + CRA/CRACO + Tailwind CSS
- Serve mode: `node scripts/static-server.js` serving prerendered `build/` directory on port 3000
- Backend: FastAPI (uvicorn) on port 8001, remote MongoDB at `52.66.232.149`
- Prerender: Puppeteer (`scripts/prerender.js`) — runs AFTER every build, snapshots 57 routes

**Critical build flow — NEVER skip:**
```bash
cd /app/frontend && yarn build        # craco build + Puppeteer prerender (~3 min)
sudo supervisorctl restart frontend   # serves the new static build
```
Hot-reload does NOT work. `yarn start` = static server. Every content change requires a full rebuild.

---

## 2. Current System State

| Service | Status | Port |
|---|---|---|
| backend | RUNNING | 8001 |
| frontend | RUNNING | 3000 |
| MongoDB | remote (52.66.232.149) | — |

**Last build:** 2026-09-02 (CR-188 — CtaDemo.jsx)
**Prerendered routes:** 57

---

## 3. What Happened This Session — Complete Summary

This session started with a fresh repo sync and ended with a large keyword/SEO improvement sprint.

### 3A — Deployment (start of session)
- Repo synced from `github.com/Abhi-mygenie/website.git` (main) into `/app` via `git reset --hard`
- All backend `.env` vars written (Freshsales, Calendly, OTP SMS, MongoDB, CMS, GST etc.)
- Frontend built from scratch (`yarn install` → `yarn build` → 57 routes prerendered)
- Services restarted — both running

---

### 3B — CR-182: LCP Hero Banner Responsive srcset ✅
**What:** Hero `banner.webp` was being downloaded full-size (37 KiB, 776px) on mobile for a 348px display.
**Fix:** Created `public/brand/banner-mobile.webp` (400×328px, 17 KiB) + added `srcSet` + `sizes` to `EditableImage` in `Hero.jsx`.
**Impact:** LCP 4.1s → ~2.5s target on mobile.
**File changed:** `src/components/home/Hero.jsx` (2 lines added)

---

### 3C — Audit Investigation: React #418 Hydration (no code edit)
**Finding:** The auditor claimed Error #418 was still firing after CR-160. Full investigation of all components found CR-160 correctly fixed all hydration issues. No action needed. See handover note in register.

---

### 3D — Audit Investigation + CR-187: Solution Page Keyword Gap
**Problem confirmed:** "billing software" = 0× on ALL 8 solution pages. "pos system" = 0× on 5/8 pages. The `SectorPage.jsx` title formula hard-codes "POS System & Billing Software" in the `<title>` but the data file (`sectors.js`) never contained either phrase in the body — title/body mismatch hurts Google Ads Quality Score.

**CR-187 fix (8 h1 edits in `sectors.js`):**

| Sector | h1 change |
|---|---|
| restaurants L9 | `POS system` → `POS system & billing software` |
| cafes L38 | `POS system` → `POS system & billing software` |
| qsr L67 | `POS & billing` → `POS system & billing software` |
| cloud-kitchens L96 | `POS & inventory management` → `POS system & billing software` |
| hotels-resorts L125 | `POS system` → `POS system & billing software` |
| food-courts L154 | `POS` → `POS system & billing software` |
| canteens L183 | `management software` → `POS system & billing software` |
| chains L212 | `POS for` → `POS system & billing software for` |

---

### 3E — CR-189: Solutions Pages Additional Keyword Gaps
**Problem confirmed:** Beyond billing software + pos system, 6 solution pages missing further keywords from the same audit.

**CR-189 fix (8 `solutions[].desc` edits in `sectors.js`):**

| Sector | Field | Keyword(s) added |
|---|---|---|
| restaurants | solutions[2].desc L20 | inventory management |
| cafes | solutions[0].desc L47 | cafe pos |
| cafes | solutions[1].desc L48 | table management |
| qsr | solutions[1].desc L77 | qr menu, quick service |
| hotels-resorts | solutions[0].desc L134 | hotel billing |
| hotels-resorts | solutions[3].desc L137 | hotel management, property management |
| canteens | solutions[0].desc L192 | canteen pos |
| chains | solutions[3].desc L224 | chain pos, multi-location |

**Verification: 35/35 checks pass.** All 8 solution pages: billing_sw≥1, pos_sys≥1, all additional keywords ≥1, meta_desc≤160ch.

---

### 3F — CR-190: Product Pages Keyword Gaps (All 6 Pages)
**Problem confirmed:** All 6 product pages missing 2–3 keywords each from the audit.

**CR-190 fix (11 `modules[].outcome` edits in `products.js`):**

| Page | Module | Keywords added |
|---|---|---|
| sell-serve L11 | POS Billing | pos system |
| sell-serve L12 | Captain App | order management |
| run-property L36 | Hotel/Room Billing | hotel management, dashboard |
| run-property L39 | Single Checkout Bill | analytics |
| customers L59 | CRM | customer management |
| customers L60 | Loyalty | loyalty program |
| protect-profit L86 | Audit Reports | theft prevention, analytics |
| protect-profit L87 | Smart Validations | cash management *(owner approved)* |
| see-everything L108 | Reports | sales report, analytics |
| central-inventory L133 | Central Procurement | stock management |
| central-inventory L135 | Recipe & BOM Costing | recipe management, food cost |

**Dropped:** `business intelligence` on see-everything — owner decision: not current positioning. `dashboard` already 4× present.

**Verification: 21/21 checks pass.**

---

### 3G — CR-188: Homepage "restaurant management" Body Gap
**Problem:** "restaurant management" = 0× in homepage body (present in meta description only). Gap confirmed in all 8 home components.

**Fix:** `CtaDemo.jsx` L26 — `"restaurant software"` → `"restaurant management software"` (+12 chars). Adds both `restaurant management` and `restaurant management software` to the body.

**Verification: PASS.** restaurant management=1, restaurant management software=1, meta=135ch.

---

## 4. CRs Completed This Session

| CR | Title | File(s) | Status |
|---|---|---|---|
| CR-182 | LCP hero banner responsive srcset | `Hero.jsx`, `public/brand/banner-mobile.webp` | ✅ DONE |
| CR-187 | billing software + pos system on 8 solution pages | `sectors.js` (8 h1 edits) | ✅ DONE |
| CR-188 | Homepage restaurant management gap | `CtaDemo.jsx` (1 edit) | ✅ DONE |
| CR-189 | Solution pages additional keyword gaps | `sectors.js` (8 solutions[].desc edits) | ✅ DONE |
| CR-190 | Product pages keyword gaps | `products.js` (11 modules[].outcome edits) | ✅ DONE |

**Total files touched this session:** `Hero.jsx`, `sectors.js`, `products.js`, `CtaDemo.jsx`, `public/brand/banner-mobile.webp`

---

## 5. What Is Still Open — Next Agent Priority List

### P0 — Owner Decision Blocking Code Work

#### CR-180: Domain Canonical Strategy
**Blocker:** Is `beta.mygenie.online` the permanent production domain or will it move to `www.mygenie.online`?

Every prerendered page has `<link rel="canonical" href="https://www.mygenie.online/...">` hardcoded from `REACT_APP_SITE_URL`. The current production domain (`beta.mygenie.online`) does NOT match the canonicals. This affects all 57+ prerendered pages.

**Option A — Keep beta.mygenie.online:**
→ Set `REACT_APP_SITE_URL=https://beta.mygenie.online` in `frontend/.env` → rebuild → all 61 canonicals update. Restart frontend.

**Option B — Migrate to www.mygenie.online:**
→ Leave `REACT_APP_SITE_URL=https://www.mygenie.online` (current default) → ensure proper DNS redirect from beta → www. No code change needed if this is already live.

Full plan: `/app/memory/CR-180_Domain_Canonical_Strategy.md`

---

### P1 — Owner Action Only (No Code Needed)

#### CR-186: Cloudflare RUM in Critical Path
`beacon.min.js` from Cloudflare Analytics is injected at CDN level — removes 2,003ms from critical path.
- **Action:** Cloudflare Dashboard → Analytics & Logs → Web Analytics → disable/defer for the domain
- Zero code change, zero rebuild needed
- Full steps: `/app/memory/CR-186_Cloudflare_RUM_Defer.md`

---

### P1 — Owner Data Needed Before Implementation

#### CR-172: AggregateRating (Star Ratings in Google Search)
Needs a confirmed third-party review source — verified numbers only (do NOT estimate).
- Accepted sources: Google Business, G2, Capterra
- Need: review count + average rating
- Full plan: `/app/memory/CR-172_AggregateRating_SoftwareApp_Schema.md`

---

### P2 — Ready to Implement (No Approval Needed)

#### Small Cleanups (any order, any session)

| Task | File | What | Risk |
|---|---|---|---|
| Remove dead code | `DemoForm.jsx` ~L207–225 | `if (booked)` guard + `booked` useState unreachable since CR-176 | Zero |
| Add Calendly signing key | `/app/backend/.env` + restart | Stops non-fatal startup warning `"CR-40: Calendly register failed 400: signing_key must be filled"` | Zero |
| Add Freshsales API key | `/app/backend/.env` + restart | Activates CRM lead sync (currently logs "skipping" every 6h) | Low — test sync first |

---

### P2 — Re-run Lighthouse Audit

All keyword + performance CRs from this session are now live. A fresh Lighthouse audit on production (`beta.mygenie.online`) is overdue. Expected improvements:
- Performance: LCP ~4.1s → ~2.5s (CR-182)
- SEO: keyword title/body alignment (CR-187/188/189/190)
- Ads Quality Score: solution pages now have billing software + pos system in body

**Note:** Running Lighthouse on the Emergent preview URL (`*.preview.emergentagent.com`) will show SEO score 61 due to `x-robots-tag: noindex` injected by the platform — **this is a preview artifact, not a real issue**. Always test on `beta.mygenie.online` for real scores.

---

## 6. CR Register Summary (full state)

| Batch | Range | State |
|---|---|---|
| A–P | CR-24 → CR-166 | All done or deferred (previous sessions) |
| Q | CR-167–171 | ✅ All done |
| Q | CR-172 | 🔲 Blocked — needs owner review source data |
| R–T | CR-173–179 | ✅ All done |
| U | CR-180 | 🔲 Blocked — owner domain strategy decision |
| V | CR-181 | ✅ Done |
| W | CR-182–185 | ✅ All done |
| W | CR-186 | 🔲 Owner Cloudflare action only |
| X | CR-187 | ✅ Done this session |
| Y | CR-188–190 | ✅ All done this session |

**Full register:** `/app/memory/CR_INTAKE_REGISTER.md`

---

## 7. Critical Technical Rules — Do Not Break

### Build
- `yarn start` = **static server** (production mode). Code changes DO NOT hot-reload.
- **Every content or code change requires:** `cd /app/frontend && yarn build` then `sudo supervisorctl restart frontend`
- Build time: ~3 minutes (craco ~60s + Puppeteer prerender ~2 min)
- Build log during run: `tail -f /tmp/build-cr*.log` (save to `/tmp`, not `/app`)

### GTM Conversion Events — SACRED
```
Stage 1: Form submit  → pushLead("form_submitted")  → GTM: form_submitted ₹0
Stage 2: OTP verify   → pushLead("book_demo")        → GTM: thankyou_conversion ₹200 ← DO NOT MOVE
Stage 3: Calendly     → navigate("/thank-you")       → no separate GTM event
```
`thankyou_conversion` fires at OTP (Stage 2) — owner confirmed intentional. Never move it to Stage 3.

### CMS Override System
These fields are stored in MongoDB CMS. **Data file fallbacks will NOT show for these keys:**
```
home.trust_logos           home.testimonials          home.hero.banner_image
sector.*.faqs (all)        product.run-property.hero.sub
product.sell-serve.faqs    product.sell-serve.video
pricing.plans              pricing.addons             customers.stats
```
All OTHER fields (h1, sub, pains, solutions, modules) are NOT overridden → data file edits ARE safe.

### `sub` field dual-use (sectors.js + products.js)
`s.sub` / `p.sub` = BOTH the visible hero subtitle AND the `<meta description>`. CR-181 trimmed all solution page subs to ≤160ch. Check `sub` length before any edit.

### Template architecture
- Solution pages: edit `src/data/sectors.js` ONLY — never `SectorPage.jsx` for per-page content
- Product pages: edit `src/data/products.js` ONLY — never `ProductPage.jsx`
- Home sections: edit `src/data/content.js` (PILLARS, AI_USECASES, SECTORS, MODULE_BUCKETS) OR the component directly if text is hardcoded

### QAPage vs FAQPage
Google retired `FAQPage` rich results May 7, 2026. All new FAQ schemas use `"@type": "QAPage"`. Auditors may flag QAPage as wrong — it is NOT wrong. See CR-106.

### Form name attributes
`DemoForm` uses React state + `axios.post()`. HTML `name=` attributes are not needed. Auditors have flagged this twice incorrectly. Do NOT add `name=` attributes — not a bug.

---

## 8. Key File Reference

| File | What it covers |
|---|---|
| `/app/memory/CR_INTAKE_REGISTER.md` | Complete CR register — all batches A through Y |
| `/app/memory/CR-187-189_Combined_Implementation_Plan.md` | Full plan for solution page keyword fixes |
| `/app/memory/CR-190_Line_By_Line_Plan.md` | Full plan for product page keyword fixes |
| `/app/memory/CR-190_Content_Approval_Decision.md` | Owner decisions: cash management ✅, business intelligence ❌ |
| `/app/memory/CR-188_Line_By_Line_Plan.md` | Homepage restaurant management fix plan |
| `/app/memory/CR-186_Cloudflare_RUM_Defer.md` | Cloudflare dashboard steps for CR-186 |
| `/app/memory/CR-180_Domain_Canonical_Strategy.md` | Domain strategy options (two paths) |
| `/app/memory/CR-172_AggregateRating_SoftwareApp_Schema.md` | Star ratings schema plan |
| `/app/memory/UAT_AUDIT_INVESTIGATION_2026-08-30.md` | Full UAT audit validation |
| `/app/memory/HANDOVER_2026-09-02.md` | Previous session handover (more technical detail) |

---

## 9. Quick Health Check Commands

```bash
# Services running?
sudo supervisorctl status

# Backend errors?
tail -n 30 /var/log/supervisor/backend.err.log

# Build fresh?
stat /app/frontend/build/index.html | grep Modify

# Homepage keyword spot check
python3 << 'EOF'
import re
html = open('/app/frontend/build/index.html').read().lower()
for k in ['restaurant pos','billing software','pos system','table management','restaurant management']:
    print(f'{html.count(k):>3}×  {k}')
EOF

# All solution page meta descs ≤160ch?
python3 << 'EOF'
import re, os
base = '/app/frontend/build/solutions'
for slug in ['restaurants','cafes','cloud-kitchens','qsr','hotels-resorts','food-courts','canteens','chains']:
    path = f'{base}/{slug}/index.html'
    m = re.search(r'<meta name="description" content="(.*?)"', open(path).read())
    d = m.group(1).replace('&amp;','&') if m else ''
    print(f"{'OK' if len(d)<=160 else 'OVER'} {len(d)}ch  /solutions/{slug}")
EOF

# Solution + product page keyword spot check
python3 << 'EOF'
import os
pages = ['solutions/restaurants','solutions/cafes','solutions/cloud-kitchens','solutions/qsr',
         'solutions/hotels-resorts','solutions/food-courts','solutions/canteens','solutions/chains',
         'product/sell-serve','product/central-inventory','product/customers',
         'product/run-property','product/protect-profit','product/see-everything']
for p in pages:
    html = open(f'/app/frontend/build/{p}/index.html').read()
    body = html[html.lower().find('<body'):].lower()
    bs = body.count('billing software')
    ps = body.count('pos system')
    flag = '✅' if (bs >= 1 or 'solution' not in p) else '❌'
    print(f'{flag} /{p}  billing_sw={bs}  pos_sys={ps}')
EOF
```

---

## 10. CMS Admin Credentials

CMS admin panel: Ctrl+Shift+E on any page (requires login)

```
Admin:  admin  /  admin123
Editor: editor / editor123
```

`CMS_JWT_SECRET="replace-with-strong-secret-please"` — change before production.

---

## 11. Recommended Next Actions (in priority order)

| # | Action | Who | Effort | Impact |
|---|---|---|---|---|
| 1 | **Owner: decide domain strategy (CR-180)** | Owner | 5 min decision | P0 — fixes canonical mismatch on 61+ pages |
| 2 | **Owner: disable Cloudflare RUM (CR-186)** | Owner | 2 min in Cloudflare dashboard | P1 — removes 2,003ms from critical path |
| 3 | **Owner: provide review data (CR-172)** | Owner | Share verified review count + rating | P1 — unlocks star ratings in Google Search |
| 4 | **Run Lighthouse on beta.mygenie.online** | Agent | Read-only | Validate CR-182/187/189/190 impact |
| 5 | **Remove dead code DemoForm.jsx L207–225** | Agent | 1 edit, no rebuild | P2 cleanup |
| 6 | **Add Calendly signing key to backend .env** | Agent | 1 env var + restart | Stops startup warning |
| 7 | **Add Freshsales API + Base URL to .env** | Agent | 2 env vars + restart | Activates CRM sync |
| 8 | **Re-sync repo from GitHub** | Agent | `git pull origin main && cd frontend && yarn build` | Keep in sync with latest commits |

---

## 12. Repo Sync Command (when new commits are pushed)

```bash
cd /app && git pull origin main
cd /app/frontend && yarn build
sudo supervisorctl restart frontend backend
```

---

*Handover written 2026-09-02. Session 2. E1 Agent.*
*Previous handover: `/app/memory/HANDOVER_2026-09-02.md` (more detailed technical context from Session 1)*
