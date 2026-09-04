# CR-91 — BreadcrumbList Schema: Line-by-Line Implementation Plan

**Date:** 2026-08-24
**Status:** READY — no code written yet
**Prerequisite:** Read `CR-91_ImpactAnalysis.md` first

---

## 0. Prerequisite Checks (run before touching any file)

```bash
# A. Confirm static-server is running (not dev server)
sudo supervisorctl status frontend
# Expected: frontend RUNNING + logs show "static build served on 3000"

# B. Confirm existing BreadcrumbList pattern in ProductPage (our reference)
grep -n "BreadcrumbList\|breadcrumb\|SITE_URL" /app/frontend/src/pages/ProductPage.jsx
# Expected: lines showing SITE_URL import + breadcrumbJsonLd definition + jsonLd={[faqJsonLd, breadcrumbJsonLd]}

# C. Confirm Seo component handles array jsonLd (already confirmed — just a sanity check)
grep -n "Array.isArray" /app/frontend/src/components/site/Seo.jsx
# Expected: 1 hit — the Array.isArray(jsonLd) guard in the render
```

---

## Change 1 — `src/pages/SectorPage.jsx`

**Goal:** Add `SITE_URL` import + `breadcrumbJsonLd` definition + update `<Seo>` call.

---

### 1-A. Line 10 — Add SITE_URL import

SectorPage currently has no import from `@/lib/seo`. Add one.

**Current line 10:**
```jsx
import Seo from "@/components/site/Seo";
```

**Replace with:**
```jsx
import Seo from "@/components/site/Seo";
import { SITE_URL } from "@/lib/seo";
```

**Why:** `SITE_URL` is needed to build the absolute `item` URLs in BreadcrumbList. It resolves to `https://www.mygenie.online` from `REACT_APP_SITE_URL` env var (with fallback). The import is inserted on a new line 11 — all existing line numbers shift by +1 from here, but no logic is affected.

---

### 1-B. Lines 62–66 → add breadcrumbJsonLd after faqJsonLd

**Current lines 62–67 (after the +1 shift from 1-A):**
```jsx
  const seoTitle = `${s.name} POS System & Billing Software | MyGenie`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
```

**Replace with** (append breadcrumbJsonLd block after faqJsonLd closing brace):
```jsx
  const seoTitle = `${s.name} POS System & Billing Software | MyGenie`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
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

**Notes:**
- `s.name` = the human-readable sector name (e.g. `"Restaurants"`, `"Cafes"`) — already in scope from line 43 `const s = SECTOR_PAGES[slug]`
- `slug` = the URL slug (e.g. `"restaurants"`) — already in scope from line 42 `const { slug } = useParams()`
- position 2 links to the `/solutions` hub page (which is now in the sitemap per CR-121)
- The 3-level hierarchy (Home → Solutions → Sector) matches the site nav structure

---

### 1-C. Line 71 (was 70) — Update Seo jsonLd prop

**Current:**
```jsx
      <Seo title={seoTitle} description={s.sub} path={`/solutions/${slug}`} jsonLd={faqJsonLd} />
```

**Replace with:**
```jsx
      <Seo title={seoTitle} description={s.sub} path={`/solutions/${slug}`} jsonLd={[faqJsonLd, breadcrumbJsonLd]} />
```

**Why array order matters:** FAQPage first, BreadcrumbList second. Google processes both independently — order has no functional impact. Convention matches `ProductPage.jsx` and `AiPage.jsx` patterns (FAQPage first).

---

### Change 1 — Final state summary

| Step | Location | Type | Lines |
|------|----------|------|-------|
| 1-A | After line 10 | New import line | +1 |
| 1-B | After faqJsonLd closing brace | New const (7 lines) | +7 |
| 1-C | Seo jsonLd prop | Modified (scalar → array) | ~1 |
| **Total** | | | **+8 new, 1 modified** |

---

## Change 2 — `src/pages/Blog.jsx`

**Goal:** Add `breadcrumbJsonLd` after existing `jsonLd` block + update `<Seo>` call. No new imports needed.

---

### 2-A. Lines 40–52 → append breadcrumbJsonLd after existing jsonLd

**Current lines 40–52:**
```jsx
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "MyGenie Blog",
    url: `${SITE_URL}/blog`,
    blogPost: sorted.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.heading || p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      image: p.image ? `${SITE_URL}${p.image}` : undefined,
    })),
  };
```

**Replace with** (append breadcrumbJsonLd after jsonLd closing brace):
```jsx
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "MyGenie Blog",
    url: `${SITE_URL}/blog`,
    blogPost: sorted.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.heading || p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      image: p.image ? `${SITE_URL}${p.image}` : undefined,
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ],
  };
```

**Notes:**
- `SITE_URL` already imported on line 7 — no new import needed
- 2-level hierarchy (Home → Blog) — blog listing is a top-level destination, correct depth
- `const [feature, ...rest] = sorted` on line 54 is unaffected — breadcrumbJsonLd is defined before it

---

### 2-B. Line 58 — Update Seo jsonLd prop

**Current:**
```jsx
      <Seo title={seo.title} description={seo.description} path="/blog" jsonLd={jsonLd} />
```

**Replace with:**
```jsx
      <Seo title={seo.title} description={seo.description} path="/blog" jsonLd={[jsonLd, breadcrumbJsonLd]} />
```

---

### Change 2 — Final state summary

| Step | Location | Type | Lines |
|------|----------|------|-------|
| 2-A | After jsonLd closing brace | New const (6 lines) | +6 |
| 2-B | Seo jsonLd prop | Modified (scalar → array) | ~1 |
| **Total** | | | **+6 new, 1 modified** |

---

## Change 3 — `src/pages/BlogPost.jsx`

**Goal:** Add `breadcrumbJsonLd` after existing `jsonLd` block + update `<Seo>` call. No new imports needed.

---

### 3-A. Lines 43–58 → append breadcrumbJsonLd after existing jsonLd

**Current lines 43–58:**
```jsx
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.heading || post.title,
    description: post.description,
    image: post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/brand/banner.png`,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "MyGenie POS" },
    publisher: {
      "@type": "Organization",
      name: "MyGenie POS",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };
```

**Replace with** (append breadcrumbJsonLd after jsonLd closing brace):
```jsx
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.heading || post.title,
    description: post.description,
    image: post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/brand/banner.png`,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "MyGenie POS" },
    publisher: {
      "@type": "Organization",
      name: "MyGenie POS",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };
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

**Notes:**
- `SITE_URL` already imported on line 7 — no new import needed
- `post.heading || post.title` — Google uses `name` for the visible breadcrumb label. Using the readable title (not the slug) is correct — matches Google's recommendation to use human-readable names at every position
- `slug` already in scope from `const { slug } = useParams()` on line 18
- `post` is guaranteed non-null at this point (Navigate guard at lines 28-39 handles null case before reaching this code)

---

### 3-B. Line 62 — Update Seo jsonLd prop

**Current:**
```jsx
      <Seo title={`${post.heading || post.title} | MyGenie Blog`} description={post.description} path={`/blog/${slug}`} image={post.image} type="article" jsonLd={jsonLd} />
```

**Replace with:**
```jsx
      <Seo title={`${post.heading || post.title} | MyGenie Blog`} description={post.description} path={`/blog/${slug}`} image={post.image} type="article" jsonLd={[jsonLd, breadcrumbJsonLd]} />
```

---

### Change 3 — Final state summary

| Step | Location | Type | Lines |
|------|----------|------|-------|
| 3-A | After jsonLd closing brace | New const (8 lines) | +8 |
| 3-B | Seo jsonLd prop | Modified (scalar → array) | ~1 |
| **Total** | | | **+8 new, 1 modified** |

---

## Change 4 — `src/pages/Pricing.jsx`

**Goal:** Add `SITE_URL` to existing import + add `breadcrumbJsonLd` as module-level constant + update `<Seo>` call.

**Design decision — module-level vs inside component:** The `breadcrumbJsonLd` for Pricing is fully static (no dynamic values — the path is always `/pricing`). Defining it at module level (outside the component function) avoids re-creating the object on every render. Consistent with how `SOFTWARE_APP_JSONLD` itself is defined in `seo.js` (module-level).

---

### 4-A. Line 17 — Add SITE_URL to existing seo import

**Current line 17:**
```jsx
import { PAGE_SEO, SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**Replace with:**
```jsx
import { PAGE_SEO, SOFTWARE_APP_JSONLD, SITE_URL } from "@/lib/seo";
```

---

### 4-B. After line 19 (`const inr = ...`) — Add breadcrumbJsonLd module-level constant

**Current line 20 (first blank line after inr):**
```jsx
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Display-only projections ...
```

**Insert after `const inr` line:**
```jsx
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/pricing` },
  ],
};

// Display-only projections ...
```

**Why after `inr`:** `inr` and `breadcrumbJsonLd` are both module-level utilities/constants, grouped logically before the display projection constants. Placement here keeps all module-level constants together before the component function.

---

### 4-C. Line 151 — Update Seo jsonLd prop

**Current line 151:**
```jsx
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" jsonLd={[SOFTWARE_APP_JSONLD]} />
```

**Replace with:**
```jsx
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" jsonLd={[SOFTWARE_APP_JSONLD, breadcrumbJsonLd]} />
```

**Why this order:** `SOFTWARE_APP_JSONLD` (the primary schema for /pricing) first, BreadcrumbList second. Consistent with the pattern of primary schema before navigation schema across the codebase.

---

### Change 4 — Final state summary

| Step | Location | Type | Lines |
|------|----------|------|-------|
| 4-A | Line 17 | Modified (add SITE_URL to import) | ~1 |
| 4-B | After `inr` constant | New const (7 lines) | +7 |
| 4-C | Seo jsonLd prop | Modified (array append) | ~1 |
| **Total** | | | **+7 new, 2 modified** |

---

## Execution Pipeline (run AFTER all 4 code changes are made)

### Step 1 — Build
```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors
```

### Step 2 — Prerender
```bash
cd /app/frontend && node scripts/prerender.js 2>&1 | head -5 && echo "..." && tail -5 /app/frontend/prerender.log
# Expected: all 53 routes prerendered without error
```

### Step 3 — Restart static server
```bash
sudo supervisorctl restart frontend
```

### Step 4 — Structural gate check (existing — confirm no regression)
```bash
python3 << 'PYEOF'
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)
g = {
  "hero text present":    'boosts profit by up to' in html,
  "canonical == 1":       len(re.findall(r'<link[^>]*canonical[^>]*>', html)) == 1,
  "image preload == 1":   len([l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]) == 1,
  "no googleapis":        'googleapis' not in html,
  "noscript in head == 0": len(re.findall(r'<noscript>', head)) == 0,
}
for k, v in g.items(): print(f"{'PASS' if v else 'FAIL'} {k}")
PYEOF
```

### Step 5 — BreadcrumbList-specific gate check (new)
```bash
python3 << 'PYEOF'
import json, re, os

def check_page(path, label, expected_types, position3_check=None):
    fpath = f"/app/frontend/build{path}/index.html" if path != "/" else "/app/frontend/build/index.html"
    if not os.path.exists(fpath):
        print(f"MISSING {label}: {fpath}")
        return
    html = open(fpath).read()
    scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    types = []
    for s in scripts:
        try: types.append(json.loads(s).get("@type", "?"))
        except: types.append("parse-error")
    ok = all(t in types for t in expected_types)
    print(f"{'PASS' if ok else 'FAIL'} {label}: {types}")

check_page("/solutions/restaurants", "SectorPage (restaurants)", ["FAQPage", "BreadcrumbList"])
check_page("/blog",                  "Blog listing",             ["Blog", "BreadcrumbList"])
check_page("/blog/improve-table-turnover-pos-order-management", "BlogPost", ["BlogPosting", "BreadcrumbList"])
check_page("/pricing",               "Pricing",                  ["SoftwareApplication", "BreadcrumbList"])
PYEOF
# Expected: 4x PASS
```

---

## Rollback Plan

All changes are in 4 source files tracked by git. If anything fails after build:

```bash
cd /app/frontend
git checkout src/pages/SectorPage.jsx
git checkout src/pages/Blog.jsx
git checkout src/pages/BlogPost.jsx
git checkout src/pages/Pricing.jsx
yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

---

## Definition of Done

- [ ] `yarn build` completes with no errors
- [ ] All 53 routes prerendered
- [ ] Structural gate check: all existing gates PASS
- [ ] BreadcrumbList gate check: 4/4 PASS
- [ ] Schema types on SectorPage prerender: `["FAQPage", "BreadcrumbList"]`
- [ ] Schema types on Blog prerender: `["Blog", "BreadcrumbList"]`
- [ ] Schema types on BlogPost prerender: `["BlogPosting", "BreadcrumbList"]`
- [ ] Schema types on Pricing prerender: `["SoftwareApplication", "BreadcrumbList"]`
- [ ] No visual regression (screenshot check)
- [ ] Testing agent confirmation

---

## File Change Summary

| File | Imports added | New lines | Lines modified | Total change |
|------|--------------|-----------|----------------|-------------|
| `SectorPage.jsx` | `SITE_URL` (new import line) | +7 (breadcrumbJsonLd) | 1 (Seo prop) | +8 lines, 1 edit |
| `Blog.jsx` | none | +6 (breadcrumbJsonLd) | 1 (Seo prop) | +6 lines, 1 edit |
| `BlogPost.jsx` | none | +8 (breadcrumbJsonLd) | 1 (Seo prop) | +8 lines, 1 edit |
| `Pricing.jsx` | `SITE_URL` (added to existing) | +7 (breadcrumbJsonLd) | 2 (import + Seo prop) | +7 lines, 2 edits |
| **Total** | 2 import touches | **+28 lines** | **5 edits** | |

---

*Line-by-line plan written 2026-08-24. No code changed. Awaiting owner approval to implement.*
