# PRD - MyGenie Website

> Last updated: 2026-06-08 — Phase 2d + full Phase 2 regression (iteration_6/7) PASS · CR-1b Freshsales mapping LIVE-VERIFIED + Multi-Form tag · **Next: CR-4B OTP (planned, see `/app/CR-4B_OTP_Implementation_Spec.md`)**.

## Original Problem Statement
Pull code from https://github.com/Abhi-mygenie/website.git (8-june branch only),
wipe local /app and pull directly here, run and deploy. Then continue Phase 2 of
CR-6 (inline CMS): close out 2a (Pricing), 2b (AI page), 2c (Solutions+Product detail pages),
and ship 2d (Solutions/Product index hero copy + two LOW QA fixes folded in).

## Architecture
- Backend: FastAPI + Motor (async MongoDB) + JWT CMS auth
- Frontend: React 19, CRA + craco, Tailwind, Radix UI, Lucide icons
- DB: MongoDB (`test_database`); CMS overrides live in collection `cms_content`
- Integrations (env-driven): Freshsales CRM, Calendly webhook

## CMS Framework (CR-6) — current state
- `CmsProvider` (auth/draft/preview/publish/discard/audit)
- `EditableText` (plain + rich), `EditableImage` (upload + paste-URL), `EditableList` (text/textarea/`lines`/image/bool, dot-path keys, `lockItems`), `EditableFaqList`
- `useContent`, `useContentDoc(key, fallbackObj)`, `useSaveDoc()`
- `mergeUtils.js` → `mergeByIndex(base, override, preserveKeys=['icon'])` (used by SectorPage/ProductPage)
- Admin layer at `/components/cms/CmsAdminLayer.jsx`; entry via `?admin=1` or Ctrl+Shift+E

## What's been implemented

### Setup & deployment (2026-06-08)
- Wiped /app, pulled `8-june` branch directly; backend + frontend `.env` configured
- Both running under supervisor; deployment readiness check PASS

### CR-6 Phase 1 — DONE & QA passed (iteration_1, iteration_2)
- Inline CMS framework, admin auth, draft → preview → publish
- Home, Blog (per-article CRUD), trust-band metrics+logos, audit chip

### CR-6 Phase 2a — Pricing — DONE & QA passed (iteration_3, 100%)
- Hero (eyebrow/h1/sub) + plans (`lockItems`, `lines` for `includes`) + add-ons + annual labels
- `mergeById` preserves `id`, `includedAddons`, `icon`; coerces price/popular types
- RecommendQuiz logic + `QUIZ` data stay code-controlled

### CR-6 Phase 2b — AI page — DONE & QA passed (iteration_4, 100%, 12/12 flows)
- All 3 framework additions LANDED (`lines`, FAQ editor, `useContentDoc`)
- Hero + `AI_FEATURES` (`outcome.value/label` dot-path + video/poster) + crosslink + FAQ heading + demo
- `mergeFeatures` preserves `id` + `icon`
- Hydration warning fixed (no `block` on `EditableText` inside `<p>`)

### CR-6 Phase 2c — Solutions ×11 + Product ×6 — DONE & QA passed (iteration_5, 100%, 17 pages)
- **153 editors auto-wired by writing only 2 page templates**
- `SectorPage.jsx` slug-driven → `sector.<slug>.{hero.*, metric.*, pains, solutions, proof, faqs}` (9 × 11 = 99)
- `ProductPage.jsx` bucket-driven → `product.<bucket>.{hero.*, metric.*, video, modules, proof, faqs}` (9 × 6 = 54)
- `mergeByIndex` preserves code-controlled `icon` SVGs across overrides
- Module `caps[]` use `lines` field; product video editable via `lockItems` single-row list (mp4/webm + YouTube/Vimeo)
- Dynamic section sub-headings (`s.name.toLowerCase()` interpolations) stay code-controlled (Phase 3)
- Invalid-slug safety via stable `__missing` docKey (no React hooks-order error)

## CR-6 Phase 2d — DONE & QA passed (iteration_6, 100%, 0 bugs)
Owner-approved 2026-06-08 post iteration_5. Three sub-slices, one branch, one G4 sweep — all GREEN.

- **2d.1 (P0)** ✅ — `SolutionsIndex.jsx` + `ProductIndex.jsx` hero copy via `EditableText`. Keys: `solutions.index.hero.{eyebrow,h1,sub,cta}`, `product.index.hero.{eyebrow,h1,sub,cta}`. Hero sub uses `multiline rich` (no `block`) → 0 hydration warnings. h1 round-trip → publish → logged-out render verified both pages.
- **2d.2 (P1)** ✅ — backfilled 2nd proof card for `food-courts` (Phoenix Food Plaza) and `canteens` (TechPark Central Canteen) in `data/sectors.js`; all 11 sectors now ship 2 proof cards.
- **2d.3 (P1)** ✅ — `CmsProvider.jsx` persists last-used mode in `localStorage` (`cms.editMode`/`cms.preview`); `login()` defaults **editMode=true for first-time admins** (pencils visible immediately) and restores prior mode for returning admins across reloads. Closes the iteration_5 "Preview-on-login hides pencils" gap.

QA: testing_agent → `/app/test_reports/iteration_6.json` (cleanup confirmed). All CR-6 Phase 1+2a+2b+2c+2d G4-passed → G5 owner smoke.

## CR-1b Freshsales `cf_` mapping — DONE & LIVE-VERIFIED (2026-06-08)
- Fixed `custom_fields`(plural, ignored) → **`custom_field`** (singular) + exact `cf_` names from owner's prod `$crmData`. 15 live fields on `/demo-request`/`/quote`/`/contact`; `external_id=web_<phone>`; `lookup_contact_by_phone` dedup; **`Multi-Form`** tag for repeat submitters. Verified with 3 real leads (`402209074834` merged Demo+Quote; `402209074908` Contact). Quote/ROI/preferred_contact → Mongo only; attribution fields → CR-2.

## CR-4B OTP (Demo form only) — BUILT & LIVE-VERIFIED (2026-06-08)
- Built via `integration_expert` first (auth-adjacent). New `backend/otp.py` (4-digit OTP, peppered HMAC-SHA256 hash, Mongo `otp_codes` w/ 1h TTL, 10-min validity, 30s resend, 5/hr, 5-attempt lock, signed 15-min JWT bound to phone). Endpoints `POST /api/otp/send` + `POST /api/otp/verify`; `/api/demo-request` accepts optional `otp_token` → verified lead or graceful `OTP-Unverified` Freshsales tag (never blocks). Frontend: `DemoForm.jsx` OTP step.
- **LIVE-VERIFIED**: `OTP_SMS_ENABLED=true`. Real SMS delivered to 7505242126 via owner's panel (HTTP 200), code verified → token issued. Live mode left ON.
- **Pending (owner-side, DLT)**: the SMS text ("Mygenie" mid-message + footer "TEAM HOSIGENIE") is fixed by the DLT-registered template `1707178030188539801`. To change footer to "Team MyGenie" / drop the stray "Mygenie", the owner must edit/re-register the DLT template, then send the new TemplateID → 1-line env swap (`SMS_TEMPLATE_ID`).

## CR-4B OTP (Demo form only) — ~~PLANNED~~ DONE (see above)

## CMS credentials (dev)
- `admin / admin123`, `editor / editor123` (see `/app/memory/test_credentials.md`)
- Env: `CMS_USER_1/PASS_1`, `CMS_USER_2/PASS_2` in `backend/.env`

## CR-2 Attribution & Data Capture — BUILT & LIVE-VERIFIED (2026-06-08)
- Frontend `lib/attribution.js` (first-touch localStorage / last-touch sessionStorage / device/os/browser/lang/tz / pages/time / gclid/fbclid/utm/_fbp) + `AttributionTracker` in `App.js`, attached to all 4 forms. Backend `_attribution_to_crm()` maps to Freshsales native (`first_source/medium/campaign`, `latest_source`=gclid (Option B), `latest_medium/campaign`) + cf_ (`cf_pos_satifcation_level`=utm_term, `cf_est_name`=utm_content, `cf_latitude`=fbclid, `cf_orders_taken_via`=_fbp, `cf_rooms`=otp). Full object stored in Mongo. First-touch preserved on repeat. LIVE-VERIFIED against Freshsales (iteration_9.json). **Geo/city DONE** — `backend/geo.py` (ipwho.is, keyless HTTPS) fills native `city` when none typed (typed city wins); region/country → Mongo `geo{}`. **Remaining missing CRM fields documented in `/app/CR-2_Attribution_Mapping.md` (landing/referrer/device/etc → Mongo-only until CRM fields created).**

## 🔜 NEXT TASK (for next agent) — CR-3 Analytics & Ads
- **GA4 + Meta Pixel** (client tags via env IDs: pageviews on route change + events `generate_lead`/`otp_verified`/`demo_booked`/`purchase`), then **server-side/offline conversions** (Meta CAPI + Google offline) using the `gclid`/`fbclid`/`_fbp`/geo already captured by CR-2.
- **Blocked on owner inputs:** GA4 Measurement ID + Meta Pixel ID (+ later CAPI token / Google Ads conversion label). Ask via `ask_human` first; use `integration_expert` for tag specifics; keep IDs in env. Re-confirm consent-banner requirement.
- Full orientation in `/app/HANDOVER.md` §3.

## Backlog / Phase 3 (deferred from Phase 2)
- **CR-7 (NEW, G1 Discovery only)** — Internal read-only **Leads View** for sales triage (source/medium/campaign/city/OTP/intent at a glance, no Freshsales needed). Read/aggregate layer over existing Mongo lead data — no new capture. Intake doc: `/app/CR-7_Leads_View_Discovery.md`. Needs G2 scope (auth/filters/actions/pagination) before build.
- **CR-2 missing CRM fields** — owner creates `cf_` fields for landing/referrer/device/lang/tz/pages/time/region/country/other click-ids → 1-line wire each in `_attribution_to_crm()` (`/app/CR-2_Attribution_Mapping.md`).
- **OTP DLT template** — owner re-registers SMS template footer to "Team MyGenie" → send new `SMS_TEMPLATE_ID`.
- **Icon picker** (Lucide-name typeahead) — change `icon` on sectors/solutions/features/modules
- **Dynamic section sub-headings** moved to CMS so each sector can have bespoke copy
- Per-page **SEO popover** (title/description editable)
- Razorpay capture, `react-snap` pre-render, Cloudflare 301 cutover (owner-blocked)
- (Optional growth) Metric A/B testing — `metric.alt` + 50/50 cookie bucketing + demo-form variant tagging

## Test reports
- `iteration_1.json` — Phase 1 G4
- `iteration_2.json` — Phase 1 carry-over G4 (BlogPost deep-link race fixed)
- `iteration_3.json` — Phase 2a Pricing G4 (100%)
- `iteration_4.json` — Phase 2b AI G4 (100%, 12/12 flows)
- `iteration_5.json` — Phase 2c Solutions+Product detail pages G4 (100%, 17 pages, no retest needed)
- `iteration_6.json` — Phase 2d G4 (100%, 3 sub-slices + regression, 0 bugs, no retest needed)
- `iteration_8.json` — CR-4B OTP verification (backend all-green; live SMS verified)
- `iteration_9.json` — CR-2 Attribution & geo (live-verified vs Freshsales)

---
## CR-3 A — Client-side Analytics & Ads (GTM) — ✅ DONE & VERIFIED (2026-06-08)
- Loaded existing GTM container `GTM-K5D84Z3L` (env+host-gated to www.mygenie.online; no preview pollution) and fired browser dataLayer events — Zapier/CAPI/Ads-API not needed (all ONLINE conversions).
- Events: `form_submitted` (→Qualified leads, every submit) · `lead_verified` (OTP verified →Book demo, primary) · `demo_booked` (Calendly →Book appointments) · `page_view` (SPA route change). Shared `event_id`; payload carries gclid/fbclid/fbp/source from CR-2.
- New `frontend/src/lib/gtm.js`; edited App.js, DemoForm.jsx, CalendlyInline.jsx, MessageForm.jsx, frontend/.env.
- Verified via headless Playwright: page_view + form_submitted fire with correct payload (gclid/fbclid/source/event_id/currency).
- Docs: `/app/CR-3A_Build_Spec.md` (spec+impl log), `/app/CR-3_Analytics_Ads_Discovery.md` (decisions §5a–§5g).
- Owner-side GTM/Ads TODO: unpause OTP-Verified tags; repoint "Book demo"→`lead_verified`; create `demo_booked`/"Book appointments" Website-source conversion+tags; decommission Zapier. Conversion target: AW-16740091756/NtqdClejmOgaEOyOpq4-.
- Next CRs: CR-7 (Internal Leads View), CR-2 missing CRM fields.

### CR-3 — Tracking Enhancements Backlog (post Part A) — to address ONE BY ONE
Doc: `/app/CR-3B_Tracking_Enhancements_Backlog.md`. Priority order:
- P0 #1 Enhanced Conversions (Google) + Advanced Matching (Meta) — ⭐ biggest lever, recovers browser-only loss; we already send email/phone/name/city (mostly GTM-side + tiny payload tweak: first/last name, external_id).
- P0 #2 Consent Mode v2 (Google) — modeling + EEA compliance; pairs with deferred consent banner.
- P1 #3 Tiered conversion values (form_submitted/lead_verified/demo_booked) — needs owner ₹ values.
- P1 #4 Lead-quality & segmentation params (otp_verified, form_location, plan_interest) — GA4 custom dimensions.
- P2 #5 Suppression/junk signal (from anti-junk) → exclusion audiences.
- P2 #6 Full click-ID coverage (gbraid/wbraid/msclkid — CR-2 already captures).
- P2 #7 GA4 recommended event names (generate_lead/schedule/purchase) — GTM only.
- P3 #8 user_id cross-device — deferred until login/portal exists.
Low-risk single code batch unlocks #1/#4/#5/#6 together (buildLeadPayload additions). Start with P0 #1.

### 🚨 CRITICAL CR-3 ROLLOUT NOTE (owner-side GTM)
REPOINT the `GAds - Book Demo` tag to fire on the `lead_verified` trigger (NOT `form_submitted`). Today it fires on `form_submitted`, so Google Ads goal "Submit lead form" counts UNVERIFIED leads. Per locked decision the PRIMARY conversion must count ONLY OTP-verified leads. Verify in GTM before publishing. (Detail: CR-3 docs §5h / §10.)

## CR-3 B — Tracking enhancements code batch — ✅ SHIPPED & VERIFIED (2026-06-08, iteration_10)
- **#3 Tiered conversion values** — new `pushLead(event,form,sector,eventId,extra)` in `gtm.js` + `CONVERSION_VALUES` map: `form_submitted=0`, `lead_verified=500` (owner-set "Book demo"), `demo_booked=2000` (default — confirm/adjust). `conversion_value` is what GTM passes to Google Ads for value-based bidding.
- **#4 Segmentation params** — `otp_verified`, `form_location` (homepage/sector:<slug>/contact/roi/pricing-buy/pricing-quote/calendly), `plan_interest` (CheckoutModal plan name).
- **#5 Suppression signal** — `lead_quality: "junk"|"ok"` via new `leadQuality(signals)` in `antiBot.jsx` (mirrors backend `looks_like_bot`: honeypot OR sub-2000ms = junk).
- **#6 Full click-IDs** — `gbraid`/`wbraid`/`msclkid` added to `buildLeadPayload` (from CR-2 attribution).
- **#2 Consent Mode v2 + banner** — `gtm.js` sets EEA-safe `consent default` (denied + `wait_for_update:500`) before container load + applies stored choice + `updateConsent()`; new `ConsentBanner.jsx` (Accept/Decline; testids `consent-banner`/`consent-accept-btn`/`consent-decline-btn`) persists `mg_consent`. Mounted in App.js (uses `<a>` not `<Link>` — renders outside `<BrowserRouter>`).
- Files: `gtm.js`, `antiBot.jsx`, NEW `components/site/ConsentBanner.jsx`, `App.js`, `DemoForm.jsx`, `MessageForm.jsx`, `CalendlyInline.jsx`, `CheckoutModal.jsx`, `RoiCalculator.jsx`.
- **Verified** via headless dataLayer assertion (lead API mocked → no real lead). Bug fixed: ConsentBanner `<Link>` crash outside Router → `<a>`.
- **Remaining (owner/GTM-side):** EC for Leads + Meta Advanced Matching mapping (#1 B/C/D); map value→GA4/Ads/Meta (#3); register GA4 custom dimensions (#4); exclusion audience from junk (#5); map consent variables (#2). **Deferred:** #7 GA4 recommended names (GTM-only), #8 user_id (needs login).
