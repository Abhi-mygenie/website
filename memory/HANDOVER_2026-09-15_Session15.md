# Agent Handover — 2026-09-15 · Session 15
# Batch BE Implemented and QA'd (CR-265 → CR-268). Preview auditable. Production build pending.

**Written by:** E1 Agent (implementation + QA role)
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: 14sep · HEAD at session start `89b4f51`
**Preview URL:** value of `REACT_APP_BACKEND_URL` in `/app/frontend/.env` (do not hard-code)
**Production:** https://www.mygenie.online
**Previous handover:** `HANDOVER_2026-09-14_Session14.md`
**Build hash this session:** `main.c03c05dd.js` (preview only — prod build not yet done)

---

## HOW TO USE THIS HANDOVER

1. Read §2 (what was done) — 3 minutes.
2. Read §3 (preview audit guidance) — important before telling the owner "go ahead and deploy".
3. Owner deploys production build → §4 (post-deploy checklist).
4. After deploy: 48h read per §5.

---

## 1. System State (end of session)

| Service | Status | Notes |
|---------|--------|-------|
| frontend | RUNNING (3000) | Static build served by `scripts/static-server.js`. Build hash `main.c03c05dd.js`. **`build/` is wiped on pod restart — run `cd /app/frontend && yarn build` if missing.** |
| backend | RUNNING (8001) | Healthy. Remote MongoDB (`52.66.232.149`). Calendly webhook 400 warning is known/expected (signing key not set). |
| MongoDB | remote `test_database` | Preview DB only. Production leads live elsewhere. |

---

## 2. What Was Done This Session

### Planning documents written (no code)
- `/app/memory/CR-265-268_BatchBE_ImpactAnalysis.md` — full impact analysis for all 4 CRs, written from source
- `/app/memory/CR-265-268_BatchBE_Line_By_Line_Plan.md` — exact OLD→NEW search-replace strings for every edit, 15-point QA checklist

### Batch BE implemented (11 files, 1 deleted)

| CR | What changed | Files |
|----|-------------|-------|
| CR-265 | 25 CTAs on 5 Alpha LPs: `<button onClick>` → `<a href="#lp-demo" onClick={e=>{e.preventDefault(); openSheet();}}>` | `RestaurantBillingSoftware.jsx`, `RestaurantPosSystem.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx` |
| CR-266 | `ScrollToTop` in `App.js`: added `useRef(true)` first-run guard — no longer fires `scrollTo(0,0)` on initial mount | `App.js` |
| CR-267 | `pushEvent("cta_click", { cta_location, page_path })` in every LP CTA handler + sticky bar; `pushEvent("sheet_open", { sector })` in `DemoBottomSheet` on `[open]` change | 5 LP files, `DemoBottomSheet.jsx`, `StickyMobileCta.jsx` |
| CR-268 | Removed `ConsentBanner` entirely (file deleted, import removed, render removed). Removed `body.consent-banner-open` CSS. Removed StickyMobileCta MutationObserver + consentUp state → always `translate-y-0`. Removed prerender.js banner-strip. **Consent Mode v2 signals (`setDefaultConsent`) kept intact.** | `App.js`, `StickyMobileCta.jsx`, `index.css`, `prerender.js`, deleted `ConsentBanner.jsx` |

### Build
- `yarn build` run successfully — `craco build` + prerender of all 60+ routes including all 5 Alpha LPs.
- Frontend restarted, serving `main.c03c05dd.js`.

### QA results (testing agent, `/app/test_reports/iteration_1.json`)
All 12 CR-specific tests passed:

| Test | Result |
|------|--------|
| CR-265: 5 `<a href="#lp-demo">` per Alpha LP (all 5 pages) | ✅ PASS |
| CR-265: Hero CTA opens sheet after React mount | ✅ PASS |
| CR-265: In-page `#lp-demo` fallback form present on all 5 pages | ✅ PASS |
| CR-266: `scrollY` NOT reset to 0 on first mount | ✅ PASS |
| CR-267: `cta_click { cta_location: "hero" }` in dataLayer | ✅ PASS |
| CR-267: `sheet_open { sector: "billing-software" }` in dataLayer | ✅ PASS |
| CR-268: `[data-testid="consent-banner"]` absent from all pages | ✅ PASS |
| CR-268: Submit button + "No spam" fully visible at 390×844 | ✅ PASS |
| CR-268: StickyMobileCta at `bottom-0`, no `-translate-y-12` | ✅ PASS |
| CR-268: `consent default` entries still in dataLayer on load | ✅ PASS |
| Control: Homepage unchanged | ✅ PASS |
| Control: `/petpooja-alternative` unchanged | ✅ PASS |
| Form submit → OTP | ⚪ N/A — antiBot (`MIN_FILL_MS=2000`) correctly blocks Playwright instant fill. API confirmed working via curl. Pre-existing design, unrelated to this batch. |

**Source is clean:** `grep -r "ConsentBanner\|consent-banner" /app/frontend/src/` = zero matches.

---

## 3. Preview Audit Guidance — What You Can and Cannot Test on Preview

### ✅ Can be audited fully on preview

| Audit item | How |
|-----------|-----|
| Visual — no consent banner on any page | Open any page in browser, first visit (clear storage). No strip at bottom. |
| CTA element type — `<a>` not `<button>` | Right-click → Inspect hero/navbar/pricing buttons. Should show `<a href="#lp-demo">`. |
| Anchor fallback behaviour | Open Alpha LP, disable JS in DevTools, click any CTA. Should scroll to `#lp-demo` section with form. |
| Sheet opens on CTA click (JS ready) | Click any CTA normally. Sheet slides up. |
| Scroll preservation (CR-266) | Open an Alpha LP, scroll down during load (or after). Reload — page no longer snaps to top on React mount. |
| `window.dataLayer` events (CR-267) | Open DevTools Console, navigate to any Alpha LP, click a CTA: `window.dataLayer.filter(e=>e.event==='cta_click')`. Open sheet: `window.dataLayer.filter(e=>e.event==='sheet_open')`. |
| `consent default` entries in dataLayer | `window.dataLayer.filter(e=>e[0]==='consent')` — should show EEA/GB denied, everyone else granted. |
| StickyMobileCta position | On mobile emulation (390px), scroll past hero. Sticky bar should sit flush at bottom (not 48px up). |
| Form submission end-to-end | Fill the sheet form manually (take >2s), submit → OTP screen appears. OTP arrives on phone. Sheet advances to Calendly slot picker. |

### ❌ Cannot be audited on preview (preview hostname not in ALLOWED_HOSTS)

| Item | Reason | Where to verify instead |
|------|--------|------------------------|
| GTM Tag Assistant | `gtmAllowed()` returns false for preview hostname — GTM container script never loads | Verify on production after deploy |
| GA4 DebugView (`cta_click`, `sheet_open` events) | GA4 tags don't fire without GTM | Verify on production after owner adds GTM tags |
| Google Ads conversion tags | Same — GTM not loaded | Post-deploy prod verification |
| Meta Pixel | Same | Post-deploy prod verification |

**Summary:** The preview is fully sufficient to confirm the four CRs work correctly. GTM/GA4/Ads tag verification requires production.

---

## 4. Owner: Post-Deploy Checklist

### Production build command
Run from `/app/frontend` (or equivalent on prod build machine):
```bash
REACT_APP_BACKEND_URL=https://www.mygenie.online \
REACT_APP_GTM_ID=GTM-K5D84Z3L \
REACT_APP_WHATSAPP_ENABLED=false \
yarn build
```

### Deploy steps
1. Zip `frontend/build/`.
2. Deploy to production server.
3. Cloudflare → **"Purge Everything"**.
4. **Record in `CR_INTAKE_REGISTER.md`:** new `main.*.js` hash + IST time of deploy. (This is the mistake that cost a day in Session 13/14 — do not skip.)

### GTM actions (CR-267) — owner runs in GTM-K5D84Z3L
1. New trigger: Custom Event, Event Name = `cta_click` (name: "CE - cta_click")
2. New trigger: Custom Event, Event Name = `sheet_open` (name: "CE - sheet_open")
3. New GA4 event tag: fires on CE - cta_click trigger → event name `cta_click`, params: `cta_location`, `page_path`
4. New GA4 event tag: fires on CE - sheet_open trigger → event name `sheet_open`, param: `sector`
5. **Mark both tags as NOT conversions.**
6. Publish GTM container.

### GA4 actions (CR-267) — owner runs in GA4 property 455083409
1. Admin → Custom Definitions → Create event-scoped custom dimension: `cta_location`
2. Create event-scoped custom dimension: `form_location`
3. (These are needed to see the params in GA4 reports and DebugView)

### Post-deploy production verification
- `curl -s https://www.mygenie.online/restaurant-billing-software | grep -c 'href="#lp-demo"'` → expect 5
- `curl -s https://www.mygenie.online/restaurant-billing-software | grep -c 'consent-banner'` → expect 0
- Open in browser: no consent strip; CTA is `<a>`; sheet opens; dataLayer has events.
- GTM Tag Assistant on prod: click hero CTA → `cta_click` fires → `sheet_open` fires.
- Mark CR-265, CR-266, CR-267, CR-268 as ✅ CLOSED in `CR_INTAKE_REGISTER.md` with hash + IST time.

---

## 5. Post-Deploy Reads (owner + next agent)

### 48-hour read (CR-267 data)
- Google Ads campaign: Conversions column for Alpha campaign (same 5 pages)
- GA4: `cta_click` event count by `cta_location` — confirms buttons are being tapped
- GA4: `sheet_open` events — confirms sheet is actually opening after tap
- Funnel: `cta_click → sheet_open → form_start → form_submitted` — any drop-off between cta_click and sheet_open (< 95%) flags a sheet issue
- **Do not conclude lead rate has recovered until 7-day read** (48h is only ~24 paid sessions per page)

### 7-day lead read
- Judge against the D4 baseline (see §7 below and `REPLY_3_2026-09-14_AlphaCTA_GitEvidence.md`)
- If leads return to ~2–3/week per Alpha page: CR-265 fixed the dead window. Close as resolved.
- If leads do NOT return: re-read Reading 3 in REPLY_3 doc. The pages may never have converted paid traffic. Next step is a landing-page/offer audit (CR-250 territory), not another CTA fix.

---

## 6. Open Owner Items (unrelated to this session's code)

| Item | Detail |
|------|--------|
| **D4 query** (10 min) | Prod Mongo: `demo_requests` 8–10 Sep on Alpha pages — names/phones to confirm whether those were test sessions or real leads. Determines the true baseline for CR-265 success criteria. |
| **CR-263** | Calendly webhook signing key still missing. Startup warning harmless but webhook verification is off. Owner provides key → add to `/app/backend/.env`. |
| **WhatsApp FAB** | `REACT_APP_WHATSAPP_ENABLED` not set in preview `.env` → FAB shows on preview, compiled out on prod (correct). No action needed unless preview parity is wanted. |

---

## 7. Dead Ends / Do Not Repeat

- `grep -c` on minified single-line HTML counts LINES not occurrences. Use `grep -o '...' | wc -l` for counts in prerendered HTML.
- Preview GTM never fires — `gtmAllowed()` checks hostname against `www.mygenie.online,mygenie.online`. Don't spend time debugging GTM on preview.
- Preview MongoDB (`test_database`) has no production leads.
- AntiBot (`MIN_FILL_MS=2000`) blocks Playwright instant form fills. Form works correctly with real >2s human interaction.
- Pod restart wipes `build/`. Always rebuild with `yarn build` after restart if build is missing.
- `pip install -r requirements.txt` conflicts (`emergentintegrations` vs `litellm`). All packages already installed. Don't re-run requirements.txt.

---

## 8. Key File References

| File | Relevance |
|------|-----------|
| `frontend/src/App.js` L14–22 | `ScrollToTop` with `isFirstRun` guard (CR-266) |
| `frontend/src/pages/RestaurantBillingSoftware.jsx` L35/89/144 | Navbar/pricing/hero anchors (CR-265/267) |
| `frontend/src/components/site/DemoBottomSheet.jsx` ~L52–57 | `sheet_open` useEffect (CR-267) |
| `frontend/src/components/home/StickyMobileCta.jsx` L61/46–48 | `translate-y-0` always + `cta_click` in handleClick (CR-267/268) |
| `frontend/src/lib/gtm.js` L61 | `pushEvent` helper — unchanged |
| `public/index.html` L9–35 | Inline consent defaults — unchanged, must stay |
| `/app/memory/CR_INTAKE_REGISTER.md` bottom | Batch BE status table |
| `/app/memory/CR-265-268_BatchBE_ImpactAnalysis.md` | Impact analysis (planning doc) |
| `/app/memory/CR-265-268_BatchBE_Line_By_Line_Plan.md` | Line-by-line plan (implementing reference) |
| `/app/test_reports/iteration_1.json` | QA results for this session |

*Handover written 2026-09-15. E1 Agent. Session 15. Preview build `main.c03c05dd.js`. Production build not yet done — owner action required.*
