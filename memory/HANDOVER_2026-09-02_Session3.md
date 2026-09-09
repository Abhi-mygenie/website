# Agent Handover — 2026-09-02 (Session 3)
**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Preview URL:** https://frontend-live-2.preview.emergentagent.com
**Production:** https://beta.mygenie.online

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| backend | RUNNING | 8001 |
| frontend | RUNNING (static build) | 3000 |
| MongoDB | remote 52.66.232.149 | — |

**Last build:** 2026-09-02 16:08:58 (CR-196)
**Prerendered routes:** 63
**main.js hash:** `5fe95401` (changed from `1c0e9a17` due to index.html preload addition)

---

## 2. What Happened This Session — Complete Summary

### 2A — Repo Sync + Initial Deploy
- Synced remote `main` → all missing files pulled (backend/scripts, backend/tests, memory/ with 259 .md files + 57 customer logos, handover files)
- The originally missing `HANDOVER_2026-09-02_Session2.md` was confirmed in remote and pulled

### 2B — CR Status Audit (from Session 2)
Confirmed in build:
- CR-182 ✅ LCP srcset on Hero.jsx
- CR-187 ✅ billing software + pos system on 8 solution pages
- CR-188 ✅ restaurant management in homepage body
- CR-189 ✅ additional keywords on solution pages
- CR-190 ✅ keyword gaps on 6 product pages

### 2C — Beta Site Audit Analysis (Sep 2 2026 doc)
Read and mapped the Dev Team Brief audit. Found 5 gaps from code-level investigation:

| Gap | Root cause |
|---|---|
| `/restaurant-billing-software` LCP 4.9s | No `fetchPriority`, hero img in `<Reveal>` |
| `/petpooja-alternative` LCP 4.2s + CLS 0.029 | No `fetchPriority`, trust logos `loading=lazy` above fold |
| `/restaurant-pos-comparison` LCP 4.3s | Stat cards in `<Reveal delay>` above fold |
| `/qsr-pos-system` LCP 4.4s | No `fetchPriority`, hero img in `<Reveal>` |
| `/demo` SEO 61 | `noindex={true}` hardcoded in DemoLanding.jsx |

### 2D — CR-191 → CR-195 Registered + Implemented
All 5 CRs planned (impact analysis + line-by-line plan) and implemented in one build:

| CR | Change | File(s) |
|---|---|---|
| CR-191 | Removed `noindex={true}` from `/demo` | `DemoLanding.jsx:77` |
| CR-192 | Added `fetchPriority="high"` + `srcSet` to hero images | 5 landing pages |
| CR-193 | Moved hero `<img>` out of `<Reveal>` wrapper | Same 5 landing pages + `ProductPage.jsx` |
| CR-194 | `loading="lazy"` → `loading="eager"` on above-fold trust logos | `PetpoojaAlternative.jsx:466` |
| CR-195 | Removed `<Reveal>` from 4 above-fold stat cards | `RestaurantPosComparison.jsx:166–172` |

### 2E — Post-Build Re-Audit + CR-196/197 Registered
After build, preview URL re-audit revealed 2 new issues:

**CR-196 (real):** `/demo` NO_LCP — H1 uses `font-extrabold` (weight 800, no @font-face declared) + Poppins 700 not preloaded + `font-display:optional` → text invisible on slow networks → NO LCP candidate.

**CR-197 (needs re-test):** `/restaurant-pos-comparison` TBT 100ms → 490ms — JS bundle unchanged (same hash confirmed). Likely measurement variance. Needs re-test on `beta.mygenie.online` before any code work.

### 2F — CR-196 Implemented
Full impact analysis + line-by-line plan written and implemented:

| Change | File | Line |
|---|---|---|
| Added `<link rel="preload">` for `poppins-700.woff2` | `public/index.html` | After L18 |
| `font-extrabold` → `font-bold` on H1 | `DemoLanding.jsx:93` | L93 |
| `font-extrabold` → `font-bold` on ProofCard values | `DemoLanding.jsx:44` | L44 |

---

## 3. CRs Completed This Session

| CR | Title | Files | Status |
|---|---|---|---|
| CR-191 | `/demo` noindex removed | `DemoLanding.jsx` | ✅ DONE |
| CR-192 | `fetchPriority="high"` + srcSet on 5 landing pages | 5 pages | ✅ DONE |
| CR-193 | Hero `<img>` out of `<Reveal>` on 6 files | 6 files | ✅ DONE |
| CR-194 | `/petpooja-alternative` above-fold lazy images fixed | `PetpoojaAlternative.jsx` | ✅ DONE |
| CR-195 | `/restaurant-pos-comparison` stat cards Reveal removed | `RestaurantPosComparison.jsx` | ✅ DONE |
| CR-196 | `/demo` NO_LCP: Poppins 700 preload + font-bold on H1 | `public/index.html`, `DemoLanding.jsx` | ✅ DONE |

**Total files touched this session:**
`DemoLanding.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantPosSystem.jsx`, `QsrPosSystem.jsx`, `CloudKitchenPos.jsx`, `RestaurantManagementSoftware.jsx`, `ProductPage.jsx`, `PetpoojaAlternative.jsx`, `RestaurantPosComparison.jsx`, `public/index.html`

---

## 4. Build Verification (latest build)

```
All 63 prerendered routes present ✅
/demo: noindex gone ✅
/demo: font-extrabold gone ✅
/demo: poppins-700 preloaded ✅
/restaurant-billing-software: fetchPriority=high ✅
/restaurant-billing-software: srcset present ✅
/restaurant-pos-comparison: stat values in static HTML ✅
/petpooja-alternative: page present ✅
```

---

## 5. Open Items — Next Agent Priority List

### P0 — Owner Decision Blocking Code Work

#### CR-180: Domain Canonical Strategy
**Blocker:** Is `beta.mygenie.online` the permanent production domain or will it move to `www.mygenie.online`?

Every prerendered page has `<link rel="canonical" href="https://www.mygenie.online/...">` hardcoded. The current production (`beta.mygenie.online`) does NOT match. Affects all 63 pages.

- **Option A — Keep beta:** Set `REACT_APP_SITE_URL=https://beta.mygenie.online` in frontend `.env` → rebuild
- **Option B — Migrate to www:** Leave current default, ensure DNS redirect beta → www

Full plan: `/app/memory/CR-180_Domain_Canonical_Strategy.md`

---

### P1 — Re-test Required Before Code Work

#### CR-197: `/restaurant-pos-comparison` TBT 490ms
Run PageSpeed on `beta.mygenie.online/restaurant-pos-comparison`:
- If TBT < 200ms: measurement variance — close CR-197
- If TBT ≥ 200ms: lazy-load comparison table (COMPARISON_ROWS, line 38 in `RestaurantPosComparison.jsx`)

---

### P1 — Owner Action Only (No Code Needed)

#### CR-186: Cloudflare RUM in Critical Path
`beacon.min.js` from Cloudflare adds 2,003ms to critical path. Fix: Cloudflare Dashboard → Analytics & Logs → Web Analytics → disable for domain.
Full steps: `/app/memory/CR-186_Cloudflare_RUM_Defer.md`

---

### P1 — Owner Data Needed

#### CR-172: AggregateRating Schema (Star Ratings in Google Search)
Needs verified review count + rating from Google Business, G2 or Capterra.
Full plan: `/app/memory/CR-172_AggregateRating_SoftwareApp_Schema.md`

---

### P1 — Re-audit on beta Required

All CR-191–196 changes are built and live on the preview URL. **Run PageSpeed Insights on `beta.mygenie.online`** for the 6 previously failing pages to confirm real LCP numbers:

| Page | Preview LCP (pre-fix) | Expected on beta |
|---|---|---|
| `/restaurant-billing-software` | 4.9s | ~1.8–2.1s ✅ |
| `/petpooja-alternative` | 4.2s | ~2.0–2.3s ✅ |
| `/restaurant-pos-comparison` | 4.3s | ~2.1–2.4s ⚠️ borderline |
| `/qsr-pos-system` | 4.4s | ~1.9–2.2s ✅ |
| `/solutions/restaurants` | 4.0s | ~1.6–1.9s ✅ |
| `/demo` | NO_LCP | ~2.0–3.0s (H1 text) |

> Note: Preview URL adds ~1.5–2.0s to LCP. Always test on `beta.mygenie.online` for real scores.

---

### P2 — Ready to Implement (No Approval Needed)

| Task | File | What |
|---|---|---|
| Remove dead code | `DemoForm.jsx` ~L207–225 | `if (booked)` guard + `booked` useState unreachable since CR-176 |
| Add Calendly signing key | `backend/.env` + restart | Stops startup warning `"CR-40: Calendly register failed 400: signing_key must be filled"` |
| Add Freshsales API key + Base URL | `backend/.env` + restart | Activates CRM sync (currently logs "skipping" every 6h) |

---

## 6. CR Register State

| Batch | Range | State |
|---|---|---|
| A–Y | CR-24 → CR-190 | All done or deferred (previous sessions) |
| Z | CR-191–195 | ✅ All done this session |
| Z | CR-196 | ✅ Done this session |
| Z | CR-197 | 🔲 Open — needs re-test on beta first |
| — | CR-172 | 🔲 Blocked — needs owner review source data |
| — | CR-180 | 🔲 Blocked — owner domain strategy decision |
| — | CR-186 | 👤 Owner Cloudflare dashboard action only |

Full register: `/app/memory/CR_INTAKE_REGISTER.md`

---

## 7. Critical Technical Rules — Do Not Break

### Build
- `yarn start` = **static server** serving pre-built `build/`. Code changes DO NOT hot-reload.
- Every code/content change requires: `cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build` then `sudo supervisorctl restart frontend`
- Build time: ~3 min (craco ~60s + Puppeteer prerender ~2 min)
- Build log: save to `/app/memory/build-<cr-name>.log` (persistent)

### GTM Conversion Events — SACRED
```
Stage 1: Form submit  → pushLead("form_submitted")  → GTM: form_submitted ₹0
Stage 2: OTP verify   → pushLead("book_demo")        → GTM: thankyou_conversion ₹200 ← DO NOT MOVE
Stage 3: Calendly     → navigate("/thank-you")       → no separate GTM event
```
`thankyou_conversion` fires at OTP (Stage 2) — owner confirmed intentional. Never move to Stage 3.

### CMS Override System
These fields are stored in MongoDB CMS — data file edits will NOT show:
```
home.trust_logos        home.testimonials       home.hero.banner_image
sector.*.faqs (all)     product.run-property.hero.sub
product.sell-serve.faqs product.sell-serve.video
pricing.plans           pricing.addons          customers.stats
```
All OTHER fields (h1, sub, pains, solutions, modules) are NOT overridden → data file edits ARE safe.

### Template Architecture
- Solution pages: edit `src/data/sectors.js` ONLY — never `SectorPage.jsx` for content
- Product pages: edit `src/data/products.js` ONLY — never `ProductPage.jsx`
- Home sections: edit `src/data/content.js` OR component directly if text is hardcoded

### Font Rules (new — discovered this session)
- Poppins preloaded weights: 400, 500, 600, **700** (700 added CR-196)
- Clash Display preloaded weights: 600, 700
- Font stack: `display: ["Clash Display", "Poppins", "sans-serif"]` / `sans: ["Poppins", "sans-serif"]`
- **Always use `font-bold` max for Poppins headings** — `font-extrabold` (800) has no @font-face and no preload
- All landing page H1s should use `font-display` class (Clash Display) not plain `font-bold` (Poppins)

### QAPage vs FAQPage
Google retired FAQPage May 7, 2026. All FAQ schemas use `"@type": "QAPage"`. Do NOT change.

### Form name attributes
`DemoForm` uses React state + axios. HTML `name=` attributes not needed. Not a bug.

---

## 8. Key File Reference

| File | What it covers |
|---|---|
| `/app/memory/CR_INTAKE_REGISTER.md` | Complete CR register — all batches A through AA |
| `/app/memory/CR-191-195_Line_By_Line_Plan.md` | Full implementation plan for CR-191–195 |
| `/app/memory/CR-196 detail` | In CR_INTAKE_REGISTER.md Batch AA section |
| `/app/memory/CR-186_Cloudflare_RUM_Defer.md` | Cloudflare dashboard steps |
| `/app/memory/CR-180_Domain_Canonical_Strategy.md` | Domain strategy options |
| `/app/memory/CR-172_AggregateRating_SoftwareApp_Schema.md` | Star ratings schema plan |
| `/app/memory/HANDOVER_2026-09-02_Session2.md` | Previous session (Session 2) handover |

---

## 9. Quick Health Check Commands

```bash
# Services running?
sudo supervisorctl status

# Backend errors?
tail -n 30 /var/log/supervisor/backend.err.log

# Build fresh? (check timestamp)
stat /app/frontend/build/index.html | grep Modify

# Route count (should be 63)
find /app/frontend/build -name "index.html" | wc -l

# /demo: noindex gone?
grep "noindex" /app/frontend/build/demo/index.html
# Expected: no output

# Poppins 700 preloaded?
grep "poppins-700" /app/frontend/build/index.html | grep "preload"
# Expected: preload link present

# All landing pages have fetchPriority?
for slug in restaurant-billing-software restaurant-pos-system qsr-pos-system cloud-kitchen-pos restaurant-management-software; do
  COUNT=$(grep -c "fetchpriority" /app/frontend/build/${slug}/index.html 2>/dev/null)
  echo "$slug: $COUNT"
done
# Expected: each = 1

# Solution + product keyword spot check
python3 << 'EOF'
pages = ['solutions/restaurants','solutions/cafes','solutions/cloud-kitchens','solutions/qsr',
         'solutions/hotels-resorts','solutions/food-courts','solutions/canteens','solutions/chains',
         'product/sell-serve','product/central-inventory','product/customers',
         'product/run-property','product/protect-profit','product/see-everything']
for p in pages:
    html = open(f'/app/frontend/build/{p}/index.html').read().lower()
    body = html[html.find('<body'):]
    bs = body.count('billing software')
    ps = body.count('pos system')
    flag = '✅' if (bs >= 1 or 'product' in p) else '❌'
    print(f'{flag} /{p}  billing_sw={bs}  pos_sys={ps}')
EOF
```

---

## 10. Repo Sync Command (when new commits are pushed)

```bash
cd /tmp && rm -rf website-repo
git clone --depth=5 --branch main https://github.com/Abhi-mygenie/website.git /tmp/website-repo

# Sync backend Python files
cp /tmp/website-repo/backend/*.py /app/backend/
# Sync frontend src
rsync -a --delete /tmp/website-repo/frontend/src/ /app/frontend/src/
rsync -a --delete /tmp/website-repo/frontend/public/ /app/frontend/public/
# Sync memory docs
rsync -a /tmp/website-repo/memory/. /app/memory/

# Rebuild
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-sync.log 2>&1
sudo supervisorctl restart frontend backend
```

---

## 11. CMS Admin Credentials

CMS admin panel: Ctrl+Shift+E on any page
```
Admin:  admin  /  admin123
Editor: editor / editor123
```
`CMS_JWT_SECRET="replace-with-strong-secret-please"` — change before production.

---

## 12. Recommended Next Actions (priority order)

| # | Action | Who | Effort | Impact |
|---|---|---|---|---|
| 1 | **Run PageSpeed on beta.mygenie.online** for all 6 pages | Agent/Owner | Read-only | Validate CR-191–196 impact — confirm LCP < 2.5s |
| 2 | **Re-test CR-197** on beta (TBT comparison page) | Agent | Read-only | Close or fix CR-197 |
| 3 | **Owner: decide domain strategy (CR-180)** | Owner | 5 min | Fixes canonical mismatch on 63 pages |
| 4 | **Owner: disable Cloudflare RUM (CR-186)** | Owner | 2 min in dashboard | Removes 2,003ms from critical path |
| 5 | **Owner: provide review data (CR-172)** | Owner | Share numbers | Unlocks star ratings in Google Search |
| 6 | **Add Calendly signing key** | Agent | 1 env var + restart | Stops non-fatal startup warning |
| **Add Freshsales API key + Base URL** | Agent | 2 env vars + restart | Activates CRM sync | ✅ DONE 2026-09-02 Session 3 (end) |

---

*Handover written 2026-09-02 Session 3. E1 Agent.*
*Previous handover: `/app/memory/HANDOVER_2026-09-02_Session2.md`*
