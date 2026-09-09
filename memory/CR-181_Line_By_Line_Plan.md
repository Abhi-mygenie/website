# CR-181 Line-by-Line Implementation Plan
**Date:** 2026-09-02
**Status:** READY TO IMPLEMENT (pending owner copy approval)

---

## Files Changed: 2

| # | File | Lines | Changes |
|---|---|---|---|
| 1 | `frontend/src/data/sectors.js` | 10, 39, 97, 126 | 4 `sub` field trims |
| 2 | `frontend/src/data/products.js` | 129 | 1 `sub` field trim |

**Zero other files touched.** Both files are data-only — no JSX, no logic.

---

## Change 1 — `sectors.js` line 10 (restaurants)

**BEFORE:**
```js
    sub: "From QR menu ordering to the kitchen screen to your owner dashboard, MyGenie covers your whole restaurant management — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.",
```

**AFTER:**
```js
    sub: "MyGenie covers your whole restaurant management — QR menu ordering, kitchen screen and owner dashboard — so you serve more covers with fewer mistakes.",
```

212ch → **150ch** (−62ch)

---

## Change 2 — `sectors.js` line 39 (cafes)

**BEFORE:**
```js
    sub: "Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, QR menu ordering, and ingredient-level inventory management — plus a built-in CRM to bring guests back.",
```

**AFTER:**
```js
    sub: "Thin margins leave no room for waste. MyGenie gives cafés fast mobile billing, QR menu ordering, ingredient-level inventory management — plus a built-in CRM.",
```

195ch → **157ch** (−38ch)

---

## Change 3 — `sectors.js` line 97 (cloud-kitchens)

**BEFORE:**
```js
    sub: "Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies your inventory management and every brand into one backend.",
```

**AFTER:**
```js
    sub: "Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies inventory management and every brand into one screen.",
```

166ch → **160ch** (−6ch)

---

## Change 4 — `sectors.js` line 126 (hotels-resorts)

**BEFORE:**
```js
    sub: "Stop running between counters. MyGenie unifies room billing and F&B into one consolidated checkout bill, works in low-internet properties, and lets staff serve guests right from their phones.",
```

**AFTER:**
```js
    sub: "MyGenie unifies room billing and F&B into one checkout bill, works in low-internet properties, and lets staff serve guests right from their phones.",
```

191ch → **147ch** (−44ch)

---

## Change 5 — `products.js` line 129 (central-inventory)

**BEFORE:**
```js
    sub: "Stop managing restaurant inventory in silos. MyGenie connects your POS system to a central inventory management hub — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.",
```

**AFTER:**
```js
    sub: "Central restaurant inventory management in one hub — procurement, inter-outlet transfers, recipe costing and AI-driven reordering across every outlet.",
```

226ch → **150ch** (−76ch)

---

## Verification Gates (run after build)

### Gate A — All 5 pages ≤160ch in prerendered HTML
```bash
python3 -c "
import re, os
pages = [
    ('restaurants',      '/app/frontend/build/solutions/restaurants/index.html'),
    ('cafes',            '/app/frontend/build/solutions/cafes/index.html'),
    ('cloud-kitchens',   '/app/frontend/build/solutions/cloud-kitchens/index.html'),
    ('hotels-resorts',   '/app/frontend/build/solutions/hotels-resorts/index.html'),
    ('central-inventory','/app/frontend/build/product/central-inventory/index.html'),
]
all_pass = True
for slug, path in pages:
    html = open(path).read()
    m = re.search(r'<meta name=\"description\" content=\"(.*?)\"', html)
    d = m.group(1).replace('&amp;','&') if m else ''
    ok = len(d) <= 160
    if not ok: all_pass = False
    print(f'{'OK' if ok else 'FAIL'}  {len(d)}ch  {slug}')
print('ALL PASS' if all_pass else 'SOME FAILING')
"
```

### Gate B — Keyword check (primary keyword still in first 120 chars)
```bash
python3 -c "
import re, os
checks = [
    ('restaurants',       '/app/frontend/build/solutions/restaurants/index.html',      'restaurant management'),
    ('cafes',             '/app/frontend/build/solutions/cafes/index.html',             'inventory management'),
    ('cloud-kitchens',    '/app/frontend/build/solutions/cloud-kitchens/index.html',    'inventory management'),
    ('hotels-resorts',    '/app/frontend/build/solutions/hotels-resorts/index.html',    'room billing'),
    ('central-inventory', '/app/frontend/build/product/central-inventory/index.html',   'restaurant inventory'),
]
for slug, path, kw in checks:
    html = open(path).read()
    m = re.search(r'<meta name=\"description\" content=\"(.*?)\"', html)
    d = m.group(1).replace('&amp;','&') if m else ''
    pos = d.lower().find(kw)
    ok = 0 <= pos <= 120
    print(f'{'OK' if ok else 'FAIL'}  \"{kw}\" at pos {pos}  {slug}')
"
```

### Gate C — No regressions on other pages
Other solution pages (qsr, food-courts, canteens, chains) and product pages (sell-serve, run-property, customers, protect-profit, see-everything) are not touched — no verification needed.

---

## Build Command
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

---

*Plan written 2026-09-02. 5 changes, 2 files, ~150 total chars changed across all edits.*
