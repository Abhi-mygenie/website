# HANDOVER — Next Agent Guide

> MyGenie POS — lead-gen marketing site (React SPA + FastAPI + MongoDB). North-Star metric =
> **demo bookings**. This handover orients you fast: what to read, current state, and what to pick next.
> **Last updated: 2026-06-08** (post CR-4B OTP live-verified + CR-2 Attribution/geo live-verified + CR-7 intake). **Next: CR-3 — Analytics & Ads (GA4 + Meta Pixel). Needs GA4 Measurement ID + Meta Pixel ID from owner.**

---

## 1. Read these docs first (in order)
1. **`/app/PROJECT_DOCS_INDEX.md`** — master map of every project doc. Always start here.
2. **`/app/CR_Control_Dashboard.md`** — CR registry + 5-gate model; what's done / in-flight / blocked.
   CR-6 (inline CMS) §Phases has the locked Phase 2d plan you're about to execute.
3. **`/app/memory/PRD.md`** — problem statement + current status (transient; durable detail in `.md` docs).
4. **`/app/test_reports/iteration_5.json`** — most recent G4 sign-off (Phase 2c, 100%). Read its
   `context_for_next_testing_agent` field — it lists the exact data-testid patterns and the
   **Preview-mode-on-login UX gotcha** that's now Phase 2d.3.
5. **`/app/Freshsales_CRM_Integration.md`** — CRM sync (forms → Contacts, the **write-only lifecycle quirk**).
6. **`/app/Calendly_Integration.md`** — demo booking flow + signed webhook + register script.
7. **`/app/SEO_README.md`** — SEO cutover (owner-blocked items).
8. **`/app/AI_Content_and_FAQ_Guide.md`** — AI page + FAQ media system (relevant to CMS Phase 2b/2c).
9. **`/app/memory/test_credentials.md`** — CMS admin creds + SMS/Freshsales/geo keys.
10. **`/app/CR-2_Attribution_Mapping.md`** — CR-2 confirmed website→Freshsales mapping + the **still-missing CRM fields** list (for the owner to create later).
11. **`/app/CR-4B_OTP_Implementation_Spec.md`** — OTP build brief (now SHIPPED & live).
12. **`/app/CR-7_Leads_View_Discovery.md`** — next CR in intake (G1 only).
13. **`/app/test_reports/iteration_8.json`** (CR-4B OTP) & **`iteration_9.json`** (CR-2 attribution) — latest sign-offs.

---

## 2. Current state (done & verified)

### Lead routing & nav (carried forward, all green)
- **Lead Routing (P0) COMPLETE** — Demo + Quote/Buy + Contact + ROI → Mongo + Freshsales (Lead/New + source tags + `external_id`).
- **Contact form (CR-1a)** — `/contact` tabbed card; `POST /api/contact` → tag `Website Contact`; auto-opens WhatsApp.
- **Number switch** — all Call + WhatsApp CTAs use `9579504871`.
- **Anti-junk (CR-4 Part A)** — honeypot + min-fill-time + per-IP/per-phone rate-limit.
- **Solutions & Product overview pages (CR-5)** — `/solutions` (11 sectors) and `/product` (6 buckets); nav hover-intent + 600ms post-nav hover-suppress.
- **Demo booking flow** — branded inline Calendly + HMAC webhook → Status "Demo Scheduled" + tag `Demo Scheduled (Web)`.

### CR-6 Inline CMS — Phase 1 + Phase 2a + 2b + 2c ALL G4-passed (2026-06-08)
- **Framework** — `CmsProvider` (auth/draft/preview/publish/discard/audit), `EditableText` (plain + rich), `EditableImage` (upload + paste-URL incl. YouTube/Vimeo), `EditableList` (text/textarea/`lines`/image/bool, dot-path keys, `lockItems`), `EditableFaqList` (q/a/details/media/links/reorder), `useContent`, `useContentDoc`, `useSaveDoc`. CMS admin layer at `/components/cms/CmsAdminLayer.jsx`.
- **Phase 1 (iteration_1+2)** — Home hero, global logo, testimonials, blog index + per-article CRUD, trust-band.
- **Phase 2a Pricing (iteration_3, 100%)** — hero text + plans (`lockItems`, includes via `lines`) + add-ons + annual-discount labels. `mergeById` preserves logic fields (`id`, `includedAddons`, `icon`); coerces price/popular types. RecommendQuiz + `QUIZ` stay code-controlled.
- **Phase 2b AI (iteration_4, 100%)** — hero + `AI_FEATURES` (with `outcome.value/label` dot-path + video/poster) + crosslink + FAQ + demo bullets + FAQ list via `EditableFaqList`. `mergeFeatures` preserves `id` + `icon`. Hydration warning fixed (no `block` on `EditableText` inside `<p>`).
- **Phase 2c Solutions + Product detail pages (iteration_5, 100%)** — 17 pages, **153 editors auto-wired by writing 2 templates**. `SectorPage.jsx` slug-driven (`sector.<slug>.*` × 9 × 11 = 99), `ProductPage.jsx` bucket-driven (`product.<bucket>.*` × 9 × 6 = 54). New helper `/lib/cms/mergeUtils.js` (`mergeByIndex(base, override, preserveKeys=['icon'])`) preserves Lucide icon SVGs across CMS edits — safe because `lockItems` keeps indexes stable. Module `caps[]` use the `lines` field; product video editable via single-row `lockItems` list with image-fields (mp4/webm + YouTube/Vimeo).
- **CMS admin creds:** `admin / admin123` and `editor / editor123` (env `CMS_USER_1/PASS_1`, `CMS_USER_2/PASS_2` in `backend/.env`).
- **Phase 2d (iteration_6, 100%)** — Solutions/Product **index** hero copy via `EditableText` (`solutions.index.hero.*`, `product.index.hero.*`); backfilled 2nd proof card for `food-courts` + `canteens` (all 11 sectors now 2 cards); CMS edit/preview mode now persists in `localStorage` (`cms.editMode`/`cms.preview`), first login lands in Edit mode (pencils visible). **Phase 2 FULL regression + backend CMS API** passed (iteration_7, 20/20 pytest + all surfaces).

### CR-1b Freshsales `cf_` mapping — DONE & LIVE-VERIFIED (2026-06-08)
- **Root cause fixed:** `freshsales.py` sent `custom_fields` (plural) → Freshsales silently dropped it. Now sends **`custom_field` (singular)** with the exact `cf_` API names from the owner's production `$crmData`.
- 15 live fields wired on `/demo-request`, `/quote`, `/contact`: `city`, `job_title`(←business_name), `mobile_number`/`work_number`, `cf_outlet_type`, `cf_first_interest`(←message), `cf_sku`(←years), `cf_pos_used`, `cf_pos_name`, `cf_longitude`(←client IP), `cf_category`(←user-agent) via new `_client_meta(request)` helper.
- **`external_id` → `web_<phone>`** (cross-form dedup key). Added `lookup_contact_by_phone` fallback. Repeat/cross-form submitters get a **`Multi-Form`** tag (added in `upsert_contact` when an existing contact is matched).
- **Live-verified** with 3 real test leads: Demo+Quote same phone → ONE contact `402209074834` with tags `[Website Demo Lead, Buy Online, Multi-Form]` + `cf_*` populated; Contact `402209074908` tag `[Website Contact]`. All 7 `cf_` names confirmed to exist in the account via `GET /settings/contacts/fields`.
- Owner decisions: Quote/Buy (plan/billing/addons/total), ROI numbers, `preferred_contact` → **MongoDB only** (no `cf_`); 8 attribution fields (utm_*/gclid/fbclid/fbc/placement) deferred to **CR-2**; `event_id`→`latest_campaign` ignored for now.
- ⚠️ lifecycle/status read back null (write-only on this account — verify in Freshsales UI). `cf_category`/`cf_longitude` showed curl/server-IP in the test because curl was used; real browser submits populate true UA + visitor IP.

### CR-4B OTP verification (Demo form) — DONE & LIVE-VERIFIED (2026-06-08, iteration_8)
- **`backend/otp.py`** + endpoints `POST /api/otp/send` & `/api/otp/verify`; `/demo-request` accepts optional `otp_token`. 4-digit OTP, peppered HMAC-SHA256 hash, Mongo `otp_codes` (1h TTL doc / 10-min validity), 30s resend / 5-per-hr / 5-attempt lock, signed 15-min JWT bound to phone. Frontend: `DemoForm.jsx` OTP step (testids `otp-send-btn`/`otp-input`/`otp-verify-btn`/`otp-resend-btn`).
- **Graceful by design**: missing/invalid token or SMS-panel outage ⇒ lead STILL saved, tagged **`OTP-Unverified`**. Never hard-blocks a demo.
- **LIVE**: `OTP_SMS_ENABLED=true` — real SMS delivered to 7505242126 via owner panel, verified. `cf_rooms` ("OTP verified") now written Yes/No.
- ⚠️ DLT template text ("Mygenie" mid-msg + "TEAM HOSIGENIE" footer) is **owner-side DLT-registered** — to change to "Team MyGenie", owner re-registers the template and sends a new `SMS_TEMPLATE_ID` (then 1-line env swap). NOT changeable in code.

### CR-2 Attribution & Data Capture — DONE & LIVE-VERIFIED (2026-06-08, iteration_9)
- **Frontend** `lib/attribution.js` (first-touch localStorage / last-touch sessionStorage; utm_*, gclid/fbclid/gbraid/wbraid/msclkid, `_fbp`/`_fbc` cookies, landing/conversion page, referrer, device/os/browser, language, timezone, pages_viewed, time_on_site) + `AttributionTracker` in `App.js` (runs on every route change). Attached to **all 4 forms**: DemoForm, RoiCalculator, MessageForm, CheckoutModal — as `attribution:{}`.
- **Backend** `server.py._attribution_to_crm(attr)` → (native, cf). Native: `first_source/medium/campaign` (first-touch, **set-once**), `latest_source`=**gclid** (Option B; falls back to last utm_source), `latest_medium/campaign` (last-touch). cf: `cf_pos_satifcation_level`=utm_term, `cf_est_name`=utm_content, `cf_latitude`=fbclid, `cf_orders_taken_via`=_fbp. Full attribution object stored in Mongo on every lead doc (`attribution{}`).
- **`freshsales.upsert_contact(extra_fields=…)`** writes native fields; **on an existing contact it drops `first_*`** so first-touch is never overwritten (only `latest_*`/cf_ refresh).
- **Geo/city** `backend/geo.py` (`ipwho.is`, keyless HTTPS) → native `city` (typed city wins; region+country → Mongo `geo{}`). Best-effort, never blocks.
- **Confirmed owner mapping + still-missing CRM fields** (landing/referrer/device/lang/tz/pages/time/region/country/other click-ids = Mongo-only until fields created) → `/app/CR-2_Attribution_Mapping.md`.

### Critical gotchas (don't relearn the hard way)
- **CMS first-login lands in Preview mode ON** (pencils hidden until you click `cms-toggle-preview` once). Caught the testing agent on the first pencil-count assertion. **Phase 2d.3 will fix this** — don't waste time debugging "missing pencils" on a fresh login; just toggle once and the edit-mode flag persists across navigations in the same session.
- **CMS overrides storage** — drafts and published values live in MongoDB collection `cms_content`. `GET /api/cms/content` filters out `published_value == null`. If you ever publish a "null" via API to wipe, you actually need to MongoDB `deleteMany({key: /^<prefix>\./})` because the publish endpoint refuses to copy null drafts. The cleanup pattern from iteration_3/4/5: `mongosh test_database --quiet --eval 'db.cms_content.deleteMany({key: /^ai\./})'` (substitute prefix).
- **`mergeByIndex` is safe ONLY with `lockItems`** — indexes must be stable. If you ever build a non-lockItems list that uses `mergeByIndex`, add/delete operations will silently shift overrides onto wrong rows.
- **`EditableText` inside `<p>` must NOT have `block` prop** — it wraps in `<div>` and causes `validateDOMNesting` hydration warnings. Use `multiline` / `rich` only.
- **Freshsales API write-only on `lifecycle_stage_id` / `contact_status_id`** — verify via Freshsales UI, not API read.
- **Freshsales custom fields** use key `custom_field` (singular) with `cf_`-prefixed names. Our current `custom_fields` (plural) payload is silently ignored — see CR-1b.
- **Calendly webhook** is registered against the **preview** URL — must be re-registered with prod URL after deploy (`backend/scripts/register_calendly_webhook.py`).
- **Platform hosting** does NOT support server-side 301 redirects (Cloudflare-side).
- **Nav hover dropdowns** (`Navbar.jsx` → `NavDropdown`) deliberately use 600ms `suppressUntil` ref + 220ms hover-intent close delay. **Don't remove.** Don't call `setOpen` inside an effect.
- **Backend `requirements.txt`** has a `litellm` ↔ `emergentintegrations` version conflict, but neither is actually imported. We installed only the deps the code uses (fastapi, motor, jwt, etc.) — don't `pip install -r requirements.txt` blindly without `--no-deps` or you'll hit the resolver. (Pattern used in the fresh pull: `pip install --no-deps emergentintegrations==0.2.0` then `pip install -r <requirements-minus-those-2-lines>`.)
- **OTP SMS panel uses a self-signed IP cert** — the httpx call in `otp.py` MUST use `verify=False`. It's scoped to that one call only. `OTP_SMS_ENABLED=true` means real SMS go out — flip to `false` for mock testing (OTP logged in `backend.err.log`).
- **Geo provider is `ipwho.is`, NOT ipapi.co** — ipapi.co returns 429 for datacenter/cloud IPs (our pod). If geo ever stops, check `ipwho.is` quota first.
- **CR-2 `latest_source` holds gclid (Option B)** — so last-touch *utm_source* has no CRM field yet (Mongo-only). If the owner later wants it in the CRM, create a field and add one line to `_attribution_to_crm()`.

---

## 3. What to pick next

### 🔴 NEXT UP — CR-3 — Analytics & Ads (GA4 + Meta Pixel + offline conversions)
**Status: G1 Discovery. Start by gathering inputs + a G2 scope, then build.**

**Blockers / inputs needed from owner (ask FIRST via `ask_human`):**
- **GA4 Measurement ID** (`G-XXXXXXX`).
- **Meta Pixel ID** (15–16 digit).
- (Later/optional) Google Ads conversion ID/label + Meta CAPI access token for **server-side / offline conversions**; Zapier or direct API is owner-side.

**Why CR-3 is well-positioned now:** CR-2 already captures **`gclid`, `fbclid`, `_fbp`/`_fbc`, geo, device, full UTM** on every lead (in Mongo + Freshsales). So offline-conversion upload (push a booked demo back to Google/Meta) is mostly a data-plumbing task — the identifiers exist.

**Suggested scope (lock in G2 with owner):**
1. **Client-side tags** — GA4 + Meta Pixel base, injected via env (`REACT_APP_GA4_ID`, `REACT_APP_META_PIXEL_ID`) so they stay out of code. Fire on route change (SPA pageviews) + key events: `generate_lead` (form submit), `otp_verified`, `demo_booked` (Calendly), `begin_checkout`/`purchase` (Quote/Buy).
2. **Consent** — confirm whether a consent banner is required before tags load (was "fine for now" in CR-2; re-confirm for ads pixels).
3. **Server-side (CR-3 B — prioritise, don't defer)** — Meta CAPI + Google offline conversions using the captured `gclid`/`fbclid`/`_fbp`. Dedup Pixel↔CAPI via a shared `event_id`.
   > ⭐ **Sequence CR-3 B right after the pixels (CR-3 A).** Feeding Google/Meta **real booked-demo** signals (not just form-fills) is typically the **single biggest lever on ad CPL** — the algorithms optimise toward bookers. All identifiers already exist (CR-2), so it's mostly plumbing. Full rationale in `CR_Control_Dashboard.md` → CR-3 §Suggested split.
- **Use `integration_expert`** for GA4 / Meta Pixel / CAPI specifics before wiring.
- Keep all IDs in env. Every interactive element keeps its `data-testid`.

### ✅ DONE 2026-06-08 — CR-4B OTP (iteration_8) — see §2; live SMS ON.
### ✅ DONE 2026-06-08 — CR-2 Attribution + geo (iteration_9) — see §2; mapping in `/app/CR-2_Attribution_Mapping.md`.

### 🟠 Then (pending owner input / P1)
- **CR-7 — Internal Leads View** (G1 intake captured, `/app/CR-7_Leads_View_Discovery.md`) — read-only sales triage over existing Mongo lead data. Needs G2 scope (auth/filters/actions) before build.
- **CR-2 missing CRM fields** — owner creates `cf_` fields for landing/referrer/device/lang/tz/pages/time/region/country/other click-ids → then 1-line wire each in `_attribution_to_crm()`.
- **OTP DLT template edit** — owner re-registers SMS template to "Team MyGenie" → send new `SMS_TEMPLATE_ID`.

**Scope is 3 sub-slices in one branch** — small enough to ship in a single iteration with one testing-agent sweep.

**2d.1 (P0)** — Solutions & Product **index** hero copy via `EditableText`:
- `SolutionsIndex.jsx`: wire eyebrow / h1 / sub / cta label
  Keys: `solutions.index.hero.eyebrow`, `solutions.index.hero.h1`, `solutions.index.hero.sub`, `solutions.index.hero.cta`
- `ProductIndex.jsx`: same pattern
  Keys: `product.index.hero.eyebrow`, `product.index.hero.h1`, `product.index.hero.sub`, `product.index.hero.cta`
- Pure wiring, no new framework, no `EditableList` needed (sector cards / product cards stay code-driven — those are auto-generated from `data/sectors.js` and `data/products.js`, which are already CMS-editable on the detail pages).

**2d.2 (P1, from iteration_5)** — Data parity fix:
- `/app/frontend/src/data/sectors.js`: backfill a **second proof card** for `food-courts` and `canteens` so all 11 sectors ship with 2 proof cards in fallback. Pre-Phase-2c data gap; ~10-line edit. Use the existing 9 sectors' proof shape (`metric`, `headline`, `quote`, `client`) — keep tone consistent.

**2d.3 (P1, from iteration_5)** — CMS first-login UX fix:
- `/app/frontend/src/lib/cms/CmsProvider.jsx`: on a successful `cms-login-submit`, force `previewMode = false` so the freshly-logged-in admin sees pencils immediately. **OR (better)** persist last-used mode in `localStorage` (`cms.previewMode`) so returning admins resume where they left off. First-time tooltip on the toggle would be a bonus: *"You're in Edit mode — click here to preview as a visitor."*
- File touched: `CmsProvider.jsx` (login handler) and optionally `CmsAdminLayer.jsx` (tooltip copy).

**QA discipline (same as iteration_3/4/5):**
- After implementation: API-level smoke (curl admin login → PUT `solutions.index.hero.h1` → publish → public read) + Playwright screenshot of `/solutions` and `/product` index pages logged-out (fallback) and logged-in (pencils visible).
- Then call `testing_agent_v3` with all flows listed in the dashboard's Phase 2d entry. Have it write `/app/test_reports/iteration_6.json`.
- **Cleanup is mandatory** — wipe any `solutions.index.*` / `product.index.*` test keys from `cms_content` after QA.

### 🟠 Then (pending owner input / P1)
- **OTP validation (CR-4 Part B)** — bulk-SMS XML panel (`OTP` route). Needs panel URL + provider creds + DLT IDs.
- **CR-1b** — map form fields → real `cf_` Freshsales custom fields (blocked on CRM team sending API names; see `Freshsales_Field_Mapping_Request.md`).
- **UTM/attribution capture (CR-2)** + **Analytics/Ads (CR-3)** — see `CR_Control_Dashboard.md`.

### 🟡 Backlog / Phase 3 of CR-6 (deferred from Phase 2 by design)
- **Icon picker** — Lucide-name typeahead so admins can change `icon` on sectors/solutions/AI features/modules.
- **Dynamic section sub-headings** — currently `s.name.toLowerCase()` interpolations ("We know cafés run on tight margins…", "Real cafés results.", "Built for the way cafés actually work."). Move into CMS so each sector can have bespoke section copy.
- Per-page **SEO popover** (title/description editable).
- Razorpay payment capture (stubbed).
- `react-snap` pre-render for SEO (empty `#root` in raw HTML).
- GA4 / Meta Pixel IDs, Cloudflare 301 cutover (owner-blocked).
- **Optional growth lever — metric A/B testing**: the ₹50,000+ / 40% / 22% hero cards drive most demo bookings. Add a `metric.alt` field + 50/50 cookie bucketing + a tag on the booked demo for which variant was seen. Trivial after Phase 2d. Not on the locked roadmap — flag with owner first.

---

## 4. How to verify your work
- **Backend:** `cd /app/backend && python -m pytest tests/ -q`, plus curl via external `REACT_APP_BACKEND_URL` (not localhost — kubernetes ingress is `/api/*`-routed).
- **CMS API smoke:**
  ```bash
  API="http://localhost:8001"
  TOKEN=$(curl -s -X POST $API/api/cms/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
  curl -X PUT $API/api/cms/content -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"key":"<key>","type":"text","value":"<val>"}'
  curl -X POST $API/api/cms/publish -H "Authorization: Bearer $TOKEN"
  curl $API/api/cms/content   # public — should show your value
  ```
- **CRM:** check Freshsales **UI** for status (API read is masked); tags ARE API-readable.
- **Frontend:** screenshot tool / `testing_agent_v3` for form flows. Every interactive element MUST have `data-testid`.
- **Always update** `/app/memory/test_credentials.md` and `/app/CR_Control_Dashboard.md` change log when you finish.
- **Always write your G4 verdict** to `/app/test_reports/iteration_<n>.json` and confirm cleanup in it.
