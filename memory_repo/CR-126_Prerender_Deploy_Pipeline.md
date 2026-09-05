# CR-126 — Prerender Not Locked in Deploy Pipeline → Score Regression on Every Deploy

**Type:** DevOps / Performance Reliability
**Date Raised:** 2026-08-24
**Raised By:** CWV investigation session (E1)
**Status:** 🔲 OPEN
**Priority:** P1
**Effort:** Very Low (~15 min)
**Improves:** Prevents silent regression of LCP (+2.1s), SEO (-38 pts), title tags, meta descriptions on every deploy
**Scope:** Deploy pipeline / `package.json` build script
**Related:** CR-101 (prerender implementation), CR-114 (LCP), CR-122 (sitemap)

---

## 1. Problem Statement

`npm run prerender` must be run after every `npm run build` or the following regressions occur silently:

| Metric | With prerender | Without prerender |
|---|---|---|
| LCP | 1.7s ✅ | 4.3s ❌ |
| Title tags | Per-route ✅ | All identical (homepage title) ❌ |
| Meta descriptions | Per-route ✅ | All same (DEFAULT_DESCRIPTION) ❌ |
| Hero image preload | Injected ✅ | Missing ❌ |
| SEO score | 92 ✅ | ~54 ❌ |
| `<div id="root">` | Full HTML ✅ | Empty CSR shell ❌ |

**This happened on the first beta.mygenie.online deploy** — `npm run build` was run but `npm run prerender` was skipped. All 6 regressions above materialised simultaneously and were only identified after Lighthouse investigation.

There is no guard, warning, or automation preventing this skip.

---

## 2. Fix Design

### Option A — Chain prerender into build script in `package.json` (recommended)

```json
// package.json — scripts section
"build": "craco build && node scripts/prerender.js"
```

Running `npm run build` automatically prerenders after compilation. Zero chance of skipping.

**Risk:** `npm run build` time increases by ~10–15 minutes (prerender visits 53 routes). Acceptable for a production deploy.

**Note:** `prerender.js` requires Google Chrome. Ensure Chrome is available on the build machine (`/usr/bin/google-chrome` or set `CHROME_PATH` env var). On Netlify/Vercel/Ubuntu CI, Chrome is pre-installed.

### Option B — Separate script with guard

Keep `build` and `prerender` separate, but add a CI/CD step that fails the pipeline if `build/` directory is missing the prerendered content:

```bash
# CI check after build
python3 -c "
import re
html = open('build/index.html').read()
assert '<div id=\"root\"><' in html, 'PRERENDER MISSING — build/index.html is CSR shell'
assert 'Run a more profitable' in html, 'Homepage content missing from prerender'
print('Prerender gate: PASS')
"
```

**Recommendation: Option A** — one-line change, eliminates the class of bug entirely.

---

## 3. Verification Gate (existing, from CR-117)

After any build, run the structural gate check to confirm prerender ran correctly:

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
g = {
    "style blocks == 2":   len(styles) == 2,
    "noscript in head == 0": len(noscripts) == 0,
    "canonical == 1":      len(canonicals) == 1,
    "image preload == 1":  len(img_pre) == 1,
    "font preloads == 3":  len(font_pre) == 3,
    "hero text present":   'boosts profit by up to' in html,
}
for k, v in g.items(): print(f"{'PASS' if v else 'FAIL'} {k}")
PYEOF
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/package.json` | Update `"build"` script to chain `node scripts/prerender.js` |

---

## 5. Definition of Done

- [ ] `npm run build` on a clean checkout produces prerendered `build/` without any extra steps
- [ ] All structural gate checks pass after `npm run build`
- [ ] Deploy to beta.mygenie.online from a fresh clone still shows full HTML in view-source
- [ ] Chrome availability confirmed on the build machine

---

*CR-126 registered 2026-08-24. Identified when first beta.mygenie.online deploy skipped prerender — all 6 SEO/performance regressions occurred silently. Risk: this will happen on every future deploy unless automated.*
