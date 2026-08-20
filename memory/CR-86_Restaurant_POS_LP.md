# CR-86 — Create /restaurant-pos Dedicated Landing Page

**Type:** New Page / Ad Group LP  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H8  
**Effort:** 1 day  
**Improves:** SEO · QS · Ad Group Keyword Relevance  
**Scope:** New page + `frontend/src/App.js` + `frontend/public/sitemap.xml`  
**Related:** CR-85 (/restaurant-billing-software LP), CR-83 (H1 fixes)

---

## 1. Problem Statement

The “Alpha Terms” ad group (“restaurant software”, “restaurant POS”) currently points to the homepage. No dedicated POS-intent page exists. A `/restaurant-pos` page with POS-keyword H1 and structured content directly addresses this gap.

---

## 2. Page Specification

### SEO
- **URL:** `/restaurant-pos`
- **Page Title:** `Best Restaurant POS System in India | Billing & Management Software — MyGenie`
- **H1:** `Best restaurant POS system for India — billing, kitchen, inventory and CRM in one app.`
- **Description:** `MyGenie is India’s most complete restaurant POS system. Handles billing, KOT/KDS, inventory, CRM, loyalty, and AI — on any phone. Trusted by 500+ restaurants. Book a free demo.`
- **Canonical:** `https://www.mygenie.online/restaurant-pos`

### Page Structure (reuse existing components)
1. `LandingNavbar` (logo-only)
2. **Hero** — H1 above, POS-specific sub, stat cards (same 4 stats as petpooja-alternative), demo form anchor CTA
3. **TrustBand** — logo marquee
4. **Module overview** — 6 key POS features (POS/Billing, Captain App, KOT/KDS, Inventory, CRM, Owner Dashboard)
5. **Before/After** — reuse BEFORE_AFTER data from content.js
6. **Testimonials** — 3 cards from TESTIMONIALS
7. **Pricing section** — 3 plans
8. **Demo form** (id="pos-demo") — DemoForm with sector="restaurant-pos"
9. **FAQ** — 5 POS-specific questions with FAQPage JSON-LD
10. `LandingFooter` with phone + privacy link

### FAQ content
- What is a restaurant POS system? A restaurant POS (Point of Sale) system handles billing, order management, kitchen sync, inventory, and reporting for restaurants.
- Does MyGenie work on mobile? Yes — runs on any Android phone, tablet, or laptop browser.
- Can I manage multiple outlets? Yes — chains and franchises can manage all outlets from one dashboard.
- Does it integrate with Swiggy and Zomato? Yes — aggregator sync built in.
- How is MyGenie different from other POS systems? It’s a full Hospitality OS — not just billing, but inventory, expenses, CRM, loyalty, and AI all connected.

---

## 3. Changes Required

### New file: `frontend/src/pages/RestaurantPos.jsx`
Self-contained LP following the /petpooja-alternative pattern.

### `frontend/src/App.js`
```jsx
const RestaurantPos = lazy(() => import("@/pages/RestaurantPos"));
<Route path="/restaurant-pos" element={<RestaurantPos />} />
```

### `frontend/public/sitemap.xml`
```xml
<url>
  <loc>https://www.mygenie.online/restaurant-pos</loc>
  <lastmod>2026-08-20</lastmod>
  <priority>0.9</priority>
  <changefreq>monthly</changefreq>
</url>
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/RestaurantPos.jsx` | New page (create) |
| `frontend/src/App.js` | Add lazy import + route |
| `frontend/public/sitemap.xml` | Add URL entry |

---

## 5. Definition of Done

- [ ] `/restaurant-pos` renders correctly on desktop and mobile
- [ ] H1 contains “restaurant POS system”
- [ ] Page title contains “Restaurant POS”
- [ ] DemoForm submits leads correctly
- [ ] FAQPage schema valid in Rich Results Test
- [ ] Mobile StickyMobileCta fires
- [ ] URL in sitemap.xml

---

*CR-86 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H8.*
