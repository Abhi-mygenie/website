# MyGenie POS Website — PRD

## Project Overview
MyGenie POS marketing + lead capture website.
Stack: React 19 (CRA + craco) · FastAPI (Python 3.11) · MongoDB · Supervisor

**Repo:** https://github.com/Abhi-mygenie/website.git  **Branch:** 1-july

---

## Architecture

### Backend (/app/backend)
- `server.py` — FastAPI main app + all API routes (prefix `/api`)
- `freshsales.py` — Freshsales CRM client (lead upsert, demo booked, OTP tag swap)
- `cms_auth.py` — JWT-based 2-admin CMS auth
- `otp.py` — Phone OTP generation + verification (SMS panel)
- `payments.py` — Razorpay order/verify/webhook + GST PDF invoice
- `storage.py` — Local or S3 file storage
- `ad_spend.py` — CSV ad spend parser
- `ads_mcp.py` — Meta + Google Ads sync
- `crm_sync.py` — Freshsales → MongoDB backfill/sync
- `funnel.py` — Lead funnel analytics queries
- `recommendations.py` — AI-powered ads recommendations
- `antijunk.py` — Bot/honeypot detection + rate limiting
- `geo.py` — IP-based city lookup

### Frontend (/app/frontend)
- React 19 + React Router 7 + Tailwind + shadcn/ui
- CMS editor, Lead dashboard, Pricing, Demo booking, Payment flows

---

## Session History

### 2026-07-01 — Full Setup + Feature Session

#### Environment Setup
- Pulled codebase from GitHub (branch: 1-july) into /app
- Preserved .git, .emergent, .env files
- Installed Python backend dependencies (requirements.txt)
- Installed Node frontend dependencies (yarn)
- Both services running via supervisor: backend (:8001) + frontend (:3000)

#### Env Configuration
- `MONGO_URL` → switched from remote prod IP to `localhost:27017`
- `STORAGE_BACKEND` → switched from `s3` (prod) to `local` (preview); S3 block commented with `# PRODUCTION:` prefix
- `REACT_APP_BACKEND_URL` in backend/.env → switched from `www.mygenie.online` to current preview URL
- `CALENDLY_WEBHOOK_CALLBACK_URL` → updated from dead old preview URL to current
- `REACT_APP_ALLOWED_HOSTS` in frontend/.env → switched from prod domains to `all`

---

## CRs Implemented This Session

### CR-39 — Full Calendly Meet URL → Freshsales `cf_next_step`
- **Files:** `backend/freshsales.py`, `backend/server.py`
- `mark_demo_booked()` gets new param `meet_link_full`
- Writes full URL to `cf_next_step` alongside split fragment in `cf_meeting_link`
- MongoDB `demo_requests` now stores `meet_link_full`

### CR-40 — Auto-Register Calendly Webhook on Backend Startup
- **Files:** `backend/server.py`
- On every startup: checks if `CALENDLY_WEBHOOK_CALLBACK_URL` matches active Calendly subscription
- If mismatch → deletes stale, registers new. If match → no-op
- Best-effort (never blocks startup). Logs CR-40 prefix
- Fixes production deploy problem: no more manual script needed when URL changes

### CR-42 — OTP Mandatory Gate on All 3 Forms (Post-Submit Flow)
**New mandatory fields across all forms:** email, business_name, years_in_business

**New flow:** Form submit → Lead saved (OTP-Unverified) → Auto-send OTP → OTP screen → Verify → Action (Calendly/payment/WhatsApp)

**`book_demo` GTM event now fires ONLY after OTP verified** (was firing at form submit regardless)

**Backend changes:**
- `QuoteCreate` model: added `years_in_business`, `gst_amount`, `total_with_gst`
- `ContactMessageCreate` model: added `business_name`, `years_in_business`
- `/quote` endpoint: passes `cf_sku` (years_in_business) to Freshsales
- `/contact` endpoint: passes `job_title` (business_name) + `cf_sku` to Freshsales
- New `POST /api/lead/otp-confirm`: validates token, updates MongoDB `otp_verified=true`, calls `swap_otp_tag()`
- `freshsales.py`: new `swap_otp_tag()` — removes OTP-Unverified, adds OTP-Verified, sets `cf_rooms=Yes`

**Frontend changes:**
- New `OtpVerifyBlock.jsx` — shared component: 4-box digit input, auto-advance, paste, shake animation on error, resend countdown, auto-sends OTP on mount
- `DemoForm.jsx` — full 3-stage restructure (form → otp → calendly); inline field errors on blur; responsive Calendly: popup on mobile, inline on desktop; subtle 3-dot progress
- `CheckoutModal.jsx` — 3-stage OTP gate; `years_in_business` field added; Razorpay opens after OTP verified
- `MessageForm.jsx` — 3-stage OTP gate; `business_name` + `years_in_business` added; WhatsApp opens after OTP verified
- `index.css` — added `@keyframes shake` + `.animate-shake` class

### CR-43 — /demo Landing Page Conversion Optimisation + Consent Banner Compression
**`/demo` page changes (Meta paid traffic landing page):**
- CTA button: "Get My Customized Walkthrough" → **"Book My Free Demo →"** (only on `sector="meta-demo"`)
- Below-CTA trust line: → **"100s of outlets across 75 cities already on MyGenie"**
- Urgency line added below stat cards: **"Scheduled within 2 business hours · No commitment"** with clock icon
- City field **removed** from /demo form (auto-detected from IP; removal brings CTA above fold on mobile)
- All other DemoForm pages (homepage, sector pages, about) — unchanged

**Consent banner:**
- Redesigned from large white card (~200px) to thin dark strip (~48px)
- Single line: lock icon + text + Learn more + Decline + Accept
- Same compliance logic unchanged (setConsentChoice / hasConsentChoice)

**StickyMobileCta:**
- MutationObserver detects consent banner in DOM
- Applies `bottom-12` offset when consent strip visible — no overlap

---

## Investigations & Audits Completed This Session

### Form Audit
- 3 lead forms identified: DemoForm, CheckoutModal (Quote+Buy), MessageForm
- Full mandatory/optional field matrix documented
- OTP usage mapped per form

### Phone Validation Gaps (registered, not fixed yet)
- `.slice(-10)` pattern in all 3 forms allows 12-digit numbers to pass
- +91 inconsistency: raw phone used as-is in `external_id` → same person can create duplicate Freshsales contacts with different formats

### Freshsales Custom Field Audit
- 22 `cf_` fields fully mapped across all modules
- Many fields repurposed (e.g., `cf_longitude` = IP, `cf_rooms` = OTP status, `cf_latitude` = fbclid)

### Sector/Source Page → Freshsales Gap
- `meta-demo` and `petpooja-alternative` stored as `cf_outlet_type` — junk outlet types
- `source_page` not stored in MongoDB — only used to generate a tag

### GTM/Meta/Google Impact (CR-42)
- `thankyou_conversion` (₹500) now fires only for OTP-verified leads
- Short-term conversion count dip expected (2-4 weeks relearn)
- Email now always populated → better Enhanced Conversions match rate
- CheckoutModal + MessageForm now also fire `thankyou_conversion` (previously never did)

### Calendly Webhook Root Cause
- Was pointing to dead old preview URL (d62aad8d-...)
- Fixed manually + CR-40 prevents recurrence permanently

---

## CRs Registered But Not Yet Implemented

### CR-41 — Quote Plan/Addon Details → Freshsales `cf_first_interest`
- Pack plan_name, addon_names, total_amount, was_recommended, intent as CSV into `cf_first_interest`
- Also fix: `gst_amount` and `total_with_gst` silently dropped — add to `QuoteCreate` model
- Files: `backend/server.py` only (~10 lines)
- Status: G2 Planning complete ✅ — ready to implement

---

## Known Gaps (Not Yet CRs)

| Gap | Detail |
|---|---|
| Phone validation too permissive | `.slice(-10)` accepts any ≥10 digit number |
| +91 inconsistency | No phone normalization before storage/Freshsales upsert |
| WhatsApp in MessageForm not env-controlled | `REACT_APP_WHATSAPP_ENABLED` only controls FAB, not MessageForm |
| `meta-demo`/`petpooja-alternative` as outlet_type | Source tracking in wrong field |

---

## Prioritized Backlog

### P0 — Ready to implement
- CR-41: Quote plan details → Freshsales `cf_first_interest`

### P1 — Planned, awaiting go-ahead
- CR-30: Date presets + default 30-day on Ads Intelligence
- CR-31: Conversion funnel by source

### P1 — Blocked on owner
- CR-12: Pricing expansion (Hotels plan, add-on restructure)
- CR-13: Post-payment onboarding
- CR-15: Zapier offline conversions
- CR-17: S3 media storage (code ready, needs AWS bucket)
- CR-22: Freshsales webhook payload parser
- CR-23: Calendly → WhatsApp meet link
- CR-24: Ads Intelligence live data (credentials in .env)

### P2 — Discovery done
- Homepage: DemoForm above the fold (form currently section 10/10)
- Phone normalization + validation fix
- WhatsApp env-control for MessageForm

---

## Environment Variables Reference
See `/app/memory/PRD.md` initial entry for full variable list.

**Preview-specific values (comment # PRODUCTION: to switch back):**
- `MONGO_URL=mongodb://localhost:27017`
- `STORAGE_BACKEND=local`
- `REACT_APP_BACKEND_URL=https://mygenie-deploy-1.preview.emergentagent.com`
- `CALENDLY_WEBHOOK_CALLBACK_URL=https://mygenie-deploy-1.preview.emergentagent.com/api/calendly/webhook`
- `REACT_APP_ALLOWED_HOSTS=all`
