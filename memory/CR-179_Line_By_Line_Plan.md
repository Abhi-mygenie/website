# CR-179 — Line-by-Line Implementation Plan
## Solution & Product Page Keyword Density (28 Approved Copy Changes)

**Plan written:** 2026-09-01 — Planning Agent
**Impact analysis:** `/app/memory/CR-179_ImpactAnalysis.md`
**Approval decision:** `/app/memory/CR-179_Content_Approval_Decision.md`
**Status:** READY — all 28 proposals approved. Awaiting "go ahead".
**Files touched:** 2 (`src/data/sectors.js`, `src/data/products.js`)
**Rebuild required:** ✅ Yes — `yarn build` + `prerender.js` (57 routes) + frontend restart

---

## CRITICAL — Do Not Change

- `SectorPage.jsx` and `ProductPage.jsx` — template files. ZERO changes.
- `s.faqs` and `p.faqs` arrays in data files — CMS-overridden. Changes would be silently ignored anyway, but DO NOT touch them.
- Testimonial quotes in `proof` arrays — attributed to real clients. NOT touched.
- All sector/product pages NOT in the 5 target pages (hotels-resorts, chains, qsr, food-courts, canteens, bars-pubs, bakeries, ice-cream-desserts, run-property, protect-profit, see-everything, customers) — NOT touched.

---

## Pre-flight Checklist

```bash
# A. Services running
sudo supervisorctl status
# Expected: backend RUNNING, frontend RUNNING

# B. Confirm zero occurrences of target keywords in the 5 pages
python3 << 'PYEOF'
import re
from pathlib import Path
build = Path("/app/frontend/build")
checks = {
    "solutions/restaurants": ["restaurant billing","restaurant management","table management","qr menu"],
    "solutions/cafes":       ["inventory management","qr menu","crm"],
    "solutions/cloud-kitchens": ["inventory management","food business"],
    "product/sell-serve":    ["table management","qr menu","pos billing","restaurant billing"],
    "product/central-inventory": ["restaurant inventory","inventory management","pos system"],
}
for slug, kws in checks.items():
    html = (build / slug / "index.html").read_text(errors="ignore").lower()
    for kw in kws:
        c = len(re.findall(kw, html))
        print(f"  {c}x  {kw}  /{slug}")
PYEOF
# Expected: all show 0x (except inventory management on central-inventory = 1x)

# C. Spot-check key lines before editing
sed -n '9p'  /app/frontend/src/data/sectors.js   # restaurants h1
sed -n '8p'  /app/frontend/src/data/products.js  # sell-serve h1
sed -n '128p' /app/frontend/src/data/products.js # central-inventory h1
```

---

## Execution Order

```
STEP 1 → Edit src/data/sectors.js   (15 changes — P1–P15)
STEP 2 → Edit src/data/products.js  (13 changes — P16–P28)
STEP 3 → yarn build
STEP 4 → node scripts/prerender.js
STEP 5 → supervisorctl restart frontend
STEP 6 → Verify (3 gates)
```

Steps 1 and 2 are independent — can run in parallel.
Steps 3–6 must run in sequence.

---

## STEP 1 — `src/data/sectors.js` (P1–P15)

**Total lines:** 327

---

### P1 — Line 9: /solutions/restaurants H1

**Current:**
```js
    h1: "Restaurant POS software — faster tables, fewer errors, more profit per cover.",
```
**After:**
```js
    h1: "Restaurant POS system — table management made easy, faster restaurant billing, more profit per cover.",
```
Keywords added: **table management** ×1, **restaurant billing** ×1

---

### P2 — Line 10: /solutions/restaurants subtitle

**Current:**
```js
    sub: "From the captain's tab to the kitchen screen to your owner dashboard, MyGenie runs your whole dining room — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.",
```
**After:**
```js
    sub: "From QR menu ordering to the kitchen screen to your owner dashboard, MyGenie covers your whole restaurant management — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.",
```
Keywords added: **qr menu** ×1, **restaurant management** ×1

---

### P3 — Line 13: /solutions/restaurants pains[1].desc (Order errors & lost chits)

**Current:**
```js
      { title: "Order errors & lost chits", desc: "Handwritten KOTs get lost or misread — wrong dishes and wasted food." },
```
**After:**
```js
      { title: "Order errors & lost chits", desc: "Slow restaurant billing and handwritten KOTs create errors — wrong dishes, wrong charges, wasted food." },
```
Keywords added: **restaurant billing** ×1

---

### P4 — Line 18: /solutions/restaurants solutions[0].desc (Captain App)

**Current:**
```js
      { icon: "Smartphone", title: "Captain App", desc: "Multiple waiters take orders at the same table, in real time — no clashes, no delays." },
```
**After:**
```js
      { icon: "Smartphone", title: "Captain App", desc: "Table management in real time — multiple waiters, one table, no clashes, no delays." },
```
Keywords added: **table management** ×1

---

### P5 — Line 19: /solutions/restaurants solutions[1].desc (KOT/KDS)

**Current:**
```js
      { icon: "Flame", title: "KOT / KDS", desc: "Orders hit the kitchen screen instantly. No lost chits, no shouting." },
```
**After:**
```js
      { icon: "Flame", title: "KOT / KDS", desc: "From QR menu scan to kitchen screen instantly. No lost chits, no shouting." },
```
Keywords added: **qr menu** ×1

---

### P6 — Line 20: /solutions/restaurants solutions[2].desc (Recipe-level P&L)

**Current:**
```js
      { icon: "TrendingUp", title: "Recipe-level P&L", desc: "See profit by item and by table — optimize your menu by the rupee." },
```
**After:**
```js
      { icon: "TrendingUp", title: "Recipe-level P&L", desc: "Restaurant management reporting — profit by item and table, optimized by the rupee." },
```
Keywords added: **restaurant management** ×1

**Checkpoint after P1–P6 (hot-reload):**
- `/solutions/restaurants` H1 reads: "Restaurant POS system — table management made easy..."
- Pain card 1 text contains "restaurant billing"
- Captain App solution card contains "Table management in real time"

---

### P7 — Line 39: /solutions/cafes sub

**Current:**
```js
    sub: "Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, ingredient-level control, and a built-in repeat-customer engine.",
```
**After:**
```js
    sub: "Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, QR menu ordering, and ingredient-level inventory management — plus a built-in CRM to bring guests back.",
```
Keywords added: **qr menu** ×1, **inventory management** ×1, **crm** ×1

---

### P8 — Line 41: /solutions/cafes pains[0].desc (Thin margins, hidden waste)

**Current:**
```js
      { title: "Thin margins, hidden waste", desc: "Ingredients spoil or over-portion before they ever become profit." },
```
**After:**
```js
      { title: "Thin margins, hidden waste", desc: "Without inventory management, ingredients spoil or over-portion before they become profit." },
```
Keywords added: **inventory management** ×1

---

### P9 — Line 48: /solutions/cafes solutions[1].title (Recipe & inventory)

**Current:**
```js
      { icon: "Boxes", title: "Recipe & inventory control", desc: "Track every gram and cut wastage before it hits your P&L." },
```
**After:**
```js
      { icon: "Boxes", title: "Recipe & inventory management", desc: "Track every gram and cut wastage before it hits your P&L." },
```
Keywords added: **inventory management** ×1

---

### P10 — Line 49: /solutions/cafes solutions[2].title (Loyalty + WhatsApp)

**Current title part of:**
```js
      { icon: "Gift", title: "Loyalty + WhatsApp", desc: "Reward regulars and bring guests back automatically." },
```
**After:**
```js
      { icon: "Gift", title: "CRM, Loyalty & WhatsApp", desc: "Built-in CRM rewards regulars and brings guests back automatically." },
```
Keywords added: **crm** ×2 (in both title and desc — covers P10 and P11 in one edit)

Note: P10 and P11 are on the same line. Combining them into a single edit.

---

### P12 — Line 47: /solutions/cafes solutions[0].desc (Mobile-first billing)

**Current:**
```js
      { icon: "Smartphone", title: "Mobile-first billing", desc: "Run on a few phones — no expensive hardware. Go live in under 48 hours." },
```
**After:**
```js
      { icon: "Smartphone", title: "Mobile-first billing", desc: "Run on a few phones with QR menu ordering — no expensive hardware. Go live in under 48 hours." },
```
Keywords added: **qr menu** ×1

**Checkpoint after P7–P12 (hot-reload):**
- `/solutions/cafes` subtitle contains "QR menu ordering", "inventory management", "CRM"
- Loyalty solution card title reads "CRM, Loyalty & WhatsApp"
- Mobile billing card desc contains "QR menu ordering"

---

### P13 — Line 96: /solutions/cloud-kitchens h1

**Current:**
```js
    h1: "Cloud kitchen POS — every brand and aggregator on one screen, one inventory.",
```
**After:**
```js
    h1: "Cloud kitchen POS & inventory management — every food business brand and aggregator on one screen.",
```
Keywords added: **inventory management** ×1, **food business** ×1

---

### P14 — Line 97: /solutions/cloud-kitchens sub

**Current:**
```js
    sub: "Juggling Swiggy, Zomato and multiple brands shouldn't mean five tablets and a spreadsheet. MyGenie unifies it all into one backend.",
```
**After:**
```js
    sub: "Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies your inventory management and every brand into one backend.",
```
Keywords added: **food business** ×1, **inventory management** ×1

---

### P15 — Line 107: /solutions/cloud-kitchens solutions[2].title (Central inventory)

**Current:**
```js
      { icon: "Boxes", title: "Central inventory", desc: "One shared stock source of truth across all brands." },
```
**After:**
```js
      { icon: "Boxes", title: "Central inventory management", desc: "One shared stock source of truth across all brands." },
```
Keywords added: **inventory management** ×1

**Checkpoint after P13–P15 (hot-reload):**
- `/solutions/cloud-kitchens` H1 contains "inventory management" and "food business"
- Solution card reads "Central inventory management"

---

## STEP 2 — `src/data/products.js` (P16–P28)

**Total lines:** 152

---

### P16 — Line 8: /product/sell-serve h1

**Current:**
```js
    h1: "Restaurant POS & billing software — bill in seconds, serve more covers, lose zero orders.",
```
**After:**
```js
    h1: "Restaurant POS & billing software — fast restaurant billing, table management built in, lose zero orders.",
```
Keywords added: **restaurant billing** ×1, **table management** ×1

---

### P17 — Line 9: /product/sell-serve sub

**Current:**
```js
    sub: "From the counter to the captain's tab to the kitchen screen, MyGenie keeps service fast and flawless at every rush.",
```
**After:**
```js
    sub: "From POS billing at the counter to QR menu ordering to the kitchen screen, MyGenie keeps service fast and flawless at every rush.",
```
Keywords added: **pos billing** ×1, **qr menu** ×1

---

### P18 + P19 — Line 11: /product/sell-serve modules[0] name + outcome

**Current:**
```js
      { icon: "ReceiptText", name: "POS / Billing", outcome: "Bill in seconds, even at peak rush.", caps: [...] },
```
**After:**
```js
      { icon: "ReceiptText", name: "POS Billing", outcome: "Restaurant billing in seconds, even at peak rush.", caps: [...] },
```
Keywords added: **pos billing** ×1 (name), **restaurant billing** ×1 (outcome)

---

### P20 + P21 — Line 12: /product/sell-serve modules[1] name + outcome

**Current:**
```js
      { icon: "Smartphone", name: "Captain / Waiter App", outcome: "Take orders tableside — multiple waiters, one table, no clashes.", caps: [...] },
```
**After:**
```js
      { icon: "Smartphone", name: "Captain App & Table Management", outcome: "Table management in real time — multiple waiters, one table, no clashes.", caps: [...] },
```
Keywords added: **table management** ×2 (in both name and outcome)

---

### P22 + P23 — Line 14: /product/sell-serve modules[3] name + outcome

**Current:**
```js
      { icon: "QrCode", name: "Scan & Order", outcome: "Guests scan, order and pay from their phone.", caps: [...] },
```
**After:**
```js
      { icon: "QrCode", name: "QR Menu & Scan Order", outcome: "QR menu — guests scan, order and pay from their phone.", caps: [...] },
```
Keywords added: **qr menu** ×2 (in both name and outcome)

**Checkpoint after P16–P23 (hot-reload):**
- `/product/sell-serve` H1: "fast restaurant billing, table management built in"
- Sub: "From POS billing at the counter to QR menu ordering"
- Module 0: "POS Billing" / "Restaurant billing in seconds"
- Module 1: "Captain App & Table Management" / "Table management in real time"
- Module 3: "QR Menu & Scan Order" / "QR menu — guests scan..."

---

### P24 — Line 128: /product/central-inventory h1

**Current:**
```js
    h1: "Central inventory management for chains — one stock source of truth across all your outlets.",
```
**After:**
```js
    h1: "Central restaurant inventory management — one stock source of truth across all your outlets.",
```
Keywords added: **restaurant inventory** ×1 (phrase "restaurant inventory management" also contains inventory management ×1)

---

### P25 — Line 129: /product/central-inventory sub (UPDATED — includes pos system)

**Current:**
```js
    sub: "Stop managing each outlet's stock in silos. MyGenie gives multi-outlet businesses one central source of truth — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.",
```
**After:**
```js
    sub: "Stop managing restaurant inventory in silos. MyGenie connects your POS system to a central inventory management hub — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.",
```
Keywords added: **restaurant inventory** ×1, **pos system** ×1, **inventory management** ×1

---

### P26 — Line 131: /product/central-inventory modules[0].outcome (Multi-Outlet Stock Visibility)

**Current:**
```js
      { icon: "Network", name: "Multi-Outlet Stock Visibility", outcome: "See live stock across every outlet from one dashboard.", caps: [...] },
```
**After:**
```js
      { icon: "Network", name: "Multi-Outlet Stock Visibility", outcome: "Inventory management across every outlet — live stock, one dashboard.", caps: [...] },
```
Keywords added: **inventory management** ×1

---

### P27 — Line 134: /product/central-inventory modules[3].outcome (AI Auto-Reorder)

**Current:**
```js
      { icon: "Sparkles", name: "AI Auto-Reorder & Forecast", outcome: "AI predicts demand and suggests what to reorder, per outlet.", caps: [...] },
```
**After:**
```js
      { icon: "Sparkles", name: "AI Auto-Reorder & Forecast", outcome: "AI-powered inventory management — predicts demand and suggests what to reorder, per outlet.", caps: [...] },
```
Keywords added: **inventory management** ×1

---

### P28 — Line 132: /product/central-inventory modules[1].outcome (Inter-Outlet Transfers)

**Current:**
```js
      { icon: "ArrowLeftRight", name: "Inter-Outlet Transfers", outcome: "Move stock between outlets in a tap — fully tracked.", caps: [...] },
```
**After:**
```js
      { icon: "ArrowLeftRight", name: "Inter-Outlet Transfers", outcome: "Inventory management transfers — move stock between outlets in a tap, fully tracked.", caps: [...] },
```
Keywords added: **inventory management** ×1 (5th occurrence on the page)

**Checkpoint after P24–P28 (hot-reload):**
- `/product/central-inventory` H1: "Central restaurant inventory management"
- Sub contains "POS system" and "inventory management hub" and "restaurant inventory"
- Module outcomes contain "inventory management" multiple times

---

## STEP 3 — `yarn build`

```bash
cd /app/frontend && npx craco build 2>&1 | tail -8
# Expected: "The build folder is ready to be deployed. Done in XX.XXs."
```

If syntax errors: check sectors.js and products.js for unclosed strings or missing commas.

---

## STEP 4 — `node scripts/prerender.js`

```bash
cd /app/frontend && node scripts/prerender.js > /app/frontend/prerender_cr179.log 2>&1 &
# Monitor: sleep 40 && tail -8 /app/frontend/prerender_cr179.log
# Expected last line: "prerendered /thank-you -> ..."
# Expected line count: 63
```

---

## STEP 5 — Restart

```bash
sudo supervisorctl restart frontend && sleep 3 && sudo supervisorctl status frontend
```

---

## STEP 6 — Verification Gates

### Gate A — All keyword gaps resolved

```bash
python3 << 'PYEOF'
import re
from pathlib import Path
build = Path("/app/frontend/build")
checks = {
    "solutions/restaurants": {
        "restaurant billing": 2,
        "restaurant management": 2,
        "table management": 2,
        "qr menu": 2,
    },
    "solutions/cafes": {
        "inventory management": 2,
        "qr menu": 2,
        "crm": 2,
    },
    "solutions/cloud-kitchens": {
        "inventory management": 3,
        "food business": 2,
    },
    "product/sell-serve": {
        "restaurant billing": 2,
        "pos billing": 2,
        "table management": 2,
        "qr menu": 2,
    },
    "product/central-inventory": {
        "restaurant inventory": 1,
        "inventory management": 5,
        "pos system": 1,
    },
}
all_pass = True
for slug, kws in checks.items():
    html = (build / slug / "index.html").read_text(errors="ignore").lower()
    for kw, needed in kws.items():
        count = len(re.findall(kw, html))
        ok = count >= needed
        print(f"{'PASS' if ok else 'FAIL'}  {count}x  {kw}  /{slug}  (need {needed}+)")
        if not ok:
            all_pass = False
print()
print("ALL PASS" if all_pass else "FAILURES — see above")
PYEOF
```

---

### Gate B — Sector page titles unchanged

```bash
python3 -c "
from pathlib import Path
import re
for slug, expected in [
    ('solutions/restaurants', 'Restaurants POS System'),
    ('solutions/cafes', 'Cafés POS System'),
    ('solutions/cloud-kitchens', 'Cloud Kitchens POS System'),
    ('product/sell-serve', 'Sell & Serve Faster'),
    ('product/central-inventory', 'Central Inventory'),
]:
    html = (Path('/app/frontend/build') / slug / 'index.html').read_text(errors='ignore')
    t = re.search(r'<title>(.*?)</title>', html)
    title = t.group(1) if t else 'MISSING'
    ok = expected in title
    print(f\"{'PASS' if ok else 'FAIL'}  /{slug}: {title[:60]}\")
"
```

---

### Gate C — Homepage not regressed

```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read().lower()
for kw, needed in [('pos system',3),('inventory management',3),('restaurant billing',3),('loyalty program',2)]:
    c = len(re.findall(kw, html))
    print(f\"{'PASS' if c >= needed else 'FAIL REGRESSION'}  {c}x  {kw}  (homepage — must stay {needed}+)\")
"
```

---

## Complete Change Summary

| Step | File | Proposals | Keywords gained |
|---|---|---|---|
| 1 | `sectors.js` line 9 | P1 | restaurant billing, table management |
| 1 | `sectors.js` line 10 | P2 | qr menu, restaurant management |
| 1 | `sectors.js` line 13 | P3 | restaurant billing |
| 1 | `sectors.js` line 18 | P4 | table management |
| 1 | `sectors.js` line 19 | P5 | qr menu |
| 1 | `sectors.js` line 20 | P6 | restaurant management |
| 1 | `sectors.js` line 39 | P7 | qr menu, inventory management, crm |
| 1 | `sectors.js` line 41 | P8 | inventory management |
| 1 | `sectors.js` line 48 | P9 | inventory management |
| 1 | `sectors.js` line 49 | P10+P11 | crm (×2, title+desc) |
| 1 | `sectors.js` line 47 | P12 | qr menu |
| 1 | `sectors.js` line 96 | P13 | inventory management, food business |
| 1 | `sectors.js` line 97 | P14 | food business, inventory management |
| 1 | `sectors.js` line 107 | P15 | inventory management |
| 2 | `products.js` line 8 | P16 | restaurant billing, table management |
| 2 | `products.js` line 9 | P17 | pos billing, qr menu |
| 2 | `products.js` line 11 | P18+P19 | pos billing, restaurant billing |
| 2 | `products.js` line 12 | P20+P21 | table management (×2) |
| 2 | `products.js` line 14 | P22+P23 | qr menu (×2) |
| 2 | `products.js` line 128 | P24 | restaurant inventory, inventory management |
| 2 | `products.js` line 129 | P25 | restaurant inventory, pos system, inventory management |
| 2 | `products.js` line 131 | P26 | inventory management |
| 2 | `products.js` line 134 | P27 | inventory management |
| 2 | `products.js` line 132 | P28 | inventory management |

**2 files · 28 changes · 1 build · 1 prerender (57 routes) · 1 restart · 3 gates**

---

## Rollback

```bash
cd /app/frontend
git checkout src/data/sectors.js
git checkout src/data/products.js
npx craco build && node scripts/prerender.js && sudo supervisorctl restart frontend
```

---

*Plan written 2026-09-01. Planning Agent. Both data files read in full at exact line numbers. No code changed. Awaiting "go ahead".*
