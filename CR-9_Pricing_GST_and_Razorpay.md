# CR-9 / CR-10 — Pricing: GST in cart + Razorpay online purchase

> Intake date: 2026-06-19. Source: owner feedback on the Pricing cart (screenshot).
> Two CRs split by size/risk:
> - **CR-9** — Cart shows yearly price + 18% GST in the final total (display + payload). Small, no integration.
> - **CR-10** — "Buy Online" performs a real online payment via **Razorpay**. New integration, needs owner inputs.

---

## CR-9 — Cart: yearly price + 18% GST final total

**Ask (owner):** In the cart (`CartSummary`), show the **yearly price** and add **18% GST**, then a **final total** (inclusive of GST).

**Proposed cart breakdown (replacing the single "Your price" line):**
```
Plan (Pro)                 ₹2,499/mo
+ included add-ons         ₹0/mo  (unchanged)
─────────────────────────────────
Subtotal (annual)          ₹29,988 / yr      (= monthly × 12, per outlet)
GST (18%)                  ₹5,398            (29,988 × 0.18 = 5,397.84)
─────────────────────────────────
Total payable (incl. GST)  ₹35,386 / yr · per outlet
```
- Keep the "Billed annually" badge and the per-month figure for context.
- Rounding: display GST and total rounded to nearest rupee (₹5,398 / ₹35,386). Keep precise paise only in the payment amount (CR-10).

**Files to change (display + lead payload):**
- `frontend/src/data/pricing.js` — add `GST_RATE = 0.18` constant.
- `frontend/src/components/pricing/CartSummary.jsx` — render Subtotal/GST/Total lines.
- `frontend/src/components/pricing/CheckoutModal.jsx` — the in-modal summary + the value sent to backend should carry subtotal / gst / total-incl-gst.
- `frontend/src/pages/Pricing.jsx` — compute `subtotalAnnual`, `gst`, `totalInclGst`; pass in `config`.
- `backend/server.py` — `Quote` model: add optional `gst_amount` + `total_with_gst` (and keep `total_amount` = annual subtotal, OR redefine — decide in G2) so the CRM/record reflects GST.

**Open question (G2):** is the displayed plan price (₹2,499) **GST-exclusive** (we add 18% on top) or already GST-inclusive (we show the GST component within)? Assumed **exclusive → add 18% on top**. Owner to confirm.

**Effort:** small, display-only + minor payload field. No integration. Can ship via normal G3→G4.

---

## CR-10 — "Buy Online" → real online payment (Razorpay) — NEW INTEGRATION (G1 intake)

**Ask (owner):** Today "Buy Online" just opens the lead form and creates a **quote lead** (`POST /api/quote`) — no money changes hands. Owner wants it to **actually take payment online** via **Razorpay**, so a customer can purchase the selected plan + add-ons (annual, incl. 18% GST) end-to-end.

**Current behaviour (baseline):**
- `CartSummary` "Buy Online" → `CheckoutModal (intent=buy)` → collects name/phone/email/business/city → `POST /api/quote` → Mongo + Freshsales (tag `Buy Online`). No payment.

**Target flow (proposed, to lock in G2):**
1. Buy Online → checkout form (name/phone/email/business/city) → **Create Razorpay order** (`POST /api/payments/razorpay/order`) for the GST-inclusive annual amount (in paise).
2. Open **Razorpay Checkout** (hosted widget) with the order id + prefilled customer details.
3. On success → frontend calls **verify** (`POST /api/payments/razorpay/verify`) → backend **verifies the signature** (HMAC SHA256 with key secret) → marks order `paid`.
4. Also handle the **server-side webhook** (`POST /api/payments/razorpay/webhook`, signature-verified) as the source of truth for `payment.captured`.
5. Post-payment: create/refresh **Freshsales contact tagged `Paid Online`** (+ plan/addons/amount), store an **order/payment record** in Mongo, show a success/receipt screen, and (later) trigger activation/onboarding + GST invoice.

**Data (Mongo):** new `orders` collection — `{ id, razorpay_order_id, razorpay_payment_id, plan_id, addon_ids, billing:'annual', subtotal, gst, amount_total, currency:'INR', status:'created|paid|failed', customer{...}, attribution{...}, created_at, paid_at }`.

**Build rule:** payment = integration → route through **`integration_expert`** FIRST (get the Razorpay playbook) before writing any code. Auth-adjacent/secure: signature verification is mandatory; never trust the client-side success alone.

### 🔴 Inputs needed from owner (blockers to exit G1 → G2)
1. **Razorpay keys** — `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (Test mode first, then Live) and the **webhook secret**. (Dashboard → Settings → API Keys / Webhooks.)
2. **What is actually sold online?** Annual subscription one-time charge now, or recurring/auto-renew (Razorpay Subscriptions)? Assumed: **one-time annual charge** for v1.
3. **Per-outlet quantity** — can a buyer choose number of outlets (multiplies the amount), or is online buy fixed to 1 outlet? Cart currently says "per outlet".
4. **GST invoice** — do we generate a GST invoice/receipt (GSTIN, HSN/SAC, company details)? Collect buyer **GSTIN** at checkout (optional field)?
5. **After payment** — what should happen? (a) just record + notify sales to activate, (b) auto-provision an account, (c) send a confirmation email/WhatsApp. v1 assumed = record + notify + success screen.
6. **Refund/cancellation** policy text for online purchases (annual term) — `legal.js` update.
7. **Failure handling** — on payment failure, still capture the lead as `Buy Online (Payment Failed)`?

**Open questions (G2):** partial payments? coupons/discount codes online? currency (INR only?). Email receipt provider (SendGrid/Resend) if (5c).

### ✅ Owner decisions LOCKED (2026-06-19)
1. **Razorpay keys** — owner WILL PROVIDE (Test first, then Live + webhook secret).
2. **Charge type** — **ONE-TIME** annual payment (no auto-renew / Subscriptions).
3. **Quantity** — **1 outlet fixed** (no quantity selector online).
4. **GST invoice** — **YES.** Collect buyer **GSTIN** (optional field) at checkout; generate a GST tax invoice/receipt.
5. **Post-payment** — **update Freshsales CRM**, wired into the existing lead flow (see below).

### Locked flow (G2)
- **Amount** = (plan.price + paid add-ons) × 12 × 1.18 (GST-incl), INR, in paise, qty = 1 outlet.
- **Checkout fields:** name, phone, email, business_name, city, **GSTIN (optional)**.
- Create order → Razorpay Checkout widget → **verify signature** (`/verify`) + **webhook** (`payment.captured`, signature-verified = source of truth) → mark `paid`.
- **Mongo `orders`** record (created→paid/failed) with full breakdown + attribution.

### Freshsales / CRM update — wired into existing lead flow (decision #5)
Reuse the current `freshsales.upsert_contact` path (same as Demo/Quote/Contact) so a paid buyer is **one contact**, deduped:
- **Dedup key:** `external_id = web_<phone>` (same as all forms) → repeat buyer updates the same contact (+ existing `Multi-Form` behavior).
- **Tags:** add **`Paid Online`** (+ keep `Buy Online`). On payment failure → **`Buy Online (Payment Failed)`** (lead still saved).
- **Lifecycle/Status:** move to a **Customer/Won** stage on payment success. ⚠️ lifecycle/status writes are **write-only on this account** (verify in Freshsales UI) — owner must tell us the target `lifecycle_stage_id` / `contact_status_id` for "Customer".
- **Payment cf_ fields:** write `plan`, `amount_paid`, `billing=annual`, `razorpay_payment_id`, `gstin` to `cf_` fields **IF the owner creates them** (same pattern as CR-1b/CR-2). Until created → stored in **Mongo only** + carried in the order record.
- **Attribution:** the existing `attribution{}` (gclid/fbclid/utm/etc. from CR-2) is attached to the order and the contact, so paid conversions are ad-attributable.
- **(Optional, G2)** create a Freshsales **Deal** (Won) for the paid order instead of/along with the contact tag — needs a pipeline/stage decision from owner.
- **Analytics:** fire a GTM `purchase` event (value = amount) on success so Google/Meta get a real revenue conversion (extends CR-3).

### 🔴 Still needed from owner (to exit G2 → build)
- **Razorpay** `KEY_ID` + `KEY_SECRET` (test) + **webhook secret**.
- **GST invoice details:** seller legal name, **GSTIN**, registered address, **HSN/SAC** (SaaS usually `997331`/`998314`), invoice number series, and **place-of-supply rule** (intra-state → CGST 9% + SGST 9%; inter-state → IGST 18% — derived from buyer GSTIN/state). v1 displays a single 18% line; the *invoice* splits CGST/SGST/IGST by buyer state.
- **Freshsales:** target Customer/Won **lifecycle + status IDs**; whether to also create a **Deal** (+ pipeline/stage); `cf_` field API names for plan/amount/payment_id/gstin (or Mongo-only).
- **Receipt delivery:** email the GST invoice? If yes → email provider (SendGrid/Resend) = a small extra integration.

**Status:** **G1 ✅ → G2 (scope locked; pending Razorpay keys + GST-invoice + Freshsales-stage inputs).** Build only after `integration_expert` Razorpay playbook.

---

## ✅ CR-10 — G2 COMPLETE → G3 READY (2026-06-21)

### All ENV inputs resolved

| Input | Status | Value |
|-------|--------|-------|
| `RAZORPAY_KEY_ID` | ✅ | `rzp_live_9lMs01gisZhwQX` (LIVE — test keys recommended for dev) |
| `RAZORPAY_KEY_SECRET` | ✅ | Filled by owner |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Filled by owner |
| `GST_SELLER_NAME/GSTIN/ADDRESS` | ✅ | Placeholder — owner to update with real values |
| `GST_HSN_SAC` | ✅ | `997331` |
| `GST_INVOICE_PREFIX` | ✅ | `MG/2025-26` |
| `FRESHSALES_LIFECYCLE_CUSTOMER_ID` | ✅ | `403021121247` (Customer) — looked up via API |
| `FRESHSALES_STATUS_WON_ID` | ✅ | `402001137712` (Won) — looked up via API |
| `RECEIPT_EMAIL_*` | ⬜ Optional | Left blank — email receipt deferred |

**Razorpay API auth validated:** `GET /v1/orders` returned 200. Keys active.

**Additional Freshsales status IDs found (for CR-13 use):**
- `402001783018` = Payment Awaited ← set on order creation
- `402001755414` = Payment Received ← alternative to Won

---

### Impact Analysis

**Files changed (existing):**

| File | Change |
|------|--------|
| `backend/server.py` | Add 3 routes: `POST /api/payments/razorpay/order`, `/verify`, `/webhook` |
| `frontend/src/components/pricing/CheckoutModal.jsx` | Buy-intent path: form submit → Razorpay order → widget → verify. Add GSTIN optional field. Demo-intent path unchanged. |
| `frontend/src/pages/Pricing.jsx` | Pass GSTIN into `config` for CheckoutModal |
| `backend/freshsales.py` | Add `mark_paid()` — sets lifecycle → Customer (403021121247), status → Won (402001137712), tag `Paid Online` |

**Files created (new):**

| File | Purpose |
|------|---------|
| `backend/payments.py` | Razorpay order creation, HMAC verify, webhook handler, PDF invoice generation (reportlab) |
| `frontend/src/pages/PaymentSuccess.jsx` | Thank you screen — order confirm + invoice SMS note + "contact within 1 business day" |

**Zero other files touched.** Demo form, quote form, CMS, leads, OTP — all untouched.

---

### Implementation Plan (G3)

**Phase 1 — Backend `backend/payments.py`**

```
POST /api/payments/razorpay/order
  ← receives: plan_id, addon_ids, customer{name,phone,email,business,city,gstin}
  → amount = (plan_price + addon_prices) × 12 × 1.18 × 100  (INR paise)
  → Razorpay create order API
  → Mongo orders{} insert (status: created)
  → Freshsales: upsert_contact + status → Payment Awaited
  → return { razorpay_order_id, amount, currency, key_id }

POST /api/payments/razorpay/verify
  ← receives: razorpay_order_id, razorpay_payment_id, razorpay_signature
  → HMAC SHA256: order_id + "|" + payment_id signed with KEY_SECRET
  → if valid: order status → paid, save payment_id, paid_at
  → generate PDF invoice via reportlab → storage.py → save invoice_url
  → SMS via existing panel: "Invoice {no} ready: {link}"
  → Freshsales mark_paid(): lifecycle → Customer, status → Won, tag Paid Online
  → return { success, order_id, invoice_url }

POST /api/payments/razorpay/webhook   ← source of truth (HMAC with WEBHOOK_SECRET)
  → on payment.captured → same paid flow as /verify (idempotent — safe if both fire)
  → on payment.failed → order status → failed, Freshsales tag "Buy Online (Payment Failed)"
```

**Phase 2 — Frontend**

```
CheckoutModal (buy-intent):
  - Add GSTIN optional field (below City)
  - submit → POST /api/payments/razorpay/order
  - load Razorpay JS SDK (cdn.razorpay.com/v1/checkout.js)
  - open widget prefilled: name, email, phone, amount, order_id, key
  - on success → POST /api/payments/razorpay/verify → navigate to /payment-success?order_id=...
  - on failure/dismiss → show error toast, keep form open

PaymentSuccess.jsx (new route /payment-success):
  - fetch order details from GET /api/payments/order/:id
  - show: order ID, plan, amount, payment ID
  - "GST invoice sent to your phone via SMS"
  - "Our team will contact within 1 business day"
  - GTM purchase event fired here (CR-3 extension)
  - CR-13 setup brief entry (renders once CR-13 is built)
```

**Phase 3 — Wire & Verify**
```
- Add /payment-success route to App.js
- pip install reportlab → requirements.txt
- integration_playbook_expert_v2 call → Razorpay playbook (mandatory first step)
- Test flow end-to-end (test keys recommended)
```

**Status: G2 ✅ → G3 READY TO BUILD. Next step: call integration_playbook_expert_v2.**

---

## ✅ CR-9 — BUILT & VERIFIED (2026-06-19)
Cart now shows the annual subtotal, **18% GST**, and a **GST-inclusive yearly total** (headline). GST-exclusive model (18% added on top), rounded to nearest ₹.
- `data/pricing.js` → `GST_RATE = 0.18`. `CartSummary.jsx` → Subtotal / GST / Total-incl-GST lines (testids `cart-subtotal-line`/`cart-gst-line`/`cart-total`/`cart-total-meta`), labels via `EditableText` (`pricing.cart.subtotal_label`/`gst_label`/`total_incl_gst_label`). `Pricing.jsx` → `config` carries `gst`/`totalWithGst`. `CheckoutModal.jsx` → summary shows `…/yr incl. GST` + sends `gst_amount`/`total_with_gst`. `server.py` `Quote` model → optional `gst_amount`/`total_with_gst` (kept `total_amount`=pre-GST subtotal).
- Verified live: Pro → ₹29,988 + ₹5,398 GST = ₹35,386/yr; Pro+Central Inventory → ₹37,176 + ₹6,692 = ₹43,868/yr; live recompute on add-on toggle; `/api/quote` persists GST fields. Headline `/yr` incl. GST.
- **Refinement (2026-06-19, owner feedback):** cart fully **yearly** — plan/add-on/included line items now show `/yr` (price × 12); removed the `per outlet · billed annually · ≈ ₹/mo base` meta subline; total label simplified `Total (incl. GST)` → **`Total`** (GST still its own line). CheckoutModal summary also switched to `₹X/yr · billed annually`. Verified: Growth+Online Delivery → ₹22,776 + ₹4,100 GST = ₹26,876/yr.


## ✅ CR-10 — G3 BUILT & API-VALIDATED (2026-06-21)

**Integration built in full. Razorpay Python SDK + reportlab PDF invoice.**

### What was built
- `backend/payments.py` (new) — order creation, HMAC verify, webhook handler, PDF invoice (reportlab), SMS, Freshsales mark_paid
- `frontend/src/pages/PaymentSuccess.jsx` (new) — thank you page, order summary, invoice SMS notice, 1-day contact promise
- `frontend/src/components/pricing/CheckoutModal.jsx` — buy-intent: Razorpay widget flow, GSTIN field; demo-intent unchanged
- `frontend/src/App.js` — /payment-success route added
- `backend/server.py` — includes payments_module router after load_dotenv

### Validated
- Order creation (Pro+Kiosk): ₹42,452 = (2499+499)×12×1.18 ✅
- PDF invoice: MG/2025-26/0002 generated correctly ✅
- Order fetch API ✅
- Razorpay widget opens from Buy Online ✅
- PaymentSuccess page renders ✅

### Pending (G4)
- Full card payment test requires rzp_test_ keys — owner to generate from Razorpay Dashboard (Test mode)
- Test card: 4111 1111 1111 1111 · expiry 12/28 · CVV 123 · OTP 1234
- Webhook payment.captured → full paid flow auto-triggers on first real/test payment
- Real GST details to replace placeholders in .env (GST_SELLER_GSTIN, GST_SELLER_ADDRESS)

**Status: G3 ✅ built → G4 pending (card test with test keys)**
