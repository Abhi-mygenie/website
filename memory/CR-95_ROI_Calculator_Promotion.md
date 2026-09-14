# CR-95 — Promote /roi Calculator Above Fold + Add to Navbar

**Type:** Conversion Optimisation / Internal Linking  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** ⏸️ DEFERRED — 2026-08-25 owner decision
**Owner note:** ROI calculator not to be promoted on the homepage above fold. Navbar Resources dropdown already contains it. No homepage promo band to be added. Revisit if conversion data shows visitors missing the ROI tool.  
**Priority:** MEDIUM  
**Plan ID:** M7  
**Effort:** 1 hr  
**Improves:** Conv · SEO · Internal Linking  
**Scope:** `frontend/src/pages/Home.jsx`, `frontend/src/components/site/Navbar.jsx`  
**Related:** Marketing brief Issue 5

---

## 1. Problem Statement

The `/roi` calculator — a high-value middle-funnel conversion tool — is accessible only via the footer Resources column and the sitemap. It has no above-fold mention on the homepage, no Navbar entry, and no dedicated CTA section. Visitors who are not yet ready to book a demo have no alternative conversion path.

---

## 2. Exact Changes Required

### Change 1 — `frontend/src/pages/Home.jsx`
Add a ROI calculator CTA card between `<ProblemGrid />` and `<BeforeAfter />`:
```jsx
{/* ROI Calculator promo band */}
<section className="py-10 bg-brand-sand border-y border-brand-line">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-2">Free Tool</p>
      <h3 className="font-display text-xl font-bold text-brand-ink">See how much profit MyGenie could add for your restaurant</h3>
      <p className="text-brand-muted text-sm mt-1">Enter your outlet details — get an instant estimate in 2 minutes.</p>
    </div>
    <Link to="/roi" className="shrink-0 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full px-7 py-3 font-semibold whitespace-nowrap transition-all hover:-translate-y-0.5">
      Try ROI Calculator →
    </Link>
  </div>
</section>
```

### Change 2 — `frontend/src/components/site/Navbar.jsx`
Add ROI Calculator to the RESOURCES array:
```js
const RESOURCES = [
  { to: "/roi", name: "ROI Calculator", icon: "Calculator", line: "Estimate your profit gain in 2 minutes." },  // ← ADD as first item
  { to: "/blog", name: "Blog", icon: "BookOpen", line: "Guides on POS, profit, inventory and customer experience." },
  { to: "/resources", name: "Help & FAQ", icon: "HelpCircle", line: "Answers to common questions about MyGenie." },
];
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/Home.jsx` | Add ROI calculator promo band between ProblemGrid and BeforeAfter |
| `frontend/src/components/site/Navbar.jsx` | Add ROI Calculator as first item in RESOURCES dropdown |

---

## 4. Definition of Done

- [ ] ROI calculator promo band visible on homepage between problem and before/after sections
- [ ] “Try ROI Calculator” navigates to /roi correctly
- [ ] ROI Calculator appears in Navbar Resources dropdown
- [ ] Mobile: promo band stacks correctly on small viewports

---

*CR-95 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M7.*
