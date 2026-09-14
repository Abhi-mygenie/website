# CR-171 — Homepage FAQ Section + QAPage Schema

**Type:** SEO / Schema / Content
**Date Raised:** 2026-08-30
**Status:** OPEN
**Priority:** P1
**Source:** SEO audit — missing FAQPage schema on homepage (rich result opportunity)

---

## 1. Problem

Homepage (`Home.jsx`) passes only `[ORG_JSONLD, SOFTWARE_APP_JSONLD]` to `<Seo>`.
No FAQ content section and no FAQ schema exist on the homepage.

FAQPage/QAPage rich results expand SERP listing to 3–5× normal height — directly lifting CTR.

### ⚠️ Schema type note (CR-106 precedent)

CR-106 (2026-08-23) migrated `SectorPage.jsx` from `FAQPage` to `QAPage` because Google
deprecated FAQPage rich results for most pages in May 2026. However:
- LP pages (RestaurantPosSystem, RestaurantBillingSoftware, etc.) still use `FAQPage` — still indexed
- Google has NOT fully removed FAQPage from its rich results; it's de-prioritised, not dead
- **Recommendation:** use `QAPage` schema (per CR-106 precedent) but still add the visible FAQ section

---

## 2. Fix — Two Parts

### Part A — Visible FAQ section (new component or inline in Home.jsx)

Add 6–8 Q&A items below the pricing section on homepage. Suggested Q&As:

1. **What is MyGenie POS?** — A hospitality operating system for restaurants, cafes, cloud kitchens and hotels. Billing, kitchen, inventory, CRM, AI insights and loyalty in one platform.
2. **How much does MyGenie POS cost?** — Plans start at ₹799/outlet/month (Starter). Growth at ₹1,299 and Pro at ₹2,499.
3. **How long does setup take?** — Most restaurants go live within 48 hours with free data migration included.
4. **Does MyGenie work offline?** — Yes. Billing, KOT and order management all work without internet. Data syncs when connectivity restores.
5. **Is there a lock-in contract?** — No. Monthly or annual subscription, cancel anytime. Data is fully exportable.
6. **Does MyGenie integrate with Swiggy and Zomato?** — Yes. Direct integrations with Swiggy, Zomato, Razorpay and major aggregators.

### Part B — QAPage JSON-LD schema

```js
export const HOMEPAGE_QA_JSONLD = {
  "@context": "https://schema.org",
  "@type": "QAPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is MyGenie POS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MyGenie POS is a hospitality operating system for restaurants, cafes, cloud kitchens and hotels. It combines billing, kitchen display, inventory, CRM, AI insights and customer loyalty in one platform starting at ₹799/outlet/month."
      }
    },
    // ... remaining Q&As
  ]
};
```

Add `HOMEPAGE_QA_JSONLD` to `jsonLd` array in `Home.jsx`:
```jsx
<Seo ... jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD, HOMEPAGE_QA_JSONLD]} />
```

---

## 3. Files to Change

| File | Change |
|---|---|
| `frontend/src/lib/seo.js` | Add `HOMEPAGE_QA_JSONLD` export |
| `frontend/src/pages/Home.jsx` | Import + add to `jsonLd` array; add visible FAQ section |

---

## 4. Definition of Done

- [ ] Homepage has a visible FAQ section with ≥6 Q&A items
- [ ] `QAPage` JSON-LD present in prerendered `build/index.html`
- [ ] Schema validates in Google Rich Results Test
- [ ] Section placed below pricing section (does not displace above-fold content)

*CR-171 registered 2026-08-30. Source: SEO audit. Use QAPage (not FAQPage) per CR-106 precedent.*
