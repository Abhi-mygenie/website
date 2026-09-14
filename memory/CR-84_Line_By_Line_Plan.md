# CR-84 — Line-by-Line Implementation Plan: StickyMobileCta on Sector + Product Pages
**Written:** 2026-08-21  
**Impact analysis:** `/app/memory/IMPACT_ANALYSIS_BATCHES_A_B_C_D_2026-08-21.md` (CR-84 section)  
**Files touched:** `SectorPage.jsx` + `ProductPage.jsx` — 2 files, 4 line changes total  
**StickyMobileCta.jsx:** NOT touched — selector fix already in place (CR-74a)  
**Covers:** All 11 sector pages + all 6 product pages = 17 pages simultaneously  
**Estimated time:** 5 min

---

## Pre-flight

- [ ] `sudo supervisorctl status` — both services running
- [ ] Open `/solutions/restaurants` on mobile (390px DevTools) — confirm no sticky bar currently
- [ ] Open `/product/sell-serve` on mobile — confirm no sticky bar currently
- [ ] Scroll past hero on `/solutions/restaurants` — bar should NOT appear (baseline)

---

## STEP 1 — `SectorPage.jsx`: Add import

**File:** `frontend/src/pages/SectorPage.jsx`  
**Line:** After line 14 (last import line)

**Before (exact, lines 1–14):**
```jsx
import { useParams, Navigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, Check, X, Quote } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import FaqItem from "@/components/site/FaqItem";
import Seo from "@/components/site/Seo";
import { SECTOR_PAGES, SECTOR_ORDER } from "@/data/sectors";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { EditableFaqList } from "@/components/cms/FaqEditor";
import { useContent, useContentDoc } from "@/lib/cms/CmsProvider";
import { mergeByIndex } from "@/lib/cms/mergeUtils";
```

**After:**
```jsx
import { useParams, Navigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, Check, X, Quote } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import Reveal from "@/components/site/Reveal";
import FaqItem from "@/components/site/FaqItem";
import Seo from "@/components/site/Seo";
import { SECTOR_PAGES, SECTOR_ORDER } from "@/data/sectors";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { EditableFaqList } from "@/components/cms/FaqEditor";
import { useContent, useContentDoc } from "@/lib/cms/CmsProvider";
import { mergeByIndex } from "@/lib/cms/mergeUtils";
```

**What changed:** One line added — `import StickyMobileCta from "@/components/home/StickyMobileCta";` — placed after `DemoForm` import for logical grouping.

---

## STEP 2 — `SectorPage.jsx`: Add component to JSX

**File:** `frontend/src/pages/SectorPage.jsx`  
**Lines:** 258–259 (after import added in Step 1, these shift to 259–260)

**Before (exact, lines 258–259):**
```jsx
      <Footer />
    </div>
```

**After:**
```jsx
      <Footer />
      <StickyMobileCta onDemo={() => document.getElementById("sector-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
    </div>
```

**Why `onDemo` uses `"sector-demo"`:**  
The demo form anchor is `<div id="sector-demo" className="scroll-mt-20">` (SectorPage.jsx line 251). Without `onDemo`, the component's default fallback looks for `id="demo"` which doesn't exist on these pages — the button would silently do nothing. Passing `onDemo` with the correct ID ensures the CTA scrolls to the right element.

**Why placed after `<Footer />`:**  
StickyMobileCta is `position: fixed` — DOM order doesn't affect visual placement. Placed after Footer by convention, matching the pattern on Homepage and PetpoojaAlternative.

---

## STEP 3 — `ProductPage.jsx`: Add import

**File:** `frontend/src/pages/ProductPage.jsx`  
**Line:** After line 16 (last import line)

**Before (exact, lines 1–16):**
```jsx
import { useParams, Navigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, Check, Quote } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import FaqItem from "@/components/site/FaqItem";
import FeatureVideo from "@/components/site/FeatureVideo";
import Seo from "@/components/site/Seo";
import { SITE_URL } from "@/lib/seo";
import { PRODUCT_PAGES, PRODUCT_ORDER } from "@/data/products";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { EditableFaqList } from "@/components/cms/FaqEditor";
import { useContent, useContentDoc } from "@/lib/cms/CmsProvider";
import { mergeByIndex } from "@/lib/cms/mergeUtils";
```

**After:**
```jsx
import { useParams, Navigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, Check, Quote } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import Reveal from "@/components/site/Reveal";
import FaqItem from "@/components/site/FaqItem";
import FeatureVideo from "@/components/site/FeatureVideo";
import Seo from "@/components/site/Seo";
import { SITE_URL } from "@/lib/seo";
import { PRODUCT_PAGES, PRODUCT_ORDER } from "@/data/products";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { EditableFaqList } from "@/components/cms/FaqEditor";
import { useContent, useContentDoc } from "@/lib/cms/CmsProvider";
import { mergeByIndex } from "@/lib/cms/mergeUtils";
```

---

## STEP 4 — `ProductPage.jsx`: Add component to JSX

**File:** `frontend/src/pages/ProductPage.jsx`  
**Lines:** 251–252 (after import added in Step 3, these shift to 252–253)

**Before (exact, lines 251–252):**
```jsx
      <Footer />
    </div>
```

**After:**
```jsx
      <Footer />
      <StickyMobileCta onDemo={() => document.getElementById("product-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
    </div>
```

**Why `onDemo` uses `"product-demo"`:**  
The demo form anchor is `<div id="product-demo" className="scroll-mt-20">` (ProductPage.jsx line 247). Same reasoning as sector pages — `id="demo"` does not exist on product pages.

---

## What DOES NOT change

| File | Status | Reason |
|---|---|---|
| `StickyMobileCta.jsx` | ✅ Not touched | CR-74a already added `sector-hero` + `product-hero` to selector |
| `DemoForm.jsx` | ✅ Not touched | No form field changes needed |
| `sectors.js` / `products.js` | ✅ Not touched | No content changes |
| `SectorPage.jsx` hero section | ✅ Not touched | `data-testid="sector-hero"` already present |
| `ProductPage.jsx` hero section | ✅ Not touched | `data-testid="product-hero"` already present |

---

## Post-Implementation Checkpoint

### Functional checks (mobile viewport 390px)
- [ ] Compile clean — no hot-reload errors
- [ ] `/solutions/restaurants` — scroll past hero → sticky bar slides up from bottom
- [ ] Tap "Book a Free Demo" on bar → page scrolls to demo form at bottom of sector page
- [ ] Tap ✕ → bar dismisses for that page session
- [ ] `/solutions/cloud-kitchens` — same bar behaviour (confirms all sector slugs work via single template)
- [ ] `/product/sell-serve` — scroll past hero → sticky bar slides up
- [ ] Tap "Book a Free Demo" → scrolls to `#product-demo` form
- [ ] `/product/see-everything` — same bar behaviour

### Regression checks (desktop + other pages)
- [ ] Desktop (1024px+) — sticky bar NOT visible (`lg:hidden` class)
- [ ] `/` homepage — sticky bar still works (unaffected)
- [ ] `/petpooja-alternative` — sticky bar NOT present (CR-74b reverted, navbar CTA is sole CTA)
- [ ] Consent banner visible → bar sits 48px above bottom (not overlapping)
- [ ] OTP stage active on any form → bar hides (`formActive` guard)

---

## Rollback

Remove the `StickyMobileCta` import line and JSX line from both files. Hot-reload applies immediately.

---

## Execution Summary

| Step | File | Change | Lines |
|---|---|---|---|
| 1 | `SectorPage.jsx` | Add `StickyMobileCta` import after `DemoForm` import | After line 6 |
| 2 | `SectorPage.jsx` | Add `<StickyMobileCta onDemo={...}>` after `<Footer />` | After line 258 |
| 3 | `ProductPage.jsx` | Add `StickyMobileCta` import after `DemoForm` import | After line 6 |
| 4 | `ProductPage.jsx` | Add `<StickyMobileCta onDemo={...}>` after `<Footer />` | After line 251 |

**Steps 1+2 can be done together (same file). Steps 3+4 can be done together (same file). Steps 1+2 and 3+4 can be done in parallel (different files).**

---

*Plan written 2026-08-21. All line numbers verified against live files (SectorPage.jsx: 262 lines, ProductPage.jsx: 255 lines). No code changes made.*
