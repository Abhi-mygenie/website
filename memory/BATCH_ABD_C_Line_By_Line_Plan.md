# Batches A+D, B, C — Line-by-Line Implementation Plan
**Written:** 2026-08-21  
**Impact analysis:** `/app/memory/IMPACT_ANALYSIS_BATCHES_A_B_C_D_2026-08-21.md`

---

## Execution Order & Reasoning

```
ORDER:  Batch A+D  →  Batch C  →  Batch B
```

**Why this order:**

| Batch | Risk level | Files | Dependencies |
|---|---|---|---|
| A+D combined | Lowest — data files only | sectors.js, products.js | None |
| C | Low — additive JSON-LD | seo.js, Pricing.jsx, Home.jsx | seo.js must come before Pricing + Home |
| B | Medium — 7 changes, 2 files | DemoLanding.jsx, DemoForm.jsx | None |

**Why A+D combined:** Both batches edit the SAME two files. Separating them into two passes on the same files would be inefficient and risks missing a change. Do all 13 H1 changes in one pass.

**Why C before B:** Batch C is smaller (3 file touches, additive only). Better to land the quick wins in order of complexity. Batch B is the largest change (7 edits, competitor copy reframe) — do last so it gets full focus.

**Why no Suspense/hot-reload concern:** All changes are hot-reloadable. No .env changes. No dependency installs.

---

## ═══════════════════════════════════════
## BATCH A+D — All H1 Keyword Changes
## ═══════════════════════════════════════
**Files: `src/data/sectors.js` + `src/data/products.js`**  
**Total: 13 H1 string changes (5 Phase 1 + 8 Phase 2)**  
**Est. time: ~20 min**

### Pre-flight
- [ ] Open `/solutions/restaurants` in browser — note current H1 as baseline
- [ ] Open `/product/sell-serve` in browser — note current H1 as baseline

---

### sectors.js — 11 changes

**Line 9 — /solutions/restaurants (Phase 1)**
```js
// BEFORE:
    h1: "Turn tables faster, kill order errors, and see profit per table.",
// AFTER:
    h1: "Restaurant POS software — faster tables, fewer errors, more profit per cover.",
```

**Line 38 — /solutions/cafes (Phase 2)**
```js
// BEFORE:
    h1: "Protect every margin — and turn first-timers into regulars.",
// AFTER:
    h1: "Café POS system — protect every margin and turn first-timers into regulars.",
```

**Line 67 — /solutions/qsr (Phase 1)**
```js
// BEFORE:
    h1: "More covers per hour — and every cash drawer locked down.",
// AFTER:
    h1: "QSR POS & billing — more covers per hour and every cash drawer locked down.",
```

**Line 96 — /solutions/cloud-kitchens (Phase 1)**
```js
// BEFORE:
    h1: "Every brand and every aggregator — one screen, one inventory.",
// AFTER:
    h1: "Cloud kitchen POS — every brand and aggregator on one screen, one inventory.",
```

**Line 125 — /solutions/hotels-resorts (Phase 2)**
```js
// BEFORE:
    h1: "Run your entire property on one app — rooms, restaurant, spa, and bar. Even offline.",
// AFTER:
    h1: "Hotel POS system — rooms, restaurant, spa and bar on one app. Works even offline.",
```

**Line 154 — /solutions/food-courts (Phase 2)**
```js
// BEFORE:
    h1: "One wallet, many counters, zero reconciliation headaches.",
// AFTER:
    h1: "Food court POS — one shared wallet, many counters, zero reconciliation headaches.",
```

**Line 183 — /solutions/canteens (Phase 2)**
```js
// BEFORE:
    h1: "Prepaid, subsidized, and fully accountable — zero leakage.",
// AFTER:
    h1: "Canteen management software — prepaid, subsidized and fully accountable. Zero leakage.",
```

**Line 212 — /solutions/chains (Phase 2)**
```js
// BEFORE:
    h1: "Control every outlet from one dashboard — without flying to each one.",
// AFTER:
    h1: "Multi-outlet POS for chains & franchises — control every outlet from one dashboard.",
```

**Line 241 — /solutions/bars-pubs (Phase 2)**
```js
// BEFORE:
    h1: "Pour perfect profits — every tab, every pour, every last call.",
// AFTER:
    h1: "Bar POS system — every tab, every pour and every last call perfectly accounted.",
```

**Line 270 — /solutions/bakeries (Phase 2)**
```js
// BEFORE:
    h1: "From morning bread to custom cakes — run your bakery with precision.",
// AFTER:
    h1: "Bakery POS & management — from morning bread to custom cakes, run with precision.",
```

**Line 299 — /solutions/ice-cream-desserts (Phase 2)**
```js
// BEFORE:
    h1: "Serve sweet moments fast — and keep every scoop profitable.",
// AFTER:
    h1: "Ice cream shop POS — serve sweet moments fast and keep every scoop profitable.",
```

---

### products.js — 6 changes

**Line 8 — /product/sell-serve (Phase 1)**
```js
// BEFORE:
    h1: "Bill in seconds. Serve more covers. Lose zero orders.",
// AFTER:
    h1: "Restaurant POS & billing software — bill in seconds, serve more covers, lose zero orders.",
```

**Line 33 — /product/run-property (Phase 2)**
```js
// BEFORE:
    h1: "One app for rooms, restaurant, food court, and beyond.",
// AFTER:
    h1: "Hotel & property management POS — rooms, restaurant and food court on one app.",
```

**Line 56 — /product/customers (Phase 2)**
```js
// BEFORE:
    h1: "Turn every bill into a customer who comes back.",
// AFTER:
    h1: "Restaurant CRM & loyalty software — turn every bill into a customer who comes back.",
```

**Line 81 — /product/protect-profit (Phase 2)**
```js
// BEFORE:
    h1: "Catch leakage, theft, and waste — before they eat your margin.",
// AFTER:
    h1: "Restaurant inventory management — catch leakage, theft and waste before they hurt your margin.",
```

**Line 104 — /product/see-everything (Phase 1)**
```js
// BEFORE:
    h1: "Total visibility — every outlet, live, from your phone.",
// AFTER:
    h1: "Restaurant management software — total visibility from every outlet, live on your phone.",
```

**Line 128 — /product/central-inventory (Phase 2)**
```js
// BEFORE:
    h1: "One stock brain for every outlet — built for franchises & chains.",
// AFTER:
    h1: "Central inventory management for chains — one stock source of truth across all your outlets.",
```

---

### Batch A+D Checkpoint
- [ ] Hot-reload fires, compiles clean
- [ ] `/solutions/restaurants` H1 = "Restaurant POS software — faster tables..."
- [ ] `/solutions/qsr` H1 = "QSR POS & billing..."
- [ ] `/solutions/cloud-kitchens` H1 = "Cloud kitchen POS..."
- [ ] `/product/sell-serve` H1 = "Restaurant POS & billing software..."
- [ ] `/product/see-everything` H1 = "Restaurant management software..."
- [ ] All other changed pages load without error
- [ ] No meta title changes (meta uses `s.name` not `s.h1` — confirmed in analysis)

**Rollback:** Revert each h1 string to original. Hot-reload applies.

---

## ═══════════════════════════════════════
## BATCH C — Structured Data Schema
## ═══════════════════════════════════════
**Files: `src/lib/seo.js` → `src/pages/Pricing.jsx` + `src/pages/Home.jsx`**  
**Total: 3 file changes (Step 1 must come before Steps 2+3)**  
**Est. time: ~20 min**

**Note on AggregateRating:** Deferred by owner decision — no verified review source. SoftwareApplication + Offer only.

---

### Step C-1 — Add SOFTWARE_APP_JSONLD to seo.js
**File:** `src/lib/seo.js`  
**Insert after line 27** (after closing brace of `ORG_JSONLD`)

**Before (line 27-29):**
```js
};

// Static per-route SEO.
```

**After:**
```js
};

// SoftwareApplication entity — added to /pricing (Offer schema) and / (entity declaration).
// AggregateRating deferred — no verified review source. Add when Google My Business reviews established.
export const SOFTWARE_APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MyGenie POS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Point of Sale Software",
  operatingSystem: "Web, Android, iOS",
  description: "MyGenie POS is a hospitality operating system for restaurants, cafes, cloud kitchens and hotels. Billing, inventory, CRM, loyalty, and AI — all in one platform.",
  url: `${SITE_URL}/pricing`,
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "799",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "799",
        priceCurrency: "INR",
        unitText: "per outlet per month",
      },
      description: "POS & Billing, KOT, Owner Dashboard, Daily Reports",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "1499",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "1499",
        priceCurrency: "INR",
        unitText: "per outlet per month",
      },
      description: "Everything in Starter + Captain App, KDS, Online Ordering, CRM",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "2499",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "2499",
        priceCurrency: "INR",
        unitText: "per outlet per month",
      },
      description: "Everything in Growth + Loyalty, WhatsApp Automation, AI features, dedicated account manager",
    },
  ],
};

// Static per-route SEO.
```

**Key notes:**
- Growth plan price = **1499** (not 1299 — corrected from design mockup)
- Custom plan excluded — `price: null` is invalid in Offer schema
- AggregateRating intentionally absent

**Checkpoint after C-1:**
- No build errors — new export is syntactically valid
- Can verify: `grep "SOFTWARE_APP_JSONLD" src/lib/seo.js` returns the export

---

### Steps C-2 + C-3 — Pricing.jsx and Home.jsx (do together after C-1)

#### Pricing.jsx — 2 changes

**Change 1 — Add import (line 17):**
```js
// BEFORE (line 17):
import { PAGE_SEO } from "@/lib/seo";

// AFTER:
import { PAGE_SEO, SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**Change 2 — Add jsonLd to Seo call (line 151):**
```jsx
// BEFORE (line 151):
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" />

// AFTER:
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" jsonLd={[SOFTWARE_APP_JSONLD]} />
```

#### Home.jsx — 2 changes

**Change 3 — Add import (line 16):**
```js
// BEFORE (line 16):
import { PAGE_SEO, ORG_JSONLD } from "@/lib/seo";

// AFTER:
import { PAGE_SEO, ORG_JSONLD, SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**Change 4 — Extend jsonLd to array (line 32):**
```jsx
// BEFORE (line 32):
      <Seo title={PAGE_SEO["/"].title} description={PAGE_SEO["/"].description} path="/" jsonLd={ORG_JSONLD} />

// AFTER:
      <Seo title={PAGE_SEO["/"].title} description={PAGE_SEO["/"].description} path="/" jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD]} />
```

**Why array safe:** `Seo.jsx` line 41 already handles both: `(Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map(...)`. ✅

---

### Batch C Checkpoint
- [ ] Hot-reload compiles clean
- [ ] View page source on `/pricing` — find `<script type="application/ld+json">` with `"@type": "SoftwareApplication"`
- [ ] Verify 3 Offer entries present (Starter ₹799, Growth ₹1499, Pro ₹2499)
- [ ] View page source on `/` — find JSON-LD with both Organization AND SoftwareApplication
- [ ] Validate at: https://search.google.com/test/rich-results (paste /pricing URL)
- [ ] Homepage and Pricing page still load correctly — no visual change

**Rollback:** Remove `SOFTWARE_APP_JSONLD` from seo.js; revert both import lines and both Seo calls.

---

## ═══════════════════════════════════════
## BATCH B — /demo Competitor Reframe (CR-87)
## ═══════════════════════════════════════
**Files: `src/pages/DemoLanding.jsx` (7 changes) + `src/components/site/DemoForm.jsx` (1 change)**  
**Est. time: ~45 min**

### Pre-flight check
- [ ] `grep "Link\|COMPANY" src/pages/DemoLanding.jsx` — confirm both absent (they are, per analysis)
- [ ] Open `/demo` in browser — note current H1 and trust strip as baseline

---

### DemoLanding.jsx — 7 changes

#### Change B-1 — Imports: add Link + COMPANY (lines 1–8)
```jsx
// BEFORE (lines 1–8):
import Logo from "@/components/site/Logo";
import DemoForm from "@/components/site/DemoForm";
import Seo from "@/components/site/Seo";
import Reveal from "@/components/site/Reveal";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc } from "@/lib/cms/CmsProvider";
import { PAGE_SEO } from "@/lib/seo";
import { Clock3 } from "lucide-react";

// AFTER:
import { Link } from "react-router-dom";
import Logo from "@/components/site/Logo";
import DemoForm from "@/components/site/DemoForm";
import Seo from "@/components/site/Seo";
import Reveal from "@/components/site/Reveal";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc } from "@/lib/cms/CmsProvider";
import { PAGE_SEO } from "@/lib/seo";
import { COMPANY } from "@/data/company";
import { Clock3 } from "lucide-react";
```

**Why:** `Link` needed for Privacy Policy in footer. `COMPANY` needed for phone/email in footer.

---

#### Change B-2 — LandingFooter: add phone + email + Privacy Policy (lines 22–31)
```jsx
// BEFORE (lines 22–31):
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="demo-landing-footer">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo light />
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd. All rights reserved.</span>
      </div>
    </footer>
  );
}

// AFTER:
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="demo-landing-footer">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="demo-footer-phone">{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-brand-yellow transition-colors" data-testid="demo-footer-email">{COMPANY.supportEmail}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="demo-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}
```

---

#### Change B-3 — Replace TRUST_NAMES with DEMO_TRUST_LOGOS (line 44)
```js
// BEFORE (line 44):
const TRUST_NAMES = ["Hyatt Centric", "Palm Forest Resort", "Love Bites", "The Mill Bakery", "Aanya's Kitchen"];

// AFTER:
const DEMO_TRUST_LOGOS = [
  { name: "Hyatt Centric",      img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest Resort", img: "/brand/palm-forest.png"   },
  { name: "Love Bites",         img: "/brand/love-bites.png"    },
  { name: "The Mill Bakery",    img: "/brand/mill-bakery.png"   },
  { name: "Bamboo Yoga",        img: "/brand/bamboo-yoga.png"   },
];
```

---

#### Change B-4 — H1 copy: competitor intent (line 49 in DEMO_DEFAULTS)
```js
// BEFORE (line 49):
  headline: "See MyGenie live — built for your restaurant",

// AFTER:
  headline: "Compare MyGenie With Your Current POS",
```

---

#### Change B-5 — Stat 2 label: switching speed (line 94)
```jsx
// BEFORE (line 94):
                <ProofCard value="48hr" label="from sign-up to first bill" />

// AFTER:
                <ProofCard value="48hr" label="to switch from your current POS" />
```

---

#### Change B-6 — Add 5th walkthrough bullet (lines 109–114)
```jsx
// BEFORE (lines 109–114):
                {[
                  ["Live billing demo", "We bill a real order on your outlet type — QSR, café, or full-service.", false],
                  ["Your leakage report", "We show you exactly where money is leaving your current setup.", true],
                  ["AI features live", "Smart upsell, audit assistant, and customer win-back — in action.", false],
                  ["Your pricing", "Transparent quote built for your outlet count and city. No surprises.", false],
                ].map(([title, desc, highlight]) => (

// AFTER:
                {[
                  ["Live billing demo", "We bill a real order on your outlet type — QSR, café, or full-service.", false],
                  ["Your leakage report", "We show you exactly where money is leaving your current setup.", true],
                  ["AI features live", "Smart upsell, audit assistant, and customer win-back — in action.", false],
                  ["Your pricing", "Transparent quote built for your outlet count and city. No surprises.", false],
                  ["Side-by-side comparison", "We show you exactly how MyGenie stacks up against your current setup, feature by feature.", false],
                ].map(([title, desc, highlight]) => (
```

---

#### Change B-7 — Form: add shortForm prop (line 131)
```jsx
// BEFORE (line 131):
            <DemoForm sector="meta-demo" />

// AFTER:
            <DemoForm sector="meta-demo" shortForm />
```

---

#### Change B-8 — Trust strip: replace TRUST_NAMES loop with logo images + update tag line (lines 140–149)
```jsx
// BEFORE (lines 140–149):
              <div className="flex flex-wrap gap-2">
                {TRUST_NAMES.map((name) => (
                  <span key={name} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#9DB1A4] font-medium">
                    {name}
                  </span>
                ))}
                <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#9DB1A4] font-medium">
                  +500 outlets across 75 cities
                </span>
              </div>

// AFTER:
              <div className="flex flex-wrap gap-3 items-center">
                {DEMO_TRUST_LOGOS.map((logo) => (
                  <img
                    key={logo.name}
                    src={logo.img}
                    alt={logo.name}
                    title={logo.name}
                    className="h-7 w-auto object-contain opacity-50 hover:opacity-90 transition-opacity"
                    loading="lazy"
                    width={100}
                    height={28}
                  />
                ))}
                <span className="text-xs text-[#5B7A68] font-medium">100s of restaurants switched to MyGenie across 75 cities</span>
              </div>
```

**Note on trust tag line:** Updated from "+500 outlets across 75 cities already on MyGenie" to "100s of restaurants switched to MyGenie across 75 cities" — the comparison-shopper wording per the brief.

---

### DemoForm.jsx — 1 change

#### Change B-9 — Trust line text: "already on" → "switched to" (line 383)
```jsx
// BEFORE (line 383):
        <p className="text-xs text-brand-muted text-center mt-3">100s of outlets across 75 cities already on MyGenie</p>

// AFTER:
        <p className="text-xs text-brand-muted text-center mt-3">100s of restaurants switched to MyGenie across 75 cities</p>
```

**This change is isolated to `sector === "meta-demo"` conditional (line 382). No other form instances are affected.** ✅

---

### Batch B Checkpoint
- [ ] `/demo` page loads correctly
- [ ] H1 = "Compare MyGenie With Your Current POS"
- [ ] Middle stat card = "48hr / to switch from your current POS"
- [ ] 5 walkthrough bullets visible (4 original + "Side-by-side comparison")
- [ ] Form shows 4 fields only (name, phone, email, business name optional)
- [ ] Trust strip shows 5 logo images (Hyatt Centric, Palm Forest, Love Bites, Mill Bakery, Bamboo Yoga)
- [ ] Tag line reads "100s of restaurants switched to MyGenie across 75 cities"
- [ ] Footer shows phone + email + Privacy Policy
- [ ] Privacy Policy link navigates to /privacy
- [ ] Homepage form trust line unchanged (still "100s of outlets across 75 cities already on MyGenie") — verify DemoForm without sector="meta-demo"
- [ ] Petpooja page form unchanged

**Rollback:** Revert all 8 changes in DemoLanding.jsx + 1 change in DemoForm.jsx.

---

## Post-Implementation Validation (all batches)

### H1 spot-checks (Batch A+D)
- [ ] `/solutions/restaurants` — H1 contains "Restaurant POS software"
- [ ] `/solutions/qsr` — H1 contains "QSR POS"
- [ ] `/solutions/cloud-kitchens` — H1 contains "Cloud kitchen POS"
- [ ] `/product/sell-serve` — H1 contains "Restaurant POS & billing software"
- [ ] `/product/see-everything` — H1 contains "Restaurant management software"
- [ ] `/solutions/cafes` — H1 contains "Café POS system"
- [ ] All pages load, no 404s, no console errors

### Schema checks (Batch C)
- [ ] `document.head.innerHTML` on `/pricing` contains `SoftwareApplication`
- [ ] `document.head.innerHTML` on `/pricing` contains `"price": "1499"` (not 1299)
- [ ] `document.head.innerHTML` on `/` contains both `Organization` and `SoftwareApplication`
- [ ] No `AggregateRating` in either page (deferred)

### /demo page checks (Batch B)
- [ ] H1 = "Compare MyGenie With Your Current POS"
- [ ] 5 trust logos (images not text)
- [ ] 5 walkthrough bullets
- [ ] 4 form fields
- [ ] Footer contacts present

---

## Execution Summary Table

| Step | Batch | File | Change | Est. |
|---|---|---|---|---|
| 1 | A+D | sectors.js | 11 h1 string changes | 10 min |
| 2 | A+D | products.js | 6 h1 string changes | 5 min |
| 3 | C | seo.js | Add SOFTWARE_APP_JSONLD | 5 min |
| 4 | C | Pricing.jsx | Import + jsonLd prop | 2 min |
| 5 | C | Home.jsx | Import + jsonLd array | 2 min |
| 6 | B | DemoLanding.jsx | 8 changes (imports, footer, H1, stat, bullet, form, logos, tag) | 20 min |
| 7 | B | DemoForm.jsx | 1 trust line change | 2 min |

**Total: ~46 min. All hot-reloadable. No env changes. No dependency installs.**

---

*Plan written 2026-08-21. All line numbers verified against live files.*
