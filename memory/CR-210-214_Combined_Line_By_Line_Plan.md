# CR-210 + CR-211 + CR-212 + CR-213 + CR-214
# Combined Line-by-Line Implementation Plan
# Session: 2026-09-05

**Status:** Ready to implement — no code edits yet
**Total edits:** 27 search_replace calls across 5 files
**Build:** One `yarn build` covers all
**Risk:** Zero to very low across all CRs

---

## Files Changed

| CR | File | Edits |
|---|---|---|
| CR-210 | `src/data/sectors.js` | 1 |
| CR-213 | `src/data/sectors.js` | 11 |
| CR-213 | `src/pages/SectorPage.jsx` | 1 |
| CR-211 | `public/index.html` | 1 |
| CR-212 | `scripts/prerender.js` | 1 |
| CR-214 | `public/sitemap.xml` | 12 |
| **Total** | **5 files** | **27** |

No file conflicts. CR-210 edits line 299 of sectors.js; CR-213 edits lines 7, 36, 65, 94, 123, 152, 181, 210, 239, 268, 297 — zero overlap.

---

## Pre-flight Checks (run before any edits)

```bash
# 1. Confirm baseline build hash
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: main.a67281e4.js

# 2. Confirm 63 prerendered routes
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63

# 3. CR-210: ice cream h1 still unfixed
grep 'h1:' /app/frontend/src/data/sectors.js | grep -v "billing software"
# Expected: exactly 1 line (ice-cream-desserts)

# 4. CR-213: nameSingular doesn't exist yet
grep -c "nameSingular" /app/frontend/src/data/sectors.js
# Expected: 0

# 5. CR-212: bars-and-pubs and hotels not yet prerendered
ls /app/frontend/build/solutions/bars-and-pubs 2>/dev/null || echo "bars-and-pubs: NOT in build ✅"
ls /app/frontend/build/solutions/hotels 2>/dev/null || echo "hotels: NOT in build ✅"

# 6. CR-211: FB + CF preconnects not yet present
grep -c "connect.facebook\|cloudflareinsights" /app/frontend/public/index.html
# Expected: 0

# 7. CR-214: current lastmod dates (should all be ≤2026-08-26)
grep "lastmod" /app/frontend/public/sitemap.xml | grep "solutions\|<lastmod>2026-08-25" | head -5
```

---

## BLOCK 1 — sectors.js edits (CR-210 + CR-213)
## 13 edits total in one file — execute in line-number order

---

### Edit 1 — CR-213: restaurants nameSingular (sectors.js L7)

**old_str:**
```
  "restaurants": {
    name: "Restaurants", icon: "UtensilsCrossed", image: IMG(941861),
    eyebrow: "For Restaurants & Fine Dine",
```

**new_str:**
```
  "restaurants": {
    name: "Restaurants", nameSingular: "Restaurant", icon: "UtensilsCrossed", image: IMG(941861),
    eyebrow: "For Restaurants & Fine Dine",
```

**What changes:** `name: "Restaurants",` → `name: "Restaurants", nameSingular: "Restaurant",`
**Title after build:** "Restaurant POS System & Billing Software | MyGenie"

---

### Edit 2 — CR-213: cafes nameSingular (sectors.js L36)

**old_str:**
```
  "cafes": {
    name: "Cafés", icon: "Coffee", image: IMG(302899),
    eyebrow: "For Cafés & Coffee Shops",
```

**new_str:**
```
  "cafes": {
    name: "Cafés", nameSingular: "Café", icon: "Coffee", image: IMG(302899),
    eyebrow: "For Cafés & Coffee Shops",
```

**Title after build:** "Café POS System & Billing Software | MyGenie"

---

### Edit 3 — CR-213: qsr nameSingular (sectors.js L65)

**old_str:**
```
  "qsr": {
    name: "QSR / Fast Food", nameLower: "QSR and fast food restaurants", icon: "Sandwich", image: IMG(1639557),
    eyebrow: "For QSR & Fast Food",
```

**new_str:**
```
  "qsr": {
    name: "QSR / Fast Food", nameSingular: "QSR", nameLower: "QSR and fast food restaurants", icon: "Sandwich", image: IMG(1639557),
    eyebrow: "For QSR & Fast Food",
```

**Title after build:** "QSR POS System & Billing Software | MyGenie"

---

### Edit 4 — CR-213: cloud-kitchens nameSingular (sectors.js L94)

**old_str:**
```
  "cloud-kitchens": {
    name: "Cloud Kitchens", icon: "ChefHat", image: IMG(12821628),
    eyebrow: "For Cloud Kitchens",
```

**new_str:**
```
  "cloud-kitchens": {
    name: "Cloud Kitchens", nameSingular: "Cloud Kitchen", icon: "ChefHat", image: IMG(12821628),
    eyebrow: "For Cloud Kitchens",
```

**Title after build:** "Cloud Kitchen POS System & Billing Software | MyGenie"

---

### Edit 5 — CR-213: hotels-resorts nameSingular (sectors.js L123)

**old_str:**
```
  "hotels-resorts": {
    name: "Hotels & Resorts", nameLower: "hotels and resorts", icon: "BedDouble", image: IMG(258154),
    eyebrow: "For Hotels & Resorts",
```

**new_str:**
```
  "hotels-resorts": {
    name: "Hotels & Resorts", nameSingular: "Hotel", nameLower: "hotels and resorts", icon: "BedDouble", image: IMG(258154),
    eyebrow: "For Hotels & Resorts",
```

**Title after build:** "Hotel POS System & Billing Software | MyGenie"

---

### Edit 6 — CR-213: food-courts nameSingular (sectors.js L152)

**old_str:**
```
  "food-courts": {
    name: "Food Courts", icon: "Store", image: IMG(1267320),
    eyebrow: "For Food Courts",
```

**new_str:**
```
  "food-courts": {
    name: "Food Courts", nameSingular: "Food Court", icon: "Store", image: IMG(1267320),
    eyebrow: "For Food Courts",
```

**Title after build:** "Food Court POS System & Billing Software | MyGenie"

---

### Edit 7 — CR-213: canteens nameSingular (sectors.js L181)

**old_str:**
```
  "canteens": {
    name: "Canteens & Mess", nameLower: "canteens and mess halls", icon: "Utensils", image: IMG(696218),
    eyebrow: "For Canteens & Mess",
```

**new_str:**
```
  "canteens": {
    name: "Canteens & Mess", nameSingular: "Canteen", nameLower: "canteens and mess halls", icon: "Utensils", image: IMG(696218),
    eyebrow: "For Canteens & Mess",
```

**Title after build:** "Canteen POS System & Billing Software | MyGenie"

---

### Edit 8 — CR-213: chains nameSingular (sectors.js L210)

**old_str:**
```
  "chains": {
    name: "Chains & Franchises", nameLower: "chains and franchises", icon: "Building2", image: IMG(1581384),
    eyebrow: "For Chains & Franchises",
```

**new_str:**
```
  "chains": {
    name: "Chains & Franchises", nameSingular: "Multi-Outlet", nameLower: "chains and franchises", icon: "Building2", image: IMG(1581384),
    eyebrow: "For Chains & Franchises",
```

**Title after build:** "Multi-Outlet POS System & Billing Software | MyGenie"

---

### Edit 9 — CR-213: bars-pubs nameSingular (sectors.js L239)

**old_str:**
```
  "bars-pubs": {
    name: "Bars & Pubs", nameLower: "bars and pubs", icon: "Wine", image: "",
    eyebrow: "For Bars & Pubs",
```

**new_str:**
```
  "bars-pubs": {
    name: "Bars & Pubs", nameSingular: "Bar", nameLower: "bars and pubs", icon: "Wine", image: "",
    eyebrow: "For Bars & Pubs",
```

**Title after build:** "Bar POS System & Billing Software | MyGenie"

---

### Edit 10 — CR-213: bakeries nameSingular (sectors.js L268)

**old_str:**
```
  "bakeries": {
    name: "Bakeries", icon: "Croissant", image: "",
    eyebrow: "For Bakeries",
```

**new_str:**
```
  "bakeries": {
    name: "Bakeries", nameSingular: "Bakery", icon: "Croissant", image: "",
    eyebrow: "For Bakeries",
```

**Title after build:** "Bakery POS System & Billing Software | MyGenie"

---

### Edit 11 — CR-213: ice-cream-desserts nameSingular (sectors.js L297)

**old_str:**
```
  "ice-cream-desserts": {
    name: "Ice Cream & Desserts", nameLower: "ice cream and dessert outlets", icon: "IceCreamCone", image: "",
    eyebrow: "For Ice Cream & Dessert Parlours",
```

**new_str:**
```
  "ice-cream-desserts": {
    name: "Ice Cream & Desserts", nameSingular: "Ice Cream Shop", nameLower: "ice cream and dessert outlets", icon: "IceCreamCone", image: "",
    eyebrow: "For Ice Cream & Dessert Parlours",
```

**Title after build:** "Ice Cream Shop POS System & Billing Software | MyGenie"

---

### Edit 12 — CR-210: ice-cream-desserts H1 fix (sectors.js L299)

**old_str:**
```
    h1: "Ice cream shop POS — serve sweet moments fast and keep every scoop profitable.",
```

**new_str:**
```
    h1: "Ice cream shop POS system & billing software — serve sweet moments fast and keep every scoop profitable.",
```

**What changes:** `POS —` → `POS system & billing software —`
**Keywords added:** `pos system` ×1, `billing software` ×1

---

## Post-sectors.js Verification

```bash
# A: nameSingular added to all 11 sectors
grep -c "nameSingular" /app/frontend/src/data/sectors.js
# Expected: 11

# B: ice cream H1 fixed (no sector missing billing software)
grep 'h1:' /app/frontend/src/data/sectors.js | grep -v "billing software"
# Expected: NO OUTPUT (all 11 sectors now have billing software in h1)

# C: Confirm exact nameSingular values
grep "nameSingular" /app/frontend/src/data/sectors.js
# Expected: 11 lines, one per sector
```

---

## BLOCK 2 — SectorPage.jsx (CR-213, 1 edit)

---

### Edit 13 — CR-213: Use nameSingular in seoTitle (SectorPage.jsx L62)

**old_str:**
```
  const seoTitle = `${s.name} POS System & Billing Software | MyGenie`;
```

**new_str:**
```
  const seoTitle = `${s.nameSingular || s.name} POS System & Billing Software | MyGenie`;
```

**What changes:** `s.name` → `s.nameSingular || s.name`
**Fallback guard:** If any sector is missing `nameSingular`, current title is preserved — zero regression possible.

---

## Post-SectorPage.jsx Verification

```bash
grep -n "seoTitle\|nameSingular" /app/frontend/src/pages/SectorPage.jsx | head -5
# Expected: line 62 = `${s.nameSingular || s.name} POS System & Billing Software | MyGenie`
```

---

## BLOCK 3 — public/index.html (CR-211, 1 edit)

---

### Edit 14 — CR-211: Add FB Pixel + Cloudflare Insights preconnect

**old_str:**
```
        <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com">
```

**new_str:**
```
        <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com">
        <!-- CR-211: preconnect for FB Pixel (connect.facebook.net) and Cloudflare Web Analytics
             (static.cloudflareinsights.com). Both are injected by GTM tags — not in source.
             crossorigin required: both scripts are fetched with CORS headers; without crossorigin
             the browser opens a second connection at load time, wasting the pre-warmed connection.
             CF preconnect is a no-op if Cloudflare RUM is disabled (CR-186 owner action). -->
        <link rel="preconnect" href="https://connect.facebook.net" crossorigin>
        <link rel="preconnect" href="https://static.cloudflareinsights.com" crossorigin>
```

**Net lines added:** +6 (2 meaningful + 4 comment lines)

---

## Post-index.html Verification

```bash
grep "connect.facebook\|cloudflareinsights" /app/frontend/public/index.html
# Expected:
#   <link rel="preconnect" href="https://connect.facebook.net" crossorigin>
#   <link rel="preconnect" href="https://static.cloudflareinsights.com" crossorigin>

grep -c '<link rel="preconnect"' /app/frontend/public/index.html
# Expected: 3 (GTM + FB + CF)
```

---

## BLOCK 4 — scripts/prerender.js (CR-212, 1 edit)

---

### Edit 15 — CR-212: Add redirect routes to extraRoutes

**old_str:**
```
  const extraRoutes = ["/demo", "/payment-success", "/404", "/thank-you"];
```

**new_str:**
```
  const extraRoutes = ["/demo", "/payment-success", "/404", "/thank-you",
    // CR-212: prerender dead-slug redirect pages so static-server returns 200 (not 404).
    // Puppeteer visits these → React Navigate fires → captures bars-pubs / hotels-resorts content.
    // Saved to build/solutions/bars-and-pubs/ and build/solutions/hotels/ respectively.
    // Canonical in both = correct destination URL. HTTP 200 + canonical replaces hard 404.
    "/solutions/bars-and-pubs", "/solutions/hotels"];
```

---

## Post-prerender.js Verification

```bash
grep -A5 "extraRoutes" /app/frontend/scripts/prerender.js | head -8
# Expected: array contains bars-and-pubs and hotels entries
```

---

## BLOCK 5 — public/sitemap.xml (CR-214, 12 edits)

Each edit changes only the `<lastmod>` date for one URL. The `<loc>` line is included in old_str to ensure uniqueness.

---

### Edit 16 — CR-214: Homepage lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/</loc>
    <lastmod>2026-08-25</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/</loc>
    <lastmod>2026-09-05</lastmod>
```

---

### Edit 17 — CR-214: /solutions/restaurants lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/restaurants</loc>
    <lastmod>2026-08-24</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/restaurants</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 18 — CR-214: /solutions/cafes lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/cafes</loc>
    <lastmod>2026-08-21</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/cafes</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 19 — CR-214: /solutions/qsr lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/qsr</loc>
    <lastmod>2026-08-24</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/qsr</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 20 — CR-214: /solutions/cloud-kitchens lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/cloud-kitchens</loc>
    <lastmod>2026-08-21</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/cloud-kitchens</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 21 — CR-214: /solutions/hotels-resorts lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/hotels-resorts</loc>
    <lastmod>2026-08-24</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/hotels-resorts</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 22 — CR-214: /solutions/food-courts lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/food-courts</loc>
    <lastmod>2026-08-21</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/food-courts</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 23 — CR-214: /solutions/canteens lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/canteens</loc>
    <lastmod>2026-08-24</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/canteens</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 24 — CR-214: /solutions/chains lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/chains</loc>
    <lastmod>2026-08-21</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/chains</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 25 — CR-214: /solutions/bars-pubs lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/bars-pubs</loc>
    <lastmod>2026-08-24</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/bars-pubs</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 26 — CR-214: /solutions/bakeries lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/bakeries</loc>
    <lastmod>2026-08-21</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/bakeries</loc>
    <lastmod>2026-09-04</lastmod>
```

---

### Edit 27 — CR-214: /solutions/ice-cream-desserts lastmod

**old_str:**
```
    <loc>https://www.mygenie.online/solutions/ice-cream-desserts</loc>
    <lastmod>2026-08-24</lastmod>
```

**new_str:**
```
    <loc>https://www.mygenie.online/solutions/ice-cream-desserts</loc>
    <lastmod>2026-09-05</lastmod>
```

*(2026-09-05 because CR-210 updates this page's H1 today)*

---

## Post-sitemap.xml Verification

```bash
# Confirm 12 dates updated
grep "lastmod" /app/frontend/public/sitemap.xml | grep "2026-08" | wc -l
# Expected: fewer than before (some 2026-08 dates remain on non-sector pages)

# Confirm sector pages now have 2026-09-04
grep -A1 "solutions/" /app/frontend/public/sitemap.xml | grep "lastmod" | sort | uniq -c
# Expected: 10× 2026-09-04, 1× 2026-09-05 (ice-cream-desserts)

# Confirm route count unchanged
grep -c "<url>" /app/frontend/public/sitemap.xml
# Expected: 59
```

---

## Rebuild

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr210-214.log 2>&1 &
echo "Build started PID=$!"
# Monitor:
tail -f /app/memory/build-cr210-214.log
# Completes in ~3 min. Look for "Done in Xs." at end.
```

---

## Restart

```bash
sudo supervisorctl restart frontend && sleep 4 && sudo supervisorctl status frontend
# Expected: frontend RUNNING
```

---

## Full Post-build Validation

```bash
# ── CR-210: ice cream H1 ──────────────────────────────────────────────────────
python3 -c "
html = open('/app/frontend/build/solutions/ice-cream-desserts/index.html').read()
body = html[html.lower().find('<body'):].lower()
import re
m = re.search(r'<meta name=\"description\" content=\"(.*?)\"', html)
desc_len = len(m.group(1).replace('&amp;','&')) if m else 0
print('CR-210 ice cream billing software:', body.count('billing software'), '(target ≥1)')
print('CR-210 ice cream pos system:', body.count('pos system'), '(target ≥1)')
print('CR-210 meta desc:', desc_len, 'ch (limit 160)')
"

# ── CR-211: preconnect in built index.html ────────────────────────────────────
grep -c "connect.facebook.net" /app/frontend/build/index.html
# Expected: 1
grep -c "cloudflareinsights" /app/frontend/build/index.html
# Expected: 1

# ── CR-212: redirect pages now prerendered ────────────────────────────────────
ls /app/frontend/build/solutions/bars-and-pubs/index.html && echo "bars-and-pubs: prerendered ✅"
ls /app/frontend/build/solutions/hotels/index.html && echo "hotels: prerendered ✅"
# Check canonical of bars-and-pubs → should point to /solutions/bars-pubs
grep "canonical" /app/frontend/build/solutions/bars-and-pubs/index.html
# Expected: href="https://www.mygenie.online/solutions/bars-pubs"
grep "canonical" /app/frontend/build/solutions/hotels/index.html
# Expected: href="https://www.mygenie.online/solutions/hotels-resorts"
# Check HTTP status (static-server returns 200 when folder exists)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/solutions/bars-and-pubs
# Expected: 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/solutions/hotels
# Expected: 200

# ── CR-213: all sector titles now singular ────────────────────────────────────
python3 << 'EOF'
import re, os
pairs = [
    ("restaurants",       "Restaurant POS System"),
    ("cafes",             "Café POS System"),
    ("qsr",               "QSR POS System"),
    ("cloud-kitchens",    "Cloud Kitchen POS System"),
    ("hotels-resorts",    "Hotel POS System"),
    ("food-courts",       "Food Court POS System"),
    ("canteens",          "Canteen POS System"),
    ("chains",            "Multi-Outlet POS System"),
    ("bars-pubs",         "Bar POS System"),
    ("bakeries",          "Bakery POS System"),
    ("ice-cream-desserts","Ice Cream Shop POS"),
]
base = "/app/frontend/build/solutions"
all_pass = True
for slug, expected_start in pairs:
    html = open(f"{base}/{slug}/index.html").read()
    m = re.search(r'<title>(.*?)</title>', html)
    title = m.group(1) if m else ""
    ok = expected_start.lower() in title.lower()
    if not ok: all_pass = False
    print(f"{'✅' if ok else '❌'} {slug}: {title[:70]}")
print()
print("CR-213 OVERALL:", "PASS ✅" if all_pass else "FAIL ❌")
EOF

# ── CR-214: sitemap lastmod updated in built file ─────────────────────────────
grep -A1 "solutions/restaurants" /app/frontend/build/sitemap.xml | grep lastmod
# Expected: 2026-09-04
grep -A1 "solutions/ice-cream" /app/frontend/build/sitemap.xml | grep lastmod
# Expected: 2026-09-05
grep -c "<url>" /app/frontend/build/sitemap.xml
# Expected: 59

# ── Overall route count ───────────────────────────────────────────────────────
find /app/frontend/build -name "index.html" | wc -l
# Expected: 65 (was 63 + 2 new redirect pages from CR-212)

# ── Build hash clean ──────────────────────────────────────────────────────────
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "$BAD" | grep -q "$NEW" && echo "HASH FAIL" || echo "HASH PASS: $NEW"
```

---

## Rollback (if needed)

Each CR can be rolled back independently by reversing its search_replace:

| CR | Rollback action |
|---|---|
| CR-210 | Revert sectors.js line 299 (remove `system & billing software`) |
| CR-211 | Revert index.html (remove 6 lines after dns-prefetch) |
| CR-212 | Revert prerender.js (remove 2 routes from extraRoutes) |
| CR-213 | Revert sectors.js × 11 (remove `nameSingular` from each) + SectorPage.jsx (revert to `s.name`) |
| CR-214 | Revert sitemap.xml × 12 (restore original dates) |

After reverting, one rebuild restores the original state.

---

## Edit Summary Table

| # | CR | File | Line | Change |
|---|---|---|---|---|
| 1 | CR-213 | sectors.js | 7 | Add `nameSingular: "Restaurant"` |
| 2 | CR-213 | sectors.js | 36 | Add `nameSingular: "Café"` |
| 3 | CR-213 | sectors.js | 65 | Add `nameSingular: "QSR"` |
| 4 | CR-213 | sectors.js | 94 | Add `nameSingular: "Cloud Kitchen"` |
| 5 | CR-213 | sectors.js | 123 | Add `nameSingular: "Hotel"` |
| 6 | CR-213 | sectors.js | 152 | Add `nameSingular: "Food Court"` |
| 7 | CR-213 | sectors.js | 181 | Add `nameSingular: "Canteen"` |
| 8 | CR-213 | sectors.js | 210 | Add `nameSingular: "Multi-Outlet"` |
| 9 | CR-213 | sectors.js | 239 | Add `nameSingular: "Bar"` |
| 10 | CR-213 | sectors.js | 268 | Add `nameSingular: "Bakery"` |
| 11 | CR-213 | sectors.js | 297 | Add `nameSingular: "Ice Cream Shop"` |
| 12 | CR-210 | sectors.js | 299 | H1: `POS —` → `POS system & billing software —` |
| 13 | CR-213 | SectorPage.jsx | 62 | `s.name` → `s.nameSingular \|\| s.name` in seoTitle |
| 14 | CR-211 | index.html | 34–35 | Add 2 preconnect links + comment after GTM block |
| 15 | CR-212 | prerender.js | 13 | Add 2 routes to extraRoutes array |
| 16 | CR-214 | sitemap.xml | — | `/` lastmod: 2026-08-25 → 2026-09-05 |
| 17 | CR-214 | sitemap.xml | — | `/solutions/restaurants` lastmod: 2026-08-24 → 2026-09-04 |
| 18 | CR-214 | sitemap.xml | — | `/solutions/cafes` lastmod: 2026-08-21 → 2026-09-04 |
| 19 | CR-214 | sitemap.xml | — | `/solutions/qsr` lastmod: 2026-08-24 → 2026-09-04 |
| 20 | CR-214 | sitemap.xml | — | `/solutions/cloud-kitchens` lastmod: 2026-08-21 → 2026-09-04 |
| 21 | CR-214 | sitemap.xml | — | `/solutions/hotels-resorts` lastmod: 2026-08-24 → 2026-09-04 |
| 22 | CR-214 | sitemap.xml | — | `/solutions/food-courts` lastmod: 2026-08-21 → 2026-09-04 |
| 23 | CR-214 | sitemap.xml | — | `/solutions/canteens` lastmod: 2026-08-24 → 2026-09-04 |
| 24 | CR-214 | sitemap.xml | — | `/solutions/chains` lastmod: 2026-08-21 → 2026-09-04 |
| 25 | CR-214 | sitemap.xml | — | `/solutions/bars-pubs` lastmod: 2026-08-24 → 2026-09-04 |
| 26 | CR-214 | sitemap.xml | — | `/solutions/bakeries` lastmod: 2026-08-21 → 2026-09-04 |
| 27 | CR-214 | sitemap.xml | — | `/solutions/ice-cream-desserts` lastmod: 2026-08-24 → 2026-09-05 |

*Plan complete — 2026-09-05. 27 edits, 5 files, 1 build. Ready to implement on instruction.*
*Impact analysis: `/app/memory/CR-210_IceCream_H1_Billing_Software_Gap.md` etc.*
