# CR-81 — Line-by-Line Implementation Plan: WebP Image Conversion
**Written:** 2026-08-21  
**Impact analysis:** CR-81 session 2026-08-21 (scope revised)  
**Files changed:** Shell (asset conversion) + 4 code files  
**Execution order:** Step 0 → Step 1 → Steps 2–5 (Steps 2–5 can be parallel after Step 1)  
**Estimated time:** ~30 min (incl. conversion)

---

## Pre-flight

- [ ] `sudo supervisorctl status` — both services running
- [ ] Note current homepage trust band as baseline (logos visible as PNGs)
- [ ] Note current Petpooja page trust strip as baseline
- [ ] Note current /demo page trust strip as baseline

---

## STEP 0 — Install cwebp

**Run first. Nothing else works without this.**

```bash
apt-get install -y webp
which cwebp   # confirm: /usr/bin/cwebp
```

**Checkpoint:**
- [ ] `which cwebp` returns a path
- [ ] `cwebp --version` shows version number

---

## STEP 1 — Convert all PNG assets to WebP

**Run after Step 0. All asset work before any code changes.**

### 1a — banner.png (LCP image — most important)
```bash
cwebp -q 82 /app/frontend/public/brand/banner.png -o /app/frontend/public/brand/banner.webp
```
**Target:** ≤ 80 KB (from 305 KB PNG)

### 1b — Trust logo PNGs (11 unique files used across 3 pages)
```bash
for f in hyatt-centric palm-forest love-bites mill-bakery bamboo-yoga baba-italy wild-berry drishti-yoga ubuntu terra lafetta; do
  cwebp -q 82 /app/frontend/public/brand/${f}.png -o /app/frontend/public/brand/${f}.webp
  echo "Converted: ${f}.png → ${f}.webp"
done
```

**Why 11:** The 3 trust sources across 3 pages share logos — combined unique set is:
- Homepage (content.js): hyatt-centric, palm-forest, bamboo-yoga, baba-italy, love-bites, mill-bakery, wild-berry, drishti-yoga
- Petpooja (vsp.js): + ubuntu, terra, lafetta (3 additional not in homepage)
- Demo (DemoLanding.jsx): all 5 already covered by the above

### 1c — Feature images (future-proofing — no code change needed)
```bash
for f in feature1 feature2 feature3 feature4 feature5; do
  cwebp -q 82 /app/frontend/public/brand/${f}.png -o /app/frontend/public/brand/${f}.webp
  echo "Converted: ${f}.png → ${f}.webp"
done
```

**Checkpoint after Step 1:**
```bash
# Verify all WebP files exist
ls -lh /app/frontend/public/brand/banner.webp
ls -lh /app/frontend/public/brand/hyatt-centric.webp
ls -lh /app/frontend/public/brand/ubuntu.webp
# Verify banner.webp size target
du -sh /app/frontend/public/brand/banner.webp  # should be ≤ 80 KB
```
- [ ] `banner.webp` exists and is ≤ 80 KB
- [ ] All 11 trust logo `.webp` files exist
- [ ] All 5 `feature*.webp` files exist
- [ ] Original `.png` files still present (do NOT delete — OG images + fallback still use them)

**Note:** Original PNG files are kept. They are still needed for:
- `seo.js` DEFAULT_OG_IMAGE (social media OG tags)
- `BlogPost.jsx` OG fallback
- Browser fallback (though all modern browsers support WebP)

---

## STEP 2 — `Hero.jsx`: Update banner fallback (line 81)

**File:** `frontend/src/components/home/Hero.jsx`

**Before (exact, line 81):**
```jsx
              fallback="/brand/banner.png"
```

**After:**
```jsx
              fallback="/brand/banner.webp"
```

**Why:** `EditableImage` with `fallback="/brand/banner.png"` renders the LCP image on the homepage. This is the single highest-impact change — 305 KB → ≤80 KB on every homepage load.

**What stays unchanged:**
- `seo.js` line 7: `DEFAULT_OG_IMAGE = ${SITE_URL}/brand/banner.png` — stays PNG (OG social sharing)
- `BlogPost.jsx` line 48: banner.png fallback — stays PNG (OG social sharing)
- `index.html` — no preload line (CR-71 Option B) — nothing to change

**Checkpoint:**
- Hot-reload fires
- Homepage hero image loads (may show broken if CMS override is active in preview — pre-existing issue per CR-71 Finding 9, unrelated to this change)
- DevTools Network tab: hero image request is for `.webp` not `.png`

**Rollback:** Revert `banner.webp` → `banner.png` on line 81.

---

## STEP 3 — `content.js`: Update TRUST_LOGOS (lines 11–18)

**File:** `frontend/src/data/content.js`

**Before (exact, lines 10–19):**
```js
export const TRUST_LOGOS = [
  { name: "Hyatt Centric", img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest", img: "/brand/palm-forest.png" },
  { name: "Bamboo Yoga", img: "/brand/bamboo-yoga.png" },
  { name: "Baba's Italy", img: "/brand/baba-italy.png" },
  { name: "Love Bites", img: "/brand/love-bites.png" },
  { name: "The Mill Bakery", img: "/brand/mill-bakery.png" },
  { name: "Wild Berry", img: "/brand/wild-berry.png" },
  { name: "Drishti Yoga", img: "/brand/drishti-yoga.png" },
];
```

**After:**
```js
export const TRUST_LOGOS = [
  { name: "Hyatt Centric", img: "/brand/hyatt-centric.webp" },
  { name: "Palm Forest", img: "/brand/palm-forest.webp" },
  { name: "Bamboo Yoga", img: "/brand/bamboo-yoga.webp" },
  { name: "Baba's Italy", img: "/brand/baba-italy.webp" },
  { name: "Love Bites", img: "/brand/love-bites.webp" },
  { name: "The Mill Bakery", img: "/brand/mill-bakery.webp" },
  { name: "Wild Berry", img: "/brand/wild-berry.webp" },
  { name: "Drishti Yoga", img: "/brand/drishti-yoga.webp" },
];
```

**8 string changes — `.png` → `.webp` on lines 11–18.**

**⚠️ Do NOT change lines 99–100** (`palmforest.png` and `lovebites.png` without hyphens — these are TESTIMONIAL client logos, separate files from the trust band logos).

**Checkpoint:**
- Hot-reload fires
- Homepage trust band marquee shows 8 logo images (may look identical visually — WebP renders same as PNG)
- DevTools Network: logo requests are `.webp`

**Rollback:** Revert all 8 paths from `.webp` back to `.png`.

---

## STEP 4 — `vsp.js`: Update VSP_TRUST_LOGOS (lines 133–140)

**File:** `frontend/src/data/vsp.js`

**Before (exact, lines 132–141):**
```js
export const VSP_TRUST_LOGOS = [
  { name: "Hyatt Centric",      img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest Resort", img: "/brand/palm-forest.png"   },
  { name: "Love Bites",         img: "/brand/love-bites.png"    },
  { name: "The Mill Bakery",    img: "/brand/mill-bakery.png"   },
  { name: "Bamboo Yoga",        img: "/brand/bamboo-yoga.png"   },
  { name: "Ubuntu Café",        img: "/brand/ubuntu.png"        },
  { name: "Terraria Café",      img: "/brand/terra.png"         },
  { name: "La Fetta Pizzeria",  img: "/brand/lafetta.png"       },
];
```

**After:**
```js
export const VSP_TRUST_LOGOS = [
  { name: "Hyatt Centric",      img: "/brand/hyatt-centric.webp" },
  { name: "Palm Forest Resort", img: "/brand/palm-forest.webp"   },
  { name: "Love Bites",         img: "/brand/love-bites.webp"    },
  { name: "The Mill Bakery",    img: "/brand/mill-bakery.webp"   },
  { name: "Bamboo Yoga",        img: "/brand/bamboo-yoga.webp"   },
  { name: "Ubuntu Café",        img: "/brand/ubuntu.webp"        },
  { name: "Terraria Café",      img: "/brand/terra.webp"         },
  { name: "La Fetta Pizzeria",  img: "/brand/lafetta.webp"       },
];
```

**8 string changes — `.png` → `.webp` on lines 133–140.**

**Checkpoint:**
- Hot-reload fires
- `/petpooja-alternative` trust strip (hero + CTA section) shows 8 logo images
- DevTools Network: logo requests are `.webp`

**Rollback:** Revert all 8 paths from `.webp` back to `.png`.

---

## STEP 5 — `DemoLanding.jsx`: Update DEMO_TRUST_LOGOS (lines 52–56)

**File:** `frontend/src/pages/DemoLanding.jsx`

**Before (exact, lines 51–57):**
```js
const DEMO_TRUST_LOGOS = [
  { name: "Hyatt Centric",      img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest Resort", img: "/brand/palm-forest.png"   },
  { name: "Love Bites",         img: "/brand/love-bites.png"    },
  { name: "The Mill Bakery",    img: "/brand/mill-bakery.png"   },
  { name: "Bamboo Yoga",        img: "/brand/bamboo-yoga.png"   },
];
```

**After:**
```js
const DEMO_TRUST_LOGOS = [
  { name: "Hyatt Centric",      img: "/brand/hyatt-centric.webp" },
  { name: "Palm Forest Resort", img: "/brand/palm-forest.webp"   },
  { name: "Love Bites",         img: "/brand/love-bites.webp"    },
  { name: "The Mill Bakery",    img: "/brand/mill-bakery.webp"   },
  { name: "Bamboo Yoga",        img: "/brand/bamboo-yoga.webp"   },
];
```

**5 string changes — `.png` → `.webp` on lines 52–56.**

**Checkpoint:**
- Hot-reload fires
- `/demo` page trust strip shows 5 logo images
- DevTools Network: logo requests are `.webp`

**Rollback:** Revert all 5 paths from `.webp` back to `.png`.

---

## Post-Implementation Validation Checklist

### Asset verification
- [ ] `ls /app/frontend/public/brand/banner.webp` — exists
- [ ] `du -sh /app/frontend/public/brand/banner.webp` — ≤ 80 KB (was 305 KB)
- [ ] `ls /app/frontend/public/brand/*.webp | wc -l` — at least 17 files (1 banner + 11 logos + 5 feature)
- [ ] Original PNG files still present: `ls /app/frontend/public/brand/banner.png` — still exists

### Homepage
- [ ] Trust band logos load (check Network tab for `.webp` requests)
- [ ] Hero image loads (`.webp` in Network tab, or CMS override still active — either is fine)
- [ ] No broken image icons

### /petpooja-alternative
- [ ] Hero trust strip: 4 logo images load as `.webp`
- [ ] CTA trust strip: 8 logo images load as `.webp`

### /demo
- [ ] Trust strip: 5 logo images load as `.webp`

### OG image unchanged
- [ ] View page source on `/` — `og:image` meta tag still points to `banner.png` (NOT .webp)
- [ ] `grep "DEFAULT_OG_IMAGE\|og:image" src/lib/seo.js` — still `.png`

### Build benchmark (optional but recommended)
```bash
cd /app/frontend && NODE_ENV=production yarn build 2>&1 | grep -E "kB|MB|banner"
```
The main bundle size won't change (images are not bundled). But the total transfer size for a page visit drops:
- Before: homepage hero = 305 KB PNG
- After: homepage hero ≤ 80 KB WebP = ~74% reduction on first load

---

## Execution Summary Table

| Step | Action | Type | Depends on |
|---|---|---|---|
| 0 | `apt-get install -y webp` | Shell | — |
| 1a | Convert `banner.png` → `banner.webp` | Shell | Step 0 |
| 1b | Convert 11 trust logos `.png` → `.webp` | Shell | Step 0 |
| 1c | Convert 5 feature images (future-proofing) | Shell | Step 0 |
| 2 | `Hero.jsx` line 81: `.png` → `.webp` | Code | Step 1a |
| 3 | `content.js` lines 11–18: 8 paths `.png` → `.webp` | Code | Step 1b |
| 4 | `vsp.js` lines 133–140: 8 paths `.png` → `.webp` | Code | Step 1b |
| 5 | `DemoLanding.jsx` lines 52–56: 5 paths `.png` → `.webp` | Code | Step 1b |

**Steps 2–5 can run in parallel after Step 1 is complete.**  
**Do NOT delete any PNG files** — they are still needed for OG social sharing tags.

---

*Plan written 2026-08-21. All line numbers verified against live files. No code changes made.*
