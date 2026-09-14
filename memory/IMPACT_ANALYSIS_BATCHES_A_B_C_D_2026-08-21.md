# Impact Analysis — Batches A, B, C, D
**Date:** 2026-08-21 — Planning Agent  
**Status:** COMPLETE — 2 blockers flagged, questions sent to owner  
**Files read:** SectorPage.jsx, ProductPage.jsx, DemoLanding.jsx, DemoForm.jsx, seo.js, Home.jsx, Pricing.jsx, pricing.js, sectors.js, products.js, /brand/ directory

---

## BATCH A — H1 Phase 1 (CR-83)
**5 pages · sectors.js + products.js · ~30 min**

### Findings

**Finding A-1 — CMS override mechanism (CRITICAL to understand)**

H1 is rendered via:
```jsx
// SectorPage.jsx line 83
<EditableText id={`${docKey}.hero.h1`} fallback={doc.hero.h1} block />
// where doc.hero.h1 comes from: useContentDoc(docKey, fallback)
// which checks MongoDB CMS first, then falls back to data file
```

**This means:** If a CMS admin has ever edited the H1 for any of these pages via the admin panel, the MongoDB override takes precedence over the data file. The data file change would have NO effect on those pages.

**Confirmed:** The VSP/Petpooja page had a stale CMS override that caused the hero image to break (Finding 9 in CR-71). The same pattern applies here.

**Mitigation:** Since these are not the Petpooja page and no CMS edits are known for these sector/product pages, the data file is the live value. The change will take effect immediately. If a CMS override exists, it would need to be cleared via the admin panel separately.

---

**Finding A-2 — H1 is NOT used for meta title or description**

SectorPage: Meta title = `${s.name} POS System & Billing Software | MyGenie` (from `s.name`, not `s.h1`) ✅  
ProductPage: Meta title = `${p.title} | MyGenie POS Features` (from `p.title`, not `p.h1`) ✅

H1 change affects only the visible heading and on-page keyword signal — not SEO title/description. Zero risk of title regressions.

---

**Finding A-3 — `s.h1` and `p.h1` have exactly one consumer each**

Sector: `sectorDisplay(s).hero.h1` → `doc.hero.h1` → `EditableText fallback` — only in SectorPage.jsx  
Product: `productDisplay(p).hero.h1` → `doc.hero.h1` → `EditableText fallback` — only in ProductPage.jsx  
**No other file reads `h1` from sectors.js or products.js.** ✅

---

**Finding A-4 — All 5 pages verified in data files**

| Page | Data file | Object key | Current H1 (verified line) |
|---|---|---|---|
| /solutions/restaurants | sectors.js | `SECTOR_PAGES.restaurants.h1` | "Turn tables faster, kill order errors, and see profit per table." |
| /solutions/qsr | sectors.js | `SECTOR_PAGES.qsr.h1` | "More covers per hour — and every cash drawer locked down." |
| /solutions/cloud-kitchens | sectors.js | `SECTOR_PAGES.cloud-kitchens.h1` | "Every brand and every aggregator — one screen, one inventory." |
| /product/sell-serve | products.js | `PRODUCT_PAGES.sell-serve.h1` | "Bill in seconds. Serve more covers. Lose zero orders." |
| /product/see-everything | products.js | `PRODUCT_PAGES.see-everything.h1` | "Total visibility — every outlet, live, from your phone." |

---

**Finding A-5 — Suggested H1s are under 70 chars (mobile-safe)**

| Page | Suggested H1 | Char count |
|---|---|---|
| /solutions/restaurants | "Restaurant POS software — faster tables, fewer errors, more profit." | 67 |
| /solutions/qsr | "QSR POS & billing — more covers per hour and every cash drawer locked." | 70 |
| /solutions/cloud-kitchens | "Cloud kitchen POS — every brand and aggregator on one screen." | 60 |
| /product/sell-serve | "Restaurant POS & billing software — bill in seconds, serve more covers." | 70 |
| /product/see-everything | "Restaurant management software — total visibility from every outlet." | 67 |

All within mobile display limits. Keyword front-loaded. Brand voice preserved.

---

**Batch A Risk Register**

| Risk | Likelihood | Impact | Verdict |
|---|---|---|---|
| CMS override exists for these pages | Low (no known edits) | Data file change ignored | Document and note — admin to verify |
| Meta title regression | None | H1 not used in title | Cleared ✅ |
| Other component reads h1 | None | Single consumer confirmed | Cleared ✅ |
| H1 too long for mobile | None | All under 70 chars | Cleared ✅ |

**Batch A verdict: ✅ PROCEED**

---

## BATCH B — /demo Competitor Reframe (CR-87)
**7 changes · DemoLanding.jsx + DemoForm.jsx · ~1.5 hrs**

### Findings

**Finding B-1 — `Link` NOT imported in DemoLanding.jsx ⚠️ Must add**

Current imports in DemoLanding.jsx (line 1-8):
```js
import Logo from "@/components/site/Logo";
import DemoForm from "@/components/site/DemoForm";
import Seo from "@/components/site/Seo";
import Reveal from "@/components/site/Reveal";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc } from "@/lib/cms/CmsProvider";
import { PAGE_SEO } from "@/lib/seo";
import { Clock3 } from "lucide-react";
```
`Link` is not imported. The footer's Privacy Policy link uses `<Link to="/privacy">`. Must add `import { Link } from "react-router-dom"`. If missed, build will fail with "Link is not defined".

---

**Finding B-2 — Trust line lives in DemoForm.jsx (shared component) — safe to change**

Location: `DemoForm.jsx` line 382-383:
```jsx
{sector === "meta-demo" ? (
  <p className="text-xs text-brand-muted text-center mt-3">100s of outlets across 75 cities already on MyGenie</p>
) : (
```
This conditional only fires when `sector === "meta-demo"`. No other form instance passes this sector value. Change to "switched to" is isolated to /demo page only. ✅

---

**Finding B-3 — `shortForm` + `meta-demo` interaction — clean**

With `shortForm=true` AND `sector="meta-demo"`:
- `city` field: `{!shortForm && sector !== "meta-demo" && ...}` → `{false && ...}` = hidden ✅  
- Button label: `sector === "meta-demo" ? "Book My Free Demo"` → still "Book My Free Demo" ✅  
- Trust line: `sector === "meta-demo" ? ...` → renders (with new text) ✅  
- Years in business: `{!shortForm && ...}` → `{false && ...}` = hidden ✅  

All conditions resolve correctly with both props active.

---

**Finding B-4 — DEMO_DEFAULTS and CMS override mechanism**

Same pattern as Batch A. `doc.headline` comes from `useContentDoc("demo", DEMO_DEFAULTS)`. If a CMS admin has edited `demo.headline` via the admin panel, the MongoDB override overrides the `DEMO_DEFAULTS.headline` change. No known CMS edits on this page — data file change should take effect.

---

**Finding B-5 — Trust logos: "Aanya's Kitchen" replaced with "Bamboo Yoga" (RESOLVED)**

The /demo page had 5 trust names including "Aanya's Kitchen" (no logo file). Owner decision (2026-08-21): use other clients with confirmed logo files.

**Final 5 trust logos for /demo page:**
| Client | File | Business Type |
|---|---|---|
| Hyatt Centric | `/brand/hyatt-centric.png` | Hotel |
| Palm Forest Resort | `/brand/palm-forest.png` | Resort |
| Love Bites | `/brand/love-bites.png` | Café |
| The Mill Bakery | `/brand/mill-bakery.png` | Bakery |
| Bamboo Yoga | `/brand/bamboo-yoga.png` | Wellness Café |

All 5 confirmed present in `/brand/`. No text chips — all images. ✅ **BLOCKER RESOLVED.**

---

**Finding B-6 — COMPANY import not in DemoLanding.jsx**

`COMPANY` is not imported currently. Must add `import { COMPANY } from "@/data/company"` for the footer phone/email. Same pattern as CR-73.

---

**Batch B Risk Register**

| Risk | Likelihood | Impact | Verdict |
|---|---|---|---|
| `Link` not imported → build fail | Certain if missed | Build breaks | Must add to imports ⚠️ |
| `COMPANY` not imported → ReferenceError | Certain if missed | Build breaks | Must add to imports ⚠️ |
| Trust line change affects other forms | None | Conditional on meta-demo | Cleared ✅ |
| shortForm + meta-demo conflict | None | Verified clean | Cleared ✅ |
| CMS override for demo.headline | Low | DEMO_DEFAULTS change ignored | Document ✅ |
| Aanya's Kitchen no logo | Confirmed | Change 6 partial | ⛔ BLOCKER — owner decision needed |

**Batch B verdict: ✅ PROCEED — all blockers resolved**

---

## BATCH C — Structured Data on /pricing + homepage (CR-80)
**~1 hr · seo.js + Pricing.jsx + Home.jsx**

### Findings

**Finding C-1 — Pricing.jsx currently passes NO jsonLd prop**

```jsx
// Pricing.jsx line 151 — current
<Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" />
```
No `jsonLd` prop at all. Simple additive change — just add `jsonLd={[SOFTWARE_APP_JSONLD]}`.

---

**Finding C-2 — Home.jsx currently passes single ORG_JSONLD object**

```jsx
// Home.jsx line 32 — current
<Seo title={PAGE_SEO["/"].title} description={PAGE_SEO["/"].description} path="/" jsonLd={ORG_JSONLD} />
```
Seo.jsx handles both single object and array (line 41: `Array.isArray(jsonLd) ? jsonLd : [jsonLd]`). Must change to `jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD]}` to pass both.

---

**Finding C-3 — Growth plan price is ₹1,499 (not ₹1,299 as shown in design mockup)**

Confirmed from pricing.js line 26: `{ id: "growth", name: "Growth", price: 1499, ... }`  
The design mockup showed ₹1,299 incorrectly. The JSON-LD must use `"price": "1499"`. The mockup visual was wrong — implementation will use the correct ₹1,499.

---

**Finding C-4 — Custom plan has `price: null` and `contactOnly: true` — must be EXCLUDED from Offer array**

pricing.js line 32: `{ id: "custom", name: "Custom", price: null, ... contactOnly: true }`  
A `null` price is invalid in `Offer` schema. Only include the 3 priced plans: Starter (799), Growth (1499), Pro (2499).

---

**Finding C-5 — SOFTWARE_APP_JSONLD must be added to seo.js, then imported in both Pricing.jsx and Home.jsx**

New constant to add to `seo.js`:
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
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    reviewCount: "___",   // ← OWNER TO CONFIRM
    bestRating: "5",
    worstRating: "1",
  },
  offers: [
    { "@type": "Offer", name: "Starter", price: "799", priceCurrency: "INR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "799", priceCurrency: "INR", unitText: "per outlet per month" },
      description: "POS & Billing, KOT, Owner Dashboard, Daily Reports" },
    { "@type": "Offer", name: "Growth", price: "1499", priceCurrency: "INR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "1499", priceCurrency: "INR", unitText: "per outlet per month" },
      description: "Everything in Starter + Captain App, KDS, Online Ordering, CRM" },
    { "@type": "Offer", name: "Pro", price: "2499", priceCurrency: "INR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "2499", priceCurrency: "INR", unitText: "per outlet per month" },
      description: "Everything in Growth + Loyalty, WhatsApp Automation, AI features, dedicated account manager" },
  ],
};
```

---

**Finding C-6 — seo.js PAGE_SEO["/petpooja-alternative"] is outdated**

Line 98-102 still has old title: `"MyGenie vs Petpooja — The honest POS comparison | MyGenie"`. The actual title is set directly in PetpoojaAlternative.jsx and overrides this PAGE_SEO value. **Not a blocker** for Batch C but should be cleaned up. Low priority — adding to notes.

---

**Finding C-7 — AggregateRating DEFERRED (owner decision 2026-08-21)**

Owner confirmed no verified review source exists (no Google My Business reviews, Trustpilot, G2, etc.). Using a fabricated `reviewCount` risks schema misuse flags and Google suppressing rich results.

**Decision:** Omit `aggregateRating` from `SOFTWARE_APP_JSONLD` for now.  
**Add back when:** A verified review source is established (Google My Business, Trustpilot, or CR-89 review schema on /customers with real owner names).

**Updated scope:** SoftwareApplication + Offer ×3 only (no star rating). Pricing rich results still achievable. ✅

---

**Batch C Risk Register**

| Risk | Likelihood | Impact | Verdict |
|---|---|---|---|
| Wrong Growth plan price | Confirmed in mockup | Incorrect JSON-LD | Fixed in plan — ₹1,499 ✅ |
| Custom plan (null price) in JSON-LD | None if excluded | Invalid schema | Excluded ✅ |
| Seo.jsx can't handle array jsonLd | None | Already handles array (line 41 in Seo.jsx) | Cleared ✅ |
| Star rating suppressed if reviewCount inflated | Possible | No star rating in SERP | ⛔ BLOCKER — owner confirmation needed |
| Adding SOFTWARE_APP_JSONLD breaks existing ORG_JSONLD on homepage | None | Seo.jsx handles array | Cleared ✅ |

**Batch C verdict: ✅ PROCEED — AggregateRating deferred, no further blockers**

---

## BATCH D — H1 Phase 2 (CR-83)
**8 pages · sectors.js + products.js · ~45 min**

### Findings

**Finding D-1 — Same mechanism as Batch A**

All findings from Batch A apply identically:
- CMS override concern (same mitigation)
- H1 not used for meta title
- Single consumer of h1 field

---

**Finding D-2 — All 8 pages verified in data files**

| Page | Object key | Current H1 |
|---|---|---|
| /solutions/cafes | `SECTOR_PAGES.cafes.h1` | "Protect every margin — and turn first-timers into regulars." |
| /solutions/hotels-resorts | `SECTOR_PAGES.hotels-resorts.h1` | "Run your entire property on one app — rooms, restaurant, spa, and bar. Even offline." |
| /solutions/food-courts | `SECTOR_PAGES.food-courts.h1` | "One wallet, many counters, zero reconciliation headaches." |
| /solutions/chains | `SECTOR_PAGES.chains.h1` | "Control every outlet from one dashboard — without flying to each one." |
| /product/run-property | `PRODUCT_PAGES.run-property.h1` | "One app for rooms, restaurant, food court, and beyond." |
| /product/customers | `PRODUCT_PAGES.customers.h1` | "Turn every bill into a customer who comes back." |
| /product/protect-profit | `PRODUCT_PAGES.protect-profit.h1` | "Catch leakage, theft, and waste — before they eat your margin." |
| /product/central-inventory | `PRODUCT_PAGES.central-inventory.h1` | "One stock brain for every outlet — built for franchises & chains." |

---

**Finding D-3 — Suggested H1s reviewed for char count**

| Page | Suggested H1 | Chars |
|---|---|---|
| /solutions/cafes | "Café POS system — protect every margin and turn first-timers into regulars." | 74 |
| /solutions/hotels-resorts | "Hotel POS system — rooms, restaurant, spa and bar on one app, even offline." | 74 |
| /solutions/food-courts | "Food court POS — one shared wallet, many counters, zero reconciliation headaches." | 80 |
| /solutions/chains | "Multi-outlet POS for chains & franchises — control every outlet from one dashboard." | 81 |
| /product/run-property | "Hotel & property management POS — rooms, restaurant and food court on one app." | 77 |
| /product/customers | "Restaurant CRM & loyalty software — turn every bill into a repeat customer." | 73 |
| /product/protect-profit | "Restaurant inventory management — catch leakage, theft and waste before they hurt." | 80 |
| /product/central-inventory | "Central inventory management for chains — one stock source across all outlets." | 76 |

**Note:** Some are slightly over 70 characters. H1 length doesn't have a hard limit — this is a web heading, not a meta title. All are readable and keyword-first. ✅

---

**Batch D Risk Register**

Identical to Batch A. All cleared. **Verdict: ✅ PROCEED**

---

## All Blockers — RESOLVED

| Batch | Blocker | Resolution |
|---|---|---|
| B | Aanya's Kitchen no logo | Replaced with Bamboo Yoga (bamboo-yoga.png ✅) |
| C | AggregateRating reviewCount | Deferred — no verified review source. SoftwareApplication + Offer only. |

**All 4 batches: ✅ CLEAR TO PROCEED TO LINE-BY-LINE PLANS**

---

*Impact analysis written 2026-08-21. All 4 batches ready to implement once Q1 and Q2 are answered.*
