# CR-99 — Expand Thin Product/Sector Pages with Vertical-Specific Content

**Type:** Content Quality / SEO Depth  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M11  
**Effort:** 1 week (content)  
**Improves:** SEO · E-E-A-T  
**Scope:** `frontend/src/data/products.js`, `frontend/src/data/sectors.js`  
**Related:** CR-83 (H1 keyword fixes), CR-96 (GST/aggregator mentions)

---

## 1. Problem Statement

All solution and product pages average ~250 words of content — below the threshold for competitive keyword ranking. The content is template-generated: the `SectorPage` and `ProductPage` components dynamically render from `sectors.js` and `products.js` data objects, each containing 4 pain points, 4 solutions, 2 proof cards, and 3 FAQs.

For competitive keywords like “cloud kitchen POS” or “restaurant billing software”, Google expects depth: India-specific context, integration details, pricing context, and multiple proof points.

---

## 2. Pages to Expand (Priority Order)

### Priority 1 — Cloud Kitchens (`sectors.js`)
- Add 2 more pain points: “Aggregator commission eating into margins”, “No real-time menu sync across brands”
- Add 2 more solutions: “Direct ordering link (zero commission)”, “Live menu sync across all aggregators”
- Add 1 more proof card with specific metric
- Add 2 more FAQs: “How does MyGenie handle commission-free orders?”, “Can I sync menus across Swiggy and Zomato simultaneously?”
- Sub-headline: add explicit mention of GST billing and aggregator sync

### Priority 2 — Sell & Serve (`products.js`)
- Add 1 more module: “Multi-currency / foreign guest billing” (relevant for hotels)
- Expand module descriptions with India-specific detail (Swiggy/Zomato sync in Takeaway & Delivery module)
- Add 2 more FAQs on offline mode and scan-to-order

### Priority 3 — See Everything (`products.js`)
- Add WhatsApp report example content (what fields are in the daily report)
- Add 1 more proof card
- Add FAQ: “Can the owner see real-time data from multiple cities?”

### Priority 4 — Remaining 8 sectors
- Add at least 1 India-specific detail per sector (mention UPI, GST, local aggregators)
- Minimum 2 proof cards per sector (some currently have only 2 — acceptable, but add a third where possible)

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/data/sectors.js` | Expand cloud-kitchens and other sectors |
| `frontend/src/data/products.js` | Expand sell-serve and see-everything |

**Note:** This is primarily content work, not code work. No component changes needed — the page templates already support arbitrary numbers of pains, solutions, FAQs, and proof cards.

---

## 4. Definition of Done

- [ ] Cloud-kitchens sector page: ≥6 pain points, ≥6 solutions, ≥4 FAQs, 3 proof cards
- [ ] Sell-serve product page: ≥7 modules, ≥5 FAQs
- [ ] All priority pages mention GST, UPI, or aggregator integration where relevant
- [ ] Word count per page: target 400+ words of rendered body content

---

*CR-99 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M11.*
