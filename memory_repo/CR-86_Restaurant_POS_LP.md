# CR-86 — Create /restaurant-pos-system Dedicated Landing Page

**Type:** New Page / Ad Group LP
**Date Raised:** 2026-08-20
**Updated with live brief:** 2026-08-25
**Updated — impact analysis:** 2026-08-25
**Status:** OPEN
**Priority:** P1
**Ad Group:** POS System (ID: 200309564562) · Alpha Campaign
**Improves:** Google Ads Quality Score · Ad Relevance · LP Experience

---

## 1. Problem Statement

Ads currently sending to `/product/sell-serve` — page title "Sell & Serve Faster | MyGenie POS Features" has zero keyword match for POS queries. H1 says "Restaurant POS & Billing" which is good, but the title drags QS.

**QS 3** on the highest-intent terms: "best restaurant pos software", "best pos system restaurant", "pos software for restaurant india".

**Bleeding spend (urgent negatives):**
| Search Term | Impr | Clicks | Spend | Conv | Action |
|---|---|---|---|---|---|
| billing machine for restaurant | 74 | 18 | ₹1.6L | 0 | EXACT NEGATIVE |
| restaurant billing machine | 40 | 7 | ₹0.8L | 0 | EXACT NEGATIVE |
| pos machine for restaurant | 48 | 8 | — | 0 | EXACT NEGATIVE |

Together: 162 impressions, 33 clicks, ₹2.4L+, 0 conversions — hardware intent, not software.

**Top search terms (last 30 days):**
| Search Term | Impr | Clicks | Conv |
|---|---|---|---|
| pos software for restaurant | 69 | 11 | 1 |
| restaurant pos | 67 | 9 | 0 |
| restaurant billing software | 64 | 12 | 0 |
| pos for restaurant | 48 | 10 | 0 |
| pos system for restaurant | 40 | 5 | 0 |
| restaurant pos system | 36 | 7 | 1 |
| restaurant pos software | 60 | 6 | 1 |

**Live keywords:**
- [restaurant pos system] QS 7
- [restaurant pos] QS 7
- [pos software for restaurant] QS 7
- [best restaurant pos software] QS 3
- [best pos system restaurant] QS 3
- [pos software for restaurant india] QS 3
- [online restaurant pos]
- [buy restaurant pos system]

---

## 2. Page Specification

### SEO
| Field | Value |
|---|---|
| **URL** | `/restaurant-pos-system` *(changed from original `/restaurant-pos`)* |
| **Meta Title** | `Restaurant POS System — India's Best \| MyGenie` |
| **Meta Description** | `Complete restaurant POS system — billing, inventory, KOT, and real-time reports in one app. No hardware lock-in. Works on any device. Book a free demo.` |
| **H1** | `Best restaurant POS system — orders, billing, and reports in one place, on any device.` |
| **Hero Sub-headline** | `India's restaurant POS built for the floor — no bulky machines, no per-device fees, no downtime.` |
| **Primary CTA** | `Book a Free POS Demo` |
| **Secondary CTA** | `See Pricing ↓` — scrolls to `#lp-pricing` (inline, not `/pricing` link — LP uses LandingNavbar, no exit links) |
| **Canonical** | `https://www.mygenie.online/restaurant-pos-system` |

### Page Structure (7 sections in order)

1. **Hero — "POS System" + No Machine Required**
   Directly address hardware-vs-software confusion. H1 uses "restaurant POS system" verbatim.

2. **What's included: POS + Billing + Inventory + Reports**
   4-feature grid. Each heading must use: "POS", "billing", "inventory", "reports".

3. **Works for multi-outlet & chains**
   Addresses "best pos system restaurant" intent — someone searching "best" is comparing. Position as the chain-friendly option.

4. **India-specific: GST, UPI, Swiggy/Zomato**
   Directly targets "pos software for restaurant india". Body copy must include "India" and "Indian restaurants".

5. **Customer result: Terraria Café — 22% more revenue per shift**
   Specific, measurable outcome from existing STORIES data.

6. **FAQ**
   - Do I need to buy a POS machine?
   - What's the difference between a POS and a billing machine?
   - Does it work offline?
   - How fast is setup?

7. **Inline Pricing — `id="lp-pricing"`**
   3-card pricing block (keeps visitor on-page — secondary CTA scrolls here):
   - Starter ₹799/mo — 1 outlet, billing + KOT
   - Growth ₹1,499/mo ⭐ MOST POPULAR — 1 outlet, full suite
   - Pro ₹2,499/mo — multi-outlet + reports
   Footer note: "No hidden fees. Cancel anytime. Annual billing."

8. **Bottom CTA**
   "See the restaurant POS system live — book a free 45-min demo"

### Ad Headlines to echo in page copy
Restaurant POS System · All-in-One Restaurant POS · POS + Billing + Reports · POS, No Hardware Lock-in · Track Sales in Real Time · Nothing Slips Through Cracks

### Page structure
- `LandingNavbar` (logo-only, no exit links)
- `LandingFooter` with phone + privacy link

---

## 3. Files to Create/Change

| File | Change |
|---|---|
| `frontend/src/pages/RestaurantPosSystem.jsx` | New page (create) |
| `frontend/src/App.js` | Add lazy import + route (`/restaurant-pos-system`) |
| `frontend/public/sitemap.xml` | Add URL entry (priority 0.9) |

---

## 4. Google Ads Actions Required (not dev)

- **ADS URGENT:** Add exact negatives: [billing machine for restaurant], [restaurant billing machine], [pos machine for restaurant] — ₹2.4L+ with 0 conversions
- **ADS:** Update POS System ad group Final URL → `/restaurant-pos-system` (currently `/product/sell-serve`)

---

## 5. Definition of Done

- [ ] `/restaurant-pos-system` renders on desktop + mobile
- [ ] H1 contains **"Best restaurant POS system"** (word "best" present — fixes QS 3 on [best restaurant pos software])
- [ ] Meta title contains "Restaurant POS System"
- [ ] "India" appears explicitly in body copy
- [ ] DemoForm submits leads with sector="restaurant-pos"
- [ ] LandingNavbar (no global nav)
- [ ] Secondary CTA scrolls to `#lp-pricing` (not a `/pricing` link)
- [ ] `id="lp-pricing"` pricing section present with 3 tiers
- [ ] FAQPage JSON-LD valid
- [ ] URL in sitemap.xml
- [ ] Prerendered

---

---

## 6. Impact Analysis — 2026-08-25

### Change A — H1 updated: added "Best"

**Why:** QS 3 on `[best restaurant pos software]`, `[best pos system restaurant]`, `[pos software for restaurant india]` is caused by zero keyword overlap between the ad's target term and the LP H1. Google's Ad Relevance component compares the search query to the LP headline.

| Before | After |
|---|---|
| `"Restaurant POS system — orders, billing…"` | `"Best restaurant POS system — orders, billing…"` |

**Expected impact:** QS 3 → QS 6–7 on the three "best" keyword variants. "Best" appears in H1 and should also appear in the body (Section 3 — "Works for multi-outlet & chains" should include a sentence like "The best restaurant POS grows with you — from single outlet to chain.").

### Change B — Inline pricing section added (Section 7, new)

**Why:** Secondary CTA "See Pricing" previously linked to `/pricing` — a full page navigation that breaks the captive funnel enforced by `LandingNavbar`. Pattern from `/petpooja-alternative` uses `href="#vsp-comparison"` scroll instead.

**Net effect:** 7 → 8 sections. Bottom CTA moves to Section 8.

### Change C — Secondary CTA: off-page link → scroll anchor

| Before | After |
|---|---|
| `<Link to="/pricing">See Pricing</Link>` | `<a href="#lp-pricing">See Pricing ↓</a>` |

**Impact:** Visitor stays on LP, sees price in context of the page they just read, converts at higher rate. Matches petpooja-alternative conversion pattern.

*CR-86 registered 2026-08-20. URL updated `/restaurant-pos` → `/restaurant-pos-system`. Brief updated 2026-08-25. Impact analysis added 2026-08-25.*
