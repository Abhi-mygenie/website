# CR-82 — Add Explicit width/height Attributes to All img Tags (CLS Fix)

**Type:** Performance Fix / CLS  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H3  
**Effort:** 1 hr  
**Improves:** Perf · CLS (Cumulative Layout Shift)  
**Scope:** `TrustBand.jsx`, `ProofSection.jsx`, `SuccessStories.jsx`, `Blog.jsx`, `BlogPost.jsx`  
**Related:** CR-81 (WebP + lazy load)

---

## 1. Problem Statement

All `<img>` tags across the codebase use only Tailwind CSS classes (`h-16 w-auto`, `w-10 h-10`) for sizing but have no HTML `width` and `height` attributes. Without these attributes, the browser cannot reserve space for images before they load, causing layout shift (CLS) — a Core Web Vital that Google measures for both PageSpeed score and Landing Page Experience.

---

## 2. Affected Files & Required Changes

### `frontend/src/components/home/TrustBand.jsx` — marquee logos
```jsx
// ADD width and height:
<img
  src={logo.img}
  alt={logo.name}
  title={logo.name}
  loading="lazy"
  width={160} height={64}  {/* ← ADD */}
  className="h-16 w-auto object-contain ..."
/>
```

### `frontend/src/components/home/ProofSection.jsx` — testimonial avatars
```jsx
// ADD width and height:
<img
  src={t.img} alt={t.client}
  width={40} height={40}  {/* ← ADD */}
  className="w-10 h-10 rounded-full object-cover border border-brand-line"
/>
```

### `frontend/src/pages/SuccessStories.jsx` — client photos
```jsx
<img
  src={t.img} alt={t.client}
  width={40} height={40}  {/* ← ADD */}
  className="w-10 h-10 rounded-full object-cover border border-brand-line"
/>
```

### `frontend/src/pages/Blog.jsx` — blog card images (2 locations)
```jsx
// Featured blog image
<img
  src={feature.image} alt={feature.heading}
  width={800} height={500}  {/* ← ADD */}
  className="w-full h-full object-cover ..."
/>
// Blog grid images
<img
  src={p.image} alt={p.heading}
  loading="lazy"
  width={400} height={250}  {/* ← ADD */}
  className="w-full h-full object-cover ..."
/>
```

### `frontend/src/pages/BlogPost.jsx` — hero image
```jsx
<img
  src={post.image} alt={post.heading || post.title}
  loading="lazy"
  width={1200} height={630}  {/* ← ADD */}
  className="w-full rounded-[2rem] mt-8 border border-brand-line"
/>
```

---

## 3. Files Changed

| File | Images affected |
|---|---|
| `src/components/home/TrustBand.jsx` | 8 marquee logos |
| `src/components/home/ProofSection.jsx` | 3 testimonial avatars |
| `src/pages/SuccessStories.jsx` | Client photos |
| `src/pages/Blog.jsx` | Featured + grid blog images |
| `src/pages/BlogPost.jsx` | Blog post hero |

---

## 4. Definition of Done

- [ ] No CLS from images in Lighthouse report (target CLS ≤ 0.1)
- [ ] All `<img>` tags in listed files have explicit `width` and `height` attributes
- [ ] Images still render at correct visual sizes (Tailwind classes still control display size)
- [ ] Browser DevTools — no images without aspect ratio defined

---

*CR-82 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H3.*
