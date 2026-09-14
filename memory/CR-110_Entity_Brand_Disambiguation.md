# CR-110 — Strengthen Entity / Brand Disambiguation for "MyGenie"

**Type:** GEO / Entity SEO  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit (GAP-7 — missing from original plan)  
**Status:** OPEN  
**Priority:** LOW  
**Plan ID:** L10 (GAP-7)  
**Effort:** 1 day  
**Improves:** GEO · Entity SEO · AI Search  
**Scope:** `frontend/src/lib/seo.js` + external (Wikidata, Google Business)  
**Related:** CR-108 (brand citation), CR-103 (llms.txt)

---

## 1. Problem Statement

The audit found **"Weak entity/brand disambiguation — 'MyGenie' is a generic-sounding name"** as a Medium severity GEO finding. "MyGenie" could be confused with unrelated services or products using the same name. Google's Knowledge Graph and AI answer engines need clear entity signals to consistently identify and cite the correct "MyGenie."

This was **missing from the original plan** (GAP-7).

---

## 2. Changes Required

### Change 1 — `frontend/src/lib/seo.js` — Enrich ORG_JSONLD
Add disambiguation and entity-specific fields:
```js
export const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.mygenie.online/#organization",  // ← ADD: stable entity ID
  name: "MyGenie POS",
  alternateName: "MyGenie",                             // ← ADD
  description: "MyGenie POS is a hospitality operating system for restaurants, cafes, cloud kitchens and hotels in India. It provides billing, inventory, CRM, loyalty, and AI features in one mobile-first platform.",  // ← ADD
  foundingDate: "2022",                                // ← ADD
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo.svg`,
  sameAs: [
    "https://www.youtube.com/channel/UCLY6mrxYUCJu5Qhcz_TDCLw",
    "https://www.facebook.com/people/MyGenie8/61564310132220/",
    // ← ADD when available:
    // "https://www.wikidata.org/wiki/Q[ID]",
    // "https://www.g2.com/products/mygenie-pos",
    // "https://www.capterra.com/p/[ID]/mygenie-pos/",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-9104743156",
    contactType: "customer support",
    email: process.env.REACT_APP_SUPPORT_EMAIL || "support@mygenie.online",
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],  // ← ADD
  },
};
```

### Change 2 — Google Business Profile
Ensure the Google Business Profile for MyGenie Technologies Pvt. Ltd. is:
- Claimed and verified
- Category: "Software Company" or "Business Software Supplier"
- Description explicitly mentions "restaurant POS", "hospitality operating system", "India"
- Website matches www.mygenie.online

### Change 3 — Consistent brand descriptor site-wide
Wherever "MyGenie" appears as a standalone word in meta descriptions, schema, and page copy, replace with "MyGenie POS" or "MyGenie Hospitality Operating System" to reduce ambiguity.

Affected files to audit:
- `frontend/src/lib/seo.js` (PAGE_SEO descriptions)
- `frontend/src/data/content.js` (METRICS, BEFORE_AFTER)
- `frontend/src/data/company.js` (COMPANY.tagline)

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/lib/seo.js` | Enrich ORG_JSONLD with @id, description, foundingDate, areaServed, availableLanguage |
| `frontend/src/lib/seo.js` | Add review platform sameAs URLs when available (post CR-108) |
| Google Business Profile | Claim + complete (external action) |

---

## 4. Definition of Done

- [ ] ORG_JSONLD has @id, description, foundingDate, areaServed fields
- [ ] Google Business Profile claimed and complete
- [ ] sameAs array includes at least 3 external authoritative URLs (after CR-108 review platforms are set up)
- [ ] Searching "MyGenie POS" in Google returns Knowledge Panel with correct information

---

*CR-110 registered 2026-08-20. Source: SEO & QS Audit (GAP-7) · Plan ID L10. Depends on CR-108 (review platform profiles).*
