# CR-84 — Add StickyMobileCta + Pricing Anchor to ProductPage and SectorPage

**Type:** Conversion Optimisation / Mobile UX  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H5 + H6  
**Effort:** 30 min  
**Improves:** Conv · QS LP Experience · Mobile  
**Scope:** `frontend/src/pages/ProductPage.jsx`, `frontend/src/pages/SectorPage.jsx`  
**Related:** CR-74 (StickyMobileCta petpooja fix)

---

## 1. Problem Statement

**Gap A — No StickyMobileCta:** Mobile users arriving on `/product/sell-serve` and `/solutions/cloud-kitchens` have no persistent CTA after scrolling past the hero. These pages have 5+ scroll sections before the demo form. On mobile this is 15+ viewport-heights of scroll with no conversion anchor.

**Gap B — No pricing visibility:** Neither ProductPage nor SectorPage shows any pricing indication. Users must navigate away to `/pricing` to see costs. The homepage hero has a “See Pricing” button — product/sector pages do not.

---

## 2. Exact Changes Required

### Change 1 — `frontend/src/pages/ProductPage.jsx` — Add StickyMobileCta
```jsx
// Add import
import StickyMobileCta from "@/components/home/StickyMobileCta";

// Add at bottom of page shell (before closing </div>), after <Footer />:
<StickyMobileCta onDemo={() => document.getElementById("product-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
```

### Change 2 — `frontend/src/pages/SectorPage.jsx` — Add StickyMobileCta
```jsx
// Add import
import StickyMobileCta from "@/components/home/StickyMobileCta";

// Add at bottom of page shell, after <Footer />:
<StickyMobileCta onDemo={() => document.getElementById("sector-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
```

### Change 3 — `frontend/src/pages/ProductPage.jsx` — Add pricing anchor below hero CTA
In the product hero section, after the "Book a Free Demo" button:
```jsx
<a href="#product-demo" ...>Book a Free Demo <ArrowRight /></a>
{/* ADD this line: */}
<Link to="/pricing" className="text-sm text-brand-muted hover:text-brand-green transition-colors mt-2 inline-block">
  Plans from ₹799/mo →
</Link>
```

### Change 4 — `frontend/src/pages/SectorPage.jsx` — Same pricing anchor
```jsx
<a href="#sector-demo" ...>Book a Free Demo <ArrowRight /></a>
{/* ADD: */}
<Link to="/pricing" className="text-sm text-brand-muted hover:text-brand-green transition-colors mt-2 inline-block">
  Plans from ₹799/mo →
</Link>
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/ProductPage.jsx` | Add StickyMobileCta; add pricing anchor below hero CTA |
| `frontend/src/pages/SectorPage.jsx` | Add StickyMobileCta; add pricing anchor below hero CTA |

---

## 4. Definition of Done

- [ ] On /product/sell-serve mobile: sticky bar appears after scrolling past hero
- [ ] Sticky bar “Book a Free Demo” scrolls to #product-demo form
- [ ] On /solutions/cloud-kitchens mobile: same behaviour for #sector-demo
- [ ] “Plans from ₹799/mo” link visible below hero CTA on both pages
- [ ] No layout issues on desktop (StickyMobileCta is lg:hidden)
- [ ] StickyMobileCta.jsx testid fix (CR-74) must be deployed first

---

*CR-84 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H5 + H6.*
