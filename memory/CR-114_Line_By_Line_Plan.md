# CR-114 — Line-by-Line Implementation Plan
## Heading Webfont (Clash Display) → Self-host + font-display:optional

**Date:** 2026-08-23
**Scope:** POC homepage `/` only — measurement on `/`
**No code written yet. This is the plan only.**
**Read first:** `CR-114_ImpactAnalysis.md`, `CR-114_Heading_Webfont_Delayed_LCP_CLS.md`

---

## 0. Prerequisite Checks (run before touching any file)

### 0-A. Confirm the branch is clean and we're working from `23aug`
```bash
cd /app && git status --short
# Expected: only untracked files (env, node_modules, build) — no staged/unstaged changes to src
```

### 0-B. Confirm supervisor is still running dev server (yarn start)
```bash
sudo supervisorctl status | grep frontend
# Expected: frontend  RUNNING  …  command=yarn start
# NOTE: The static-server.js (prerendered) mode is required for Lighthouse measurement.
#       We switch to it ONLY at Step 5 (measurement step), NOT during development.
```

### 0-C. Confirm no `build/` artifact exists from a prior POC run
```bash
ls /app/frontend/build/index.html 2>/dev/null && echo "BUILD EXISTS — will be rebuilt at Step 5" || echo "NO BUILD — clean"
```

### 0-D. Confirm font CDN URLs are still live
```bash
curl -sI "https://cdn.fontshare.com/wf/FPDAZ2S6SW4QMSRIIKNNGTPM6VIXYMKO/5HNPQ453FRLIQWV2FNOBUU3FKTDZQVSG/Z3MGHFHX6DCTLQ55LJYRJ5MDCZPMFZU6.woff2" \
  | grep -i "http\|content-length"
# Expected: HTTP/2 200, content-length: 15284

curl -sI "https://cdn.fontshare.com/wf/BFBSY7LX5W2U2EROCLVVTQP4VS7S4PC3/IIUX4FGTMD2LK2VWD3RVTAS4SSMUN7B5/53RZKGODFYDW3QHTIL7IPOWTBCSUEZK7.woff2" \
  | grep -i "http\|content-length"
# Expected: HTTP/2 200, content-length: 14544
```

---

## 1. Step 1 — Download Font Files into `public/fonts/`

**New directory:** `frontend/public/fonts/`
**Files created:** 2 woff2 binary files — no code editing

### 1-A. Create the directory
```bash
mkdir -p /app/frontend/public/fonts
```
No existing files to conflict. CRA automatically copies everything in `public/` into `build/` during `yarn build` — so these files will be available at `/fonts/clash-display-600.woff2` and `/fonts/clash-display-700.woff2` after build.

### 1-B. Download Clash Display weight **700** (the H1 / LCP-element weight)
```bash
curl -L \
  "https://cdn.fontshare.com/wf/BFBSY7LX5W2U2EROCLVVTQP4VS7S4PC3/IIUX4FGTMD2LK2VWD3RVTAS4SSMUN7B5/53RZKGODFYDW3QHTIL7IPOWTBCSUEZK7.woff2" \
  -o /app/frontend/public/fonts/clash-display-700.woff2
```
- Source URL: fontshare CDN — stable (`cache-control: public, max-age=604800`, last-modified Apr 2021)
- Filename chosen: `clash-display-700.woff2` — descriptive, weight-encoded, no spaces
- Expected size: **14,544 bytes**

### 1-C. Download Clash Display weight **600** (used in all other `.font-display` headings)
```bash
curl -L \
  "https://cdn.fontshare.com/wf/FPDAZ2S6SW4QMSRIIKNNGTPM6VIXYMKO/5HNPQ453FRLIQWV2FNOBUU3FKTDZQVSG/Z3MGHFHX6DCTLQ55LJYRJ5MDCZPMFZU6.woff2" \
  -o /app/frontend/public/fonts/clash-display-600.woff2
```
- Expected size: **15,284 bytes**

### 1-D. Verify both files downloaded correctly
```bash
ls -lh /app/frontend/public/fonts/
# Expected:
#   clash-display-600.woff2   15.3K
#   clash-display-700.woff2   14.5K

file /app/frontend/public/fonts/clash-display-700.woff2
# Expected: "Web Open Font Format (Version 2)"  — confirms it's a real woff2, not an error page
```

---

## 2. Step 2 — Edit `public/index.html`

**File:** `/app/frontend/public/index.html` (118 lines total)
**Summary of changes:** remove 3 fontshare lines, add 2 preload lines, update 1 comment line.

---

### 2-A. Line 10 — Update comment
**Current (line 10):**
```html
        <!-- Fonts: preconnect for parallel discovery -->
```
**Replace with:**
```html
        <!-- Fonts: Clash Display self-hosted woff2 (preload) + Poppins via Google Fonts (body) -->
```
**Why:** Comment now accurately describes what the following tags do. No functional change.

---

### 2-B. Line 13 — REMOVE fontshare preconnect
**Current (line 13):**
```html
        <link rel="preconnect" href="https://api.fontshare.com" crossorigin />
```
**Action:** Delete this line entirely.
**Why:** `api.fontshare.com` is no longer used. The preconnect only existed to speed up the CDN connection. With self-hosted fonts there is no third-party origin to connect to. Removing it eliminates one unnecessary TCP+TLS handshake.

**Lines 11–12 (keep exactly as-is):**
```html
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```
**Why:** Poppins is still loaded from Google Fonts for body text. These preconnects remain valid and useful.

---

### 2-C. After line 12 — ADD two font preload tags (new lines)
**Insert immediately after line 12** (after the `fonts.gstatic.com` preconnect, before the existing comment on line 14):
```html
        <!-- Preload self-hosted Clash Display: weight 700 first (LCP heading), then 600 -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-700.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-600.woff2" />
```
**Why weight 700 listed first:** The H1 in `Hero.jsx` uses `font-bold` (= font-weight: 700). This is the LCP element. Listing 700 first gives it download priority in the browser's preload queue.

**Why `crossorigin` attribute:** Required for font preloads to match the CORS-anonymous request that `@font-face` will make. Without it, the browser downloads the font twice (once for preload, once for @font-face) — a known browser behaviour.

**Why `/fonts/` path (no `%PUBLIC_URL%`):** CRA serves `public/` at the root. The prerendered `build/index.html` will also have `/fonts/` available since CRA copies `public/` → `build/` during build. The static-server.js serves `build/` at root, so `/fonts/clash-display-700.woff2` resolves correctly in all environments (dev, build, prerender).

---

### 2-D. Line 15 (was 16 after insertion) — REMOVE fontshare stylesheet preload
**Current (original line 16):**
```html
        <link rel="preload" as="style" href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
```
**Action:** Delete this line entirely.
**Why:** This was the mechanism that loaded Clash Display from the third-party CDN. It is fully replaced by the `@font-face` definition in `index.css` pointing to the self-hosted files. The `onload` trick is no longer needed.

**Line 15 (Google Fonts Poppins — keep exactly as-is):**
```html
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
```
**Why:** Poppins body font is still loaded from Google Fonts. No change to this line.

---

### 2-E. Lines 17–20 — REMOVE fontshare noscript fallback only
**Current (lines 17–20):**
```html
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" />
          <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" />
        </noscript>
```
**Replace with:**
```html
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" />
        </noscript>
```
**Why:** Remove only the fontshare line inside noscript. The Poppins noscript line stays. No-JS users will still get Poppins. Clash Display will be available to them via the `@font-face` block in the built CSS bundle (which is loaded synchronously in no-JS environments via the `<link>` tags that CRA emits).

---

### 2-F. Final state of the entire `<head>` font block (lines 10–21 after edit)
For easy review — this is what the section should look like:
```html
        <!-- Fonts: Clash Display self-hosted woff2 (preload) + Poppins via Google Fonts (body) -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <!-- Preload self-hosted Clash Display: weight 700 first (LCP heading), then 600 -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-700.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-600.woff2" />
        <!-- Non-blocking stylesheets loaded in parallel (replaces @import chain in index.css) -->
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" />
        </noscript>
```

**What is gone:** the `api.fontshare.com` preconnect + the fontshare stylesheet preload + the fontshare noscript link.
**What is added:** 2 woff2 font preload tags pointing to self-hosted files.
**Lines 35–118 (everything after `<title>`):** UNTOUCHED. No changes to PostHog script, meta tags, or anything else.

---

## 3. Step 3 — Edit `src/index.css`

**File:** `/app/frontend/src/index.css` (67 lines total)
**Summary:** Add 3 `@font-face` blocks at the top of the file. Modify 1 existing rule (`.font-display`). Zero other changes.

---

### 3-A. Compute metric-matched fallback values (do this BEFORE writing the code)

The metric-matched `@font-face` needs `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` — all calculated from the actual font metrics of Clash Display 700 vs Poppins 700.

**Run this command after the font files are downloaded (Step 1):**
```bash
python3 - << 'EOF'
from fontTools.ttLib import TTFont

def metrics(path, label):
    f = TTFont(path)
    os2   = f["OS/2"]
    head  = f["head"]
    upm   = head.unitsPerEm
    asc   = os2.sTypoAscender
    dsc   = abs(os2.sTypoDescender)
    gap   = os2.sTypoLineGap
    print(f"{label}: UPM={upm}, ascender={asc}, descender={dsc}, lineGap={gap}")
    print(f"  ascent-override   = {round(asc/upm*100,2)}%")
    print(f"  descent-override  = {round(dsc/upm*100,2)}%")
    print(f"  line-gap-override = {round(gap/upm*100,2)}%")
    return upm, asc, dsc, gap

# Run both fonts
u1,a1,d1,g1 = metrics("/app/frontend/public/fonts/clash-display-700.woff2", "Clash Display 700")
EOF
```
> Note: `fonttools` is already installed in the backend venv. Run with `python3` — it reads woff2 directly.
> The Poppins metrics can be obtained the same way if the Poppins woff2 is downloaded from Google Fonts for measurement only (not self-hosted).

**Starting approximate values (to use if fonttools measurement is skipped):**
These are based on publicly documented geometric display font metrics comparable to Clash Display:
- `ascent-override: 92%`
- `descent-override: 22%`
- `line-gap-override: 0%`
- `size-adjust: 94%`

> These starting values are to be confirmed/tuned against measured CLS in Step 6.
> A CLS of 0.00–0.02 means the fallback is well-matched. If CLS > 0.05, re-run fonttools and recalculate.

---

### 3-B. Lines 1–13 — ADD `@font-face` blocks ABOVE `@tailwind base`

**Current lines 1–13:**
```css

@tailwind base;
@tailwind components;

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
.animate-shake { animation: shake 0.5s ease-in-out; }
@tailwind utilities;
```

**Insert before line 1** (at the very top of the file, above `@tailwind base`):

**Block 1 — Clash Display weight 600 (self-hosted, optional)**
```css
/* ─── Clash Display: self-hosted, font-display:optional ───────────────────── */
@font-face {
  font-family: 'Clash Display';
  src: url('/fonts/clash-display-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: optional;
}
```

**Block 2 — Clash Display weight 700 (self-hosted, optional) — the LCP weight**
```css
@font-face {
  font-family: 'Clash Display';
  src: url('/fonts/clash-display-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: optional;
}
```

**Block 3 — Metric-matched fallback (Poppins with Clash Display dimensions)**
```css
/* Fallback: Poppins resized to Clash Display metrics — prevents CLS if CD misses optional window */
@font-face {
  font-family: 'Clash Display Fallback';
  src: local('Poppins Bold'), local('Poppins-Bold');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  ascent-override: 92%;
  descent-override: 22%;
  line-gap-override: 0%;
  size-adjust: 94%;
}
@font-face {
  font-family: 'Clash Display Fallback';
  src: local('Poppins SemiBold'), local('Poppins-SemiBold');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  ascent-override: 92%;
  descent-override: 22%;
  line-gap-override: 0%;
  size-adjust: 94%;
}
/* ─────────────────────────────────────────────────────────────────────────── */
```

**Why `local('Poppins Bold')`:** If Poppins is already in cache from the Google Fonts load, `local()` picks it up instantly without a network request. If not, the browser falls back to system sans-serif — which also does not cause CLS because `size-adjust` tunes it to the same box.

**Why `font-display: swap` on the fallback:** The fallback is a manufactured font-face. We WANT it to always be used when Clash Display isn't ready — `swap` ensures it's immediately available.

**Why these values must go ABOVE `@tailwind base`:** Tailwind's preflight (`@tailwind base`) resets font-family. Our `@font-face` declarations must be established before preflight so they register in the cascade before any class is applied.

---

### 3-C. Lines 42–45 (now shifted down) — Modify `.font-display` rule

**Current:**
```css
.font-display {
  font-family: "Clash Display", "Poppins", sans-serif;
  word-spacing: 0.12em;
}
```

**Replace with:**
```css
.font-display {
  font-family: "Clash Display", "Clash Display Fallback", "Poppins", sans-serif;
  word-spacing: 0.12em;
}
```

**Change:** Add `"Clash Display Fallback"` as the second entry in the font stack.
**What changes:** When Clash Display doesn't load within its `optional` window, the browser uses `"Clash Display Fallback"` — which is Poppins with metric-adjusted dimensions — instead of jumping straight to the unsized Poppins.
**What does NOT change:** `word-spacing: 0.12em` stays. All 60+ component usages of `.font-display` class are untouched. The class name itself is unchanged.

---

### 3-D. Everything else in `index.css` — UNTOUCHED

Lines 1–67 (all other rules): zero changes.
- `:root` CSS variables: untouched
- `body` font-family: untouched (Poppins for body text — unrelated to CR-114)
- `::selection`: untouched
- `@keyframes marquee`: untouched
- `@keyframes float-slow`: untouched
- `@keyframes shake`: untouched

---

## 4. Step 4 — Verify `prerender.js` and `static-server.js` Compatibility

**No edits to these files.** Just confirming they already handle woff2 correctly.

### 4-A. `prerender.js` — already handles woff2
```js
// Line 15 of prerender.js — already has:
const TYPES = { ... ".woff2":"font/woff2" ... };
```
The local HTTP server in prerender.js (port 4321) will serve `build/fonts/clash-display-700.woff2` with `Content-Type: font/woff2`.
The preload tag `<link rel="preload" as="font" href="/fonts/clash-display-700.woff2">` will be respected during the Puppeteer snapshot.
**No edit needed. ✅**

### 4-B. `static-server.js` — already handles woff2
```js
// Line 11 of static-server.js — already has:
const TYPES = { ... ".woff2":"font/woff2" ... };
```
Production static serving will return `Content-Type: font/woff2` for font files.
**No edit needed. ✅**

### 4-C. CRA build — automatically copies fonts to build/
CRA's `yarn build` copies everything from `public/` to `build/`. This means:
- `public/fonts/clash-display-700.woff2` → `build/fonts/clash-display-700.woff2`
- `public/fonts/clash-display-600.woff2` → `build/fonts/clash-display-600.woff2`
No webpack config change needed. ✅

---

## 5. Step 5 — Build + Prerender + Switch Supervisor to Static Server

This step has NO code changes. It is the execution pipeline.

### 5-A. Build the React app
```bash
cd /app/frontend && yarn build
```
**What to check after build:**
```bash
# Font files copied to build/
ls -lh /app/frontend/build/fonts/
# Expected: clash-display-600.woff2 (15.3K), clash-display-700.woff2 (14.5K)

# Preload tag present in built index.html (the CRA template)
grep "clash-display-700" /app/frontend/build/index.html
# Expected: <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-700.woff2" />

# No fontshare domain in built index.html
grep "fontshare" /app/frontend/build/index.html && echo "FAIL: fontshare still present" || echo "PASS"

# @font-face with optional is in the CSS bundle
grep -l "font-display: optional" /app/frontend/build/static/css/main.*.css
# Expected: one file listed

# Clash Display Fallback font-face is present
grep "Clash Display Fallback" /app/frontend/build/static/css/main.*.css | head -1
# Expected: @font-face {...font-family:'Clash Display Fallback'...}
```

### 5-B. Prerender homepage `/`
```bash
cd /app/frontend && node scripts/prerender.js
```
**What to check after prerender:**
```bash
# Hero text in prerendered HTML
grep -c "boosts profit by up to" /app/frontend/build/index.html
# Expected: 1 (or more)

# No double <title>
grep -c "<title>" /app/frontend/build/index.html
# Expected: 1

# No fontshare domain in prerendered HTML
grep "fontshare" /app/frontend/build/index.html && echo "FAIL" || echo "PASS"

# Font preload tags present in prerendered HTML
grep "clash-display" /app/frontend/build/index.html | head -3
# Expected: 2 preload links
```

### 5-C. Switch supervisor to static-server mode
```bash
# Edit /etc/supervisor/conf.d/supervisord.conf
# Change [program:frontend] command from:
#   command=yarn start
# to:
#   command=/usr/bin/node /app/frontend/scripts/static-server.js

sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl restart frontend
sleep 3 && sudo supervisorctl status | grep frontend
# Expected: frontend  RUNNING
```

### 5-D. Verify font served by static-server
```bash
PREVIEW_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2 | sed 's|/api||')
curl -sI "$PREVIEW_URL/fonts/clash-display-700.woff2" | grep -i "content-type\|content-length\|http"
# Expected:
#   HTTP/2 200
#   content-type: font/woff2
#   content-length: 14544
```

---

## 6. Step 6 — Structural Verification Gates

All of these must pass before calling the testing agent.

| # | Check | Command | Expected result |
|---|-------|---------|-----------------|
| G1 | Font files exist in build | `ls build/fonts/` | 2 files, correct sizes |
| G2 | Preload tags in prerendered HTML | `grep "clash-display" build/index.html` | 2 preload links found |
| G3 | No fontshare in HTML | `grep "fontshare" build/index.html` | exit 1 (not found) |
| G4 | `font-display: optional` in CSS | `grep "font-display: optional" build/static/css/main.*.css` | match found |
| G5 | Clash Display Fallback @font-face | `grep "Clash Display Fallback" build/static/css/main.*.css` | match found |
| G6 | `.font-display` class has fallback in stack | `grep "Clash Display Fallback" build/static/css/main.*.css` | match found |
| G7 | Font served by static-server | `curl -sI .../fonts/clash-display-700.woff2` | 200 + font/woff2 |
| G8 | H1 hero text in raw HTML | `grep -c "boosts profit by up to" build/index.html` | ≥ 1 |
| G9 | No double title tag | `grep -c "<title>" build/index.html` | exactly 1 |
| G10 | Page renders visually | screenshot of preview URL | hero section visible, heading text displays |

---

## 7. Step 7 — Metric Tuning (if CLS > 0.02 after measurement)

If after testing the CLS is > 0.02, the `size-adjust`/`ascent-override`/`descent-override` values in the fallback `@font-face` need tuning.

### 7-A. Measure actual font metrics
```bash
python3 << 'EOF'
from fontTools.ttLib import TTFont

def report(path, label):
    f  = TTFont(path)
    os2 = f["OS/2"]
    h   = f["head"]
    upm = h.unitsPerEm
    asc = os2.sTypoAscender
    dsc = abs(os2.sTypoDescender)
    gap = os2.sTypoLineGap
    print(f"\n{label}")
    print(f"  UPM={upm}  asc={asc}  dsc={dsc}  gap={gap}")
    print(f"  ascent-override:    {round(asc/upm*100,2)}%")
    print(f"  descent-override:   {round(dsc/upm*100,2)}%")
    print(f"  line-gap-override:  {round(gap/upm*100,2)}%")

report("/app/frontend/public/fonts/clash-display-700.woff2", "Clash Display 700")
EOF
```

### 7-B. Calculate `size-adjust`
`size-adjust` corrects for the difference in average advance width between the two fonts:
```
size-adjust = (clash_display_xAvgCharWidth / poppins_xAvgCharWidth) * 100%
```
Where `xAvgCharWidth` is read from `OS/2.xAvgCharWidth` in fonttools:
```python
f["OS/2"].xAvgCharWidth   # run for both fonts
```

### 7-C. Apply corrected values
Update only the four metric properties in the `"Clash Display Fallback"` `@font-face` blocks in `index.css`. Rebuild and re-verify.

---

## 8. Step 8 — Rollback Plan

If the fix causes a visual regression or unexpected issue:

```bash
# Revert index.html (restore fontshare links)
cd /app/frontend && git checkout public/index.html

# Revert index.css (remove the @font-face blocks)
cd /app/frontend && git checkout src/index.css

# Delete font files (optional)
rm -rf /app/frontend/public/fonts/

# Rebuild and reprerender
yarn build && node scripts/prerender.js

# Restart frontend
sudo supervisorctl restart frontend
```

The font files themselves (`public/fonts/`) are in `.gitignore` (or will be untracked), so they don't affect git history. The only tracked changes are `index.html` and `index.css` — both fully reversible with `git checkout`.

---

## 9. File Change Summary

| File | Action | Lines affected |
|------|--------|----------------|
| `public/fonts/clash-display-600.woff2` | **CREATE** (binary download) | New file |
| `public/fonts/clash-display-700.woff2` | **CREATE** (binary download) | New file |
| `public/index.html` | **EDIT** | Lines 10, 13 (remove), 12 (add 2 after), 16 (remove), 19 (remove) |
| `src/index.css` | **EDIT** | Add ~25 lines before line 1; modify line 43 (font-family value) |
| `scripts/prerender.js` | **NO CHANGE** | — |
| `scripts/static-server.js` | **NO CHANGE** | — |
| `src/components/home/Hero.jsx` | **NO CHANGE** | — |
| All other `.jsx` components | **NO CHANGE** | — |
| `tailwind.config.js` | **NO CHANGE** | — |

**Total new lines of code:** ~27 (index.css @font-face blocks + comments)
**Total lines removed:** 3 (fontshare preconnect, fontshare preload, fontshare noscript)
**Total lines modified:** 2 (comment update, `.font-display` font-family value)

---

## 10. Definition of Done

- [ ] Both woff2 files in `public/fonts/` with correct sizes
- [ ] `index.html`: no `api.fontshare.com` or `cdn.fontshare.com` references
- [ ] `index.html`: 2 preload tags for self-hosted fonts, `crossorigin` attribute present
- [ ] `index.css`: `@font-face` for Clash Display 600+700 with `font-display: optional`
- [ ] `index.css`: `@font-face` for "Clash Display Fallback" with metric-matched properties
- [ ] `index.css`: `.font-display` font-family stack includes "Clash Display Fallback"
- [ ] All 10 structural gates (G1–G10) passing
- [ ] Preview URL serving fonts with correct `Content-Type: font/woff2`
- [ ] Visual screenshot confirms heading text renders correctly
- [ ] Testing agent called and report filed
- [ ] CR-114 status updated: OPEN → FIXED

---

*Line-by-line plan written 2026-08-23. No code changed. Ready for implementation on approval.*
