# HANDOVER — MyGenie POS website (for next agent)

> Last session: 2026-06-20. Scope this session: repo bring-up, prod env/proxy debugging, and Pricing-page CRs (CR-9 built, CR-11 built, CR-10/CR-12 captured & pending).
> Read alongside: `HANDOVER.md` (original), `CR_Control_Dashboard.md`, `PROJECT_DOCS_INDEX.md`, `memory/PRD.md`, and the CR docs `CR-9_*`, `CR-11_*`, `CR-12_*`.

---

## 1. What this app is
Lead-gen marketing website for **MyGenie POS** ("The Hospitality Operating System"). Stack: **React 19 SPA + FastAPI + MongoDB**. North-star = qualified, sector-tagged **demo bookings**. Has an inline **CMS** (admin `?admin=1`, edit mode), a rule-based **Pricing builder**, Freshsales CRM + Calendly + GTM/GA4 + (optional) SMS-OTP integrations. Governance = 5-gate CR model tracked in `CR_Control_Dashboard.md`.

## 2. Environment / how it runs here (preview pod)
- Pulled from `https://github.com/Abhi-mygenie/website.git` into `/app`. Backend on **8001** (supervisor), frontend on **3000**.
- `.env` files are **gitignored** — they did NOT come with the pull and were reconstructed:
  - `backend/.env`: MONGO_URL/DB_NAME (local), CORS_ORIGINS, CMS creds, STORAGE_BACKEND=local, **real Freshsales + Calendly keys (owner-provided this session)**, SMS blank/OFF.
  - `frontend/.env`: `REACT_APP_BACKEND_URL` (bare preview host, **NO trailing /api**), `REACT_APP_GTM_ID=GTM-K5D84Z3L`.
- **requirements.txt has a pip resolver conflict** (litellm wheel ↔ emergentintegrations — neither is imported). Install pattern that works: `pip install <litellm wheel>` → `pip install emergentintegrations==0.2.0 --no-deps` → `pip install -r <requirements minus those 2 lines>`.
- CMS creds (dev): **admin / admin123**, editor / editor123 (from `CMS_USER_*`/`CMS_PASS_*`). `memory/test_credentials.md` is gitignored/absent.

## 3. 🔥 Production debugging learnings (beta.mygenie.online) — IMPORTANT
The owner's prod had **login 404 + broken image uploads**. Root cause = **the prod nginx strips the `/api` prefix**:
```
location /api { proxy_pass http://127.0.0.1:8003/; }   # ❌ trailing slash strips /api
```
Backend serves all routes under `/api`, so `/api/cms/login` arrived as `/cms/login` → 404. Everything worked only at the **double** `/api/api/...`.
- **Fix = remove the trailing slash:** `proxy_pass http://127.0.0.1:8003;` then `nginx -t && systemctl reload nginx`.
- And frontend `REACT_APP_BACKEND_URL` must be the **bare origin (no /api)** + rebuild (CRA bakes env at build time).
- This single misconfig caused BOTH the login-404 and the "image returns /api/cms/media but works only at /api/api/cms/media" report. Convention: **backend routes are all under `/api`; the proxy must preserve `/api`; the frontend adds `/api` itself.**

## 4. What was BUILT & verified this session
- **CR-9 — Pricing cart GST + yearly** ✅ (`CR-9_Pricing_GST_and_Razorpay.md`)
  - Cart shows annual **Subtotal → GST(18%) → Total** (GST-incl headline), all line items in **/yr**, removed the "/mo base" subline, label simplified to "Total". `GST_RATE=0.18` in `data/pricing.js`. `Quote` model gained `gst_amount`/`total_with_gst` (`total_amount` stays pre-GST subtotal).
- **CR-11 — Plan differentiation (Part A+B1+B2)** ✅ (`CR-11_Plan_Differentiation_Showcase.md`)
  - Part A: **plan switch resets manual add-ons** (`selectPlan` in `Pricing.jsx`).
  - B1: per-plan **Lucide icons** on cards (Store/TrendingUp/Rocket/Building2).
  - B2: `PlanShowcase.jsx` dynamic panel — selected plan's CMS-editable **feature GIF** (`plan.<id>.demo_gif`, placeholder `/brand/plan-demo-placeholder.svg`) + caption + "What {plan} adds" delta.
  - ⚠️ B2 is **about to be redesigned** by CR-12 item 5 (inline panel → per-plan icon + full-screen popup). B3 (product/sector GIF reuse) never built.

## 5. What is PENDING (prioritised)
### P0 — CR-12 Pricing expansion (G1, NOT built) — `CR-12_Pricing_Expansion.md`
Owner feedback round, captured, **needs confirmations before build**:
1. Chain/Enterprise → remove Hotel/Room billing, drop "hotels" from tagline.
2. +2 plans → **Hotels** + **Custom/customized** (6 tiers).
3. Add-ons: remove Extra Captain Device; **club** Scan&Order + Online Ordering → "Branded website — ordering across channels" ₹399; **add** Aggregator ₹199/brand, Kiosk ₹499/mo, Token Mgmt ₹199/mo, Payment Gateway ₹199, EDC ₹199.
4. Cart: drop **₹0/yr** on included add-ons.
5. Feature demo → **per-plan icon + full-screen popup** (✕ close), replaces inline showcase.
6. **Full comparison table** (plan × features, single view).
- 🔴 Blocked on owner: Hotels price/features; Custom contact-vs-fixed; aggregator qty; table placement; demo-popup icon placement & GIF-vs-video.

### P0 — CR-10 Razorpay online purchase (G2 locked, NOT built) — `CR-9_Pricing_GST_and_Razorpay.md`
"Buy Online" → real Razorpay payment (one-time annual, 1 outlet, GST invoice, Freshsales `Paid Online` wired to existing lead flow via `external_id=web_<phone>`).
- 🔴 Blocked on owner: **Razorpay KEY_ID/SECRET + webhook secret**, GST-invoice details (seller GSTIN/HSN/numbering, CGST+SGST vs IGST by buyer state), Freshsales "Customer/Won" lifecycle+status IDs, post-payment action, email-receipt provider.
- ⚠️ Payment = integration → call **`integration_expert`** for the Razorpay playbook BEFORE coding. Signature verify + webhook are mandatory; never trust client-side success.

### Carry-over backlog (pre-existing, see PRD/HANDOVER.md)
- CR-3 analytics tags (GTM `purchase` event ties into CR-10), owner Tracker P0 (real prices/stats/logos), create CRM `cf_` fields for CR-2 attribution + CR-9/10 payment fields.

### Closed items (2026-06-21)
- ✅ Stale CMS pricing overrides — N/A, remote DB is fresh
- ✅ Production nginx trailing-slash fix — done by owner
- ✅ Calendly webhook re-registration — existing ENV key is current/valid
- ✅ **Pricing UX Iteration** — scroll banner, compare modal, X marks, multi-select chips, logo prep
  - `Pricing.jsx`: animated banner above plan grid on plan click + "See add-ons ↓" scroll CTA
  - `PlanCompareModal.jsx` (new): "Compare all plans" opens modal overlay, not anchor scroll
  - `ComparisonTable.jsx`: `hideHeading` prop + `id="comparison-table"` + X icon (red circle) for unavailable features
  - `RecommendQuiz.jsx`: priority dropdown → toggle chips (max 3, multi-select)
  - `data/pricing.js`: `recommend()` accepts `priorities[]` array
  - `Logo.jsx`: `light=true` now uses `brand.logo_light_image` CMS key / `logo-light.svg` fallback (no white chip)
  - `/public/brand/logo-light.svg`: placeholder created; owner to replace with typeface logo

## 6. Key gotchas (don't relearn the hard way)
- **Pricing logic is code-controlled** (plan `id`/`icon`/`includedAddons`, `recommend()`, `alsoAdded()`, `GST_RATE`). Only display fields (names/prices/taglines/features, add-on names/prices/desc) are CMS-editable via `pricing.plans`/`pricing.addons`. When clubbing/removing add-ons, repoint `includedAddons` + recommend/cross-sell maps.
- CMS: GIF/svg/mp4 allowed in `CMS_ALLOWED_EXT`; media served at `/api/cms/media/<file>`; overrides in Mongo `cms_content`; `EditableImage`/`EditableText`/`EditableList`(+`lockItems`).
- Freshsales `lifecycle/status` is **write-only** on this account (verify in UI, not API); custom fields use `custom_field` (singular). Dedup key everywhere = `external_id=web_<phone>`.
- GTM is **host-gated to www.mygenie.online** → won't load on preview by design.
- Use `search_replace` for edits; hot-reload (no restart unless .env/deps). Test pricing via `/pricing` screenshot + `POST /api/quote` curl.

## 7. Suggested next move for the next agent
Ask the owner the **CR-12 + CR-10 confirmation lists** (Section 5) in one go. CR-12 items 1, 3 (add-ons), 4 (cart ₹0/yr) and 5 (demo popup) can be built immediately without owner data; items 2 (Hotels/Custom plans) and 6 (comparison table) need the confirmations. CR-10 is fully blocked on Razorpay keys.
