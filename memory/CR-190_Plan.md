# CR-190 — Product Pages: Keyword Gaps (All 6 Pages)

**Date registered:** 2026-09-02
**Status:** READY TO IMPLEMENT
**Priority:** P1
**Source:** Sep 2026 audit screenshot — confirmed against live prerendered build

---

## Problem

All 6 product pages are missing 2–3 high-value keywords each from their body content.
Product page titles use internal feature names ("Sell & Serve Faster | MyGenie POS Features") — they do not contain keyword-rich phrases. The keyword burden falls entirely on the body.

---

## Architecture

All product page body content comes from **`src/data/products.js`**.

`ProductPage.jsx:72` sets title as: `${p.title} | MyGenie POS Features` — purely internal name.
Meta description uses `p.sub`. All product page `sub` fields are ≤160ch with good headroom (10–50ch), confirming that `sub` edits are safe for most pages.

**CMS override status:** `product.sell-serve.faqs` and `product.run-property.hero.sub` are CMS-overridden.
All other product page fields (`h1`, `modules[]`, other `sub` fields) are NOT overridden — data file changes take effect.

---

## Confirmed Gaps (verified against live prerendered build)

| Page | Missing Keywords | Present Keywords |
|---|---|---|
| `/product/sell-serve` | `pos system` (0), `order management` (0) | billing software:1, table management:3 |
| `/product/central-inventory` | `stock management` (0), `food cost` (0), `recipe management` (0) | inventory management:5, central inventory:10 |
| `/product/customers` | `customer management` (0), `loyalty program` (0) | crm:3, loyalty:5 |
| `/product/run-property` | `hotel management` (0), `analytics` (0), `dashboard` (0) | property management:1, hospitality:3 |
| `/product/protect-profit` | `theft prevention` (0), `cash management` (0), `analytics` (0) | audit:3, profit:15 |
| `/product/see-everything` | `analytics` (0), `sales report` (0), `business intelligence` (0) | dashboard:4, real-time:4 |

---

## Sub Field Headroom (CR-181 equivalent check for product pages)

| Page | Sub length | Headroom | Safe to edit sub? |
|---|---|---|---|
| sell-serve (L9) | 129ch | +31ch | ✅ Yes |
| run-property (L34) | 127ch | +33ch | ✅ Yes — but `product.run-property.hero.sub` is CMS-overridden → edit modules[] instead |
| customers (L57) | 110ch | +50ch | ✅ Yes |
| protect-profit (L82) | 122ch | +38ch | ✅ Yes |
| see-everything (L105) | 114ch | +46ch | ✅ Yes |
| central-inventory (L129) | 150ch | +10ch | ⚠️ Tight — use `modules[].outcome` instead |

---

## Per-Page Fix Plan

### /product/sell-serve (L5–28 in products.js)

**Gaps:** `pos system` (0), `order management` (0)

**Fix:** Extend `modules[0]` (POS Billing) outcome to include "pos system":
- Current `modules[0].outcome` (L11): `"Restaurant billing in seconds, even at peak rush."`
- Proposed: `"Restaurant POS system billing in seconds — fast, accurate, even at peak rush."`

And extend `modules[1]` (Captain App & Table Management) to include "order management":
- Current `modules[1].outcome` (L12): `"Table management in real time — multiple waiters, one table, no clashes."`
- Proposed: `"Table and order management in real time — multiple waiters, one table, no clashes."`

**Auditor-suggested copy (full sentence alternative):**
> "MyGenie QSR POS system speeds up counter service — order management, fast billing and cash drawer control all in one." *(adapt to sell-serve context)*

---

### /product/central-inventory (L125–148 in products.js)

**Gaps:** `stock management` (0), `food cost` (0), `recipe management` (0)

Sub headroom is only +10ch — use `modules[]` fields.

**Fix:** Extend modules to include gaps:
- `modules[2]` (Central Procurement, L133): Add "stock management" to outcome
  - Current: `"Buy centrally, distribute smartly, negotiate better rates."`
  - Proposed: `"Central stock management — buy centrally, distribute smartly, negotiate better rates."`

- `modules[4]` (Central Recipe & BOM Costing, L135): Add "recipe management" + "food cost"
  - Current: `"Standardise recipes and costs across every franchise outlet."`
  - Proposed: `"Recipe management and food cost control — standardise recipes and BOM costs across every outlet."`

**Auditor-suggested copy:**
> "Reduce food cost and improve stock management — MyGenie gives you recipe-level consumption tracking and automatic purchase order alerts."

---

### /product/customers (L53–76 in products.js)

**Gaps:** `customer management` (0), `loyalty program` (0)

Sub has +50ch headroom — safe to use sub OR modules[].

**Fix:** Extend `modules[0]` (CRM, L59):
- Current outcome: `"Every bill becomes customer data you can use."`
- Proposed: `"Customer management made easy — every bill becomes customer data you can action."`

And extend `modules[1]` (Loyalty, L60):
- Current outcome: `"Reward regulars automatically and lift repeat visits."`
- Proposed: `"Loyalty program that rewards regulars automatically and lifts repeat visits."`

---

### /product/run-property (L30–51 in products.js)

**Gaps:** `hotel management` (0), `analytics` (0), `dashboard` (0)

**Note:** `product.run-property.hero.sub` is CMS-overridden — do NOT edit `sub`. Use `modules[]`.

**Fix:** Extend `modules[3]` (Single Checkout Bill, L39):
- Current outcome: `"Everything a guest used, on one clean bill."`
- Proposed: `"Hotel management simplified — everything a guest used on one clean checkout bill."`

And extend `modules[0]` (Hotel / Room Billing, L36):
- Current outcome: `"Rooms + F&B + spa on one consolidated checkout bill."`
- Proposed: `"Rooms + F&B + spa on one consolidated checkout bill — analytics and dashboard access from your phone."`

---

### /product/protect-profit (L78–99 in products.js)

**Gaps:** `theft prevention` (0), `cash management` (0), `analytics` (0)

Sub has +38ch headroom — safe for either field.

**Fix:** Extend `modules[2]` (Audit Reports, L86):
- Current outcome: `"Every void, cancel and discount on the record."`
- Proposed: `"Theft prevention analytics — every void, cancel and discount on the record."`

And extend `modules[3]` (Smart Validations, L87):
- Current outcome: `"Stop billing mistakes and discount misuse at the source."`
- Proposed: `"Cash management and billing validation — stop mistakes and discount misuse at the source."`

---

### /product/see-everything (L101–123 in products.js)

**Gaps:** `analytics` (0), `sales report` (0), `business intelligence` (0)

Sub has +46ch headroom — safe. `dashboard` already present (4×).

**Fix:** Extend `modules[1]` (Reports, L108):
- Current outcome: `"Daily, item-wise, payment-mode, staff — automatic."`
- Proposed: `"Daily sales report and analytics — item-wise, payment-mode, staff — automatic."`

And extend `modules[0]` (Owner Dashboard, L107):
- Current outcome: `"Know how every outlet is doing — live, from anywhere."`
- Proposed: `"Business intelligence dashboard — know how every outlet is doing, live, from anywhere."`

**Auditor-suggested copy:**
> "Restaurant analytics and sales reports delivered live to your phone — no login required, no waiting for end-of-day summaries."

---

## Files Changed

| # | File | Lines/fields |
|---|---|---|
| 1 | `src/data/products.js` | `modules[].outcome` edits across all 6 products |

**Note:** `sub` edits avoided for run-property (CMS-overridden) and central-inventory (tight headroom). All others could also be fixed via `sub` if preferred during implementation.

---

## Verification Gate (after build)

```python
python3 << 'EOF'
import os

checks = {
    'product/sell-serve':         ['pos system','order management'],
    'product/central-inventory':  ['stock management','food cost','recipe management'],
    'product/customers':          ['customer management','loyalty program'],
    'product/run-property':       ['hotel management','analytics','dashboard'],
    'product/protect-profit':     ['theft prevention','cash management','analytics'],
    'product/see-everything':     ['analytics','sales report','business intelligence'],
}
base = '/app/frontend/build'
all_pass = True
for slug, kws in checks.items():
    html = open(f'{base}/{slug}/index.html').read()
    body = html[html.find('<body'):].lower()
    for kw in kws:
        cnt = body.count(kw)
        ok = cnt >= 1
        if not ok: all_pass = False
        print(f'  {"✅" if ok else "❌"} /{slug}: {kw}={cnt}')
print()
print('OVERALL:', 'PASS ✅' if all_pass else 'FAIL ❌')
EOF
```

---

*Plan registered 2026-09-02. 1 file (`products.js`), ~12 `modules[].outcome` edits across 6 product pages.*
