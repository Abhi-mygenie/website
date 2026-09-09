# Wave 1 — Line-by-Line Implementation Plan

**Date:** 2026-08-24
**Status:** READY — awaiting approval. No code changed.
**Prerequisite read:** `WAVE1_Combined_Impact_Analysis.md`

---

## Pre-Implementation Checks

Run these before touching any file:

```bash
# A. Confirm static-server is running (not dev server)
sudo supervisorctl status frontend
# Expected: RUNNING, logs show "static build served on 3000"

# B. Confirm current state — all 53 pages have wrong title/canonical
python3 -c "
import re; from pathlib import Path
build = Path('/app/frontend/build')
bad = sum(1 for f in build.rglob('index.html')
  if 'POS System for Restaurants' in (re.search(r'<title>(.*?)</title>', f.read_text(errors='ignore')) or type('',(),{'group':lambda s,x:''}))().group(1)
  and str(f.relative_to(build).parent) != '.')
print(f'Pages with wrong title: {bad}/53 (expected 52, homepage is legitimately this title)')
"

# C. Confirm testids for new prerender routes (CR-134)
grep "data-testid=\"demo-landing-page\"" /app/frontend/src/pages/DemoLanding.jsx
grep "data-testid=\"payment-success-page\"" /app/frontend/src/pages/PaymentSuccess.jsx
# Expected: 1 hit each — both match [data-testid$="-page"] selector in prerender.js
```

---

## Execution Order

```
STEP 1 → Edit scripts/prerender.js       (CR-133 + CR-134)  — no build needed
STEP 2 → Edit 8 source files             (CR-135, 136, 91×4, 106×4, 123)
STEP 3 → yarn build                      (compile all source changes)
STEP 4 → node scripts/prerender.js       (uses corrected script on new build)
STEP 5 → supervisorctl restart frontend
STEP 6 → Run 5 verification gates
```

Steps 1 and 2 are independent and can be done in any order or in parallel.
**Steps 3, 4, 5, 6 MUST be done in sequence.**

---

## STEP 1 — `scripts/prerender.js` (CR-133 + CR-134)

**File:** `/app/frontend/scripts/prerender.js`
**Total lines:** 106
**Changes:** 3 positions

---

### Change 1-A — Lines 8–12: Add extra routes (CR-134)

**Current lines 8–12:**
```js
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
})();
```

**Replace with:**
```js
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  const sitemapRoutes = [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
  // Not in sitemap (noindex/transactional) but prerendered for UX/ad-landing speed.
  const extraRoutes = ["/demo", "/payment-success"];
  return [...sitemapRoutes, ...extraRoutes];
})();
```

**Line diff:** Lines 8-12 (5 lines) → 5 lines + 3 new lines = 8 lines. All subsequent line numbers shift +3.

**Why safe:**
- `sitemapRoutes` is identical to what the old `return` statement produced — zero behaviour change for the 53 existing routes
- `extraRoutes` appends 2 routes at the end — processed after all 53 sitemap routes
- Both `/demo` (`data-testid="demo-landing-page"`) and `/payment-success` (`data-testid="payment-success-page"`) match the existing `waitForSelector` pattern `[data-testid$="-page"]` — verified in source
- Total routes: 55

---

### Change 1-B — After `waitForSelector` block: Add `waitForFunction` (CR-133 Fix A)

After this change, the `waitForSelector` block is at lines 51–54 (shifted +3 from original 48–51).

**Current (original lines 48–52, now 51–55 after shift):**
```js
      await page.waitForSelector(
        '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
        { timeout: 30000 }
      );
      await page.evaluate(() => {
```

**Replace with:**
```js
      await page.waitForSelector(
        '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
        { timeout: 30000 }
      );
      // CR-133: Wait for react-helmet-async to commit <title> update.
      // The shell/homepage title is the default; wait until it changes to the page-specific title.
      // Non-fatal: homepage legitimately keeps this title, so catch the timeout.
      await page.waitForFunction(
        () => document.title !== "POS System for Restaurants & Cafes | Best Billing Software - MyGenie",
        { timeout: 3000 }
      ).catch(() => {});
      await page.evaluate(() => {
```

**Line diff:** +5 lines inserted after `waitForSelector` closing paren. All subsequent line numbers shift +8 total (3 from 1-A + 5 from 1-B).

**Why safe:**
- `waitForFunction` executes in the PAGE (browser) context — `document.title` is a standard browser property
- For all pages except homepage: react-helmet-async updates `document.title` within ~100ms of React committing — resolves almost instantly
- For homepage: `document.title` === the shell title, so condition never becomes true → 3s timeout → `.catch(() => {})` silently continues → total overhead: 3s for the homepage route only (acceptable)
- For `/demo` and `/payment-success`: titles are `"Book a Free MyGenie Demo | See It Live for Your Restaurant"` and page-specific — different from shell → resolves quickly ✅
- `.catch(() => {})` makes it COMPLETELY NON-FATAL — if anything goes wrong, prerender continues normally

---

### Change 1-C — Line 75 (now line 83 after shifts): Fix canonical deduplication (CR-133 Fix B)

The canonical dedup line is currently line 75. After changes 1-A (+3) and 1-B (+5) it is now line **83**.

**Current line 83 (was 75):**
```js
        Array.from(canonicals).slice(1).forEach((c) => c.remove());
```

**Replace with:**
```js
        Array.from(canonicals).slice(0, -1).forEach((c) => c.remove());
```

**Line diff:** 1 line modified. `.slice(1)` changed to `.slice(0, -1)`.

**Why this fixes the problem:**

During prerender, when Puppeteer visits `/solutions/restaurants`, the static server serves `build/index.html` (the homepage prerender as SPA fallback). The homepage prerender has `<link rel="canonical" href="https://www.mygenie.online/">` in its head. Then react-helmet-async fires and APPENDS the correct canonical `https://www.mygenie.online/solutions/restaurants` AFTER the existing one.

Result at capture time (after `waitForFunction`):
```
canonical[0] = https://www.mygenie.online/     ← wrong (from homepage prerender shell)
canonical[1] = https://www.mygenie.online/solutions/restaurants  ← correct (react-helmet)
```

- **Old `.slice(1)`**: removes indices 1+ → removes correct, keeps wrong ❌
- **New `.slice(0, -1)`**: removes indices 0 to length-2 → removes wrong, keeps correct ✅

**Edge cases:**
- 0 canonicals: `Array.from([]).slice(0, -1)` = `[]` → forEach over empty = no-op ✅
- 1 canonical: `[one].slice(0, -1)` = `[]` → no removal, keeps the single canonical ✅ (same as before)
- 3+ canonicals: removes all but last → correct (react-helmet always appends last) ✅

**Why NOT a timing issue alone:** Even after the `waitForFunction` timing fix, the canonical dedup direction must be corrected. react-helmet-async appends its canonical AFTER the shell's canonical. Without Fix B, Fix A alone would correctly capture both canonicals but then the dedup would still remove the correct one.

---

### Change 1 — Complete final state of modified sections

**Lines 8–16 (ROUTES block after all changes):**
```js
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  const sitemapRoutes = [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
  // Not in sitemap (noindex/transactional) but prerendered for UX/ad-landing speed.
  const extraRoutes = ["/demo", "/payment-success"];
  return [...sitemapRoutes, ...extraRoutes];
})();
```

**Lines 51–66 (waitForSelector + waitForFunction + start of evaluate):**
```js
      await page.waitForSelector(
        '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
        { timeout: 30000 }
      );
      // CR-133: Wait for react-helmet-async to commit <title> update.
      // The shell/homepage title is the default; wait until it changes to the page-specific title.
      // Non-fatal: homepage legitimately keeps this title, so catch the timeout.
      await page.waitForFunction(
        () => document.title !== "POS System for Restaurants & Cafes | Best Billing Software - MyGenie",
        { timeout: 3000 }
      ).catch(() => {});
      await page.evaluate(() => {
        document.querySelectorAll(
          'script[src*="googletagmanager"],script[src*="posthog"],iframe[src*="googletagmanager"]'
        ).forEach((n) => n.remove());
```

**Line 83 (canonical dedup):**
```js
        Array.from(canonicals).slice(0, -1).forEach((c) => c.remove());
```

**Unchanged sections:** All other lines in prerender.js are untouched — title dedup (lines 64-65), style dedup (lines 67-73), noscript removal (line 76), googleapis removal (line 79), hero image preload injection (lines 87-101). None of these interact with the 3 changes above.

---

## STEP 2 — Source File Changes (8 files)

All 8 files below are independent. Apply in any order. All produce zero visual or functional change — only `<head>` tag modifications (schema + import additions).

---

### File 2A — `src/pages/DemoLanding.jsx` (CR-135)

**Total file lines:** ~1020
**Change count:** 1 line modified

**Current line 76:**
```jsx
        canonical="/demo"
```

**Replace with:**
```jsx
        path="/demo"
```

**Context (lines 73–78 for verification):**
```jsx
      <Seo
        title={seo.title}
        description={seo.description}
        path="/demo"        ← CHANGED
        noindex={true}
      />
```

**Why:** `Seo.jsx` accepts `path` prop (not `canonical`). The old `canonical="/demo"` was silently ignored — `path` defaulted to `""` making canonical = `https://www.mygenie.online/`. After fix: canonical = `https://www.mygenie.online/demo`.

**What DOES NOT change:**
- `noindex={true}` — unchanged, /demo stays non-indexed ✅
- Everything below line 78 (the entire demo form, LandingNavbar, LandingFooter, all state/hooks/handlers) — completely untouched ✅
- `seo.title` and `seo.description` from `PAGE_SEO["/demo"]` — unchanged ✅

---

### File 2B — `src/pages/About.jsx` (CR-136)

**Total file lines:** 99
**Change count:** 2 lines modified (1 import, 1 Seo prop)

**Change B-1 — Line 8: Add ORG_JSONLD to import**

**Current line 8:**
```jsx
import { PAGE_SEO } from "@/lib/seo";
```

**Replace with:**
```jsx
import { PAGE_SEO, ORG_JSONLD } from "@/lib/seo";
```

**Change B-2 — Line 22: Add jsonLd prop to Seo call**

**Current line 22:**
```jsx
      <Seo title={seo.title} description={seo.description} path="/about" />
```

**Replace with:**
```jsx
      <Seo title={seo.title} description={seo.description} path="/about" jsonLd={[ORG_JSONLD]} />
```

**Context (lines 19–23 for verification):**
```jsx
  const seo = PAGE_SEO["/about"];
  return (
    <div className="bg-white" data-testid="about-page">
      <Seo title={seo.title} description={seo.description} path="/about" jsonLd={[ORG_JSONLD]} />
      <Navbar />
```

**What DOES NOT change:**
- `ORG_JSONLD` is already defined in `seo.js` (lines 10-30) — no new code needed in seo.js ✅
- `VALUES` constant, all section renders, `DemoForm` on line 91 — untouched ✅
- The `<Seo>` component receives `jsonLd={[ORG_JSONLD]}` which outputs a single `<script type="application/ld+json">` in `<head>` — no body DOM change ✅

---

### File 2C — `src/pages/SectorPage.jsx` (CR-91 + CR-106 combined)

**Total file lines:** 263
**Change count:** 4 positions (1 new import, 1 word change, 1 new const block, 1 prop change)

**Change C-1 — After line 10: New import line**

**Current line 10:**
```jsx
import Seo from "@/components/site/Seo";
```

**Insert after line 10 (new line 11):**
```jsx
import { SITE_URL } from "@/lib/seo";
```

All subsequent line numbers shift +1.

**Change C-2 — Line 64 (now 65 after C-1): FAQPage → QAPage (CR-106)**

**Current line 65:**
```jsx
    "@type": "FAQPage",
```

**Replace with:**
```jsx
    "@type": "QAPage",
```

**Why:** Google retired FAQPage rich results on May 7, 2026. QAPage is the recommended replacement — same structural format, positions pages for AI Overview citations. The `mainEntity` array structure is identical.

**Change C-3 — After line 67 (now 68 after C-1): Add breadcrumbJsonLd (CR-91)**

After the `faqJsonLd` closing `};` (line 68), insert:
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

**Variable safety:**
- `SITE_URL` — newly imported above (Change C-1) ✅
- `s.name` — sector display name (e.g. "Restaurants"), already in scope from line 43 `const s = SECTOR_PAGES[slug]` ✅
- `slug` — URL param, already in scope from line 42 `const { slug } = useParams()` ✅
- This const is defined AFTER the guard at line 53 (`if (!s) return <Navigate.../>`) — `s` is guaranteed non-null ✅

All subsequent line numbers shift +9 total (1 from C-1 + 8 from C-3).

**Change C-4 — Line 70 (now line 80 after all shifts): Update Seo jsonLd prop**

**Current line 80:**
```jsx
      <Seo title={seoTitle} description={s.sub} path={`/solutions/${slug}`} jsonLd={faqJsonLd} />
```

**Replace with:**
```jsx
      <Seo title={seoTitle} description={s.sub} path={`/solutions/${slug}`} jsonLd={[faqJsonLd, breadcrumbJsonLd]} />
```

**Context (surrounding lines 77–83 for verification):**
```jsx
  return (
    <div className="bg-white" data-testid="sector-page">
      <Seo title={seoTitle} description={s.sub} path={`/solutions/${slug}`} jsonLd={[faqJsonLd, breadcrumbJsonLd]} />
      <Navbar />
      <main>
        {/* HERO */}
```

**What DOES NOT change (complete list of untouched elements):**
- Lines 1-9: all imports except Seo line (unchanged)
- Lines 17-53: `sectorDisplay`, `PAIN_FIELDS`, `SOLUTION_FIELDS`, `PROOF_FIELDS`, component function opening, `useParams()`, `useContentDoc()`, `useContent()` hooks, `SECTOR_PAGES` guard ✅
- Line 56-60: `seoTitle` construction, closing `};` of faqJsonLd ✅
- All JSX from the `return (` onwards except the single `<Seo>` prop ✅
- `<DemoForm sector={s.name} />` — untouched ✅
- `<StickyMobileCta>` — untouched ✅
- All `EditableText`, `EditableList`, `EditableFaqList` — untouched ✅

---

### File 2D — `src/pages/Blog.jsx` (CR-91)

**Total file lines:** 122
**Change count:** 1 new const block + 1 prop change

**Change D-1 — After line 52: Add breadcrumbJsonLd**

After the `jsonLd` closing `};` (line 52), insert:
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

**Variable safety:**
- `SITE_URL` — already imported on line 7: `import { PAGE_SEO, SITE_URL } from "@/lib/seo"` ✅
- All values are static strings — no runtime dependencies ✅

All subsequent line numbers shift +8.

**Change D-2 — Line 58 (now line 66 after D-1): Update Seo jsonLd prop**

**Current line 66:**
```jsx
      <Seo title={seo.title} description={seo.description} path="/blog" jsonLd={jsonLd} />
```

**Replace with:**
```jsx
      <Seo title={seo.title} description={seo.description} path="/blog" jsonLd={[jsonLd, breadcrumbJsonLd]} />
```

**What DOES NOT change:**
- Line 7 import (SITE_URL already there) — NO import change needed ✅
- `const [feature, ...rest] = sorted` (now line 63) — untouched ✅
- All blog listing JSX (featured card, grid) — untouched ✅
- All `EditableList` blog editing — untouched ✅
- Image tags: all already have `width` and `height` (CR-82 was done) — unchanged ✅

---

### File 2E — `src/pages/BlogPost.jsx` (CR-91)

**Total file lines:** 114
**Change count:** 1 new const block + 1 prop change

**Change E-1 — After line 58: Add breadcrumbJsonLd**

After the `jsonLd` closing `};` (line 58), insert:
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

**Variable safety:**
- `SITE_URL` — already imported on line 7 ✅
- `post.heading || post.title` — `post` is guaranteed non-null here (the Navigate guard at lines 28-39 returns early if `post` is null; this code is only reached after that guard) ✅
- `slug` — already in scope from line 18 `const { slug } = useParams()` ✅

All subsequent line numbers shift +9.

**Change E-2 — Line 62 (now line 71 after E-1): Update Seo jsonLd prop**

**Current line 71:**
```jsx
      <Seo title={`${post.heading || post.title} | MyGenie Blog`} description={post.description} path={`/blog/${slug}`} image={post.image} type="article" jsonLd={jsonLd} />
```

**Replace with:**
```jsx
      <Seo title={`${post.heading || post.title} | MyGenie Blog`} description={post.description} path={`/blog/${slug}`} image={post.image} type="article" jsonLd={[jsonLd, breadcrumbJsonLd]} />
```

**What DOES NOT change:**
- Line 7 import (SITE_URL already there) — NO import change needed ✅
- Existing `jsonLd` BlogPosting schema (lines 43-58) — untouched ✅
- All article JSX, hero image (already has width/height), CTA section, related posts — untouched ✅

---

### File 2F — `src/pages/Pricing.jsx` (CR-91)

**Total file lines:** 308
**Change count:** 1 import edit + 1 new const block at module level + 1 prop change

**Change F-1 — Line 17: Add SITE_URL to existing import**

**Current line 17:**
```jsx
import { PAGE_SEO, SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**Replace with:**
```jsx
import { PAGE_SEO, SOFTWARE_APP_JSONLD, SITE_URL } from "@/lib/seo";
```

**Change F-2 — After line 20: Add breadcrumbJsonLd at MODULE LEVEL**

After `const inr = ...` (line 20), insert:
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

**Why module level (not inside component):** `breadcrumbJsonLd` for `/pricing` is fully static — it never changes between renders. Defining it at module level means it's created once at module load time, not re-created on every render. Consistent with how `SOFTWARE_APP_JSONLD` is defined in `seo.js`.

**Variable safety:**
- `SITE_URL` — newly added to import on line 17 ✅
- All values are static strings — evaluated once at module load ✅

All subsequent line numbers shift +8 (1 from F-1 = 0 extra lines + 7 from F-2).

**Change F-3 — Line 151 (now line 159 after F-2): Update Seo jsonLd prop**

**Current line 159:**
```jsx
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" jsonLd={[SOFTWARE_APP_JSONLD]} />
```

**Replace with:**
```jsx
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" jsonLd={[SOFTWARE_APP_JSONLD, breadcrumbJsonLd]} />
```

**Context (surrounding lines 155–163 for verification):**
```jsx
  return (
    <div className="bg-white" data-testid="pricing-page">
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" jsonLd={[SOFTWARE_APP_JSONLD, breadcrumbJsonLd]} />
      <Navbar />
      <CheckoutModal open={checkout.open} intent={checkout.intent} config={config} onClose={() => setCheckout({ ...checkout, open: false })} />
```

**What DOES NOT change:**
- All component state (lines 69-80) — untouched ✅
- All CMS merging logic (`PLANS_M`, `ADDONS_M`) — untouched ✅
- `RecommendQuiz`, `CheckoutModal`, `FeatureDemoModal`, `PlanCompareModal` — untouched ✅
- `CartSummary` with all callbacks — untouched ✅
- framer-motion `AnimatePresence` plan-selected banner — untouched ✅
- `onBuy`, `onDemo`, `selectPlan`, `toggleAddon` handlers — untouched ✅

---

### File 2G — `src/pages/ProductPage.jsx` (CR-106)

**Total file lines:** 256
**Change count:** 1 word changed

**Current line 58:**
```jsx
    "@type": "FAQPage",
```

**Replace with:**
```jsx
    "@type": "QAPage",
```

**Context (lines 56–60 for verification):**
```jsx
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
```

**What DOES NOT change:**
- `breadcrumbJsonLd` (lines 61-68) already exists and is correct — untouched ✅
- `jsonLd={[faqJsonLd, breadcrumbJsonLd]}` on line 72 — unchanged ✅
- `DemoForm`, `StickyMobileCta`, all `EditableList` — untouched ✅

---

### File 2H — `src/pages/Resources.jsx` (CR-106)

**Total file lines:** 103
**Change count:** 1 word changed

**Current line 64:**
```jsx
    "@type": "FAQPage",
```

**Replace with:**
```jsx
    "@type": "QAPage",
```

**Context (lines 62–70 for verification):**
```jsx
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
```

**What DOES NOT change:**
- `FAQS` constant (lines 9-59) — untouched ✅
- `FaqItem` renders — untouched ✅
- All CTAs at bottom (anchor links, not forms) — untouched ✅

---

### File 2I — `src/pages/AiPage.jsx` (CR-106)

**Total file lines:** 275
**Change count:** 1 word changed

**Current line 101:**
```jsx
    "@type": "FAQPage",
```

**Replace with:**
```jsx
    "@type": "QAPage",
```

**Context (lines 99–103 for verification):**
```jsx
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: AI_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
```

**What DOES NOT change:**
- `breadcrumbJsonLd` (lines 104-111) already exists and is correct — untouched ✅
- `jsonLd={[faqJsonLd, breadcrumbJsonLd]}` on line 115 — unchanged ✅
- `DemoForm` on line 267, all `EditableText`/`EditableList`/`EditableFaqList` — untouched ✅
- `mergeFeatures`, `aiDoc` CMS logic — untouched ✅

---

### File 2J — `src/components/site/Markdown.jsx` (CR-123)

**Total file lines:** 31
**Change count:** 1 line modified

**Current line 16:**
```jsx
  img: ({ node, ...p }) => <img className="rounded-2xl my-6 w-full" loading="lazy" alt={p.alt || ""} {...p} />,
```

**Replace with:**
```jsx
  img: ({ node, ...p }) => <img className="rounded-2xl my-6 w-full" loading="lazy" alt={p.alt || ""} {...p} width={p.width || 400} height={p.height || 300} />,
```

**Prop ordering explanation:**
`{...p}` spreads all parsed markdown attributes (including `src`, `alt`, and any explicit `width`/`height` if present in the markdown). Our `width={p.width || 400}` and `height={p.height || 300}` come AFTER `{...p}`:
- When markdown has no `width`/`height`: `{...p}` sets neither → our fallbacks set `width=400`, `height=300` ✅
- When markdown has explicit `width`/`height`: `{...p}` sets them → our expression `p.width || 400` = `p.width` (same value, no change) ✅

**Layout impact:**
- `className="w-full"` (Tailwind) still controls the DISPLAYED size — `width=400` is an HTML attribute for browser layout reservation, not a visual override ✅
- No CLS risk — this REDUCES CLS by giving browser the aspect ratio hint ✅
- The social share icons at end of blog posts (in1.svg, facebook1.svg, instagram1.svg) are the specific targets — they will get `width=400 height=300` fallback ✅

**What DOES NOT change:**
- All other renderers (h1–h3, p, ul, ol, li, a, strong, blockquote, table, th, td) — untouched ✅
- `ReactMarkdown` and `remarkGfm` plugin configuration — untouched ✅
- `data-testid="markdown-content"` wrapper div — untouched ✅

---

## STEP 3 — `yarn build`

```bash
cd /app/frontend && yarn build 2>&1 | tail -8
```

**Expected output:**
```
File sizes after gzip:
  [sizes listed]
The build folder is ready to be deployed.
Done in XX.XXs.
```

**If compilation errors appear:**
- React JSX syntax errors → check bracket/brace pairs in SectorPage.jsx or BlogPost.jsx
- Import errors → verify `SITE_URL` and `ORG_JSONLD` are correctly added to imports in About.jsx, SectorPage.jsx, Pricing.jsx
- Type errors → unlikely (pure JSON-LD objects, no TypeScript)

**Never** proceed to Step 4 if build fails.

---

## STEP 4 — `node scripts/prerender.js`

```bash
cd /app/frontend && node scripts/prerender.js 2>&1 | tee /app/frontend/prerender_wave1.log
```

Tee to a persistent log file. Expected: 55 lines like:
```
prerendered / -> /app/frontend/build/index.html
prerendered /petpooja-alternative -> /app/frontend/build/petpooja-alternative/index.html
...
prerendered /demo -> /app/frontend/build/demo/index.html
prerendered /payment-success -> /app/frontend/build/payment-success/index.html
```

**Duration:** ~5-6 minutes (55 routes × ~5s each average + 3s homepage timeout)

**If a route fails (Puppeteer error):**
- Check the specific route in the log — likely a `waitForSelector` timeout
- Run `tail -20 /app/frontend/prerender_wave1.log` to see which route failed
- The failed route will not have a prerendered file — the static server will fall back to `build/index.html`

---

## STEP 5 — Restart static server

```bash
sudo supervisorctl restart frontend
sleep 3
sudo supervisorctl status frontend
# Expected: RUNNING
```

---

## STEP 6 — Verification Gates (run in sequence)

### Gate A — Title + Canonical: Core fix validation (CR-133)
```bash
python3 << 'PYEOF'
import re
from pathlib import Path
build = Path("/app/frontend/build")
SHELL_TITLE = "POS System for Restaurants"
HOMEPAGE_CANON = "https://www.mygenie.online/"
errors = []
total = 0
for f in sorted(build.rglob("index.html")):
    route = str(f.relative_to(build).parent)
    route = "/" if route == "." else "/" + route
    html = f.read_text(errors="ignore")
    title  = re.search(r'<title>(.*?)</title>', html)
    canon  = re.search(r'<link rel="canonical" href="([^"]*)"', html)
    t = title.group(1) if title else "MISSING"
    c = canon.group(1) if canon else "MISSING"
    total += 1
    if SHELL_TITLE in t and route != "/":
        errors.append(f"FAIL bad-title: {route} → '{t[:50]}'")
    if c == HOMEPAGE_CANON and route != "/":
        errors.append(f"FAIL bad-canon: {route} → '{c}'")
    # Check for duplicate descriptions
    descs = re.findall(r'<meta name="description" content="([^"]*)"', html)
    if len(descs) > 1 and route != "/":
        errors.append(f"FAIL dup-desc ({len(descs)}x): {route}")
for e in errors:
    print(e)
if not errors:
    print(f"PASS — {total} pages, all have unique titles, canonicals, descriptions")
else:
    print(f"\nFAIL — {len(errors)} issues across {total} pages")
PYEOF
```
**Expected:** `PASS — 55 pages, all have unique titles, canonicals, descriptions`

---

### Gate B — Schema types: BreadcrumbList + QAPage validation (CR-91, CR-106)
```bash
python3 << 'PYEOF'
import json, re
from pathlib import Path
build = Path("/app/frontend/build")

checks = {
    "/":                      ["Organization", "SoftwareApplication"],
    "/solutions/restaurants": ["QAPage", "BreadcrumbList"],
    "/solutions/cafes":       ["QAPage", "BreadcrumbList"],
    "/product/sell-serve":    ["QAPage", "BreadcrumbList"],
    "/ai":                    ["QAPage", "BreadcrumbList"],
    "/resources":             ["QAPage"],
    "/blog":                  ["Blog", "BreadcrumbList"],
    "/blog/improve-table-turnover-pos-order-management": ["BlogPosting", "BreadcrumbList"],
    "/pricing":               ["SoftwareApplication", "BreadcrumbList"],
    "/about":                 ["Organization"],
    "/demo":                  [],
}

all_pass = True
for route, expected_types in checks.items():
    fpath = build / (route.lstrip("/") or ".") / "index.html"
    if not fpath.exists():
        print(f"FAIL MISSING FILE: {route}"); all_pass = False; continue
    html = fpath.read_text(errors="ignore")
    scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    found_types = []
    for s in scripts:
        try:
            found_types.append(json.loads(s).get("@type", "?"))
        except:
            found_types.append("parse-error")
    missing = [t for t in expected_types if t not in found_types]
    if missing:
        print(f"FAIL {route}: missing {missing}, found {found_types}"); all_pass = False
    else:
        print(f"PASS {route}: {found_types}")

# Also check FAQPage is GONE from all pages (CR-106)
print()
faq_remaining = []
for f in build.rglob("index.html"):
    html = f.read_text(errors="ignore")
    if '"FAQPage"' in html:
        route = str(f.relative_to(build).parent)
        faq_remaining.append("/" if route == "." else "/"+route)
if faq_remaining:
    print(f"FAIL FAQPage still present on: {faq_remaining}")
    all_pass = False
else:
    print("PASS FAQPage removed from all pages (QAPage used instead)")

print(f"\n{'ALL PASS' if all_pass else 'FAILURES — see above'}")
PYEOF
```
**Expected:**
- All pages: PASS with correct schema types
- `PASS FAQPage removed from all pages`

---

### Gate C — Demo + PaymentSuccess: New prerender routes (CR-134, CR-135)
```bash
python3 << 'PYEOF'
import re
from pathlib import Path
build = Path("/app/frontend/build")

for route, check_text, check_not in [
    ("/demo", "demo-landing-page", "hero-badge"),
    ("/payment-success", "payment-success-page", "hero-badge"),
]:
    fpath = build / route.lstrip("/") / "index.html"
    if not fpath.exists():
        print(f"FAIL {route}: file not created"); continue
    html = fpath.read_text(errors="ignore")
    canon = re.search(r'<link rel="canonical" href="([^"]*)"', html)
    c = canon.group(1) if canon else "MISSING"
    present = check_text in html
    no_homepage = check_not not in html
    title = re.search(r'<title>(.*?)</title>', html)
    t = title.group(1) if title else "MISSING"
    ok = present and no_homepage
    print(f"{'PASS' if ok else 'FAIL'} {route}:")
    print(f"  page content present ({check_text}): {present}")
    print(f"  no homepage hero ({check_not} absent): {no_homepage}")
    print(f"  title: {t[:60]}")
    print(f"  canonical: {c}")
PYEOF
```
**Expected for /demo:**
```
PASS /demo:
  page content present (demo-landing-page): True
  no homepage hero (hero-badge absent): True
  title: Book a Free MyGenie Demo | See It Live for Your Restaurant
  canonical: https://www.mygenie.online/demo
```

---

### Gate D — About page ORG_JSONLD (CR-136)
```bash
python3 -c "
import json, re
html = open('/app/frontend/build/about/index.html').read()
scripts = re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)
types = [json.loads(s).get('@type') for s in scripts]
print('PASS' if 'Organization' in types else 'FAIL', 'About page schema types:', types)
"
```
**Expected:** `PASS About page schema types: ['Organization']`

---

### Gate E — Existing structural gate: no regressions
```bash
python3 << 'PYEOF'
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)
g = {
  "hero text present":     'boosts profit by up to' in html,
  "canonical == 1":        len(re.findall(r'<link[^>]*canonical[^>]*>', html)) == 1,
  "image preload == 1":    len([l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]) == 1,
  "font preloads == 3":    len([l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]) == 3,
  "no googleapis":         'googleapis' not in html,
  "noscript in head == 0": len(re.findall(r'<noscript>', head)) == 0,
  "PostHog deferred":      'loadPosthogOnce' in html,
  "root has content":      'boosts profit' in html,
}
for k,v in g.items():
    print(f"{'PASS' if v else 'FAIL'} {k}")
PYEOF
```
**Expected:** All 8 PASS (same as pre-Wave 1 state)

---

## Complete File Change Summary

| File | CRs | Import lines | New lines | Modified lines |
|------|-----|-------------|-----------|----------------|
| `scripts/prerender.js` | CR-133 + CR-134 | 0 | +10 | 1 |
| `src/pages/DemoLanding.jsx` | CR-135 | 0 | 0 | 1 |
| `src/pages/About.jsx` | CR-136 | +1 | 0 | 2 |
| `src/pages/SectorPage.jsx` | CR-91 + CR-106 | +1 | 8 | 2 |
| `src/pages/Blog.jsx` | CR-91 | 0 | 7 | 1 |
| `src/pages/BlogPost.jsx` | CR-91 | 0 | 9 | 1 |
| `src/pages/Pricing.jsx` | CR-91 | +1 | 7 | 2 |
| `src/pages/ProductPage.jsx` | CR-106 | 0 | 0 | 1 |
| `src/pages/Resources.jsx` | CR-106 | 0 | 0 | 1 |
| `src/pages/AiPage.jsx` | CR-106 | 0 | 0 | 1 |
| `src/components/site/Markdown.jsx` | CR-123 | 0 | 0 | 1 |
| **TOTAL** | **7 CRs** | **3** | **41** | **14** |

---

## Rollback Plan

```bash
cd /app/frontend
git checkout scripts/prerender.js
git checkout src/pages/DemoLanding.jsx src/pages/About.jsx src/pages/SectorPage.jsx
git checkout src/pages/Blog.jsx src/pages/BlogPost.jsx src/pages/Pricing.jsx
git checkout src/pages/ProductPage.jsx src/pages/Resources.jsx src/pages/AiPage.jsx
git checkout src/components/site/Markdown.jsx
yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

All changes are in git-tracked files — full rollback in < 5 minutes.

---

*Line-by-line plan written 2026-08-24. All 11 files read in full before writing. No code changed. Awaiting "go ahead" to implement.*
