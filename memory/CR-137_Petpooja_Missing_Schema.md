# CR-137 — PetpoojaAlternative.jsx Has No Structured Data

**Type:** Schema / Structured Data
**Date Raised:** 2026-08-24
**Raised By:** SEO Tag Audit 2026-08-24
**Status:** OPEN
**Priority:** P2 — MEDIUM
**Effort:** ~15 min
**Improves:** SEO · Schema · Ad Quality Score (LP Experience) · Rich Results
**Scope:** `frontend/src/pages/PetpoojaAlternative.jsx`
**Related:** CR-85 (restaurant-billing-software LP), CR-86 (restaurant-pos LP), CR-91 (BreadcrumbList)

---

## 1. Problem Statement

`PetpoojaAlternative.jsx` renders a `<Seo>` call with no `jsonLd` prop:

```jsx
// PetpoojaAlternative.jsx line ~1003 (current)
<Seo
  title="Best Petpooja Alternative for Restaurants — MyGenie POS"
  description="Comparing Petpooja with MyGenie?..."
  path="/petpooja-alternative"
/>
```

This is the highest-intent competitor comparison landing page — it targets users who are actively evaluating POS software. It has:
- A detailed FAQ section → eligible for FAQPage / QAPage schema
- A pricing section → eligible for SoftwareApplication + Offer schema
- No structured data at all currently

Google can extract zero machine-readable signals from this page despite it being heavily optimised for a commercial keyword.

---

## 2. Exact Fix

The page has an FAQ section. Add `FAQPage` (or `QAPage` per CR-106 guidance) + `SoftwareApplication` entity.

### Step 1 — Add imports to `PetpoojaAlternative.jsx`

Current import (approximate):
```jsx
import { PAGE_SEO, SITE_URL } from "@/lib/seo";
// or whatever seo imports exist
```

Add:
```jsx
import { SOFTWARE_APP_JSONLD, SITE_URL } from "@/lib/seo";
```

### Step 2 — Define FAQPage JSON-LD (before return statement)

Inspect the page's FAQ section to extract the Q&A pairs, then add:
```jsx
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PETPOOJA_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};
```

(Exact variable name for FAQs to be confirmed by reading the component.)

### Step 3 — Add jsonLd prop to Seo call

```jsx
<Seo
  title="Best Petpooja Alternative for Restaurants — MyGenie POS"
  description="Comparing Petpooja with MyGenie?..."
  path="/petpooja-alternative"
  jsonLd={[faqJsonLd, SOFTWARE_APP_JSONLD]}
/>
```

---

## 3. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `frontend/src/pages/PetpoojaAlternative.jsx` | Add FAQ JSON-LD + SoftwareApplication + pass to Seo | ~10 new lines |

---

## 4. Pre-Implementation Note

Before implementing, read `PetpoojaAlternative.jsx` to locate:
- The FAQ section data structure (variable name, shape)
- Whether FAQs are hardcoded or from a data file
- Confirm `SOFTWARE_APP_JSONLD` import doesn't conflict with existing imports

---

## 5. Definition of Done

- [ ] `/petpooja-alternative` emits FAQPage + SoftwareApplication JSON-LD
- [ ] Google Rich Results Test: valid FAQPage schema on `/petpooja-alternative`
- [ ] No visual regression

---

*CR-137 registered 2026-08-24. Source: SEO Tag Audit. Requires reading the component before implementing.*
