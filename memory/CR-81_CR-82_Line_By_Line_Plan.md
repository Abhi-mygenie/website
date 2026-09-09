# CR-81 + CR-82 — Line-by-Line Implementation Plan
## Image Completion: WebP + loading=lazy + Explicit Dimensions

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-81_CR-82_CombinedImpactAnalysis.md`

---

## 0. Prerequisite Checks

```bash
# A. cwebp is installed
which cwebp
# Expected: /usr/bin/cwebp ✅ (confirmed installed)

# B. Source PNGs exist
ls -lh /app/frontend/public/brand/palmforest.png /app/frontend/public/brand/lovebites.png
# Expected: palmforest.png 44KB, lovebites.png 31KB

# C. No webp versions yet
ls /app/frontend/public/brand/palmforest.webp /app/frontend/public/brand/lovebites.webp 2>/dev/null && echo "EXIST" || echo "MISSING — correct"
# Expected: MISSING — correct

# D. supervisor still in static-server mode
grep "command=" /etc/supervisor/conf.d/supervisord.conf | grep frontend
# Expected: command=/usr/bin/node .../static-server.js
```

---

## Step 1 — Generate 2 WebP Files (CR-81 remaining item B)

```bash
cwebp -q 82 /app/frontend/public/brand/palmforest.png \
  -o /app/frontend/public/brand/palmforest.webp
cwebp -q 82 /app/frontend/public/brand/lovebites.png  \
  -o /app/frontend/public/brand/lovebites.webp
```

**Expected output sizes:**
- `palmforest.webp`: ~7–10 KB (from 31 KB PNG, ~70% reduction)
- `lovebites.webp`: ~5–8 KB (from 44 KB PNG, ~85% reduction)

**Verification:**
```bash
python3 -c "
for f in ['palmforest', 'lovebites']:
    with open(f'/app/frontend/public/brand/{f}.webp', 'rb') as fp: h = fp.read(4)
    print(f'{f}.webp:', 'VALID' if h == b'wOF2' or h[:4] == b'RIFF' else 'CHECK MANUALLY')
"
# WebP files start with RIFF (not wOF2 which is for woff2 fonts)
```

**Note:** `palmforest.webp` and `lovebites.webp` are testimonial **avatar photos** — completely separate files from `palm-forest.webp` (trust logo) and `love-bites.webp` (trust logo). No naming conflict.

---

## Step 2 — `src/data/content.js` (CR-81 remaining)

**File:** `/app/frontend/src/data/content.js`
**Change:** 2 lines in the TESTIMONIALS array

### 2-A. Line 99 — palmforest testimonial

**Current (line 99):**
```js
  { metric: "30%", headline: "faster room service, 2x tips", quote: "MyGenie synced waitstaff and kitchen in real time. Orders are fulfilled 30% faster, upsell improved, and guest tips nearly doubled.", client: "Palm Forest Resort", sector: "Hotel / Resort", img: "/brand/palmforest.png" },
```

**Change:** `img: "/brand/palmforest.png"` → `img: "/brand/palmforest.webp"`

Only the `img` value at the end of the line changes. Everything else identical.

---

### 2-B. Line 100 — lovebites testimonial

**Current (line 100):**
```js
  { metric: "40%", headline: "lower fixed cost on 3 devices", quote: "We run the entire shack on just 3 mobile devices. No front desk, no printers. Table turnaround improved 25% and monthly cost dropped 40%.", client: "Love Bites", sector: "Café", img: "/brand/lovebites.png" },
```

**Change:** `img: "/brand/lovebites.png"` → `img: "/brand/lovebites.webp"`

---

## Step 3 — `src/components/home/TrustBand.jsx` (CR-81 + CR-82 combined)

**File:** `/app/frontend/src/components/home/TrustBand.jsx`
**Location:** Lines 48–54 (the `<img>` tag inside the marquee render function)
**Change:** Add 3 attributes: `loading="lazy"`, `width={160}`, `height={64}`

### Current (lines 48–54):
```jsx
                    <img
                      key={i}
                      src={logo.img}
                      alt={logo.name}
                      title={logo.name}
                      className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                    />
```

### Replace with:
```jsx
                    <img
                      key={i}
                      src={logo.img}
                      alt={logo.name}
                      title={logo.name}
                      width={160}
                      height={64}
                      loading="lazy"
                      className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                    />
```

**Lines changed:** 54 (before `className`) — insert `width={160}`, `height={64}`, `loading="lazy"` as new lines.

**Why these values:**
- `height={64}`: Tailwind `h-16` = 4rem = 64px. Exact match.
- `width={160}`: Logo aspect ratio ≈ 2.5:1 (wide logos). 64 × 2.5 = 160. Browser uses this to compute aspect ratio only; actual width is `w-auto` (controlled by CSS).
- `loading="lazy"`: TrustBand is below the fold. 8 logos × 2 (marquee loop) = 16 img tags. All deferred until section enters viewport.

**Why this is safe:** `className="h-16 w-auto"` still fully controls the displayed size. `width` and `height` only establish the **aspect ratio** so the browser can reserve space. The CSS overrides the dimensions as it always has.

---

## Step 4 — `src/components/home/ProofSection.jsx` (CR-82)

**File:** `/app/frontend/src/components/home/ProofSection.jsx`
**Location:** Line 46 — testimonial avatar `<img>` inside the conditional render

### Current (line 46):
```jsx
                          <img src={t.img} alt={t.client} className="w-10 h-10 rounded-full object-cover border border-brand-line" />
```

### Replace with:
```jsx
                          <img src={t.img} alt={t.client} width={40} height={40} loading="lazy" className="w-10 h-10 rounded-full object-cover border border-brand-line" />
```

**Why these values:**
- `width={40} height={40}`: Tailwind `w-10 h-10` = 2.5rem = 40px. Exact match. Square avatar.
- `loading="lazy"`: ProofSection is a React.lazy-loaded section (below fold). The images inside also warrant lazy loading.

**What does NOT change:** The conditional `{t.img ? ... : <span>initials</span>}` wrapper stays exactly as-is. Only the `<img>` tag gains attributes.

---

## Step 5 — `src/pages/SuccessStories.jsx` (CR-82)

**File:** `/app/frontend/src/pages/SuccessStories.jsx`
**Location:** Line 81 — identical pattern to ProofSection.jsx

### Current (line 81):
```jsx
                          <img src={t.img} alt={t.client} className="w-10 h-10 rounded-full object-cover border border-brand-line" />
```

### Replace with:
```jsx
                          <img src={t.img} alt={t.client} width={40} height={40} loading="lazy" className="w-10 h-10 rounded-full object-cover border border-brand-line" />
```

Identical change to Step 4 — same Tailwind classes, same dimensions, same reason.

---

## Step 6 — `src/pages/Blog.jsx` (CR-82 — 2 img tags)

**File:** `/app/frontend/src/pages/Blog.jsx`

### 6-A. Line 83 — Featured blog image (above fold on blog page)

**Current (line 83):**
```jsx
                        {feature.image && <img src={feature.image} alt={feature.heading} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />}
```

**Replace with:**
```jsx
                        {feature.image && <img src={feature.image} alt={feature.heading} width={800} height={500} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />}
```

**Why these values:**
- Container is `aspect-[16/10]` (see Blog.jsx line 82: `className="aspect-[16/10] overflow-hidden"`). Ratio = 1.6:1.
- 800 × 500 = exactly 16:10 ratio. Matches the container's forced aspect ratio perfectly.
- No `loading="lazy"` — this is the featured (first/largest) blog image, typically visible on initial page load. Lazy would delay it unnecessarily.

**Why not loading="lazy":** The featured post is at the top of the blog page. Lighthouse would flag it as an LCP candidate. Lazy loading it would push LCP higher. Keep it eager.

---

### 6-B. Line 101 — Blog grid card images (below fold on blog page)

**Current (line 101):**
```jsx
                          {p.image && <img src={p.image} alt={p.heading} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />}
```

**Replace with:**
```jsx
                          {p.image && <img src={p.image} alt={p.heading} width={400} height={250} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />}
```

**Why these values:**
- Container is also `aspect-[16/10]` (Blog.jsx line 100). Same ratio.
- 400 × 250 = 16:10. Matches the container.
- `loading="lazy"` already present ✅ — kept as-is.

---

## Step 7 — `src/pages/BlogPost.jsx` (CR-82 — 2 img tags)

**File:** `/app/frontend/src/pages/BlogPost.jsx`

### 7-A. Line 73 — Blog post hero image (above fold on blog post page)

**Current (line 73):**
```jsx
            {post.image && <img src={post.image} alt={post.heading || post.title} className="w-full rounded-[2rem] mt-8 border border-brand-line" />}
```

**Replace with:**
```jsx
            {post.image && <img src={post.image} alt={post.heading || post.title} width={1200} height={630} className="w-full rounded-[2rem] mt-8 border border-brand-line" />}
```

**Why these values:**
- Blog post hero images are the OG image asset — standard 1.91:1 ratio (Open Graph spec).
- 1200 × 630 = 1.905:1. Matches the source files (all blog images in `/public/blog/` are OG-sized).
- No `loading="lazy"` — this is the LCP element on a blog post page. Must be eager.

---

### 7-B. Line 99 — Related posts grid images (below fold)

**Current (line 99):**
```jsx
                    {p.image && <img src={p.image} alt={p.heading} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />}
```

**Replace with:**
```jsx
                    {p.image && <img src={p.image} alt={p.heading} width={400} height={250} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />}
```

**Why these values:** Related posts use `aspect-[16/10]` container (same as Blog.jsx grid). 400×250 = 16:10. `loading="lazy"` already present ✅.

---

## Execution Pipeline

After all 9 edits (Steps 1–7), run in this order:

### E-1. Build
```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors
```

### E-2. Prerender
```bash
cd /app/frontend && node scripts/prerender.js 2>&1
# Expected: prerendered / -> /app/frontend/build/index.html
```

### E-3. Structural gates (all must pass)
```bash
python3 << 'PYEOF'
import re, os

html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)

styles     = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
noscripts  = re.findall(r'<noscript>', head)
canonicals = re.findall(r'<link[^>]*canonical[^>]*>', html)
img_pre    = [l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]
font_pre   = [l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]
googleapis = re.findall(r'googleapis', html)

g = {
    "G1  style blocks == 2":        len(styles) == 2,
    "G2  noscript in head == 0":    len(noscripts) == 0,
    "G3  canonical == 1":           len(canonicals) == 1,
    "G4  image preload == 1":       len(img_pre) == 1,
    "G5  font preloads == 3":       len(font_pre) == 3,
    "G6  no googleapis":            len(googleapis) == 0,
    "G7  hero text present":        'boosts profit by up to' in html,
    "G8  no fontshare":             'fontshare' not in html,
    "G9  palmforest webp in build": os.path.exists('/app/frontend/build/brand/palmforest.webp'),
    "G10 lovebites webp in build":  os.path.exists('/app/frontend/build/brand/lovebites.webp'),
}
for k, v in g.items():
    print(f"{'PASS' if v else 'FAIL'} {k}")
print()
print("ALL PASS" if all(g.values()) else "FAILURES PRESENT")
PYEOF
```

### E-4. Screenshot
Verify homepage renders correctly: hero visible, TrustBand logos visible, no broken images.

### E-5. Testing agent (mandatory)

---

## Rollback Plan

All changes are in tracked source files:

```bash
cd /app/frontend
git checkout src/data/content.js
git checkout src/components/home/TrustBand.jsx
git checkout src/components/home/ProofSection.jsx
git checkout src/pages/SuccessStories.jsx
git checkout src/pages/Blog.jsx
git checkout src/pages/BlogPost.jsx
# webp files: leave them (harmless), or remove:
rm /app/frontend/public/brand/palmforest.webp /app/frontend/public/brand/lovebites.webp
yarn build && node scripts/prerender.js
```

---

## Complete File Change Summary

| Step | File | Change | Lines |
|------|------|--------|-------|
| 1 | `public/brand/palmforest.webp` | **CREATE** via cwebp (~8 KB) | New binary |
| 1 | `public/brand/lovebites.webp` | **CREATE** via cwebp (~6 KB) | New binary |
| 2 | `src/data/content.js` | Lines 99–100: `.png` → `.webp` (2 values) | 2 lines |
| 3 | `src/components/home/TrustBand.jsx` | Line 48–54: add `width={160}` `height={64}` `loading="lazy"` | +3 attrs |
| 4 | `src/components/home/ProofSection.jsx` | Line 46: add `width={40}` `height={40}` `loading="lazy"` | +3 attrs |
| 5 | `src/pages/SuccessStories.jsx` | Line 81: add `width={40}` `height={40}` `loading="lazy"` | +3 attrs |
| 6A | `src/pages/Blog.jsx` | Line 83: add `width={800}` `height={500}` | +2 attrs |
| 6B | `src/pages/Blog.jsx` | Line 101: add `width={400}` `height={250}` | +2 attrs |
| 7A | `src/pages/BlogPost.jsx` | Line 73: add `width={1200}` `height={630}` | +2 attrs |
| 7B | `src/pages/BlogPost.jsx` | Line 99: add `width={400}` `height={250}` | +2 attrs |
| **Total** | **6 source files + 2 binary** | | **~21 attribute additions** |

---

## Definition of Done

- [ ] `palmforest.webp` and `lovebites.webp` exist in `public/brand/` and are valid WebP
- [ ] `content.js` lines 99–100 use `.webp` paths
- [ ] TrustBand.jsx img has `width={160}` `height={64}` `loading="lazy"`
- [ ] ProofSection.jsx img has `width={40}` `height={40}` `loading="lazy"`
- [ ] SuccessStories.jsx img has `width={40}` `height={40}` `loading="lazy"`
- [ ] Blog.jsx line 83: `width={800}` `height={500}` present (no loading=lazy)
- [ ] Blog.jsx line 101: `width={400}` `height={250}` present (loading=lazy already there)
- [ ] BlogPost.jsx line 73: `width={1200}` `height={630}` present (no loading=lazy)
- [ ] BlogPost.jsx line 99: `width={400}` `height={250}` present (loading=lazy already there)
- [ ] All 10 structural gates pass (G1–G10)
- [ ] Homepage screenshot: TrustBand logos render, no broken images
- [ ] Lighthouse "Image elements do not have explicit width and height" → passes
- [ ] CLS ≤ 0.1 (no regression)
- [ ] Testing agent confirms no visual/functional regression
- [ ] CR-81 and CR-82 statuses updated: OPEN → FIXED

---

*Line-by-line plan written 2026-08-23. No code changed. Ready for implementation on approval.*
