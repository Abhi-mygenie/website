# CR-179 — Solution & Product Page Keyword Optimization (5 Pages)

**Type:** SEO / Google Ads Quality Score
**Date Raised:** 2026-08-30
**Status:** OPEN
**Priority:** P2
**Source:** UAT audit per-page keyword tab (beta.mygenie.online, 2026-08-27)

---

## 1. Problem

5 solution/product pages are missing target keywords for their respective ad groups.
Each page has unique keywords that match specific ad group targeting — missing them
means "Below Average" LP Experience for those keywords.

**Note:** Page titles ARE already unique per page (confirmed in code investigation).
`SectorPage.jsx` L62: `${s.name} POS System & Billing Software | MyGenie`
The audit's claim of "duplicate titles" was incorrect.

---

## 2. Architecture Note

`SectorPage.jsx` and `ProductPage.jsx` are template components fed by data files:
- `frontend/src/data/sectors.js` — all solution page copy (pains, solutions, FAQs)
- `frontend/src/data/products.js` — all product page copy

**Per-page keyword fixes go into the DATA FILES, not the template JSX.**
One data file edit updates all matching instances automatically.

SEO titles for sector pages: `SectorPage.jsx` L62 (not in data file).
SEO meta descriptions: `SectorPage.jsx` L80 uses `s.sub` from sectors.js.

---

## 3. Per-Page Fix Plan

---

### Page 1 — `/solutions/restaurants`
**Ad Groups:** Alpha Terms, Billing Software, Management & Ordering

| Keyword | Current | Target |
|---|---|---|
| pos system | 0x | 3+ |
| billing software | 0x | 3+ |
| restaurant billing | 0x | 3+ |
| restaurant management | 0x | 3+ |
| table management | 0x | 3+ |
| qr menu | 0x | 2+ |

**Title fix** (`SectorPage.jsx` L62 or `PAGE_SEO` in `seo.js`):
```
"Restaurant POS System & Billing Software for Dine-In | MyGenie"
```

**Meta description fix** (`sectors.js` — restaurants `sub` field):
```
"India's best restaurant billing software — table management, KOT, QR menu, and inventory.
MyGenie POS system for restaurants. Book a free demo."
```

**Intro para** (add to `sectors.js` restaurants description or solution items):
```
"MyGenie is a complete restaurant management software — POS system at the counter,
table management on the floor, restaurant billing in under 10 seconds."
```

**Feature card additions to `sectors.js` restaurants `solutions` array:**
- "Table management — live floor view with covers, seat transfers, bill splits"
- "QR menu — guests scan, order themselves. Fewer errors, faster service."
- "Restaurant billing — under 10 seconds, GST-compliant, KOT-triggered"

---

### Page 2 — `/solutions/cafes`
**Ad Groups:** Alpha Terms

| Keyword | Current | Target |
|---|---|---|
| billing software | 1x | 3+ |
| inventory management | 0x | 2+ |
| qr menu | 0x | 2+ |
| crm | 0x | 1+ |

**Title fix:**
```
"Café POS System & Billing Software | MyGenie"
```

**Meta description fix** (`sectors.js` — cafes `sub` field):
```
"MyGenie café POS — fast mobile billing software, recipe-level inventory management,
loyalty program and QR menu. Turn first-timers into regulars."
```

**Feature card additions to `sectors.js` cafes `solutions` array:**
- "Recipe-level inventory management — track every gram, cut waste before it hits P&L"
- "QR menu — table ordering for café guests, scan and order themselves"
- "Built-in CRM — know your regulars by name, auto loyalty rewards"

---

### Page 3 — `/solutions/cloud-kitchens`
**Best performing page — minor gaps only**

| Keyword | Current | Target |
|---|---|---|
| inventory management | 0x | 2+ |
| food business | 0x | 1+ |
| pos system | 2x | 3+ (add 1) |
| billing software | 1x | 2+ (add 1) |

**Title fix:**
```
"Cloud Kitchen POS & Billing Software | MyGenie"
```

**Feature card additions:**
- "Inventory management across brands — one central stock pool, auto-deducted per order"
- Add "food business" naturally to intro: "for any cloud kitchen food business"

---

### Page 4 — `/product/sell-serve`
**Ad Groups:** POS System, Billing Software, Management

| Keyword | Current | Target |
|---|---|---|
| table management | 0x | 3+ |
| qr menu | 0x | 3+ |
| pos billing | 0x | 2+ |
| restaurant billing | 0x | 2+ |
| billing software | 2x | 4+ |
| pos system | 1x | 4+ |

**Title fix** (`PAGE_SEO` in `seo.js` or `ProductPage.jsx` title template):
```
"Restaurant POS System & Billing Software | Sell & Serve | MyGenie"
```

**Feature card additions** (`products.js` sell-serve features array):
- "Table management — live floor view with covers, seat transfers, and bill splits"
- "QR menu — guests scan a table QR, browse the menu, and order themselves"
- "POS billing — restaurant billing in under 10 seconds, GST-compliant, KOT-triggered"

---

### Page 5 — `/product/central-inventory`
**Best product page — unique title already**

| Keyword | Current | Target |
|---|---|---|
| inventory management | 2x | 5+ |
| restaurant inventory | 0x | 2+ |
| pos system | 0x | 1+ |
| stock management | 1x | 2+ |

**Title fix** (`PAGE_SEO` in `seo.js`):
```
"Restaurant Inventory Management Software | MyGenie"
```
(stronger keyword targeting than current "Central Inventory | MyGenie POS Features")

**Subheading additions** (`products.js` central-inventory features):
- "Restaurant inventory management — one source of truth across all outlets"
- "Stock management across every outlet — auto-deducted, always accurate"

---

## 4. Verification

After rebuild, grep each page:
```bash
for page in "solutions/restaurants" "solutions/cafes" "solutions/cloud-kitchens" \
            "product/sell-serve" "product/central-inventory"; do
  echo "=== $page ==="
  html=$(cat /app/frontend/build/${page}/index.html | tr '[:upper:]' '[:lower:]')
  for kw in "pos system" "billing software" "inventory management" \
             "table management" "qr menu" "restaurant billing"; do
    count=$(echo "$html" | grep -o "$kw" | wc -l)
    echo "  \"$kw\": ${count}x"
  done
done
```

---

## 5. Definition of Done

- [ ] `/solutions/restaurants` — pos system, billing software, table management all ≥2x
- [ ] `/solutions/cafes` — billing software ≥3x, inventory management ≥2x, qr menu ≥2x
- [ ] `/solutions/cloud-kitchens` — inventory management ≥2x, pos system ≥3x
- [ ] `/product/sell-serve` — table management ≥3x, qr menu ≥3x, pos system ≥4x
- [ ] `/product/central-inventory` — inventory management ≥5x, restaurant inventory ≥2x
- [ ] All 5 pages have updated titles in prerendered HTML
- [ ] No layout regression on any page

*CR-179 registered 2026-08-30. Source: UAT audit per-page keyword tab.*
