# CR-149 — Line-By-Line Implementation Plan
# `/qsr-pos-system` — QSR POS System LP

**Date:** 2026-08-25  
**Estimated total lines:** ~570  
**Pattern source:** `PetpoojaAlternative.jsx`, CR-85 plan  
**Key CTA:** ALL CTAs say `"Book a Free QSR Demo →"` — hardcoded, not dynamic  
**Note:** QSR ad groups dormant (0 impressions). LP must exist before ad group is activated.

---

## FILES TO CHANGE — ORDERED

| # | File | Operation | Lines changed |
|---|------|-----------|--------------|
| 1 | `frontend/src/pages/QsrPosSystem.jsx` | **CREATE** (new file) | ~570 |
| 2 | `frontend/src/App.js` | **EDIT** | +2 lines |
| 3 | `frontend/public/sitemap.xml` | **EDIT** | +4 lines |
| 4 | `frontend/src/lib/seo.js` | **EDIT** | +5 lines |

---

## CTA COPY — APPLIES TO ALL 4 LOCATIONS ON PAGE

> ⚠️ Every CTA on this page says `"Book a Free QSR Demo →"` — do NOT use generic "Book a Free Demo".  
> The existing SectorPage generates `"Book a QSR / Fast Food Demo"` dynamically. This LP overrides with hardcoded copy.

| Location | Copy |
|---|---|
| Hero primary button | `Book a Free QSR Demo →` |
| Navbar CTA | `Book Free Demo` (navbar is narrow — shorten here only) |
| DemoForm submit button | `Book a Free QSR Demo →` (passed as `submitLabel` prop to DemoForm, if supported, else hardcode below form) |
| Demo section H2 | `See the QSR POS live — book a free demo for your outlet` |
| Bottom CTA button | `Book a Free QSR Demo →` |

---

## FILE 1 — `frontend/src/pages/QsrPosSystem.jsx`

### Block 1 — Imports (Lines 1–12)

```
L1   import { ArrowRight, Check, Zap, QrCode, Flame, ShieldCheck, Monitor } from "lucide-react";
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

### Block 2 — FAQ_SCHEMA (Lines 13–58)

4 QSR-specific questions:

```
Q1: "Does it work for fast food and burger chains?"
A1: "Yes. MyGenie is built for quick service restaurants — counter billing, KDS, prepaid tokens, and multi-counter support. Works for fast food, burger chains, juice bars, and any outlet with high-volume counter service."

Q2: "Can I run multiple billing counters from one account?"
A2: "Yes. MyGenie supports 3–5 billing counters per outlet on one account. Each counter runs independently — no conflicts, no duplicate orders."

Q3: "Does it include a Kitchen Display System (KDS)?"
A3: "Yes. Counter takes the order → kitchen sees it on the KDS instantly → bill printed in seconds. No paper KOT, no shouting across the pass, no missed items."

Q4: "Is it GST-compliant for QSR?"
A4: "Yes. GST is auto-calculated on every bill. GSTIN on receipts. GSTR-1 compatible reports. Works for any QSR format: dine-in, takeaway, counter service."
```

### Block 3 — LandingNavbar (Lines 60–76)

Same structure as CR-85 plan.  
`data-testid` prefix: `"qsr-lp-"`.  
Navbar CTA: `href="#lp-demo"` · text: `"Book Free Demo"`.  
(Navbar uses shortened copy — full "QSR Demo" only on in-page CTAs.)

### Block 4 — LandingFooter (Lines 78–93)

Same structure as CR-85 plan.  
`data-testid` prefix: `"qsr-lp-footer-"`.

### Block 5 — Hero section (Lines 95–185)

```
Eyebrow:     "QSR POS System"
testid:      "qsr-lp-eyebrow"

H1:          "POS system built for quick service restaurants — fast, accurate, no hardware needed."
testid:      "qsr-lp-h1"

Sub:         "Take counter orders, fire to kitchen display, print bills, and track inventory — all from one app. Built for QSR speed."
testid:      "qsr-lp-sub"

Stat chips (3):
  { val: "10s",  label: "average bill time" }
  { val: "₹0",   label: "hardware required" }
  { val: "100+", label: "QSR outlets" }

CTA primary:
  href="#lp-demo"
  text="Book a Free QSR Demo →"          ← HARDCODED, EXACT COPY
  data-testid="qsr-lp-cta-primary"

CTA secondary:
  href="#lp-pricing"
  text="See Pricing ↓"                    ← SCROLL ANCHOR
  data-testid="qsr-lp-cta-secondary"

Hero image (right column):
  src="/brand/banner.webp"
  alt="MyGenie QSR POS system — counter billing on phone"
  width={776} height={637}
  loading="eager"
  data-testid="qsr-lp-hero-image"
```

### Block 6 — S2: QSR feature strip (Lines 187–240)

6-icon horizontal strip. Icons from lucide-react.

```
H2: "Everything a quick service restaurant needs — in one POS"
data-testid: "qsr-lp-feature-strip"

6 feature tiles:
  { icon: Zap,         title: "Counter billing",    desc: "Bill in under 10 seconds. No errors."           }
  { icon: Monitor,     title: "Kitchen display",     desc: "Orders fire to KDS instantly."                  }
  { icon: QrCode,      title: "Scan & Order",        desc: "Guests order from their phone."                 }
  { icon: Boxes,       title: "Inventory",           desc: "Auto-deduct per item sold."                     }
  { icon: ShieldCheck, title: "Multi-counter",       desc: "3–5 counters on one account."                   }
  { icon: BarChart3,   title: "GST reports",         desc: "GSTR-1 compatible, auto-calculated."            }

Layout: 2-col on mobile, 3-col on sm, 6-col on lg (flex-wrap on small)
Each tile: data-testid="qsr-feature-{billing|kds|scan|inventory|counter|gst}"
```

### Block 7 — S3: "How it works" — 3 steps (Lines 242–295)

Simple numbered step flow.

```
Eyebrow: "Simple. Fast. Accurate."
H2: "How the QSR POS works"
data-testid: "qsr-lp-how-it-works"

Step 1: number="1" title="Take order at counter"
        desc="Staff taps items on phone or tablet. Prepaid tokens issued for token-based QSRs."

Step 2: number="2" title="Kitchen gets it instantly"
        desc="Order fires to Kitchen Display System (KDS). No paper KOT, no shouting, no delays."

Step 3: number="3" title="Bill printed in seconds"
        desc="GST bill auto-generated. Print, WhatsApp, or email. Payment: UPI, card, or cash."

Layout: horizontal 3-column on lg, vertical stack on mobile
Each step: data-testid="qsr-step-{1|2|3}"
```

### Block 8 — S4: Social proof — QSR specific (Lines 297–345)

Use existing proof data from `sectors.js` QSR proof block.

```
Eyebrow: "QSR outlets on MyGenie"
H2: "Terraria Café: 22% more revenue per shift after switching"
data-testid: "qsr-lp-proof"

Quote card 1:
  metric: "22%" headline: "more revenue per shift"
  quote: "Our QSR model improved drastically with KDS and scan-based ordering. Prep time cut 30%, food waste down 15%, revenue up 22% per shift."
  client: "Terraria Café"
  data-testid: "qsr-proof-terraria"

Quote card 2:
  metric: "₹1 Lakh" headline: "theft caught in 2 weeks"
  quote: "A cashier was cancelling items after payment. MyGenie's audit logs exposed ₹1 lakh in theft in two weeks."
  client: "Rhino"
  data-testid: "qsr-proof-rhino"
```

### Block 9 — S5: Comparison — hardware vs MyGenie (Lines 347–395)

Targets: "No Need for Hardware POS" RSA headline + counter-intent searches.

```
H2: "Hardware POS vs MyGenie — the cost difference"
data-testid: "qsr-lp-comparison"

2-column comparison table:
  Header row: "Traditional Hardware POS" | "MyGenie QSR POS"

  Row 1: "Setup cost"    | "₹30,000–1L hardware"   | "₹0 — use your tablet"
  Row 2: "Per device"    | "₹10,000–30,000 each"   | "Unlimited devices"
  Row 3: "Offline mode"  | "Depends on hardware"   | "Yes — built-in"
  Row 4: "KDS"           | "Separate hardware"     | "Included"
  Row 5: "Updates"       | "Vendor dependent"      | "Automatic"
  Row 6: "Setup time"    | "3–7 days"              | "24–48 hours"

"Traditional" column: red-tinted  |  "MyGenie" column: green-tinted
Each row: data-testid="qsr-compare-row-{1|2|3|4|5|6}"
```

### Block 10 — S6: Inline Pricing (Lines 397–475)

Same 3-card pattern as CR-85 plan.

**Important:** Footer note must include `"Starting at ₹4,000 (annual)"` to match the RSA keyword insertion `{KeyWord:Starting at ₹4,000}`.

```
id="lp-pricing"  +  scroll-mt-20
data-testid="qsr-lp-pricing"

Plans: Starter ₹799 / Growth ₹1,499 / Pro ₹2,499 (same as other LPs)

Footer note:
"Starting at ₹4,000/year · No hardware required · Cancel anytime"
         ^^^^^^^^^^^^^^^
         Matches RSA keyword insertion — keep this exact text

Plan card CTAs: href="#lp-demo"
```

### Block 11 — S7: FAQ (Lines 477–520)

4 `FaqItem` components from FAQ_SCHEMA.  
`data-testid="qsr-lp-faq"`  
Individual testids: `"qsr-faq-fastfood"`, `"qsr-faq-counters"`, `"qsr-faq-kds"`, `"qsr-faq-gst"`

### Block 12 — S8: Demo CTA + DemoForm (Lines 522–565)

```
id="lp-demo"  +  scroll-mt-20
data-testid="qsr-lp-demo"

H2: "See the QSR POS live — book a free demo for your outlet"
     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     (exact copy required — matches CTA spec from CR-149)

Sub: "A specialist walks you through counter billing, KDS, and multi-counter setup for your QSR format. 45 min, free, no commitment."

DemoForm props:
  sector="qsr"
  shortForm
  (If DemoForm accepts submitLabel prop → pass submitLabel="Book a Free QSR Demo →")

Form wrap: data-testid="qsr-lp-form-wrap"

Below form — explicit CTA button (visible above DemoForm submit button OR as standalone CTA if shortForm hides it):
  <a href="#lp-demo" data-testid="qsr-lp-bottom-cta">
    Book a Free QSR Demo →
  </a>
```

### Block 13 — Page shell (Lines 567–570)

```
export default function QsrPosSystem()
data-testid="qsr-pos-system-page"

<Seo
  title="QSR POS System — Fast Billing for Quick Service Restaurants"
  description="Cloud POS built for QSR speed — counter billing, kitchen display, inventory, and reports on any device. GST-ready. Book a free demo."
  path="/qsr-pos-system"
  jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
/>

Section render order:
  LandingNavbar → LpHero → TrustBand → LpFeatureStrip → LpHowItWorks → LpProof → LpComparison → LpPricing → LpFaq → LpDemo
→ LandingFooter
```

---

## FILE 2 — `frontend/src/App.js`

```js
const QsrPosSystem = lazy(() => import("@/pages/QsrPosSystem"));
```

```jsx
{/* CR-149 — QSR POS System LP (Google Ads — QSR ad groups, standalone) */}
<Route path="/qsr-pos-system" element={<QsrPosSystem />} />
```

---

## FILE 3 — `frontend/public/sitemap.xml`

```xml
  <url>
    <loc>https://www.mygenie.online/qsr-pos-system</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
```

Note: `priority=0.8` (not 0.9) — QSR ad groups are dormant, lower priority than P1 LPs.

---

## FILE 4 — `frontend/src/lib/seo.js`

```js
"/qsr-pos-system": {
  title: "QSR POS System — Fast Billing for Quick Service Restaurants",
  description: "Cloud POS built for QSR speed — counter billing, kitchen display, inventory, and reports on any device. GST-ready. Book a free demo.",
},
```

---

## Definition of Done checklist

- [ ] H1 contains "quick service restaurant" and "POS system"
- [ ] "QSR" appears in H1 eyebrow, feature strip headings, proof section
- [ ] Hero primary CTA text is exactly `"Book a Free QSR Demo →"`
- [ ] DemoForm submit shows `"Book a Free QSR Demo →"` (or button below form)
- [ ] Demo section H2 is exactly `"See the QSR POS live — book a free demo for your outlet"`
- [ ] Pricing section footer note contains `"Starting at ₹4,000/year"`
- [ ] `id="lp-pricing"` present — secondary CTA `href="#lp-pricing"` (NOT `to="/pricing"`)
- [ ] `id="lp-demo"` DemoForm present — `sector="qsr"`
- [ ] LandingNavbar only
- [ ] FAQPage JSON-LD in `<head>`
- [ ] Route in `App.js` at `/qsr-pos-system`
- [ ] URL in `sitemap.xml` (priority 0.8)
- [ ] Prerendered: `build/qsr-pos-system/index.html` exists

*Plan written 2026-08-25.*
