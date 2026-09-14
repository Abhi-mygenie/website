# CR-85 — Create /restaurant-billing-software Dedicated Landing Page

**Type:** New Page / Ad Group LP
**Date Raised:** 2026-08-20
**Updated with live brief:** 2026-08-25
**Status:** OPEN
**Priority:** **P1 — URGENT** (biggest QS leak in the account)
**Ad Group:** Billing Software (ID: 199781695618) · Alpha Campaign
**Improves:** Google Ads Quality Score · Ad Relevance · LP Experience · CPC

---

## 1. Problem Statement

Every click on "restaurant billing software" currently lands on `mygenie.online` (homepage). The homepage H1 reads "Run a more profitable hospitality business — from your phone." — zero keyword match. Average QS is 6–7 across all keywords; should be 8–9 with a dedicated LP.

**Top converting search terms (last 30 days):**
| Search Term | Impr | Clicks | Conv |
|---|---|---|---|
| restaurant billing software | 221 | 31 | 3 |
| billing software for restaurant | 105 | 16 | 3 |
| cafe billing software | 34 | 7 | 1 |
| best billing software for restaurant | 33 | 3 | 0 |
| billing software for cafe | 19 | 4 | 0 |
| best billing software for cafe | 13 | 3 | 1 |
| restaurant bill software | 13 | 6 | 0 |
| kot software for restaurant | 9 | 2 | 0 |

**Live keywords (with QS):**
- [restaurant billing software] QS 7
- [cafe billing software] QS 7
- [best billing software for restaurant] QS 7
- [best software for restaurant billing] QS 7
- [bill software for restaurant] QS 7
- [bar and restaurant billing software] QS 6
- [billing solution for restaurant]
- [bar and restaurant billing]

---

## 2. Page Specification

### SEO
| Field | Value |
|---|---|
| **URL** | `/restaurant-billing-software` |
| **Meta Title** | `Restaurant Billing Software — GST-Ready \| MyGenie POS` |
| **Meta Description** | `Fast, accurate billing for restaurants & cafes. GST-compliant, cloud-based, runs on any device. Bill in seconds — book a free demo.` |
| **H1** | `Restaurant billing software — bill in seconds, no errors, fully GST-ready.` |
| **Hero Sub-headline** | `Built for restaurants, cafes, and bars. Takes orders, prints bills, files GST — on any phone or tablet.` |
| **Primary CTA** | `Book a Free Demo` |
| **Canonical** | `https://www.mygenie.online/restaurant-billing-software` |

### Page Structure (8 sections in order)

1. **Hero — Billing Speed + GST**
   H1 + stat: "31 clicks → bills in under 8 seconds". KV image: phone showing bill print. CTA above fold.

2. **Social proof strip**
   3 customer logos + one stat each. e.g. Love Bites: "40% lower fixed cost on 3 devices"

3. **Feature: GST-compliant billing**
   Auto GST calculation, GSTIN on bills, filing reports. Section heading must contain "billing software".

4. **Feature: Works for restaurants AND cafes**
   Explicitly mention: dine-in, takeaway, delivery. Addresses "cafe billing software" search intent.

5. **Feature: KOT / Kitchen Order Ticket**
   Addresses "kot software for restaurant" searches. KOT prints to kitchen automatically.

6. **Works on any device — no billing machine needed**
   Key differentiator vs hardware POS. "No billing machine required — use your existing phone or tablet."

7. **FAQ — billing-specific**
   - Is it GST-compliant?
   - Does it work offline?
   - Can I use it for a cafe AND restaurant?
   - How fast is billing?

8. **Bottom CTA**
   "Book a free 45-min billing software demo" — repeat keyword in CTA label.

### Ad Headlines to echo in page copy
Restaurant Billing Software · Bill Faster, Serve More · GST-Ready Billing System · No More Manual Bills · Bill in Seconds, Not Minutes · Error-Free Billing, Always

### Page structure
- `LandingNavbar` (logo-only, no exit links — follow /petpooja-alternative pattern)
- `LandingFooter` with phone + privacy link

---

## 3. Files to Create/Change

| File | Change |
|---|---|
| `frontend/src/pages/RestaurantBillingSoftware.jsx` | New page (create) |
| `frontend/src/App.js` | Add lazy import + route |
| `frontend/public/sitemap.xml` | Add URL entry (priority 0.9) |

---

## 4. Google Ads Actions Required (not dev)

- **ADS:** Update Billing Software ad group Final URL → `/restaurant-billing-software` (currently homepage)
- **ADS:** Add "billing machine for restaurant" as exact negative (hardware intent, 0 conv)

---

## 5. Definition of Done

- [ ] `/restaurant-billing-software` renders on desktop + mobile
- [ ] H1 contains "restaurant billing software"
- [ ] Meta title contains "Restaurant Billing Software"
- [ ] DemoForm submits leads correctly with sector="billing-software"
- [ ] LandingNavbar (no global nav)
- [ ] FAQPage JSON-LD valid in Google Rich Results Test
- [ ] URL in sitemap.xml
- [ ] Prerendered (in react-snap / prerender.js routes)

---

---

## 6. Impact Analysis Update — 2026-08-25

### Change A — Add inline pricing section (new section between FAQ and Bottom CTA)

**Why:** The secondary CTA "See Pricing" currently links to `/pricing` (full page navigation). Since this LP uses `LandingNavbar` to keep paid traffic captive, a link off-page is an escape valve that contradicts the conversion funnel design. Pattern validated by `/petpooja-alternative` which uses `href="#vsp-comparison"` scroll-down instead of off-page navigation.

**Section to add:**
```
id="lp-pricing"
Position: between FAQ and Bottom CTA (Section 8 becomes Section 9)
Content: 3-card pricing block
  - Starter  ₹799/mo   — 1 outlet, billing + KOT
  - Growth   ₹1,499/mo ⭐ MOST POPULAR — 1 outlet, full suite
  - Pro      ₹2,499/mo — multi-outlet + reports
Footer note: "No hidden fees. Cancel anytime. Annual billing."
```

**Impact:** Visitor sees price without leaving LP → removes objection at point of highest intent.

### Change B — Secondary CTA updated

| Before | After |
|---|---|
| `<Link to="/pricing">See Pricing</Link>` | `<a href="#lp-pricing">See Pricing ↓</a>` |

Funnel stays closed. Visitor scrolls to inline pricing block instead of navigating away.

### Definition of Done — additions

- [ ] `id="lp-pricing"` pricing section present on page
- [ ] Secondary CTA scrolls to `#lp-pricing` (not `/pricing` link)
- [ ] All 3 pricing tiers visible on mobile without horizontal scroll

*Impact analysis written 2026-08-25.*
