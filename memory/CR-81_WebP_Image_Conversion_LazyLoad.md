# CR-81 — Convert Brand Images to WebP + Add lazy-loading to TrustBand & FeatureVideo

**Type:** Performance Fix / Image Optimization  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H2 (+ GAP-1 merged)  
**Effort:** 3 hrs  
**Improves:** Perf · LCP · PageSpeed Mobile Score  
**Scope:** `/frontend/public/brand/` (asset work), `frontend/src/components/home/TrustBand.jsx`, `frontend/src/components/site/FeatureVideo.jsx`  
**Related:** CR-71 (hero preload), CR-82 (image dimensions)

---

## 1. Problem Statement

All key brand images are served as unoptimised PNG/JPG:
- `banner.png` — 305 KB (LCP image, homepage hero)
- `feature1.png` through `feature5.png` — 150–170 KB each (product page heroes)
- 8 trust logo PNGs — up to 77 KB each

No WebP versions exist. No `loading="lazy"` on TrustBand marquee logos or FeatureVideo poster frames. This is a direct contributor to the estimated mobile PageSpeed score of 20–40/100.

---

## 2. Exact Changes Required

### Step 1 — Asset Conversion (bash commands)
```bash
# Install cwebp if not present
apt-get install -y webp

# Convert all key brand images
cwebp -q 82 /app/frontend/public/brand/banner.png    -o /app/frontend/public/brand/banner.webp
cwebp -q 82 /app/frontend/public/brand/feature1.png  -o /app/frontend/public/brand/feature1.webp
cwebp -q 82 /app/frontend/public/brand/feature2.png  -o /app/frontend/public/brand/feature2.webp
cwebp -q 82 /app/frontend/public/brand/feature3.png  -o /app/frontend/public/brand/feature3.webp
cwebp -q 82 /app/frontend/public/brand/feature4.png  -o /app/frontend/public/brand/feature4.webp
cwebp -q 82 /app/frontend/public/brand/feature5.png  -o /app/frontend/public/brand/feature5.webp

# Trust logos
for f in hyatt-centric palm-forest bamboo-yoga baba-italy love-bites mill-bakery wild-berry drishti-yoga; do
  cwebp -q 82 /app/frontend/public/brand/${f}.png -o /app/frontend/public/brand/${f}.webp
done
```
Target: banner.webp ≤ 80 KB, feature images ≤ 50 KB each.

### Step 2 — Update `TrustBand.jsx` to use WebP + add lazy loading
```jsx
// BEFORE
<img
  key={i}
  src={logo.img}
  alt={logo.name}
  title={logo.name}
  className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
/>

// AFTER
<img
  key={i}
  src={logo.img.replace('.png', '.webp')} // use WebP
  alt={logo.name}
  title={logo.name}
  loading="lazy"
  width={160} height={64}
  className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
/>
```

Update TRUST_LOGOS in `content.js` to reference `.webp` files directly (cleaner than replacing on render).

### Step 3 — Update `FeatureVideo.jsx` poster frames to add lazy loading
```jsx
// BEFORE
{poster && <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" />}

// AFTER
{poster && <img src={poster} alt={title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
```

### Step 4 — Update Hero.jsx banner reference
Update fallback to reference `.webp`:
```jsx
fallback="/brand/banner.webp"
```
Also update `index.html` preload link (CR-71) to reference `.webp`.

---

## 4. Files Changed

| File | Change |
|---|---|
| `/public/brand/*.png` | Convert to `.webp` (asset work) |
| `frontend/src/components/home/TrustBand.jsx` | Use WebP src, add loading="lazy", add width/height |
| `frontend/src/components/site/FeatureVideo.jsx` | Add loading="lazy" to poster img tags |
| `frontend/src/data/content.js` | Update TRUST_LOGOS img paths to .webp |
| `frontend/src/components/home/Hero.jsx` | Update banner fallback to .webp |

---

## 5. Definition of Done

- [ ] All 6 key images have `.webp` versions in `/public/brand/`
- [ ] banner.webp ≤ 80 KB (vs 305 KB PNG)
- [ ] TrustBand logos load lazily (visible in DevTools Network tab)
- [ ] FeatureVideo posters have loading="lazy"
- [ ] No broken image icons in browser
- [ ] Fallback PNG still works in Safari if WebP support check needed

---

*CR-81 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H2 + GAP-1.*
