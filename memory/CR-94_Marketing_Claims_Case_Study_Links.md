# CR-94 — Link Marketing Claims to Named Case Studies (Methodology Page)

**Type:** Content / Trust / E-E-A-T  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M6  
**Effort:** 1 day  
**Improves:** Trust · E-E-A-T · Conv  
**Scope:** New case study page + `frontend/src/components/home/Hero.jsx`, `frontend/src/data/content.js`  
**Related:** CR-89 (testimonial names), CR-88 (blog authors)

---

## 1. Problem Statement

Homepage stat claims (“+25% profit”, “₹1 Lakh leakage caught”, “40% lower costs”, “30% faster service”) are backed only by:
```jsx
"*Based on internal case studies & partner results. Individual results may vary."
```
No link, no named source, no date. Google’s LP Experience and E-E-A-T guidelines require substantiating marketing claims with verifiable sources.

---

## 2. Exact Changes Required

### Change 1 — Create named case study source anchors
Add a `caseStudyUrl` field to METRICS in `content.js` or create a `/case-studies` page. At minimum, create anchor IDs on the `/customers` page for each client:
- `/customers#palm-forest` — links to the “30% faster room service” result
- `/customers#love-bites` — links to “40% lower fixed cost”
- `/customers#rhino` — links to “₹1 Lakh fraud caught”

### Change 2 — Update disclaimer in `Hero.jsx`
```jsx
// BEFORE
"*Based on internal case studies & partner results. Individual results may vary."

// AFTER
<>
  *Based on named partner results. 
  <Link to="/customers" className="underline hover:text-brand-green transition-colors">See case studies →</Link>
</>
```

### Change 3 — Update METRICS in `content.js`
Add optional `sourceUrl` field to each metric for future linking:
```js
{ value: "Up to 25%", label: "More profit*", sourceUrl: "/customers", testid: "metric-profit" },
```

### Change 4 (Optional) — Create `/case-studies` page
A dedicated methodology/case-study page with:
- Named restaurant, date of measurement, metric, owner quote, methodology note
- JSON-LD `CaseStudy` or `Article` schema
- Add to sitemap.xml and Navbar Resources dropdown

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/home/Hero.jsx` | Update disclaimer to link to /customers |
| `frontend/src/data/content.js` | Add sourceUrl to METRICS |
| `frontend/src/pages/SuccessStories.jsx` | Add anchor IDs to testimonial cards |
| `frontend/src/pages/CaseStudies.jsx` (optional) | New detailed methodology page |

---

## 4. Definition of Done

- [ ] Homepage disclaimer links to /customers page
- [ ] /customers page has named anchor IDs per client
- [ ] Each stat claim has a visible path to verification
- [ ] No false precision — claims say “up to” or “based on [named client]”

---

*CR-94 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M6.*
