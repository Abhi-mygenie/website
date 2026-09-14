# Wave 1 — Complete Impact Analysis
## All SEO CRs: CR-133, CR-134, CR-135, CR-136, CR-91, CR-121, CR-122, CR-106, CR-82, CR-123

**Date:** 2026-08-24  
**Type:** Combined pre-implementation impact analysis  
**Status:** Analysis complete — no code changed  
**Source files read:** All 12 affected files fully read before this document was written

---

## 0. Critical Discoveries During File Reading

**Three CRs are already fully implemented. Wave 1 scope is reduced.**

| CR | Claim | File Evidence | Verdict |
|----|-------|--------------|---------|
| **CR-82** | img width/height missing on 5 components | `TrustBand.jsx` L53-54: `width={160} height={64}` ✅; `ProofSection.jsx` L46: `width={40} height={40}` ✅; `SuccessStories.jsx` L81: `width={40} height={40}` ✅; `Blog.jsx` L83: `width={800} height={500}` ✅ L101: `width={400} height={250}` ✅; `BlogPost.jsx` L73: `width={1200} height={630}` ✅ | **ALREADY DONE — remove from Wave 1** |
| **CR-121** | /solutions + /product hub pages missing from sitemap | `sitemap.xml` L70-80: both entries present with `priority=0.8` ✅ | **ALREADY DONE — remove from Wave 1** |
| **CR-122** | 29 pages stuck on `lastmod: 2026-06-07` | `sitemap.xml`: every non-blog page shows `lastmod>2026-08-23</lastmod>` ✅ | **ALREADY DONE — remove from Wave 1** |

**Revised Wave 1: 7 CRs** (down from 10).

---

## 1. Revised Wave 1 Scope

| # | CR | Files changed | Build needed? | Re-prerender? |
|---|----|-----------|----|---|
| 1 | **CR-133** | `scripts/prerender.js` | ❌ | ✅ |
| 2 | **CR-134** | `scripts/prerender.js` | ❌ | ✅ |
| 3 | **CR-135** | `src/pages/DemoLanding.jsx` | ✅ | ✅ |
| 4 | **CR-136** | `src/pages/About.jsx` | ✅ | ✅ |
| 5 | **CR-91** | `src/pages/SectorPage.jsx`, `Blog.jsx`, `BlogPost.jsx`, `Pricing.jsx` | ✅ | ✅ |
| 6 | **CR-106** | `src/pages/SectorPage.jsx`, `ProductPage.jsx`, `Resources.jsx`, `AiPage.jsx` | ✅ | ✅ |
| 7 | **CR-123** | `src/components/site/Markdown.jsx` | ✅ | ✅ |

**Total: 8 files changed. 1 yarn build. 1 re-prerender (55 routes = 53 sitemap + /demo + /payment-success).**

---

## 2. File Overlap Map (CRs Sharing a File)

This is the most critical dependency section. Files touched by more than one CR **must be edited once** to avoid conflicts.

| File | CRs | Overlap type |
|------|-----|-------------|
| `scripts/prerender.js` | CR-133 + CR-134 | Must apply both changes in sequence |
| `SectorPage.jsx` | CR-91 + CR-106 | Must apply both in one edit; they're adjacent code |
| All other files | Single CR each | No overlap conflict |

### Overlap Detail: `SectorPage.jsx` (CR-91 + CR-106)

Current state:
```jsx
// Line 62-66
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",   ← CR-106 changes this to "QAPage"
  mainEntity: s.faqs.map(...)
};
// Line 70
<Seo ... jsonLd={faqJsonLd} />   ← CR-91 changes this to jsonLd={[faqJsonLd, breadcrumbJsonLd]}
```

After both CRs combined:
```jsx
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "QAPage",   ← CR-106
  mainEntity: s.faqs.map(...)
};
const breadcrumbJsonLd = { ... };   ← CR-91 (new block)
<Seo ... jsonLd={[faqJsonLd, breadcrumbJsonLd]} />   ← CR-91
```

**No conflict.** CR-106 touches line 64 (`@type` value). CR-91 adds a new const block after line 66 and changes the `jsonLd` prop. These are distinct positions in the file.

### Overlap Detail: `scripts/prerender.js` (CR-133 + CR-134)

CR-133 touches: line 48-51 area (add `waitForFunction` after `waitForSelector`) + line 75 (`slice(1)` → `slice(0, -1)`).  
CR-134 touches: lines 8-12 (ROUTES definition).  
**No conflict.** Completely different sections of the file.

---

## 3. Per-File Analysis

### 3A. `scripts/prerender.js` — CR-133 + CR-134

**What it does:** Drives Puppeteer to visit each route, capture the rendered DOM, and write static HTML files.

**CR-133 changes (2 positions):**

*Position 1 — After line 51 (after `waitForSelector`).*  
Adds a `waitForFunction` call that pauses until `document.title` changes away from the shell default. This gives react-helmet-async time to commit its `<title>` update before the DOM is captured.  
Risk: None. `.catch(() => {})` makes it non-fatal — the homepage legitimately has the shell title, so the promise times out gracefully for `/`.

*Position 2 — Line 75 (canonical dedup inside `page.evaluate`).*  
Changes `.slice(1)` to `.slice(0, -1)`. Effect: keep the LAST canonical (react-helmet-injected, correct) instead of the FIRST (shell, homepage). This single character change fixes the canonical for all 55 prerendered pages.  
Risk: None. Logic is identical for pages with only one canonical — `Array.from([oneItem]).slice(0, -1)` = empty array, so nothing is removed when there's only one.

**CR-134 changes (1 position):**

*Lines 8-12 (ROUTES array definition).*  
Wraps the existing sitemap-reading code in a named variable `sitemapRoutes`, then adds `extraRoutes = ["/demo", "/payment-success"]` and spreads both into the returned array.  
Risk: The prerender `waitForSelector` pattern includes `[data-testid$="-page"]` which matches both `demo-landing-page` and `payment-success-page`. Both pages have these testids (verified in source). Prerender will wait correctly.

**Forms affected:** None. `prerender.js` is a build-time script — it does not run in the browser, it generates HTML files. Zero runtime impact on any form.

**Existing title dedup logic (line 56-57):**
```js
const titles = document.querySelectorAll("title");
for (let i = 0; i < titles.length - 1; i++) titles[i].remove();
```
This keeps the LAST title (same as the canonical fix). After CR-133, `waitForFunction` ensures react-helmet-async has committed its title before this runs, so the last title IS the correct one. The two changes work together correctly.

---

### 3B. `src/pages/DemoLanding.jsx` — CR-135

**Current state (lines 73-78):**
```jsx
<Seo
  title={seo.title}
  description={seo.description}
  canonical="/demo"
  noindex={true}
/>
```

**Change:** `canonical="/demo"` → `path="/demo"`. One word.

**What stays COMPLETELY UNCHANGED:**
- The entire demo form component and all its props
- All form fields, validation, submission logic
- `noindex={true}` — stays, /demo remains non-indexed
- All state, hooks, handlers, event listeners in DemoLanding
- `LandingNavbar` and `LandingFooter`
- All other JSX below the `<Seo>` call (lines 80 onwards — ~900 lines untouched)

**Forms safety:** The demo form in DemoLanding is rendered deep in the JSX tree, completely separate from the `<Seo>` call. Changing one prop on `<Seo>` has zero effect on form rendering, state, or submission. `<Seo>` renders only into `<head>` via react-helmet-async — it produces no visible DOM whatsoever.

**Result:** `/demo` gets canonical `https://www.mygenie.online/demo` instead of homepage URL. `og:url` also corrected. `noindex` unchanged.

---

### 3C. `src/pages/About.jsx` — CR-136

**Current state (lines 7-8):**
```jsx
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";
```

**Current Seo call (line 22):**
```jsx
<Seo title={seo.title} description={seo.description} path="/about" />
```

**Changes:**
1. Line 8: add `ORG_JSONLD` to the existing `@/lib/seo` import
2. Line 22: add `jsonLd={[ORG_JSONLD]}` prop to Seo

**What stays COMPLETELY UNCHANGED:**
- The `VALUES` constant (lines 10-15) and all component rendering
- `DemoForm` on line 91 — zero touch. The form is in a different section, its props/behavior unchanged
- All Reveal animations, layout, Lucide icons
- `PAGE_SEO["/about"]` usage unchanged

**Forms safety:** `About.jsx` contains one `<DemoForm />` (line 91). This is a separate component with its own state. The `<Seo>` call at line 22 renders only into `<head>`. Changing the `<Seo>` jsonLd prop has absolutely no effect on `<DemoForm>`.

**Result:** `/about` prerendered page gains `Organization` JSON-LD — same entity declared on homepage.

---

### 3D. `src/pages/SectorPage.jsx` — CR-91 (BreadcrumbList) + CR-106 (QAPage)

**Current state:**
- Line 1: no import from `@/lib/seo`
- Lines 62-66: `faqJsonLd` with `@type: "FAQPage"`
- Line 70: `<Seo ... jsonLd={faqJsonLd} />`

**Combined changes (3 positions):**

*Position 1 — New import line after line 10 (after Seo import):*
```jsx
import { SITE_URL } from "@/lib/seo";
```

*Position 2 — Line 64 (inside faqJsonLd, change @type):*
`"@type": "FAQPage"` → `"@type": "QAPage"`

*Position 3 — After faqJsonLd closing brace (add breadcrumbJsonLd):*
```jsx
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Solutions", item: `${SITE_URL}/solutions` },
    { "@type": "ListItem", position: 3, name: s.name, item: `${SITE_URL}/solutions/${slug}` },
  ],
};
```

*Position 4 — Line 70 (Seo jsonLd prop):*
`jsonLd={faqJsonLd}` → `jsonLd={[faqJsonLd, breadcrumbJsonLd]}`

**What stays COMPLETELY UNCHANGED:**
- Lines 1-9: All existing imports
- Lines 17-53: All data processing (`sectorDisplay`, `PAIN_FIELDS`, `SOLUTION_FIELDS`, `PROOF_FIELDS`, component function, useParams/useContentDoc hooks)
- Lines 55-60: `seoTitle` construction
- Line 68 onwards: Entire JSX return (700+ lines of UI)
- `<DemoForm sector={s.name} />` on line 253 — zero touch
- `<StickyMobileCta>` on line 261 — zero touch
- All `EditableText`, `EditableList`, `EditableFaqList` calls — zero touch

**Forms safety:** `SectorPage.jsx` contains `<DemoForm sector={s.name} />` (line 253) and `<StickyMobileCta>` (line 261). Both are in the JSX body, completely separate from the JSON-LD constants at the top of the component. Changes to `faqJsonLd` (1 word) and adding `breadcrumbJsonLd` (new const) have zero side effects — they are pure data objects passed only to `<Seo>`.

**CMS content safety:** All `EditableText`, `EditableList`, `EditableFaqList` in SectorPage use the `docKey`, `doc`, `painsRaw`, etc. variables — none of which are touched. The FAQs rendered on screen come from `s.faqs` through `EditableFaqList` — this is unchanged. The JSON-LD `faqJsonLd` also reads from `s.faqs` but is a separate `<script>` in `<head>` — changing `@type` from `FAQPage` to `QAPage` does not affect what renders on screen.

---

### 3E. `src/pages/Blog.jsx` — CR-91 (BreadcrumbList only)

**Current state:**
- Line 7: `import { PAGE_SEO, SITE_URL } from "@/lib/seo"` — `SITE_URL` already imported ✅
- Lines 40-52: `jsonLd` (Blog type)
- Line 58: `<Seo ... jsonLd={jsonLd} />`

**Changes (2 positions):**

*Position 1 — After line 52 (after jsonLd closing brace):*
```jsx
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
  ],
};
```

*Position 2 — Line 58 (Seo jsonLd prop):*
`jsonLd={jsonLd}` → `jsonLd={[jsonLd, breadcrumbJsonLd]}`

**What stays COMPLETELY UNCHANGED:**
- All image tags (width/height already present from CR-82 — already done)
- All `EditableList` blog post editing logic
- `fmtDate` utility function
- `[feature, ...rest] = sorted` destructuring and rendering

**Forms safety:** `Blog.jsx` contains no forms. Zero form risk.

---

### 3F. `src/pages/BlogPost.jsx` — CR-91 (BreadcrumbList only)

**Current state:**
- Line 7: `import { SITE_URL } from "@/lib/seo"` — already imported ✅
- Lines 43-58: `jsonLd` (BlogPosting type)
- Line 62: `<Seo ... jsonLd={jsonLd} />`

**Changes (2 positions):**

*Position 1 — After line 58 (after jsonLd closing brace):*
```jsx
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    { "@type": "ListItem", position: 3, name: post.heading || post.title, item: `${SITE_URL}/blog/${slug}` },
  ],
};
```

*Position 2 — Line 62 (Seo jsonLd prop):*
`jsonLd={jsonLd}` → `jsonLd={[jsonLd, breadcrumbJsonLd]}`

**What stays COMPLETELY UNCHANGED:**
- Hero image tag (width/height already present — CR-82 done)
- Related posts section, CTA section
- The `post` null-guard (Navigate at lines 28-39) — still runs before `breadcrumbJsonLd` definition
- All Markdown rendering

**Guard safety:** `post` is guaranteed non-null at the point `breadcrumbJsonLd` is defined (the Navigate guard at line 28 returns early if null). `post.heading || post.title` is safe.

**Forms safety:** `BlogPost.jsx` contains no forms. Zero form risk.

---

### 3G. `src/pages/Pricing.jsx` — CR-91 (BreadcrumbList only)

**Current state:**
- Line 17: `import { PAGE_SEO, SOFTWARE_APP_JSONLD } from "@/lib/seo"`
- Line 151: `<Seo ... jsonLd={[SOFTWARE_APP_JSONLD]} />`

**Changes (3 positions):**

*Position 1 — Line 17 (import):*
Add `SITE_URL` → `import { PAGE_SEO, SOFTWARE_APP_JSONLD, SITE_URL } from "@/lib/seo"`

*Position 2 — After line 20 (after `const inr` — module level, before component):*
```jsx
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/pricing` },
  ],
};
```

*Position 3 — Line 151 (Seo jsonLd prop):*
`jsonLd={[SOFTWARE_APP_JSONLD]}` → `jsonLd={[SOFTWARE_APP_JSONLD, breadcrumbJsonLd]}`

**What stays COMPLETELY UNCHANGED:**
- All state: `selectedPlanId`, `selectedAddons`, `checkout`, `demoPlan`, `demoAddon`, `compareOpen` — zero touch
- `RecommendQuiz` with `onRecommend` handler
- `CheckoutModal` and `FeatureDemoModal` and `PlanCompareModal` — zero touch
- `CartSummary` with `onBuy` / `onDemo` callbacks
- All plan selection logic: `selectPlan`, `toggleAddon`, `upsell`, `crossSell`
- `PLANS_M`, `ADDONS_M` CMS merge logic
- The framer-motion `AnimatePresence` banner (lines 191-217) — untouched

**Forms safety:** `Pricing.jsx` contains: `RecommendQuiz` (quiz form), `CheckoutModal` (checkout form), `FeatureDemoModal` (demo modal). `breadcrumbJsonLd` is a module-level constant — it does not interact with any state, context, hook, or event handler. Adding it is equivalent to adding `const PI = 3.14` at module level. The `<Seo>` call receives an updated `jsonLd` array — `<Seo>` renders only into `<head>` and has no effect on any modal, form, or component in the body.

---

### 3H. `src/pages/ProductPage.jsx` — CR-106 (QAPage only)

**Current state (lines 56-60):**
```jsx
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: p.faqs.map(...)
};
```
Already has `BreadcrumbList` ✅ (lines 61-68). Line 72: `jsonLd={[faqJsonLd, breadcrumbJsonLd]}`.

**Change (1 position):**
Line 58: `"@type": "FAQPage"` → `"@type": "QAPage"`

**What stays COMPLETELY UNCHANGED:**
- `BreadcrumbList` (already correct) — untouched
- `DemoForm` on line 248 — zero touch
- `StickyMobileCta` on line 253 — zero touch
- All `EditableList`, `EditableFaqList`, `EditableText`
- All state, hooks, data merging

**Forms safety:** Same analysis as SectorPage — `<DemoForm />` is in a completely separate part of the component. One-word change in a JSON-LD constant has zero side effects.

---

### 3I. `src/pages/Resources.jsx` — CR-106 (QAPage only)

**Current state (lines 62-69):**
```jsx
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(...)
};
```
Line 73: `<Seo ... jsonLd={faqJsonLd} />`

**Change (1 position):**
Line 64: `"@type": "FAQPage"` → `"@type": "QAPage"`

**What stays COMPLETELY UNCHANGED:**
- `FAQS` constant (lines 9-59) — the FAQ data is untouched
- `FaqItem` rendering on line 84
- Two CTAs at lines 91-94 (Book Demo link + ROI link) — untouched

**Forms safety:** `Resources.jsx` contains no interactive forms. The "Book a Free Demo" CTA (line 91) is an `<a href="/#demo">` anchor — not a form. Zero form risk.

---

### 3J. `src/pages/AiPage.jsx` — CR-106 (QAPage only)

**Current state (lines 99-103):**
```jsx
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AI_FAQS.map(...)
};
```
Already has `BreadcrumbList` ✅ (lines 104-111). Line 115: `jsonLd={[faqJsonLd, breadcrumbJsonLd]}`.

**Change (1 position):**
Line 101: `"@type": "FAQPage"` → `"@type": "QAPage"`

**What stays COMPLETELY UNCHANGED:**
- `BreadcrumbList` (already correct) — untouched
- `DemoForm` on line 267 — zero touch
- CMS editables: `EditableText`, `EditableList`, `EditableFaqList` — untouched
- `mergeFeatures` function, `FEATURES_M`, `aiDoc` — untouched
- `useContentDoc` hooks — untouched

**Forms safety:** `AiPage.jsx` contains `<DemoForm />` (line 267). One-word change in `faqJsonLd` at line 101 has zero effect on the DemoForm rendered 160+ lines later.

---

### 3K. `src/components/site/Markdown.jsx` — CR-123 (img width/height)

**Current state (line 16):**
```jsx
img: ({ node, ...p }) => <img className="rounded-2xl my-6 w-full" loading="lazy" alt={p.alt || ""} {...p} />,
```

**Change (1 position — line 16):**
```jsx
img: ({ node, ...p }) => <img className="rounded-2xl my-6 w-full" loading="lazy" alt={p.alt || ""} width={p.width || 400} height={p.height || 300} {...p} />,
```

**What this does:** Adds fallback `width=400` and `height=300` when markdown `<img>` tags have no explicit dimensions. The `{...p}` spread comes AFTER, so if the markdown syntax includes explicit width/height, they override the fallback. Existing behavior for all other elements (`h1`, `h2`, `p`, `ul`, etc.) is completely untouched.

**What stays COMPLETELY UNCHANGED:**
- All other component renderers (lines 6-15, 17-20)
- `ReactMarkdown` and `remarkGfm` configuration
- All CSS classes (layout unchanged — `w-full` still controls display size, width/height HTML attributes only affect aspect ratio reservation)

**Layout safety:** `width={400}` and `height={300}` are HTML attributes used by the browser to reserve layout space. The actual displayed size is still controlled by `className="w-full"` (Tailwind). Adding HTML width/height attributes does NOT override CSS sizing. This is standard practice and cannot cause layout shift.

**Forms safety:** `Markdown.jsx` renders blog post bodies. No forms exist in blog content.

---

## 4. Dependency Graph

```
CR-121 ✅ DONE   ─┐
CR-122 ✅ DONE   ─┤─ sitemap.xml unchanged ─→ prerender.js ROUTES works as-is
CR-82  ✅ DONE   ─┘

CR-135 ─┐
CR-136 ─┤
CR-91  ─┼─→ yarn build ─→ node scripts/prerender.js ─→ restart
CR-106 ─┤
CR-123 ─┘

CR-133 ─┐
CR-134 ─┘─→ node scripts/prerender.js only (no build needed — script change)
```

**Correct execution order:**

1. **FIRST: edit `scripts/prerender.js`** (CR-133 + CR-134 together)  
   Reason: prerender.js changes don't affect source code. But the re-prerender at the end must use the corrected script.

2. **SECOND: edit all 7 source files** (CR-135, CR-136, CR-91×4, CR-106×4, CR-123)  
   These are independent — no ordering constraint between them. All can be edited in parallel.  
   Exception: `SectorPage.jsx` must have both CR-91 and CR-106 applied in one edit (prevents two separate search-replaces on the same file).

3. **THIRD: `yarn build`** — produces correct JS bundles with all changes

4. **FOURTH: `node scripts/prerender.js`** — uses corrected script (CR-133+CR-134) on new build

5. **FIFTH: restart + verify**

---

## 5. Forms Safety — Master Checklist

| Form / Interactive component | File | Wave 1 touches file? | Form section touched? |
|------------------------------|------|---------------------|----------------------|
| `DemoForm` (booking form) | `DemoForm.jsx` | ❌ Not in Wave 1 | N/A — file not touched |
| `DemoForm` in `About.jsx` | `About.jsx` | ✅ CR-136 | ❌ Only import + Seo call (line 22) |
| `DemoForm` in `SectorPage.jsx` | `SectorPage.jsx` | ✅ CR-91 + CR-106 | ❌ Only JSON-LD constants + Seo prop (lines 62-70) |
| `DemoForm` in `ProductPage.jsx` | `ProductPage.jsx` | ✅ CR-106 | ❌ Only 1 word in faqJsonLd (line 58) |
| `DemoForm` in `AiPage.jsx` | `AiPage.jsx` | ✅ CR-106 | ❌ Only 1 word in faqJsonLd (line 101) |
| Demo form + DemoLanding | `DemoLanding.jsx` | ✅ CR-135 | ❌ Only `canonical→path` prop on `<Seo>` (line 75) |
| `CheckoutModal` in `Pricing.jsx` | `Pricing.jsx` | ✅ CR-91 | ❌ Only module-level const + Seo prop (lines 17, 20+, 151) |
| `RecommendQuiz` in `Pricing.jsx` | `Pricing.jsx` | ✅ CR-91 | ❌ Same as above |
| `CartSummary` in `Pricing.jsx` | `Pricing.jsx` | ✅ CR-91 | ❌ Same as above |
| `PlanCompareModal` in `Pricing.jsx` | `Pricing.jsx` | ✅ CR-91 | ❌ Same as above |

**Verdict: ZERO form component code is modified by any Wave 1 CR.**

All changes are in one of three categories:
- `<head>` tag management (jsonLd props on `<Seo>`)
- Import statements
- `scripts/prerender.js` build-time script

None of these categories can affect form rendering, state, validation, or submission.

---

## 6. CMS Content Safety

All `EditableText`, `EditableList`, `EditableFaqList` calls in Wave 1 files are untouched. The only schema-related change near CMS components is CR-106: changing `"FAQPage"` to `"QAPage"` in a JSON-LD constant. This constant is a separate variable — it does not feed into or share state with any `EditableFaqList`. The FAQ content shown on screen is controlled by `EditableFaqList` reading from MongoDB CMS. The FAQ JSON-LD reads from the static data file (`s.faqs`, `p.faqs`, `AI_FAQS`, `FAQS`). These are completely independent.

---

## 7. Prerender Route Count After Wave 1

| Route source | Count | Change |
|-------------|-------|--------|
| Sitemap routes | 53 | Unchanged |
| Extra routes (CR-134) | +2 (`/demo`, `/payment-success`) | New |
| **Total** | **55** | +2 |

The prerender will produce 55 `index.html` files (53 in existing directories + new `/demo/index.html` + `/payment-success/index.html`).

---

## 8. Verification Gates

### Gate A — Build gate (after `yarn build`)
```bash
# No compilation errors
yarn build 2>&1 | grep -E "error|Error|ERROR" | grep -v "eslint"
# Expected: no output
```

### Gate B — Prerender gate (after `node scripts/prerender.js`)
```bash
python3 << 'PYEOF'
import re
from pathlib import Path
build = Path("/app/frontend/build")
SHELL_TITLE = "POS System for Restaurants"
errors = []
total = 0
for f in sorted(build.rglob("index.html")):
    route = str(f.relative_to(build).parent)
    route = "/" if route == "." else "/" + route
    html = f.read_text(errors="ignore")
    title = re.search(r'<title>(.*?)</title>', html)
    canon = re.search(r'<link rel="canonical" href="([^"]*)"', html)
    t = title.group(1) if title else "MISSING"
    c = canon.group(1) if canon else "MISSING"
    total += 1
    if SHELL_TITLE in t and route != "/":
        errors.append(f"FAIL bad-title: {route}")
    if c == "https://www.mygenie.online/" and route != "/":
        errors.append(f"FAIL bad-canon: {route}")
for e in errors: print(e)
print(f"{'PASS' if not errors else 'FAIL'} — {total} pages checked, {len(errors)} errors")
PYEOF
```
Expected: `PASS — 55 pages checked, 0 errors`

### Gate C — BreadcrumbList gate
```bash
python3 << 'PYEOF'
import json, re
from pathlib import Path
build = Path("/app/frontend/build")
checks = {
  "/solutions/restaurants": ["QAPage", "BreadcrumbList"],
  "/blog": ["Blog", "BreadcrumbList"],
  "/blog/improve-table-turnover-pos-order-management": ["BlogPosting", "BreadcrumbList"],
  "/pricing": ["SoftwareApplication", "BreadcrumbList"],
  "/about": ["Organization"],
  "/product/sell-serve": ["QAPage", "BreadcrumbList"],
  "/ai": ["QAPage", "BreadcrumbList"],
  "/resources": ["QAPage"],
  "/demo": [],   # just check it exists and has correct canonical
}
for route, expected in checks.items():
    fpath = build / (route.lstrip("/") or ".") / "index.html"
    if not fpath.exists():
        print(f"FAIL MISSING: {route}"); continue
    html = fpath.read_text(errors="ignore")
    scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    types = []
    for s in scripts:
        try: types.append(json.loads(s).get("@type","?"))
        except: pass
    ok = all(t in types for t in expected)
    print(f"{'PASS' if ok else 'FAIL'} {route}: {types}")
PYEOF
```

### Gate D — Demo page gate
```bash
python3 -c "
html = open('/app/frontend/build/demo/index.html').read()
import re
print('demo prerendered:', 'demo-landing-page' in html)
print('no homepage hero:', 'hero-badge' not in html)
canon = re.search(r'canonical.*href=\"([^\"]+)\"', html)
print('demo canonical:', canon.group(1) if canon else 'MISSING')
"
```
Expected:
```
demo prerendered: True
no homepage hero: True
demo canonical: https://www.mygenie.online/demo
```

### Gate E — Existing structural gate (no regression)
```bash
python3 << 'PYEOF'
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)
g = {
  "hero text present":     'boosts profit by up to' in html,
  "canonical == 1":        len(re.findall(r'<link[^>]*canonical[^>]*>', html)) == 1,
  "image preload == 1":    len([l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]) == 1,
  "no googleapis":         'googleapis' not in html,
  "noscript in head == 0": len(re.findall(r'<noscript>', head)) == 0,
}
for k,v in g.items(): print(f"{'PASS' if v else 'FAIL'} {k}")
PYEOF
```
Expected: all 5 PASS (same as before Wave 1).

---

## 9. Rollback Plan

All changes are in tracked source files. Full rollback:
```bash
cd /app/frontend
git checkout scripts/prerender.js
git checkout src/pages/DemoLanding.jsx
git checkout src/pages/About.jsx
git checkout src/pages/SectorPage.jsx
git checkout src/pages/Blog.jsx
git checkout src/pages/BlogPost.jsx
git checkout src/pages/Pricing.jsx
git checkout src/pages/ProductPage.jsx
git checkout src/pages/Resources.jsx
git checkout src/pages/AiPage.jsx
git checkout src/components/site/Markdown.jsx
# Then rebuild + reprerender original
yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

---

## 10. Summary Table

| CR | File(s) | Lines changed | Forms risk | CMS risk | Dependency |
|----|---------|--------------|-----------|----------|-----------|
| CR-133 | `prerender.js` | +5, 1 edit | None | None | Must run before final prerender |
| CR-134 | `prerender.js` | +3 | None | None | Same file as CR-133 |
| CR-135 | `DemoLanding.jsx` | 1 edit | **None** | None | Independent |
| CR-136 | `About.jsx` | 1 import edit, 1 prop edit | **None** (DemoForm untouched) | None | Independent |
| CR-91 | 4 page files | +6/+8/+8/+7 lines, 1 edit each | **None** (all forms untouched) | None | Can combine with CR-106 on SectorPage |
| CR-106 | 4 page files | 1 word change each | **None** (all forms untouched) | **None** (FAQ data/display unchanged) | Must combine with CR-91 on SectorPage |
| CR-123 | `Markdown.jsx` | 1 line edit | None | None | Independent |
| **TOTAL** | **11 files** | **~50 lines** | **ZERO** | **ZERO** | Single build + single prerender |

---

*Impact analysis written 2026-08-24. All 11 source files read in full. No code changed. Awaiting approval to implement.*
