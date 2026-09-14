# CR-148 — Create /restaurant-management-software Dedicated Landing Page

**Type:** New Page / Ad Group LP
**Date Raised:** 2026-08-25
**Updated — impact analysis:** 2026-08-25
**Status:** OPEN
**Priority:** P1 (QS 1 on primary keyword)
**Ad Group:** Management & Ordering (ID: 202501557247) · Alpha Campaign
**Improves:** Google Ads Quality Score · Ad Relevance

---

## 1. Problem Statement

Ads currently sending to `/product/see-everything` — page title "See Everything | MyGenie POS Features" has zero keyword match.

**QS 1** on "best restaurant management software in india" — the worst possible score. QS 3 on "apps for restaurants to take orders" and "best app for restaurant billing".

**Low-intent leak:**
- "food delivery apps" — 11 impressions, consumer intent not B2B → add as exact negative

**Top search terms (last 30 days):**
| Search Term | Impr | Clicks | Conv |
|---|---|---|---|
| restaurant software | 87 | 10 | 1 |
| restaurant management software | 55 | 2 | 3 |
| restaurant management system | 28 | 3 | 1 |
| restaurant management platform | 15 | 2 | 0 |
| food delivery apps ⚠️ | 11 | 0 | 0 — NEGATIVE |

**Live keywords:**
- [restaurant software] QS 7
- [restaurant management software] QS 7
- [online restaurant app] QS 5
- [software for bar and restaurant] QS 4
- [apps for restaurants to take orders] QS 3
- [best app for restaurant billing] QS 3
- [best restaurant management software in india] QS 1
- [restaurant ordering system app]
- [restaurant sales software]

---

## 2. Page Specification

### SEO
| Field | Value |
|---|---|
| **URL** | `/restaurant-management-software` |
| **Meta Title** | `Restaurant Management Software India \| MyGenie POS` |
| **Meta Description** | `One platform to manage restaurant orders, staff, inventory and reporting. Used across 100+ Indian cities. Book a free demo — see it live for your outlet.` |
| **H1** | `Restaurant management software — orders, staff, and every outlet in one view.` |
| **Hero Sub-headline** | `Stop switching between apps. MyGenie brings your entire restaurant operation onto one screen — billing, ordering, inventory, and reports.` |
| **India Qualifier** | Body copy MUST include "India" and "Indian restaurants" explicitly — required to fix QS 1 on "best restaurant management software in india" |
| **Primary CTA** | `Book a Free Management Demo` |
| **Secondary CTA** | `See Pricing ↓` — scrolls to `#lp-pricing` (inline, not `/pricing` link — LP uses LandingNavbar, no exit links) |
| **Hero Image** | `/brand/banner.webp` — MyGenie app dashboard screenshot (776×637 RGBA). Use `<img src="/brand/banner.webp" alt="MyGenie restaurant management software dashboard" width={776} height={637} className="w-full h-[400px] object-contain" loading="eager" />`. Do NOT use Unsplash stock photo (waiter/staff image signals consumer context, not B2B software evaluation) |
| **Canonical** | `https://www.mygenie.online/restaurant-management-software` |

### Page Structure (7 sections in order)

1. **Hero — Whole Restaurant, One App**
   H1 uses "restaurant management software" verbatim. Sub: "Used by 200+ outlets across India."

2. **Problem statement: Too many apps**
   "You're running your restaurant across 4 different apps. Here's one that does all of it."
   Addresses "stop juggling" pain point from ad descriptions.

3. **Order management**
   Dine-in, takeaway, Swiggy/Zomato — all orders in one place.
   Addresses "restaurant ordering system app" keyword cluster.

4. **Staff management**
   Shift reports, attendance, role-based access.
   Addresses "Orders, Staff & Reports" headline theme.

5. **Real-time reporting**
   Daily P&L, per-item margins, per-outlet comparison.
   Addresses "restaurant sales software" keyword.

6. **Built for India — critical section**
   GST compliance, UPI integration, Indian cuisine menu templates.
   Must use the phrase "best restaurant management software in india" — this directly targets QS 1 keyword.

7. **Inline Pricing — `id="lp-pricing"`**
   3-card pricing block (keeps visitor on-page — secondary CTA scrolls here):
   - Starter ₹799/mo — 1 outlet, billing + KOT
   - Growth ₹1,499/mo ⭐ MOST POPULAR — 1 outlet, full suite
   - Pro ₹2,499/mo — multi-outlet + reports
   Footer note: "No hidden fees. Cancel anytime. Annual billing."

8. **FAQ**
   - Can I manage multiple outlets?
   - Does it handle Swiggy/Zomato orders?
   - Is it the best for India?
   - How is it different from a basic billing app?

### Page structure
- `LandingNavbar` (logo-only)
- `LandingFooter` with phone + privacy link

---

## 3. Files to Create/Change

| File | Change |
|---|---|
| `frontend/src/pages/RestaurantManagementSoftware.jsx` | New page (create) |
| `frontend/src/App.js` | Add lazy import + route |
| `frontend/public/sitemap.xml` | Add URL entry (priority 0.9) |

---

## 4. Google Ads Actions Required (not dev)

- **ADS:** Update Management & Ordering ad group Final URL → `/restaurant-management-software` (currently `/product/see-everything`)
- **ADS:** Add exact negative: [food delivery apps] — consumer intent
- **ADS:** Consider pausing [best app for restaurant billing] — billing intent, causes cannibalization with LP-01

---

## 5. Definition of Done

- [ ] `/restaurant-management-software` renders on desktop + mobile
- [ ] H1 contains "restaurant management software"
- [ ] Meta title contains "Restaurant Management Software India"
- [ ] "India" / "Indian restaurants" appears explicitly in body copy
- [ ] "best restaurant management software in india" phrase appears in built-for-India section
- [ ] DemoForm submits leads with sector="restaurant-management"
- [ ] LandingNavbar (no global nav)
- [ ] Secondary CTA scrolls to `#lp-pricing` (not a `/pricing` link)
- [ ] `id="lp-pricing"` pricing section present with 3 tiers
- [ ] Hero image is `/brand/banner.webp` (NOT a stock waiter/staff photo)
- [ ] FAQPage JSON-LD valid
- [ ] URL in sitemap.xml + prerendered

---

## 6. Impact Analysis — 2026-08-25

### Change A — Hero image: stock photo → `/brand/banner.webp`

**Why:** The page targets "restaurant management software" and "restaurant management system" — B2B software evaluation intent. A visitor searching that term expects to see **the product interface**, not a person. Stock waiter photos signal consumer-context pages (review sites, food blogs); a software screenshot signals the B2B evaluation page they're looking for.

**Image chosen:** `/brand/banner.webp` (776×637 px, already on disk, used in homepage hero).
- Shows: MyGenie POS interface on a phone
- Load: `loading="eager"` (above-fold LCP element)
- No Unsplash API call needed — zero external dependency

**Expected impact:** Reduces bounce from software-intent visitors who see a waiter photo and assume wrong page. Improves perceived product maturity for "best restaurant management software in india" QS 1 keyword.

### Change B — Inline pricing section added (Section 7, new)

**Why:** Secondary CTA "See Pricing" off-page link breaks the captive funnel enforced by `LandingNavbar`. Same fix applied to CR-85, CR-86, CR-149.

**Net effect:** 7 sections → 8 sections (FAQ becomes Section 8, bottom CTA removed — DemoForm in Section 8 serves as bottom CTA).

### Change C — Secondary CTA: off-page link → scroll anchor

| Before | After |
|---|---|
| `<Link to="/pricing">See Pricing</Link>` | `<a href="#lp-pricing">See Pricing ↓</a>` |

*CR-148 registered 2026-08-25. Impact analysis added 2026-08-25.*
