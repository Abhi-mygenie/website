# Batch 1 — Final Impact Analysis & Implementation Plan
**CRs:** CR-70 (font loading) + CR-71 (hero image priority)  
**Plan written:** 2026-08-20 — Planning Agent  
**Scope revision:** CR-71 Option B applied — no `index.html` preload (owner decision 2026-08-20)  
**Status:** APPROVED FOR IMPLEMENTATION — awaiting code execution  
**Files touched:** 3 (two for CR-70, one for CR-71)  
**Estimated dev time:** 50 min  

---

## Part 1 — Final Impact Analysis

### A. CR-70 — Font Loading Fix

#### Files read & verified
| File | Lines read | Finding |
|---|---|---|
| `frontend/public/index.html` | 1–104 | Lines 10–12 confirmed: preconnect googleapis + gstatic + Inter stylesheet |
| `frontend/src/index.css` | 1–69 | Lines 1–2 confirmed: both `@import` font statements. Lines 3–69: unrelated styles, safe |
| `frontend/src/App.css` | 1–3 | Only `.App { text-align: left; }` — **no font imports** |
| `frontend/tailwind.config.js` | 1–42 | `fontFamily.sans = ["Poppins"]`, `fontFamily.display = ["Clash Display","Poppins"]` — Inter absent |
| `frontend/postcss.config.js` | 1–7 | Only `tailwindcss` + `autoprefixer` plugins — **no @import processor** |
| `frontend/craco.config.js` | 1–99 | No font-related config. `watchOptions.ignored` includes `**/public/**` — noted (see NEW FINDING 1) |

#### New Findings (not in original CR-70 doc)

**NEW FINDING CR70-A — `src/data/products.js` contains the string "Inter" — NOT a font reference**  
`grep` of all `src/` files for font-related Inter returned two hits in `products.js`:
```
"Inter-outlet transfers"
"Inter-outlet stock"
```
These are product feature descriptions, not CSS or font declarations. **Zero risk. No action needed.**

**NEW FINDING CR70-B — `public/` static HTML files use Inter — NOT part of the React SPA**  
Files `cr20-mockup.html`, `cr20-fullpage-mockup.html`, `CR-19_PhaseB_Mockup.html` in `public/` load Inter via their own `<link>` tags. These are **standalone HTML mockup files** served directly by the static file server — they are completely independent of `index.html` and the React build. Removing Inter from `index.html` has **zero effect** on these files. Zero risk.

**NEW FINDING CR70-C — `craco.config.js` watchOptions ignores `public/`**  
```js
watchOptions: { ignored: ['**/public/**', ...] }
```
webpack's hot-reload file watcher is configured to **ignore the `public/` directory**. This means changes to `index.html` will NOT trigger an automatic browser hot-reload in the dev server. After the `index.html` edit, a **manual full browser refresh** (Cmd+Shift+R / Ctrl+Shift+R) is required to see the change. This is expected and normal — no concern.

**NEW FINDING CR70-D — Inter is loaded as `rel="stylesheet"` (blocking), not `rel="preload"`**  
The current line 12 is:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
```
This is a **render-blocking synchronous stylesheet** load. Not only is it for an unused font, it actively blocks page render. Removal has a double benefit: (1) eliminates wasted network request; (2) removes a render-blocking resource from the critical path.

#### CR-70 Final Risk Register (updated)
| Risk | Status |
|---|---|
| Inter used anywhere in `src/` | ✅ Cleared — zero uses confirmed |
| `App.css` or other CSS has font imports | ✅ Cleared — App.css has no fonts |
| PostCSS processes @import in a way that changes behavior | ✅ Cleared — no relevant plugin |
| Removing @import breaks webpack build | ✅ Cleared — CRA passes external URLs through as-is |
| `noscript` fallback needed | ✅ Required and included in the plan |
| Fontshare CORS | ✅ Cleared — `access-control-allow-origin: *` confirmed |
| HtmlWebpackPlugin minifies `onload` | ✅ Cleared — semicolon → comma, logically identical |
| `public/` static files affected | ✅ Cleared — standalone files, out of scope |

---

### B. CR-71 — Hero Image Priority Fix (Option B)

#### Files read & verified
| File | Lines read | Finding |
|---|---|---|
| `frontend/src/components/home/Hero.jsx` | 1–110 | Full file. `EditableImage` on lines 78–84 confirmed — no `fetchpriority` or `loading` currently |
| `frontend/src/components/cms/Editable.jsx` | 405–457 | Full `EditableImage` function confirmed |
| `/app/frontend/public/brand/banner.png` | (file stat) | Confirmed exists, 305K |

#### Editable.jsx prop flow — verified line by line
```js
// Line 410
export function EditableImage({ id, fallback, alt = "", block = false, className = "", ...rest })
```
- `block` is destructured OUT of `...rest` — will NOT be spread to `<img>` ✅
- `className` is destructured OUT of `...rest` — will NOT be doubled ✅
- `fetchpriority` and `loading` are NOT destructured — they WILL be in `...rest` ✅

```js
// Line 444
mediaEl = <img src={src} alt={alt} className={className} {...rest} />;
```
- `{...rest}` is spread at the **end** — it overrides any preceding duplicates ✅
- Result: `<img src="..." alt="..." class="..." fetchpriority="high" loading="eager" />`

```js
// Line 415
const editable = cms && cms.editMode && cms.isAdmin && !cms.preview;
// Line 447
if (!editable) return mediaEl;
```
- For all non-admin visitors: returns `mediaEl` directly (the `<img>` with `{...rest}`) ✅
- For CMS admins in edit mode: `mediaEl` is wrapped in a `div` but `mediaEl` itself still has `{...rest}` ✅

```js
// Lines 418–441 — video path
if (isVideo(src)) { ... }
```
- `{...rest}` is NOT spread on video elements
- `banner.png` is never a video URL — this path will never be taken for the hero image ✅

#### New Findings (not in original CR-71 doc)

**NEW FINDING CR71-A — `block` prop destructured before `...rest` — clean prop isolation**  
Original CR-71 doc noted `{...rest}` on line 444 but did not confirm that `block` (an invalid HTML attribute) is safely excluded. Confirmed: `block` is destructured on line 410 and does not reach the `<img>` tag. `fetchpriority` and `loading` are valid HTML attributes and will reach the `<img>` tag via `{...rest}`. No attribute pollution.

**NEW FINDING CR71-B — `loading="eager"` is additive-safe, not the browser default label**  
`loading="eager"` is the explicit form of the browser's default. Setting it has no functional change for most browsers but:
- Prevents any future code change from accidentally inheriting `loading="lazy"` from a parent context
- Signals intent clearly to any developer reading the JSX
- Has zero negative effect if the attribute is not recognised (treated as unknown attribute, ignored) ✅

**NEW FINDING CR71-C — CMS override in preview does not affect the `fetchpriority` change**  
The preview environment has a stale CMS override (`home.hero.banner_image` → broken file). When this override is active:
- `src` resolves to `/api/cms/media/435e66d8...png` (a broken URL, returns JSON error)
- The `<img>` tag still renders with `fetchpriority="high"` and `loading="eager"` on the correct element
- The broken image display is a pre-existing issue (CR-71 Finding 9) — **not caused or worsened by this change**
- The `fetchpriority` attribute does not depend on the image URL — it applies to whichever URL is resolved ✅

**NEW FINDING CR71-D — Hero section already has `data-testid="hero"` — no testid change needed**  
`Hero.jsx` line 8: `<section id="top" ... data-testid="hero">`. The `EditableImage` itself does not have a `data-testid` — adding `fetchpriority` and `loading` does not require adding one either (the CR is not adding a new interactive element). No testid action needed.

#### CR-71 Final Risk Register (updated — Option B)
| Risk | Status |
|---|---|
| `fetchpriority` not reaching `<img>` | ✅ Cleared — `{...rest}` on line 444 confirmed |
| `block` prop leaking to `<img>` as invalid HTML attribute | ✅ Cleared — destructured before `...rest` |
| `loading="eager"` conflicting with any existing prop | ✅ Cleared — no `loading` prop currently set |
| CMS admin edit mode regression | ✅ Cleared — `mediaEl` retains `{...rest}` in edit mode |
| Video path accidentally receiving these props | ✅ Cleared — video path does not use `{...rest}` |
| `fetchpriority` on a broken CMS-overridden image in preview | ✅ Documented — pre-existing bug, unaffected by this change |
| `index.html` preload on all pages (anti-pattern) | ✅ RESOLVED — preload line dropped (Option B, owner decision) |

---

## Part 2 — Implementation Plan

### Pre-flight checklist (before touching any file)
- [ ] Confirm both services running: `sudo supervisorctl status`
- [ ] Note current site appearance: fonts and hero image render as expected baseline
- [ ] Open browser DevTools → Network tab → filter by `font` — note current requests (Inter present)

---

### Step 1 — Edit `frontend/public/index.html` (CR-70)

**Target:** Lines 10–12  
**Current state:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
```

**Replace with:**
```html
<!-- Fonts: preconnect for parallel discovery -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://api.fontshare.com" crossorigin />
<!-- Non-blocking stylesheets loaded in parallel (replaces @import chain in index.css) -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
<link rel="preload" as="style" href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" />
</noscript>
```

**What changed and why:**
- Line removed: Inter `<link rel="stylesheet">` — unused font, render-blocking
- Line added: `<link rel="preconnect" href="https://api.fontshare.com" crossorigin>` — allows early TCP connection to Fontshare CDN
- Lines added (×2): `<link rel="preload" as="style" ... onload="...">` — non-blocking parallel font load; `onload` converts preload → stylesheet once downloaded
- Lines added: `<noscript>` fallback — ensures fonts load for the ~0.2% of users with JS disabled

**Checkpoint after Step 1:**
- Hard refresh browser (Ctrl+Shift+R) — `public/` is not hot-reloaded
- DevTools Network → filter `font`: Inter request should be GONE
- Poppins and Clash Display requests should be present (may take 1–2 s to appear as they load async)
- Page text should render in system font briefly, then switch to Poppins (FOUT is expected and correct — `font-display: swap`)

**Rollback:** Revert to the original 3 lines. Restore the Inter `<link rel="stylesheet">` and remove the new block.

---

### Step 2 — Edit `frontend/src/index.css` (CR-70)

**Target:** Lines 1–2  
**Current state:**
```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap");
@import url("https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap");
```

**Replace with:** Delete both lines entirely. The blank line 3 before `@tailwind base` can be kept or removed — either is fine.

**What changed and why:**
- The two `@import` lines caused fonts to load serially and render-blocking via CSS discovery chain
- With fonts now loaded via `<link>` in `index.html`, these `@import` lines are redundant and would cause double-load

**CRITICAL ORDER NOTE:** Step 2 MUST be done AFTER Step 1. If Step 2 is done first (deleting @import before index.html has the replacement links), the site will briefly display with no web fonts at all — system sans-serif fallback only. Hot-reload will apply the CSS change immediately. No permanent damage, just a brief FOUT. Correct order is: Step 1 (index.html) → Step 2 (index.css).

**Checkpoint after Step 2:**
- Hot-reload will fire immediately (index.css is watched)
- DevTools Network → filter `font`: should show Poppins + Clash Display loading (from `<link>` in index.html), NOT as a CSS `@import`-triggered chain
- Fonts should render correctly — Poppins for body text, Clash Display for headings
- No `@import` lines in index.css (confirm in DevTools Sources)

**Rollback:** Re-add both `@import` lines at the top of index.css (lines 1–2). Remove the `<link>` block from index.html.

---

### Step 3 — Edit `frontend/src/components/home/Hero.jsx` (CR-71)

**Target:** Lines 78–84 — the `<EditableImage>` block  
**Current state:**
```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.png"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
/>
```

**Replace with:**
```jsx
<EditableImage
  block
  id="home.hero.banner_image"
  fallback="/brand/banner.png"
  alt="MyGenie POS hospitality operating system"
  className="w-full h-[420px] object-contain"
  fetchpriority="high"
  loading="eager"
/>
```

**What changed and why:**
- `fetchpriority="high"` — tells the browser to prioritise fetching this image above other resources when it encounters the `<img>` tag after JS renders. Passed through `{...rest}` to the native `<img>` tag.
- `loading="eager"` — explicitly marks this image as not lazy-loadable. Prevents any future lazy-load default from applying to the LCP element.

**Checkpoint after Step 3:**
- Hot-reload will fire immediately
- DevTools Elements → inspect the hero `<img>` tag — confirm `fetchpriority="high"` and `loading="eager"` are present
- No visual change expected (fonts and layout unaffected)
- Note: in preview, the hero image may show as broken (pre-existing CMS override bug — unrelated to this change)

**Rollback:** Remove the two added prop lines from `<EditableImage>`.

---

### Post-implementation Validation Checklist

#### CR-70 — Font Loading
- [ ] Inter font request absent from DevTools Network (filter: `font` or `fonts.googleapis.com`)
- [ ] Poppins request present and loads from `https://fonts.googleapis.com/css2?family=Poppins...`
- [ ] Clash Display request present and loads from `https://api.fontshare.com/...`
- [ ] Both font requests appear in parallel (same start time in waterfall) — not sequential
- [ ] `index.css` has no `@import` lines (confirm in DevTools Sources)
- [ ] `index.html` lines 10–12 replaced with new block (confirm in DevTools Sources)
- [ ] No FOUT regression on homepage, /pricing, /solutions (text visible within 2–3s)
- [ ] `<noscript>` block present in page source

#### CR-71 — Hero Image Priority
- [ ] DevTools Elements → hero `<img>` has `fetchpriority="high"` attribute
- [ ] DevTools Elements → hero `<img>` has `loading="eager"` attribute
- [ ] No layout shift on homepage (hero section height unchanged — `h-[420px]` still in place)
- [ ] No JS console errors

#### Final CR status updates (after validation passes)
- Update `CR-70_Wrong_Font_Preload_index_html.md` → `Status: IMPLEMENTED — 2026-08-20`
- Update `CR-71_Hero_LCP_Image_Preload.md` → `Status: IMPLEMENTED — 2026-08-20`
- Update `/app/frontend/public/seo-plan.html` — check the C1 and C2 checkboxes

---

## Part 3 — Execution Summary

| Step | File | Type | Hot-reload? | Reversible? |
|---|---|---|---|---|
| 1 | `frontend/public/index.html` | Replace 3 lines with 9 lines | ❌ Manual refresh needed | ✅ |
| 2 | `frontend/src/index.css` | Delete 2 lines | ✅ Immediate | ✅ |
| 3 | `frontend/src/components/home/Hero.jsx` | Add 2 props | ✅ Immediate | ✅ |

**Order is mandatory: Step 1 → Step 2 → Step 3**  
Reason: Step 1 must add the font `<link>` tags to `index.html` BEFORE Step 2 removes the `@import` lines. If reversed, there is a brief window (until hard refresh) where no web fonts are loaded at all.

---

## Part 4 — What This Does NOT Fix (out of scope)

- **Hero image broken in preview** — pre-existing CMS override bug (Finding 9 in CR-71). Separate fix: delete the `home.hero.banner_image` key from CMS via admin panel.
- **`banner.png` not preloaded before JS** — dropped (Option B, owner decision). The `fetchpriority` attribute helps once React renders the `<img>` tag, but the browser won't discover it until after JS executes.
- **`banner.png` WebP conversion** — noted in CR-71 as a future upgrade (once CR-80 is done). Out of scope for Batch 1.

---

*Plan written 2026-08-20. Planning Agent. Ready for implementation on owner approval.*
