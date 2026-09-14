# CR-86 — Line-By-Line Implementation Plan
# `/restaurant-pos-system` — Dedicated POS System LP

**Date:** 2026-08-25  
**Estimated total lines:** ~540  
**Pattern source:** `PetpoojaAlternative.jsx`, `DemoLanding.jsx`  
**Key H1:** `"Best restaurant POS system — orders, billing, and reports in one place, on any device."`  
**"Best" is mandatory** — fixes QS 3 on [best restaurant pos software], [best pos system restaurant]

---

## FILES TO CHANGE — ORDERED

| # | File | Operation | Lines changed |
|---|------|-----------|--------------|
| 1 | `frontend/src/pages/RestaurantPosSystem.jsx` | **CREATE** (new file) | ~540 |
| 2 | `frontend/src/App.js` | **EDIT** — lazy import + route | +2 lines |
| 3 | `frontend/public/sitemap.xml` | **EDIT** — add URL entry | +4 lines |
| 4 | `frontend/src/lib/seo.js` | **EDIT** — add PAGE_SEO entry | +5 lines |

---

## FILE 1 — `frontend/src/pages/RestaurantPosSystem.jsx`

### Block 1 — Imports (Lines 1–12)

```
L1   import { ArrowRight, Check } from "lucide-react";
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

### Block 2 — FAQ_SCHEMA (Lines 13–55)

4 questions targeting POS-specific intent:

```
Q1: "Do I need to buy a POS machine for this restaurant POS system?"
A1: "No. MyGenie is a software POS — it runs on any Android phone, tablet, or browser. No POS machine purchase required. That's what makes it the best restaurant POS system for outlets that want to stay lean."

Q2: "What's the difference between a POS and a billing machine?"
A2: "A billing machine is hardware that prints bills. A restaurant POS system like MyGenie is software — it handles orders, billing, inventory, reports, and staff management from one app on any device."

Q3: "Does the restaurant POS system work offline?"
A3: "Yes. Billing, KOT, and order management work offline. Data syncs automatically when connection is restored."

Q4: "How fast is setup?"
A4: "Most restaurants are live within 48 hours. MyGenie's onboarding team sets up your menu, tables, and integrations. No IT team or hardware installation required."
```

Schema type: `FAQPage` — same structure as CR-85 plan.

### Block 3 — LandingNavbar (Lines 57–73)

Identical to CR-85 plan `LandingNavbar`.  
Change `data-testid` values to prefix `"pos-lp-"`.  
Navbar CTA: `href="#lp-demo"` · text: `"Book Free Demo"`.

### Block 4 — LandingFooter (Lines 75–90)

Identical to CR-85 plan `LandingFooter`.  
Change `data-testid` values to prefix `"pos-lp-footer-"`.

### Block 5 — Hero section (Lines 92–180)

**Critical:** H1 must contain "Best restaurant POS system" verbatim.

```
L92   // ─── S1 — Hero ─────────────────────────────────────────────────────────
L93   function LpHero() {
L94     return (
L95       <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden"
L96                data-testid="pos-lp-hero">
         ...
L108            {/* Eyebrow */}
L109            <span ... data-testid="pos-lp-eyebrow">
L110              Restaurant POS System
L111            </span>

L114            {/* H1 — "Best" is mandatory for QS fix */}
L115            <h1 ... data-testid="pos-lp-h1">
L116              Best restaurant POS system — orders, billing, and reports in one place, on any device.
L117            </h1>

L120            {/* Sub */}
L121            <p ... data-testid="pos-lp-sub">
L122              India's restaurant POS built for the floor — no bulky machines, no per-device fees, no downtime.
L123            </p>

L126            {/* Stat chips — 3 chips */}
L127            {[
L128              { val: "48hr", label: "average setup time" },
L129              { val: "₹0",   label: "hardware required" },
L130              { val: "22%",  label: "more revenue per shift" },
L131            ]}

L138            {/* CTA row */}
L140              {/* Primary */}
L141              <a href="#lp-demo" ... data-testid="pos-lp-cta-primary">
L142                Book a Free POS Demo <ArrowRight ... />
L143              </a>
L145              {/* Secondary — scroll to inline pricing */}
L146              <a href="#lp-pricing" ... data-testid="pos-lp-cta-secondary">
L147                See Pricing ↓
L148              </a>

L153            {/* Right: product image */}
L154            <img
L155              src="/brand/banner.webp"
L156              alt="MyGenie restaurant POS system on phone"
L157              width={776} height={637}
L158              className="w-full h-auto object-contain rounded-3xl"
L159              loading="eager"
L160              data-testid="pos-lp-hero-image"
L161            />
```

### Block 6 — S2: What's included — 4-feature grid (Lines 182–240)

Purpose: Directly addresses "POS + billing + inventory + reports" compound keyword intent.  
Each card heading must use the keyword: "POS", "billing", "inventory", "reports".

```
H2: "Everything in one restaurant POS system"
Sub: "No switching between apps — billing, kitchen, stock and reports all run from MyGenie."

4 feature cards:
Card 1: icon=CreditCard  | title="POS & Billing"         | body="Take orders, print bills, split payments — GST auto-calculated."
Card 2: icon=ClipboardList| title="Inventory management"  | body="Real-time stock deduction per order. Low-stock alerts. Waste tracking."
Card 3: icon=Flame        | title="KDS & Kitchen orders"  | body="Orders fire to kitchen display instantly. No paper KOT, no missed tickets."
Card 4: icon=BarChart3    | title="Real-time reports"     | body="Daily P&L, per-item margins, hourly sales — from your phone, anywhere."

Section: data-testid="pos-lp-features"
Each card: data-testid="pos-feature-{billing|inventory|kds|reports}"
```

### Block 7 — S3: Multi-outlet & chains (Lines 242–295)

Purpose: Targets [best pos system restaurant] — "best" searchers are comparing and evaluating scale.

```
Eyebrow: "Built for scale"
H2: "The best restaurant POS system grows with you — single outlet to chain"
Body: "Run every outlet from one dashboard. Centralised menu. Per-outlet P&L. Role-based access for managers and staff. One login, all locations."
Visual: 2-column stat cards
  - "200+" outlets running on MyGenie
  - "1" dashboard for all locations

data-testid="pos-lp-multioutlet"
```

### Block 8 — S4: India-specific section (Lines 297–345)

**Critical:** Must contain "India" and "Indian restaurants" explicitly — targets [pos software for restaurant india] QS 3.  
Must use phrase "restaurant POS system India" in body.

```
Eyebrow: "Built for India"
H2: "Restaurant POS system designed for Indian restaurants — GST, UPI, Swiggy, Zomato"
Body: "India's restaurant industry has specific needs: GST compliance, UPI payments, Swiggy/Zomato aggregator integration, and GST billing. MyGenie is the restaurant POS system India's restaurateurs trust — built from the ground up for Indian regulations and workflows."

Feature pills:
  - "GST-compliant billing"
  - "UPI & Razorpay payments"
  - "Swiggy + Zomato sync"
  - "Indian cuisine menu templates"
  - "GSTR-1 reports"

data-testid="pos-lp-india"
```

### Block 9 — S5: Customer proof — Terraria Café (Lines 347–390)

Source: `sectors.js` QSR proof entry.

```
H2: "Terraria Café: 22% more revenue per shift with MyGenie POS"
Quote: "Our QSR model improved drastically with KDS and scan-based ordering. Prep time cut 30%, food waste down 15%, revenue up 22% per shift."
Attribution: "Terraria Café"
Stat chips: "22% more revenue" · "30% less prep time" · "15% less food waste"

data-testid="pos-lp-proof"
```

### Block 10 — S6: Inline Pricing (Lines 392–470)

Same 3-card pattern as CR-85 plan.  
Section: `id="lp-pricing"` + `data-testid="pos-lp-pricing"` + `scroll-mt-20`  
Plan card CTAs: `href="#lp-demo"`.  
Footer note: `"No hidden fees · Cancel anytime · Annual billing"`.

### Block 11 — S7: FAQ section (Lines 472–515)

4 `FaqItem` components using FAQ_SCHEMA questions.  
`data-testid="pos-lp-faq"`  
Individual item testids: `"pos-faq-machine"`, `"pos-faq-vs-billing"`, `"pos-faq-offline"`, `"pos-faq-setup"`

### Block 12 — S8: Demo CTA + DemoForm (Lines 517–555)

```
id="lp-demo"  +  scroll-mt-20
data-testid="pos-lp-demo"

H2: "See the restaurant POS system live — book a free 45-min demo"
Sub: "A specialist walks you through orders, billing, reports and India-specific features on your outlet type."
DemoForm: sector="restaurant-pos"  shortForm
data-testid on form wrap: "pos-lp-form-wrap"
```

### Block 13 — Page shell (Lines 557–540)

```
export default function RestaurantPosSystem()
data-testid="restaurant-pos-system-page"

<Seo
  title="Restaurant POS System — India's Best | MyGenie"
  description="Complete restaurant POS system — billing, inventory, KOT, and real-time reports in one app. No hardware lock-in. Works on any device. Book a free demo."
  path="/restaurant-pos-system"
  jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
/>

Section render order:
  LandingNavbar → LpHero → TrustBand → LpFeatureGrid → LpMultiOutlet → LpIndia → LpProof → LpPricing → LpFaq → LpDemo
→ LandingFooter
```

---

## FILE 2 — `frontend/src/App.js`

**Insert after existing line 22** (after `DemoLanding` import):

```js
const RestaurantPosSystem = lazy(() => import("@/pages/RestaurantPosSystem"));
```

**Insert after `/demo` route** (keeping comment pattern):

```jsx
{/* CR-86 — Restaurant POS System LP (Google Ads — POS System ad group, standalone) */}
<Route path="/restaurant-pos-system" element={<RestaurantPosSystem />} />
```

---

## FILE 3 — `frontend/public/sitemap.xml`

```xml
  <url>
    <loc>https://www.mygenie.online/restaurant-pos-system</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
```

---

## FILE 4 — `frontend/src/lib/seo.js`

```js
"/restaurant-pos-system": {
  title: "Restaurant POS System — India's Best | MyGenie",
  description: "Complete restaurant POS system — billing, inventory, KOT, and real-time reports in one app. No hardware lock-in. Works on any device. Book a free demo.",
},
```

---

## Definition of Done checklist

- [ ] H1 is exactly `"Best restaurant POS system — orders, billing, and reports in one place, on any device."` — word **"best"** present
- [ ] Meta title contains "Restaurant POS System" and "India's Best"
- [ ] "India" / "Indian restaurants" appears in S4 body copy
- [ ] "restaurant POS system India" phrase appears in S4
- [ ] "best restaurant POS system" phrase appears in S3 copy
- [ ] `id="lp-pricing"` section present — secondary CTA `href="#lp-pricing"` (NOT `to="/pricing"`)
- [ ] `id="lp-demo"` DemoForm present — `sector="restaurant-pos"`
- [ ] LandingNavbar only (no global Navbar exit links)
- [ ] FAQPage JSON-LD in `<head>`
- [ ] Route in `App.js` at `/restaurant-pos-system`
- [ ] URL in `sitemap.xml`
- [ ] Prerendered: `build/restaurant-pos-system/index.html` exists with correct title + canonical

*Plan written 2026-08-25.*
