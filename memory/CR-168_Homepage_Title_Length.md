# CR-168 — Homepage `<title>`: Shorten from 68 → ≤60 chars

**Type:** SEO / On-Page
**Date Raised:** 2026-08-30
**Status:** OPEN
**Priority:** P1
**Source:** SEO audit — title truncated in Google SERPs

---

## 1. Problem

Current title (`seo.js` `PAGE_SEO["/"].title`):
```
"POS System for Restaurants & Cafes | Best Billing Software - MyGenie"
 → 68 characters
```
Google truncates titles at ~55–60 px (≈60 chars). The brand name "MyGenie" and
"- MyGenie" suffix are cut off in SERPs, harming CTR and brand recognition.

---

## 2. Fix

**File:** `frontend/src/lib/seo.js` L86

```js
// BEFORE:
title: "POS System for Restaurants & Cafes | Best Billing Software - MyGenie",

// AFTER:
title: "Restaurant POS & Billing Software | MyGenie",
```

Character count: **44 chars** — well within the 60-char limit.

Keywords retained: Restaurant, POS, Billing, Software, MyGenie.

---

## 3. Files to Change

| File | Change | Line |
|---|---|---|
| `frontend/src/lib/seo.js` | Update `PAGE_SEO["/"].title` | L86 |

---

## 4. Definition of Done

- [ ] `<title>` in prerendered `build/index.html` = "Restaurant POS & Billing Software | MyGenie"
- [ ] Character count ≤ 60
- [ ] "MyGenie" brand name present and not truncated
- [ ] Primary keywords "Restaurant", "POS", "Billing", "Software" all present

*CR-168 registered 2026-08-30. Source: SEO audit.*
