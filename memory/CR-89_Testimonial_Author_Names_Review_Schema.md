# CR-89 — Add Individual Owner Names + Review Schema to Testimonials

**Type:** Content Quality / Schema / E-E-A-T  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M1  
**Effort:** 3 hrs  
**Improves:** Trust · E-E-A-T · Schema · SEO  
**Scope:** `frontend/src/data/content.js`, `frontend/src/components/home/ProofSection.jsx`, `frontend/src/pages/SuccessStories.jsx`  
**Related:** CR-88 (blog authors), CR-80 (SoftwareApplication schema)

---

## 1. Problem Statement

Testimonials currently have business names (“Palm Forest Resort”) but no individual person names or designations. Google E-E-A-T rewards first-person testimonials with named, verifiable reviewers. The `/customers` page has no `Review` or `AggregateRating` schema — missing a significant structured data opportunity.

**Audit note corrected:** Testimonials are NOT “fully anonymized” (they have business names) but they DO lack person names, job titles, and schema markup.

---

## 2. Exact Changes Required

### Change 1 — `frontend/src/data/content.js` — TESTIMONIALS
Add `ownerName` and `designation` fields (owner to supply actual names):
```js
export const TESTIMONIALS = [
  {
    metric: "₹1 Lakh",
    headline: "fraud caught in 2 weeks",
    quote: "A cashier was cancelling items after payment...",
    client: "Rhino",
    sector: "Restaurant",
    ownerName: "[Owner Name]",       // ← ADD — owner to supply
    designation: "Owner, Rhino Restaurant",  // ← ADD
    img: null,
  },
  // ... same pattern for all testimonials
];
```

### Change 2 — `frontend/src/components/home/ProofSection.jsx`
Render owner name and designation below the business name:
```jsx
<span className="font-semibold text-brand-ink">{t.client}</span>
{t.ownerName && (
  <span className="block text-xs text-brand-muted">{t.ownerName}, {t.designation}</span>
)}
```

### Change 3 — `frontend/src/pages/SuccessStories.jsx`
Same render update in the testimonial cards.

### Change 4 — Add Review + AggregateRating JSON-LD to /customers
In `SuccessStories.jsx`, pass jsonLd to `<Seo>`:
```js
const reviewsJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MyGenie POS",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    reviewCount: "500",
    bestRating: "5",
    worstRating: "1",
  },
  review: TESTIMONIALS.filter(t => t.ownerName).map(t => ({
    "@type": "Review",
    author: { "@type": "Person", name: t.ownerName },
    reviewBody: t.quote,
    name: t.headline,
    reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
  })),
};
```

---

## 3. Dependency

Owner must supply individual names and designations before this CR can be fully implemented. The code changes can be done without the data — fields will render only when populated.

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/data/content.js` | Add `ownerName` + `designation` to TESTIMONIALS |
| `frontend/src/components/home/ProofSection.jsx` | Render owner name/designation |
| `frontend/src/pages/SuccessStories.jsx` | Render owner name/designation + Review JSON-LD |

---

## 5. Definition of Done

- [ ] TESTIMONIALS data has ownerName + designation for all 3 homepage testimonials
- [ ] Owner names render below business names in ProofSection and SuccessStories
- [ ] Review + AggregateRating JSON-LD valid in Rich Results Test
- [ ] No visual regression

---

*CR-89 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M1.*
