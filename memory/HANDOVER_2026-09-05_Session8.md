# Agent Handover — 2026-09-05 (Session 8)
**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Production URL:** https://www.mygenie.online
**Preview URL:** https://mygenie-preview-2.preview.emergentagent.com

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| Frontend (static-server.js) | RUNNING | 3000 |
| Backend (uvicorn) | RUNNING | 8001 |
| MongoDB | remote 52.66.232.149 | — |

### Build on preview pod
```bash
ls /app/frontend/build/static/js/main.*.js | grep -v .map
# Expected: main.5ded3b5e.js (beta build — api: beta.mygenie.online)
```

### Production build (deployed)
```
Hash: main.aad795d7.js
URL:  www.mygenie.online
Zip:  /app/mygenie-prod-build.zip (12MB, clean, 65 routes)
Download: https://mygenie-preview-2.preview.emergentagent.com/mygenie-prod-build.zip
```

---

## 2. Production Lighthouse Scores (as of Session 8)

**Test config: Mobile, Region: India**

| Metric | Session 7 (before) | Session 8 (after) | Change |
|---|---|---|---|
| Performance | 62 | **79** | +17 pts |
| Best Practices | 79 | **100** | +21 pts |
| Accessibility | 96 | 96 | — |
| SEO | 92 | 92 | — |

**Target: 90+ Performance**
**Gap remaining: +11 pts**

---

## 3. What Was Done This Session

### 3A — Repo sync + env setup
- Cloned main branch from github.com/Abhi-mygenie/website.git into /app
- Set all backend env vars (MONGO_URL, SMS, Freshsales, Calendly, etc.)
- Preserved platform env vars (REACT_APP_BACKEND_URL, WDS_SOCKET_PORT)

### 3B — CR-218: QAPage answerCount fix ✅
- Added `answerCount: 1` + `upvoteCount: 0` to all QAPage schemas
- 11 search_replace edits across 5 files
- Unlocks Q&A rich results on 20 pages
- Build: main.69e93aec (beta) / main.4abff48f (prod)

### 3C — CR-219: GA4 Consent Mode EEA region fix ✅
- Added `region: ['EEA','GB']` to denied consent default
- Added unscoped `granted` default for non-EEA (India etc.)
- Indian visitors now tracked by GA4 without clicking Accept
- Build: main.d0f13cee (beta) / main.e138aefb (prod)

### 3D — CR-220: Enhanced Conversions Fix B ✅
- Added `user_data: { email_address, phone_number, address: { first_name, last_name } }` to `buildLeadPayload()` in `src/lib/gtm.js`
- Fix A + Fix C (GTM config) still pending — see Section 5

### 3E — Production deployment ✅
- Built production zip with all CRs (main.aad795d7.js)
- Deployed to www.mygenie.online
- Confirmed correct build via Lighthouse diagnostics

### 3F — CR-186: Cloudflare RUM beacon disabled ✅
- Analytics → Web Analytics → Manage RUM Settings → Disable
- Impact: −343ms "Other" main-thread work, −214ms Style & Layout
- **Score jumped from 62 → 79 (+17 pts)**
- **Best Practices 79 → 100 (+21 pts)**

### 3G — CR-217: Cloudflare Cache Rules set ✅
- Brand images: 4h → 30 days
- JS bundles: confirmed 30 days
- Fonts: confirmed 30 days
- Validated: `cache-control: max-age=2592000` on all assets

---

## 4. Issues Remaining to Reach 90+ Performance

### P0 — Fix immediately

**CR-216: GTM Duplicate Google Scripts (−308ms TBT, ~+4-5 pts)**

Two separate Google Tags both load `gtag.js` independently:
- "Google Analytics - GA4" tag → loads `gtag.js?id=G-KWHHFEZ5Q3`
- "Google Tag AW-16740091756" tag → loads `gtag.js?id=AW-16740091756`

This downloads `gtag.js` twice (179KB duplicate).

**Blocker identified:** The "Google Analytics - GA4" tag uses a variable `{{GA4 ID}}` for Tag ID — this hides the "Connected Site Tags" section in GTM's UI. Neither tag shows the Connected Site Tags section.

**Next steps to investigate:**
1. Go to GTM → Variables → find `{{GA4 ID}}` variable → check its value (should be `G-KWHHFEZ5Q3`)
2. Try editing "Google Analytics - GA4" tag → replace `{{GA4 ID}}` with the literal value `G-KWHHFEZ5Q3` → check if "Connected Site Tags" appears
3. If it appears: add `AW-16740091756` as Connected Site Tag → pause "Google Tag AW-16740091756"

**CR-220 Fix A + Fix C: GTM Enhanced Conversions (P0 — measurement)**

The `user_data` object is now in the dataLayer (Fix B ✅ done). GTM still needs:
- **Fix A:** Create "User-Provided Data" variable `dlv - user_data` (reads dataLayer `user_data`) → attach to "GA4 - Book demo" tag's User Data section
- **Fix C:** Open "GAds - Book Demo" tag → Enhanced Conversions → switch **Automatic → Code** → set `{{dlv - user_data}}`
- **Why:** EC mode "Automatic" scans DOM for input fields at conversion time — but React unmounts form inputs before conversion fires. Last EC ping was Sep 2. EC data = zero since then.

---

### P1 — High impact code changes

**CR-215B: Reduce TrustBand logos 56 → ~20 (−214ms Style & Layout, ~+2 pts)**

Current: `src/data/content.js` has 56 trust logos, doubled to 112 DOM nodes in the marquee.
Fix: Owner must select ~20 logos to keep → developer removes the rest from `content.js` → rebuild.
File: `/app/frontend/src/data/content.js` — look for `TRUST_LOGOS` array.
Impact: Style & Layout was 587ms (before CF RUM fix) → 373ms now. Reducing 112 nodes to ~40 will cut this further.

**LCP Mobile Preload fix (new CR needed — ~+3 pts)**

The prerendered `index.html` has:
```html
<link rel="preload" as="image" href="/brand/banner.webp">
```
But on mobile (390px), srcset picks `banner-mobile.webp` (400w). Preload loads the wrong image.
Fix: Update the prerender script to inject:
```html
<link rel="preload" as="image" imagesrcset="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" imagesizes="(max-width:1023px) 400px, 776px" fetchpriority="high">
```
File: `/app/frontend/scripts/prerender.js` — find the hero image preload injection block.
Impact: LCP currently 2,920ms, Render Delay 2,320ms. Correct preload would reduce to ~2,000ms.

**CR-191: /demo noindex fix (1 line, +SEO)**

`/demo` page has `noindex={true}` — page invisible to Google, SEO score 61 for that page.
File: `src/pages/DemoLanding.jsx` line 77 — change `noindex={true}` to `noindex={false}` or remove prop.

---

### P1 — Owner / Cloudflare actions (no code)

**CR-77: Whitelist Googlebot in Cloudflare WAF (CRITICAL for SEO)**
```
Cloudflare → Security → WAF → Custom Rules → Create rule
Expression: (cf.client.bot) and (http.user_agent contains "Googlebot")
Action: Skip → WAF Managed Rules
```

**CR-78: 301 Apex → www redirect**
```
Cloudflare → Rules → Redirect Rules → Create rule
When: Hostname equals mygenie.online
Then: URL redirect 301 → https://www.mygenie.online${uri}
```
Validate: `curl -I https://mygenie.online` → Expected: 301 → www

**CR-212 Part B: nginx 301 for 2 solution pages**
```nginx
rewrite ^/solutions/bars-and-pubs$ /solutions/bars-and-pubs/ permanent;
rewrite ^/solutions/hotels$ /solutions/hotels/ permanent;
```

---

## 5. Score Tracker

| State | Score | TBT | Notes |
|---|---|---|---|
| Session 7 baseline (old build) | 51-70 | 2,900ms | Pre-all-CRs |
| After new build deploy | 62 | 1,680ms | CRs 218+219+220 live |
| After CF RUM off (CR-186) ← current | **79** | ~1,300ms | +17 pts |
| After CF Cache 30d (CR-217) | 79+ | — | LCP benefit loading |
| + CR-216 GTM merge | ~83-84 | ~1,000ms | −308ms TBT |
| + LCP preload fix | ~85-87 | — | LCP 2,920→2,000ms |
| + CR-215B logo reduction | ~87-89 | ~800ms | −214ms Style&Layout |
| + CR-77 + CR-78 + CR-191 | ~90+ | — | SEO + remaining gaps |

---

## 6. Known-Bad Build Hashes (do NOT deploy)
```
107ff3e9 · 04593470 · 8fe91636 · ea6df739 · b8f96c28 · a65c8c10 · f330ce78 · af722274 · a5f22153
```
Check after every build:
```bash
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "$BAD" | grep -q "$NEW" && echo "BAD HASH" || echo "HASH CLEAN: $NEW"
```

---

## 7. Build Pipeline Reference

```bash
# Beta build (for preview pod testing)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build.log 2>&1 &
sudo supervisorctl restart frontend

# Production build
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build > /app/memory/build-prod.log 2>&1 &

# Package production zip
cd /app && rm -f mygenie-prod-build.zip && zip -r /app/mygenie-prod-build.zip frontend/build/
# Copy to build/ for download
cp /app/mygenie-prod-build.zip /app/frontend/build/mygenie-prod-build.zip
```

---

## 8. CMS Access
```
Ctrl+Shift+E on any page → CMS login
admin / admin123   OR   editor / editor123
```

---

## 9. Key Files Reference

| File | Purpose |
|---|---|
| `/app/memory/CR_INTAKE_REGISTER.md` | Full CR register (220 CRs) |
| `/app/memory/CR-220_Line_By_Line_Plan.md` | Enhanced Conversions Fix A+C GTM steps |
| `/app/memory/CR-220_Enhanced_Conversions_Impact_Analysis.md` | Full EC gap analysis |
| `/app/frontend/src/lib/gtm.js` | buildLeadPayload (user_data added), consent mode |
| `/app/frontend/public/index.html` | GTM defer script, consent defaults |
| `/app/frontend/src/data/content.js` | TRUST_LOGOS array (CR-215B) |
| `/app/frontend/scripts/prerender.js` | Hero preload injection (LCP fix) |
| `/app/backend/.env` | All backend env vars |
| `/app/frontend/.env` | REACT_APP_BACKEND_URL (platform URL) |

---

## 10. Next Session First Tasks (in order)

1. **CR-216:** Go to GTM → Variables → find `{{GA4 ID}}` → note literal value → attempt Connected Site Tags fix
2. **CR-220 Fix A + C:** GTM "GA4 - Book demo" tag → User-Provided Data variable; "GAds - Book Demo" tag → Automatic → Code
3. **LCP preload fix:** Update `scripts/prerender.js` to inject `imagesrcset` preload hint for mobile
4. **CR-215B:** Get owner to select 20 logos from the 56 in `TRUST_LOGOS`, then remove the rest
5. **CR-191:** 1-line fix in `DemoLanding.jsx:77`
6. **Re-run Lighthouse** after each fix

---

## 11. Quick Health Check

```bash
# Services running?
sudo supervisorctl status

# Build exists?
ls /app/frontend/build/index.html && echo "BUILD OK" || echo "REBUILD NEEDED"

# Current build hash + URL target
ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o 'main\.[a-f0-9]*\.js'
grep -o "beta\.mygenie\.online\|www\.mygenie\.online" /app/frontend/build/index.html | head -1

# Backend responding?
curl -s http://localhost:8001/api/ | python3 -c "import sys,json; print(json.load(sys.stdin))"

# RUM beacon gone from production?
curl -s https://www.mygenie.online | grep -c "cdn-cgi/rum"
# Expected: 0

# Brand image cache?
curl -sI https://www.mygenie.online/brand/banner.webp | grep cache-control
# Expected: max-age=2592000
```

---

*Handover written 2026-09-05. E1 Agent. Session 8.*
*Previous handover: `/app/memory/HANDOVER_2026-09-05_Session7.md`*
*Full CR register: `/app/memory/CR_INTAKE_REGISTER.md`*
