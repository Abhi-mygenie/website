# CR-152 — Line-By-Line Implementation Plan
# `/cloud-kitchen-pos` — Cloud Kitchen POS Standalone LP

**Date:** 2026-08-25  
**Estimated total lines:** ~590  
**Pattern source:** `PetpoojaAlternative.jsx`, CR-85/86 plans  
**Critical context:**
- Organic `/solutions/cloud-kitchens` is NOT replaced — stays live
- Only the Ads Final URL changes: `/solutions/cloud-kitchens` → `/cloud-kitchen-pos`
- This LP uses `LandingNavbar` — `/solutions/cloud-kitchens` uses global `Navbar`

---

## FILES TO CHANGE — ORDERED

| # | File | Operation | Lines changed |
|---|------|-----------|--------------|
| 1 | `frontend/src/pages/CloudKitchenPos.jsx` | **CREATE** (new file) | ~590 |
| 2 | `frontend/src/App.js` | **EDIT** | +2 lines |
| 3 | `frontend/public/sitemap.xml` | **EDIT** | +4 lines |
| 4 | `frontend/src/lib/seo.js` | **EDIT** | +5 lines |
| **DO NOT TOUCH** | `frontend/src/data/sectors.js` | No change | — |

---

## FILE 1 — `frontend/src/pages/CloudKitchenPos.jsx`

### Block 1 — Imports (Lines 1–13)

```
L1   import { ArrowRight, Check, RefreshCw, Building, Boxes, Bike, ChefHat } from "lucide-react";
L2   import { Link } from "react-router-dom";
L3   import DemoForm from "@/components/site/DemoForm";
L4   import Reveal from "@/components/site/Reveal";
L5   import Seo from "@/components/site/Seo";
L6   import FaqItem from "@/components/site/FaqItem";
L7   import Logo from "@/components/site/Logo";
L8   import TrustBand from "@/components/home/TrustBand";
L9   import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
L10  import { COMPANY } from "@/data/company";
```

### Block 2 — FAQ_SCHEMA (Lines 13–62)

5 questions — cloud kitchen specific:

```
Q1: "Does it work with Swiggy, Zomato, and Magicpin?"
A1: "Yes. Swiggy, Zomato, and Magicpin orders flow directly into MyGenie. No separate tablets per aggregator — all orders in one queue, one screen."

Q2: "Can I run multiple brands from one account?"
A2: "Yes. MyGenie lets you run 2–5 dark kitchen brands from one backend. Each brand has its own menu and pricing. Shared inventory is managed centrally."

Q3: "Is the cloud kitchen billing software GST-compliant?"
A3: "Yes. GST is auto-calculated on every order. GSTIN on every bill. GSTR-1 compatible reports exportable in one click — for every brand separately."

Q4: "Do I need a billing machine or POS hardware?"
A4: "No. MyGenie runs on any Android phone or tablet. Cloud kitchens typically run lean — a phone at the packing station is enough. No ₹30,000 POS machine required."

Q5: "How fast is setup for a new cloud kitchen?"
A5: "Most cloud kitchens go live within 48 hours. Menu setup, aggregator integration, and staff training are all handled by MyGenie's onboarding team."
```

### Block 3 — LandingNavbar (Lines 64–80)

Same structure as CR-85 plan.  
`data-testid` prefix: `"ck-lp-"`.  
Navbar CTA: `href="#lp-demo"` · text: `"Book Free Demo"`.

### Block 4 — LandingFooter (Lines 82–97)

Same structure as CR-85 plan.  
`data-testid` prefix: `"ck-lp-footer-"`.

### Block 5 — Hero section (Lines 99–192)

```
Eyebrow:     "Cloud Kitchen POS & Billing Software"
testid:      "ck-lp-eyebrow"

H1:          "Cloud kitchen POS & billing software — every brand, every aggregator, one screen."
testid:      "ck-lp-h1"

Sub:         "Stop juggling Swiggy, Zomato and multiple brand tablets. MyGenie unifies ordering, billing, inventory and reports into one backend — built for cloud kitchen speed."
testid:      "ck-lp-sub"

Stat chips (4):
  { val: "₹0",   label: "missed orders" }
  { val: "1",    label: "screen for all aggregators" }
  { val: "5",    label: "brands per account" }
  { val: "40%",  label: "lower fixed cost (Love Bites)" }

CTA primary:
  href="#lp-demo"
  text="Book a Free Cloud Kitchen Demo →"    ← HARDCODED
  data-testid="ck-lp-cta-primary"

CTA secondary:
  href="#lp-pricing"                          ← SCROLL ANCHOR
  text="See Pricing ↓"
  data-testid="ck-lp-cta-secondary"

Hero image (right column):
  src="/brand/banner.webp"
  alt="MyGenie cloud kitchen POS and billing software dashboard"
  width={776} height={637}
  loading="eager"                             ← LCP — must be eager
  data-testid="ck-lp-hero-image"
```

### Block 6 — S2: Problem strip — "Too many tablets" (Lines 194–245)

Directly addresses the core cloud kitchen pain from `sectors.js`.

```
Eyebrow: "The cloud kitchen problem"
H2: "3 tablets for 3 aggregators. A printer that jams. A spreadsheet for stock."
data-testid: "ck-lp-problem"

Problem pill strip (before → after):
  BEFORE:
    "Swiggy tablet"       → strikethrough
    "Zomato tablet"       → strikethrough
    "Magicpin tablet"     → strikethrough
    "Stock spreadsheet"   → strikethrough
    "Brand 2 on WhatsApp" → strikethrough
  AFTER:
    "MyGenie — everything above, one screen" → green highlight

Body:
"You opened a cloud kitchen to stay lean. Then you ended up with more devices than a dine-in restaurant. MyGenie brings every aggregator and every brand onto one screen."

Layout: 2-column (problems left, solution right) on lg. Stack on mobile.
```

### Block 7 — S3: Feature — Aggregator sync (Lines 247–295)

```
Eyebrow: "Aggregator sync"
H2: "Swiggy, Zomato, and Magicpin orders — all in one queue"
Body: "No switching between tablets. No missed orders during peak. Every incoming order appears in MyGenie the moment it's placed — with the brand, items, and delivery address."
Feature list:
  - "Swiggy orders auto-ingested"
  - "Zomato orders auto-ingested"
  - "Magicpin orders auto-ingested"
  - "All brands in one order queue"
  - "Missed order alert if aggregator is down"

Icon: RefreshCw (from lucide-react)
data-testid: "ck-lp-aggregator"
```

### Block 8 — S4: Feature — Multi-brand billing (Lines 297–340)

```
Eyebrow: "Multi-brand billing"
H2: "Run 2–5 cloud kitchen brands from one backend"
Body: "Each brand gets its own menu, pricing, and GST billing. Shared inventory tracks across all brands automatically. One account — no duplicate setup."
Feature list:
  - "Separate menu per brand"
  - "Separate pricing and GST per brand"
  - "Shared inventory across brands"
  - "Single login for all brands"

Icon: Building
data-testid: "ck-lp-multi-brand"
```

### Block 9 — S5: Feature — Central inventory (Lines 342–382)

```
Eyebrow: "Central inventory"
H2: "One shared ingredient stock across all brands — auto-deducted per order"
Body: "Shared ingredients (base sauces, proteins, packaging) deducted automatically as orders come in. Low-stock alerts before you run out. No separate spreadsheet per brand."
Feature list:
  - "Auto-deduct per order across brands"
  - "Low-stock alert before stockout"
  - "Per-ingredient consumption report"
  - "No manual counting needed"

Icon: Boxes
data-testid: "ck-lp-inventory"
```

### Block 10 — S6: Feature — KDS + Direct delivery (Lines 384–420)

```
Eyebrow: "Kitchen Display + Direct delivery"
H2: "KDS for packing flow. Direct orders for commission-free revenue."
Body: "Kitchen Display System shows every incoming order — by brand, by aggregator. Direct delivery link lets you take orders from your own website or social channels — commission-free."
Feature list:
  - "KDS for multi-brand packing queue"
  - "Commission-free direct delivery link"
  - "WhatsApp order confirmation"
  - "Real-time packing status per order"

Icon: Bike (delivery) + Flame (KDS) — split icons
data-testid: "ck-lp-kds-delivery"
```

### Block 11 — S7: Social proof — cloud kitchen specific (Lines 422–470)

Source: sectors.js cloud-kitchens proof block.

```
H2: "What cloud kitchens say about MyGenie"
data-testid: "ck-lp-proof"

Proof card 1 — Love Bites:
  metric: "40%"
  headline: "lower fixed cost"
  quote: "We run lean on just a few mobile devices — no front desk, no printers. Monthly fixed cost dropped 40%."
  client: "Love Bites"
  data-testid: "ck-proof-lovebites"

Proof card 2 — Pavan Pages:
  metric: "2×"
  headline: "outlets on one backend"
  quote: "MyGenie let us launch a second kitchen on the same backend with real-time sync. Revenue doubled, infra cost stayed flat."
  client: "Pavan Pages"
  data-testid: "ck-proof-pavanpages"
```

### Block 12 — S8: Inline Pricing (Lines 472–550)

Same 3-card pattern as CR-85 plan.

Growth plan feature list customised for cloud kitchen:
```
Growth ₹1,499 feats:
  ["Everything in Starter", "Aggregator sync (Swiggy/Zomato/Magicpin)", "Multi-brand support", "KDS", "Central inventory"]
```

```
id="lp-pricing"  +  scroll-mt-20
data-testid="ck-lp-pricing"

Footer note: "No hidden fees · Cancel anytime · Annual billing"

Plan card CTAs: href="#lp-demo"
```

### Block 13 — S9: FAQ + DemoForm (Lines 552–588)

**FAQ:**
```
data-testid: "ck-lp-faq"
5 FaqItem components from FAQ_SCHEMA
testids: "ck-faq-aggregators" | "ck-faq-multibrand" | "ck-faq-gst" | "ck-faq-hardware" | "ck-faq-setup"
```

**DemoForm section:**
```
id="lp-demo"  +  scroll-mt-20
data-testid="ck-lp-demo"

H2: "Book a Free Cloud Kitchen Demo →"
Sub: "A specialist walks you through aggregator sync, multi-brand billing and inventory for your kitchen setup. 45 min, free."

DemoForm:
  sector="cloud-kitchen"
  shortForm

Form wrap: data-testid="ck-lp-form-wrap"
```

### Block 14 — Page shell (Lines 590–592)

```
export default function CloudKitchenPos()
data-testid="cloud-kitchen-pos-page"

<Seo
  title="Cloud Kitchen POS & Billing Software India | MyGenie"
  description="POS built for cloud kitchens — manage every brand, every aggregator, and all inventory from one screen. GST-ready. Book a free demo."
  path="/cloud-kitchen-pos"
  jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
/>

Section render order:
  LandingNavbar → LpHero → TrustBand → LpProblem → LpAggregator → LpMultiBrand → LpInventory → LpKdsDelivery → LpProof → LpPricing → LpFaqDemo
→ LandingFooter
```

---

## FILE 2 — `frontend/src/App.js`

```js
const CloudKitchenPos = lazy(() => import("@/pages/CloudKitchenPos"));
```

```jsx
{/* CR-152 — Cloud Kitchen POS LP (Google Ads — Cloud Kitchen ad group, standalone) */}
{/* NOTE: /solutions/cloud-kitchens organic sector page is NOT affected */}
<Route path="/cloud-kitchen-pos" element={<CloudKitchenPos />} />
```

---

## FILE 3 — `frontend/public/sitemap.xml`

```xml
  <url>
    <loc>https://www.mygenie.online/cloud-kitchen-pos</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
```

**Do NOT remove** the existing `/solutions/cloud-kitchens` sitemap entry.

---

## FILE 4 — `frontend/src/lib/seo.js`

```js
"/cloud-kitchen-pos": {
  title: "Cloud Kitchen POS & Billing Software India | MyGenie",
  description: "POS built for cloud kitchens — manage every brand, every aggregator, and all inventory from one screen. GST-ready. Book a free demo.",
},
```

---

## Definition of Done checklist

- [ ] H1 contains "cloud kitchen POS" and "billing software"
- [ ] "Swiggy" and "Zomato" mentioned explicitly in body copy
- [ ] Hero image is `/brand/banner.webp` — `loading="eager"`
- [ ] Primary CTA text is exactly `"Book a Free Cloud Kitchen Demo →"`
- [ ] `id="lp-pricing"` section present — secondary CTA `href="#lp-pricing"` (NOT `to="/pricing"`)
- [ ] `id="lp-demo"` DemoForm present — `sector="cloud-kitchen"`
- [ ] LandingNavbar only (no global Navbar)
- [ ] FAQPage JSON-LD (5 questions) in `<head>`
- [ ] Route in `App.js` at `/cloud-kitchen-pos`
- [ ] URL `/cloud-kitchen-pos` in `sitemap.xml`
- [ ] `/solutions/cloud-kitchens` sitemap entry is UNCHANGED
- [ ] `sectors.js` is UNCHANGED
- [ ] Prerendered: `build/cloud-kitchen-pos/index.html` exists with correct title + canonical

*Plan written 2026-08-25.*
