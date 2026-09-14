# CR-169 — Homepage Meta Description: Shorten from 191 → ≤155 chars

**Type:** SEO / On-Page
**Date Raised:** 2026-08-30
**Status:** OPEN
**Priority:** P1
**Source:** SEO audit — CTA "Book a demo today!" cut off in SERPs

---

## 1. Problem

Current description (`seo.js` `PAGE_SEO["/"].description`):
```
"Boost your restaurant's efficiency with MyGenie POS — a powerful billing and
management software for restaurants, cafes, hotels and food businesses. Boost
profit up to 25%. Book a demo today!"
→ 191 characters
```
Google truncates meta descriptions at ~155–160 chars. The CTA "Book a demo today!"
is always cut off — visitors never see the call to action in SERPs.

---

## 2. Fix

**File:** `frontend/src/lib/seo.js` L87–90

```js
// BEFORE (191 chars):
description:
  "Boost your restaurant's efficiency with MyGenie POS — a powerful billing and management software for restaurants, cafes, hotels and food businesses. Boost profit up to 25%. Book a demo today!",

// AFTER (138 chars):
description:
  "MyGenie POS — powerful billing & restaurant management software for cafes, hotels & cloud kitchens. Boost profit 25%. Book a free demo.",
```

Character count: **138 chars** — fits within 155-char limit with room for Google's pixel variance.
CTA "Book a free demo." is visible in full.

---

## 3. Files to Change

| File | Change | Lines |
|---|---|---|
| `frontend/src/lib/seo.js` | Update `PAGE_SEO["/"].description` | L87–90 |

---

## 4. Definition of Done

- [ ] Meta description in prerendered `build/index.html` ≤ 155 chars
- [ ] "Book a free demo" CTA present and within char limit
- [ ] Keywords retained: billing, restaurant, management, software, cafes, hotels

*CR-169 registered 2026-08-30. Source: SEO audit.*
