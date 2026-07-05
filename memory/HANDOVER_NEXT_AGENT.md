# Handover Notes — Next Agent

**Project**: MyGenie POS — Marketing + Lead Capture Website  
**Stack**: React 19 (CRA + craco) · FastAPI (Python 3.11) · MongoDB · Supervisor  
**Repo**: https://github.com/Abhi-mygenie/website.git · **Branch**: `1-july`  
**Preview URL**: https://mygenie-deploy-1.preview.emergentagent.com  
**Date written**: 2026-07-01

---

## MANDATORY READING BEFORE YOU TOUCH ANYTHING

Read these files IN ORDER before writing a single line of code:

1. `/app/memory/PRD.md` — full architecture, all CRs implemented, backlog, env vars
2. `/app/memory/Freshsales_Field_Mapping.md` — 22 `cf_` field mappings (many are repurposed; do NOT assume field names mean what they say)
3. `/app/memory/test_credentials.md` — CMS login credentials
4. `/app/memory/CR-30_DatePresets_ImpactAnalysis_Plan.md` — shows the planning format expected for future CRs
5. `/app/CR-4B_OTP_Implementation_Spec.md` — OTP flow specification (critical; the flow is non-standard)
6. `/app/Freshsales_Field_Contract.md` — API field contract for Freshsales (before touching CRM code)

---

## WHAT WAS DONE THIS SESSION (2026-07-01)

### 1. Bug Fix: `POST /api/lead/otp-confirm` → 500 Error
- **Root cause**: `if not col:` on a Motor async collection object — PyMongo Motor raises `NotImplementedError` when a collection is used in a boolean context
- **Fix**: Changed `if not col:` → `if col is None:` in `server.py` line ~391
- **File**: `backend/server.py`

### 2. Bug Fix: `POST /api/otp/verify` → 400 "Incorrect OTP"
- **Root cause (race condition)**: `OtpVerifyBlock.jsx` was firing `sendOtp()` twice on mount due to React re-render. Both requests hit the backend before either wrote to MongoDB (async gap in cooldown check) → two OTP docs inserted → user receives first SMS code but `verify_otp` looked up the **latest** doc (second code) → mismatch → 400.
- **Evidence**: Two SMS to `7505242126` 37ms apart (codes `0400` and `7730`) in backend logs.
- **Fix — Frontend** (`OtpVerifyBlock.jsx`): Added `useRef` guard (`_sentRef`) so `sendOtp()` only fires once per mount — eliminates double-send.
- **Fix — Backend** (`otp.py`): `verify_otp` now fetches up to 5 valid (non-expired, non-locked, unverified) docs for the phone and tries each one. First match wins. Tolerance for the race condition as a safety net.
- **Files**: `frontend/src/components/site/OtpVerifyBlock.jsx`, `backend/otp.py`

### 3. CR-41 — Quote Plan & Pricing Details → Freshsales `cf_first_interest`
- `/quote` endpoint now builds a pipe-separated string: `plan_name|addon_names|₹total_amount|recommended/manual|intent` and pushes it to `cf_first_interest` custom field on the Freshsales contact.
- **File**: `backend/server.py` (create_quote function, ~10 lines)

### 4. Phone Normalization Fix (all 3 forms + backend)
- **Frontend**: Removed `.slice(-10)` anti-pattern from all 3 form validators (`DemoForm.jsx`, `CheckoutModal.jsx`, `MessageForm.jsx`). Now uses `/^\d{10}$/.test(value.replace(/\D/g,""))` — strictly rejects anything that isn't exactly 10 digits after stripping.
- **Backend**: Added `_normalize_phone()` helper in `server.py` — strips `+91`, `91`, leading `0`, returns clean 10-digit string. Applied in all 3 endpoints (`/demo-request`, `/quote`, `/contact`) before MongoDB save AND Freshsales push.
- **Why critical**: Without this, `+919876543210` was being stored as-is → `external_id = web_919876543210` ≠ `web_9876543210` → duplicate Freshsales contacts for same person.
- **Files**: `backend/server.py`, `frontend/src/components/site/DemoForm.jsx`, `frontend/src/components/pricing/CheckoutModal.jsx`, `frontend/src/components/site/MessageForm.jsx`

### 5. CR-30 — Date Presets + Default 7-Day on Ads Intelligence
- Added 5 preset pills to the Ads Intelligence controls bar: **Last 7d** (default) · Last 30d · Last 90d · This Month · Custom
- Default: page loads with last 7 days pre-filled — no blank state, data loads immediately
- Preset click auto-applies (fires Meta sync + `loadSummary` with explicit date args to avoid stale closure)
- `loadSummary` refactored to accept `(fromOverride?, toOverride?)` optional params
- Apply button only shown in Custom mode; date pickers always visible
- **File**: `frontend/src/components/ads/AdsIntelTab.jsx`

### 6. Post-Booking Confirmation Copy Update (DemoForm)
- Changed the booked confirmation message (shown after Calendly scheduling) to Option C:
  - *"Your Google Meet invite is on its way to your inbox, and we've sent the details on WhatsApp too."*
  - *"See you soon — our specialist will walk you through MyGenie for your {outletType} business."*
- **File**: `frontend/src/components/site/DemoForm.jsx` (booked state, lines ~169–184)

### 7. WhatsApp env-control for MessageForm
- Added `const WA_ENABLED = process.env.REACT_APP_WHATSAPP_ENABLED !== "false"` at module level
- Gates all 3 WhatsApp touch-points: auto-open on OTP verify, "Chat on WhatsApp" button in done card, default `preferred_contact` field (falls back to `"email"` when disabled)
- **File**: `frontend/src/components/site/MessageForm.jsx`

### 8. CR-23 — Calendly → WhatsApp Meet Link
- **Confirmed working by owner** — no code changes needed. Backend webhook handler formats meeting time + saves meet link; WhatsApp delivery confirmed operational.

---

## CURRENT STATE — WHAT WORKS

| Flow | Status |
|---|---|
| DemoForm (all 3 stages: form → OTP → Calendly) | Working ✅ |
| OTP send + verify + confirm (`/api/otp/send`, `/api/otp/verify`, `/api/lead/otp-confirm`) | Working ✅ (both bugs fixed this session) |
| CheckoutModal (form → OTP → Razorpay) | Working ✅ |
| MessageForm (form → OTP → WhatsApp redirect) | Working ✅ |
| Freshsales CRM sync (all 3 endpoints) | Working ✅ |
| Calendly webhook auto-register on startup (CR-40) | Working ✅ |
| Ads Intelligence date presets | Working ✅ |
| Funnel by Source (LeadsView) | Working ✅ |
| Phone normalization (backend) | Working ✅ |
| Phone validation (frontend — exactly 10 digits) | Working ✅ |

---

## UPCOMING TASKS (PRIORITIZED)

### P1 — Ready to start (no blockers)

**Homepage: DemoForm above the fold**
- Currently the form is section 10/10 on the homepage — causes drop-offs
- Status: Discovery done, parked by owner. **Ask owner before starting.**
- Impact: Largest potential conversion improvement on organic traffic

**WhatsApp env-control for MessageForm**
- `REACT_APP_WHATSAPP_ENABLED` controls the FAB (floating button) but does NOT control the WhatsApp redirect inside MessageForm
- Fix: read the same env var in `MessageForm.jsx` before the WhatsApp redirect on OTP success
- File: `frontend/src/components/site/MessageForm.jsx`

### P1 — Blocked on owner (do NOT start without their input)

| CR | What's needed |
|---|---|
| CR-12: Pricing expansion (Hotels plan, add-on restructure) | Owner must define new plan structure |
| CR-13: Post-payment onboarding | Basic `/payment-success` page exists; owner must define full flow (email/WA/Freshsales update) |
| CR-15: Zapier offline conversions | Owner to provide Zapier webhook URL |
| CR-17: S3 media storage | AWS bucket credentials needed (code is ready) |
| CR-22: Freshsales webhook payload parser | Owner to define which Freshsales events to handle |

### CONFIRMED COMPLETE (previously marked as blocked — now resolved)
- **CR-23**: Calendly → WhatsApp meet link ✅ — owner confirmed working
- **CR-24**: Ads Intelligence live data ✅ — Meta `enabled:true`, Google `enabled:true`, credentials live in `.env`
- **WhatsApp env-control (MessageForm)** ✅ — implemented this session

### P2 — Parked
- Homepage: DemoForm above the fold — owner explicitly parked, ask before starting

---

## KEY TECHNICAL GOTCHAS (Read before touching code)

### OTP Flow (non-standard — read carefully)
The OTP flow has TWO separate steps after code entry:
1. `POST /api/otp/verify` → returns `otp_token` (JWT)
2. `POST /api/lead/otp-confirm` → validates token + updates MongoDB `otp_verified=true` + calls `swap_otp_tag()` in Freshsales

Both calls happen inside `OtpVerifyBlock.jsx → verifyOtp()` sequentially. GTM `thankyou_conversion` / `book_demo` fire ONLY after step 2 succeeds.

### Freshsales Field Reuse (critical — do NOT use field names at face value)
Many `cf_` fields are repurposed. Always check `/app/memory/Freshsales_Field_Mapping.md` before adding a new field. Key examples:
- `cf_longitude` = client IP address (not longitude)
- `cf_latitude` = fbclid (not latitude)
- `cf_rooms` = OTP verified status ("Yes" / "No")
- `cf_sku` = years_in_business
- `cf_category` = user agent string

### Phone Normalization — Two different helpers exist
- `antijunk._norm_phone()` in `antijunk.py` — uses `digits[-10:]` (last-10, old pattern). Used by OTP flow.
- `_normalize_phone()` in `server.py` — strips `+91`/`91`/`0` prefix (new, correct). Used by lead endpoints.
- These two are NOT the same. Do NOT mix them. OTP flow uses antijunk version intentionally (both send + verify use same function → consistent).

### Calendly Webhook
- Auto-registers on FastAPI startup (CR-40). No manual script needed.
- If you see "webhook not firing" after deploy, check `/var/log/supervisor/backend.err.log` for `CR-40:` log lines — it will tell you if registration succeeded.
- Webhook URL is controlled by `CALENDLY_WEBHOOK_CALLBACK_URL` in `backend/.env`.

### Anti-junk Protection
- Every form submit checks `elapsed_ms` (minimum fill time = 2000ms) and honeypot field `hp`.
- Rate limiting: same phone can't submit twice within `PHONE_COOLDOWN` seconds.
- When testing with curl, always pass `"elapsed_ms": 5000` to bypass the timing check.

### MongoDB ObjectId
- Never return raw MongoDB docs from API. All models use `ConfigDict(extra="ignore")`.
- `_id` field is always excluded from queries with `{"_id": 0}` projection.

---

## FILE REFERENCE MAP

| What you're changing | File to edit |
|---|---|
| Demo booking form (all 3 stages) | `frontend/src/components/site/DemoForm.jsx` |
| OTP input UI + send/verify logic | `frontend/src/components/site/OtpVerifyBlock.jsx` |
| Pricing / Buy modal (OTP + Razorpay) | `frontend/src/components/pricing/CheckoutModal.jsx` |
| Contact / Message form | `frontend/src/components/site/MessageForm.jsx` |
| /demo landing page layout | `frontend/src/pages/DemoLanding.jsx` |
| Consent banner | `frontend/src/components/site/ConsentBanner.jsx` |
| Ads Intelligence tab (date, sync, panels) | `frontend/src/components/ads/AdsIntelTab.jsx` |
| Funnel by Source table | `frontend/src/components/funnel/FunnelBySource.jsx` |
| Lead dashboard / tabs | `frontend/src/pages/LeadsView.jsx` |
| All API routes | `backend/server.py` |
| Freshsales CRM sync | `backend/freshsales.py` |
| OTP generation + verification | `backend/otp.py` |
| Bot detection + rate limiting | `backend/antijunk.py` |

---

## TEST CREDENTIALS

**CMS / Leads Dashboard** (`/leads`):
- Username: `admin`
- Password: `admin123`

**Testing API with curl** (always use `REACT_APP_BACKEND_URL` from `frontend/.env`):
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
curl -X POST "$API_URL/api/otp/send" -H "Content-Type: application/json" -d '{"phone":"9000000099"}'
```

**OTP codes in test**: visible in backend logs (`grep "OTP mock" /var/log/supervisor/backend.err.log`) when `OTP_SMS_ENABLED=false`. In production it's `true` — real SMS are sent.

**Anti-junk bypass for curl tests**: always include `"elapsed_ms": 5000` in POST bodies.

---

## LAST WORKING ITEM WHEN THIS SESSION ENDED

WhatsApp env-control for `MessageForm.jsx` — implemented and verified. All 3 WhatsApp touch-points gated by `REACT_APP_WHATSAPP_ENABLED`. Docs updated to reflect all stale CR statuses corrected.

---

## SERVICES STATUS

Both services are running via supervisor:
- Backend: `0.0.0.0:8001` (hot-reload enabled)
- Frontend: `0.0.0.0:3000` (hot-reload enabled)

Check logs: `tail -n 100 /var/log/supervisor/backend.err.log`  
Restart (only needed for .env changes or new dependencies): `sudo supervisorctl restart backend`
