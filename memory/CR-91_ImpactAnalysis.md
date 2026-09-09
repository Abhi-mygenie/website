# CR-91 — BreadcrumbList Schema: End-to-End Impact Analysis

**Date:** 2026-08-24
**Status:** OPEN — ready for implementation
**Priority:** MEDIUM
**Effort:** ~20 min code + build + prerender (~5 min build, ~4 min prerender)

---

## 1. What Is BreadcrumbList and Why It Matters

BreadcrumbList is a Schema.org structured data type that tells Google the navigation path to a page. When valid, Google renders it in the search result snippet like this:

```
mygenie.online › solutions › restaurants
Restaurant POS System & Billing Software | MyGenie
MyGenie POS is the hospitality operating system...
```

Without BreadcrumbList, Google shows the raw URL or guesses the breadcrumb from anchor text — less accurate and less visually appealing in the SERP.

### What it changes in practice
- Eligible for **breadcrumb trail rich result** in Google Search (replaces raw URL display)
- Strengthens **internal linking signals** — Google understands the page hierarchy
- Improves **structured data coverage score** in Google Search Console
- Cited positively in E-E-A-T signals for topical authority (shows site is well-structured)

### What it does NOT change
- Page content, UI, or visual appearance — zero user-facing changes
- Bundle size — JSON-LD is rendered as an inline `<script>` tag in the `<head>`, not JS module weight
- TBT / LCP / CLS — no performance impact whatsoever

---

## 2. Current State Audit

### Pages that already have BreadcrumbList ✅
| Page | File | BreadcrumbList |
|------|------|---------------|
| `/product/[slug]` | `ProductPage.jsx` | ✅ Home → [Product Title] |
| `/ai` | `AiPage.jsx` | ✅ Home → Practical AI |

### Pages missing BreadcrumbList ❌ (this CR)
| Page | File | Has Schema? | Missing |
|------|------|-------------|---------|
| `/solutions/[slug]` | `SectorPage.jsx` | FAQPage only | BreadcrumbList |
| `/blog` | `Blog.jsx` | Blog type only | BreadcrumbList |
| `/blog/[slug]` | `BlogPost.jsx` | BlogPosting only | BreadcrumbList |
| `/pricing` | `Pricing.jsx` | SoftwareApplication only | BreadcrumbList |

### Root inconsistency
`ProductPage.jsx` (depth = 2: Home → Product) has BreadcrumbList. `SectorPage.jsx` (depth = 3: Home → Solutions → Sector) is structurally identical in purpose but missing it. This means Google sees product pages as well-structured but solution pages as unstructured — despite both being generated from the same template pattern.

---

## 3. File-by-File Impact

### 3A. SectorPage.jsx — 10 sector pages

**Routes affected:** `/solutions/restaurants`, `/solutions/cafes`, `/solutions/qsr`, `/solutions/cloud-kitchens`, `/solutions/hotels-resorts`, `/solutions/food-courts`, `/solutions/canteens`, `/solutions/chains`, `/solutions/bars-pubs`, `/solutions/bakeries`, `/solutions/ice-cream-desserts` (11 routes, one schema change covers all)

**Current `<head>` JSON-LD emitted:**
```json
{ "@type": "FAQPage", ... }
```

**After CR-91 `<head>` JSON-LD:**
```json
{ "@type": "FAQPage", ... }
{ "@type": "BreadcrumbList", itemListElement: [ Home, Solutions, [Sector Name] ] }
```

**Breadcrumb trail in SERP:**
```
mygenie.online › solutions › restaurants
```

**Data source:** `slug` from `useParams()` (already in scope), `s.name` from `SECTOR_PAGES[slug]` (already in scope), `SITE_URL` from `@/lib/seo` (needs 1 new import line).

**Changes required:**
- 1 new import line (add `SITE_URL` to existing `@/lib/seo` import — currently file has no import from seo.js)
- 7 new lines (breadcrumbJsonLd object definition)
- 1 line modified (Seo `jsonLd` prop: scalar → array of 2)

**Total: +8 lines, 1 line modified**

---

### 3B. Blog.jsx — /blog listing page

**Route affected:** `/blog` (1 route)

**Current `<head>` JSON-LD emitted:**
```json
{ "@type": "Blog", blogPost: [...20 posts] }
```

**After CR-91 `<head>` JSON-LD:**
```json
{ "@type": "Blog", blogPost: [...20 posts] }
{ "@type": "BreadcrumbList", itemListElement: [ Home, Blog ] }
```

**Breadcrumb trail in SERP:**
```
mygenie.online › blog
```

**Data source:** `SITE_URL` already imported on line 7 (`import { PAGE_SEO, SITE_URL } from "@/lib/seo"`). No new imports needed.

**Changes required:**
- 0 new imports
- 6 new lines (breadcrumbJsonLd object definition, placed after existing `jsonLd` block on line 52)
- 1 line modified (Seo `jsonLd` prop: `jsonLd` → `[jsonLd, breadcrumbJsonLd]`)

**Total: +6 lines, 1 line modified**

---

### 3C. BlogPost.jsx — individual blog post pages

**Routes affected:** All 21 blog post slugs (one schema change covers all dynamically)

**Current `<head>` JSON-LD emitted:**
```json
{ "@type": "BlogPosting", headline: "...", author: {...}, ... }
```

**After CR-91 `<head>` JSON-LD:**
```json
{ "@type": "BlogPosting", headline: "...", author: {...}, ... }
{ "@type": "BreadcrumbList", itemListElement: [ Home, Blog, [Post Title] ] }
```

**Breadcrumb trail in SERP:**
```
mygenie.online › blog › How-a-smart-POS-system-can-boost-your-restaurant-profit-margins
```

**Data source:** `SITE_URL` already imported on line 7. `post.heading || post.title` already in scope (used in existing jsonLd on line 46). `slug` already in scope from `useParams()` on line 18. No new imports needed.

**Note on position 3 name:** Using `post.heading || post.title` — the human-readable title, not the URL slug. Google will show the title, not the raw slug, in the breadcrumb trail. This matches how Google interprets position 3 on blog post breadcrumbs.

**Changes required:**
- 0 new imports
- 8 new lines (breadcrumbJsonLd object definition, placed after existing `jsonLd` block on line 58)
- 1 line modified (Seo `jsonLd` prop: `jsonLd` → `[jsonLd, breadcrumbJsonLd]`)

**Total: +8 lines, 1 line modified**

---

### 3D. Pricing.jsx — /pricing page

**Route affected:** `/pricing` (1 route)

**Current `<head>` JSON-LD emitted:**
```json
{ "@type": "SoftwareApplication", offers: [...], ... }
```

**After CR-91 `<head>` JSON-LD:**
```json
{ "@type": "SoftwareApplication", offers: [...], ... }
{ "@type": "BreadcrumbList", itemListElement: [ Home, Pricing ] }
```

**Breadcrumb trail in SERP:**
```
mygenie.online › pricing
```

**Data source:** `SITE_URL` needs to be added to the existing import on line 17 (`import { PAGE_SEO, SOFTWARE_APP_JSONLD } from "@/lib/seo"` → add `SITE_URL`). The breadcrumbJsonLd is entirely static (no dynamic values), so it can be defined as a module-level constant (before the component function) to avoid re-creating it on every render.

**Changes required:**
- 1 line modified (add `SITE_URL` to existing line-17 import)
- 7 new lines (breadcrumbJsonLd constant, defined at module level after imports, before the component function)
- 1 line modified (Seo `jsonLd` prop: `[SOFTWARE_APP_JSONLD]` → `[SOFTWARE_APP_JSONLD, breadcrumbJsonLd]`)

**Total: +7 lines, 2 lines modified**

---

## 4. Risk Assessment

| Risk | Severity | Likelihood | Notes |
|------|----------|-----------|-------|
| Visual regression | None | 0% | JSON-LD is in `<head>`, invisible to users |
| Functional regression | None | 0% | No component logic touched |
| Schema validation error | Low | <5% | Standard BreadcrumbList structure, identical to ProductPage pattern |
| TBT / bundle size impact | None | 0% | JSON-LD is inlined in HTML, not a JS import |
| CLS impact | None | 0% | No DOM changes |
| Prerender regression | Very Low | <2% | Pure `<head>` addition; prerender gate checks G3/G4/G5 unaffected |

**Overall risk: MINIMAL.** The change is purely additive — existing schemas (FAQPage, BlogPosting, Blog, SoftwareApplication) are preserved exactly. BreadcrumbList is appended as an additional `<script type="application/ld+json">` block.

---

## 5. Scope: What Stays Unchanged

- All existing JSON-LD schemas in all 4 files are **untouched**
- All JSX, component logic, props, and styling are **untouched**
- The `<Seo>` component already supports `jsonLd` as an array (confirmed: `AiPage.jsx` uses `jsonLd={[faqJsonLd, breadcrumbJsonLd]}`) — **no changes to Seo.jsx**
- `seo.js` lib file — **untouched** (SITE_URL is already exported)

---

## 6. Post-Implementation Verification

### Structural gate (no new gates needed — existing pass/fail still correct)
BreadcrumbList adds a second `<script type="application/ld+json">` block per page. The existing gate check `"style blocks == 2"` is unrelated to script blocks. No gate regression expected.

### Schema validation
After build + prerender, verify each page in Google Rich Results Test:
- `https://www.mygenie.online/solutions/restaurants` — should show both FAQPage + BreadcrumbList valid
- `https://www.mygenie.online/blog` — should show Blog + BreadcrumbList valid
- `https://www.mygenie.online/blog/[any-slug]` — should show BlogPosting + BreadcrumbList valid
- `https://www.mygenie.online/pricing` — should show SoftwareApplication + BreadcrumbList valid

### Prerender gate check
After implementation, run: `cd /app/frontend && yarn build && node scripts/prerender.js`

Verify on prerendered `/solutions/restaurants/index.html`:
```bash
python3 -c "
import json, re
html = open('/app/frontend/build/solutions/restaurants/index.html').read()
scripts = re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)
types = [json.loads(s).get('@type','?') for s in scripts]
print('Schema types found:', types)
print('BreadcrumbList present:', 'BreadcrumbList' in types)
print('FAQPage present:', 'FAQPage' in types)
"
```

Expected output:
```
Schema types found: ['FAQPage', 'BreadcrumbList']
BreadcrumbList present: True
FAQPage present: True
```

---

## 7. Total Change Summary

| File | New imports | New lines | Modified lines | Complexity |
|------|-------------|-----------|----------------|-----------|
| `SectorPage.jsx` | 1 | 7 | 1 | Low |
| `Blog.jsx` | 0 | 6 | 1 | Low |
| `BlogPost.jsx` | 0 | 8 | 1 | Low |
| `Pricing.jsx` | 1 | 7 | 2 | Low |
| **Total** | **2** | **28** | **5** | **Low** |

---

## 8. Expected Outcome

- **Google Search Console:** Structured data report will show BreadcrumbList valid for 33 URLs (11 sector + 1 blog + 21 blog posts + 1 pricing)
- **SERP appearance:** Within 1–4 weeks of Google re-crawling, breadcrumb trails appear under these URLs in search results
- **Lighthouse score:** No change (BreadcrumbList is not a Lighthouse metric)
- **No owner input required** — all data (page titles, URLs, sector names) exists in code

---

*Impact analysis written 2026-08-24. Ready for line-by-line implementation plan.*
