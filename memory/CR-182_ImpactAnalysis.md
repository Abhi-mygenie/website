# CR-182 Impact Analysis — LCP: Hero Banner Missing Responsive srcset
**Date:** 2026-09-02
**Status:** PENDING IMPLEMENTATION — no content approval needed

---

## 1. Current State

### Hero.jsx lines 109–119
```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.webp"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
  width={776}
  height={637}
  fetchPriority="high"
  loading="eager"
/>
```

### EditableImage (Editable.jsx line 448)
```jsx
mediaEl = <img src={src} alt={alt} className={className} {...rest} />;
```
**`...rest` spreads all extra props directly onto `<img>`** — `srcSet` and `sizes` passed to `EditableImage` will reach the DOM `<img>` tag unchanged. No change needed to `EditableImage`.

### banner.webp file
```
/public/brand/banner.webp — 776×637px, 38 KiB
```

### Display context
The hero grid is `lg:grid-cols-2` — on screens < 1024px (mobile/tablet), the image column stacks to full width. Container = 100vw minus padding ≈ **358px wide** on a 390px phone.

Browser always downloads the full 776px / 38 KiB image because there is no `srcset`.

---

## 2. CMS Override Consideration

`home.hero.banner_image` IS in the CMS key list (owner can override with a different image URL).

**Implication:** When no CMS override is active, the default `banner.webp` is served — `srcset` applies fully.
When a CMS override URL is active, the `srcset` pointing to local files won't match. This is acceptable — the CMS image served without `srcset` is the same behaviour as today (no regression). The fix helps the default path.

---

## 3. Fix — Two Parts

### Part A — Create `banner-mobile.webp`
Resize `/public/brand/banner.webp` (776×637) to **400×329px** (same aspect ratio, same content).

```python
from PIL import Image
img = Image.open("public/brand/banner.webp")
mobile = img.resize((400, 329), Image.LANCZOS)
mobile.save("public/brand/banner-mobile.webp", "WEBP", quality=82)
# Target: ~8 KiB (vs 38 KiB original)
```

### Part B — Add `srcSet` + `sizes` to `EditableImage` in Hero.jsx

```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.webp"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
  width={776}
  height={637}
  fetchPriority="high"
  loading="eager"
  srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
  sizes="(max-width: 1023px) 400px, 776px"
/>
```

- `sizes`: mobile (< 1024px) → 400px slot. Desktop (≥ 1024px) → 776px slot.
- `srcSet`: browser picks `banner-mobile.webp` on mobile, `banner.webp` on desktop.

---

## 4. Files to Change

| # | File | Change |
|---|---|---|
| 1 | `public/brand/banner-mobile.webp` | **New file** — 400×329px, ~8 KiB |
| 2 | `src/components/home/Hero.jsx` | Add `srcSet` + `sizes` props to `EditableImage` (lines 109–119) |

`EditableImage` — **no change needed** (`...rest` spread already handles it).

---

## 5. Expected Outcome

| Metric | Before | After |
|---|---|---|
| Image download on mobile | 38 KiB | ~8 KiB |
| LCP (mobile, Slow 4G) | 4.1s | ~2.5–2.8s |
| Lighthouse performance | 82 | ~88–92 (est.) |

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mobile banner looks blurry | Low | Low — 400px is 2× a 200px CSS display slot | LANCZOS resize preserves quality |
| CMS override loses srcset | Expected | Minimal — no regression vs today | Acceptable, documented |
| Aspect ratio mismatch | None | — | 400×329 = same 776/637 ratio |
| Requires rebuild | Yes | Low | Standard yarn build |

---

## 7. Definition of Done

- [ ] `banner-mobile.webp` created at 400×329px, ≤ 10 KiB
- [ ] `srcSet` + `sizes` present on banner `<img>` in prerendered build/index.html
- [ ] Mobile browser network tab confirms 400w variant downloaded on mobile viewport
- [ ] Lighthouse rerun shows LCP ≤ 2.8s

*CR-182 Impact Analysis complete. 1 new file + 2 lines in Hero.jsx. No content approval needed.*
