# CR-120 — Line-by-Line Implementation Plan
## EditableImage width/height: Hero.jsx + Logo.jsx

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-120_ImpactAnalysis.md`

---

## 0. Prerequisite Checks

```bash
# A. Confirm 3 img tags without width/height in current prerendered HTML
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
imgs = re.findall(r'<img[^>]+>', html)
no_dims = [i for i in imgs if 'width=' not in i and 'height=' not in i]
print(f'Img tags without width/height: {len(no_dims)} (expected: 3)')
for i in no_dims: print(' ', i[:120])
"
# Expected: 3 tags — logo.svg, banner.webp, logo-light.svg

# B. Confirm Hero.jsx exact lines (lines 72-80)
sed -n '72,80p' /app/frontend/src/components/home/Hero.jsx
# Expected: EditableImage block with no width/height props

# C. Confirm Logo.jsx exact lines (lines 9-14)
sed -n '9,14p' /app/frontend/src/components/site/Logo.jsx
# Expected: EditableImage block with no width/height props
```

---

## The Two Changes

Both changes add exactly 2 props to an existing `EditableImage` call.
`Editable.jsx` is **not touched** — `{...rest}` already passes new props through.

---

## Change A — `src/components/home/Hero.jsx` (lines 72–80)

**Current (lines 72–80):**
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

**Replace with:**
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

**Lines changed:** Insert `width={776}` and `height={637}` after line 77 (`className=...`), before `fetchPriority`.

**Why `width={776} height={637}`:**
- `banner.webp` measured intrinsic dimensions: exactly **776×637 pixels** (read from file header)
- These are the TRUE source dimensions — most accurate for aspect ratio computation
- `height={637}` does NOT override the CSS `h-[420px]`. CSS takes full precedence. The HTML attributes only tell the browser the aspect ratio (776/637 = 1.218:1) so it can reserve the correct space before the image loads
- When CSS renders at `h-[420px]`: browser computes width = 420 × (776/637) = 511px (for `object-contain`, the image fits within the container maintaining this ratio)

**Why these are inserted AFTER `className` and BEFORE `fetchPriority`:**
Order of props does not matter functionally in React/JSX — it's just readability convention to keep visual props together (`className`, `width`, `height`) before behaviour props (`fetchPriority`, `loading`).

**What does NOT change:**
- `block`, `id`, `fallback`, `alt` — all untouched
- `className="w-full h-[420px] object-contain"` — untouched, still controls display
- `fetchPriority="high"` — untouched (keeps LCP priority)
- `loading="eager"` — untouched

---

## Change B — `src/components/site/Logo.jsx` (lines 9–14)

**Current (lines 9–14):**
```jsx
      <EditableImage
        id={light ? "brand.logo_light_image" : "brand.logo_image"}
        fallback={light ? "/brand/logo-light.svg" : "/brand/logo.svg"}
        alt="MyGenie POS"
        className="h-8 w-auto"
      />
```

**Replace with:**
```jsx
      <EditableImage
        id={light ? "brand.logo_light_image" : "brand.logo_image"}
        fallback={light ? "/brand/logo-light.svg" : "/brand/logo.svg"}
        alt="MyGenie POS"
        className="h-8 w-auto"
        width={156}
        height={82}
      />
```

**Lines changed:** Insert `width={156}` and `height={82}` after line 13 (`className=...`), before the closing `/>`.

**Why `width={156} height={82}`:**
- `logo.svg` viewBox measured: `"0 0 156.065 82"` → rounded to `width={156} height={82}`
- This gives the exact aspect ratio of the MyGenie logo (156/82 = 1.90:1)
- `logo-light.svg` has the SAME viewBox dimensions — confirmed. Both the light and dark logos share the same proportions, so one set of attributes works for both variants (the component renders one or the other based on the `light` prop)
- CSS `h-8 w-auto` renders at 32px height, auto width. The browser computes: 32px × (156/82) ≈ 61px wide — correct
- `width={156}` does NOT mean the logo renders at 156px. CSS `h-8 w-auto` fully controls display size

**What does NOT change:**
- The `light` prop logic — untouched
- `id`, `fallback`, `alt`, `className` — all untouched

**Why fixing Logo.jsx fixes BOTH logo img tags in the prerendered HTML:**
Logo.jsx renders one `<EditableImage>` per call, but it's called twice by the Navbar (once for the light/dark logo in the desktop nav, once for the mobile nav drawer). Both calls go through the same Logo.jsx component, so one change to Logo.jsx fixes both rendered `<img>` tags.

---

## Execution Pipeline

### Step 1 — Build
```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors
```

### Step 2 — Prerender
```bash
cd /app/frontend && node scripts/prerender.js 2>&1
# Expected: prerendered / -> /app/frontend/build/index.html
```

### Step 3 — Verify: 0 img tags without width/height
```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
imgs = re.findall(r'<img[^>]+>', html)
no_dims = [i for i in imgs if 'width=' not in i and 'height=' not in i]
print(f'Img tags without dims: {len(no_dims)}')
if no_dims:
    for i in no_dims: print(' ', i[:150])
else:
    print('PASS: all img tags have explicit dimensions')
"
# Expected: "Img tags without dims: 0"
# (Was: 3 before this CR)
```

### Step 4 — Verify: Hero and Logo have correct attrs in prerendered HTML
```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()

hero = re.findall(r'<img[^>]*banner\.webp[^>]*>', html)
print('Hero img:', hero[0][:200] if hero else 'NOT FOUND')

logos = re.findall(r'<img[^>]*logo[^>]*>', html)
for l in logos: print('Logo img:', l[:120])
"
# Expected:
# Hero img: <img ... width="776" height="637" ...>
# Logo img: <img ... width="156" height="82" ...> (×2)
```

### Step 5 — Structural gates
```bash
python3 << 'PYEOF'
import re, os

html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)

styles    = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
noscripts = re.findall(r'<noscript>', head)
canonicals= re.findall(r'<link[^>]*canonical[^>]*>', html)
img_pre   = [l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]
font_pre  = [l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]
all_imgs  = re.findall(r'<img[^>]+>', html)
no_dims   = [i for i in all_imgs if 'width=' not in i and 'height=' not in i]

g = {
    "G1  style blocks == 2":          len(styles) == 2,
    "G2  noscript in head == 0":      len(noscripts) == 0,
    "G3  canonical == 1":             len(canonicals) == 1,
    "G4  image preload == 1":         len(img_pre) == 1,
    "G5  font preloads == 3":         len(font_pre) == 3,
    "G6  no googleapis":              'googleapis' not in html,
    "G7  hero text present":          'boosts profit by up to' in html,
    "G8  no fontshare":               'fontshare' not in html,
    "G9  img tags without dims == 0": len(no_dims) == 0,
    "G10 hero has width=776":         'width="776"' in html or "width={776}" in html,
}
for k, v in g.items():
    print(f"{'PASS' if v else 'FAIL'} {k}")
print()
print("ALL PASS" if all(g.values()) else "FAILURES PRESENT")
PYEOF
```

### Step 6 — Screenshot
Verify hero image and navbar logo still render correctly at correct visual sizes.

### Step 7 — Testing agent (mandatory)

---

## Rollback

```bash
cd /app/frontend
git checkout src/components/home/Hero.jsx
git checkout src/components/site/Logo.jsx
yarn build && node scripts/prerender.js
```

---

## File Change Summary

| File | Change | Lines |
|------|--------|-------|
| `src/components/home/Hero.jsx` | Add `width={776}` and `height={637}` after `className`, before `fetchPriority` (lines 72–80) | +2 lines |
| `src/components/site/Logo.jsx` | Add `width={156}` and `height={82}` after `className`, before closing `/>` (lines 9–14) | +2 lines |
| `src/components/cms/Editable.jsx` | **No change** — `{...rest}` passes props automatically |
| All other files | **Untouched** |

**Total: 2 files, 4 new lines**

---

## Definition of Done

- [ ] `Hero.jsx` EditableImage has `width={776}` `height={637}`
- [ ] `Logo.jsx` EditableImage has `width={156}` `height={82}`
- [ ] `build/index.html` has 0 img tags without explicit width/height (was 3)
- [ ] Hero img in prerendered HTML has `width="776"` attribute
- [ ] Logo imgs in prerendered HTML both have `width="156"` attribute
- [ ] All 10 structural gates pass
- [ ] Hero renders at `h-[420px]` visually (CSS still controls, width/height don't override)
- [ ] Logo renders at `h-8` visually
- [ ] Testing agent: no visual regression

---

*Plan written 2026-08-23. No code changed. Ready for implementation on approval.*
