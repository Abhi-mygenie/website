# CR-187 + CR-189 — Combined Line-by-Line Implementation Plan
# File: `src/data/sectors.js` — 16 edits total, one build cycle

**Date:** 2026-09-02
**Status:** READY TO IMPLEMENT
**Author:** E1 Agent
**All char counts:** Python-verified

---

## 1. Why One Plan, One Build

Both CRs touch the same file (`sectors.js`) and have no conflicts:
- **CR-187** edits the `h1` field of 8 sectors — puts keywords in the page heading (highest Google weight)
- **CR-189** edits `solutions[].desc` fields of 6 sectors — adds keyword density in body copy cards

Implementing together saves one full build cycle (~3 min) and produces stronger keyword density than either CR alone.

---

## 2. Constraints (confirmed)

| Constraint | Status |
|---|---|
| `sub` field is NOT touched (CR-181: meta desc dual-use, ≤160ch on all pages) | ✅ Preserved |
| `h1` is NOT CMS-overridden on any sector | ✅ Safe to edit |
| `solutions[]` is NOT CMS-overridden on any sector (`sector.*.faqs` is the only CMS override) | ✅ Safe to edit |
| JSON-LD schemas use `s.faqs` and `s.name` only — no h1 or solutions | ✅ Not affected |
| Meta title formula (`${s.name} POS System & Billing Software | MyGenie`) unchanged | ✅ Not affected |

---

## 3. Master Edit Table (all 16 edits, in line order)

| # | CR | Line | Field | Sector | Keywords Added |
|---|---|---|---|---|---|
| 1 | 187 | L9 | h1 | restaurants | billing software |
| 2 | 189 | L20 | solutions[2].desc | restaurants | inventory management |
| 3 | 187 | L38 | h1 | cafes | billing software |
| 4 | 189 | L47 | solutions[0].desc | cafes | cafe pos |
| 5 | 189 | L48 | solutions[1].desc | cafes | table management |
| 6 | 187 | L67 | h1 | qsr | billing software, pos system |
| 7 | 189 | L77 | solutions[1].desc | qsr | qr menu, quick service |
| 8 | 187 | L96 | h1 | cloud-kitchens | billing software, pos system |
| 9 | 187 | L125 | h1 | hotels-resorts | billing software |
| 10 | 189 | L134 | solutions[0].desc | hotels-resorts | hotel billing |
| 11 | 189 | L137 | solutions[3].desc | hotels-resorts | hotel management, property management |
| 12 | 187 | L154 | h1 | food-courts | billing software, pos system |
| 13 | 187 | L183 | h1 | canteens | billing software, pos system |
| 14 | 189 | L192 | solutions[0].desc | canteens | canteen pos |
| 15 | 187 | L212 | h1 | chains | billing software, pos system |
| 16 | 189 | L224 | solutions[3].desc | chains | multi-location, chain pos |

**File:** `/app/frontend/src/data/sectors.js`
**Total lines changed:** 16 out of 327
**Lines unchanged:** 311

---

## 4. Edit-by-Edit — Exact BEFORE / AFTER

---

### Edit 1 — CR-187 — restaurants h1 (L9)

```
BEFORE (101ch):
    h1: "Restaurant POS system — table management made easy, faster restaurant billing, more profit per cover.",

AFTER (120ch, +19ch):
    h1: "Restaurant POS system & billing software — table management made easy, faster restaurant billing, more profit per cover.",
```

**Change:** insert `& billing software` after `POS system`
**Adds:** `billing software` ×1  |  `pos system` already present (unchanged)

---

### Edit 2 — CR-189 — restaurants solutions[2].desc (L20)

```
BEFORE (83ch):
      { icon: "TrendingUp", title: "Recipe-level P&L", desc: "Restaurant management reporting — profit by item and table, optimized by the rupee." },

AFTER (106ch, +23ch):
      { icon: "TrendingUp", title: "Recipe-level P&L", desc: "Restaurant management reporting and ingredient inventory management — exact food cost and profit per dish." },
```

**Change:** extend desc to include "inventory management" naturally alongside "restaurant management reporting"
**Adds:** `inventory management` ×1
**Preserves:** `restaurant management` still present in the field ✅

---

### Edit 3 — CR-187 — cafes h1 (L38)

```
BEFORE (75ch):
    h1: "Café POS system — protect every margin and turn first-timers into regulars.",

AFTER (94ch, +19ch):
    h1: "Café POS system & billing software — protect every margin and turn first-timers into regulars.",
```

**Change:** insert `& billing software` after `POS system`
**Adds:** `billing software` ×1  |  `pos system` already present (unchanged)

---

### Edit 4 — CR-189 — cafes solutions[0].desc (L47)

```
BEFORE (93ch):
      { icon: "Smartphone", title: "Mobile-first billing", desc: "Run on a few phones with QR menu ordering — no expensive hardware. Go live in under 48 hours." },

AFTER (103ch, +10ch):
      { icon: "Smartphone", title: "Mobile-first billing", desc: "Run your cafe POS on a few phones — QR menu ordering, no expensive hardware. Go live in under 48 hours." },
```

**Change:** insert `your cafe POS` after `Run` (replaces `on a few phones with` → `your cafe POS on a few phones —`, reorders clause)
**Adds:** `cafe pos` ×1

---

### Edit 5 — CR-189 — cafes solutions[1].desc (L48)

```
BEFORE (57ch):
      { icon: "Boxes", title: "Recipe & inventory management", desc: "Track every gram and cut wastage before it hits your P&L." },

AFTER (101ch, +44ch):
      { icon: "Boxes", title: "Recipe & inventory management", desc: "Table management and recipe-level tracking — every gram counted, wastage cut before it hits your P&L." },
```

**Change:** replace "Track every gram and cut wastage before it hits your P&L." with an expanded desc
**Adds:** `table management` ×1
**Note:** The card title "Recipe & inventory management" is unchanged. The new desc leads with table management (the missing keyword) then connects naturally to the recipe/inventory theme.

---

### Edit 6 — CR-187 — qsr h1 (L67)

```
BEFORE (75ch):
    h1: "QSR POS & billing — more covers per hour and every cash drawer locked down.",

AFTER (91ch, +16ch):
    h1: "QSR POS system & billing software — more covers per hour and every cash drawer locked down.",
```

**Change:** `POS &` → `POS system &`  AND  `billing —` → `billing software —`
**Adds:** `billing software` ×1, `pos system` ×1

---

### Edit 7 — CR-189 — qsr solutions[1].desc (L77)

```
BEFORE (57ch):
      { icon: "QrCode", title: "Scan & Order", desc: "Guests order from their phone — fewer staff, faster flow." },

AFTER (93ch, +36ch):
      { icon: "QrCode", title: "Scan & Order", desc: "Guests scan the QR menu and order from their phone — quick service, fewer staff, faster flow." },
```

**Change:** expand from "Guests order from their phone" → "Guests scan the QR menu and order from their phone — quick service, fewer staff, faster flow."
**Adds:** `qr menu` ×1, `quick service` ×1

---

### Edit 8 — CR-187 — cloud-kitchens h1 (L96)

```
BEFORE (98ch):
    h1: "Cloud kitchen POS & inventory management — every food business brand and aggregator on one screen.",

AFTER (101ch, +3ch):
    h1: "Cloud kitchen POS system & billing software — every food business brand and aggregator on one screen.",
```

**Change:** `POS & inventory management —` → `POS system & billing software —`
**Adds:** `billing software` ×1, `pos system` ×1
**Removes from h1 only:** "inventory management" — remains 5× elsewhere on the page (sub, pains[2], solutions[2].title, solutions[2].desc, faqs[2].a)

---

### Edit 9 — CR-187 — hotels-resorts h1 (L125)

```
BEFORE (81ch):
    h1: "Hotel POS system — rooms, restaurant, spa and bar on one app. Works even offline.",

AFTER (100ch, +19ch):
    h1: "Hotel POS system & billing software — rooms, restaurant, spa and bar on one app. Works even offline.",
```

**Change:** insert `& billing software` after `POS system`
**Adds:** `billing software` ×1  |  `pos system` already present (unchanged)

---

### Edit 10 — CR-189 — hotels-resorts solutions[0].desc (L134)

```
BEFORE (58ch):
      { icon: "BedDouble", title: "Hotel / room billing", desc: "One consolidated bill at checkout across every department." },

AFTER (102ch, +44ch):
      { icon: "BedDouble", title: "Hotel / room billing", desc: "Hotel billing software generates one consolidated checkout bill across rooms, restaurant, spa and bar." },
```

**Change:** replace generic desc with one that leads with "hotel billing software"
**Adds:** `hotel billing` ×1

---

### Edit 11 — CR-189 — hotels-resorts solutions[3].desc (L137)

```
BEFORE (48ch):
      { icon: "LayoutDashboard", title: "Owner dashboard", desc: "See rooms, F&B and services live, from anywhere." },

AFTER (105ch, +57ch):
      { icon: "LayoutDashboard", title: "Owner dashboard", desc: "Hotel management and property management dashboard — see rooms, F&B and all services live, from anywhere." },
```

**Change:** expand desc to lead with "hotel management and property management dashboard"
**Adds:** `hotel management` ×1, `property management` ×1

---

### Edit 12 — CR-187 — food-courts h1 (L154)

```
BEFORE (81ch):
    h1: "Food court POS — one shared wallet, many counters, zero reconciliation headaches.",

AFTER (107ch, +26ch):
    h1: "Food court POS system & billing software — one shared wallet, many counters, zero reconciliation headaches.",
```

**Change:** `POS —` → `POS system & billing software —`
**Adds:** `billing software` ×1, `pos system` ×1

---

### Edit 13 — CR-187 — canteens h1 (L183)

```
BEFORE (86ch):
    h1: "Canteen management software — prepaid, subsidized and fully accountable. Zero leakage.",

AFTER (96ch, +10ch):
    h1: "Canteen POS system & billing software — prepaid, subsidized and fully accountable. Zero leakage.",
```

**Change:** `Canteen management software —` → `Canteen POS system & billing software —`
**Adds:** `billing software` ×1, `pos system` ×1
**Note:** "management software" positioning replaced by the keyword-specific phrasing. The value prop ("prepaid, subsidized, fully accountable") is unchanged.

---

### Edit 14 — CR-189 — canteens solutions[0].desc (L192)

```
BEFORE (48ch):
      { icon: "Wallet", title: "Wallet & prepaid", desc: "Load balances and deduct per meal automatically." },

AFTER (98ch, +50ch):
      { icon: "Wallet", title: "Wallet & prepaid", desc: "Canteen POS loads wallet balances and deducts per meal automatically — zero errors, zero disputes." },
```

**Change:** expand desc to lead with "Canteen POS" and extend with outcome language
**Adds:** `canteen pos` ×1

---

### Edit 15 — CR-187 — chains h1 (L212)

```
BEFORE (83ch):
    h1: "Multi-outlet POS for chains & franchises — control every outlet from one dashboard.",

AFTER (109ch, +26ch):
    h1: "Multi-outlet POS system & billing software for chains & franchises — control every outlet from one dashboard.",
```

**Change:** `POS for` → `POS system & billing software for`
**Adds:** `billing software` ×1, `pos system` ×1

---

### Edit 16 — CR-189 — chains solutions[3].desc (L224)

```
BEFORE (46ch):
      { icon: "LayoutDashboard", title: "Multi-outlet dashboard", desc: "Every outlet's performance, live, in one view." },

AFTER (83ch, +37ch):
      { icon: "LayoutDashboard", title: "Multi-outlet dashboard", desc: "Multi-location chain POS dashboard — every outlet's performance, live, in one view." },
```

**Change:** expand desc to lead with "Multi-location chain POS dashboard"
**Adds:** `multi-location` ×1, `chain pos` ×1

---

## 5. Post-Fix Keyword Count Summary (projected)

| Page | billing_sw | pos_sys | Inventory mgmt | cafe pos | table mgmt | qr menu | quick svc | hotel billing | hotel mgmt | prop mgmt | canteen pos | chain pos | multi-loc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| restaurants | 0→**1** | 1→1 | 0→**1** | — | 2→2 | — | — | — | — | — | — | — | — |
| cafes | 0→**1** | 1→1 | — | 0→**1** | 0→**1** | — | — | — | — | — | — | — | — |
| qsr | 0→**1** | 0→**1** | — | — | — | 0→**1** | 0→**1** | — | — | — | — | — | — |
| cloud-kitchens | 0→**1** | 0→**1** | 3→3 | — | — | — | — | — | — | — | — | — | — |
| hotels-resorts | 0→**1** | 1→1 | — | — | — | — | — | 0→**1** | 0→**1** | 0→**1** | — | — | — |
| food-courts | 0→**1** | 0→**1** | — | — | — | — | — | — | — | — | — | — | — |
| canteens | 0→**1** | 0→**1** | — | — | — | — | — | — | — | — | 0→**1** | — | — |
| chains | 0→**1** | 0→**1** | — | — | — | — | — | — | — | — | — | 0→**1** | 0→**1** |

All cells marked **1** confirm each keyword reaches ≥1 body occurrence. ✅

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `sub` meta description exceeds 160ch | None | High | `sub` not touched on any sector |
| CMS overrides h1 or solutions | None | High | Confirmed NOT in CMS override list |
| JSON-LD schema impacted | None | High | Schemas use `s.faqs` and `s.name` only |
| "inventory management" disappears from cloud-kitchens page | None | Medium | Remains 5× in sub/pains/solutions/faqs |
| Solutions card desc becomes too long | None | Low | Longest desc = 106ch (hotels-resorts solutions[3]: 105ch). No strict length limit on card descs. |
| h1 keyword-stuffed | Low | Low | All follow standard "X system & Y software" SaaS phrasing |
| Canteens "management software" removed from h1 | Low | Low | Concept covered in solutions and pains cards |

---

## 7. Combined Verification Gate

Run after build to confirm all 16 keyword targets are met:

```bash
python3 << 'EOF'
import os, re

checks = {
    'solutions/restaurants':    ['billing software','pos system','inventory management'],
    'solutions/cafes':          ['billing software','pos system','cafe pos','table management'],
    'solutions/cloud-kitchens': ['billing software','pos system'],
    'solutions/qsr':            ['billing software','pos system','qr menu','quick service'],
    'solutions/hotels-resorts': ['billing software','pos system','hotel billing','hotel management','property management'],
    'solutions/food-courts':    ['billing software','pos system'],
    'solutions/canteens':       ['billing software','pos system','canteen pos'],
    'solutions/chains':         ['billing software','pos system','chain pos','multi-location'],
}
base = '/app/frontend/build'
all_pass = True

for slug, kws in checks.items():
    html = open(f'{base}/{slug}/index.html').read()
    body = html[html.lower().find('<body'):].lower()
    # Also check meta desc still ≤160ch
    m = re.search(r'<meta name="description" content="(.*?)"', html)
    desc_len = len(m.group(1).replace('&amp;','&')) if m else 0
    for kw in kws:
        cnt = body.count(kw)
        ok = cnt >= 1
        if not ok: all_pass = False
        print(f'  {"✅" if ok else "❌"} /{slug}: {kw}={cnt}')
    meta_ok = desc_len <= 160
    if not meta_ok: all_pass = False
    print(f'  {"✅" if meta_ok else "❌"} /{slug}: meta_desc={desc_len}ch')
    print()

print('OVERALL:', 'PASS ✅' if all_pass else 'FAIL ❌')
EOF
```

**Expected:** Every keyword check = 1+, every meta desc = ≤160ch.

---

## 8. Build & Deploy

```bash
cd /app/frontend && yarn build && sudo supervisorctl restart frontend
```

Build time: ~3 minutes.

---

## 9. Files Summary

| File | Lines changed | Lines unchanged | CRs |
|---|---|---|---|
| `src/data/sectors.js` | **16** (L9, L20, L38, L47, L48, L67, L77, L96, L125, L134, L137, L154, L183, L192, L212, L224) | 311 | CR-187 (8 h1) + CR-189 (8 solutions desc) |

**Zero other files changed.**

---

*Plan finalised 2026-09-02. All char counts and keyword checks Python-verified. Ready to implement.*
