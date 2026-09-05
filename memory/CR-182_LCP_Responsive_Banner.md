# CR-182 — LCP 4.1s: Hero Banner Missing Responsive srcset

**Type:** Performance / CWV
**Date Raised:** 2026-09-02
**Status:** OPEN
**Priority:** P1
**Source:** Lighthouse mobile audit — LCP 4.1s (target <2.5s)
**Batch:** W — Lighthouse Audit Gaps

---

## Problem

`/brand/banner.webp` is 776×637px (38 KiB). On mobile, the hero uses a single-column layout and displays the image at ~348×286px — but always downloads the full 776px version because no `srcset` is present.

```jsx
// Hero.jsx lines 112–116 — no srcset, always serves full-size
<img
  src="/brand/banner.webp"
  className="w-full h-[420px] object-contain"
  width={776} height={637}
  fetchPriority="high"
/>
```

Lighthouse: "Image larger than needed (776×637) for displayed dimensions (348×286). Est savings: 30.3 KiB"

LCP = 4.1s. Target = <2.5s. This is the #1 performance bottleneck from our code.

---

## Fix

1. Create `banner-mobile.webp` at 400px wide (~8 KiB) from the same source
2. Add `srcset` + `sizes` to the `<img>` tag:

```jsx
<img
  src="/brand/banner.webp"
  srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
  sizes="(max-width: 1024px) 400px, 776px"
  className="w-full h-[420px] object-contain"
  width={776} height={637}
  fetchPriority="high"
  loading="eager"
/>
```

Note: `EditableImage` wraps the banner — srcset support needs to pass through the component.

---

## Files to Change

| File | Change |
|---|---|
| `public/brand/banner-mobile.webp` | New file — banner resized to 400px wide |
| `src/components/home/Hero.jsx` | Add srcset + sizes to banner img |
| `src/components/cms/EditableImage.jsx` | Pass srcset prop through if set |

## Expected Outcome

LCP: 4.1s → ~2.5s (mobile). Browser downloads 8 KiB instead of 38 KiB on mobile.

*CR-182 registered 2026-09-02. Source: Lighthouse mobile audit.*
