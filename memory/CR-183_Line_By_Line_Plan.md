# CR-183 Line-by-Line Implementation Plan
**Date:** 2026-09-02
**Status:** READY TO IMPLEMENT

---

## Files Changed: 1

| File | Lines | Change |
|---|---|---|
| `public/index.html` | After line 15 | Add 2 `<link rel="preload">` lines |

**Zero JSX changes. Zero data changes. Zero content approval needed.**

---

## Change 1 — `public/index.html` — insert after line 15

**BEFORE (lines 14–15):**
```html
        <!-- Preload Poppins 400 (body text — most frequent weight, critical for text rendering) -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-400.woff2" />
```

**AFTER (lines 14–17):**
```html
        <!-- Preload Poppins 400 (body text — most frequent weight, critical for text rendering) -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-400.woff2" />
        <!-- Preload Poppins 500 + 600: above-fold nav links (font-medium) and CTAs (font-semibold) — CR-183 -->
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-500.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-600.woff2" />
```

**Exactly 2 lines added. Nothing deleted.**

---

## Verification Gate — Run after build

```bash
python3 -c "
html = open('/app/frontend/build/index.html').read()
p500 = 'poppins-500.woff2' in html and 'preload' in html
p600 = 'poppins-600.woff2' in html and 'preload' in html
print('poppins-500 preload:', 'PASS' if p500 else 'FAIL')
print('poppins-600 preload:', 'PASS' if p600 else 'FAIL')
# Verify existing preloads not broken
p400 = 'poppins-400.woff2' in html
cd700 = 'clash-display-700.woff2' in html
print('poppins-400 still present:', 'PASS' if p400 else 'FAIL')
print('clash-display-700 still present:', 'PASS' if cd700 else 'FAIL')
"
```

All 4 must print PASS.

---

## Build Command

```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

---

*Plan written 2026-09-02. 1 file, 2 lines, ~130 total characters added.*
