# CR-85 — Create /restaurant-billing-software Dedicated Landing Page

**Type:** New Page / Ad Group LP  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H7  
**Effort:** 1 day  
**Improves:** SEO · QS · Ad Group Keyword Relevance  
**Scope:** New page + `frontend/src/App.js` + `frontend/public/sitemap.xml`  
**Related:** CR-86 (/restaurant-pos LP), CR-83 (H1 fixes)

---

## 1. Problem Statement

The “Billing Software” ad group (“restaurant billing software”, “cafe billing software”) currently sends traffic to the homepage, whose H1 reads “Run a more profitable hospitality business — from your phone.” There is zero keyword match between the search query and the landing page H1.

A dedicated `/restaurant-billing-software` page with a billing-intent H1, title, and FAQ will directly improve Ad Relevance and LP Experience for this ad group.

---

## 2. Page Specification

### SEO
- **URL:** `/restaurant-billing-software`
- **Page Title:** `Restaurant Billing Software | Cloud POS Billing for Cafes & Restaurants — MyGenie`
- **H1:** `The smartest restaurant billing software in India — bill in seconds, from any device.`
- **Description:** `MyGenie restaurant billing software handles POS, GST invoices, split bills, KOT and kitchen sync — on any phone. Trusted by 500+ restaurants across India. Book a free demo.`
- **Canonical:** `https://www.mygenie.online/restaurant-billing-software`

### Page Structure (reuse existing components)
1. `LandingNavbar` (logo-only, no exit links — follow /petpooja-alternative pattern)
2. **Hero section** — H1 above, billing-specific sub, stat cards, DemoForm anchor CTA
3. **TrustBand** — logo marquee (reuse component)
4. **Feature strip** — 6 billing features: Fast billing, GST invoices, Split/merge bills, Offline mode, Multi-device, KOT sync
5. **Proof section** — 2–3 testimonials (reuse TESTIMONIALS data)
6. **Pricing section** — 3 plan cards (reuse from PetpoojaAlternative VspPricing pattern)
7. **Demo form section** (id="billing-demo") — DemoForm with sector="billing-software"
8. `LandingFooter` with phone + privacy link (follow CR-73 pattern)

### FAQ (for schema)
- Can I use MyGenie on any device? Yes — works on any phone, tablet, or desktop browser.
- Does it print GST invoices? Yes — GST and VAT-ready invoices generated automatically.
- Does billing work offline? Yes — local-first, auto-syncs when connection returns.
- How fast can I go live? Within 24 hours of sign-up.

---

## 3. Changes Required

### New file: `frontend/src/pages/RestaurantBillingSoftware.jsx`
Self-contained landing page following the `/petpooja-alternative` structure. Use `<Seo>` with title, description, canonical, and FAQPage JSON-LD.

### `frontend/src/App.js`
```jsx
const RestaurantBillingSoftware = lazy(() => import("@/pages/RestaurantBillingSoftware"));
// Add route:
<Route path="/restaurant-billing-software" element={<RestaurantBillingSoftware />} />
```

### `frontend/public/sitemap.xml`
Add entry:
```xml
<url>
  <loc>https://www.mygenie.online/restaurant-billing-software</loc>
  <lastmod>2026-08-20</lastmod>
  <priority>0.9</priority>
  <changefreq>monthly</changefreq>
</url>
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/RestaurantBillingSoftware.jsx` | New page (create) |
| `frontend/src/App.js` | Add lazy import + route |
| `frontend/public/sitemap.xml` | Add URL entry |

---

## 5. Definition of Done

- [ ] `/restaurant-billing-software` renders correctly
- [ ] H1 contains “restaurant billing software”
- [ ] Page title contains “Restaurant Billing Software”
- [ ] DemoForm works (submits lead correctly)
- [ ] Mobile: StickyMobileCta fires
- [ ] LandingFooter has phone + privacy link
- [ ] URL in sitemap.xml
- [ ] Google Rich Results Test: valid FAQPage schema

---

*CR-85 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H7.*
