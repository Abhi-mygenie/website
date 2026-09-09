# HANDOVER — MyGenie Website Workstream
## From: E1 (session ending 2026-08-26)
## To: Next agent

**Repo:** `https://github.com/Abhi-mygenie/website.git` · Branch: `main`
**Preview URL:** `https://mygenie-frontend-run.preview.emergentagent.com`
**Production URL:** `https://beta.mygenie.online` (Cloudflare CDN)
**Backend API:** `https://mygenie-frontend-run.preview.emergentagent.com/api`

---

## ⚠️ CRITICAL — Read First

### Serving Mode
Frontend runs in **static-server mode** (NOT `craco start`):
```
Supervisor: yarn start → node scripts/static-server.js
```
Serves pre-built `build/` directory. **No hot reload.** After ANY source change you MUST:
```bash
cd /app/frontend && yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

### Pod restart wipes `build/`
After any pod restart, run:
```bash
ls /app/frontend/build/index.html 2>/dev/null && echo "BUILD OK" || echo "NEED REBUILD"
```
If rebuild needed (~5 min):
```bash
cd /app/frontend && yarn build && node scripts/prerender.js && sudo supervisorctl restart frontend
```

### Current build state
- `yarn build` + `node scripts/prerender.js` last run: 2026-08-26
- **61 pages prerendered**
- All services running: backend (pid 7367), frontend (pid 12871), mongodb

---

## 1. Environment

```
frontend/.env:
  REACT_APP_BACKEND_URL=https://mygenie-frontend-run.preview.emergentagent.com
  WDS_SOCKET_PORT=443
  ENABLE_HEALTH_CHECK=false
  REACT_APP_LEADS_ENABLED=true

backend/.env:
  MONGO_URL=mongodb://appuser:i6FB0atA40qw@52.66.232.149:27017/mygenie?authSource=admin
  DB_NAME=test_database
  CORS_ORIGINS=*
  LEADS_DASHBOARD_ENABLED=true
  STORAGE_BACKEND=local
  EMERGENT_LLM_KEY=sk-emergent-b46Be54C869A5D1D83
  CMS_USER_1=admin / CMS_PASS_1=admin123
  CMS_USER_2=editor / CMS_PASS_2=editor123
  (Freshsales, Razorpay, Meta Ads, Google Ads keys commented out — not active in preview)
```

### CMS Credentials (for /leads admin)
```
URL:      https://mygenie-frontend-run.preview.emergentagent.com/leads
Username: admin
Password: admin123
```

---

## 2. Architecture

```
Browser
  → Nginx/Cloudflare (port 443)
  → static-server.js (port 3000) — gzip + cache headers
  → build/{route}/index.html (prerendered HTML for 61 routes)
     → hydrateRoot attaches React to prerendered DOM
     → CMS fetch only on /blog/* or admin token present
```

### Key files
```
scripts/prerender.js          — visits all sitemap routes + /demo /payment-success /404
scripts/static-server.js      — serves build/ with gzip, cache, proper 404 routing
src/components/site/Reveal.jsx — CHANGED: useState(true), navigator.webdriver guard
src/components/site/DemoForm.jsx — ALL instances use shortForm, submit="Book My Free Demo →"
src/data/redirects.js         — client-side 301 redirect map
src/App.js                    — routes + lazy imports + LEADS_DASHBOARD_ENABLED gate
backend/cms_auth.py           — get_dashboard_admin() wrapper for dashboard gating
```

### Structural gate check (run after every prerender)
```bash
python3 -c "
import re
from pathlib import Path
build = Path('/app/frontend/build')
pages = {'homepage': 'index.html', 'pricing': 'pricing/index.html'}
for name, path in pages.items():
    html = (build/path).read_text(errors='ignore')
    style_matches = re.findall(r'style=\"[^\"]*opacity: 0[^\"]*\"', html)
    reveal_leaks = [m for m in style_matches if '-9999px' not in m]
    print(f'{name}: opacity:0 leaks={len(reveal_leaks)} (expected 0)')
"
```

---

## 3. What Was Done This Session

### Batch N — UX/SEO Audit Fixes (all ✅ DONE, 100% tested)

| CR | Change | Status |
|----|--------|--------|
| CR-154 | Homepage badge → "India's Restaurant POS & Billing Software" | ✅ |
| CR-155 | /pricing H1 keyword + DemoForm at bottom (`id="lp-demo"`) | ✅ |
| CR-156 | All 8 remaining DemoForms → `shortForm` | ✅ |
| CR-157 | Hero CTA `<button>` → `<a href="#demo">` | ✅ |
| CR-158 | /product H1 → "One restaurant operating system…" | ✅ |
| CR-159 | /customers mid-page CTA card + StickyMobileCta | ✅ |
| CR-160 | Reveal.jsx `useState(true)` + `navigator.webdriver` prerender guard | ✅ |
| CR-161 | DemoForm submit → "Book My Free Demo →" | ✅ |

### Previously done (earlier sessions)
- CR-153: ENV-gated lead dashboard (`LEADS_DASHBOARD_ENABLED`) — ✅
- CR-85/86/148/149/152: 5 Google Ads LPs built and prerendered — ✅
- CR-85/86/148/149/152 line-by-line plans: in `/app/memory/` — ✅
- CR-150/154 line-by-line plans: in `/app/memory/` — ✅

---

## 4. Priority Queue — Next Agent's Tasks

### 🔴 P0 — Implement FIRST (ad spend burning NOW)

**CR-162 — Emergency Redirect `/restaurant-pos-comparison` → `/restaurant-pos-system`**

File: `frontend/src/data/redirects.js`

Add ONE line to the `REDIRECTS` object:
```js
"/restaurant-pos-comparison": "/restaurant-pos-system",
```

Then build + prerender + restart frontend. Done in 10 minutes.

**Verify:**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  https://mygenie-frontend-run.preview.emergentagent.com/restaurant-pos-comparison
# Expected: 200 (redirect followed) NOT 404
```

Remove this redirect when CR-150 (the full comparison page) is built.

---

### 🟡 P1 — Same session as CR-162

**CR-163 — Fix 5-field DemoForm (outlet_type shows on 6 pages)**

File: `frontend/src/components/site/DemoForm.jsx` L347

Change ONE word:
```jsx
// BEFORE:
{!sector && (

// AFTER:
{!sector && !shortForm && (
```

**Verify:** Visit `/about`, `/product`, `/ai`, `/solutions`, `/contact` — DemoForm should show 4 fields (no outlet_type dropdown).

---

### 🟡 P2 — After P0 + P1

**CR-164 — "See Pricing" same-page scroll + SectorPage CTA**

**Change 1** — `frontend/src/components/home/Hero.jsx` L53–59:
```jsx
// Change <Link to="/pricing"> → <a href="#pricing">
// id="pricing" already exists on homepage in CtaDemo.jsx L17
```

**Change 2** — `frontend/src/pages/SectorPage.jsx` (after L101):
```jsx
<Link
  to="/pricing"
  data-testid="sector-pricing-btn"
  className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all"
>
  See Pricing
</Link>
```

---

### 🔵 Pending (brief coming next session)

**CR-150 — `/restaurant-pos-comparison` Full Page**

Brief not yet provided. Owner will provide in next session.
Key facts from existing CR-150 doc:
- URL: `/restaurant-pos-comparison`
- Dynamic: `?vs=CompetitorName` param swaps H1 token `[Competitor]`
- 14 keywords in paused ad group (remove [toast pos])
- Pattern: same as other LPs (LandingNavbar, DemoForm, FAQ)
- Remove CR-162 redirect when this is built

---

### 📋 All open P1/P2 CRs (deferred backlog)

See `/app/memory/CR_INTAKE_REGISTER.md` for full list. Key ones:

| CR | Summary | Priority |
|----|---------|---------|
| CR-85 | Build `/restaurant-billing-software` LP | P1 — plan ready |
| CR-86 | Build `/restaurant-pos-system` LP | P1 — plan ready |
| CR-148 | Build `/restaurant-management-software` LP | P1 — plan ready |
| CR-149 | Build `/qsr-pos-system` LP + RSA headlines | P2 |
| CR-155 | /pricing DemoForm | P2 — partially done |

Wait — CR-85/86/148/149/152 LPs are ALL already built. See §3 above. The intake register may show old status. Do not rebuild them.

---

## 5. Do NOT Do

- **DO NOT** switch supervisor back to `craco start` — must stay on `node scripts/static-server.js`
- **DO NOT** skip `node scripts/prerender.js` after `yarn build` — all pages must be prerendered
- **DO NOT** implement CR-53 (backend Meta CAPI) — owner said NO
- **DO NOT** touch `LEADS_DASHBOARD_ENABLED` or `REACT_APP_LEADS_ENABLED` — leave both as `true`
- **DO NOT** add new env vars without checking `backend/.env` — many keys already set
- **DO NOT** skip rebuild check at session start — pod restarts wipe `build/`
- **DO NOT** remove the `navigator.webdriver` check from `Reveal.jsx` — it's critical for prerender opacity fix

---

## 6. Test Reports This Session

```
iteration_1.json — 5 LP pages HTML prerender audit (5/5 PASS)
iteration_2.json — CR-153 ENV-gated dashboard (19/19 PASS)
iteration_3.json — Batch N UX/SEO fixes (8/8 PASS)
```

---

## 7. Memory Files Reference

```
/app/memory/PRD.md                       — Full product spec + what's been done
/app/memory/CR_INTAKE_REGISTER.md        — All CRs with status
/app/memory/HANDOVER_*.md                — Previous agent handovers (context history)
/app/memory/CR-162_*.md                  — Emergency redirect (P0)
/app/memory/CR-163_*.md                  — 5-field form fix (P1)
/app/memory/CR-164_*.md                  — See Pricing scroll fix (P2)
/app/memory/CR-85_Line_By_Line_Plan.md   — LP build plan
/app/memory/CR-86_Line_By_Line_Plan.md   — LP build plan
/app/memory/CR-148_Line_By_Line_Plan.md  — LP build plan
/app/memory/CR-149_Line_By_Line_Plan.md  — LP build plan
/app/memory/CR-152_Line_By_Line_Plan.md  — LP build plan
/app/memory/CR-153_Line_By_Line_Plan.md  — ENV dashboard gate plan
```

---

## 8. Recommended First 30 Minutes

1. **Check build health:**
   ```bash
   ls /app/frontend/build/index.html && echo "BUILD OK" || echo "REBUILD NEEDED"
   sudo supervisorctl status
   ```

2. **Implement CR-162** (P0, 10 min):
   - Add 1 line to `redirects.js`
   - `yarn build && node scripts/prerender.js && sudo supervisorctl restart frontend`
   - Verify redirect works

3. **Implement CR-163** (P1, 5 min):
   - Add `&& !shortForm` to DemoForm.jsx L347
   - Rebuild
   - Verify 4 fields on /about

4. **Ask owner for CR-150 brief** — the full comparison page is the main remaining ad campaign gap

---

*Handover written 2026-08-26. Batch N (CR-154 to CR-161) complete. CR-162/163/164 registered and ready to build. CR-150 brief pending from owner.*
