# CR-158 — /product H1 Keyword Fix

**Type:** SEO / Keyword Relevance
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P2 — CMS edit (no deploy needed)
**Finding:** #5 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

`/product` H1 (via `ProductIndex.jsx` L38):
```
"Every tool your business needs — in one operating system."
```

Eyebrow (L35):
```
"Everything in one app"
```

Neither contains restaurant, POS, billing, hospitality, or any product keyword. Organic searches landing on `/product` (e.g. "restaurant management app features", "restaurant POS features") see no keyword confirmation above the fold.

---

## 2. Fix — Update fallback text (or CMS edit)

**Both fields are CMS-editable** via `EditableText`. No deploy required for live value change.

**Option A — CMS edit only (instant, no deploy):**
Go to `/leads` → CMS editor → edit:
- `product.index.hero.eyebrow` → `"Restaurant POS features"`
- `product.index.hero.h1` → `"One restaurant operating system — every tool included."`

**Option B — Code change (fallback update):**

**File:** `frontend/src/pages/ProductIndex.jsx`

```jsx
// BEFORE:
fallback="Everything in one app"     // eyebrow, L35
fallback="Every tool your business needs — in one operating system."  // H1, L38

// AFTER:
fallback="Restaurant POS features"   // eyebrow
fallback="One restaurant operating system — every tool included."    // H1
```

**Why Option A is preferred:** The CMS live value takes precedence over the code fallback. Option A can be done without a code deploy, PR, or prerender cycle. Option B is a belt-and-suspenders update to keep the fallback in sync.

---

## 3. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/pages/ProductIndex.jsx` | EDIT eyebrow + H1 fallback text | L35, L38: 2 lines |

**OR:** CMS admin edit only — zero code change.

---

## 4. Definition of Done

- [ ] `/product` H1 contains "restaurant" or "restaurant operating system"
- [ ] Eyebrow contains "Restaurant POS" or "restaurant"
- [ ] Change reflected in prerendered HTML (if via code, run `yarn build && node scripts/prerender.js`)
- [ ] If CMS edit: published via CMS admin

*CR-158 registered 2026-08-26. Source: UX/SEO Audit Finding #5.*
