# CR-80 — Add SoftwareApplication + Offer Schema to /pricing

**Type:** Schema / Structured Data  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H1  
**Effort:** 1 hr  
**Improves:** SEO · Schema · Rich Results eligibility  
**Scope:** `frontend/src/pages/Pricing.jsx`, `frontend/src/lib/seo.js`  
**Related:** CR-95 (BreadcrumbList for Pricing), Marketing brief Issue 5

---

## 1. Problem Statement

`/pricing` — the highest commercial-intent page on the site — has **zero structured data**. The `<Seo>` call in `Pricing.jsx` passes no `jsonLd` prop. Google cannot extract pricing information for rich snippets, Knowledge Panel, or AI Overview citations.

No `SoftwareApplication` entity exists anywhere on the site, meaning Google has no machine-readable description of what MyGenie POS is.

---

## 2. Root Cause

**`frontend/src/pages/Pricing.jsx`:**
```jsx
<Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" />
```
No `jsonLd` prop passed.

**`frontend/src/lib/seo.js` — `ORG_JSONLD`:**
Organization type only — no SoftwareApplication entity.

---

## 3. Exact Changes Required

### Change 1 — `frontend/src/lib/seo.js`
Add a site-wide `SoftwareApplication` entity to export:
```js
export const SOFTWARE_APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MyGenie POS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Point of Sale Software",
  operatingSystem: "Web, Android, iOS",
  description: "MyGenie POS is a hospitality operating system for restaurants, cafes, cloud kitchens and hotels. Billing, inventory, CRM, loyalty, and AI — all in one platform.",
  url: `${SITE_URL}/pricing`,
  offers: [
    {
      "@type": "Offer",
      name: "Starter Plan",
      price: "799",
      priceCurrency: "INR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "799", priceCurrency: "INR", unitText: "per outlet per month" },
      description: "POS & Billing, KOT, Owner Dashboard, Daily Reports",
    },
    {
      "@type": "Offer",
      name: "Growth Plan",
      price: "1299",
      priceCurrency: "INR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "1299", priceCurrency: "INR", unitText: "per outlet per month" },
      description: "Everything in Starter + Captain App, KDS, Online Ordering, CRM",
    },
    {
      "@type": "Offer",
      name: "Pro Plan",
      price: "2499",
      priceCurrency: "INR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "2499", priceCurrency: "INR", unitText: "per outlet per month" },
      description: "Everything in Growth + Loyalty, WhatsApp Automation, all 7 AI features, dedicated account manager",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    reviewCount: "500",
    bestRating: "5",
  },
};
```

### Change 2 — `frontend/src/pages/Pricing.jsx`
```jsx
// Add import
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";

// Update Seo call
<Seo
  title={PAGE_SEO["/pricing"].title}
  description={PAGE_SEO["/pricing"].description}
  path="/pricing"
  jsonLd={[SOFTWARE_APP_JSONLD]}
/>
```

### Change 3 — `frontend/src/pages/Home.jsx`
Also add `SOFTWARE_APP_JSONLD` to the homepage Seo call so the entity is declared on the root page:
```jsx
<Seo title={...} description={...} path="/" jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD]} />
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/lib/seo.js` | Add `SOFTWARE_APP_JSONLD` export with Offer array |
| `frontend/src/pages/Pricing.jsx` | Pass `SOFTWARE_APP_JSONLD` as jsonLd prop to Seo |
| `frontend/src/pages/Home.jsx` | Add `SOFTWARE_APP_JSONLD` to homepage jsonLd array |

---

## 5. Definition of Done

- [ ] Google Rich Results Test passes for /pricing (SoftwareApplication + Offer valid)
- [ ] No schema validation errors in Google Search Console
- [ ] All 3 Offer entries present with correct prices and currencies
- [ ] Schema.org validator confirms valid markup

---

*CR-80 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H1.*
