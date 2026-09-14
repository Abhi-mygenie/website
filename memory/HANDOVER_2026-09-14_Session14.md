# Agent Handover — 2026-09-14 · Session 14
# Alpha Landing-Page Lead Drop: Investigation, Decisions, Batch BE Approved (no code changed)

**Written by:** E1 Agent (investigation / intake role — **zero source edits this session**)
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main · HEAD `89b4f51` (10 Sep 10:11 IST) — no source commits since
**Preview URL:** value of `REACT_APP_BACKEND_URL` in `/app/frontend/.env` (do not hard-code)
**Production:** https://www.mygenie.online · live bundle `main.b23cd364.js` · HTML `Last-Modified` 11 Sep 07:17 UTC (12:47 IST)
**Previous handover:** `HANDOVER_2026-09-10_Session13.md`

---

## HOW TO USE THIS HANDOVER

1. Read §2 (the problem and what was proven) — 5 minutes, do not skip; every change in §4 exists because of it.
2. Read §4 (approved CRs 265–268) — this is the work.
3. First actions: §6 checklist (rebuild preview if `build/` is missing, then write the two planning docs, then implement).
4. Owner communicates in English. Owner prefers: plain-English explanations, decisions recorded in `CR_INTAKE_REGISTER.md`, planning docs before code.

---

## 1. System State (end of session)

| Service | Status | Notes |
|---|---|---|
| frontend | RUNNING (3000) | `scripts/static-server.js` serves `frontend/build/` — **`build/` is wiped on every pod restart; run `cd /app/frontend && yarn build` (≈2 min) then `sudo supervisorctl restart frontend`** |
| backend | RUNNING (8001) | Healthy. Known warning: Calendly webhook 400 `signing_key must be filled` (CR-263, owner) |
| MongoDB | remote, `DB_NAME=test_database` | **This is the preview DB, not production.** Production leads live elsewhere; only the owner can query them. |

`frontend/.env` lacks `REACT_APP_WHATSAPP_ENABLED=false` → preview build shows the WhatsApp FAB; production build has it compiled out (correct). Do not "fix" prod for this; if you want parity on preview, add the key via `search_replace`, never rewrite the file.

---

## 2. The Problem — and what this session proved

### 2.1 Symptom (owner's Google Ads table, Alpha campaign 23284649500)

| Date | Clicks | Spend | Conversions |
|---|---|---|---|
| 8 Sep | 30 | ₹2,833 | 2 |
| 9 Sep | 27 | ₹2,747 | 3 |
| 10 Sep | 28 | ₹2,596 | 3 |
| 11 Sep | 21 | ₹2,201 | **0** |
| 12 Sep | 28 | ₹2,198 | **0** |
| 13 Sep | 22 | ₹2,205 | **0** |
| 14 Sep (partial) | 14 | ₹1,365 | **0** |

Five "Alpha" pages: `/restaurant-billing-software`, `/restaurant-pos-system`, `/restaurant-management-software`, `/cloud-kitchen-pos`, `/qsr-pos-system`. Control pages on the **same build, same GTM, same backend** keep converting: `/petpooja-alternative` (13 Book demo / 197 paid sessions 11–13 Sep) and the homepage.

**Owner's operative position (14 Sep evening):** *"Put analytics aside. 85 clicks, ~₹8,000, zero conversions for four days is real."* Fix what is provably broken on our side now.

### 2.2 What is structurally different about the five Alpha pages (verified on live HTML 14 Sep)

| | Homepage | Petpooja | 5 Alpha pages |
|---|---|---|---|
| Hero "Book a Free Demo" | `<a href="#demo">` + onClick opens sheet (CR-157) | `<a href="#vsp-demo">` | `<button type="button" onClick={openSheet}>` |
| Pricing CTAs | – | `<a href="#vsp-demo">` ×3 | `<button>` ×3 |
| Navbar / sticky | buttons | buttons | buttons |
| **Any path to the form without JavaScript?** | **Yes** | **Yes** | **No — zero `href="#…"` on the page** |

The Alpha pages had `<a href="#lp-demo">` until **CR-230** (8 Sep, center modal) and then **CR-259** (8 Sep, bottom sheet) replaced them with JS-only buttons without keeping the href fallback.

### 2.3 Two defects reproduced on production (Playwright, 390×844, JS delivery delayed 2.5 s)

**Defect 1 — dead window.** `src/index.js` uses `createRoot` (not hydration, CR-205) and waits for `main.js` (148 KB gz, `defer`) **plus** the page chunk (≤3 s race) before the first render. The prerendered HTML is visible immediately but every `<button onClick>` is inert until then — 1–5 s on real phones. Measured: tap hero CTA at 0.9 s → nothing; same tap after mount → sheet opens. An `<a href>` works at 0 s.

**Defect 2 — scroll yank.** `src/App.js` `ScrollToTop` runs `window.scrollTo(0,0)` on React's first mount when the URL has no hash. A visitor who scrolled the prerendered page while waiting is thrown back to the top. Measured: `scrollY` 1116 → 0 at ~2.8 s. Anchor clicks put `#…` in the URL and escape this; buttons never do. Explains the mobile scroll-to-90 % drop 30 % → 12 %.

Both defects only became user-visible when the **prerendered** build reached production (CR-200, ~9–10 Sep); the old CSR build (`cf3fd6a7`) showed nothing before React, so there was no dead window to tap into.

### 2.4 What was ruled out
- Tracking/GTM/GA4/Ads reconciliation (ads-ops), tracking params, cached HTML variants, missing assets, consent-mode defaults, ads-side config, bundle API base (`https://www.mygenie.online/api` confirmed), console errors (none), env (WhatsApp FAB correctly compiled out), old-browser exposure (~2 % on both Alpha and Petpooja — not the discriminator).
- **"Something else changed on 11 Sep" (Reading 2):** git proves the 10 Sep build (`01355ca7`) and the 11 Sep build (`b23cd364`) are the **same LP source** (`git diff 32e2de5 HEAD -- frontend/src` = empty; only lockfile drift `react-router` 7.15.0 vs 7.15.1).

### 2.5 What is NOT settled (parked by owner, keep on record)
- **Whether 8–10 Sep was a real baseline.** Since the 4 Sep page swap the Alpha pages converted in exactly one window, 8–10 Sep (5 leads, 4 on billing, 83 % form_start→booked with zero abandons) — the same window as agent QA Sessions 9–13 and owner production checks on these pages. "Reading 3": those were team/test sessions via the live ad. Decisive check = **D4**: prod Mongo `demo_requests` 8–10 Sep — `name`, `phone`, `source_page` (`*-quick-book` = sheet, `sector:*` = in-page form), `attribution.gclid`, city. Owner has not run it yet.
- **What `main.6dc7dd67.js` was** (owner deploy between 8 Sep evening and 10 Sep). Any build from GitHub after 9 Sep 15:01 IST contains the sheet. If `6dc7dd67` had JS-only buttons and still produced the 9–10 Sep leads, the dead window is a real defect but **not the cause of the break**. Only the owner can answer (D1–D3).
- **Consequence for success criteria:** CR-265's business criterion is *"the CTA provably works"* (`cta_click → sheet_open ≥ 95 %`), **not** "lead rate returns to 9.4 %". If leads do not return after the fix, do **not** conclude the sheet is broken on devices — first get D4.

### 2.6 Documents (read in this order)
1. `INVESTIGATION_2026-09-14_AlphaCTA_Brief_Validation.md` — validation of the ads-ops brief, code refs.
2. `REPLY_BRIEF_2026-09-14_AlphaCTA_Questions.md` — questions D1–D12 sent to owner/ads-ops.
3. `REPLY_3_2026-09-14_AlphaCTA_GitEvidence.md` — git evidence, Reading 3, D4 query, §7 Ads-table addendum.
4. `CR_INTAKE_REGISTER.md` → **BATCH BE** (CR-265–268, full field tables, line refs, acceptance).
- Original inbound brief from ads-ops is not in the repo (artifact `alpha-cta-brief.md`); its content is summarised in doc 1.

---

## 3. Owner Decisions This Session (all recorded in `CR_INTAKE_REGISTER.md`)

| # | Decision | Date |
|---|---|---|
| 1 | Investigation role only; **do not edit code** until planning docs are approved | 14 Sep |
| 2 | Register the CTA fix as a CR before any change → CR-265, with 266/267 | 14 Sep |
| 3 | Analytics interpretation parked; Ads table is the operative fact; **ship the fixes now, do not wait for D4** | 14 Sep evening |
| 4 | Consent banner: **Option A — remove entirely**, keep region-aware Consent Mode v2 defaults → CR-268 | 14 Sep evening |
| 5 | Ship 265 + 266 + 267 + 268 in **one build** | 14 Sep evening |
| 6 | Campaign stays live throughout | 14 Sep |

---

## 4. Approved Work — BATCH BE (next agent implements)

House rule: **impact analysis + line-by-line plan as separate docs → owner reviews → implement.** Do not skip.

### CR-265 — Alpha LP CTAs: `<a href="#lp-demo">` + sheet `onClick` · P0 Revenue
- **Why:** §2.2/2.3. Restores a JavaScript-free path to the form (the homepage's own CR-157 pattern); sheet behaviour unchanged when JS is ready.
- **Pattern:** `<a href="#lp-demo" onClick={(e) => { e.preventDefault(); openSheet(); }} className=… data-testid=…>` — keep classes and testids identical.
- **Edits (14 Sep line refs):**
  `RestaurantBillingSoftware.jsx` L35 navbar (`onDemo`), L89 pricing ×3, L144 hero ·
  `RestaurantPosSystem.jsx` L35, L89, L151 ·
  `RestaurantManagementSoftware.jsx` L35, L89, L144 ·
  `CloudKitchenPos.jsx` L37, L91, L154 ·
  `QsrPosSystem.jsx` L35, L89, L153.
  Navbar CTA: `<a href="#lp-demo" onClick={(e)=>{e.preventDefault(); onDemo();}}>`.
- **Keep** the in-page `<section id="lp-demo" … scroll-mt-20">` + `<DemoForm shortForm>` on all 5 pages — it is the fallback target.
- **Sticky bar** (`StickyMobileCta.jsx` L77, shared by 15+ pages): leave as `<button>` in this CR (appears only after scrolling; React is mounted by then). Follow-up idea: optional `href` prop.
- **Watch:** pricing-card `<a>` must keep `block w-full text-center`; update any test selector using `button[data-testid=…]`; on mobile the `#lp-demo` anchor lands on the section heading with fields a screen below (CR-230's original complaint) — acceptable as fallback; a "form-first on mobile" tweak is a separate CR.
- **Acceptance:** ≥5 `href="#lp-demo"` per page in prod HTML · throttled tap before mount → `location.hash === "#lp-demo"`, form in viewport · tap after mount → `quick-demo-sheet` has `translate-y-0`, hash unchanged · submit → `POST /api/demo-request` 200 + dataLayer `form_submitted{form_location:"quick_book_sheet"}` · Lighthouse mobile not worse.

### CR-266 — `ScrollToTop` first-mount guard · P1
- **Why:** §2.3 defect 2.
- **Edit:** `App.js` L15–21. Skip `window.scrollTo(0,0)` on the initial mount (e.g. `useRef` first-run flag, or skip when `window.scrollY > 0` at mount). Route-change behaviour unchanged.
- **Acceptance:** throttled load, `scrollTo(0,1500)` at 1 s → after `window.__pageChunks` is set, `scrollY` ≈ 1500 · client-side nav to another page → `scrollY` 0.

### CR-267 — `cta_click` + `sheet_open` dataLayer events · P1 Observability
- **Why:** today a dead button is indistinguishable from an uninterested visitor (no event between `page_view` and `form_start`).
- **Edits:** `pushEvent("cta_click", { cta_location: "hero"|"navbar"|"pricing-<plan>"|"sticky", page_path })` in each CTA handler (5 LPs + `StickyMobileCta.jsx`); `pushEvent("sheet_open", { sector })` in `DemoBottomSheet.jsx` via `useEffect` on `[open]` when it turns true. `lib/gtm.js` `pushEvent` already exists — no change there.
- **Owner (GTM-K5D84Z3L):** 2 Custom Event triggers + 2 GA4 event tags; register `cta_location` and `form_location` as event-scoped custom dimensions in GA4 (D7 could not be answered because `form_location` was never registered). Not conversions.
- **Acceptance:** Tag Assistant on prod: tap hero → `cta_click{cta_location:"hero"}` then `sheet_open{sector}`; both in GA4 DebugView.

### CR-268 — Remove consent banner (Option A); keep Consent Mode v2 defaults · P1
- **Why:** 48 px strip on every first visit (= every paid click); same `z-[70]` as the sheet and mounted after `<Routes>` → overlaps the sheet's bottom edge (submit clears by 8 px, "No spam" hidden — measured); pushes sticky CTA up; competing tap target; reflexive "Decline" kills tracking. For India visitors consent is already `granted` by default, so the banner can only lose data. Owner's own tests never see it (choice stored) — a real test-vs-production difference.
- **Compliance basis:** region-aware defaults (CR-219) in `public/index.html` + `lib/gtm.js`: EEA/GB `denied`, everyone else `granted`. Google's EU consent policy is met by the signals, not the UI. India DPDP 2023 does not mandate such a banner; `/privacy` link stays in footer. Campaigns are 100 % India. If EU ads ever start → new CR: EEA/UK-only banner using `CF-IPCountry` or `backend/geo.py`.
- **Edits:** `App.js` L8 import + L81 render → remove · delete `components/site/ConsentBanner.jsx` · `index.css` L70–77 `body.consent-banner-open` rules → remove · `StickyMobileCta.jsx` L3 import, L13 state, L20–25 observer, L71 offset → simplify to always `translate-y-0` · `scripts/prerender.js` L119–120 banner strip → remove (no-op) · `lib/gtm.js`: **keep** `setDefaultConsent`, `updateConsent`, `CONSENT_KEY` (restores a previously stored Decline — correct); `hasConsentChoice`/`setConsentChoice` become unused · `public/index.html` consent default block → **unchanged**.
- **Acceptance:** `grep -c consent-banner` = 0 on prod HTML · 390×844 cleared storage: no strip, sticky CTA flush at bottom, open sheet unobstructed · dataLayer still shows region-aware `consent default` on load; GA4/Ads fire for an India visitor with no click · `body.consent-banner-open` never applied.
- Mark CR-93 / CR-139 / CR-201 banner notes as superseded in the register when done.

---

## 5. Other findings — NOT approved, register only if owner asks

| Finding | Detail |
|---|---|
| `browserslist.production` = "last 2 versions" | Near-zero transpilation; ~2 % of paid traffic (old Android/iOS) gets a dead page. CR-265 anchors become their only path. One-line change + bundle-size check. |
| Sticky mobile CTA has no href fallback | Same defect class, lower risk. Optional `href` prop. |
| `#lp-demo` lands on heading on mobile, fields a screen below | Matters more once it is the fallback. Reorder form above heading on mobile. |
| Production builds are made off-repo | `b23cd364` built with a different lockfile than the repo. Owner should build from repo `yarn.lock` and record hash + IST time per deploy. |
| Ads shows 8 conversions 8–10 Sep vs GA4 5 Book demo | Campaign column counts >1 conversion action; ads-ops to segment by action. |
| CR-263 Calendly signing key | Still missing; owner provides. |

---

## 6. First Actions for Next Agent (in order)

```bash
# 0. Preview build is probably gone after pod restart
ls /app/frontend/build/index.html || (cd /app/frontend && yarn build > /root/build.log 2>&1 && sudo supervisorctl restart frontend)
```
1. Write `CR-265-268_BatchBE_ImpactAnalysis.md` and `CR-265-268_BatchBE_Line_By_Line_Plan.md` in `/app/memory` (use the field tables in the register; one plan covering all four CRs, grouped per file). Ask owner to approve.
2. Implement exactly per plan. No scope creep (no sticky-bar href, no browserslist, no form reorder unless owner adds them).
3. QA on preview via testing agent: the 5 LPs + homepage + Petpooja, desktop 1920 and mobile 390; throttled-JS tap test (hash set, form in view); post-mount tap opens sheet; scroll-preservation test; no consent banner; sheet submit → OTP screen; `cta_click`/`sheet_open` in `window.dataLayer`; Petpooja/homepage unchanged.
4. Production build: `REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L REACT_APP_WHATSAPP_ENABLED=false yarn build`; zip `frontend/build/`; record `main.*.js` hash. Owner deploys + Cloudflare "Purge Everything" + **records IST time in the register** (this session lost a day to unknown deploy times — do not repeat).
5. Post-deploy verification on prod: acceptance lines of all four CRs (§4). Update register statuses to ✅ with hash + time.
6. Remind owner: GTM tags + GA4 custom dimensions (CR-267), D4 query (interpretation only), CR-263 key.
7. 48 h read: Ads conversions column + `cta_click → sheet_open → form_start`. 7-day lead read. Interpret per §2.5.

---

## 7. Dead ends / do-not-repeat
- `Last-Modified` is not a deploy log — three builds reached prod in 8–11 Sep. Always ask for hash + time.
- Preview Mongo (`test_database`) has no production leads; do not draw lead conclusions from it.
- Wayback Machine has no snapshots of these pages for 8–11 Sep.
- Cloning to `/tmp` is lost on pod restart; use `/root/…` for scratch (bare clone of repo history is at `/root/website_hist` if still present).
- `pip` full re-resolve of `requirements.txt` conflicts (`emergentintegrations` vs `litellm`); packages are already installed — don't rerun.

---

## 8. Key file references
`frontend/src/index.js` L41–48 (createRoot + preload race) · `frontend/src/App.js` L15–21 ScrollToTop, L81 ConsentBanner · `frontend/src/components/site/DemoBottomSheet.jsx` L166–175 z-index · `frontend/src/components/site/ConsentBanner.jsx` · `frontend/src/components/home/StickyMobileCta.jsx` · `frontend/src/components/home/Hero.jsx` L45–48 (CR-157 reference pattern) · `frontend/src/lib/gtm.js` L78–140 consent · `frontend/public/index.html` L9–35 consent defaults, L56–87 GTM loader · `frontend/scripts/prerender.js` L119 · 5 LP files under `frontend/src/pages/`.

*Handover written 2026-09-14. E1 Agent. Session 14. Session closed at owner's request; no code changed.*
