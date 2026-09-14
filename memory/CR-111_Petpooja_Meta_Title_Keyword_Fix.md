# CR-111 — Fix Petpooja Alternative Meta Title: Add "Petpooja Alternative" Keyword

**Type:** On-Page SEO / Keyword Relevance  
**Date Raised:** 2026-08-20  
**Raised By:** Batch 3 Planning Review (gap identified during CR-75 implementation planning)  
**Status:** IMPLEMENTED — 2026-08-20  
**Priority:** CRITICAL  
**Plan ID:** C-111 (appended to Batch 3)  
**Effort:** 2 min  
**Improves:** QS Ad Relevance · SEO · Organic CTR  
**Scope:** `frontend/src/pages/PetpoojaAlternative.jsx` (line 662)  
**Related:** CR-75 (Petpooja H1 keyword), CR-83 (H1 on product/sector pages)

---

## 1. Problem Statement

The `/petpooja-alternative` page `<title>` tag reads:

> `MyGenie vs Petpooja — The honest POS comparison | MyGenie`

The page's primary target keyword is **"Petpooja alternative"** — confirmed by the URL slug, the ad campaign, and the CR-75 H1 fix. The meta title contains "vs Petpooja" and "comparison" but **never the word "alternative"**.

Google Ads Quality Score evaluates keyword relevance across: ad copy → landing page title tag → H1 → body copy. CR-75 fixes the H1. This CR fixes the title tag — the same signal, one level up.

For organic search, the title tag is also the primary SERP headline. A searcher who types "Petpooja alternative" sees no keyword match in the result title — lower CTR.

---

## 2. Root Cause

**`frontend/src/pages/PetpoojaAlternative.jsx` — line 662:**
```jsx
<Seo
  title="MyGenie vs Petpooja — The honest POS comparison | MyGenie"
  description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
  path="/petpooja-alternative"
/>
```

No "alternative" keyword in the title string. Identified as a gap during Batch 3 planning — not covered by any of the 41 originally registered CRs (CR-70 to CR-110).

---

## 3. Exact Change Required

**`frontend/src/pages/PetpoojaAlternative.jsx` — line 662:**

```jsx
// BEFORE
title="MyGenie vs Petpooja — The honest POS comparison | MyGenie"

// AFTER
title="Best Petpooja Alternative for Restaurants — MyGenie POS"
```

**Why this title:**
- Leads with the primary keyword ("Petpooja Alternative") — matches search intent exactly
- "for Restaurants" — narrows audience, improves CTR quality
- "MyGenie POS" — brand + product category at the end
- Under 60 characters — won't be truncated in SERP

**Meta description:** No change needed — already contains "Comparing Petpooja", "switched", and "Book a free demo". It's solid.

---

## 4. Files Changed

| File | Line | Change |
|---|---|---|
| `frontend/src/pages/PetpoojaAlternative.jsx` | 662 | Update `title` prop in `<Seo>` component |

---

## 5. Definition of Done

- [ ] `<title>` tag on `/petpooja-alternative` contains "Petpooja Alternative"
- [ ] Title is under 60 characters
- [ ] Meta description unchanged
- [ ] No other SEO tags affected

---

## 6. Gap Registration Note

This CR was not in the original 41-CR audit plan. Identified during Batch 3 implementation planning (2026-08-20) when the full Petpooja page SEO content was reviewed. The H1 (CR-75) and title tag (this CR) both needed the same keyword — caught before implementation began.

Two additional gaps also identified but deferred to separate CRs:
- Petpooja H2 keyword improvements (unregistered — to be raised as CR-112)
- Petpooja page JSON-LD schema (unregistered — to be raised as CR-113)

---

*CR-111 registered 2026-08-20. Gap found during Batch 3 planning review. Folded into Batch 3.*
