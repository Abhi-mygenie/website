# CR-121 + CR-122 — Combined Line-by-Line Implementation Plan
## Sitemap: Add Hub Pages + Update lastmod Dates

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-121_ImpactAnalysis.md`, `CR-122_ImpactAnalysis.md`
**Implemented together** — both changes are in `public/sitemap.xml`. One edit pass, one build, one verification.

---

## 0. Prerequisite Check

```bash
# A. Confirm current URL count
python3 -c "
import re
with open('/app/frontend/public/sitemap.xml') as f: xml = f.read()
print('Current URL count:', len(re.findall(r'<loc>', xml)))
print('Expected: 51')
"

# B. Confirm stale dates exist
grep -c "2026-06-07\|2026-06-25" /app/frontend/public/sitemap.xml
# Expected: 30

# C. Confirm hub pages are missing
grep "/solutions\"" /app/frontend/public/sitemap.xml | grep -v "solutions/" && echo "EXISTS" || echo "MISSING — correct"
grep "/product\"" /app/frontend/public/sitemap.xml | grep -v "product/" && echo "EXISTS" || echo "MISSING — correct"
```

---

## Change 1 — Insert Two Hub Pages (CR-121)

**Location:** After line 68 (closing `</url>` of `/refund`), before line 69 (opening `<url>` of `/solutions/restaurants`).

**Current lines 65–73:**
```xml
  <url>
    <loc>https://www.mygenie.online/refund</loc>
    <lastmod>2026-06-07</lastmod>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.mygenie.online/solutions/restaurants</loc>
```

**Replace with:**
```xml
  <url>
    <loc>https://www.mygenie.online/refund</loc>
    <lastmod>2026-08-23</lastmod>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.mygenie.online/solutions</loc>
    <lastmod>2026-08-23</lastmod>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>https://www.mygenie.online/product</loc>
    <lastmod>2026-08-23</lastmod>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>https://www.mygenie.online/solutions/restaurants</loc>
```

**What changes:**
- `/refund` `lastmod` updated to `2026-08-23` (part of CR-122 batch — combined here)
- 12 new lines inserted: two `<url>` blocks for `/solutions` and `/product`

**Why placed here (after legal pages, before sub-pages):**
Logical sitemap hierarchy — hub pages should precede their sub-pages. Legal pages (low priority) come before the solutions/product section. This placement keeps the file organised: core → legal → hub → spokes → blog.

**`changefreq="monthly"`** on hub pages: Honest — these pages change when new sectors or product modules are added. Sub-pages use the same `monthly` implied by their `lastmod` update pattern.

**`priority="0.8"`:** Matches `/blog`, `/ai`, `/customers` — the tier of important non-homepage pages.

---

## Change 2 — Update All Stale lastmod Dates (CR-122)

**30 dates to update.** All `2026-06-07` and `2026-06-25` → `2026-08-23`.

### Implementation method: two `sed` commands

```bash
# Replace all 2026-06-07 occurrences (29 lines)
sed -i 's/2026-06-07/2026-08-23/g' /app/frontend/public/sitemap.xml

# Replace the one 2026-06-25 occurrence (/petpooja-alternative)
sed -i 's/2026-06-25/2026-08-23/g' /app/frontend/public/sitemap.xml
```

**Why `sed` is safe here:**
- `2026-06-07` only appears in `<lastmod>` tags — never in `<loc>` or `<priority>`
- `2026-06-25` also only appears in one `<lastmod>` tag
- Blog post dates (2024-xx, 2025-xx) are completely different years — zero risk of accidental replacement
- The result is: every non-blog page gets `lastmod: 2026-08-23` ✅

**Line-by-line breakdown of what changes:**

| Line | URL | Old date | New date |
|------|-----|----------|---------|
| 5 | `/` | `2026-06-07` | `2026-08-23` |
| 10 | `/petpooja-alternative` | `2026-06-25` | `2026-08-23` |
| 16 | `/pricing` | `2026-06-07` | `2026-08-23` |
| 21 | `/customers` | `2026-06-07` | `2026-08-23` |
| 26 | `/roi` | `2026-06-07` | `2026-08-23` |
| 31 | `/resources` | `2026-06-07` | `2026-08-23` |
| 36 | `/blog` | `2026-06-07` | `2026-08-23` |
| 41 | `/ai` | `2026-06-07` | `2026-08-23` |
| 46 | `/about` | `2026-06-07` | `2026-08-23` |
| 51 | `/contact` | `2026-06-07` | `2026-08-23` |
| 56 | `/terms` | `2026-06-07` | `2026-08-23` |
| 61 | `/privacy` | `2026-06-07` | `2026-08-23` |
| 66 | `/refund` | `2026-06-07` | `2026-08-23` *(done in Change 1)* |
| +new | `/solutions` | — | `2026-08-23` *(new, Change 1)* |
| +new | `/product` | — | `2026-08-23` *(new, Change 1)* |
| 71 | `/solutions/restaurants` | `2026-06-07` | `2026-08-23` |
| 76 | `/solutions/cafes` | `2026-06-07` | `2026-08-23` |
| 81 | `/solutions/qsr` | `2026-06-07` | `2026-08-23` |
| 86 | `/solutions/cloud-kitchens` | `2026-06-07` | `2026-08-23` |
| 91 | `/solutions/hotels-resorts` | `2026-06-07` | `2026-08-23` |
| 96 | `/solutions/food-courts` | `2026-06-07` | `2026-08-23` |
| 101 | `/solutions/canteens` | `2026-06-07` | `2026-08-23` |
| 106 | `/solutions/chains` | `2026-06-07` | `2026-08-23` |
| 111 | `/solutions/bars-pubs` | `2026-06-07` | `2026-08-23` |
| 116 | `/solutions/bakeries` | `2026-06-07` | `2026-08-23` |
| 121 | `/solutions/ice-cream-desserts` | `2026-06-07` | `2026-08-23` |
| 126 | `/product/sell-serve` | `2026-06-07` | `2026-08-23` |
| 131 | `/product/run-property` | `2026-06-07` | `2026-08-23` |
| 136 | `/product/customers` | `2026-06-07` | `2026-08-23` |
| 141 | `/product/protect-profit` | `2026-06-07` | `2026-08-23` |
| 146 | `/product/see-everything` | `2026-06-07` | `2026-08-23` |
| 151 | `/product/central-inventory` | `2026-06-07` | `2026-08-23` |

**What does NOT change:**
- Blog post dates: `2024-10-01` through `2025-05-23` — all untouched ✅
- Any `<loc>`, `<priority>`, `<changefreq>` values — untouched ✅

---

## Execution Order

**Apply Change 2 (sed) first, then Change 1 (hub page insertion).**

Reason: `sed` changes all dates in one pass. The `/refund` date on line 66 gets updated by sed. Then Change 1 replaces the `/refund` block to insert hub pages — at this point `/refund` already has `2026-08-23` so no double-updating occurs.

```bash
# Step 1 — Update all stale dates (Change 2)
sed -i 's/2026-06-07/2026-08-23/g' /app/frontend/public/sitemap.xml
sed -i 's/2026-06-25/2026-08-23/g' /app/frontend/public/sitemap.xml

# Step 2 — Insert hub pages (Change 1)
# Use search_replace: find the refund closing </url> + solutions/restaurants opening
# and insert the two hub page blocks between them (see exact string in Change 1 above)
```

---

## Verification

### V-1. URL count
```bash
python3 -c "
import re
with open('/app/frontend/public/sitemap.xml') as f: xml = f.read()
print('URL count:', len(re.findall(r'<loc>', xml)))
# Expected: 53 (was 51)
"
```

### V-2. Hub pages present
```bash
grep "mygenie.online/solutions\"" /app/frontend/public/sitemap.xml
# Expected: <loc>https://www.mygenie.online/solutions</loc>
grep "mygenie.online/product\"" /app/frontend/public/sitemap.xml
# Expected: <loc>https://www.mygenie.online/product</loc>
```

### V-3. No stale dates remain
```bash
grep "2026-06-07\|2026-06-25" /app/frontend/public/sitemap.xml && echo "FAIL: stale dates still present" || echo "PASS: no stale dates"
# Expected: PASS
```

### V-4. Blog post dates untouched
```bash
grep "2024\|2025" /app/frontend/public/sitemap.xml | wc -l
# Expected: 21 (all 21 blog posts still have 2024/2025 dates)
```

### V-5. XML is well-formed
```bash
python3 -c "
import xml.etree.ElementTree as ET
ET.parse('/app/frontend/public/sitemap.xml')
print('PASS: valid XML')
"
# Expected: PASS: valid XML
```

### V-6. Build + check sitemap in build/
```bash
cd /app/frontend && yarn build 2>&1 | tail -3
ls -lh /app/frontend/build/sitemap.xml
# Expected: sitemap.xml present in build/
```

### V-7. Sitemap accessible via static server
```bash
PREVIEW=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
curl -sI "$PREVIEW/sitemap.xml" | grep -i "content-type\|http"
# Expected: HTTP 200, content-type: application/xml (or text/plain)
```

---

## Rollback

```bash
cd /app/frontend && git checkout public/sitemap.xml
```

The sitemap is a tracked source file. One command restores it fully.

---

## File Change Summary

| File | Change type | Lines changed |
|------|------------|--------------|
| `public/sitemap.xml` | 30 date updates + 12 lines inserted | **42 lines total** |

All changes are in `public/sitemap.xml`. Zero source code changes. Zero `.jsx` changes. No build configuration touched.

---

## Definition of Done

- [ ] `sitemap.xml` has 53 URLs (was 51)
- [ ] `/solutions` present with `priority="0.8"` and `lastmod="2026-08-23"`
- [ ] `/product` present with `priority="0.8"` and `lastmod="2026-08-23"`
- [ ] Zero `2026-06-07` or `2026-06-25` dates remaining
- [ ] All 21 blog post dates unchanged (2024–2025)
- [ ] XML validates as well-formed
- [ ] `yarn build` passes without errors
- [ ] `/sitemap.xml` accessible via static server (HTTP 200)
- [ ] No other files changed (zero JSX/CSS/JS modifications)

---

*Line-by-line plan written 2026-08-23. No code changed. Ready for implementation on approval.*
