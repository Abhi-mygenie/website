# CR-141 — QSR Sector Lowercase Template Bug ("qsr / fast food" mid-sentence)

**Type:** Content Quality / SEO / UX
**Date Raised:** 2026-08-24
**Raised By:** Crawlability Audit — August 2026
**Status:** OPEN
**Priority:** LOW-MEDIUM
**Effort:** ~10 min
**Improves:** Content Quality · E-E-A-T · SERP appearance
**Scope:** `frontend/src/data/sectors.js`, `frontend/src/pages/SectorPage.jsx`
**Related:** CR-83 (H1 keyword relevance), CR-99 (thin sector pages)

---

## 1. Problem Statement

The audit flagged 5+ instances of the text `"qsr / fast food"` appearing broken in the QSR sector page. Investigation revealed 13 instances of the `qsr / fast food` pattern in the prerendered HTML.

**Root cause:** The sector name is `"QSR / Fast Food"` in `sectors.js`. Throughout `SectorPage.jsx`, the name is used with `.toLowerCase()` in sentence templates:

```jsx
// SectorPage.jsx — multiple locations
<h2>We know {s.name.toLowerCase()} run on tight margins...</h2>
// → "We know qsr / fast food run on tight margins..."  ❌

<h2>Built for the way {s.name.toLowerCase()} actually work.</h2>
// → "Built for the way qsr / fast food actually work."  ❌

<h2>Real {s.name.toLowerCase()} results.</h2>
// → "Real qsr / fast food results."  ❌

<h2>See MyGenie built for your {s.name.toLowerCase()}.</h2>
// → "See MyGenie built for your qsr / fast food."  ❌
```

This affects ALL section headings on the QSR page and appears in the prerendered HTML, making it visible to Google and users.

**Likely affected pages:** QSR is the most visible case. Any sector with a `/` or special formatting in the name would have the same issue. Current sector names: "QSR / Fast Food" is the only one with a slash.

---

## 2. Exact Fix

### Option A — Add `nameLower` field to the QSR sector object (targeted fix)

```js
// sectors.js — qsr entry
"qsr": {
  name: "QSR / Fast Food",
  nameLower: "QSR restaurants",   // ← ADD — used in sentence templates
  icon: "Sandwich",
  ...
}
```

Then in `SectorPage.jsx`, replace `s.name.toLowerCase()` with `s.nameLower || s.name.toLowerCase()`:
```jsx
<h2>We know {s.nameLower || s.name.toLowerCase()} run on tight margins...</h2>
// → "We know QSR restaurants run on tight margins..."  ✅
```

### Option B — Fix only the QSR name to not include slash

```js
// sectors.js
"qsr": {
  name: "QSR & Fast Food",   // Replace / with & — reads better mid-sentence
  ...
}
```
→ `"qsr & fast food"` still lowercase but no broken slash. Simpler fix.

**Recommended: Option B** — one word change in `sectors.js`, no JSX changes needed. `"QSR & Fast Food"` reads correctly in sentence: `"We know qsr & fast food run on tight margins..."`.

However Option A is more precise since `"QSR & Fast Food"` lowercase is still unnatural. For best copy quality, Option A with `nameLower: "QSR outlets"` is cleaner.

---

## 3. Files Changed

| File | Option A | Option B |
|------|----------|----------|
| `frontend/src/data/sectors.js` | Add `nameLower` to qsr entry | Change `name` value |
| `frontend/src/pages/SectorPage.jsx` | Update 4 template usages | No change |

---

## 4. Definition of Done

- [ ] `/solutions/qsr` prerendered page has no `"qsr / fast food"` pattern mid-sentence
- [ ] Section headings read naturally in sentence context
- [ ] Page title and H1 are unaffected (they use `s.name` directly, not `.toLowerCase()`)
- [ ] No other sector pages regressed

---

*CR-141 registered 2026-08-24. Source: Crawlability Audit August 2026. Content quality issue visible in prerendered HTML.*
