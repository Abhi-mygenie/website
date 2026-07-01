# Invoice PDF — Fix Plan & Design Spec
**Version:** 1.0 | **Date:** June 2026
**Status:** Planning — awaiting owner approval before implementation

---

## Confirmed Decisions

| Decision | Value |
|---|---|
| Header brand name | **MyGenie POS** (not legal entity name) |
| Legal entity (seller block) | HOSIGENIE HOSPITALITY SERVICES PRIVATE LIMITED |
| Seller GSTIN | 09AAHCH4730Q1Z0 |
| Seller state code | **09 = Uttar Pradesh** |
| GST split logic | Same state (buyer UP) → CGST 9% + SGST 9%. Different state → IGST 18% |
| Invoice numbering | MG_2026_27_JUNE_XXXXX (5-digit, underscore separator) ✅ done |
| HSN per plan | starter=998311, growth=998312, pro=998313, custom=998314 ✅ done |

---

## All Fixes — Detailed Plan

---

### FIX 1 — Address truncation (CRITICAL)
**Current:** `GST_SELLER_ADDRESS[:60]` — cuts at 60 chars, drops pin code
**Problem:** "E-291, Dayal Bagh Road, Kamal Nagar, Agra, Uttar Pradesh-2" ← pin cut

**Fix:** Split address into 2 lines at natural break point
```python
# Split at comma closest to midpoint
addr = GST_SELLER_ADDRESS
mid = len(addr) // 2
split_at = addr.rfind(",", 0, mid + 10) + 1
line1 = addr[:split_at].strip()
line2 = addr[split_at:].strip()
c.drawString(20*mm, y - 18*mm, line1)
c.drawString(20*mm, y - 24*mm, line2)
```
**Result:**
- Line 1: `E-291, Dayal Bagh Road, Kamal Nagar,`
- Line 2: `Agra, Uttar Pradesh-282005`

**Impact on layout:** Seller block grows by 1 line (~6mm). Adjust `y` offset for line items table accordingly.

---

### FIX 2 — CGST / SGST / IGST split (CRITICAL — GST compliance)
**Current:** Single line "GST @ 18%" — not GST-law compliant

**Logic:**
```
Seller state: UP (code 09, from GSTIN 09AAHCH4730Q1Z0)

IF buyer has GSTIN:
    buyer_state_code = buyer_gstin[:2]
    IF buyer_state_code == "09":  → same state → CGST 9% + SGST 9%
    ELSE:                          → different state → IGST 18%

IF buyer has NO GSTIN (B2C consumer):
    → default to IGST 18%
    (For B2C, place of supply = buyer's state, but since we don't collect state,
     IGST is the safe default for SaaS/subscription services)
```

**PDF display:**
```
Same state (B2B UP):          Different state / B2C:
  Subtotal    ₹40,764           Subtotal    ₹40,764
  CGST @ 9%   ₹3,669            IGST @ 18%  ₹7,337
  SGST @ 9%   ₹3,669            ─────────────────
  ─────────────────             Total       ₹48,101
  Total       ₹48,101
```

**Code approach:**
```python
seller_state = "09"  # hardcoded from GSTIN
buyer_gstin = customer.get("gstin", "")
if buyer_gstin and buyer_gstin[:2] == seller_state:
    # CGST + SGST
    cgst = round(subtotal * 0.09)
    sgst = round(subtotal * 0.09)
    # draw two lines
else:
    # IGST
    igst = gst_amt
    # draw one line
```

---

### FIX 3 — Add "Place of Supply" field (REQUIRED)
**Current:** Missing entirely
**Fix:** Add below seller/buyer block

```
Place of Supply: [Buyer's state if GSTIN available, else "Not Specified"]
```

**Logic:**
- If buyer GSTIN provided → extract state name from first 2 digits
- If no GSTIN → show "—" (acceptable for B2C)

**Layout:** Single line between seller/buyer block and line items table.

---

### FIX 4 — Add "Reverse Charge" field (REQUIRED)
**Current:** Missing
**Fix:** Add one line near Place of Supply

```
Reverse Charge: No
```

Always "No" for our use case (we are the supplier, not receiving under RCM).

---

### FIX 5 — Add Qty + Rate columns to line items table (RECOMMENDED)
**Current table columns:** Description | HSN/SAC | Amount (₹)
**Fixed table columns:** Description | HSN/SAC | Qty | Rate/mo | Amount/yr (₹)

**Values:**
- Plan row: Qty = 1 outlet, Rate = ₹{plan_price}/mo, Amount = ₹{plan_price × 12}
- Add-on rows: Qty = 1, Rate = ₹{addon_price}/mo, Amount = ₹{addon_price × 12}

**Column widths (A4 = 210mm, margins 20mm each = 170mm usable):**
```
Description:  0–88mm   (88mm wide)
HSN/SAC:     90–115mm  (25mm wide)
Qty:         117–127mm (10mm wide)
Rate/mo:     129–149mm (20mm wide)
Amount/yr:   151–170mm (19mm wide, right-aligned)
```

---

### FIX 6 — Show full Payment ID (LOW)
**Current:** `razorpay_payment_id[:20]...` — truncated
**Fix:** Show full ID, smaller font (8pt)

```python
c.setFont("Helvetica", 8)
c.drawRightString(W - 20*mm, H - 42*mm, f"Txn ID: {razorpay_payment_id}")
```

---

### FIX 7 — Add "Original" marking (LOW)
**Current:** Missing
**Fix:** Add to header bar, right side, below invoice number

```
Invoice: MG_2026_27_JUNE_00012
Date: 2026-06-21
Txn ID: pay_XXXXXXXXXXXXXXXXXX
[Original]
```

---

### FIX 8 — Seller address line 2 in seller block (covered in FIX 1)
Already handled by FIX 1 two-line split.

---

## Layout Changes Summary (before vs after)

### BEFORE (current)
```
[HEADER BAR — 55mm tall]
  Brand | Invoice No + Date + Txn ID (truncated)

[SELLER + BUYER — y from H-70mm]
  Seller 3 lines (address cut)    Bill To 3-4 lines

[LINE ITEMS TABLE — y from H-110mm]
  3 columns: Description | HSN | Amount

[TOTALS]
  Subtotal | GST 18% | Total

[FOOTER — fixed at 18mm from bottom]
```

### AFTER (fixed)
```
[HEADER BAR — 55mm tall]
  MyGenie POS | Invoice No, Date, Full Txn ID, [Original]

[SELLER + BUYER — y from H-70mm]
  Seller 4 lines (2-line address)  Bill To 4-5 lines

[META ROW — y from H-118mm]
  Place of Supply: XX    Reverse Charge: No

[LINE ITEMS TABLE — y from H-128mm]
  5 columns: Description | HSN | Qty | Rate/mo | Amount/yr

[TOTALS — right-aligned]
  Subtotal
  CGST 9% + SGST 9%  (or IGST 18%)
  ────────
  Total

[FOOTER — fixed at 18mm]
  Computer generated. No signature required.
  Annual subscription — non-refundable after activation.
```

---

## Implementation Order

| Step | Fix | Effort | Blocker |
|---|---|---|---|
| 1 | FIX 1 — Address 2 lines | 15 min | None |
| 2 | FIX 2 — CGST/SGST/IGST | 30 min | None |
| 3 | FIX 3 — Place of Supply | 15 min | None |
| 4 | FIX 4 — Reverse Charge | 5 min | None |
| 5 | FIX 5 — Qty + Rate columns | 30 min | Owner approval on column layout |
| 6 | FIX 6 — Full Txn ID | 5 min | None |
| 7 | FIX 7 — Original marking | 5 min | None |
| **Total** | | **~1.5 hrs** | |

---

## Open Questions (need owner answer before build)

| # | Question | Options |
|---|---|---|
| Q1 | For B2C buyers (no GSTIN) — which tax type? | A) IGST 18% always (recommended) B) Ask buyer for state during checkout |
| Q2 | Add-on HSN code — same as plan or separate? | A) Same as plan (current) B) Define per add-on category |
| Q3 | Should invoice be emailed as attachment? | A) SMS link only (current) B) Email PDF attachment also |

---

*File: `/app/INVOICE_FIX_PLAN.md`*
*Mockup: `/app/frontend/public/invoice-mockup.html`*
*Last updated: June 2026*
