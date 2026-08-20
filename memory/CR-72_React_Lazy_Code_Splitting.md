# CR-72 — Implement React.lazy Code Splitting for All Non-Home Routes

**Type:** Performance Fix / Bundle Optimization  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** CRITICAL  
**Plan ID:** C3  
**Effort:** 2 hrs  
**Improves:** Perf · TTI · QS Landing Page Experience · JS Bundle Size  
**Scope:** `frontend/src/App.js`  
**Related:** CR-70 (fonts), CR-71 (LCP image), Marketing brief Issue 1 & 3

---

## 1. Problem Statement

All 19 pages are eagerly imported at the top of `App.js`. The initial JS bundle includes Blog, LeadsView, ROI Calculator, AiPage, Pricing, and every other page — code that a homepage visitor will never need. This produces a ~2.17MB raw (586KB Brotli) bundle that must fully parse before Time-to-Interactive, directly hurting Google Ads Landing Page Experience score.

---

## 2. Root Cause

**`frontend/src/App.js` (lines 1–25):**
```js
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import SectorPage from "@/pages/SectorPage";
import ProductPage from "@/pages/ProductPage";
// ... 15 more eager imports
```
No `React.lazy()` or `Suspense` used anywhere in the codebase.

---

## 3. Exact Changes Required

**`frontend/src/App.js`**

Keep `Home` as an eager import (most-visited, no split needed). Convert all others to lazy:

```js
import React, { Suspense, lazy } from "react";
import Home from "@/pages/Home"; // eager — entry point

const Pricing             = lazy(() => import("@/pages/Pricing"));
const SectorPage          = lazy(() => import("@/pages/SectorPage"));
const ProductPage         = lazy(() => import("@/pages/ProductPage"));
const SolutionsIndex      = lazy(() => import("@/pages/SolutionsIndex"));
const ProductIndex        = lazy(() => import("@/pages/ProductIndex"));
const SuccessStories      = lazy(() => import("@/pages/SuccessStories"));
const RoiCalculator       = lazy(() => import("@/pages/RoiCalculator"));
const Resources           = lazy(() => import("@/pages/Resources"));
const AiPage              = lazy(() => import("@/pages/AiPage"));
const Blog                = lazy(() => import("@/pages/Blog"));
const BlogPost            = lazy(() => import("@/pages/BlogPost"));
const About               = lazy(() => import("@/pages/About"));
const Contact             = lazy(() => import("@/pages/Contact"));
const Legal               = lazy(() => import("@/pages/Legal"));
const LeadsView           = lazy(() => import("@/pages/LeadsView"));
const PetpoojaAlternative = lazy(() => import("@/pages/PetpoojaAlternative"));
const DemoLanding         = lazy(() => import("@/pages/DemoLanding"));
const PaymentSuccess      = lazy(() => import("@/pages/PaymentSuccess"));
```

Wrap the `<Routes>` block in a `<Suspense>` fallback:
```jsx
<Suspense fallback={<div className="min-h-screen bg-brand-sand" aria-label="Loading..." />}>
  <Routes>
    {/* all existing routes unchanged */}
  </Routes>
</Suspense>
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/App.js` | Convert 18 page imports to React.lazy(); wrap Routes in Suspense |

---

## 5. Risk Assessment

| Risk | Mitigation |
|---|---|
| Suspense fallback flicker on navigation | Use a minimal bg-brand-sand div — instant, no spinner needed |
| REDIRECTS map still renders eagerly | Navigate components are inline — no lazy needed |
| LeadsView (CMS-gated) lazy loads correctly | Confirmed — no preload dependency |

---

## 6. Definition of Done

- [ ] DevTools Network tab: initial load shows only `Home` chunk + vendor, not all 19 pages
- [ ] Navigation to /pricing lazy-loads the Pricing chunk on first visit
- [ ] No white flash or layout shift on page transitions
- [ ] All existing routes still function correctly
- [ ] Build output shows per-route chunks (not one large main.js)

---

*CR-72 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C3.*
