# CR-172 — AggregateRating on SoftwareApplication Schema

**Type:** SEO / Schema
**Date Raised:** 2026-08-30
**Status:** OPEN — ⚠️ Requires verified review source before implementing
**Priority:** P1 (blocked on owner providing verified numbers)
**Source:** SEO audit — no aggregateRating on SoftwareApplication schema
**Re-confirmed:** 2026-09-05 — re-identified in investigation of open gaps. File location and fix unchanged.

---

## 1. Problem

`SOFTWARE_APP_JSONLD` in `seo.js` L30–31 has an explicit developer comment:
```js
// AggregateRating deferred — no verified review source.
// Add when Google My Business reviews established.
```

No `aggregateRating` block exists. Star ratings in SERPs lift CTR by 15–30% for
software categories. However, **adding unverified numbers risks a Google manual penalty**
if the rating cannot be cross-referenced with a public review platform.

---

## 2. Fix (once verified source is confirmed)

**File:** `frontend/src/lib/seo.js` — add to `SOFTWARE_APP_JSONLD`:

```js
aggregateRating: {
  "@type": "AggregateRating",
  ratingValue: "4.8",       // ← replace with actual verified value
  reviewCount: "230",       // ← replace with actual verified count
  bestRating: "5",
  worstRating: "1",
},
```

---

## 3. Verified Sources (owner to confirm one)

| Source | How to verify | Notes |
|---|---|---|
| **Google My Business** | Pull from Google Business Profile API or screenshot | Preferred — Google trusts its own data |
| **G2** | Public listing page | Software review site, widely accepted |
| **Capterra** | Public listing page | Widely accepted for SaaS/software |
| **Trustpilot** | Public listing page | Accepted but scrutinised |
| **App Store / Play Store** | Pull rating + review count | Valid for mobile app schema |

Google will cross-reference the `reviewCount` against publicly findable reviews. **Do not use
estimated or internal numbers.**

---

## 4. Files to Change

| File | Change | Line |
|---|---|---|
| `frontend/src/lib/seo.js` | Add `aggregateRating` block to `SOFTWARE_APP_JSONLD` | After L38 |

---

## 5. Owner Action Required

Before this CR can be implemented:
- [ ] Owner confirms verified review platform (Google Business / G2 / Capterra)
- [ ] Owner provides actual `ratingValue` and `reviewCount` from that platform
- [ ] Count must be publicly verifiable (Google will check)

---

## 6. Definition of Done

- [ ] `aggregateRating` block present in `SOFTWARE_APP_JSONLD`
- [ ] `ratingValue`, `reviewCount`, `bestRating` all populated with verified numbers
- [ ] Schema validates in Google Rich Results Test
- [ ] Source URL documented in code comment alongside the schema

*CR-172 registered 2026-08-30. Source: SEO audit. BLOCKED on owner providing verified review source — do not implement with estimated numbers.*
