# CR-106 — Review and Retire/Replace FAQPage Schema (Deprecated May 2026)

**Type:** Schema Maintenance  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** LOW  
**Plan ID:** L6  
**Effort:** 1 hr  
**Improves:** Schema Hygiene  
**Scope:** `frontend/src/pages/ProductPage.jsx`, `frontend/src/pages/SectorPage.jsx`  
**Related:** CR-91 (BreadcrumbList), CR-80 (SoftwareApplication schema)

---

## 1. Problem Statement

Google retired FAQPage rich results on **May 7, 2026**. `ProductPage.jsx` and `SectorPage.jsx` both generate `FAQPage` JSON-LD for their FAQ sections. This schema is no longer producing any visible SERP enhancement.

The markup itself is harmless to leave (confirmed by Google). The question is whether to replace it with more valuable schema types.

---

## 2. Options

### Option A (Minimal) — Leave as-is
FAQPage JSON-LD is harmless. No action required. Close this CR.

### Option B (Opportunistic) — Replace with QAPage
For pages where FAQ items are written as genuine Q&A, `QAPage` schema may provide AI Overview citation opportunities:
```js
// Replace FAQPage type with QAPage
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "QAPage",
  mainEntity: p.faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a }
  }))
};
```

### Option C — Replace with HowTo
For FAQ items that describe steps or processes, `HowTo` schema may be more appropriate.

**Recommendation:** Option A for now. Revisit when AI Overview schema guidelines are clearer in Q4 2026. No urgency.

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/ProductPage.jsx` | Optional: change FAQPage to QAPage |
| `frontend/src/pages/SectorPage.jsx` | Optional: change FAQPage to QAPage |

---

## 4. Definition of Done

- [ ] Decision made: leave as FAQPage or migrate to QAPage
- [ ] If migrated: Rich Results Test confirms valid QAPage schema
- [ ] No other schema broken (test with all JSON-LD in scope)

---

*CR-106 registered 2026-08-20. Source: SEO & QS Audit · Plan ID L6. Low urgency.*
