# SESSION HANDOVER — 2026-06-21 (CR-10 Razorpay Build + Pricing UX)

> **Scope this session:** Fresh repo pull, Pricing UX iteration (closed), CR-10 Razorpay payment integration (G3 built), CR-13 captured (G1 in progress).
> Read alongside: `memory/PRD.md`, `CR-9_Pricing_GST_and_Razorpay.md`, `CR-13_Post_Payment_Onboarding.md`, `CR_Control_Dashboard.md`.

---

## 1. What was BUILT this session

### Pricing UX (all closed — see PRD for full list)
- Scroll hint banner after plan click (Option A)
- "Compare all plans" opens modal overlay (not scroll anchor)
- Comparison table: X marks, sticky left column, scroll glitch fixed (split overflow)
- Priority multi-select chips (max 3), `recommend()` updated
- Add-on Quick Overview button on every add-on card
- Mobile responsive fixes (flex-wrap headings, modal padding)
- Logo.jsx prepared for footer typeface logo

### CR-10 — Razorpay Payment Integration (G3 ✅)

**New files:**
- `backend/payments.py` — complete Razorpay integration module
- `frontend/src/pages/PaymentSuccess.jsx` — thank you page

**Files changed:**
- `backend/server.py` — import payments after load_dotenv; include router
- `frontend/src/components/pricing/CheckoutModal.jsx` — buy-intent flow rewritten; GSTIN added
- `frontend/src/App.js` — `/payment-success` route

**API endpoints (all under `/api/payments/`):**
```
POST /razorpay/order    — create order, save to Mongo orders{}, Freshsales Payment Awaited
POST /razorpay/verify   — HMAC verify → mark paid → PDF invoice → SMS → Freshsales Won
POST /razorpay/webhook  — Razorpay webhook source of truth (payment.captured / payment.failed)
GET  /order/:id         — fetch order for PaymentSuccess page
```

**Payment flow:**
```
Buy Online click
  → CheckoutModal (form + GSTIN)
  → POST /api/payments/razorpay/order → Razorpay order created
  → Razorpay JS widget opens (dynamic script load — no npm package)
  → Customer pays (UPI/Card/NetBanking/Wallet)
  → handler() → POST /api/payments/razorpay/verify (HMAC check)
  → navigate to /payment-success?order_id=...
  → PaymentSuccess: order summary + "Invoice sent via SMS" + "Contact in 1 business day"
  → Webhook fires payment.captured (idempotent duplicate of verify)
```

**Amount formula:**
```
subtotal_mo = plan.price + sum(addon.prices)
subtotal_yr = subtotal_mo × 12
gst         = round(subtotal_yr × 0.18)
total       = subtotal_yr + gst
paise       = total × 100
```

**PDF Invoice:** `reportlab` generates A4 GST invoice → `storage.py` saves → URL in `orders.invoice_url` → SMS link sent via existing panel

**Freshsales on payment:**
- Order created → status `Payment Awaited` (`402001783018`)
- Payment captured → lifecycle `Customer` (`403021121247`) + status `Won` (`402001137712`) + tag `Paid Online`
- Payment failed → tag `Buy Online (Payment Failed)`

**Mongo collection:** `orders` — full order record + customer + attribution + invoice_url + status

---

## 2. ENV State (as of 2026-06-21)

**All Razorpay + Freshsales keys filled and validated.**

| Key | Status | Note |
|-----|--------|------|
| `RAZORPAY_KEY_ID` | ✅ `rzp_live_9lMs01gisZhwQX` | ⚠️ LIVE — use `rzp_test_` for testing |
| `RAZORPAY_KEY_SECRET` | ✅ Filled | |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ `MyGenieWebhookSecret@2026` | |
| `GST_SELLER_NAME` | ✅ Placeholder | Replace with real legal name |
| `GST_SELLER_GSTIN` | ✅ `PLACEHOLDER_GSTIN` | Replace with real GSTIN |
| `GST_SELLER_ADDRESS` | ✅ Placeholder | Replace with real address |
| `GST_HSN_SAC` | ✅ `997331` | |
| `GST_INVOICE_PREFIX` | ✅ `MG/2025-26` | |
| `FRESHSALES_LIFECYCLE_CUSTOMER_ID` | ✅ `403021121247` | API-confirmed |
| `FRESHSALES_STATUS_WON_ID` | ✅ `402001137712` | API-confirmed |

**Additional Freshsales status IDs found (for CR-13):**
- `402001783018` = Payment Awaited
- `402001755414` = Payment Received

---

## 3. What's Pending (prioritised)

### P0 — CR-10 Full Card Test (G4)
Owner needs to:
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com) → toggle to **Test mode** → Settings → API Keys → Generate Test Key Pair
2. Put `rzp_test_XXXX` / secret in `/app/backend/.env`
3. `sudo supervisorctl restart backend`
4. Test card: `4111 1111 1111 1111` · expiry `12/28` · CVV `123` · OTP `1234`
5. Verify PaymentSuccess page loads with correct order details
6. Swap back to `rzp_live_` for go-live

### P0 — CR-10 Real GST Details
Replace in `.env`:
- `GST_SELLER_GSTIN=PLACEHOLDER_GSTIN` → real GSTIN
- `GST_SELLER_ADDRESS=...` → registered address
- `GST_SELLER_NAME=MyGenie POS Pvt Ltd` → legal entity name

### P0 — CR-13 G1 Unblock
Owner to provide:
1. **Exact Part A setup fields** (outlet-specific fields needed for POS activation)
2. **POS API endpoint + payload + auth** (for "Start Setup" button in CMS)
3. DLT SMS template for invoice link SMS

### P1 — Owner Content TODOs
- Upload add-on + plan demo GIFs via `?admin=1` (CMS edit mode)
- Drop typeface logo file into `/app/frontend/public/brand/logo-light.svg`

---

## 4. Key Gotchas for Next Agent

### Import order in server.py is critical
`import payments as payments_module` MUST come AFTER `load_dotenv(ROOT_DIR / '.env')`. Module-level env reads in payments.py happen at import time. Current order in server.py (line ~29):
```python
load_dotenv(ROOT_DIR / '.env')
import freshsales
...
import payments as payments_module  ← after load_dotenv
```

### Duplicate .env keys kill values
Earlier session had `GST_INVOICE_PREFIX` appearing twice (once with value, once blank). Last occurrence wins. Always grep for duplicate keys if env vars appear empty.

### Razorpay test vs live keys
- `rzp_live_` keys = real money, test cards rejected
- `rzp_test_` keys = test mode, test cards accepted
- Widget and flow are identical — just swap keys + restart

### Storage for invoices
PDF invoices stored via existing `storage.py` at `/uploads/XXXX.pdf`, served via `/api/cms/media/XXXX.pdf`. Same path as CMS media uploads. Invoice URL in `orders.invoice_url`.

### Invoice sequence counter
Uses Mongo `order_seq` collection with `find_one_and_update + $inc`. Auto-creates on first call. Invoice numbers: `MG/2025-26/0001`, `0002`, etc.

---

## 5. Next Session Suggested Actions

1. Owner provides `rzp_test_` keys → agent puts in `.env` → restarts backend → runs full card test
2. Owner provides Part A setup fields → agent updates CR-13 G2 → builds mock UI for all CR-13 screens
3. Owner updates GST details in `.env`
4. After full test passes → update `CR_Control_Dashboard.md` CR-10 to G4 ✅ → G5 owner smoke
