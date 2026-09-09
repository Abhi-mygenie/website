# CR-148 — Line-By-Line Implementation Plan
# `/restaurant-management-software` — Management Software LP

**Date:** 2026-08-25  
**Estimated total lines:** ~560  
**Pattern source:** `PetpoojaAlternative.jsx`, CR-85 plan  
**Key QS fix:** QS 1 on [best restaurant management software in india] — requires "India" in body AND the exact phrase in Section 6

---

## FILES TO CHANGE — ORDERED

| # | File | Operation | Lines changed |
|---|------|-----------|--------------|
| 1 | `frontend/src/pages/RestaurantManagementSoftware.jsx` | **CREATE** (new file) | ~560 |
| 2 | `frontend/src/App.js` | **EDIT** | +2 lines |
| 3 | `frontend/public/sitemap.xml` | **EDIT** | +4 lines |
| 4 | `frontend/src/lib/seo.js` | **EDIT** | +5 lines |

---

## FILE 1 — `frontend/src/pages/RestaurantManagementSoftware.jsx`

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

### Block 2 — FAQ_SCHEMA (Lines 13–58)

4 questions targeting management + India keyword cluster:

```
Q1: "Can I manage multiple restaurant outlets from one account?"
A1: "Yes. MyGenie's restaurant management software gives you a single dashboard for all outlets — centralised menu, per-outlet P&L, and role-based access for managers and staff."

Q2: "Does it handle Swiggy and Zomato orders?"
A2: "Yes. Swiggy, Zomato, and Magicpin orders flow directly into MyGenie. No separate tablets, no missed orders — all aggregators in one screen."

Q3: "Is MyGenie the best restaurant management software in India?"
A3: "MyGenie is used by 200+ outlets across 75+ Indian cities. It's built specifically for Indian regulations — GST, UPI, Indian aggregators — making it one of the most complete restaurant management software options in India."

Q4: "How is it different from a basic billing app?"
A4: "A billing app only handles billing. Restaurant management software covers the full operation: billing, ordering, staff management, inventory, CRM, and real-time reporting — all in one platform."
```

### Block 3 — LandingNavbar (Lines 60–76)

Same structure as CR-85 plan.  
`data-testid` prefix: `"mgmt-lp-"`.  
Navbar CTA: `href="#lp-demo"` · text: `"Book Free Demo"`.

### Block 4 — LandingFooter (Lines 78–93)

Same structure as CR-85 plan.  
`data-testid` prefix: `"mgmt-lp-footer-"`.

### Block 5 — Hero section (Lines 95–185)

**Critical:** Hero image MUST be `/brand/banner.webp` — NOT Unsplash stock photo.  
`loading="eager"` on image (LCP element).

```
L95   // ─── S1 — Hero ─────────────────────────────────────────────────────────

Eyebrow text:     "Restaurant Management Software"
data-testid:      "mgmt-lp-eyebrow"

H1 text:          "Restaurant management software — orders, staff, and every outlet in one view."
data-testid:      "mgmt-lp-h1"

Sub text:         "Stop switching between apps. MyGenie brings your entire restaurant operation onto one screen — billing, ordering, inventory, and reports."
data-testid:      "mgmt-lp-sub"

Stat chips (3):
  { val: "200+", label: "outlets across India" }
  { val: "1",    label: "screen for everything" }
  { val: "4",    label: "apps replaced" }

CTA primary:
  href="#lp-demo"
  text="Book a Free Management Demo"
  data-testid="mgmt-lp-cta-primary"

CTA secondary:
  href="#lp-pricing"       ← SCROLL ANCHOR, NOT Link to="/pricing"
  text="See Pricing ↓"
  data-testid="mgmt-lp-cta-secondary"

Hero image (right column):
  src="/brand/banner.webp"            ← DASHBOARD SCREENSHOT
  alt="MyGenie restaurant management software dashboard"
  width={776}  height={637}
  className="w-full h-auto object-contain rounded-3xl"
  loading="eager"                     ← LCP — must be eager
  data-testid="mgmt-lp-hero-image"
```

### Block 6 — S2: Problem strip — "Too many apps" (Lines 187–230)

Purpose: Resonates with "restaurant management software" intent — the visitor is currently juggling multiple tools.

```
H2: "You're running your restaurant across 4 different apps. Here's one."
Body: "A billing app. A stock spreadsheet. A WhatsApp group for staff attendance. A separate app for Swiggy. And a printed P&L at month end. MyGenie replaces all of it."

Problem pills (4):
  - "Billing app" → replaced
  - "Stock spreadsheet" → replaced
  - "Staff attendance sheet" → replaced
  - "Swiggy dashboard" → replaced
Visual: pills with strikethrough on left, "MyGenie" checkmark on right

data-testid="mgmt-lp-problem"
```

### Block 7 — S3: Order management (Lines 232–280)

Targets: "restaurant ordering system app", "apps for restaurants to take orders" (QS 3).

```
Eyebrow: "Order management"
H2: "Every order — dine-in, takeaway, Swiggy, Zomato — in one screen"
Body: "Orders from the floor, the counter, and every aggregator appear in one queue. No duplicate screens, no missed tables, no manual re-entry from Zomato."
Feature list:
  - "Table orders via Captain App on floor staff phones"
  - "Counter/QSR billing at the till"
  - "Swiggy, Zomato, Magicpin auto-ingested"
  - "Takeaway and direct delivery orders"

data-testid="mgmt-lp-orders"
```

### Block 8 — S4: Staff management (Lines 282–325)

Targets: "Orders, Staff & Reports" RSA headline theme.

```
Eyebrow: "Staff management"
H2: "Shift reports, attendance, and role-based access — all in MyGenie"
Body: "Managers see sales by shift. Owners see attendance. Cashiers can only bill. No one sees what they shouldn't. No WhatsApp groups, no spreadsheets."
Feature list:
  - "Role-based access: Owner / Manager / Cashier / Captain"
  - "Shift-level sales reports"
  - "Attendance tracking"
  - "Void and cancellation audit log"

data-testid="mgmt-lp-staff"
```

### Block 9 — S5: Real-time reporting (Lines 327–368)

Targets: "restaurant sales software" keyword.

```
Eyebrow: "Real-time reporting"
H2: "Daily P&L, per-item margins, per-outlet comparison — on your phone"
Body: "See today's sales while you're not at the restaurant. Which items are selling. Which outlet is underperforming. Where margins are leaking. All live."
Feature list:
  - "Daily P&L report"
  - "Per-item margin analysis"
  - "Per-outlet revenue comparison"
  - "Hourly sales trend"

data-testid="mgmt-lp-reports"
```

### Block 10 — S6: Built for India — CRITICAL SECTION (Lines 370–420)

**This section is the primary QS 1 fix.**  
Must contain:
1. The phrase **"best restaurant management software in india"** (exact — for Google keyword match)
2. Words "India" and "Indian restaurants" at least once each
3. GST, UPI explicitly mentioned

```
Eyebrow: "Built for India"
H2: "The best restaurant management software in India — built for GST, UPI, and Indian aggregators"
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         (exact phrase required for QS 1 fix)

Body paragraph 1:
"Finding the best restaurant management software in India means finding one that understands Indian operations — GST billing, UPI and Razorpay payments, Swiggy and Zomato integration, and Indian cuisine menu templates."

Body paragraph 2:
"MyGenie is used by 200+ outlets across 75 Indian cities. It's not a global product adapted for India — it's built for Indian restaurants from day one."

Feature pills:
  - "GST-compliant billing"
  - "UPI + Razorpay payments"
  - "Swiggy / Zomato sync"
  - "Indian menu templates"
  - "GSTR-1 reports"

data-testid="mgmt-lp-india"
```

### Block 11 — S7: Inline Pricing (Lines 422–500)

Same 3-card pattern as CR-85 plan.  
`id="lp-pricing"` · `data-testid="mgmt-lp-pricing"` · `scroll-mt-20`  
Plan card CTAs: `href="#lp-demo"`  
Footer note: `"No hidden fees · Cancel anytime · Annual billing"`

### Block 12 — S8: FAQ (Lines 502–545)

4 `FaqItem` components from FAQ_SCHEMA.  
`data-testid="mgmt-lp-faq"`  
Individual testids: `"mgmt-faq-multioutlet"`, `"mgmt-faq-aggregators"`, `"mgmt-faq-best-india"`, `"mgmt-faq-vs-billing"`

### Block 13 — S9: Demo CTA + DemoForm (Lines 547–585)

```
id="lp-demo"  +  scroll-mt-20
data-testid="mgmt-lp-demo"

H2: "Book a Free Management Demo"
Sub: "A specialist walks you through order management, staff controls and reports for your outlet type."
DemoForm: sector="restaurant-management"  shortForm
Form wrap data-testid: "mgmt-lp-form-wrap"
```

### Block 14 — Page shell (Lines 587–560)

```
export default function RestaurantManagementSoftware()
data-testid="restaurant-management-software-page"

<Seo
  title="Restaurant Management Software India | MyGenie POS"
  description="One platform to manage restaurant orders, staff, inventory and reporting. Used across 100+ Indian cities. Book a free demo — see it live for your outlet."
  path="/restaurant-management-software"
  jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
/>

Section render order:
  LandingNavbar → LpHero → TrustBand → LpProblem → LpOrders → LpStaff → LpReports → LpIndia → LpPricing → LpFaq → LpDemo
→ LandingFooter
```

---

## FILE 2 — `frontend/src/App.js`

**Insert after existing lazy imports block** (after `RestaurantPosSystem` if CR-86 already done):

```js
const RestaurantManagementSoftware = lazy(() => import("@/pages/RestaurantManagementSoftware"));
```

**Insert route after CR-86 route**:

```jsx
{/* CR-148 — Restaurant Management Software LP (Google Ads — Management & Ordering ad group, standalone) */}
<Route path="/restaurant-management-software" element={<RestaurantManagementSoftware />} />
```

---

## FILE 3 — `frontend/public/sitemap.xml`

```xml
  <url>
    <loc>https://www.mygenie.online/restaurant-management-software</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
```

---

## FILE 4 — `frontend/src/lib/seo.js`

```js
"/restaurant-management-software": {
  title: "Restaurant Management Software India | MyGenie POS",
  description: "One platform to manage restaurant orders, staff, inventory and reporting. Used across 100+ Indian cities. Book a free demo — see it live for your outlet.",
},
```

---

## Definition of Done checklist

- [ ] H1 is exactly `"Restaurant management software — orders, staff, and every outlet in one view."`
- [ ] Hero image is `/brand/banner.webp` — NOT an Unsplash waiter/stock photo
- [ ] `loading="eager"` on hero image
- [ ] S6 (Built for India) contains exact phrase `"best restaurant management software in india"` in H2
- [ ] "India" and "Indian restaurants" appear in S6 body
- [ ] "GST" and "UPI" appear explicitly in S6
- [ ] `id="lp-pricing"` present — secondary CTA `href="#lp-pricing"` (NOT `to="/pricing"`)
- [ ] `id="lp-demo"` DemoForm present — `sector="restaurant-management"`
- [ ] LandingNavbar only (no global nav)
- [ ] FAQPage JSON-LD in `<head>`
- [ ] Route in `App.js` at `/restaurant-management-software`
- [ ] URL in `sitemap.xml`
- [ ] Prerendered: `build/restaurant-management-software/index.html` exists
- [ ] Canonical = `https://www.mygenie.online/restaurant-management-software`

*Plan written 2026-08-25.*
