# CR-13 — Post-Payment Onboarding Flow

> Intake date: 2026-06-21.
> Source: Owner direction after CR-10 (Razorpay) mock review.
> Scope: Everything that happens AFTER a successful online payment — thank you page, onboarding brief collection, CMS admin tooling, POS activation trigger.
> Depends on: **CR-10 (Razorpay)** — this CR is built on top of a completed CR-10 order record.

---

## Business Goal

When a customer pays online, they've committed. The clock starts. The goal is:
1. **Confirm immediately** — give them proof (invoice via SMS, order summary)
2. **Capture setup context immediately** — while intent is high, collect what's needed to go live fast
3. **Arm the internal team** — everything in CMS so sales/ops can activate without a long discovery call
4. **Trigger activation** — one "Start Setup" button pushes to POS API

---

## G1 — Discovery & Impact

### Scope — 3 parts on Thank You page + CMS backend

---

### Part 1 — Thank You Screen (post-payment)

**What the customer sees immediately after payment:**

```
✓ Payment Successful
  Order ID: MG/2025-26/001
  Plan: Pro + add-ons · ₹50,650 incl. GST
  Payment ID: pay_Qx7k...

  "Your GST invoice has been sent to your phone via SMS."
  (Link in SMS → taps → downloads PDF)

  "Our team will contact you within 1 business day
   to take your setup brief."

  ── [Begin Setup Brief below] ──
  Fill this now to go live faster →
```

**Invoice delivery:**
- PDF generated on `payment.captured` webhook
- Stored via `storage.py` → `/uploads/invoices/` (local now, S3-ready)
- URL saved in `orders.invoice_url`
- SMS sent via existing panel (MYGENIE/HSEGNI) — DLT template needed for invoice link
- SMS body: *"Hi {name}, your MyGenie invoice #{invoice_no} is ready: {link}. Team MyGenie"*
- NO PDF attachment in SMS (DLT rules) — link-to-download only

---

### Part 2 — Setup Brief (3 sub-sections, same page, below the confirmation)

The customer fills this immediately after payment. Saved to `onboarding` Mongo collection linked to `order_id`.

---

#### Sub-section A — Setup Fields

> **Owner to provide exact field list** (placeholder list below based on POS setup norms)

| Field | Type | Notes |
|-------|------|-------|
| TBD by owner | — | Owner to confirm exact fields required |
| (Outlet name for POS display) | text | May differ from billing name |
| (Full outlet address) | textarea | For invoice + activation |
| (Number of tables) | number | Dine-in layout config |
| (Number of billing devices) | number | iPad/terminal count |
| (Number of captain app users) | number | User accounts |
| (Payment methods to enable) | multiselect | Cash/Card/UPI/All |
| (Aggregators active) | multiselect | Swiggy/Zomato/Magicpin |
| (Preferred go-live date) | date | Scheduling |

**Status:** 🔴 **Blocked on owner** — exact field list to be provided before G2.

---

#### Sub-section B — Menu Upload

- Accept: JPEG, PNG, PDF (multi-file, up to 10 files)
- Customer uploads existing menu (photo, printed menu scan, digital PDF)
- Stored via `storage.py` → same `/api/cms/media/` serve path already live in backend
- `onboarding.menu_files[]` = array of uploaded file URLs
- Your team digitises into POS menu items

No external service needed — reuses existing CMS media upload infrastructure.

---

#### Sub-section C — Setup Notes

**Two inputs (both optional but encouraged):**

1. **Voice memo** (browser `MediaRecorder API`)
   - Record button → records audio in browser
   - Timer visible during recording, stop button
   - Saved as `.webm` → uploaded to `storage.py` → `onboarding.voice_note_url`
   - CMS admin plays it back before activation call

2. **Text box with instruction prompt**
   - Instructional placeholder text so user knows exactly what to write:

   > *"Tell us anything that will help us set up your POS faster. For example: 'We have 2 floors and outdoor seating. Menu has 3 categories — starters, mains, drinks. We'd like inventory tracking enabled from day 1. Our busiest hours are 7–10pm.'*"

   - Stored as `onboarding.setup_notes` (free text, no limit)

---

### Part 3 — CMS Admin Side

#### Orders Tab (extension of existing `/leads` view)
- New "Orders" tab alongside existing Demo/Quote/Contact tabs
- Columns: date / customer / phone / plan / amount / invoice link / status / onboarding %

#### Onboarding Detail per Order
- Drawer/modal from the Orders tab
- Shows: all Part A fields filled + Menu files (download) + Voice note (play) + Text notes
- Admin notes field (internal, not visible to customer)
- Status badge: Pending setup → Setup started → Active

#### "Start Setup" button
- Only visible when onboarding data is complete enough
- On click:
  - `order.status` → `setup_started`
  - `POST` to POS API (endpoint + auth to be shared by owner)
  - Logs who triggered it + timestamp
  - Button → "Setup in progress" (disabled, greyed)
- 🔴 **Blocked on owner** — POS API endpoint, payload format, auth token

#### Excel Export
- `GET /api/cms/onboarding/export` (JWT-protected, admin only)
- Returns `.xlsx` with all orders + onboarding fields (one row per order)
- Columns: date / order_id / customer / phone / plan / amount / GSTIN / payment_id / all Part A fields / menu_files_count / voice_note (yes/no) / setup_notes_preview / status
- Generated server-side via `pandas` + `openpyxl` (already in `requirements.txt`)

---

## Mongo Data Model

```
orders (existing from CR-10)
  id, razorpay_order_id, razorpay_payment_id, plan_id, addon_ids,
  subtotal, gst, amount_total, status, customer{}, invoice_url,
  created_at, paid_at, setup_started_at

onboarding (new collection)
  id, order_id (FK),
  -- Part A: exact fields TBD by owner --
  menu_files: [{ url, filename, size, uploaded_at }],
  voice_note_url: str | null,
  setup_notes: str | null,
  admin_notes: str | null,
  setup_started_by: str | null,
  setup_started_at: datetime | null,
  status: "pending" | "setup_started" | "active",
  created_at, updated_at
```

---

## New Backend Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/onboarding` | Public (order_id token) | Customer submits setup brief |
| `PUT` | `/api/onboarding/:order_id` | Public (order_id token) | Customer updates before admin reviews |
| `POST` | `/api/onboarding/upload` | Public (order_id token) | Upload menu file |
| `GET` | `/api/cms/onboarding` | CMS JWT | Admin views all onboarding records |
| `POST` | `/api/cms/onboarding/:order_id/start-setup` | CMS JWT | Trigger POS API + update status |
| `GET` | `/api/cms/onboarding/export` | CMS JWT | Download Excel |

**Auth for public endpoints:** On payment success, issue a short-lived signed token bound to `order_id` (similar to OTP token pattern already in `otp.py`) — prevents strangers from submitting against arbitrary order IDs.

---

## New Frontend Pages / Components

| Component | Description |
|-----------|-------------|
| `pages/PaymentSuccess.jsx` | Thank you page — order confirmation + invoice SMS note + setup brief |
| `components/onboarding/SetupFields.jsx` | Part A form (fields TBD) |
| `components/onboarding/MenuUpload.jsx` | Part B multi-file uploader |
| `components/onboarding/SetupNotes.jsx` | Part C voice recorder + text box |
| `pages/CmsOnboarding.jsx` | CMS admin onboarding list |
| `components/onboarding/OnboardingDrawer.jsx` | Per-order detail + Start Setup button |

---

## SMS DLT Template Needed

For invoice link SMS, owner needs to register a new DLT template:

> *"Hi {#var#}, your MyGenie invoice {#var#} is ready: {#var#}. For support call {#var#}. Team MyGenie HOSIGENIE"*

Or reuse existing template if the message fits the registered format.

---

## Gate Progress

| Gate | Status | Notes |
|------|--------|-------|
| **G1 Discovery** | 🟡 In progress | This document. Two blockers open (Part A fields, POS API) |
| **G2 Planning** | 🔴 Blocked | Needs: exact Part A fields + POS API endpoint from owner |
| **G3 Implementation** | 🔴 Not started | Depends on CR-10 being built first |
| **G4 QA** | 🔴 Not started | — |
| **G5 Owner Smoke** | 🔴 Not started | — |

---

## G1 Blockers (must clear to enter G2)

| # | Blocker | Owner action |
|---|---------|-------------|
| 1 | Exact Part A setup fields | Owner to provide list |
| 2 | POS API endpoint + payload + auth | Owner to share |
| 3 | `RAZORPAY_WEBHOOK_SECRET` | Fill in `.env` (also blocks CR-10) |
| 4 | GST seller details | Fill in `.env` (also blocks CR-10) |
| 5 | DLT template for invoice SMS | Owner to register or confirm existing template can be reused |

---

## Build Dependencies

```
CR-10 (Razorpay) must be COMPLETE before CR-13 G3 begins.
CR-13 reuses: storage.py, cms_auth.py, otp.py token pattern, CMS JWT, existing media upload.
```
