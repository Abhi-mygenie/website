# Implementation Plan — All Agent-Fillable Gaps
**Date:** June 2026
**Status:** PLAN — awaiting owner approval before execution

---

## What I can implement without owner input

| # | Task | Files | Effort |
|---|---|---|---|
| T1 | Invoice PDF full redesign (match approved mockup) | `backend/payments.py` | Large |
| T2 | Footer logo-light.svg (white version of brand logo) | `frontend/public/brand/logo-light.svg` | Small |
| T3 | Tailwind orange alignment (#FF6B00 → #f26b33) | `frontend/tailwind.config.js` | Micro |
| T4 | Install svglib for logo embed in PDF | `backend/requirements.txt` | Small |

---

## What requires owner input (not in this plan)

| Gap | Waiting for |
|---|---|
| Test card payment | Owner runs test on pricing page |
| Razorpay webhook registration | Owner registers URL in Razorpay dashboard |
| Live key swap (rzp_live_) | After test passes |
| Light logo file (if different from white version) | Owner uploads via CMS or provides file |
| CR-13 post-payment onboarding | Owner provides Part A fields + POS API |
| CR-12 pricing expansion | Owner confirms Hotels/Custom plan details |
| G5 smoke tests (CR-1 to CR-7) | Owner runs flows on site |

---
---

# TASK 1 — Invoice PDF Full Redesign
**File:** `backend/payments.py`
**Function:** `_generate_invoice()` — complete rewrite

---

## T1.1 — Logo in PDF

**Problem:** `reportlab` cannot render SVG natively. `cairosvg` and `svglib` are not installed.

**Solution:** Install `svglib` (lightweight, no system deps):
```
pip install svglib
```
`svglib` converts SVG → reportlab Drawing → embed in PDF. It supports the MyGenie logo SVG (basic paths + fills, no filters).

**Fallback:** If svglib fails at render time → draw text logo in orange `#f26b33`, bold 22pt, "MyGenie POS".

**Logo file path:** `/app/frontend/public/brand/logo.svg`
(accessible from backend as `Path(__file__).parent.parent / "frontend/public/brand/logo.svg"`)

---

## T1.2 — Full layout rebuild

### Zone map (A4 = 210mm × 297mm, margins 15mm each side)

```
┌───────────────────────────────────────────────┐  ← 297mm top
│  [5px orange→green gradient strip]            │  297–295mm
├───────────────────────────────────────────────┤
│  HEADER                                       │  295–265mm (30mm)
│  Logo (left, 35mm tall)                       │
│  Invoice No in #f26b33 18pt bold (right)      │
│  Date + Full Txn ID (right, 9pt grey)         │
│  [ORIGINAL] badge in #329937 (right)          │
├───────────────────────────────────────────────┤
│  PARTIES                                      │  265–230mm (35mm)
│  BILLED FROM (left)   │  BILLED TO (right)    │
│  MyGenie POS bold     │  Customer name bold   │
│  Legal name 9pt       │  Business name        │
│  Address line 1       │  Phone / Email        │
│  Address line 2       │  GSTIN chip (if any)  │
│  GSTIN chip (orange)  │                       │
├───────────────────────────────────────────────┤
│  META ROW (4 cells, light grey bg)            │  230–220mm (10mm)
│  Place of Supply │ Reverse Charge │ Period │ Supply Type │
├───────────────────────────────────────────────┤
│  LINE ITEMS TABLE                             │  220–160mm (60mm+)
│  Header row: dark (#111827) bg, white text    │
│  Cols: Description(40%) │ HSN(12%) │ Qty(8%)  │
│        Rate/mo(16%) │ Amount/yr(24%)          │
│  Plan row (bold) + Add-on rows (indented)     │
├───────────────────────────────────────────────┤
│  TOTALS (right-aligned box, 60mm wide)        │  dynamic
│  Subtotal                                     │
│  CGST @ 9%  (if same state)                   │
│  SGST @ 9%  (if same state)                   │
│  IGST @ 18% (if different state / B2C)        │
│  [TOTAL PAYABLE — orange bar, white text]     │
│  Tax note (italic, 9pt grey)                  │
├───────────────────────────────────────────────┤
│  SPACER                                       │  flex
├───────────────────────────────────────────────┤
│  FOOTER                                       │  35–0mm
│  "Computer generated. No signature required." │
│  "Annual subscription — non-refundable."      │
│  "support@mygenie.in | mygenie.in"            │
│  Legal entity + GSTIN (small grey)            │
│  [5px green→orange gradient strip at bottom] │
└───────────────────────────────────────────────┘
```

---

## T1.3 — CGST / SGST / IGST logic

```python
SELLER_STATE_CODE = "09"  # UP, from GSTIN 09AAHCH4730Q1Z0

def _determine_tax_type(buyer_gstin: str | None) -> str:
    """Returns 'cgst_sgst' or 'igst'"""
    if buyer_gstin and len(buyer_gstin) >= 2:
        buyer_state = buyer_gstin[:2]
        if buyer_state == SELLER_STATE_CODE:
            return "cgst_sgst"
    return "igst"   # B2C or different state → IGST
```

**PDF display:**
- `cgst_sgst` → two rows: CGST @ 9% + SGST @ 9%
- `igst` → one row: IGST @ 18%

**Tax note line** (below totals box, italic grey):
- `cgst_sgst` → "* CGST & SGST applicable — Buyer and Seller both in Uttar Pradesh (09)"
- `igst` → "* IGST applicable — [Buyer state / B2C]"

---

## T1.4 — All 7 fixes applied

| Fix | Implementation |
|---|---|
| F1 Address 2 lines | Split `GST_SELLER_ADDRESS` at last comma before midpoint. Draw 2 lines. |
| F2 CGST/SGST vs IGST | Logic in T1.3 above |
| F3 Place of Supply | Meta row cell. Value = buyer state from GSTIN, or "—" for B2C |
| F4 Reverse Charge | Meta row cell. Always "No" |
| F5 Qty + Rate columns | 5-column table. Qty=1, Rate=price/mo |
| F6 Full Txn ID | `razorpay_payment_id` — full string, 8pt font |
| F7 ORIGINAL badge | Small green rectangle badge next to "GST TAX INVOICE" |

---

## T1.5 — Brand colours in PDF

| Element | Colour |
|---|---|
| Top gradient strip | `#f26b33` → `#329937` (orange to green, left to right) |
| Invoice number | `#f26b33` (brand orange) |
| ORIGINAL badge | `#329937` (brand green) |
| Section labels (BILLED FROM/TO) | `#f26b33` |
| GSTIN chips | Filled `#fff7f0`, border `#fdd9c8`, text `#c45a22` |
| Table header | `#111827` (near black) |
| Add-on orange dot | `#f26b33` |
| Total Payable bar | `#f26b33` background, white text |
| Bottom gradient strip | `#329937` → `#f26b33` |
| Footer text | `#9ca3af` |

---

## T1.6 — What STAYS the same (no scope creep)

- `_next_invoice_no()` — already updated (MG_2026_27_JUNE_XXXXX) ✅
- `PLAN_HSN_MAP` — already updated per plan ✅
- All Razorpay order/verify/webhook route logic — untouched
- All Freshsales, SMS flows — untouched
- `OrderCreateRequest` model — untouched

---
---

# TASK 2 — Footer Logo (logo-light.svg)
**File:** `frontend/public/brand/logo-light.svg`
**Current state:** Placeholder — just text "mygenie" in white Georgia font. Not the real logo.

**Fix:** Generate a white/monochrome version of the real logo SVG by replacing all colour fills:
- `#f26b33` (orange) → `#ffffff` (white)
- `#329937` (green) → `#ffffff` (white)
- `#f6ae31` (star yellow) → `#ffffff` (white)

This gives a clean all-white version for use on the dark green footer background.

**Used by:** `Logo.jsx` with `light=true` → `Footer.jsx` navbar at bottom

---
---

# TASK 3 — Tailwind Orange Alignment
**File:** `frontend/tailwind.config.js`

**Current:** `brand.orange: "#FF6B00"`
**Logo actual:** `#f26b33`
**Difference:**
- `#FF6B00` = more saturated, slightly darker orange-red
- `#f26b33` = slightly lighter, more coral/warm orange (exact logo colour)

**Impact of change:** Every element using `text-brand-orange`, `bg-brand-orange`, `border-brand-orange` across the site will shift slightly.

**Affected elements:**
- Stat numbers on home page (₹1 Lakh, 40%, 30%, 25%)
- "Book a Free Demo" button hover state
- Section eyebrow labels ("For Restaurants", "Customer stories", etc.)
- Pricing page accents
- Product page icons (alternating orange/green)

**Verdict:** The change is a ~4% hue shift. It will make the site's orange exactly match the logo. Recommended.

**Change:** 1 line in `tailwind.config.js`
```js
orange: "#f26b33",   // was "#FF6B00"
```

---
---

# TASK 4 — Install svglib
**For:** Logo embed in PDF (T1.1)

```
pip install svglib==1.5.1
```

Update `requirements.txt` via pip freeze after install.

**Risk:** svglib has occasional rendering issues with complex SVGs. Logo SVG is simple (basic paths, no filters, no gradients) — low risk. Fallback to text logo implemented if rendering fails.

---
---

# Execution Order

```
Step 1: pip install svglib → update requirements.txt
Step 2: Build new _generate_invoice() in payments.py (T1)
Step 3: Generate logo-light.svg white version (T2)
Step 4: Update tailwind orange (T3)
Step 5: Restart backend (payments.py change)
Step 6: Screenshot invoice mockup page to verify logo renders
Step 7: Screenshot website navbar + footer to verify logos
Step 8: Test invoice generation via curl (dry run with test order)
```

---

# Files to be changed

| File | Change type | Risk |
|---|---|---|
| `backend/payments.py` | Full `_generate_invoice()` rewrite | Medium — isolated to PDF generation |
| `backend/requirements.txt` | Add `svglib` | Low |
| `frontend/public/brand/logo-light.svg` | Replace placeholder with white logo | Low — no JS logic |
| `frontend/tailwind.config.js` | 1-line colour change | Low — visual only |

---

# Not changing (confirmed out of scope)

- All route handlers in payments.py
- Razorpay order/verify/webhook logic
- CheckoutModal.jsx
- PaymentSuccess.jsx
- Any CMS, leads, OTP, Freshsales files
- Any pricing logic

---

*Plan ready. Awaiting approval to execute.*
