# MyGenie Website — CR Control Dashboard & Registry

> Single source of truth for all Change Requests (CRs) on the MyGenie marketing site.
> Every CR must pass **5 gates in order**. No gate may be skipped. A CR cannot advance to the next gate
> until the current gate's exit criteria are signed off.
>
> Last updated: 2026-06-07

---

## The 5 Gates (compulsory for every CR)

| Gate | Name | Purpose | Exit criteria (must be true to advance) |
|------|------|---------|------------------------------------------|
| **G1** | **Discovery & Impact** | Understand the ask, surface affected areas, risks & dependencies | Scope written; impacted files/flows listed; dependencies & risks identified; blockers raised |
| **G2** | **Planning** | Lock the approach, data contracts, and acceptance criteria | Approach approved; API/data contracts defined; test cases drafted; all G1 blockers cleared |
| **G3** | **Implementation** | Build to plan, no scope creep | Code complete; lint clean; self-verified (curl/screenshot); data-testids added |
| **G4** | **QA** | Independent verification of every flow | All acceptance criteria pass; regression checked; bugs fixed & re-tested |
| **G5** | **Owner Smoke Test** | Owner validates on preview before sign-off | Owner runs key flows on preview and approves → CR closed |

**Status legend:** `Backlog` · `In G1` · `In G2` · `In G3` · `In G4` · `In G5` · `Done` · `Blocked`

---

## CR Registry (master list)

| CR | Title | Current Gate | Status | Blocked? | Notes |
|----|-------|--------------|--------|----------|-------|
| **CR-1** | Forms + CRM Integration (Contact form, number switch, `cf_` mapping, ROI structured fields) | G2 — Planning | **CR-1b BUILT (Demo/Quote/Contact)** | 🟠 Partial | `cf_` mapping live for the 15 ready fields; Quote/ROI/preferred_contact deferred (MongoDB only) by owner |
| **CR-2** | Attribution & Data Capture (UTM, click-IDs, IP/browser/device, geo, referrer, first/last-touch) | **G4 ✅ → G5** | **BUILT & LIVE-VERIFIED (iteration_9)** | 🟢 No | All 4 forms → Freshsales native (`first_*`/`latest_*`) + cf_ (`cf_est_name`/`cf_pos_satifcation_level`/`cf_latitude`/`cf_orders_taken_via`) + full obj in Mongo. Geo/city via `ipwho.is`. Mapping + still-missing CRM fields: `/app/CR-2_Attribution_Mapping.md` |
| **CR-3** | Analytics & Ads (GA4 + Meta Pixel + Google Ads via GTM dataLayer; browser-first) | **CR-3 A: G4 ✅ → G5** · CR-3 B: backlog | **CR-3 A BUILT & VERIFIED (browser dataLayer into `GTM-K5D84Z3L`)** | 🟠 Soft | Browser-first (Zapier/CAPI/Ads-API DROPPED). Events `form_submitted`/`lead_verified`/`demo_booked`/`page_view`; IDs GA4 `G-KWHHFEZ5Q3` / Pixel `2862017797322752` / Ads `AW-16740091756/NtqdClejmOgaEOyOpq4-`. **🚨 Owner-side GTM repoint `GAds-Book Demo`→`lead_verified` + create `demo_booked` tags.** CR-3 B enhancements backlog: `CR-3B_Tracking_Enhancements_Backlog.md` (Step A done). Docs: `CR-3_Analytics_Ads_Discovery.md`, `CR-3A_Build_Spec.md` |
| **CR-4** | Anti-Junk & OTP Layer — Part A (honeypot+timing+rate-limit) + Part B (OTP verify) | **G4 ✅ → G5** | **Part A + Part B BOTH DONE. OTP LIVE-VERIFIED (iteration_8)** | 🟢 No | OTP on Demo form; **live SMS ON** via owner panel; graceful `OTP-Unverified` fallback; `cf_rooms`=OTP status. Spec: `CR-4B_OTP_Implementation_Spec.md` |
| **CR-5** | Solutions & Product overview landing pages (`/solutions`, `/product`) + clickable nav labels | G4✓ → G5 | **At G5 (owner smoke)** | No | Done & verified |
| **CR-6** | Website Content Management — edit text / images / videos across ALL pages, no-code | G4 ✅ → G5 | **Phase 1 + Phase 2a (Pricing) + Phase 2b (AI) + Phase 2c (Solutions ×11 + Product ×6) COMPLETE. Phase 2d plan locked** | No | All 3 framework additions DONE. Pricing ✅, AI ✅, all 11 sectors ✅, all 6 products ✅ wired. Next: 2d Solutions/Product index heroes |
| **CR-7** | Internal Leads View — read-only sales triage (source/medium/campaign/city/OTP/intent at a glance) | **G1 — Discovery** | **Intake/Discovery only — no build** | 🟢 No | NEW (captured 2026-06-08). Read/aggregate layer over existing Mongo lead data (CR-1b/CR-2/CR-4B) — no new capture. Discovery doc: `/app/CR-7_Leads_View_Discovery.md`. Awaiting G2 scope (auth/filters/actions). |

---

## CR-1 — Forms + CRM Integration

**Goal:** Plug lead leaks and persist full lead data into Freshsales.

**Scope (sub-items):**
1. Contact "Send a message" form (name, phone, email, message, preferred contact method) → Mongo + Freshsales (`Website Contact`) + opens WhatsApp `wa.me/919579504871` pre-filled.
2. Switch **all** Call + WhatsApp CTAs to `9579504871` (`tel:+919579504871`, `wa.me/919579504871`); remove `7505242126`.
3. `cf_` custom-field mapping across all 4 forms (Demo, Quote, ROI, Contact).
4. ROI structured fields (`cf_monthly_revenue`, `cf_outlet_count`, `cf_est_annual_impact`).

**Gate progress (CR-1a — unblocked scope: Contact form + number switch):**
- [x] **G1 Discovery & Impact** — DONE.
- [x] **G2 Planning** — DONE (reduced scope; `cf_` mapping parked as CR-1b).
- [x] **G3 Implementation** — DONE. New `POST /api/contact` + `/contact-messages`; `MessageForm.jsx`; tabbed `Contact.jsx`; all numbers → `9579504871` (`company.js`, `seo.js`); `7505242126` fully removed. Lint clean.
- [x] **G4 QA** — DONE. E2E: form submit → Mongo + Freshsales `Website Contact` (verified id 402209000090); WhatsApp opens to `919579504871` prefilled; preference saved; Call/footer show new number.
- [ ] **G5 Owner Smoke Test** — ⏳ AWAITING OWNER (you). Smoke steps below.

**CR-1b (parked — resumes on team `cf_` keys):** `cf_` custom-field mapping across all 4 forms + ROI structured fields.

**G5 Owner smoke steps:** open `/contact` → "Send a message" tab → fill & submit → confirm WhatsApp opens to your number with the message → check the lead landed in Freshsales tagged `Website Contact`. Also verify Call/WhatsApp cards show `9579504871`.

**⚠️ Cleanup:** 2 test contacts ("Smoke Test", "QA Tester") were created in your live Freshsales during QA — please delete them.

---

## CR-2 — Attribution & Data Capture (NEW, Backlog)

**Scope:** capture on all forms → Mongo + Freshsales `cf_*`:
- UTM (source/medium/campaign/term/content), click-IDs (gclid/gbraid/wbraid/fbclid/msclkid)
- Landing page, conversion page, referrer, first-touch vs last-touch
- **IP, browser, device type (mobile/desktop), OS, language, timezone, geo/city**
- Engagement (pages viewed, time-on-site)

**Known limit:** organic search keyword is NOT capturable (Google "not provided"); paid keyword via `utm_term`.

**G1 open questions:** which fields the CRM team will create `cf_` slots for; geo via server-side IP lookup (provider?).

---

## CR-3 — Analytics & Ads (CR-3 A SHIPPED 2026-06-08; CR-3 B = enhancements backlog)

> ### ✅ OUTCOME — built browser-first; original "server-side/offline" scope below was SUPERSEDED.
> After discovery (Discovery §5a–§5h), the owner chose to **fire all conversions from the website browser as ONLINE events** and **DROP Zapier / Meta CAPI / Google Ads API**. The "server-side/offline" plan in the italic block below is **historical context, not the implemented design.**
>
> **CR-3 A — DONE & verified:** `frontend/src/lib/gtm.js` loads existing container **`GTM-K5D84Z3L`** (env + host-gated to `www.mygenie.online`) and pushes `form_submitted`→Qualified leads · `lead_verified`→Book demo · `demo_booked`→Book appointments · `page_view`. Shared `event_id`; payload has gclid/fbclid/fbp/source (CR-2) + Enhanced-Conversions identity fields (CR-3 B Step A done). IDs: GA4 `G-KWHHFEZ5Q3`, Pixel `2862017797322752`, Ads `AW-16740091756/NtqdClejmOgaEOyOpq4-`.
>
> **🚨 CRITICAL owner-side GTM/Ads tasks (before live):** (1) REPOINT `GAds - Book Demo` tag → `lead_verified` trigger (today it's `form_submitted` = counts unverified!); (2) UNPAUSE OTP-Verified tags; (3) create `demo_booked` trigger + "Book appointments" Website-source conversion/tags; (4) Qualified leads=secondary, Book demo=primary; (5) decommission Zapier; (6) re-verify GTM loads after prod deploy.
>
> **CR-3 B — enhancements backlog (one by one):** `CR-3B_Tracking_Enhancements_Backlog.md`. P0 #1 Enhanced Conversions + Advanced Matching (code Step A done; Steps B/C/D owner-side), P0 #2 Consent Mode v2, P1 #3 tiered values, P1 #4 quality/segmentation params, P2 #5 suppression, #6 click-IDs, #7 GA4 recommended events, P3 #8 user_id.
>
> **✅ CR-3 B code batch SHIPPED 2026-06-08 (iteration_10):** #3 tiered `conversion_value` (form_submitted=₹0 / lead_verified=₹500 owner-set / demo_booked=₹2000) via new `pushLead()`; #4 `otp_verified`/`form_location`/`plan_interest`; #5 `lead_quality` junk/ok (`leadQuality()` mirrors backend anti-junk); #6 `gbraid`/`wbraid`/`msclkid`; **#2 Consent Mode v2 default/update + `ConsentBanner.jsx` (Accept/Decline, EEA-safe denied default).** Verified via headless dataLayer assertion (lead API mocked). Fixed a crash: ConsentBanner used `<Link>` outside `<BrowserRouter>` → switched to `<a>`. **All remaining work on #1–#6 is owner/GTM-side** (map values/dimensions, EC + Advanced Matching, exclusion audiences, consent vars).
>
> **Docs:** `CR-3_Analytics_Ads_Discovery.md` (decisions), `CR-3A_Build_Spec.md` (spec + impl log).

<details><summary>Historical (superseded) original backlog plan</summary>

**Scope:** GA4 + Meta Pixel events on every interaction (form submits, CTA clicks, WhatsApp/call/email clicks),
Google Ads + Meta Ads integration, server-side / offline conversion API back to Google & Meta.

**Context (NOT in agent scope):** Zapier will push offline events from Freshsales to complete the journey.

**G1 open questions:** GA4 Measurement ID, Meta Pixel ID, Google Ads conversion IDs, consent/cookie requirements.

**Suggested split (lock in G2):**
- **CR-3 A — Client-side tags (P0, do first):** GA4 + Meta Pixel base via env IDs; SPA pageviews on route change + key events (`generate_lead` on form submit, `otp_verified`, `demo_booked` on Calendly, `begin_checkout`/`purchase` on Quote/Buy). Gets reporting/remarketing live fast.
- **CR-3 B — Server-side / offline conversions (P0-prioritised, do right after A):** push **booked-demo** signals back to Google (offline conversions via `gclid`) and Meta (CAPI via `fbclid`/`_fbp`), deduped with Pixel via a shared `event_id`.
  > ⭐ **Priority rationale (owner-flagged):** Once CR-3 B lands offline-conversion uploads, you're feeding Google/Meta **real booked-demo signals — not just form-fills.** This is typically the **single biggest lever on ad CPL** (the ad algorithms optimise toward people who actually book, not everyone who submits a form). So sequence it **immediately after the pixels go in (CR-3 A)** rather than deferring it. All the identifiers it needs (`gclid`, `fbclid`, `_fbp`, geo) are **already captured by CR-2** — it's mostly data-plumbing.
  > Inputs CR-3 B needs from owner: Meta **CAPI access token**, Google Ads **conversion ID + label** (and confirm whether Freshsales→ads is done via Zapier or our backend directly).

</details>

---

## CR-4 — Anti-Junk & OTP Validation Layer

**Part A — No-cost anti-junk layer — DONE (G3+G4 passed; at G5 owner smoke):**
- Applied to ALL lead endpoints (`/demo-request`, `/quote`, `/contact`; ROI uses `/demo-request`).
- **Honeypot** (`company_website` hidden field) → bots that fill it get a fake success, lead is dropped.
- **Min fill time** (`elapsed_ms < 2000`) → instant submits dropped.
- **Rate limiting** (MongoDB `submission_log`, TTL-cleaned): max 8 submits/IP per 10 min, 45s cooldown per phone → HTTP 429.
- Files: `backend/antijunk.py` (new), `backend/server.py`, `frontend/src/lib/antiBot.jsx` (new) + wired into `DemoForm`, `MessageForm`, `CheckoutModal`, `RoiCalculator`.
- QA verified via curl: honeypot drop ✓, fast-submit drop ✓, legit sync ✓, phone-cooldown 429 ✓; legit UI submit still works ✓.

**Part B — OTP verification — PLANNED, unblocked, owner-approved (2026-06-08) — ready to build:**
- **Demo form only.** Full build brief in **`/app/CR-4B_OTP_Implementation_Spec.md`** — read it before building.
- Owner-locked: graceful failure (lead still saved + tagged `OTP-Unverified` if panel down), **4-digit** OTP, 10-min TTL, hashed store, mobile **10-digit** (PHP parity), 30s resend / 5-per-hr / 5 attempts, message **Option A** (corrected), live send gated behind `OTP_SMS_ENABLED` (OFF until owner flips it).
- SMS contract captured from owner's production PHP: `GET https://123.108.46.13/sms-panel/api/http/index.php` · `username=MYGENIE` · `sender=HSEGNI` · `route=TRANS` · `TemplateID=1707178030188539801` · `verify=False`. Creds → `backend/.env` (`SMS_API_KEY` etc.).
- **On build: route through `integration_expert` FIRST** (auth-adjacent), then run a live reachability test to the panel IP (owner says it's public).

---

## CR-5 — Solutions & Product overview landing pages + nav UX — DONE (G4 passed; at G5 owner smoke)

**Scope delivered:**
- New **`/solutions`** (`SolutionsIndex.jsx`) — hero + grid of all 11 sector cards → detail pages + demo CTA.
- New **`/product`** (`ProductIndex.jsx`) — hero + grid of 5 capability buckets (feature chips) → detail pages + demo CTA.
- Navbar **"Solutions"/"Product" labels are clickable** (navigate to overview) while still opening the hover
  dropdown; "View all →" links added to both desktop dropdowns and the mobile accordion.
- Routes added in `App.js`; SEO entries added in `lib/seo.js` (`/solutions`, `/product`).

**Nav dropdown UX fixes (same component, `Navbar.jsx` → `NavDropdown`):**
1. **Hover-intent close delay (220ms)** — fixes the "menu vanishes before I can click an item" dead-zone.
2. **Click-to-open** support on the trigger (doesn't toggle-close).
3. **Post-navigation auto-close** — after clicking a label/item, the page remounts under a stationary cursor
   and the browser fires a *synthetic* `mouseenter` that used to re-open the menu. Fixed via a **600ms
   hover-suppress window on mount** (`suppressUntil` ref): the menu stays closed after navigation and only
   reopens on a real mouse movement.

**Files:** `frontend/src/pages/SolutionsIndex.jsx` (new), `pages/ProductIndex.jsx` (new),
`components/site/Navbar.jsx`, `App.js`, `lib/seo.js`. Lint clean; E2E verified (label→overview→detail nav;
menu closes after nav when cursor stationary; reopens on movement).

---

## CR-6 — Website Content Management (CMS) — G1 Discovery & Impact

**Goal:** Let the owner/team edit **all website content — text, images and videos — across every page**,
with no code changes.

### Content inventory (full surface area mapped)

**A. Data-driven content (already in `src/data/*` — clean to make editable)**
| Page(s) | Source file | Editable content |
|---|---|---|
| Home `/` | `content.js` | metrics, trust logos, pains, before/after, pillars, sector cards, module buckets, AI use-cases, testimonials |
| Solution detail (11) `/solutions/:slug` | `sectors.js` (`SECTOR_PAGES`) | hero, pains, solutions, proof quotes, FAQs, metric, icon |
| Product detail (6) `/product/:bucket` | `products.js` (`PRODUCT_PAGES`) | hero, modules, proof, FAQs, **image**, **videoUrl**, poster |
| Pricing `/pricing` | `pricing.js` | plans, add-ons, quiz, annual discount |
| Customers `/customers` | `stories.js` | stories, stats, filters, **images** |
| Practical AI `/ai` | `ai.js` | AI features (+ **videoSrc/poster**), AI FAQs |
| Blog `/blog`, `/blog/:slug` | `blogPosts.json` + `public/blog/` | posts, **images** |
| Legal `/terms` `/privacy` `/refund` | `legal.js` | legal copy |
| Global (nav, footer, contact) | `company.js` | phone, email, social links, address |
| SEO (all routes) | `lib/seo.js` | per-page title + meta description |

**B. Hardcoded copy in JSX (⚠️ must be extracted into the content model to be editable)**
- Hero/section copy on `SolutionsIndex.jsx`, `ProductIndex.jsx`
- `About.jsx`, `RoiCalculator.jsx`, `Contact.jsx` copy
- Section headings across `Home.jsx` and most pages
> This extraction is the **largest hidden effort** in "all pages" — flagged for G2 sizing.

**C. Media**
- **Images:** `public/brand/` (~38 files — `logo.svg`, `banner.png`, `feature1–5.png`, customer logos…).
- **Videos:** `FeatureVideo.jsx` already supports BOTH self-hosted `.mp4/.webm/.mov` AND YouTube/Vimeo URLs;
  used on Product pages, AI page, and FAQ media (currently mostly null placeholders).
- **Icons:** lucide icon **names** stored as strings (e.g., `"Coffee"`) — editor needs an icon picker.

### Approach options (decide in G2)
- **A. Custom in-house Admin** (MongoDB + `/admin` panel + auth + media upload to object storage). Best fit:
  stack is already React+FastAPI+Mongo and content is already structured → clean migration. No third-party cost.
- **B. Headless CMS** (Sanity / Strapi / Contentful). Rich editor, media library, roles, versioning out of the
  box — but external dependency/cost + migrate all content into its schema.
- **C. Git/JSON-based** (Decap/Netlify CMS). Content stays in repo/version-controlled — but still semi-technical.

**Recommendation (to confirm in G2): Option A (custom admin)** — tailored to the exact structure, self-serve
for non-technical users, no external cost.

### Proposed architecture (for G2)
- Migrate each data file → Mongo collection(s) (or a flexible `content` doc keyed by page/section/field).
- Admin-protected CRUD APIs + public read APIs; frontend reads from API with **static fallback**.
- `/admin` panel: login → page list → section editors (text, rich-text, repeatable lists, icon picker) →
  **media uploader** (image + video to object storage/Cloudinary, or paste YouTube/Vimeo URL) → publish.
- Draft → preview → publish workflow + audit log (who changed what, rollback).

### Phasing (proposed)
- **Phase 1:** Admin auth + content model + high-churn content (Home banner/hero, blog, testimonials,
  logo/banner upload) + media upload.
- **Phase 2:** Solutions/Product/Sector/Product-detail, pricing, AI page.
- **Phase 3:** Extract remaining hardcoded JSX copy (About, ROI, Contact, all section headings) + SEO fields
  + global (nav/footer/company).

### 🔴 Blockers / open questions (must answer to exit G1 → G2)
1. **Approach:** Custom admin (recommended) vs headless CMS vs git-based?
2. **Auth & users:** who logs in, how many, roles (admin/editor)? *(auth = integration → `integration_expert`)*
3. **Workflow:** instant publish, or draft → preview → publish?
4. **Media hosting:** object storage vs Cloudinary? Videos — allow uploads or only YouTube/Vimeo links?
5. **Rich text** (bold/links/lists) for blog/legal, or plain text + markdown?
6. **SEO fields** (title/description per page) editable too? (recommend yes)
7. **Versioning/rollback + audit log** needed?
8. **Render strategy:** live API fetch vs build-time — impacts SEO/prerender (see `SEO_README.md`).
9. Confirm scope = **truly all pages** incl. extracting hardcoded copy (bigger effort) — yes/limit?

### G2 decisions (owner — 2026-06-07) ✅
1. **Approach:** Custom in-house admin, but **in-flow / inline editing** (live "Edit mode"), NOT a separate admin site.
2. **Auth:** 2 admin users, credentials in **env file** (JWT login). → route through `integration_expert` at build.
3. **Workflow:** **Draft → Preview → Publish.** Visitors see published; admins preview drafts.
4. **Media:** **Both** — upload AND paste YouTube/Vimeo URL. **Storage: local disk for now, behind a storage
   abstraction so we can switch to AWS S3 before production** (env-switch `STORAGE_BACKEND=local|s3`).
5. **Rich text:** Yes (bold/links/lists) for text fields.
6. **SEO fields:** Editable (per-page title/description) — via a small "Page settings" popover.
7. **Versioning/rollback + audit:** Not required.
8. **Scope:** Only content that actually changes (banners, hero copy, images, videos, blog, testimonials, pricing,
   FAQs, SEO). Truly-static structural copy stays in code. Final "editable set" list to be confirmed in G2.

### Chosen UX — Hybrid in-flow editing
- "Edit mode" toggle for the 2 logged-in admins → ✎ pencil per section.
- Inline editors: text (rich-text popover), image (replace upload/URL), video (upload/URL).
- Contextual slide-over (same ✎) for structured lists (add/remove/**reorder** cards, FAQs, pricing) + SEO popover.
- Pinned Draft · Preview · Publish bar.
- **Note:** content model/data migration effort is the same as a separate admin — inline only changes the editing surface; hardcoded JSX copy in the editable set must still be extracted to the model.

### Status: G1 ✅ → G2 ✅ → **G3 Phase 1 BUILT (owner-approved 2026-06-08) → awaiting G4 QA.**

**Phase 1 — DELIVERED & self-verified (2026-06-08):**
- ✅ **Backend** (was already scaffolded): env wired (`CMS_*` in `backend/.env`), JWT login, draft/publish/discard, media upload — full curl smoke passes (login → PUT draft → publish → public read).
- ✅ **Frontend inline-edit framework** (new):
  - `lib/cms/CmsProvider.jsx` — `CmsProvider` + `useContent(key, fallback)` (static fallback to existing `data/*`, so nothing breaks), auth state, draft/preview/publish, media upload.
  - `components/cms/Editable.jsx` — `EditableText` (plain + **rich** bold/italic/link/list), `EditableImage` (upload **or** paste URL incl. YouTube/Vimeo), `EditableList` (add/remove/**reorder** + per-item image upload).
  - `components/cms/CmsAdminLayer.jsx` — login modal + pinned **Edit · Preview · Publish · Discard · Sign-out** bar.
  - Admin entry: `?admin=1` (or `Ctrl+Shift+E`); credentials in `/app/memory/test_credentials.md`.
- ✅ **Wired live-editable sections:** Home hero (badge, headline, accent, rich subtitle, both CTAs, disclaimer, **banner image**), **global logo**, **testimonials** (full list editor), **blog index** heading + intro.
- Visitors see published content; admins see drafts in edit/preview; publish promotes. Public site unaffected when logged out.

**Phase 1 REMAINING (carry-over) / next:**
- ⏳ **Blog per-article CRUD** (create/edit/delete posts, body markdown, post images) — index copy is wired; full post management is the larger sub-item, deferred.
- ⏳ Individual **trust-band logos** + remaining "key images" beyond hero banner & brand logo.
- ⏳ **G4 QA** (independent end-to-end test of login, edit, image upload, reorder, draft→publish, fallback) then **G5 owner smoke**.

**Phase 2/3:** unchanged from plan below (Solutions/Product/sector/pricing/AI, then hardcoded-copy extraction + per-page SEO + global footer/contact).

### G2 Plan (architecture + phasing)
**Data model (MongoDB):**
- `content` collection — flexible docs keyed by `key` (e.g., `home.hero.headline`) with
  `{ key, type: text|richtext|image|video|list|seo, published_value, draft_value, status, updated_by, updated_at }`.
- `media` collection — `{ id, kind: image|video, url, filename, size, uploaded_by, created_at }`.
- **Storage abstraction** `storage.py`: `LocalStorage` (serves `/api/media/...` from disk now) + `S3Storage`
  (later), switched by env `STORAGE_BACKEND`. No app code change to swap.

**Auth:** 2 users in `backend/.env` (JWT login `/api/auth/login`); admin content APIs JWT-protected.

**APIs:** public `GET /api/content` (published, with static fallback) · admin (JWT) `GET /content/draft`,
`PUT /content/:key`, `POST /content/publish`, `POST /media/upload`.

**Frontend:** `ContentProvider` + `useContent(key, fallback)` (falls back to existing `data/*` so nothing breaks);
editable wrappers `<EditableText|Image|Video|List>`; admin "Edit mode" with ✎ pencils, rich-text popover,
media picker, structured-list slide-over (reorder), SEO popover, and a Draft·Preview·Publish bar.

**Phases:**
- **Phase 1 (foundation + high-churn) — ✅ DONE & QA-passed (at G5):** auth (env JWT), content model + storage abstraction (local, S3-ready), media upload, `CmsProvider` + `useContent` static fallback, Draft→Preview→Publish, inline editing for **Home hero/banner, logo & key images, testimonials, trust band, blog (incl. per-article CRUD)**, plus "Last published by · time" audit chip.

- **Phase 2 (high-value pages) — 2a + 2b + 2c COMPLETE (Pricing ✅, AI ✅, Solutions ×11 ✅, Product ×6 ✅), 2d planned. ALL 3 framework additions LANDED:**
  - **Framework additions:**
    1. **`lines` field type** ✅ **DONE in 2a** in `EditableList`/list editor (textarea ⇄ string-array) — for `plan.includes[]` bullets and `module.caps[]` chips.
    2. **Dedicated FAQ editor** ✅ **DONE in 2b** — `EditableFaqList` + `FaqEditorModal` in `/components/cms/FaqEditor.jsx`. Handles q/a/details + nested `media{type,src,poster,caption}` + `links[{label,to|href}]` with upload+URL paste, reorder, add/delete. Used for `ai.faqs`; reusable for sector/product FAQs in 2c.
    3. **`useContentDoc(key, fallbackObj)` helper** ✅ **DONE in 2b** — exported from `CmsProvider.jsx`. Reads one CMS key holding JSON, shallow-merges over `fallback` (arrays replace wholesale, objects key-by-key). Companion `useSaveDoc()` writes the whole doc with `type="doc"`. AI page uses `useContentDoc("ai", …)` for hero/crosslink/demo copy, `useContentDoc("ai.features", …)` for the features array, and the FAQ editor uses `useSaveDoc("ai.faqs", …)`. Also unlocked dot-path keys in `EditableList` (`outcome.value`, `outcome.label`).
  - **Decisions locked (owner, 2026-06-08):**
    - **Pricing = display fields only** — editable: plan `name/price/tagline/popular/includes`, addon `name/price/desc`. **Code-controlled (NOT editable):** plan/addon `id`s, `includedAddons` mapping, `QUIZ`, and the `recommend()`/`alsoAdded()` engine (business logic, not content).
    - **Icons stay code-controlled in Phase 2** (lucide name strings); the **icon picker is deferred to Phase 3**.
    - **Hardcoded section sub-headings** (e.g. AiPage hero copy, "We know {sector} run on tight margins…") stay static in Phase 2 — extraction is **Phase 3**.
  - **Build sequence:**
    - **2a — Pricing** ✅ **COMPLETE (G4 QA passed, iteration_3.json)**: hero text, plans + add-ons display fields (`lockItems`, `lines` for `includes`), annual-discount labels.
    - **2b — AI page** ✅ **COMPLETE (G4 QA passed, iteration_4.json)**: introduced FAQ editor + `useContentDoc`. Wired hero (eyebrow/h1/sub/cta), `AI_FEATURES` (title/pain/solution/`outcome.value`/`outcome.label`/`videoSrc`/`poster`, `lockItems`, icons code-controlled), central-inventory crosslink (title/body/cta), FAQ heading, demo section heading/sub/bullets, and `AI_FAQS` via `EditableFaqList`. Verified end-to-end: PUT writes → publish → public render of hero override, partial feature override (merge preserves untouched features + code-controlled icon), and full FAQ array replacement. State cleaned.
    - **2c — Solutions ×11 + Product ×6 detail pages** ✅ **COMPLETE (G4 QA passed, iteration_5.json — 100% on all 17 detail pages, no retest needed)**: framework framework framework — same patterns 17 times. New helper `/lib/cms/mergeUtils.js` exports `mergeByIndex(base, override, preserveKeys=[])` for index-based merges (lockItems mode guarantees stable indexes; `icon` preserved as code-controlled). `SectorPage.jsx` and `ProductPage.jsx` rewired slug-driven, so adding a new sector/product in `data/sectors.js` or `data/products.js` automatically gives it CMS pencils. Per-slug keys: `sector.<slug>.{hero.eyebrow,hero.h1,hero.sub,metric.value,metric.label,pains,solutions,proof,faqs}` (9 editors per sector × 11 = 99 editors). `product.<bucket>.{hero.eyebrow,hero.h1,hero.sub,metric.value,metric.label,video,modules,proof,faqs}` (9 editors per product × 6 = 54 editors). Modules `caps[]` use the `lines` field; product video (videoUrl + poster) editable via `EditableList lockItems` with image-type fields (accepts mp4/webm uploads and YouTube/Vimeo URLs). Dynamic section sub-headings ("We know cafés run on tight margins…", "Real cafés results.") remain code-controlled per the locked plan (moved to Phase 3). Verified by testing_agent_v3 across all 17 pages: per-key writes for hero h1, partial list overrides (only index 0) with mergeByIndex preserving untouched indexes AND code-controlled `icon` field on solutions + modules; lines-field `caps` round-trip; product video URL swap to YouTube; invalid-slug Navigate safety (`__missing` docKey prevents hooks-order error); 0 hydration warnings; full /pricing + /ai regression CLEAN. State cleaned (6 docs deleted from `cms_content`).
    - **2d — Solutions/Product index hero copy + QA-surfaced UX fixes** (locked 2026-06-08 post iteration_5):
      - **2d.1 (P0, original scope)** — `SolutionsIndex.jsx` + `ProductIndex.jsx` hero copy via `EditableText`: eyebrow, h1, sub, optional CTA label. Pure wiring, no new framework. Keys: `solutions.index.hero.{eyebrow,h1,sub,cta}`, `product.index.hero.{eyebrow,h1,sub,cta}`.
      - **2d.2 (P1, from iteration_5 LOW finding)** — backfill a 2nd proof card in `/app/frontend/src/data/sectors.js` for `food-courts` and `canteens` so all 11 sectors ship with 2 proof cards in fallback (current gap predates Phase 2c but blocks proof-count parity assumptions in QA). Pure data file edit, ~10 lines.
      - **2d.3 (P1, from iteration_5 LOW finding)** — fix CMS first-login UX: after a fresh `cms-login-submit` the editbar currently lands with **Preview mode ON**, hiding all pencils until the editor clicks `cms-toggle-preview` once. This caught the testing agent on the first asserted pencil count. Fix in `CmsProvider.jsx`: on successful login set `previewMode=false`, OR persist the last-used mode in `localStorage` so returning admins resume where they left off. Add a small first-time tooltip on the toggle ("You're in Edit mode — click here to preview as a visitor"). Small Editbar copy tweak in `CmsAdminLayer.jsx`.
  - Each 2a–2d slice ships through its own G3→G4 QA before the next.

- **Phase 3:** extract remaining hardcoded copy (About, ROI, Contact, all section sub-headings), per-page **SEO popover** (title/description), **icon picker**, global **footer/company** info.

**Remaining to start build:** the 2 admin credentials (env). Auth + storage playbooks pulled via `integration_expert`.

---

## Change log
- 2026-06-08 — **CR-4B OTP verification (Demo form) BUILT & LIVE-VERIFIED** (iteration_8). Built via `integration_expert` first. New `backend/otp.py`: 4-digit OTP, peppered HMAC-SHA256 hash, Mongo `otp_codes` (1h TTL doc / 10-min validity), 30s resend / 5-per-hr / 5-attempt lock, signed 15-min JWT bound to phone. Endpoints `POST /api/otp/send` + `/api/otp/verify`; `/demo-request` accepts optional `otp_token` → verified lead, else graceful **`OTP-Unverified`** Freshsales tag (never blocks). Frontend `DemoForm.jsx` OTP step (send→4-digit→verify→"Phone verified", 30s resend, soft-fail). SMS via owner panel `123.108.46.13` (`username=MYGENIE`, `sender=HSEGNI`, `route=TRANS`, `TemplateID=1707178030188539801`, httpx `verify=False`), gated by `OTP_SMS_ENABLED`. **Owner flipped `OTP_SMS_ENABLED=true` → real SMS delivered to 7505242126, code verified → token issued. Live mode left ON.** Bonus: `cf_rooms` ("OTP verified") now written Yes/No on demo leads. ⚠️ DLT template footer ("Mygenie"/"TEAM HOSIGENIE") is owner-side DLT-registered text — to change to "Team MyGenie", owner re-registers template + sends new `SMS_TEMPLATE_ID` (1-line env swap). **→ G5 owner smoke.**
- 2026-06-08 — **CR-2 Attribution & Data Capture BUILT & LIVE-VERIFIED** (iteration_9). Frontend `lib/attribution.js` (first-touch localStorage / last-touch sessionStorage / device·os·browser·lang·tz / pages·time / gclid·fbclid·gbraid·wbraid·msclkid·`_fbp`) + `AttributionTracker` in `App.js`, attached to **all 4 forms** (Demo/Quote/ROI/Contact). Backend `_attribution_to_crm()` maps to Freshsales **native** `first_source/medium/campaign` (first-touch, set-once), `latest_source`=**gclid** (Option B, falls back to last utm_source), `latest_medium/campaign` (last-touch) + **cf_** `cf_pos_satifcation_level`=utm_term, `cf_est_name`=utm_content, `cf_latitude`=fbclid, `cf_orders_taken_via`=_fbp. Full attribution object stored in Mongo on every lead. `freshsales.upsert_contact(extra_fields=…)` writes native fields and **preserves first-touch on returning contacts** (drops `first_*` on update). **Geo/city** via new `backend/geo.py` (`ipwho.is`, keyless HTTPS — ipapi.co 429-blocks datacenter IPs) → native `city` field (typed city wins; region/country → Mongo `geo{}`); best-effort, never blocks capture. **Live-verified against Freshsales**: native+cf_ read-back correct, first-touch preserved on repeat, contact-form geo city = Navi Mumbai (Indian IP), typed "Agra" beats geo. Mapping + **still-missing CRM fields list** (landing/referrer/device/lang/tz/pages/time/region/country/other click-ids → Mongo-only until CRM fields created): `/app/CR-2_Attribution_Mapping.md`. **→ G5 owner smoke.**
- 2026-06-08 — **CR-7 INTAKE & DISCOVERY captured (G1 only, no build)**: Internal read-only **Leads View** for sales triage — surface each lead's source/medium/campaign, city, OTP status, intent/form-type at a glance without opening Freshsales. It's a read/aggregate + UI layer over data **already captured** in Mongo by CR-1b/CR-2/CR-4B (no new capture, no schema change). Open questions for G2: auth (reuse CMS JWT?), unified vs tabbed, filters (verified-only / paid-source / city / date / intent), read-only vs light actions (mark-contacted/CSV/Freshsales link), pagination, PII masking. Full intake in `/app/CR-7_Leads_View_Discovery.md`. **Status: G1 Discovery — awaiting G2 planning/scope sign-off.**
- 2026-06-07 — Dashboard created. CR-1..CR-4 registered. 5-gate model adopted.
- 2026-06-07 — CR-1a (Contact form + number switch) & CR-4 Part A (anti-junk) shipped → G5.
- 2026-06-07 — CR-5 (Solutions/Product overview pages + nav dropdown UX fixes) shipped → G5.
- 2026-06-07 — CR-6 (Website Content Management / CMS) opened at G1 Discovery — full content inventory done; awaiting owner decisions.
- 2026-06-08 — CR-6 corrected: G2 decisions locked. A prior agent started G3 **without approval** and built backend-only scaffolding (cms_auth/storage/server CMS routes + auth_testing.md) before dying mid-smoke-test. Verified inert (no frontend, no env wiring, empty `cms_content`, no uploads). **Status set to G3 PAUSED — frozen pending owner approval.**
- 2026-06-08 — CR-6 **G3 Phase 1 approved by owner & BUILT**: backend env wired; new frontend inline-edit framework (CmsProvider/useContent, EditableText/Image/List, login + Edit·Preview·Publish bar). Wired Home hero, global logo, testimonials, blog index. Backend curl smoke + frontend login/edit verified. **Awaiting G4 QA.** Carry-over: blog per-article CRUD, trust-band logos.
- 2026-06-08 — CR-6 **Phase 1 G4 QA PASSED**: 18/18 backend tests (login/me/draft/publish/discard/media) + all frontend flows green. One MEDIUM bug found & fixed (Preview toggle now hides pencils — verified 11→0). **Phase 1 at G5 owner smoke.** Test file: `backend/tests/test_cms.py`.
- 2026-06-08 — CR-6 **Phase 1 carry-over DONE**: blog per-article CRUD (`blog.posts` content key drives `/blog` + `/blog/:slug`, add/edit/delete/reorder + cover-image upload + markdown body) and trust-band **metrics + logos** editors. QA (iteration_2) found 1 HIGH bug — deep-linking a CMS-only post redirected to /blog (async publish race); **fixed** via `publishedLoaded` flag + loading state in `BlogPost.jsx`; re-verified deep-link renders. Live content reset clean (21 posts). **Phase 1 fully complete → G5 owner smoke.**
- 2026-06-08 — CR-6 enhancement: **"Last published by · time" audit chip** on the CMS bar. Backend records publisher+timestamp to `cms_meta` on publish (new auth-protected `GET /api/cms/meta`); chip refreshes after each publish. Verified live ("Published 1m ago · admin@mygenie.online").
- 2026-06-08 — CR-6 **Phase 2 plan locked** (owner approved recommendations). Phase 2 is NOT pure wiring: build 3 framework additions first — (1) `lines` field type for nested string-arrays (`plan.includes`, `module.caps`), (2) dedicated **FAQ editor** (nested media+links, reorder), (3) `useContentDoc(key, fallbackObj)` one-JSON-doc-per-page helper. Decisions: Pricing = display fields only (recommendation engine + IDs stay code-controlled); icons code-controlled (picker → Phase 3); hardcoded section sub-headings → Phase 3. Build sequence: **2a Pricing → 2b AI page → 2c Solutions(11)+Product(6) details → 2d Solutions/Product index heroes**, each slice through its own G3→G4 QA. See CR-6 §Phases for detail.
- 2026-06-08 — CR-6 **Phase 2a (Pricing) BUILT & G4 QA PASSED** (iteration_3.json, 100% green, 0 bugs). Framework addition #1 — `lines` field type — shipped in `EditableList`/`ListModal` (textarea ⇄ string-array, trims empties on save). Pricing page wired: hero (eyebrow/h1/sub via `EditableText`), plans editor (`pricing.plans`, `lockItems`, fields: name/price/tagline/popular bool/includes lines), add-ons editor (`pricing.addons`, `lockItems`, fields: name/price/desc textarea). `mergeById` helper preserves logic fields (`id`, `includedAddons`, `icon`) and coerces price→Number, popular→Boolean — recommendation engine + QUIZ + alsoAdded() untouched. Verified: Starter 799→999 publish flows logged-out cart recalc; `popular` toggles MOST POPULAR badge; addon name overrides survive publish; lockItems hides add/delete/↑↓ in slide-over; RecommendQuiz logic intact after CMS merge. Cleanup verified clean (all QA values reverted/republished). **Phase 2a follow-up (this commit):** annual-discount labels wired through `EditableText` per the locked plan — new keys `pricing.billing.monthly_label`, `pricing.billing.annual_label`, `pricing.cart.total_annual_label`, `pricing.cart.total_monthly_label`, `pricing.plan.annual_note` (CartSummary + PlanCard). Phase 2a CLOSED → G5 owner smoke. Phase 2b (AI page) is next; introduces framework addition #2 (FAQ editor) and is the right slice to also land framework addition #3 (`useContentDoc`).
- 2026-06-08 — CR-6 **Phase 2b (AI page) BUILT & self-tested**. Framework additions #2 + #3 LANDED. (a) **`useContentDoc(key, fallbackObj)` + `useSaveDoc()`** added to `CmsProvider.jsx` — reads one CMS key holding JSON, shallow-merges over fallback (arrays replace wholesale, objects key-by-key); saves whole doc via `type="doc"`. (b) **`EditableFaqList` + `FaqEditorModal`** at `/components/cms/FaqEditor.jsx` — dedicated FAQ slide-over handling `q`, `a`, `details[]`, nested `media{type:image|video, src, poster, caption}` (file upload OR paste URL incl. YouTube/Vimeo), `links[{label, to|href}]` with internal/external toggle, plus reorder/add/delete. (c) **`EditableList` extended** with dot-path field keys (`outcome.value`, `outcome.label`) and `image` field now accepts video uploads + paste-URL fallback. (d) **AiPage wired**: hero (eyebrow/h1/sub/cta `EditableText`), feature list `EditableList id="ai.features"` (`lockItems`, fields title/pain/solution/outcome.value/outcome.label/videoSrc/poster) with `mergeFeatures` preserving `id` + `icon`, crosslink section (title/body/cta), FAQ heading, demo section heading/sub/bullets, FAQ list via `EditableFaqList id="ai.faqs"`. Self-test via API + Playwright: PUT writes for hero override + partial feature override + full FAQ array replacement → publish → public render verified (other 6 features untouched, code-controlled icons intact, FAQ list replaced with media + links rendered correctly). Pricing page regression-tested (4 plans/9 addons/annual labels OK). Edit-mode UI verified: editbar + "Edit list" pencils on features + "Edit FAQs" button + FAQ slide-over (media block, links block, reorder, add/delete, save) all functional. Live state CLEANED (3 `ai.*` keys deleted from `cms_content`). **Phase 2b CLOSED → G5 owner smoke.** Phase 2c (Solutions ×11 + Product ×6 detail pages) is next — heavy reuse of all 3 framework additions; `useContentDoc("sector.<slug>", …)` and `useContentDoc("product.<slug>", …)` per page.
- 2026-06-08 — CR-6 **Phase 2b /ai formal G4 QA PASSED** (testing_agent_v3, iteration_4.json, 100% — 12/12 frontend flows green, 0 critical bugs). Validated end-to-end via Playwright: admin login → editbar with 13 `edit-ai.*` pencils → hero h1 round-trip (draft → preview → publish → fresh-tab logged-out render) → features `lockItems` slide-over (7 rows, 0 add/0 delete/0 reorder, dot-path `outcome.value/label` + media fields) → `mergeFeatures` correctness (only menu-import edited; other 6 features + all code-controlled icons preserved) → FAQ editor (faq-editor-ai.faqs slide-over with media block, links block, reorder, add/delete, save) → useSaveDoc writes 6-item array with one QA FAQ → publish → public list renders all 6 via `FaqItem`, including image media + 2 links. Logged-out /ai shows 100% fallback (original H1, 7 features, 5 FAQs, 2 JSON-LD scripts). /pricing regression CLEAN (4 plans incl. ₹799 Starter + 'MOST POPULAR' Pro badge, 9 addons, billing toggle, annual labels). Cleanup confirmed (3 ai.* docs deleted from `cms_content`). **One LOW cosmetic finding** — `<div> cannot be a descendant of <p>` hydration warning from `<EditableText block>` inside `<p>` tags at hero sub, crosslink body, demo sub. **FIXED in same commit**: dropped `block` prop from those three `EditableText` calls in `AiPage.jsx`; Playwright re-run shows 0 hydration warnings, page render unchanged. **Phase 2b G4 ✅ → G5 owner smoke.** No retest needed.
- 2026-06-08 — CR-6 **Phase 2c (Solutions ×11 + Product ×6 detail pages) BUILT & self-tested via API + Playwright**. This is where the framework pays off: 17 pages, **153 new editors** auto-wired by writing only 2 page templates. New helper `/app/frontend/src/lib/cms/mergeUtils.js` exports `mergeByIndex(base, override, preserveKeys=[])` and `parseListJson()` — used to preserve code-controlled `icon` keys while letting display fields be overridden by index (safe because `lockItems` mode guarantees stable indexes). `SectorPage.jsx` rewired slug-driven with per-slug keys: `sector.<slug>.{hero.eyebrow|h1|sub, metric.value|label, pains, solutions, proof, faqs}` (9 editors × 11 sectors = **99 editors**). `ProductPage.jsx` rewired bucket-driven with: `product.<bucket>.{hero.eyebrow|h1|sub, metric.value|label, video, modules, proof, faqs}` (9 editors × 6 products = **54 editors**). Lists use `EditableList lockItems` with field types: text/textarea/`lines` for `module.caps[]`/image (for product video — accepts mp4/webm uploads AND YouTube/Vimeo URLs). FAQs use `EditableFaqList` per slug. Dynamic section sub-headings ("We know cafés run on tight margins…", "Real cafés results.", "Built for the way cafés actually work.") use `s.name.toLowerCase()` and stay code-controlled (deferred to Phase 3 per locked plan). Verified end-to-end: published 5 keys (`sector.cafes.hero.h1`, `sector.cafes.pains` partial override on idx 0, `sector.cafes.solutions` partial override on idx 0, `product.sell-serve.modules` with `caps` lines, `product.sell-serve.video` with YouTube URL) → public render of `/solutions/cafes` showed "QA cafés H1", pain #0 "QA pain 0/QA desc 0", pains #1-3 fallback intact, solution #0 title overridden with **icon SVG preserved**, all other solutions untouched. `/product/sell-serve` showed module #0 "QA POS/QA outcome line" with 2 caps "QA cap A/QA cap B", **icon SVG preserved**, modules #1-5 fallback intact, FeatureVideo embedding YouTube iframe. Edit-mode UI verified on `/solutions/restaurants?admin=1` and `/product/sell-serve?admin=1`: 9 pencils per page, lockItems hides list-add (0 add buttons in slide-overs), caps `lines` textarea renders "one per line" hint and joins/splits correctly. Live state CLEANED (5 keys deleted from `cms_content`). 0 hydration warnings, 0 ESLint errors. **Phase 2c CLOSED → G5 owner smoke.** Phase 2d (Solutions / Product index hero copy) is next — smallest slice, pure `EditableText` wiring on `SolutionsIndex.jsx` and `ProductIndex.jsx`.
- 2026-06-08 — CR-6 **Phase 2c formal G4 QA PASSED** (testing_agent_v3, iteration_5.json, 100% on all 17 detail pages — 11 sectors + 6 products, **no retest needed**). Validated end-to-end across all 17 pages: render parity, edit pencils (9 per sector × 11 + 9 per product × 6 = 153 wired), `lockItems` honored on every list (pains/solutions/proof/modules/video/proof), `mergeByIndex` correctness (cafés pain #0 + solution #0 overridden with **icon SVG preserved** by `preserveKeys=['icon']`; pains #1-3 + solutions #1-3 fallback intact), `lines` field on product modules `caps[]` (sell-serve mod #0 → 3 caps as `<li>` items, **icon preserved**, mod #1-5 fallback intact), product video URL editable (YouTube embed verified), slug isolation (cafés edits do not affect /solutions/restaurants), invalid-slug Navigate safety (no React hooks-order error via `__missing` docKey), 0 hydration warnings, 0 console errors. Logged-out fallback CLEAN after cleanup; /pricing + /ai regression CLEAN. State CLEANED (6 sector.*/product.* docs deleted from `cms_content`). **Two LOW non-blocking findings folded into Phase 2d planning:** (1) `food-courts` and `canteens` fallback ship with only 1 proof card vs 2 elsewhere — predates Phase 2c, sectors.js data gap, ~10-line fix → **Phase 2d.2**. (2) CMS first-login UX: editbar lands with **Preview mode ON**, so a freshly-logged-in admin sees no pencils until they discover `cms-toggle-preview` — fix in `CmsProvider.jsx` (set `previewMode=false` on login OR persist last mode in localStorage) plus first-time hint → **Phase 2d.3**. Both fixes piggyback on the pure-`EditableText` Phase 2d slice without expanding scope materially. **Phase 2c G4 ✅ → G5 owner smoke.**

- 2026-06-08 — CR-6 **Phase 2 FULL regression + backend CMS API regression PASSED** (testing_agent, iteration_7.json, **100% — 20/20 pytest + all frontend surfaces, 0 product bugs, no retest needed**). Confirmed 2a/2b/2c/2d coexist with zero regressions: backend `test_cms.py` 20/20 (auth/draft/publish/discard/meta/media, public GET excludes null published_value); logged-out fallback parity on /pricing, /ai, /solutions, /product + all 11 sectors + all 6 products (food-courts & canteens both show 2 proof cards — 2d.2 confirmed); admin pencil counts correct on every surface; single-session cross-phase round-trip (5 keys: pricing/solutions-index/product-index/sector.cafes/product.sell-serve hero h1 → one publish → fresh logged-out render verified, slug isolation intact, icon SVG preserved); Phase 2d localStorage mode persistence verified across reloads; 0 console errors / 0 hydration warnings everywhere. **One TEST-CODE fix (not a product bug):** `test_cms.py` was using stale `@mygenie.online` creds + a hardcoded URL — testing agent updated it to canonical `admin/admin123`+`editor/editor123` and added a dotenv loader for `REACT_APP_BACKEND_URL`. MANDATORY cleanup done (7 QA keys deleted via mongosh); final `cms_content` holds only canonical `home.hero.badge`. **All of CR-6 Phase 1+2a+2b+2c+2d G4-passed and regression-clean → G5 owner smoke.**
- 2026-06-08 — **CR-1b BUILT** (Freshsales `cf_` mapping fix; owner supplied the authoritative `$crmData` map from their existing app). **Root cause fixed:** `freshsales.py` was sending `custom_fields` (plural) → Freshsales silently dropped ALL qualifier data; now sends **`custom_field` (singular)** with the exact `cf_` API names. Wired the **15 live fields** across `/demo-request`, `/quote`, `/contact`: standard `city`/`job_title`(←business_name)/`mobile_number`/`work_number`; custom `cf_outlet_type`, `cf_first_interest`(←message, Contact), `cf_sku`(←years_in_business), `cf_pos_used`(←using_pos), `cf_pos_name`(←current_pos), `cf_longitude`(←client IP), `cf_category`(←user_agent). New `_client_meta(request)` helper derives IP (X-Forwarded-For) + UA. **`external_id` changed UUID → `web_<phone>`** (cross-form dedup key, matches owner's other app). Owner decisions: Quote/Buy (plan/billing/addons/total), ROI numbers, and `preferred_contact` → **MongoDB only** (no `cf_` slot); 8 attribution fields (utm_*/gclid/fbclid/fbc/placement) stay unwired until **CR-2**; `event_id`→`latest_campaign` ignored for now (revisit with Meta/Google Ads). **Verified** by intercepting the outgoing Freshsales payload (no live CRM write): correct `custom_field` key, `cf_` names, `external_id=web_<phone>`, empty values dropped. Backend boots clean, `/api/` 200. `cf_` names are from owner's production app so Freshsales will accept them. **Recommended next:** one live demo submit to confirm in the Freshsales UI (owner to verify). CR-4B (OTP, Demo-only) planned & input-complete — awaiting build go.
- 2026-06-08 — **CR-1b LIVE-VERIFIED against production Freshsales + "Multi-Form" enhancement shipped.** Fired 3 real test leads through the external API: (1) Demo `9111100001` → new contact `402209074834`; (2) Quote/Buy same phone `9111100001` → **deduped to the SAME contact** (PUT, not new); (3) Contact `9111100002` → separate contact `402209074908`. Verified by reading contacts back: contact 1 holds `custom_field` = `{cf_outlet_type:'Cafe', cf_sku:'1-3 years', cf_pos_used:'Yes', cf_pos_name:'Petpooja', cf_longitude:<IP>, cf_category:<UA>}` + standard `city='Agra'`/`job_title`/`work_number` + `external_id='web_9111100001'`, **tags `['Website Demo Lead','Buy Online','Multi-Form']`**; contact 2 has tag `['Website Contact']`. Confirmed all 7 `cf_` names exist in the account via `GET /settings/contacts/fields`; every create/update returned 200 (no 400/strip). **Dedup hardening:** added `lookup_contact_by_phone` (f=mobile_number) fallback so returning visitors match even without email. **Multi-Form tag:** `freshsales.py upsert_contact` now appends `Multi-Form` whenever an existing contact is matched (repeat/cross-form submitter) — gives sales a high-intent signal. Notes: lifecycle/status read back null (write-only on this account, owner verifies in UI); `cf_category`/`cf_longitude` showed `curl`/server-IP because tested via curl — real browser submits populate true UA + visitor IP (X-Forwarded-For). Test contacts `402209074834` + `402209074908` left in CRM for owner screenshot; safe to delete after.
- 2026-06-08 — CR-6 **Phase 2d BUILT & G4 QA PASSED** (testing_agent, iteration_6.json, 100% on all 3 sub-slices + regression, 0 bugs, **no retest needed**). **2d.1** Solutions + Product **index** hero copy wired via `EditableText` — keys `solutions.index.hero.{eyebrow,h1,sub,cta}` (`SolutionsIndex.jsx`) and `product.index.hero.{eyebrow,h1,sub,cta}` (`ProductIndex.jsx`); hero sub uses `multiline rich` (no `block`, inside `<p>`) → 0 hydration warnings; round-trip h1 edit → publish → fresh logged-out render verified on both pages. **2d.2** Data parity: backfilled a 2nd proof card for `food-courts` (Phoenix Food Plaza) and `canteens` (TechPark Central Canteen) in `data/sectors.js` — all 11 sectors now ship 2 proof cards (`sector-proof-0` + `sector-proof-1`). **2d.3** CMS UX: `CmsProvider.jsx` now lazy-inits `editMode`/`preview` from `localStorage` (`cms.editMode`/`cms.preview`) + persists via two `user`-gated effects; `login()` restores last-used mode and defaults **editMode=true for first-time admins** so pencils show immediately — closes the iteration_5 "Preview-on-login hides pencils" discoverability gap. Returning admins resume their prior mode across reloads (verified: toggle Preview → reload → resumes Preview; toggle Edit → reload → resumes Edit). Regression CLEAN (/pricing 8 pencils, /ai 13 pencils, /solutions/cafes + /product/sell-serve detail pencils all intact). State CLEANED (2 `*.index.hero.h1` QA keys deleted; `GET /api/cms/content` clean). Also recreated `/app/memory/test_credentials.md` (was missing). **Phase 2d G4 ✅ → G5 owner smoke.** All of CR-6 Phase 1+2a+2b+2c+2d now G4-passed.
- 2026-06-08 — **CR-3 B code batch SHIPPED & dataLayer-verified** (iteration_10.json). Fresh repo pull (8-june) wiped/re-ran; recreated `.env` files + `test_credentials.md`. Implemented the low-risk frontend batch one-shot: **#3 tiered conversion values** via new `pushLead(event,…)` + `CONVERSION_VALUES` map (form_submitted=₹0, **lead_verified=₹500 — owner-set "Book demo"**, demo_booked=₹2000 default); **#4 segmentation** `otp_verified`/`form_location`/`plan_interest`; **#5 suppression** `lead_quality` junk|ok via new `leadQuality(signals)` in `antiBot.jsx` (mirrors backend `looks_like_bot`: honeypot OR <2000ms = junk); **#6 click-IDs** `gbraid`/`wbraid`/`msclkid` added to `buildLeadPayload`. **#2 Consent Mode v2**: `gtm.js` sets EEA-safe `consent default` (all denied + `wait_for_update:500`) before container load + applies stored choice; new `ConsentBanner.jsx` (testids `consent-banner`/`consent-accept-btn`/`consent-decline-btn`) persists `mg_consent` + pushes `consent update`. Wired across all 5 lead surfaces (DemoForm, MessageForm, CalendlyInline, CheckoutModal, RoiCalculator). **Bug found & fixed:** ConsentBanner rendered outside `<BrowserRouter>` → `<Link>` crashed ("Cannot destructure basename"); switched to `<a href=/privacy>`. **Verified (headless dataLayer assertion, lead API mocked → no real lead):** page_view fires; banner Accept → all 4 consent signals granted; form_submitted payload carries conversion_value/currency, form_location=homepage, otp_verified=false, lead_quality=ok, gclid/fbclid/gbraid/wbraid/msclkid, source, first/last name, external_id=+91…. **All remaining #1–#6 work is owner/GTM-side** (EC + Advanced Matching mapping, GA4 custom dimensions, value→Ads/Meta mapping, exclusion audiences, consent variables). Deferred: #7 (GA4 recommended event names, GTM-only), #8 (user_id, needs login). **→ G5 owner smoke.**- 2026-06-08 — **CR-3 CRITICAL FIX — event names aligned to the LIVE GTM container (zero GTM edits).** Owner shared the real `GTM-K5D84Z3L` trigger configs. Verified internal **Event names**: `Book demo` trigger = **`thankyou_conversion`** (fires FB/GA4/GAds - Book demo), `lead_verifided` trigger = **`lead_verifided`** (TYPO in their container; fires FB/GA4 - OTP Verified + GAds - Book Demo), `OTP - form_submitted` trigger = **`form_submitted`**. Our React site was firing `lead_verified` (no typo) + `demo_booked`, which would NOT match → all verified/booking conversions would have silently failed on the new site. **Fix (code-only, in `gtm.js`): `GTM_EVENT_NAME` map renames our semantic events to the container's exact names** — `lead_verified`→`lead_verifided` (typo preserved intentionally), `demo_booked`→`thankyou_conversion`, `form_submitted` unchanged. `conversion_value` still keyed by our semantic names (form_submitted=0, lead_verified=500, demo_booked=2000). **Owner DOES NOT need to repoint anything** — `GAds - Book Demo` already fires on `lead_verifided` (the verified event), so the earlier "repoint to lead_verified" task is MOOT/superseded. **Verified via headless dataLayer:** OTP-verify pushes `lead_verifided` (value=500, otp_verified=true, gclid passed), submit pushes `form_submitted` (value=0); `thankyou_conversion` uses the same path on Calendly booking. Remaining owner-side: optionally fix the `lead_verifided` typo someday (would then also need our code updated), and create a `demo_booked`/Calendly trigger only if they want booking tracked separately from `thankyou_conversion`.
- 2026-06-08 — **CR-3 event-map refinement (owner direction).** Owner clarified: `thankyou_conversion` = the **Book Demo** conversion (demo-form completion), and **Calendly must fire a NET-NEW event** (owner will add the trigger). Updated `gtm.js`: new semantic event `book_demo`→`thankyou_conversion` (₹500) fired on DemoForm submit success (alongside generic `form_submitted`); `demo_booked` is no longer renamed to `thankyou_conversion` — it now fires as its own event **`demo_booked`** (₹2000) on Calendly `event_scheduled`. **Owner TODO:** create a GTM Custom-Event trigger with Event name `demo_booked` + attach the appointment conversion tags (GA4/FB/GAds). Verified via headless dataLayer: demo submit → `form_submitted`(0) + `thankyou_conversion`(500) + earlier `lead_verifided`(500); `demo_booked` fires only on real Calendly booking.
- 2026-06-09 — **Pre-deploy fixes + readiness PASS.** deployment_agent flagged: (1) `.gitignore` lines 98–100 (`.env`/`.env.*`/`*.env`) blocked the env files from deploying → removed them so `backend/.env` + `frontend/.env` ship to prod; (2) **`frontend/.env` was MISSING `REACT_APP_GTM_ID`** (dropped when env was recreated after the fresh 8-june clone) → re-added `REACT_APP_GTM_ID=GTM-K5D84Z3L`. This was critical: GTM is read from that var and is host-gated to www.mygenie.online, so without it NO tags (lead_verifided/thankyou_conversion/demo_booked/consent) would fire in production. Re-ran deployment_agent → PASS (DB list-endpoint .to_list(1000/5000) caps deemed non-blocking pre-existing admin patterns). GTM container published by owner with `calendly Trigger` + `GA4 - Book Appointment` tag. NEXT: owner clicks Deploy → re-register Calendly webhook to prod URL → 1 test booking → verify demo_booked in GTM Preview + GA4 realtime → finish Google Ads "Book appointment" conversion via the now-available GA4 `demo_booked` key event → decommission Zapier appointment import.

═══════════════════════════════════════════════════════════════════════════════
## SESSION SUMMARY — 2026-06-08 / 06-09  (repo re-pull + CR-3B + GTM alignment + deploy-ready)
═══════════════════════════════════════════════════════════════════════════════
**Context:** Fresh pull of GitHub `Abhi-mygenie/website` branch `8-june` into a wiped `/app`. Recreated git-ignored `.env` files, installed deps, services up, app live on preview. Then continued CR-3B and wired the site to the OWNER's live GTM container, ending deploy-ready.

**1. CR-3B Tracking-enhancements CODE BATCH (iteration_10) — DONE & dataLayer-verified**
- #3 tiered `conversion_value` via new `pushLead()` + `CONVERSION_VALUES` (form_submitted=0, lead_verified/book_demo=500 [owner-set Book demo], demo_booked=2000).
- #4 segmentation: `otp_verified`, `form_location`, `plan_interest`.
- #5 suppression: `lead_quality` junk|ok (`leadQuality()` in antiBot.jsx, mirrors backend looks_like_bot).
- #6 full click-IDs: `gbraid`/`wbraid`/`msclkid` added to buildLeadPayload.
- #2 Consent Mode v2: EEA-safe default before container + update on choice; new `ConsentBanner.jsx`.
- Bug fixed: ConsentBanner used react-router `<Link>` while mounted OUTSIDE `<BrowserRouter>` → crash → switched to `<a>`.
- Wired across all 5 lead surfaces: DemoForm, MessageForm, CalendlyInline, CheckoutModal, RoiCalculator.

**2. CRITICAL — Event names aligned to the LIVE GTM container `GTM-K5D84Z3L` (zero GTM edits)**
- Owner shared real trigger/tag configs. Verified internal Event names:
  · `OTP - form_submitted` trigger = `form_submitted`
  · `lead_verifided` trigger = `lead_verifided` (TYPO in their container) → FB/GA4 OTP Verified + GAds - Book Demo
  · `Book demo` trigger = `thankyou_conversion` → FB/GA4/GAds - Book demo (the Book Demo conversion)
- Our site fired `lead_verified`/`demo_booked` → would NOT match → conversions would silently fail on the new site.
- FIX (code only): `GTM_EVENT_NAME` map in gtm.js renames to container's names — `lead_verified→lead_verifided`, `book_demo→thankyou_conversion`, `form_submitted` unchanged. (typo preserved on purpose.)
- Owner direction: `thankyou_conversion` = Book Demo (fired on demo-form submit via new `book_demo` event); **Calendly = NET-NEW `demo_booked` event** (kept as its own name, no rename).
- The earlier "repoint GAds-Book Demo → lead_verified" task is MOOT (already fires on the verified event).
- Verified via headless dataLayer: demo submit → form_submitted(0) + thankyou_conversion(500), OTP → lead_verifided(500); all carry click-IDs + identity + segmentation.

**3. Owner GTM progress (this session, owner-side, guided)**
- Created `calendly Trigger` (Custom Event, Event name `demo_booked`) ✅
- Created `GA4 - Book Appointment` tag on that trigger ✅
- **Container PUBLISHED** (13 tags / 9 triggers) ✅
- Finding: Google Ads "Book appointments" conversion is **Source = Import from clicks** (Zapier-fed, NO tag/Conversion-ID/Label) → cannot attach a GTM tag. Path chosen: send `demo_booked` to GA4 via the GTM GA4 tag → mark as GA4 Key event → import into Google Ads as the appointment conversion (the account is GA4-linked).
- STILL PAUSED (owner TODO): `FB - OTP Verified`, `GA4 - OTP Verified` tags (unpause for verified-lead tracking in Meta/GA4).

**4. Pre-deploy fixes — deployment_agent PASS**
- `.gitignore` lines 98–100 (`.env`/`.env.*`/`*.env`) blocked env files from deploying → removed.
- `frontend/.env` was MISSING `REACT_APP_GTM_ID` (dropped on env recreation) → re-added `REACT_APP_GTM_ID=GTM-K5D84Z3L`. CRITICAL: GTM reads this var and is host-gated to www.mygenie.online; without it NO tags fire in prod.
- DB list-endpoint `.to_list(1000/5000)` caps judged non-blocking (pre-existing admin-only patterns).

**NEXT (owner-side, in order):**
1. Click **Deploy** (Emergent) → site live on www.mygenie.online (first time GTM loads).
2. Main agent re-registers Calendly webhook to prod URL.
3. Owner: 1 test booking + GTM Preview → confirm form_submitted → lead_verifided → thankyou_conversion → demo_booked fire; check GA4 Realtime for `demo_booked`.
4. Google Ads: select the now-available GA4 `demo_booked` event → create/import "Book appointment" conversion → set Primary → **turn off Zapier appointment import** (avoid double-count).
5. Unpause OTP-Verified tags; then #1 Enhanced Conversions (Google) + Advanced Matching (Meta) mapping; #3 map values; #4 GA4 custom dimensions; #5 junk exclusion audience; #2 consent variables.
- 2026-06-09 — **Meta (Facebook) integration completed (owner-side, GTM).** Owner: created `FB - Book Appointment` (Standard event **Schedule**) on `calendly Trigger`; unpaused `FB - OTP Verified`; turned on Automatic AM (found insufficient on SPA since events fire post-submit/Calendly with no DOM fields). Switched to **Manual Advanced Matching** on `FB - Book demo`: Customer Information Data Parameters mapped First Name `{{DLV First Name}}`(first_name), Last Name `{{DLV Last Name}}`(last_name), Phone `{{phone}}`, Email `{{email}}`, External ID `{{phone}}`(=our external_id), City `{{city_name}}`. Code already feeds all 6 fields in dataLayer on every lead/booking event. REMAINING owner step: replicate the 6-row AM block on `FB - OTP Verified` + `schedule` tags → Publish → verify EMQ in Events Manager Test Events after deploy.
