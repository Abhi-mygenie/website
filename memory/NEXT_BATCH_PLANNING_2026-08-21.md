# Next Batch Planning — CRs Ready for Implementation
**Date:** 2026-08-21  
**Status:** Intake complete on all CRs below. Ready for impact analysis → planning → implementation.

---

## What's Been Completed

| CR | What | Status |
|---|---|---|
| CR-70 | Font loading fix | ✅ Done |
| CR-71 | Hero image fetchPriority | ✅ Done |
| CR-72 | React.lazy code splitting (582→394 kB) | ✅ Done |
| CR-73 | Petpooja footer contacts | ✅ Done |
| CR-74a | StickyMobileCta selector fix (4 testids) | ✅ Done |
| CR-75 | Petpooja H1 keyword | ✅ Done |
| CR-76 | Petpooja trust logos (text→images) | ✅ Done |
| CR-111 | Petpooja meta title keyword | ✅ Done |
| CR-113 | Petpooja mobile UX (navbar CTA + bottom sheet) | ✅ Done |
| shortForm | Petpooja main form 4 fields | ✅ Done |

---

## Parked / Owner Action

| CR | What | Who |
|---|---|---|
| CR-79 | Soft-404 HTTP status fix | Backend team to confirm hosting (Netlify/CF Pages?) |
| Batch 4: CR-77 | Googlebot Cloudflare WAF whitelist | Owner — Cloudflare dashboard |
| Batch 4: CR-78 | Apex→www redirect | Owner — Cloudflare dashboard |
| Env keys | Freshsales, Razorpay, Meta, Calendly, OTP SMS | Owner — .env file |

---

## NEXT BATCH — Proposed Grouping

### Batch A — H1 Keywords Phase 1 (CR-83 Phase 1)
**5 pages · ~30 min · 2 data files only**

| CR | Page | File | Current H1 | Suggested H1 |
|---|---|---|---|---|
| CR-83 | /product/sell-serve | products.js | "Bill in seconds. Serve more covers. Lose zero orders." | "Restaurant POS & billing software — bill in seconds, serve more covers." |
| CR-83 | /product/see-everything | products.js | "Total visibility — every outlet, live, from your phone." | "Restaurant management software — total visibility from every outlet, live." |
| CR-83 | /solutions/cloud-kitchens | sectors.js | "Every brand and every aggregator — one screen, one inventory." | "Cloud kitchen POS — every brand and aggregator on one screen." |
| CR-83 | /solutions/restaurants | sectors.js | "Turn tables faster, kill order errors, and see profit per table." | "Restaurant POS software — faster tables, fewer errors, more profit per cover." |
| CR-83 | /solutions/qsr | sectors.js | "More covers per hour — and every cash drawer locked down." | "QSR POS & billing — more covers per hour and every cash drawer locked down." |

**Full audit in:** `/app/frontend/public/CR-83-H1-Audit.csv`

---

### Batch B — /demo Page Competitor Reframe (CR-87)
**7 changes · ~1.5 hrs · 2 files**

| # | Type | Change |
|---|---|---|
| 1 | Copy | H1 → "Compare MyGenie With Your Current POS" |
| 2 | Copy | Stat 2 label → "to switch from your current POS" |
| 3 | Copy | Add 5th walkthrough bullet: "Side-by-side comparison" |
| 4 | Copy | Trust line → "100s of restaurants switched to MyGenie across 75 cities" |
| 5 | Code | Form → 4 fields (add shortForm prop) |
| 6 | Code | Trust logos → images (same as CR-76) |
| 7 | Code | Footer → phone + email + Privacy Policy (same as CR-73) |

**Full brief in:** `/app/memory/CR-87_LandingFooter_Trust_Links_Demo.md`

---

### Batch C — Structured Data on /pricing + homepage (CR-80)
**~1 hr · 2 files**

Adds `SoftwareApplication + Offer (×3) + AggregateRating` JSON-LD to `/pricing` and `/`.

**Owner to confirm before implementation:** What review count to use in `aggregateRating.reviewCount`? (Currently proposed: 500)

**Design preview:** `https://website-as-is-2.preview.emergentagent.com/CR-80-Schema-Design.html`  
**Full spec in:** `/app/memory/CR-80_SoftwareApplication_Offer_Schema_Pricing.md`

---

### Batch D — H1 Keywords Phase 2 (CR-83 Phase 2)
**8 pages · ~45 min · 2 data files**

Cafes, Hotels, Food Courts, Chains, run-property, customers (bring-back), protect-profit, central-inventory.  
All in same `sectors.js` + `products.js` files. Same pattern as Batch A.  
**Full list in:** `/app/frontend/public/CR-83-H1-Audit.csv`

---

### Future (After Above) — High/Medium tier CRs

| CR | What | Effort |
|---|---|---|
| CR-84 | Sticky mobile CTA on product + sector pages | ~1 hr |
| CR-81 | WebP image conversion (banner.png 305kB → ~60kB) | ~1.5 hrs |
| CR-82 | Image width/height CLS fix | ~45 min |
| CR-85 | Restaurant Billing Software LP (new page) | ~3 hrs |
| CR-86 | Restaurant POS LP (new page) | ~3 hrs |
| CR-88 | Blog author attribution | ~1.5 hrs |
| CR-89 | Testimonial + Review schema (owner to supply names) | ~2 hrs |
| CR-90 | Sitemap hub pages | ~1 hr |
| CR-91 | BreadcrumbList schema standardise | ~1 hr |
| CR-98 | Calendly double-load fix | ~30 min |
| CR-83 Phase 3 | H1 keywords: bars, bakeries, ice cream, canteens, homepage | ~30 min |

---

## Recommended Execution Order

```
Parallel today:
├── Owner → Batch 4 Cloudflare (CR-77 + CR-78)
├── Owner → confirm reviewCount for CR-80
└── Agent:
    Batch A (H1 Phase 1, 30 min)
    → Batch B (CR-87 demo page, 1.5 hrs)
    → Batch C (CR-80 schema, 1 hr, after owner confirms reviewCount)
    → Batch D (H1 Phase 2, 45 min)
```

---

*Planning doc written 2026-08-21. All CRs in Batches A-D have intake complete and are approved for impact analysis + implementation.*
