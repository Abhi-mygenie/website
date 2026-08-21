# CR-81 — Convert Brand Images to WebP + Add lazy-loading to TrustBand & FeatureVideo

**Type:** Performance Fix / Image Optimization  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** IMPACT ANALYSIS COMPLETE — SCOPE REVISED 2026-08-21  
**Impact analysis:** Session 2026-08-21 — full dependency audit  

**Decisions locked (2026-08-21):**
- Quality: `cwebp -q 82` ✅ approved
- Trust logos scope: ALL 3 sources updated (content.js homepage marquee + vsp.js Petpooja page + DEMO_TRUST_LOGOS in DemoLanding.jsx)
- FeatureVideo.jsx: **SKIP** — poster is null on all products, no-op change
- feature1-5.png: Convert assets only (future-proofing) — **zero code changes** (not rendered anywhere)
- OG images (seo.js + BlogPost.jsx): **Do NOT change** — must stay PNG for social media crawlers
- CR-71 preload update: **N/A** — CR-71 used Option B, no preload line in index.html

**Future CMS note (owner, 2026-08-21):**
Videos and images will be uploaded via CMS in future. CMS-uploaded assets are stored as-is (no auto-conversion). For future-proofing, a CDN-level image transformation pipeline (e.g. Cloudflare Images, S3 + CloudFront image resize, or imgix) would auto-serve WebP to browsers that support it. This is a separate infrastructure decision — not in scope for CR-81.
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

## 2. Exact Changes Required (REVISED — 2026-08-21)

### Step 0 — Install cwebp (pre-flight, not in original CR)
```bash
apt-get install -y webp
```

### Step 1 — Asset Conversion

**Primary images:**
```bash
cwebp -q 82 /app/frontend/public/brand/banner.png -o /app/frontend/public/brand/banner.webp
```

**Trust logos used across all 3 pages:**
```bash
for f in hyatt-centric palm-forest bamboo-yoga baba-italy love-bites mill-bakery wild-berry drishti-yoga ubuntu terra lafetta; do
  cwebp -q 82 /app/frontend/public/brand/${f}.png -o /app/frontend/public/brand/${f}.webp
done
```

**Feature images (future-proofing — no code change):**
```bash
for f in feature1 feature2 feature3 feature4 feature5; do
  cwebp -q 82 /app/frontend/public/brand/${f}.png -o /app/frontend/public/brand/${f}.webp
done
```

### Step 2 — Hero.jsx: banner fallback
```jsx
// BEFORE
fallback="/brand/banner.png"
// AFTER
fallback="/brand/banner.webp"
```

### Step 3 — content.js: TRUST_LOGOS (homepage TrustBand)
Update all 8 `.png` → `.webp`:
- hyatt-centric, palm-forest, bamboo-yoga, baba-italy, love-bites, mill-bakery, wild-berry, drishti-yoga

### Step 4 — vsp.js: VSP_TRUST_LOGOS (Petpooja page — both strips)
Update all 8 `.png` → `.webp`:
- hyatt-centric, palm-forest, love-bites, mill-bakery, bamboo-yoga, ubuntu, terra, lafetta

### Step 5 — DemoLanding.jsx: DEMO_TRUST_LOGOS (/demo page)
Update all 5 `.png` → `.webp`:
- hyatt-centric, palm-forest, love-bites, mill-bakery, bamboo-yoga

---

## 4. Files Changed (REVISED — 2026-08-21)

| File | Change | Reason |
|---|---|---|
| Pre-flight: `apt-get install -y webp` | Install cwebp tool | Not present in environment |
| `/public/brand/banner.webp` | New asset (convert from banner.png) | LCP image — 305KB → ≤80KB |
| `/public/brand/feature*.webp` (×5) | New assets (future-proofing) | Not currently rendered — no code change needed |
| `/public/brand/*.webp` (×8 trust logos) | New assets (convert from .png) | Used in 3 places — see below |
| `src/components/home/Hero.jsx` | `fallback="/brand/banner.png"` → `.webp` | Main LCP image |
| `src/data/content.js` | Update 8 TRUST_LOGOS `img` paths `.png` → `.webp` | Homepage TrustBand marquee |
| `src/data/vsp.js` | Update 8 VSP_TRUST_LOGOS `img` paths `.png` → `.webp` | Petpooja page trust strips |
| `src/pages/DemoLanding.jsx` | Update 5 DEMO_TRUST_LOGOS `img` paths `.png` → `.webp` | /demo page trust strip |

**NOT changing:**
- `FeatureVideo.jsx` — poster is null on all products, change is no-op
- `seo.js` DEFAULT_OG_IMAGE — must stay PNG for social media OG crawlers
- `BlogPost.jsx` OG fallback — must stay PNG for social media OG crawlers
- `TrustBand.jsx` — content.js data update is sufficient, no component change needed
- `index.html` preload — N/A (CR-71 Option B: no preload line exists)

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
