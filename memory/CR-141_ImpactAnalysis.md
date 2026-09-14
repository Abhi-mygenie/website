# CR-141 — Impact Analysis: Sector Name Lowercase Template Bug

**Date:** 2026-08-24
**Files read:** `sectors.js` (name fields), `SectorPage.jsx` (5 toLowerCase usages)
**Status:** Analysis complete — no code changed

---

## 1. Scope Correction — Bug Affects 6 Sectors, Not 1

The original CR-141 registration identified only QSR. Full analysis reveals **6 of 11 sectors** are affected:

| Sector | `s.name` | `s.name.toLowerCase()` | Broken mid-sentence? |
|--------|----------|----------------------|---------------------|
| QSR | `"QSR / Fast Food"` | `"qsr / fast food"` | ❌ slash + all-lowercase acronym |
| Hotels & Resorts | `"Hotels & Resorts"` | `"hotels & resorts"` | ❌ `&` in sentence |
| Canteens & Mess | `"Canteens & Mess"` | `"canteens & mess"` | ❌ `&` in sentence |
| Chains & Franchises | `"Chains & Franchises"` | `"chains & franchises"` | ❌ `&` in sentence |
| Bars & Pubs | `"Bars & Pubs"` | `"bars & pubs"` | ❌ `&` in sentence |
| Ice Cream & Desserts | `"Ice Cream & Desserts"` | `"ice cream & desserts"` | ❌ `&` in sentence |
| Restaurants | `"Restaurants"` | `"restaurants"` | ✅ |
| Cafés | `"Cafés"` | `"cafés"` | ✅ |
| Cloud Kitchens | `"Cloud Kitchens"` | `"cloud kitchens"` | ✅ |
| Food Courts | `"Food Courts"` | `"food courts"` | ✅ |
| Bakeries | `"Bakeries"` | `"bakeries"` | ✅ |

**Total broken: 6 sectors × 5 usages = 30 broken instances in prerendered HTML**

---

## 2. Exact Problem — 5 Usages in SectorPage.jsx

All 5 `.toLowerCase()` usages, with line numbers:

| Line | Template | Example output (QSR) |
|------|----------|---------------------|
| 130 | `We know {s.name.toLowerCase()} run on tight margins...` | `"We know qsr / fast food run on tight margins..."` |
| 160 | `Built for the way {s.name.toLowerCase()} actually work.` | `"Built for the way qsr / fast food actually work."` |
| 196 | `Real {s.name.toLowerCase()} results.` | `"Real qsr / fast food results."` |
| 247 | `See MyGenie built for your {s.name.toLowerCase()}.` | `"See MyGenie built for your qsr / fast food."` |
| 248 | `...tailored to {s.name.toLowerCase()} — not a generic demo.` | `"...tailored to qsr / fast food — not a generic demo."` |

Same pattern for Hotels & Resorts: `"We know hotels & resorts run on tight margins..."` etc.

---

## 3. Fix Design

### Approach: Add `nameLower` to affected sectors in `sectors.js`

Add one field per affected sector. Unaffected sectors don't need it. `SectorPage.jsx` uses `s.nameLower` with fallback to `s.name.toLowerCase()`.

**`sectors.js` — add `nameLower` to 6 affected entries:**

```js
"qsr": {
  name: "QSR / Fast Food",
  nameLower: "QSR & fast food outlets",   // ← ADD
  ...
}
"hotels-resorts": {
  name: "Hotels & Resorts",
  nameLower: "hotels and resorts",         // ← ADD
  ...
}
"canteens": {
  name: "Canteens & Mess",
  nameLower: "canteens and mess halls",    // ← ADD
  ...
}
"chains": {
  name: "Chains & Franchises",
  nameLower: "chains and franchises",      // ← ADD
  ...
}
"bars-pubs": {
  name: "Bars & Pubs",
  nameLower: "bars and pubs",              // ← ADD
  ...
}
"ice-cream-desserts": {
  name: "Ice Cream & Desserts",
  nameLower: "ice cream and dessert outlets", // ← ADD
  ...
}
```

**`SectorPage.jsx` — 5 usages, each: `s.name.toLowerCase()` → `s.nameLower || s.name.toLowerCase()`**

Result for QSR:
- `"We know QSR & fast food outlets run on tight margins..."` ✅
- `"Built for the way QSR & fast food outlets actually work."` ✅
- `"Real QSR & fast food outlets results."` → adjust: `"Real QSR & fast food outlet results."` (owner refine later)

---

## 4. Pre-Implementation Check — Exact Line Positions in sectors.js

Need to verify exact line numbers for each affected sector entry before implementing. Run:

```bash
grep -n '"qsr"\|"hotels-resorts"\|"canteens"\|"chains"\|"bars-pubs"\|"ice-cream-desserts"' \
  /app/frontend/src/data/sectors.js
```

Each `nameLower` field is inserted as the second property (after `name:`).

---

## 5. Forms Safety

`sectors.js` is a pure data file — no imports from it, no form logic, no API calls. `SectorPage.jsx` changes are in template string expressions inside `<h2>` and `<p>` tags — completely separate from `<DemoForm>`, `<StickyMobileCta>`, and all form logic.

**Zero form risk.**

---

## 6. CMS Safety

`s.name` is used directly (unchanged) for:
- `seoTitle` (line 62) — title stays correct
- BreadcrumbList `name` (line 74) — stays correct
- Hero CTA text `"Book a {s.name} Demo"` (line 100) — stays correct
- Demo form `sector={s.name}` (line 263) — stays correct

`nameLower` only replaces `.toLowerCase()` in body section headings — exactly the broken strings.

---

## 7. Owner Input Needed

The `nameLower` values proposed above are suggestions. Owner should confirm or revise the natural English forms before implementation, especially for QSR which could be:
- `"QSR & fast food outlets"` (our suggestion)
- `"quick service restaurants"` (more natural English)
- `"QSR restaurants"` (brief)

All other sectors: `"hotels and resorts"`, `"chains and franchises"`, etc. are straightforward.

---

## 8. Change Summary

| File | Change | Lines |
|------|--------|-------|
| `src/data/sectors.js` | Add `nameLower` field to 6 sector entries | +6 lines |
| `src/pages/SectorPage.jsx` | 5 usages: `s.name.toLowerCase()` → `s.nameLower \|\| s.name.toLowerCase()` | 5 edits |
| **Total** | | **+6 lines, 5 edits** |

Requires `yarn build` + `prerender.js` (6 sector pages need re-prerender).

---

*CR-141 impact analysis written 2026-08-24. Scope corrected: 6 sectors affected (not 1).*
