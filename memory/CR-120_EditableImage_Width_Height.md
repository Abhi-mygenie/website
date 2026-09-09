# CR-120 — EditableImage Missing width/height Attributes (Hero + Logo)

**Type:** Performance Fix / CLS Defence
**Date Raised:** 2026-08-23
**Raised By:** Lighthouse "Image elements do not have explicit width and height" — remaining after CR-82
**Status:** OPEN
**Priority:** LOW
**Effort:** ~15 min
**Improves:** CLS · Lighthouse image dimension audit
**Scope:** `Hero.jsx` (1 call site) · `Logo.jsx` (1 call site)
**Related:** CR-82 (img width/height for other files)

---

## 1. Problem Statement

After CR-82 added `width`/`height` to 7 img tags across 5 files, Lighthouse's "Image elements do not have explicit width and height" audit still flags some elements.

The remaining images are those rendered via the **`EditableImage`** component:
1. **Hero banner** (`Hero.jsx` line 72–86) — displays at `h-[420px]`, no `width`/`height` passed
2. **Navbar logo** (`Logo.jsx` line 9–14) — displays at `h-8` (32px), no `width`/`height` passed

`EditableImage`'s render method already passes `{...rest}` to the underlying `<img>` tag:
```jsx
mediaEl = <img src={src} alt={alt} className={className} {...rest} />;
```
So `width` and `height` will flow through automatically once added to the call sites — **no component change needed**.

---

## 2. Fix

Two call-site additions only.

### Change A — `src/components/home/Hero.jsx` (line 72–86)

**Current:**
```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.webp"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
  fetchPriority="high"
  loading="eager"
/>
```

**Add:** `width={680}` and `height={420}`
```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.webp"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
  width={680}
  height={420}
  fetchPriority="high"
  loading="eager"
/>
```

**Why 680×420:**
- `h-[420px]` is the fixed height from Tailwind → `height={420}` (exact match)
- On mobile (390px), the image fills full width. On desktop it's ~half the 1280px container (~640px). `width={680}` represents a safe midpoint aspect ratio (1.62:1). The browser uses this only to compute the aspect ratio for space reservation — CSS still controls the actual display dimensions.

---

### Change B — `src/components/site/Logo.jsx` (line 9–14)

**Current:**
```jsx
<EditableImage
  id={light ? "brand.logo_light_image" : "brand.logo_image"}
  fallback={light ? "/brand/logo-light.svg" : "/brand/logo.svg"}
  alt="MyGenie POS"
  className="h-8 w-auto"
/>
```

**Add:** `width={120}` and `height={32}`
```jsx
<EditableImage
  id={light ? "brand.logo_light_image" : "brand.logo_image"}
  fallback={light ? "/brand/logo-light.svg" : "/brand/logo.svg"}
  alt="MyGenie POS"
  className="h-8 w-auto"
  width={120}
  height={32}
/>
```

**Why 120×32:**
- `h-8` = 32px → `height={32}` (exact match)
- The MyGenie logo is a typical horizontal brand logo. `width={120}` gives a 3.75:1 aspect ratio — consistent with the actual SVG proportions and standard horizontal logo shapes. The CSS still controls actual display via `h-8 w-auto`.

---

## 3. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `src/components/home/Hero.jsx` | Add `width={680}` `height={420}` to EditableImage call | +2 lines |
| `src/components/site/Logo.jsx` | Add `width={120}` `height={32}` to EditableImage call | +2 lines |
| `src/components/cms/Editable.jsx` | **No change** — `{...rest}` already passes new props through |

---

## 4. Why Editable.jsx Does Not Need Changing

`EditableImage` is defined as:
```jsx
export function EditableImage({ id, fallback, alt = "", block = false, className = "", ...rest }) {
  ...
  mediaEl = <img src={src} alt={alt} className={className} {...rest} />;
```

The `...rest` collects any props not explicitly destructured. Adding `width` and `height` at the call site puts them into `rest`, which is spread onto the `<img>`. The new attributes flow through automatically.

---

## 5. Definition of Done

- [ ] Hero.jsx EditableImage has `width={680}` and `height={420}`
- [ ] Logo.jsx EditableImage has `width={120}` and `height={32}`
- [ ] Lighthouse "Image elements do not have explicit width and height" → fully passes
- [ ] Hero image still renders at `h-[420px]` visually (CSS controls display)
- [ ] Logo still renders at `h-8` visually
- [ ] `yarn build` + `prerender.js` — structural gates pass
- [ ] Testing agent confirms no visual regression

---

*CR-120 registered 2026-08-23. Source: Lighthouse "Image elements do not have explicit width and height" remaining after CR-82.*
