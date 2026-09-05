# CR-118 — Line-by-Line Implementation Plan
## Poppins Self-Hosting: Eliminate Google Fonts Blocking

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-118_ImpactAnalysis.md`, `CR-118_Poppins_Blocking_CSS_FCP.md`

---

## 0. Prerequisite Checks

Run all before touching any file:

```bash
# A. Confirm static-server mode
grep "command=" /etc/supervisor/conf.d/supervisord.conf | grep frontend
# Expected: command=/usr/bin/node /app/frontend/scripts/static-server.js

# B. Confirm existing fonts directory (Clash Display already there)
ls -lh /app/frontend/public/fonts/
# Expected: clash-display-600.woff2 (15K) + clash-display-700.woff2 (15K)

# C. Confirm Poppins blocking tag exists in current build
python3 -c "
import re; html=open('/app/frontend/build/index.html').read()
links=[l for l in re.findall(r'<link[^>]+>',html) if 'googleapis' in l and 'stylesheet' in l]
print('Blocking Poppins links:',len(links),'(expected: 1)')
"

# D. Confirm download URLs are live (Latin subset woff2 from measurement step)
curl -sI "https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2" | grep -i "^http\|content-length"
# Expected: HTTP/2 200, content-length: ~7700
```

---

## Step 1 — Download Four Poppins woff2 Files

**Directory:** `/app/frontend/public/fonts/` (already exists from CR-114)
**Files:** 4 new woff2 files alongside the existing 2 Clash Display files

### 1-A. Weight 400 — critical; body text

```bash
curl -L \
  "https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2" \
  -o /app/frontend/public/fonts/poppins-400.woff2
```
Expected size: **7,700 bytes (7.7 KB)**

### 1-B. Weight 500 — navbar links

```bash
curl -L \
  "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2" \
  -o /app/frontend/public/fonts/poppins-500.woff2
```
Expected size: **7,600 bytes (7.6 KB)**

### 1-C. Weight 600 — navbar buttons, hero CTAs, badge

```bash
curl -L \
  "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2" \
  -o /app/frontend/public/fonts/poppins-600.woff2
```
Expected size: **7,800 bytes (7.8 KB)**

### 1-D. Weight 700 — inline `font-bold` spans in hero subtitle

```bash
curl -L \
  "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2" \
  -o /app/frontend/public/fonts/poppins-700.woff2
```
Expected size: **7,700 bytes (7.7 KB)**

### 1-E. Verify all 4 files

```bash
ls -lh /app/frontend/public/fonts/
# Expected: 6 files total — 2 Clash Display + 4 Poppins

python3 -c "
files = ['poppins-400.woff2','poppins-500.woff2','poppins-600.woff2','poppins-700.woff2']
for f in files:
    with open(f'/app/frontend/public/fonts/{f}','rb') as fp: h=fp.read(4)
    print(f, '→', 'VALID woff2' if h==b'wOF2' else 'INVALID: '+str(h))
"
# Expected: all 4 → VALID woff2
```

**Why weight 800 is NOT downloaded:** `font-extrabold` (800) only appears in `ChurnPanel.jsx` — an admin/funnel analytics component, not present on the homepage. Downloading weight 800 for the body font would waste 7.7 KB.

---

## Step 2 — Edit `public/index.html`

**File:** `/app/frontend/public/index.html` (165 lines)
**Total changes:** 7 edits. Order: remove two preconnects → add Poppins preload → extend style block → remove Poppins stylesheet link + noscript.

---

### 2-A. Lines 10–12 — Update comment + REMOVE two preconnect tags

**Current (lines 10–12):**
```html
        <!-- Fonts: Clash Display self-hosted woff2 (preload) + Poppins via Google Fonts (body) -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Replace with:**
```html
        <!-- Fonts: all self-hosted woff2 — Clash Display (headings) + Poppins (body) -->
```

**What changes:**
- Line 10: Comment updated to reflect self-hosting for both fonts
- Lines 11–12: Both preconnect tags **removed**

**Why remove the preconnects:** They existed solely to speed up connections to `fonts.googleapis.com` and `fonts.gstatic.com`. After self-hosting, neither origin is used. Keeping them wastes one browser TCP slot each and adds noise to Lighthouse audits.

---

### 2-B. After line 15 — ADD Poppins weight 400 preload tag

**Current line 15:**
```html
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-600.woff2" />
```

**Insert immediately after line 15:**
```html
        <!-- Preload Poppins 400 (body text — most frequent weight, critical for text rendering) -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-400.woff2" />
```

**Why only weight 400 gets a preload:**
- Weight 400 is the default body text weight — used by the hero subtitle and all paragraph text
- Weights 500/600/700 are used in interactive elements (buttons, nav labels) that can render in system fallback for the first ~40ms without visible effect
- Preloading all 4 weights would be 30.8 KB in parallel — on Slow-4G this competes with other critical resources
- Weight 400 is the LCP-path font for body text; one preload is sufficient

**Why `crossorigin`:** Same reason as CR-114 — font preloads must be `crossorigin` to match the CORS-anonymous request that `@font-face` makes. Without it, the browser downloads the font twice.

---

### 2-C. Lines 57 (closing `</style>`) — ADD Poppins @font-face blocks inside existing style block

**Current line 57:**
```html
        </style>
```

**Replace with** (insert 8 new @font-face blocks before `</style>`):
```html
          /* ── Poppins: self-hosted woff2, font-display:optional ────────── */
          @font-face {
            font-family: 'Poppins';
            src: url('/fonts/poppins-400.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
            font-display: optional;
          }
          @font-face {
            font-family: 'Poppins';
            src: url('/fonts/poppins-500.woff2') format('woff2');
            font-weight: 500;
            font-style: normal;
            font-display: optional;
          }
          @font-face {
            font-family: 'Poppins';
            src: url('/fonts/poppins-600.woff2') format('woff2');
            font-weight: 600;
            font-style: normal;
            font-display: optional;
          }
          @font-face {
            font-family: 'Poppins';
            src: url('/fonts/poppins-700.woff2') format('woff2');
            font-weight: 700;
            font-style: normal;
            font-display: optional;
          }
          /* ── Poppins Fallback: system sans-serif metric-matched to Poppins ──── */
          /* Values from fonttools: Poppins asc=1050 dsc=350 gap=100 / Arial xw=934 */
          @font-face {
            font-family: 'Poppins Fallback';
            src: local('Arial'), local('Helvetica Neue'), local('Roboto');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
            ascent-override: 105%;
            descent-override: 35%;
            line-gap-override: 10%;
            size-adjust: 91.11%;
          }
          @font-face {
            font-family: 'Poppins Fallback';
            src: local('Arial'), local('Helvetica Neue'), local('Roboto');
            font-weight: 500;
            font-style: normal;
            font-display: swap;
            ascent-override: 105%;
            descent-override: 35%;
            line-gap-override: 10%;
            size-adjust: 91.97%;
          }
          @font-face {
            font-family: 'Poppins Fallback';
            src: local('Arial'), local('Helvetica Neue'), local('Roboto');
            font-weight: 600;
            font-style: normal;
            font-display: swap;
            ascent-override: 105%;
            descent-override: 35%;
            line-gap-override: 10%;
            size-adjust: 92.72%;
          }
          @font-face {
            font-family: 'Poppins Fallback';
            src: local('Arial'), local('Helvetica Neue'), local('Roboto');
            font-weight: 700;
            font-style: normal;
            font-display: swap;
            ascent-override: 105%;
            descent-override: 35%;
            line-gap-override: 10%;
            size-adjust: 93.47%;
          }
        </style>
```

**Metric value derivation (from fonttools measurement — no assumptions):**
```
Poppins: asc=1050 dsc=350 gap=100 UPM=1000
  → ascent-override:   1050/1000 = 105%
  → descent-override:   350/1000 =  35%
  → line-gap-override:  100/1000 =  10%

size-adjust = poppins_xAvgCharWidth / arial_xAvgCharWidth × 100%
  Weight 400: 851 / 934 = 91.11%
  Weight 500: 859 / 934 = 91.97%
  Weight 600: 866 / 934 = 92.72%
  Weight 700: 873 / 934 = 93.47%
```

**Why `font-display: swap` on the Fallback (not `optional`):**
The Fallback is a manufactured @font-face that points to local system fonts (Arial/Helvetica/Roboto). These are always instantly available (zero download). `swap` means: use immediately if system font available, swap when Poppins itself is ready. Since system fonts are always available, this is effectively instant. `optional` on the Fallback would be wrong — the whole point is for it to be used when Poppins hasn't loaded.

**Why `src: local('Arial'), local('Helvetica Neue'), local('Roboto')`:**
Covers the most common system sans-serif across Windows (Arial), macOS/iOS (Helvetica Neue), and Android (Roboto). The browser tries each `local()` in order and uses the first one found. If none are installed, the browser falls through to `sans-serif` in the font stack.

---

### 2-D. Lines 58–62 — Update comment + REMOVE Poppins Google Fonts link + REMOVE noscript

**Current (lines 58–62):**
```html
        <!-- Non-blocking stylesheets loaded in parallel (replaces @import chain in index.css) -->
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" />
        </noscript>
```

**Replace with:**
```html
```
_(Delete all 5 lines — entire block removed)_

**Why remove the entire block:**
- Line 59 (`<link rel="preload" as="style" ...>`): This is the source of the blocking stylesheet in the prerendered HTML. Puppeteer's `onload` handler fires during render and converts `rel="preload"` to `rel="stylesheet"` — creating the 820ms blocking resource. Removing this at the source is cleaner than cleaning it up downstream.
- Lines 60–62 (`<noscript>...</noscript>`): No-JS fallback for Poppins. With self-hosted Poppins declared in the `<style>` block, no-JS users will still get Poppins from the @font-face declaration (which is processed by CSS engines even without JS). The noscript block is redundant and was previously causing a serialised duplicate in the prerendered HTML (addressed in CR-117 for the head noscript; this is the source template version).
- The comment on line 58 is also removed since it no longer describes reality.

---

### 2-E. Final state of the entire font block (lines 10–62 after all edits)

For full review — the complete section as it will look:
```html
        <!-- Fonts: all self-hosted woff2 — Clash Display (headings) + Poppins (body) -->
        <!-- Preload self-hosted Clash Display: weight 700 first (LCP heading), then 600 -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-700.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-600.woff2" />
        <!-- Preload Poppins 400 (body text — most frequent weight, critical for text rendering) -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-400.woff2" />
        <!-- @font-face inline: CRA css-loader intercepts /fonts/ paths in .css files;
             declaring here keeps paths as browser root-relative, matching the preload hrefs above -->
        <style>
          @font-face { /* Clash Display 600 */ font-family:'Clash Display'; ... font-display:optional; }
          @font-face { /* Clash Display 700 */ font-family:'Clash Display'; ... font-display:optional; }
          @font-face { /* Clash Display Fallback 700 */ ... size-adjust:70.68%; }
          @font-face { /* Clash Display Fallback 600 */ ... size-adjust:68.82%; }
          @font-face { /* Poppins 400 */       font-family:'Poppins'; ... font-display:optional; }
          @font-face { /* Poppins 500 */       font-family:'Poppins'; ... font-display:optional; }
          @font-face { /* Poppins 600 */       font-family:'Poppins'; ... font-display:optional; }
          @font-face { /* Poppins 700 */       font-family:'Poppins'; ... font-display:optional; }
          @font-face { /* Poppins Fallback 400 */ src:local('Arial')...; size-adjust:91.11%; }
          @font-face { /* Poppins Fallback 500 */ src:local('Arial')...; size-adjust:91.97%; }
          @font-face { /* Poppins Fallback 600 */ src:local('Arial')...; size-adjust:92.72%; }
          @font-face { /* Poppins Fallback 700 */ src:local('Arial')...; size-adjust:93.47%; }
        </style>
```

**Lines removed vs added:**
- Removed: lines 11 (preconnect googleapis), 12 (preconnect gstatic), 58 (comment), 59 (Poppins preload), 60–62 (noscript) = 6 lines removed
- Added: 1 Poppins preload tag + 8 @font-face blocks + comment = ~48 lines added
- Net: +~42 lines

---

## Step 3 — Edit `src/index.css`

**File:** `/app/frontend/src/index.css`
**Change:** One line — add `"Poppins Fallback"` to the `body` font-family stack

### 3-A. Body font-family line (line 35)

**Current (line 35):**
```css
  font-family: "Poppins", sans-serif;
```

**Replace with:**
```css
  font-family: "Poppins", "Poppins Fallback", sans-serif;
```

**Why this change is needed:**
Without "Poppins Fallback" in the stack, when Poppins misses the `optional` window (rare edge case), the browser skips straight to `sans-serif` (system default). `sans-serif` metrics differ from Poppins, potentially causing layout shift. Adding "Poppins Fallback" provides an intermediate step: system font with Poppins-like dimensions.

**Why this is safe to put in `index.css` (no CRA css-loader issue):**
`font-family: "Poppins Fallback"` is a plain CSS string value, not a `url()` reference. CRA's css-loader only intercepts `url()` calls for font files. Font family names are passed through unchanged.

**No other lines in `index.css` change.**

---

## Step 4 — Edit `scripts/prerender.js`

**File:** `/app/frontend/scripts/prerender.js`
**Change:** Add 2 lines in the existing `page.evaluate()` cleanup block — after the `head noscript` removal (line 60), add a googleapis stylesheet cleanup.

### 4-A. After line 60 — ADD googleapis stylesheet cleanup

**Current (lines 59–61):**
```js
        // ── NEW 2: remove <noscript> from <head> (serialised as blocking stylesheet) ─
        document.querySelectorAll('head noscript').forEach((n) => n.remove());

        // ── NEW 3: deduplicate canonical links
```

**Insert after line 60 (between noscript removal and canonical dedup):**
```js
        // ── NEW 4: remove googleapis.com stylesheets (CR-118: Poppins now self-hosted) ─
        document.querySelectorAll('head link[href*="googleapis.com"]').forEach((n) => n.remove());
```

**Why this is needed even after removing the source from `index.html`:**
This is a **safety net**. If the prerender script is run against a `build/` that was compiled with an older `index.html` (before the CR-118 change), the googleapis.com link might still appear. This cleanup ensures the prerendered output is always clean regardless of which build artifact it runs against. It adds 1 line and zero risk.

**Selector rationale:** `head link[href*="googleapis.com"]` matches any `<link>` tag in `<head>` pointing to googleapis.com — whether `rel="preload"`, `rel="stylesheet"`, or any onload-converted variant.

---

## Step 5 — Execution Pipeline

After all edits are made, run in this exact order:

### 5-A. Build
```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors
```

### 5-B. Verify build output
```bash
# Font files in build/
ls -lh /app/frontend/build/fonts/
# Expected: 6 files — clash-display-600, clash-display-700, poppins-400, 500, 600, 700

# No googleapis.com in built HTML template
grep "googleapis" /app/frontend/build/index.html && echo "FAIL" || echo "PASS: no googleapis"

# Poppins @font-face with optional in built HTML
grep -c "font-display:optional" /app/frontend/build/index.html
# Expected: >= 6 (4 Clash Display + 4 Poppins = 8 optional declarations, minified may merge some)

# Poppins preload tag in built HTML
grep "poppins-400" /app/frontend/build/index.html | head -2
# Expected: <link rel="preload" ... href="/fonts/poppins-400.woff2">
```

### 5-C. Prerender
```bash
cd /app/frontend && node scripts/prerender.js 2>&1
# Expected: prerendered / -> /app/frontend/build/index.html
```

### 5-D. Run all structural gates
```bash
python3 << 'PYEOF'
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)

styles        = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
noscripts     = re.findall(r'<noscript>', head)
canonicals    = re.findall(r'<link[^>]*canonical[^>]*>', html)
img_pre       = [l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]
font_pre      = [l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]
poppins_pre   = [l for l in font_pre if 'poppins-400' in l]
googleapis    = re.findall(r'googleapis', html)
poppins_ff    = re.findall(r"Poppins Fallback", styles[0] if styles else '')  # in style block
poppins_optl  = re.findall(r"font-family:'Poppins'.*?font-display:optional", html.replace('\n','').replace(' ',''))

g = {
    "G1  style blocks == 2":          len(styles) == 2,
    "G2  noscript in head == 0":       len(noscripts) == 0,
    "G3  canonical == 1":              len(canonicals) == 1,
    "G4  image preload == 1":          len(img_pre) == 1,
    "G5  font preloads == 3":          len(font_pre) == 3,
    "G6  poppins-400 preload present": len(poppins_pre) == 1,
    "G7  no googleapis in HTML":       len(googleapis) == 0,
    "G8  Poppins Fallback in style":   'Poppins Fallback' in (styles[0] if styles else ''),
    "G9  hero text present":           'boosts profit by up to' in html,
    "G10 no fontshare":                'fontshare' not in html,
    "G11 head < 30 KB":                len(head) < 30720,
}
for k, v in g.items():
    print(f"{'✅' if v else '❌'} {k}")

print(f"\nFont preload tags found:")
for p in font_pre: print(f"  {p[:120]}")
print(f"\nHead size: {len(head):,} bytes ({len(head)/1024:.1f} KB)")
print(f"\n{'ALL 11 GATES PASS ✅' if all(g.values()) else 'FAILURES — see above ❌'}")
PYEOF
```

### 5-E. Verify fonts served by static-server
```bash
PREVIEW=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
for f in poppins-400.woff2 poppins-500.woff2 poppins-600.woff2 poppins-700.woff2; do
    status=$(curl -sI "$PREVIEW/fonts/$f" | grep -c "font/woff2")
    echo "$f: $([ $status -gt 0 ] && echo 'PASS (200 font/woff2)' || echo 'FAIL')"
done
# Expected: all 4 → PASS (200 font/woff2)
```

### 5-F. Screenshot — visual check

Take screenshot of preview URL. Verify:
- Body text renders in Poppins (correct proportions, not system fallback)
- Hero H1 renders in Clash Display
- No blank or system-font text visible
- No visual regression from previous state

### 5-G. Testing agent (mandatory)

### 5-H. Lighthouse run (user-side)

Expected: LCP ~2,400ms (from 4,830ms), FCP ~2,400ms (from 3,100ms), Performance ~82–88 (from 70).

---

## Step 6 — Rollback Plan

If any regression is found:

```bash
cd /app/frontend

# Revert index.html
git checkout public/index.html

# Revert index.css
git checkout src/index.css

# Revert prerender.js
git checkout scripts/prerender.js

# Remove Poppins fonts (optional — they're harmless if kept)
rm /app/frontend/public/fonts/poppins-*.woff2

# Rebuild + reprerender
yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

Clash Display fonts (`public/fonts/clash-display-*.woff2`) are NOT removed — they belong to CR-114.

---

## File Change Summary

| File | Action | Lines changed |
|------|--------|--------------|
| `public/fonts/poppins-400.woff2` | **CREATE** (binary, 7.7 KB) | New file |
| `public/fonts/poppins-500.woff2` | **CREATE** (binary, 7.6 KB) | New file |
| `public/fonts/poppins-600.woff2` | **CREATE** (binary, 7.8 KB) | New file |
| `public/fonts/poppins-700.woff2` | **CREATE** (binary, 7.7 KB) | New file |
| `public/index.html` | **EDIT** — 4 edits | 10–12 (remove 2 preconnects + update comment), after 15 (add preload), 57 (extend style block), 58–62 (remove Poppins link + noscript) |
| `src/index.css` | **EDIT** — 1 line | Line 35: add "Poppins Fallback" to body font-family |
| `scripts/prerender.js` | **EDIT** — 2 lines | After line 60: add googleapis cleanup |
| **Total** | **3 source files + 4 binary** | **~55 lines changed** |

---

## Definition of Done

- [ ] All 4 Poppins woff2 files exist in `public/fonts/` with correct sizes
- [ ] No `googleapis.com` links anywhere in `build/index.html`
- [ ] 3 font preload tags in HTML: Clash Display 700, Clash Display 600, Poppins 400
- [ ] Poppins @font-face (4 weights, `font-display: optional`) in inline `<style>`
- [ ] Poppins Fallback @font-face (4 weights, metric-matched, `font-display: swap`) in inline `<style>`
- [ ] `body` font-family in `index.css` includes "Poppins Fallback"
- [ ] All 11 structural gates pass (G1–G11)
- [ ] All 4 Poppins woff2 files served with HTTP 200 + `Content-Type: font/woff2`
- [ ] Screenshot confirms body text renders in Poppins, no visual flash
- [ ] Testing agent confirms no regression
- [ ] LCP improvement confirmed by user Lighthouse run

---

*Line-by-line plan written 2026-08-23. No code changed. Ready for implementation on approval.*
