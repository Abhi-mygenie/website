# CR-83 — Update H1s for Keyword Relevance: sell-serve, see-everything, cloud-kitchens

**Type:** On-Page SEO / Keyword Relevance  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** IMPLEMENTED — 2026-08-21 (Phase 1: restaurants, qsr, cloud-kitchens + Phase 2: cafes, hotels-resorts, food-courts, canteens, chains, bars-pubs, bakeries, ice-cream-desserts + products: sell-serve, run-property, customers, protect-profit, see-everything, central-inventory)  
**Excel audit file:** `/app/frontend/public/CR-83-H1-Audit.csv`  
**Audit doc:** `/app/memory/AUDIT_CR83_CR80_CR87_2026-08-21.md`
**Priority:** HIGH  
**Plan ID:** H4  
**Effort:** 20 min  
**Improves:** SEO · QS · Keyword Relevance  
**Scope:** `frontend/src/data/products.js`, `frontend/src/data/sectors.js`  
**Related:** CR-75 (petpooja H1), CR-88/89 (new dedicated LPs)

---

## 1. Problem Statement

Three ad-targeted pages have H1s written in pure brand-voice with zero searchable keywords:

| Page | Ad Group Keyword | Current H1 | Gap |
|---|---|---|---|
| `/product/sell-serve` | “pos software for restaurant” | “Bill in seconds. Serve more covers. Lose zero orders.” | No “POS” or “software” |
| `/product/see-everything` | “restaurant management software” | “Total visibility — every outlet, live, from your phone.” | No “management software” |
| `/solutions/cloud-kitchens` | “cloud kitchen pos” | “Every brand and every aggregator — one screen, one inventory.” | No “cloud kitchen POS” |

Google rewards pages where the H1 directly matches the search query.

---

## 2. Exact Changes Required

### Change 1 — `frontend/src/data/products.js`
```js
// sell-serve
// BEFORE:
h1: "Bill in seconds. Serve more covers. Lose zero orders.",
// AFTER:
h1: "Restaurant POS & Billing Software — serve more covers, lose zero orders.",

// see-everything
// BEFORE:
h1: "Total visibility — every outlet, live, from your phone.",
// AFTER:
h1: "Restaurant management software — total visibility from your phone.",
```

### Change 2 — `frontend/src/data/sectors.js`
```js
// cloud-kitchens
// BEFORE:
h1: "Every brand and every aggregator — one screen, one inventory.",
// AFTER:
h1: "Cloud kitchen POS — every brand and aggregator on one screen.",
```

---

## 3. Files Changed

| File | Field | Change |
|---|---|---|
| `frontend/src/data/products.js` | `sell-serve.h1` | Add “Restaurant POS & Billing Software” |
| `frontend/src/data/products.js` | `see-everything.h1` | Add “Restaurant management software” |
| `frontend/src/data/sectors.js` | `cloud-kitchens.h1` | Add “Cloud kitchen POS” |

---

## 4. Definition of Done

- [ ] H1 on /product/sell-serve contains “Restaurant POS”
- [ ] H1 on /product/see-everything contains “restaurant management software”
- [ ] H1 on /solutions/cloud-kitchens contains “Cloud kitchen POS”
- [ ] Brand voice maintained — headlines still read naturally
- [ ] CMS EditableText still allows admin override (no change to component logic)

---

*CR-83 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H4.*
