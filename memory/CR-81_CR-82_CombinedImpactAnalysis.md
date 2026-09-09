# CR-81 + CR-82 — Combined Impact Analysis
## Image Optimization: WebP Completion + Explicit Dimensions

**Date:** 2026-08-23
**Author:** E1 analysis agent
**CRs covered:** CR-81 (WebP conversion + lazy-loading) · CR-82 (img width/height)

---

## 1. Actual Current State (measured 2026-08-23)

CR-81 was marked "IMPLEMENTED — 2026-08-21" but a precise audit reveals it was **partially implemented**. CR-82 has **not been started**.

### CR-81 — What was done in the Aug 21 session

| Item | Status | Measured |
|------|--------|---------|
| `banner.webp` created | ✅ Done | 37.9 KB (was 304 KB PNG, −88%) |
| All 8 TrustBand logos → `.webp` in `content.js` | ✅ Done | e.g. bamboo-yoga: 9.1 KB (was 76.5 KB PNG, −88%) |
| All VSP trust logos → `.webp` in `vsp.js` | ✅ Done | |
| `Hero.jsx` fallback → `banner.webp` | ✅ Done | |
| feature1–5.webp created (future-proofing) | ✅ Done | |
| `loading="lazy"` on TrustBand marquee logos | ❌ **NOT done** | Still missing from `TrustBand.jsx` |
| Testimonial avatars → WebP | ❌ **NOT done** | `palmforest.png` (31 KB) + `lovebites.png` (44 KB) still PNG |

### CR-82 — Current state of all 5 files

None of the 5 files have `width` or `height` attributes on their `<img>` tags. Confirmed by direct inspection:
```
TrustBand.jsx line 48:     <img src={logo.img} alt={logo.name} className="h-16 w-auto ...">
ProofSection.jsx line 46:  <img src={t.img} alt={t.client} className="w-10 h-10 ...">
SuccessStories.jsx line 81:<img src={t.img} alt={t.client} className="w-10 h-10 ...">
Blog.jsx line 83:          <img src={feature.image} alt={feature.heading} className="w-full h-full ...">
Blog.jsx line 101:         <img src={p.image} alt={p.heading} loading="lazy" className="w-full h-full ...">
BlogPost.jsx line 73:      <img src={post.image} alt={post.heading} className="w-full rounded-[2rem] ...">
BlogPost.jsx line 99:      <img src={p.image} alt={p.heading} loading="lazy" className="w-full h-full ...">
```

---

## 2. What Lighthouse Is Flagging Right Now

| Audit | Savings | Root Cause |
|-------|---------|-----------|
| "Serve images in next-gen formats — 62 KiB" 🟡 | 62 KiB | `palmforest.png` (31 KB) + `lovebites.png` (44 KB) used as testimonial avatars in ProofSection — still PNG |
| "Properly size images — 108 KiB" 🟡 | 108 KiB | TrustBand logos served at full asset size but displayed at `h-16` (64px) — no `width`/`height` = browser can't know intrinsic vs display size |
| "Image elements do not have explicit width and height" 🟡 | — | All 7 `<img>` tags in the 5 listed files lack `width`/`height` attributes |
| "Avoid large layout shifts — 3 layout shifts found" ⚪ | — | Informational. Images without reserved space can shift layout when loading |

> Note: Blog images in `/public/blog/` are massive (up to 1 MB each) but those are on the `/blog` page, not the homepage. They do not affect the homepage POC.

---

## 3. CR-81 — Remaining Work (What's Actually Left)

### Remaining item A — `loading="lazy"` on TrustBand logos (1 line change)

**File:** `src/components/home/TrustBand.jsx` line 48

**Current:**
```jsx
<img
  key={i}
  src={logo.img}
  alt={logo.name}
  title={logo.name}
  className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
/>
```

**Change needed:**
```jsx
<img
  key={i}
  src={logo.img}
  alt={logo.name}
  title={logo.name}
  loading="lazy"
  className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
/>
```

**Why this matters:** TrustBand is below fold on mobile. Currently all 8 logos (×2 for marquee loop = 16 img tags) load eagerly. With `loading="lazy"`, they load only when the section approaches the viewport. At 5–14 KB each, this saves 50–120 KB of initial network usage, freeing bandwidth for above-fold content.

**Why this was not done in Aug 21:** The original CR-81 plan listed it but the FeatureVideo lazy-load was skipped as a no-op (null poster). TrustBand lazy-loading appears to have been missed.

---

### Remaining item B — Convert testimonial avatar PNGs to WebP

**Files to change:** `src/data/content.js` lines 99–100

**Current:**
```js
{ ..., client: "Palm Forest Resort", img: "/brand/palmforest.png" }  // 31 KB
{ ..., client: "Love Bites",         img: "/brand/lovebites.png"  }  // 44 KB
```

**Change needed:**
1. Generate `palmforest.webp` and `lovebites.webp` from the existing PNGs (these are separate from `palm-forest.webp` and `love-bites.webp` which are the trust logos — different files, no hyphen)
2. Update `content.js` lines 99–100 to `.webp`

```bash
cwebp -q 82 /app/frontend/public/brand/palmforest.png -o /app/frontend/public/brand/palmforest.webp
cwebp -q 82 /app/frontend/public/brand/lovebites.png  -o /app/frontend/public/brand/lovebites.webp
```

**Expected size reduction:**
- `palmforest.png` (31 KB) → `palmforest.webp` (~8–10 KB, −70%)
- `lovebites.png` (44 KB) → `lovebites.webp` (~5–8 KB, −85%)
- Total savings: ~57–62 KB — this eliminates the "Serve images in next-gen formats — 62 KiB" Lighthouse audit

---

## 4. CR-82 — Full Scope (all 5 files, 7 img tags)

### Why width/height matters (the mechanism)

When a browser loads a page and finds an `<img>` tag with no `width` or `height`:
1. It doesn't know how much space to reserve for the image
2. It allocates zero space initially
3. When the image downloads and its dimensions are known, it pushes other content down
4. This creates a **layout shift** — measured as CLS

With explicit `width` and `height`:
1. Browser calculates the **aspect ratio** from them (even if CSS overrides the actual display size)
2. Reserves the correct space before the image loads
3. Content below the image doesn't shift when the image arrives
4. CLS = 0 for those elements

**Important:** The CSS classes (`h-16 w-auto`, `w-10 h-10`) still control the actual displayed size. The HTML `width`/`height` attributes only establish the aspect ratio for space reservation. They don't override CSS.

### File-by-file changes

**1. `src/components/home/TrustBand.jsx` (line 48–54)**

Add: `width={160} height={64}` + `loading="lazy"` (overlap with CR-81)

Rationale:
- `h-16` = 64px height in Tailwind → `height={64}`
- `w-auto` means width scales proportionally → `width={160}` sets a reasonable aspect ratio (2.5:1 for typical logo)
- These are below-fold marquee logos — lazy loading is correct

**2. `src/components/home/ProofSection.jsx` (line 46)**

Add: `width={40} height={40}` + `loading="lazy"`

Rationale:
- `w-10 h-10` = 40×40px in Tailwind → `width={40} height={40}` (square)
- ProofSection is below fold (lazy-loaded section via CR-115)
- Avatars are 40×40 rounded circles

**3. `src/pages/SuccessStories.jsx` (line 81)**

Add: `width={40} height={40}` + `loading="lazy"`

Rationale: Same as ProofSection — identical `w-10 h-10` usage, testimonial client photos

**4. `src/pages/Blog.jsx` (lines 83, 101)**

Line 83 (featured blog image):
- Add: `width={800} height={500}`
- Blog featured image fills `w-full h-full` container — 800×500 is standard 16:10 blog image aspect ratio
- No `loading="lazy"` here — featured image is near top of blog page (above fold)

Line 101 (blog grid images):
- Already has `loading="lazy"` ✅
- Add: `width={400} height={250}` — smaller grid images, same 16:10 ratio

**5. `src/pages/BlogPost.jsx` (lines 73, 99)**

Line 73 (blog post hero image):
- Add: `width={1200} height={630}` — standard OG image ratio (1.91:1)
- No `loading="lazy"` — this is the hero image, above fold on blog post

Line 99 (related posts grid):
- Already has `loading="lazy"` ✅
- Add: `width={400} height={250}`

---

## 5. Impact Prediction

### 5a. Lighthouse audits that will be cleared

| Audit | Before | After CR-81 finish + CR-82 |
|-------|--------|--------------------------|
| "Serve images in next-gen formats" | 62 KiB savings flagged | **~0 KiB** (testimonial WebP done) |
| "Properly size images" | 108 KiB savings flagged | **Reduced** (width/height = browser knows ratio) |
| "Image elements do not have explicit width and height" | Flagged 🟡 | **Passes** ✅ |

### 5b. CLS improvement

Current CLS: ~0 (passing). After CR-82:
- TrustBand logos with reserved space → no layout shift when logos load
- Testimonial avatars reserved → no shift in ProofSection / SuccessStories
- Blog images reserved → no shift on blog page
- Expected CLS: stays 0, now **robust against network variance** (previously could shift if images load slowly on bad connections)

### 5c. Performance score improvement (homepage)

| Metric | Current | After both CRs |
|--------|---------|---------------|
| CLS | ~0 ✅ | ~0 ✅ (more robust) |
| FCP | ~2.4s | ~2.4s (unchanged — above-fold unaffected) |
| LCP | ~2.8s | ~2.8s (hero image unchanged) |
| TBT | ~220ms | ~215ms (slight improvement from less eager image loading) |
| **Performance** | **76** | **~77–79** |

The score improvement is **modest (+1–3 pts)** on the homepage because:
- CLS is already 0 → fixing the defensive risk doesn't add points
- FCP/LCP are not image-driven (fonts + HTML are the bottleneck) → fixing below-fold images doesn't help above-fold metrics
- The main gain is on **other pages** (blog, success stories) where images affect their own LCP

### 5d. Per-page impact

| Page | Benefit |
|------|---------|
| Homepage `/` | TrustBand eager→lazy (saves ~120 KB initial load), CLS hardened |
| `/success-stories` | Client avatars reserved + WebP, CLS elimination |
| `/blog` | Featured image reserved, blog grid dimensions, large PNG → WebP (62 KiB per post) |
| `/blog/*` | Blog post hero reserved, related posts reserved |

---

## 6. Scope of Changes

### CR-81 remaining

| File | Change | Lines |
|------|--------|-------|
| `public/brand/palmforest.webp` | NEW (convert from PNG, ~8 KB) | Binary |
| `public/brand/lovebites.webp` | NEW (convert from PNG, ~6 KB) | Binary |
| `src/data/content.js` | Lines 99–100: `.png` → `.webp` for 2 testimonial avatars | 2 lines |
| `src/components/home/TrustBand.jsx` | Line 48: add `loading="lazy"` | 1 line |

### CR-82

| File | Change | Lines |
|------|--------|-------|
| `src/components/home/TrustBand.jsx` | Add `width={160} height={64}` | +1 line |
| `src/components/home/ProofSection.jsx` | Add `width={40} height={40}` + `loading="lazy"` | +2 lines |
| `src/pages/SuccessStories.jsx` | Add `width={40} height={40}` + `loading="lazy"` | +2 lines |
| `src/pages/Blog.jsx` | Add `width={800} height={500}` (line 83) + `width={400} height={250}` (line 101) | +2 lines |
| `src/pages/BlogPost.jsx` | Add `width={1200} height={630}` (line 73) + `width={400} height={250}` (line 99) | +2 lines |

**Total changes: 4 new binary files + 10 lines of JSX changes**

---

## 7. Impact on Fixed CRs — Risk Assessment

The user specifically asked: *"ensure this doesn't impact any of our fixed CRs."*

| Fixed CR | Files it changed | Files CR-81/82 changes | Conflict? |
|----------|-----------------|----------------------|-----------|
| CR-114 (Clash Display fonts) | `index.html`, `public/fonts/` | None of these | ✅ None |
| Hero preload | `prerender.js`, `build/index.html` | None of these | ✅ None |
| CR-117 (prerender cleanup) | `prerender.js` | None of these | ✅ None |
| CR-115 (React.lazy, PostHog) | `Home.jsx`, `Hero.jsx`, `Reveal.jsx`, `index.html` | None of these | ✅ None |
| CR-118 (Poppins fonts) | `index.html`, `public/fonts/`, `index.css` | None of these | ✅ None |

**TrustBand.jsx** — used in Home.jsx which CR-115 modified. CR-115 changed Home.jsx imports (made sections lazy), not TrustBand.jsx itself. TrustBand is kept as a **static import** (not lazy) in CR-115 since it's at-fold. Adding `loading="lazy"` + `width`/`height` to TrustBand.jsx does not touch the lazy/static boundary in Home.jsx. ✅ No conflict.

**content.js** — Not touched by any previous CWV CR. Safe. ✅

---

## 8. Recommended Order of Implementation

CR-81 and CR-82 overlap on TrustBand.jsx (both need to add attributes to the same `<img>` tag). Implement together in one pass:

**Step 1:** Generate the 2 missing WebP files (cwebp command)
**Step 2:** Update `content.js` (2 lines)
**Step 3:** Update `TrustBand.jsx` (add `loading="lazy"` + `width` + `height` in one edit)
**Step 4:** Update `ProofSection.jsx` (add `width` + `height` + `loading="lazy"`)
**Step 5:** Update `SuccessStories.jsx` (identical change to ProofSection)
**Step 6:** Update `Blog.jsx` (2 img tags)
**Step 7:** Update `BlogPost.jsx` (2 img tags)
**Step 8:** yarn build + prerender + gates + testing agent

---

## 9. Definition of Done

- [ ] `palmforest.webp` and `lovebites.webp` created in `public/brand/`
- [ ] `content.js` TESTIMONIALS updated to `.webp`
- [ ] TrustBand.jsx img has `loading="lazy"` + `width={160}` + `height={64}`
- [ ] ProofSection.jsx img has `width={40}` + `height={40}` + `loading="lazy"`
- [ ] SuccessStories.jsx img has `width={40}` + `height={40}` + `loading="lazy"`
- [ ] Blog.jsx both img tags have explicit `width` + `height`
- [ ] BlogPost.jsx both img tags have explicit `width` + `height`
- [ ] Build + prerender + all structural gates pass
- [ ] Lighthouse "Image elements do not have explicit width and height" → passes
- [ ] CLS remains ≤ 0.1 (no regression)
- [ ] Testing agent confirms no visual regression
- [ ] No change to above-fold FCP/LCP (hero and fonts untouched)

---

*Impact analysis written 2026-08-23. No code changed.*
