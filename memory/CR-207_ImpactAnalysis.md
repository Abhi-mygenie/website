# CR-207 — Impact Analysis: Main Bundle 937 KB — Root Cause & Fix

**CR:** CR-207
**Date:** 2026-09-04
**Status:** Pre-implementation analysis — ROOT CAUSE IDENTIFIED
**Author:** E1 Agent

---

## 1. Bundle Analysis Results

### 1a. Main Bundle Composition (source-map analysis)

```
File: main.dde43c90.js
Minified size: 937 KB
Uncompressed source: 3,537 KB

Package                    Source Size    % of total    Est. minified
─────────────────────────────────────────────────────────────────────
lucide-react               2,381,983      65.8%         ~450 KB
react-dom                    518,375      14.3%         ~150 KB
react-router                 369,738      10.2%         ~100 KB
APP_CODE (actual logic)      123,016       3.4%          ~50 KB
@tanstack/query-core          83,604       2.3%          ~30 KB
sonner                        65,408       1.8%          ~25 KB
react-helmet-async            33,030       0.9%          ~15 KB
react                         18,228       0.5%          ~10 KB
webpack runtime                9,065       0.3%           ~5 KB
others                        ~4,000       0.1%           ~2 KB
─────────────────────────────────────────────────────────────────────
TOTAL                       3,537,KB     100%           ~937 KB
```

**The actual app logic (3.4%) is tiny. 65.8% of the bundle is a single icon library.**

### 1b. Large Chunks — Already Fine

```
238.de9ccead.chunk.js  276 KB → 100% xlsx library     (lazy: LeadsView page)
516.00b16d5a.chunk.js  155 KB → markdown stack         (lazy: BlogPost page)
965.9027a958.chunk.js  153 KB → page component(s)      (lazy: loaded on demand)
```

These large chunks are already lazy-loaded. They only download when a user visits those specific pages. No action needed on them.

---

## 2. Root Cause — Single Line in Navbar.jsx

**File:** `src/components/site/Navbar.jsx`
**Line 3:**
```javascript
import * as Icons from "lucide-react";
```

### Why this destroys tree-shaking

lucide-react has **3,624 icon files**. Webpack's tree-shaking works by static analysis — it looks at what's imported and only bundles those. Named imports work:
```javascript
import { ArrowRight, Menu } from "lucide-react";  // ✅ only 2 icons bundled
```

Wildcard imports break it completely:
```javascript
import * as Icons from "lucide-react";  // ❌ all 3,624 icons bundled
```

webpack cannot know at build time which properties of `Icons` will be accessed at runtime (since `Icons[it.icon]` is a dynamic string lookup). So it includes everything.

### Where the wildcard is used (2 places in Navbar.jsx)

```javascript
// Line 73 — dynamic icon lookup for dropdown items
const Icon = Icons[it.icon] || Icons.Box;

// Line 156 — direct icon use in desktop nav phone link
<Icons.Phone className="w-3.5 h-3.5" />
```

The dynamic lookup at line 73 is needed because nav items specify icons as strings:
```javascript
{ slug: "restaurants", icon: "UtensilsCrossed", ... }
{ slug: "cafes", icon: "Coffee", ... }
```

---

## 3. The Fix — Replace Wildcard with Static NAV_ICONS Map

### What changes

**Only one file: `Navbar.jsx`**

Remove `import * as Icons` and replace with:
1. Add all nav-specific icons to the existing named import on line 2
2. Create a static `NAV_ICONS` object that maps string → component
3. Use `NAV_ICONS[it.icon]` instead of `Icons[it.icon]`
4. Use `<Phone>` directly instead of `<Icons.Phone>`

### Complete icon inventory for nav

Icons currently required by nav items (all verified present in lucide-react 0.516.0):

| Source | Icons |
|---|---|
| Solutions dropdown (SECTORS) | UtensilsCrossed, Coffee, Sandwich, ChefHat, BedDouble, Store, Utensils, Building2, Wine, Croissant, IceCreamCone |
| Product dropdown (MODULE_BUCKETS) | ShoppingBag, Building, HeartHandshake, ShieldCheck, LayoutDashboard, Warehouse |
| Resources dropdown (hardcoded) | BookOpen, Calculator, HelpCircle |
| Direct use on line 156 | Phone |
| Fallback (unknown icons) | Box |
| Already on line 2 | Menu, X, ChevronDown, ChevronRight |

**Total: 26 icons** instead of 3,624.

---

## 4. Expected Impact

### Bundle size

```
Current main bundle:    937 KB
  lucide wildcard:     ~450 KB  ← removed
  + 26 named icons:    ~  5 KB  ← added back (only used ones)
Expected new bundle:   ~492 KB  (~47% smaller)
```

### Performance metrics (preview URL, Lighthouse mobile)

| Metric | After CR-206 | After CR-207 | Change |
|---|---|---|---|
| Main bundle | 937 KB | ~492 KB | −445 KB |
| JS execution | 2.0s | ~1.1s | −0.9s |
| TBT | ~300–500ms* | ~150–250ms | −150ms |
| LCP | ~2–3s | ~1.8–2.5s | −0.2–0.5s |
| Performance score | 84 | ~88–92 | +4 to +8 |

*TBT varies significantly between Lighthouse runs (±300ms). Using 300–500ms as the realistic baseline rather than the anomalous 80ms from the last run.

### What does NOT change

- No visual change — same icons, same nav behaviour
- All 63 prerendered routes — unaffected
- Nav dropdown behaviour — identical (same `NAV_ICONS[it.icon] || Box` fallback)
- SEO, schemas, canonical tags — unaffected
- All lazy-loaded page chunks — unaffected (each page's icon imports remain independent)

---

## 5. Risk Assessment

**Risk: Low**

| Risk | Likelihood | Mitigation |
|---|---|---|
| Missing icon → nav item shows Box fallback | Medium (if a future sector is added with a new icon string) | Box fallback already handles this; add new icons to NAV_ICONS as sectors are added |
| Build breaks | Very low | Named imports are simpler than wildcards; webpack handles this reliably |
| Nav behaviour changes | Near zero | Only the import mechanism changes, not the render logic |
| T1–T8 regression | Near zero | No HTML/routing/SEO change |

**One important maintenance note:** If a new sector or product is added to `content.js` or `products.js` with a new icon string, that icon must also be added to `NAV_ICONS` in Navbar.jsx. The Box fallback ensures graceful degradation (shows a box icon rather than crashing).

---

## 6. Dependency on Original CR-207 Spec (splitChunks)

The original CR-207 spec proposed a `craco.config.js` splitChunks change. After bundle analysis, **that approach is now superseded.** The wildcard import fix is:
- Simpler (1 file vs webpack config)
- More effective (removes the root cause vs moving the problem to a vendor chunk)
- Zero webpack config risk

The splitChunks approach would have split lucide-react into a cacheable vendor chunk — this would improve repeat-visit load time but NOT first-visit parse time. The wildcard fix eliminates the bloat entirely.

*Impact analysis complete — 2026-09-04.*
