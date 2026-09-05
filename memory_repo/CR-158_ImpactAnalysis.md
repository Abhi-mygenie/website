# CR-158 — Impact Analysis
# /product H1 Keyword Fix

**Date:** 2026-08-26

---

## 1. Code Investigation

### Current /product H1
`ProductIndex.jsx` L35–39:
```jsx
<span ...>
  <EditableText id="product.index.hero.eyebrow" fallback="Everything in one app" />
</span>
<h1 ...>
  <EditableText id="product.index.hero.h1"
    fallback="Every tool your business needs — in one operating system." block />
</h1>
```

- **Eyebrow:** `"Everything in one app"` — no keyword
- **H1:** `"Every tool your business needs — in one operating system."` — no restaurant/POS keyword
- **CMS keys:** `product.index.hero.eyebrow`, `product.index.hero.h1`
- **Meta title** (`seo.js`): `"Restaurant POS Features & Modules | MyGenie All-in-One"` — has keywords. H1 mismatch.

### Sub-headline
`ProductIndex.jsx` (not shown above, checking below H1):
There is likely a sub-headline that mentions restaurant. But the H1 alone is what Google and visitors see first.

---

## 2. Implementation Path

### Option A — CMS Edit (zero deploy, instant)
Log into `/leads` CMS admin → Edit:
- `product.index.hero.eyebrow` → `"Restaurant POS features"`
- `product.index.hero.h1` → `"One restaurant operating system — every tool included."`

**CMS published value overrides code fallback.** Instant on production. No `yarn build` or prerender cycle.

### Option B — Code fallback update (belt-and-suspenders)
`ProductIndex.jsx` L35, L38: change fallback strings.

Then: `yarn build` + `node scripts/prerender.js` required to update prerendered HTML.

**Recommendation:** Do Option A immediately (CMS), then Option B in next code batch to keep fallback in sync.

---

## 3. Impact Assessment

### Why this matters
`/product` is linked from the global Navbar dropdown ("Product ▾"). Every visitor who explores the product feature set lands here. The H1 should confirm they're looking at a restaurant POS product, not a generic business tool.

### SEO
- Meta title has `"Restaurant POS Features"` — H1 update aligns these, improving on-page SEO consistency
- Prerendered HTML with updated H1 = Googlebot sees keyword in H1 immediately (no JS required for crawling)

### Risk: None
This is a 1-line text change. No functionality, no layout, no data changes.

---

## 4. Files Changed

| File | Change | Risk |
|---|---|---|
| `ProductIndex.jsx` L35, L38 | Fallback text update | None |
| **OR:** CMS admin | Edit `product.index.hero.eyebrow` + `product.index.hero.h1` | None |

---

## 5. Cross-Impact

- No other CRs affected
- If CMS edit done first, code fallback change can be batched with other small text fixes (CR-154, CR-161)

*Impact analysis written 2026-08-26.*
