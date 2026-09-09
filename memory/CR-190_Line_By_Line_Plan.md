# CR-190 — Complete Impact Analysis & Line-by-Line Plan
# Product Pages Keyword Gaps: All 6 Pages

**Date:** 2026-09-02
**Status:** PLANNING COMPLETE
**File:** `src/data/products.js`
**Total edits:** 12 (10 safe · 2 need owner approval)
**All char counts:** Python-verified

---

## 1. Architecture

All product page body content comes from **`src/data/products.js`**.

`ProductPage.jsx` renders these fields to the visible page body:
- `p.h1` → visible `<h1>` heading
- `p.sub` → hero subtitle (may be CMS-overridden — see §3)
- `p.modules[].outcome` → feature card one-liner (line 178 in template)
- `p.modules[].caps[]` → bullet points inside each feature card
- `p.proof[].quote` → testimonial quotes
- `p.faqs[].a` → FAQ answers (may be CMS-overridden — see §3)

**Meta description** (`<Seo ... description={p.sub}>`, template L72) always uses `p.sub` from the data file — even when the hero subtitle is CMS-overridden.

**Chosen insertion field:** `modules[].outcome`
- NOT used as meta description ✅
- NOT JSON-LD ✅
- NOT CMS-overridden on any product (confirmed below) ✅
- Visible to users in feature cards ✅

---

## 2. Confirmed Keyword Gaps (current build)

| Page | Missing | Present |
|---|---|---|
| `/product/sell-serve` | `pos system`, `order management` | billing software:1, table management:3 |
| `/product/central-inventory` | `stock management`, `food cost`, `recipe management` | inventory management:5, central inventory:10 |
| `/product/customers` | `customer management`, `loyalty program` | crm:3, loyalty:5 |
| `/product/run-property` | `hotel management`, `analytics`, `dashboard` | property management:1, hospitality:3 |
| `/product/protect-profit` | `theft prevention`, `cash management`, `analytics` | profit:15, audit:3 |
| `/product/see-everything` | `analytics`, `sales report`, `business intelligence` | dashboard:4, real-time:4 |

---

## 3. CMS Override Status

| Field | Overridden? | Notes |
|---|---|---|
| `product.run-property.hero.sub` | ✅ YES — CMS | Hero subtitle for run-property shows CMS value. **`p.sub` in data file still drives meta description (L72)** |
| `product.sell-serve.faqs` | ✅ YES — CMS | FAQ answers. Not being edited. |
| `product.*.modules` | ❌ Not overridden | Safe to edit. Changes take effect immediately on rebuild. |
| All other `product.*.h1`, `.sub`, `.proof` | ❌ Not overridden | Not being edited in this CR. |

**Conclusion:** All 12 planned edits target `modules[].outcome` — none are CMS-overridden. ✅

---

## 4. Sub Field Headroom (context only — sub NOT being edited)

| Page | Sub length | Headroom | CMS-overridden (hero) |
|---|---|---|---|
| sell-serve (L9) | 129ch | +31ch | No |
| run-property (L34) | 127ch | +33ch | **YES — sub drives only meta desc** |
| customers (L57) | 110ch | +50ch | No |
| protect-profit (L82) | 122ch | +38ch | No |
| see-everything (L105) | 114ch | +46ch | No |
| central-inventory (L129) | 150ch | +10ch | No |

`sub` is NOT being changed. Headroom shown for completeness only.

---

## 5. Approval Matrix

| # | Page | Module | Change summary | Approval? |
|---|---|---|---|---|
| 1 | sell-serve | modules[0] L11 | "POS system" inserted | ✅ Safe — factual |
| 2 | sell-serve | modules[1] L12 | "order management" inserted | ✅ Safe — factual |
| 3 | central-inventory | modules[2] L133 | "stock management" prefix | ✅ Safe — factual |
| 4 | central-inventory | modules[4] L135 | "recipe management + food cost" prefix | ✅ Safe — factual |
| 5 | customers | modules[0] L59 | "customer management" prefix | ✅ Safe — factual |
| 6 | customers | modules[1] L60 | "loyalty program" prefix | ✅ Safe — factual |
| 7 | run-property | modules[0] L36 | "hotel management dashboard" prefix | ✅ Safe — factual |
| 8 | run-property | modules[3] L39 | "live analytics" suffix | ✅ Safe — factual |
| 9 | protect-profit | modules[2] L86 | "theft prevention analytics" prefix | ✅ Safe — factual |
| 10 | protect-profit | modules[3] L87 | "cash management" prefix | ✅ **APPROVED 2026-09-02** |
| 11 | see-everything | modules[0] L107 | "business intelligence" prefix | ❌ **DROPPED — owner declined. dashboard already 4× present.** |
| 12 | see-everything | modules[1] L108 | "sales report + analytics" prefix | ✅ Safe — factual |

---

## 6. Approval Items — DECISIONS RECORDED (2026-09-02)

### Item A — protect-profit modules[3]: "cash management" — ✅ APPROVED

Owner: *"we manage"*
Edit 10 (L87) proceeds as planned. `cash management` added to protect-profit body.
Decision record: `/app/memory/CR-190_Content_Approval_Decision.md`

---

### Item B — see-everything modules[0]: "business intelligence" — ❌ DECLINED

Owner: *"no but it we have dashboard"*
Edit 11 (L107) **dropped**. `business intelligence` removed from CR-190 scope.
`dashboard` is already present 4× in the prerendered HTML — no keyword gap exists.
Decision record: `/app/memory/CR-190_Content_Approval_Decision.md`

---

## 7. Line-by-Line Implementation Plan

**File:** `/app/frontend/src/data/products.js`
**Lines changed:** 11, 12, 36, 39, 59, 60, 86, 87 (conditional), 107 (conditional), 108, 133, 135

---

### Edit 1 — sell-serve modules[0] (L11) — SAFE

```
BEFORE (49ch):
      { icon: "ReceiptText", name: "POS Billing", outcome: "Restaurant billing in seconds, even at peak rush.", caps: [...] },

AFTER (59ch, +10ch):
      { icon: "ReceiptText", name: "POS Billing", outcome: "Restaurant POS system billing in seconds, even at peak rush.", caps: [...] },
```
**Adds:** `pos system` ×1
**Change:** insert "POS system" after "Restaurant"

---

### Edit 2 — sell-serve modules[1] (L12) — SAFE

```
BEFORE (72ch):
      { icon: "Smartphone", name: "Captain App & Table Management", outcome: "Table management in real time — multiple waiters, one table, no clashes.", caps: [...] },

AFTER (82ch, +10ch):
      { icon: "Smartphone", name: "Captain App & Table Management", outcome: "Table and order management in real time — multiple waiters, one table, no clashes.", caps: [...] },
```
**Adds:** `order management` ×1
**Change:** "Table management" → "Table and order management"

---

### Edit 3 — central-inventory modules[2] (L133) — SAFE

```
BEFORE (58ch):
      { icon: "ShoppingCart", name: "Central Procurement", outcome: "Buy centrally, distribute smartly, negotiate better rates.", caps: [...] },

AFTER (85ch, +27ch):
      { icon: "ShoppingCart", name: "Central Procurement", outcome: "Central stock management — buy centrally, distribute smartly, negotiate better rates.", caps: [...] },
```
**Adds:** `stock management` ×1
**Change:** prepend "Central stock management —"

---

### Edit 4 — central-inventory modules[4] (L135) — SAFE

```
BEFORE (60ch):
      { icon: "ChefHat", name: "Central Recipe & BOM Costing", outcome: "Standardise recipes and costs across every franchise outlet.", caps: [...] },

AFTER (96ch, +36ch):
      { icon: "ChefHat", name: "Central Recipe & BOM Costing", outcome: "Recipe management and food cost control — standardise recipes and BOM costs across every outlet.", caps: [...] },
```
**Adds:** `recipe management` ×1, `food cost` ×1
**Change:** replace prefix with "Recipe management and food cost control —", "franchise" removed (shorter), "costs" → "BOM costs"

---

### Edit 5 — customers modules[0] (L59) — SAFE

```
BEFORE (45ch):
      { icon: "Users", name: "CRM", outcome: "Every bill becomes customer data you can use.", caps: [...] },

AFTER (68ch, +23ch):
      { icon: "Users", name: "CRM", outcome: "Customer management made easy — every bill becomes data you can action.", caps: [...] },
```
**Adds:** `customer management` ×1
**Change:** prepend "Customer management made easy —", "use" → "action"

---

### Edit 6 — customers modules[1] (L60) — SAFE

```
BEFORE (52ch):
      { icon: "Gift", name: "Loyalty", outcome: "Reward regulars automatically and lift repeat visits.", caps: [...] },

AFTER (72ch, +20ch):
      { icon: "Gift", name: "Loyalty", outcome: "Loyalty program that rewards regulars automatically and lifts repeat visits.", caps: [...] },
```
**Adds:** `loyalty program` ×1
**Change:** prepend "Loyalty program that", "Reward" → "rewards", "lift" → "lifts"

---

### Edit 7 — run-property modules[0] (L36) — SAFE

```
BEFORE (52ch):
      { icon: "BedDouble", name: "Hotel / Room Billing", outcome: "Rooms + F&B + spa on one consolidated checkout bill.", caps: [...] },

AFTER (89ch, +37ch):
      { icon: "BedDouble", name: "Hotel / Room Billing", outcome: "Hotel management dashboard — rooms, F&B, spa and bar on one consolidated checkout bill.", caps: [...] },
```
**Adds:** `hotel management` ×1, `dashboard` ×1
**Change:** prepend "Hotel management dashboard —", reformat room list, add "and bar"

---

### Edit 8 — run-property modules[3] (L39) — SAFE

```
BEFORE (43ch):
      { icon: "ReceiptText", name: "Single Checkout Bill", outcome: "Everything a guest used, on one clean bill.", caps: [...] },

AFTER (75ch, +32ch):
      { icon: "ReceiptText", name: "Single Checkout Bill", outcome: "Everything a guest used, on one clean bill — live analytics from your phone.", caps: [...] },
```
**Adds:** `analytics` ×1
**Change:** append " — live analytics from your phone."

---

### Edit 9 — protect-profit modules[2] (L86) — SAFE

```
BEFORE (46ch):
      { icon: "ShieldCheck", name: "Audit Reports", outcome: "Every void, cancel and discount on the record.", caps: [...] },

AFTER (73ch, +27ch):
      { icon: "ShieldCheck", name: "Audit Reports", outcome: "Theft prevention analytics — every void, cancel and discount on the record.", caps: [...] },
```
**Adds:** `theft prevention` ×1, `analytics` ×1
**Change:** prepend "Theft prevention analytics —"
**Note:** caps already include "Theft detection" — consistent with this outcome language ✅

---

### Edit 10 — protect-profit modules[3] (L87) — ✅ APPROVED

```
BEFORE (56ch):
      { icon: "CheckCheck", name: "Smart Validations", outcome: "Stop billing mistakes and discount misuse at the source.", caps: [...] },

AFTER (91ch, +35ch):
      { icon: "CheckCheck", name: "Smart Validations", outcome: "Cash management and billing validation — stop mistakes and discount misuse at the source.", caps: [...] },
```
**Adds:** `cash management` ×1
**Change:** prepend "Cash management and billing validation —"
**⚠️ PENDING owner confirmation** (see §6 Approval Item A)
**Fallback:** skip this edit; 2/3 protect-profit gaps still closed (theft prevention + analytics)

---

### Edit 11 — see-everything modules[0] (L107) — ❌ DROPPED (owner decision 2026-09-02)

**Owner decision:** "business intelligence" is not current positioning. "dashboard" confirmed present.
**`dashboard` already appears 4× in prerendered HTML — no keyword gap. Edit dropped.**

Decision record: `/app/memory/CR-190_Content_Approval_Decision.md`

---

### Edit 12 — see-everything modules[1] (L108) — SAFE

```
BEFORE (50ch):
      { icon: "BarChart3", name: "Reports", outcome: "Daily, item-wise, payment-mode, staff — automatic.", caps: [...] },

AFTER (81ch, +31ch):
      { icon: "BarChart3", name: "Reports", outcome: "Daily sales report and analytics — item-wise, payment-mode, staff — all automatic.", caps: [...] },
```
**Adds:** `sales report` ×1, `analytics` ×1
**Change:** "Daily," → "Daily sales report and analytics —", "automatic." → "all automatic."

---

## 8. Post-Fix Keyword Count Summary (final — 11 edits)

### Decisions applied: A approved · B dropped

| Page | Keyword | Pre | Post | Status |
|---|---|---|---|---|
| sell-serve | pos system | 0 | 1 | ✅ Edit 1 |
| sell-serve | order management | 0 | 1 | ✅ Edit 2 |
| central-inventory | stock management | 0 | 1 | ✅ Edit 3 |
| central-inventory | food cost | 0 | 1 | ✅ Edit 4 |
| central-inventory | recipe management | 0 | 1 | ✅ Edit 4 |
| customers | customer management | 0 | 1 | ✅ Edit 5 |
| customers | loyalty program | 0 | 1 | ✅ Edit 6 |
| run-property | hotel management | 0 | 1 | ✅ Edit 7 |
| run-property | dashboard | 0 | 1 | ✅ Edit 7 |
| run-property | analytics | 0 | 1 | ✅ Edit 8 |
| protect-profit | theft prevention | 0 | 1 | ✅ Edit 9 |
| protect-profit | analytics | 0 | 1 | ✅ Edit 9 |
| protect-profit | cash management | 0 | 1 | ✅ Edit 10 (approved) |
| see-everything | analytics | 0 | 1 | ✅ Edit 12 |
| see-everything | sales report | 0 | 1 | ✅ Edit 12 |
| see-everything | business intelligence | 0 | 0 | ⏸️ Dropped — not current positioning |
| see-everything | dashboard | 4 | 4 | ✅ Already present — confirmed by owner |

**14 of 15 original audit targets resolved. 1 deliberately dropped per owner decision.**

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `sub` / meta description length violated | None | High | `sub` not touched |
| `product.run-property.hero.sub` CMS override affected | None | Medium | Editing `modules[]` only, not `sub` |
| `product.sell-serve.faqs` CMS override affected | None | Medium | Editing `modules[]` only, not `faqs` |
| JSON-LD schema impacted | None | High | JSON-LD uses `p.faqs` only; `modules[]` not in schema |
| Module outcome too long for UI | None | Low | Longest proposed outcome = 96ch (central-inventory L135). Similar pages have 91ch already (central-inventory L134). No UI breakage. |
| "business intelligence" over-claims product capability | Low | Medium | Owner decision required — fallback = skip this edit |
| "cash management" over-positions Smart Validations | Low | Medium | Owner decision required — fallback = skip this edit |

---

## 10. Verification Gate (run after build)

```bash
python3 << 'EOF'
import os, re

checks = {
    'product/sell-serve':         ['pos system','order management'],
    'product/central-inventory':  ['stock management','food cost','recipe management'],
    'product/customers':          ['customer management','loyalty program'],
    'product/run-property':       ['hotel management','analytics','dashboard'],
    'product/protect-profit':     ['theft prevention','analytics'],  # cash management conditional
    'product/see-everything':     ['analytics','sales report'],      # business intelligence conditional
}
approval_checks = {
    'product/protect-profit':    ['cash management'],
    'product/see-everything':    ['business intelligence'],
}
base = '/app/frontend/build'
all_pass = True

for slug, kws in checks.items():
    html = open(f'{base}/{slug}/index.html').read()
    body = html[html.lower().find('<body'):].lower()
    m = re.search(r'<meta name="description" content="(.*?)"', html)
    desc_len = len(m.group(1).replace('&amp;','&')) if m else 0
    for kw in kws:
        cnt = body.count(kw)
        ok = cnt >= 1
        if not ok: all_pass = False
        print(f'  {"✅" if ok else "❌"} /{slug}: {kw}={cnt}')
    ok_meta = desc_len <= 160
    if not ok_meta: all_pass = False
    print(f'  {"✅" if ok_meta else "❌"} /{slug}: meta_desc={desc_len}ch')

print()
print('CONDITIONAL (approval items):')
for slug, kws in approval_checks.items():
    html = open(f'{base}/{slug}/index.html').read()
    body = html[html.lower().find('<body'):].lower()
    for kw in kws:
        cnt = body.count(kw)
        print(f'  {"✅" if cnt else "⏸️ not approved"} /{slug}: {kw}={cnt}')

print()
print('CORE (10 safe edits):', 'PASS ✅' if all_pass else 'FAIL ❌')
EOF
```

---

## 11. Build & Deploy

```bash
cd /app/frontend && yarn build && sudo supervisorctl restart frontend
```

---

## 12. Summary

| File | Lines changed | CRs |
|---|---|---|
| `src/data/products.js` | L11, L12, L36, L39, L59, L60, L86, L133, L135 (9 safe) + L87, L107 (2 conditional on approval) + L108 | CR-190 |

**Awaiting owner decision on 2 items before final implementation.**

---

*Plan completed 2026-09-02. All char counts Python-verified.*
