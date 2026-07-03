# Agent Handoff Notes
**Session closed:** 2026-07-03  
**Language:** English (respond in English only)  
**Project:** MyGenie POS — React 19 + FastAPI + MongoDB marketing & lead-capture website  
**Repo:** https://github.com/Abhi-mygenie/website.git · Branch: 1-july

---

## Project Health
**Status: STABLE** — All services running. No known regressions. Security fixes applied.

---

## What Was Done This Session

### CR-45 — Security Hardening (COMPLETE)
- **SEC-001 (P0) FIXED:** Plan/addon prices are now DB-authoritative.
  - `server.py` seeds `db.plans` and `db.addons` on startup via `_PLANS_SEED` / `_ADDONS_SEED` constants.
  - `payments.py` `create_order` fetches prices from `db.plans` / `db.addons` — ignores client-supplied `plan_price` / `addon_prices` entirely.
  - Unknown `plan_id` or `addon_id` → HTTP 422. `custom` plan (contactOnly) → HTTP 422.
  - **Prices are admin-editable directly in MongoDB** — no code deploy needed to change a price.
- **SEC-007 (P2) FIXED:** Removed `verify=False` from `otp.py` line 117 and `payments.py` line 882.
- **SEC-003 (Freshsales webhook auth) — DEFERRED** by owner. Doc updated.
- **SEC-008 (PII log masking) — DEFERRED** by owner. Doc updated.

### CR-46 — Temporarily Hide "Buy Online" Button (COMPLETE)
- `REACT_APP_BUY_ONLINE_ENABLED=false` added to `frontend/.env`
- `CartSummary.jsx` only renders the "Buy Online" button when this flag is `"true"` — otherwise completely hidden (no placeholder text).
- "Book a Demo with this quote" CTA is always visible regardless of flag.
- **To re-enable:** Set `REACT_APP_BUY_ONLINE_ENABLED=true` + `sudo supervisorctl restart frontend`
- CR doc: `/app/CR-46_Temp_Disable_Buy_Online.md`

---

## Pending / Blocked Items

### CR-12 — Hotel Pricing Plan Structure (BLOCKED — awaiting owner input)
Impact analysis was presented. Implementation plan is ready. The following questions were asked but **not yet answered by the owner**:

1. **Plan name?** (e.g. "Hotel", "Hotel & Resort", "Hospitality")
2. **Price?** (₹/outlet/mo)
3. **What's included?** Bundle `hotel_billing` + `channel_manager` + everything in Pro? Or separate feature set?
4. **Position in plan order?**
   - a. Between Pro and Custom (Starter → Growth → Pro → Hotel → Custom)
   - b. Replace Custom (Starter → Growth → Pro → Hotel)
   - c. Separate track shown only when Hotel/Resort outlet type is selected
5. **Tagline?** (e.g. "For hotels, resorts & hospitality")

**When owner provides answers:**
- Add new plan to `_PLANS_SEED` in `server.py` (auto-seeds `db.plans` on restart)
- Add to `PLANS` array in `frontend/src/data/pricing.js`
- Update `recommend()` in `pricing.js` to route Hotel/Resort to new plan
- No changes needed to `PlanCard.jsx`, `CartSummary.jsx`, `Pricing.jsx`, or `payments.py`

### Other Blocked CRs (all waiting on owner)
- **CR-13:** Post-payment onboarding flow — owner must spec email/WA/Freshsales update steps. Success page exists at `/payment-success`.
- **CR-15:** Zapier offline conversions — needs Zapier webhook URL from owner.
- **CR-17:** S3 media storage — code is ready (`storage.py`), needs `AWS_S3_BUCKET_NAME`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` in `backend/.env`.
- **CR-22:** Freshsales webhook payload parser — owner to define which events to handle.

### Deferred Security (intentional)
- **SEC-003:** Unauthenticated Freshsales webhook — deferred by owner. See `/app/CR-45_Security_Hardening.md` for implementation plan when ready.
- **SEC-008:** PII log masking — deferred by owner.

### Phase 2 WebOTP (parked)
- **CR-43 Phase 2:** `navigator.credentials.get` for Android SMS auto-fill. Waiting on SMS template change (domain hash) from owner. Implement in `OtpVerifyBlock.jsx` when ready.

---

## Key Files Reference

| File | What it does |
|---|---|
| `backend/server.py` | Main FastAPI app. `_PLANS_SEED` + `_ADDONS_SEED` constants at bottom. `_seed_pricing()` on startup. |
| `backend/payments.py` | Razorpay integration. `create_order` does DB price lookup (SEC-001). |
| `backend/otp.py` | OTP send/verify via SMS panel. |
| `backend/freshsales.py` | CRM upsert, tag swap, demo booked. |
| `frontend/src/data/pricing.js` | PLANS + ADDONS arrays (frontend display). Must stay in sync with `_PLANS_SEED` / `_ADDONS_SEED`. |
| `frontend/src/components/pricing/CartSummary.jsx` | Buy Online button gated by `REACT_APP_BUY_ONLINE_ENABLED`. |
| `frontend/src/components/pricing/CheckoutModal.jsx` | 3-stage checkout: form → OTP → Razorpay. |
| `frontend/src/components/site/OtpVerifyBlock.jsx` | Shared OTP input component. |
| `frontend/src/components/site/DemoForm.jsx` | Demo booking form with Calendly. |
| `/app/CR-45_Security_Hardening.md` | Full security audit + implementation status. |
| `/app/CR-46_Temp_Disable_Buy_Online.md` | Buy Online flag docs + revert instructions. |
| `/app/memory/PRD.md` | Full project PRD + backlog. |

---

## MongoDB Collections of Note

| Collection | Purpose |
|---|---|
| `db.plans` | Authoritative plan prices (seeded on startup). Edit here to change plan prices. |
| `db.addons` | Authoritative add-on prices (seeded on startup). Edit here to change add-on prices. |
| `db.orders` | Payment orders. |
| `db.demo_requests` | Lead captures. |
| `db.quotes` | Quote form submissions. |
| `db.cms_content` | CMS-editable content. |

---

## Environment Notes

### frontend/.env (key vars)
```
REACT_APP_BACKEND_URL=https://mygenie-runtime.preview.emergentagent.com
REACT_APP_BUY_ONLINE_ENABLED=false        ← CR-46 gate
REACT_APP_WHATSAPP_ENABLED=false
REACT_APP_CALENDLY_URL=https://calendly.com/mygenie-abhishek/mygenie-demo
REACT_APP_GTM_ID=GTM-K5D84Z3L
```

### backend/.env (non-sensitive)
```
MONGO_URL=mongodb://52.66.232.149:27017   ← remote MongoDB (prod data)
DB_NAME=test_database
STORAGE_BACKEND=local                     ← switch to s3 for production
```

> ⚠️ If backend fails to start, check `MONGO_URL` — it has been wiped by container restart once before. Owner restores manually.

---

## Important: Do NOT Ask the Owner For

- Plan/addon prices — now in `db.plans` / `db.addons` and `_PLANS_SEED` in `server.py`
- Razorpay pricing — fully server-side now. Client values are ignored.

---

## Next Agent's First Move

1. Read this file + `/app/memory/PRD.md`
2. Ask the owner for CR-12 hotel plan answers (5 questions listed above) if not already answered
3. Once answered, implement CR-12 — estimated 30 min, low risk
4. Then pick up next unblocked CR from backlog

---

## Test Credentials
See `/app/memory/test_credentials.md`
