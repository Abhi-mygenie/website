# CR-120 — Impact Analysis
## EditableImage Missing width/height: Hero Banner + Navbar Logo

**Date:** 2026-08-23
**Status:** OPEN — ready for implementation
**Effort:** ~15 min

---

## 1. Executive Summary

After CR-82 added `width`/`height` to 7 img tags across 5 files, **3 img tags remain without dimensions** in the prerendered homepage HTML — all rendered through the `EditableImage` component. These are the hero banner and the Navbar logo (×2, light + dark variants).

`EditableImage` already spreads `{...rest}` onto the underlying `<img>`. No component change is needed — adding `width` and `height` props at **2 call sites** (Hero.jsx, Logo.jsx) is sufficient.

This is a **defensive CLS fix**, not an active regression. Current CLS is 0 because:
- The hero image is preloaded (`fetchpriority="high"`, `loading="eager"`, `<link rel="preload">`) — it arrives before first paint
- The logo is an SVG — instantly available

**However:** If the CMS admin publishes a different hero image (from `/api/cms/media/...`), that new image is NOT preloaded (the preload tag points to `/brand/banner.webp`). Without `width`/`height`, the hero area has no reserved space, and the image arriving after first paint would cause significant CLS (~0.26 from a 420px element).

| Metric | Current | After CR-120 |
|--------|---------|-------------|
| CLS (preview, hardcoded fallback) | 0 | 0 |
| CLS (production, CMS-overridden image) | **Risk: up to ~0.26** | **~0 ✅** |
| Lighthouse "Image elements no width/height" | 3 remaining | **0 ✅** |

---

## 2. Before Benchmarks — Confirmed from Prerendered HTML

### Img tags without width/height in current `build/index.html`

Confirmed by direct measurement:

```
Total img tags in prerendered HTML:       21
Img tags WITHOUT width/height:             3
```

| Tag | Element | CSS | Why no dims |
|-----|---------|-----|-------------|
| `<img alt="MyGenie POS" class="h-8 w-auto" src="/brand/logo.svg">` | Navbar logo (desktop) | `h-8 w-auto` | EditableImage call site never had width/height props |
| `<img alt="MyGenie POS hospitality operating system" class="w-full h-[420px] object-contain" ...>` | Hero banner | `w-full h-[420px]` | EditableImage call site never had width/height props |
| `<img alt="MyGenie POS" class="h-8 w-auto" src="/brand/logo-light.svg">` | Navbar logo (mobile) | `h-8 w-auto` | Same Logo.jsx EditableImage — renders twice (light/dark) |

Both logo img tags come from the same Logo.jsx component that renders once for desktop nav and once for the mobile nav drawer.

---

## 3. Actual Dimensions (Measured)

### Hero banner (`/brand/banner.webp`)

```
banner.webp intrinsic dimensions: 776×637 pixels (measured from file header)
Aspect ratio: 776/637 = 1.218:1
CSS display: w-full h-[420px] object-contain
  → height always 420px; width = 420 × 1.218 = 511px (on a wide container)
  → on mobile (390px container): entire width is 390px
```

**width/height to add:** `width={776} height={637}` — the source image's intrinsic dimensions. This gives the browser the exact aspect ratio of the image, so it can reserve the correct space before the image loads.

---

### Navbar logo (`/brand/logo.svg`)

```
logo.svg viewBox: "0 0 156.065 82"
Aspect ratio: 156.065/82 = 1.903:1
CSS display: h-8 w-auto → rendered at 32px height, ~61px width
```

**width/height to add:** `width={156} height={82}` — the SVG's natural dimensions from its viewBox. The browser computes aspect ratio from these, then CSS `h-8 w-auto` scales to the actual display size.

> Note: `logo-light.svg` has the same viewBox dimensions. Both light and dark logos use the same Logo.jsx component, so fixing the one call site fixes both rendered img tags.

---

## 4. The `EditableImage` Architecture — Why No Component Change Is Needed

```jsx
// Editable.jsx line 410–444 (simplified):
export function EditableImage({ id, fallback, alt = "", block = false, className = "", ...rest }) {
  const src = useContent(id, fallback);  // gets CMS override or fallback
  ...
  mediaEl = <img src={src} alt={alt} className={className} {...rest} />;
  //                                                              ^^^^
  //                               ALL extra props flow through here
}
```

`{...rest}` captures any prop not explicitly listed in the destructuring. Since `width` and `height` are not destructured, they land in `rest` and are spread directly onto `<img>`. Adding them at the call site automatically puts them on the rendered img.

**No changes to `Editable.jsx` needed.**

---

## 5. All EditableImage Call Sites — Full Inventory

| File | Usage | Scope | Fix in CR-120? |
|------|-------|-------|---------------|
| `Hero.jsx` | Hero banner — `w-full h-[420px]`, above fold, LCP | Homepage POC | ✅ Yes |
| `Logo.jsx` | Navbar logo — `h-8 w-auto`, above fold | Homepage POC | ✅ Yes |
| `FeatureDemoModal.jsx` | Demo GIF modal — `w-full max-h-[70vh]`, pricing page | Not homepage | 🟡 Out of scope for now |
| `PlanShowcase.jsx` | Plan demo GIF — `aspect-[4/3] w-full`, pricing page | Not homepage | 🟡 Out of scope for now |

The two out-of-scope usages (`FeatureDemoModal` and `PlanShowcase`) render CMS-uploaded GIFs/images on the `/pricing` page. Their dimensions are dynamic (depends on uploaded content), making it difficult to specify accurate static `width`/`height`. They can be addressed in a separate `/pricing` page optimisation CR.

---

## 6. Impact on CLS — Detailed Model

### Why CLS is 0 today with no width/height

**Hero image:**
1. `<link rel="preload" as="image" fetchpriority="high" href="/brand/banner.webp">` is in the `<head>` (from our prerender fix)
2. Browser starts downloading banner.webp at HTML parse time
3. `fetchpriority="high"` prioritises it above other resources
4. By FCP (~2.4s), banner.webp (37.9 KB) has been downloading for ~2.3s on Slow-4G — fully downloaded
5. Hero image is painted at or before FCP → **no layout shift** (image was ready before any content painted)

**Logo:**
1. Logo is an SVG file — 5 KB, instant load
2. No async delay → **no layout shift**

### Why width/height is still needed (the CMS edge case)

```
CMS admin publishes a new hero image via /api/cms/media/435e66d8...png
  ↓
EditableImage.useContent() returns the CMS URL, not /brand/banner.webp
  ↓
The preload tag in HTML still points to /brand/banner.webp — NOT the new image
  ↓
The new CMS image is NOT preloaded
  ↓
Without width/height:
  Browser paints hero area at height=0 (no reserved space)
  CMS image arrives ~1-2s after FCP
  420px of content shifts down = CLS ≈ (420/812) × (420/812) = 0.267 ← FAIL

With width/height:
  Browser reserves 776×637 aspect ratio → scales to h-[420px] = ~511×420px
  Container height is reserved even before image loads
  CMS image arrives → no layout shift = CLS ≈ 0 ✅
```

This is the same production scenario we saw in the original `beta.mygenie.online` Lighthouse runs, where the hero was the CMS image and LCP was ~2.5-3s. Adding `width`/`height` ensures CLS stays at 0 regardless of whether the image comes from the fallback or the CMS.

---

## 7. Predicted Impact

### Lighthouse audits cleared

| Audit | Before | After |
|-------|--------|-------|
| "Image elements do not have explicit width and height" | 3 img tags flagged | **0 ✅** |
| CLS in production (CMS image) | **Risk: ~0.267** | **~0.000 ✅** |

### Performance score

| Metric | Current | After CR-120 |
|--------|---------|-------------|
| CLS (preview) | 0 | 0 |
| CLS (production with CMS image) | At risk | Hardened |
| Performance score | ~76–78 | **~77–79** (+1 pt from audit) |

> The score improvement is modest (+1 pt). The primary value is **production CLS insurance** — preventing a score regression when CMS content is published.

---

## 8. Risk Assessment

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|------------|
| Wrong width/height breaks hero layout | Very Low | Low | CSS (`w-full h-[420px] object-contain`) takes full precedence over HTML attrs for display |
| Wrong aspect ratio causes visible CLS | Very Low | Low | Even slightly wrong aspect ratio is better than none |
| `...rest` on EditableImage conflicts with width/height | None | None | Confirmed: no width/height in destructured params; `rest` picks them up cleanly |

---

## 9. Scope of Change

| File | Change | Lines |
|------|--------|-------|
| `src/components/home/Hero.jsx` | Add `width={776}` `height={637}` to EditableImage (lines 72–86) | +2 lines |
| `src/components/site/Logo.jsx` | Add `width={156}` `height={82}` to EditableImage (lines 9–14) | +2 lines |
| `src/components/cms/Editable.jsx` | **No change** |
| All other files | **Untouched** |

---

## 10. Impact on Fixed CRs

Zero. Hero.jsx was last changed in CR-115 (removed framer-motion) and in the CR-101 POC (opacity:1 initial state, which was then removed in CR-115). Logo.jsx was never changed by any CWV CR. No conflict with any prior fix.

---

*Impact analysis written 2026-08-23. No code changed. Awaiting approval.*
