# CR-214 — Sitemap lastmod Dates Stale After Multiple Content CRs

**Registered:** 2026-09-05
**Source:** Sitemap audit — 2026-09-05
**Status:** 🔲 Open — Ready to implement
**Priority:** P2
**Owner:** Agent (edit + rebuild)
**File:** `public/sitemap.xml` — lastmod date updates only

---

## 1. Sitemap Completeness Audit (2026-09-05)

### Overall status: COMPLETE ✅

| Check | Result |
|---|---|
| Total URLs in sitemap | 59 |
| Expected indexable URLs | 59 (see §2) |
| Missing indexable pages | **0** |
| Extra / wrong pages | **0** |
| Redirect pages present | ✅ Absent (correct) |
| Noindex pages present | ✅ Absent (`/demo` noindex=true, correctly excluded) |
| `/leads`, `/payment-success`, `/thank-you` | ✅ Absent (correct) |

All 11 sector pages, 6 product pages, 21 blog posts, 6 Google Ads LPs, and all core
pages are present with correct URLs. No missing or extra entries.

---

## 2. What's Correct

| Category | Count | Status |
|---|---|---|
| Core pages (/, /pricing, /solutions, /product, etc.) | 14 | ✅ All present |
| Solution pages (/solutions/restaurants … /ice-cream-desserts) | 11 | ✅ All present |
| Product pages (/product/sell-serve … /central-inventory) | 6 | ✅ All present |
| Blog posts | 21 | ✅ All present |
| Google Ads LPs (/restaurant-billing-software, /restaurant-pos-system, etc.) | 6 | ✅ All present |
| /petpooja-alternative | 1 | ✅ Present |
| /demo | — | ✅ Correctly absent (noindex: true in PAGE_SEO) |

---

## 3. The One Issue: Stale lastmod Dates

The sitemap's most recent `lastmod` is **2026-08-26**. Multiple content CRs were
implemented after that date that changed page content:

| Page(s) | Last sitemap lastmod | Content changed by CR | New lastmod needed |
|---|---|---|---|
| All 11 `/solutions/*` pages | 2026-08-21 or 2026-08-24 | CR-187 (H1 update, all sectors) | 2026-09-04 |
| `/solutions/restaurants`, `/cafes`, etc. | 2026-08-21 or 2026-08-24 | CR-189 (solutions desc update) | 2026-09-04 |
| `/` (homepage) | 2026-08-25 | CR-208 (Suspense split — structural, minor) | 2026-09-05 |
| All pages (index.html) | 2026-08-25 | CR-209 (GTM defer — index.html, not page content) | Not required (infra change, not content) |

**Why lastmod matters:** Google uses `lastmod` as a crawl priority signal. A stale
`lastmod` makes Googlebot less likely to recrawl pages that have had content updates.
After CR-187 updated H1s on all 11 sector pages, those pages should reflect a newer `lastmod`.

---

## 4. Proposed lastmod Updates

| URL | Current lastmod | Proposed lastmod | Reason |
|---|---|---|---|
| `/solutions/restaurants` | 2026-08-24 | **2026-09-04** | CR-187 H1 update + CR-189 solutions desc |
| `/solutions/cafes` | 2026-08-21 | **2026-09-04** | CR-187 + CR-189 |
| `/solutions/qsr` | 2026-08-24 | **2026-09-04** | CR-187 + CR-189 |
| `/solutions/cloud-kitchens` | 2026-08-21 | **2026-09-04** | CR-187 + CR-189 |
| `/solutions/hotels-resorts` | 2026-08-24 | **2026-09-04** | CR-187 + CR-189 |
| `/solutions/food-courts` | 2026-08-21 | **2026-09-04** | CR-187 + CR-189 |
| `/solutions/canteens` | 2026-08-24 | **2026-09-04** | CR-187 + CR-189 |
| `/solutions/chains` | 2026-08-21 | **2026-09-04** | CR-187 + CR-189 |
| `/solutions/bars-pubs` | 2026-08-24 | **2026-09-04** | CR-187 |
| `/solutions/bakeries` | 2026-08-21 | **2026-09-04** | CR-187 |
| `/solutions/ice-cream-desserts` | 2026-08-24 | **2026-09-05** | CR-210 (pending) — update when CR-210 implemented |
| `/` (homepage) | 2026-08-25 | **2026-09-05** | CR-208 Suspense split (structural refresh) |

All other URLs: no content change since their current lastmod → leave unchanged.

---

## 5. Implementation

**File:** `public/sitemap.xml`
**Tool:** 12 `search_replace` calls (one per URL needing update)
**Rebuild:** Required (sitemap is copied into `build/` by CRA)

**Pattern per edit:**
```xml
BEFORE:
    <loc>https://www.mygenie.online/solutions/restaurants</loc>
    <lastmod>2026-08-24</lastmod>

AFTER:
    <loc>https://www.mygenie.online/solutions/restaurants</loc>
    <lastmod>2026-09-04</lastmod>
```

**Note:** `/solutions/ice-cream-desserts` lastmod should be updated to 2026-09-05
only AFTER CR-210 (H1 fix) is implemented. If done before, update to 2026-09-04 now
and re-update to 2026-09-05 after CR-210.

---

## 6. Can Combine With Other CRs

CR-214 touches only `sitemap.xml`. It can be bundled into the same build as any
other pending CR (CR-210, CR-211, CR-213) with no conflicts.

Ideal build order:
1. CR-210 (ice cream H1 — `sectors.js`)
2. CR-211 (preconnect hints — `index.html`)
3. CR-213 (nameSingular — `sectors.js` + `SectorPage.jsx`)
4. CR-214 (sitemap lastmod — `sitemap.xml`)
5. One rebuild covers all four

---

## 7. Post-build Validation

```bash
# Confirm sector lastmod dates updated in built sitemap
grep -A2 "solutions/restaurants" /app/frontend/build/sitemap.xml | grep lastmod
# Expected: 2026-09-04

grep -A2 "solutions/ice-cream" /app/frontend/build/sitemap.xml | grep lastmod
# Expected: 2026-09-04 (or 2026-09-05 if CR-210 done first)

# Confirm count unchanged (still 59 URLs)
grep -c "<url>" /app/frontend/build/sitemap.xml
# Expected: 59
```

---

## 8. Summary

| Item | Detail |
|---|---|
| Sitemap completeness | ✅ **100% complete — no missing or extra pages** |
| Issue | Stale `lastmod` on 11 sector pages + homepage after CR-187/189/208 |
| File changed | `public/sitemap.xml` only |
| Edits | 12 lastmod date updates |
| Rebuild required | Yes |
| Risk | Zero — date-only changes |

*Registered 2026-09-05. Sitemap completeness audit + stale lastmod analysis. E1 Agent.*
