# CR-152 — Create /cloud-kitchen-pos Dedicated Landing Page

**Type:** New Page / Ad Group LP
**Date Raised:** 2026-08-25
**Status:** OPEN
**Priority:** P2 (Alpha campaign ad group exists; sector page currently receives traffic)
**Ad Group:** Cloud Kitchen (ID: 202501556327) · Alpha Campaign
**Current wrong Final URL:** `/solutions/cloud-kitchens` ← sector page with global Navbar (20+ exit links)
**Improves:** Google Ads conversion rate · Funnel integrity · Ad Relevance

---

## 1. Problem Statement

The Alpha campaign Cloud Kitchen ad group sends paid traffic to `/solutions/cloud-kitchens` — the organic sector page. This page uses the **global Navbar** (`<Navbar />`) with Solutions ▾, Product ▾, Practical AI, Pricing, Customers, Resources ▾ — over 20 exit links.

Every other Alpha campaign LP (Billing Software, POS System, Management, QSR) uses `LandingNavbar` (logo-only, no exit links) to keep paid traffic captive. Cloud Kitchen is the **only** ad group without a dedicated standalone LP.

**Current sector page URL in sitemap:** `https://www.mygenie.online/solutions/cloud-kitchens`
**New standalone LP URL:** `https://www.mygenie.online/cloud-kitchen-pos`

The organic sector page at `/solutions/cloud-kitchens` remains live and is NOT replaced — it continues to serve organic traffic and SEO. Only the **Ads Final URL** changes to point to the new LP.

---

## 2. Page Specification

### SEO
| Field | Value |
|---|---|
| **URL** | `/cloud-kitchen-pos` |
| **Meta Title** | `Cloud Kitchen POS & Billing Software India \| MyGenie` |
| **Meta Description** | `POS built for cloud kitchens — manage every brand, every aggregator, and all inventory from one screen. GST-ready. Book a free demo.` |
| **H1** | `Cloud kitchen POS & billing software — every brand, every aggregator, one screen.` |
| **Hero Sub-headline** | `Stop juggling Swiggy, Zomato and multiple brand tablets. MyGenie unifies ordering, billing, inventory and reports into one backend — built for cloud kitchen speed.` |
| **Primary CTA** | `Book a Free Cloud Kitchen Demo →` |
| **Secondary CTA** | `See Pricing ↓` — scrolls to `#lp-pricing` (inline, not `/pricing` link) |
| **Hero Image** | `/brand/banner.webp` — MyGenie dashboard screenshot (776×637). `loading="eager"` |
| **Canonical** | `https://www.mygenie.online/cloud-kitchen-pos` |

---

## 3. Page Structure (9 sections in order)

1. **Hero — Every Brand, One Screen**
   H1 uses "cloud kitchen POS" and "billing software" verbatim. Sub mentions Swiggy/Zomato specifically.
   Stat chips: `₹0 missed orders` · `All aggregators` · `1 screen` · `GST-ready`

2. **Problem strip — "Too many tablets"**
   Pain: "3 tablets for 3 aggregators. A printer that jams. A spreadsheet for stock."
   Addresses the core cloud kitchen operations pain — fragmented tools.

3. **Feature: Aggregator sync**
   Swiggy, Zomato, Magicpin orders flow into one screen automatically. No missed orders.
   Keyword: "restaurant management software" secondary cluster.

4. **Feature: Multi-brand billing**
   Run 2–5 dark kitchen brands from one backend. Separate menus, shared inventory.
   Addresses "cloud kitchen billing software" keyword.

5. **Feature: Central inventory**
   One shared ingredient stock across all brands. Auto-deduct per order. No spreadsheets.

6. **Feature: KDS + Direct delivery**
   Kitchen Display System for order flow. Direct (commission-free) delivery link for takeaway.

7. **Social proof — cloud kitchen specific**
   - Love Bites: "40% lower fixed cost — lean ops on just a few mobile devices."
   - Pavan Pages: "Launched a second kitchen on the same backend. Revenue doubled, infra cost stayed flat."

8. **Inline Pricing — `id="lp-pricing"`**
   3-card pricing block (secondary CTA scrolls here):
   - Starter ₹799/mo — 1 outlet, billing + KOT
   - Growth ₹1,499/mo ⭐ MOST POPULAR — 1 outlet, full suite + aggregator sync
   - Pro ₹2,499/mo — multi-brand + multi-outlet + central inventory
   Footer note: "No hidden fees. Cancel anytime. Annual billing."

9. **FAQ + Bottom DemoForm**
   FAQs:
   - Does it work with Swighy, Zomato, and Magicpin?
   - Can I run multiple brands from one account?
   - Is the cloud kitchen billing software GST-compliant?
   - Do I need a billing machine or POS hardware?
   - How fast is setup for a new kitchen?

   DemoForm below FAQ: `sector="cloud-kitchen"` · Submit button: `"Book a Free Cloud Kitchen Demo →"`

---

## 4. Page Structure
- `LandingNavbar` (logo-only, no exit links — same as CR-85/86/148/149)
- `LandingFooter` with phone + privacy link

---

## 5. Files to Create/Change

| File | Change |
|---|---|
| `frontend/src/pages/CloudKitchenPos.jsx` | New page (create) |
| `frontend/src/App.js` | Add `lazy(() => import("@/pages/CloudKitchenPos"))` + route `/cloud-kitchen-pos` |
| `frontend/public/sitemap.xml` | Add URL entry (priority 0.9) |

**Do NOT modify** `frontend/src/data/sectors.js` Cloud Kitchens entry — that drives the organic sector page and must remain unchanged.

---

## 6. Google Ads Actions Required (not dev)

- **ADS:** Update Cloud Kitchen ad group Final URL from `/solutions/cloud-kitchens` → `/cloud-kitchen-pos`
- **ADS:** Verify ad group headlines include "cloud kitchen" and "billing software" for Ad Relevance match with the new LP H1

---

## 7. Impact Analysis

### Why a dedicated LP vs the existing sector page

| | `/solutions/cloud-kitchens` (current) | `/cloud-kitchen-pos` (new LP) |
|---|---|---|
| Navbar | Global (20+ exit links) | LandingNavbar (logo only) |
| Exit routes | Solutions, Product, AI, Pricing, Customers, Resources | None |
| Conversion focus | General sector overview | Single CTA: book demo |
| H1 keyword match | "Cloud kitchen POS — every brand and aggregator on one screen, one inventory." | Same core H1, slightly tightened for "POS & billing software" keyword |
| Inline pricing | ❌ | ✅ `#lp-pricing` |
| DemoForm | ✅ (via scroll to #sector-demo) | ✅ (embedded with sector="cloud-kitchen") |

### Conversion uplift rationale

All other Alpha ad groups (Billing, POS, Management, QSR) use LandingNavbar. Putting the Cloud Kitchen ad group on a page with 20+ exit links means paid traffic can leave via any nav link. Industry benchmarks show 15–30% conversion rate improvement from removing nav on LP vs full-nav pages for paid traffic.

### Relationship to organic page

The sector page at `/solutions/cloud-kitchens` is **not decommissioned**. It:
- Remains in sitemap at its existing URL
- Continues to serve organic / direct traffic
- Retains all SEO content and schema (BreadcrumbList, etc.)

Only the Ads Final URL changes. The two pages coexist.

---

## 8. Definition of Done

- [ ] `/cloud-kitchen-pos` renders on desktop + mobile
- [ ] H1 contains "cloud kitchen POS" and "billing software"
- [ ] Meta title contains "Cloud Kitchen POS"
- [ ] "Swiggy" and "Zomato" mentioned explicitly in body
- [ ] DemoForm submits leads with `sector="cloud-kitchen"`
- [ ] DemoForm submit button reads `"Book a Free Cloud Kitchen Demo →"`
- [ ] Secondary CTA scrolls to `#lp-pricing` (not `/pricing` link)
- [ ] `id="lp-pricing"` pricing section present with 3 tiers
- [ ] LandingNavbar (no global nav)
- [ ] FAQPage JSON-LD valid
- [ ] `/solutions/cloud-kitchens` organic page unchanged
- [ ] URL `/cloud-kitchen-pos` in sitemap.xml (priority 0.9)
- [ ] Prerendered

---

*CR-152 registered 2026-08-25. Source: Validation analysis — Cloud Kitchen is the only Alpha campaign ad group without a dedicated standalone LP. Organic sector page at /solutions/cloud-kitchens unaffected.*
