# CR-115 — Line-by-Line Implementation Plan
## TBT Reduction: React.lazy + framer-motion Removal + PostHog Deferral

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-115_ImpactAnalysis.md`

---

## 0. Prerequisite Checks

```bash
# A. Confirm supervisor is in static-server mode (not dev server)
grep "command=" /etc/supervisor/conf.d/supervisord.conf | grep frontend
# Expected: command=/usr/bin/node /app/frontend/scripts/static-server.js

# B. Confirm current main.js size (baseline)
ls -lh /app/frontend/build/static/js/main.*.js
gzip -c /app/frontend/build/static/js/main.*.js | wc -c | awk '{printf "%.1f KB gzipped\n", $1/1024}'
# Expected: ~1.2 MB raw, ~322 KB gzipped

# C. Confirm framer-motion IS currently in main.js
grep -c "framer-motion" /app/frontend/build/static/js/main.*.js
# Expected: > 0

# D. Confirm PostHog init pattern exists as documented
grep -n "__idle\|requestIdleCallback" /app/frontend/public/index.html
# Expected: lines 154-156
```

---

## Change A — `src/components/home/Hero.jsx` (6 targeted edits)

**Goal:** Remove `framer-motion` import and replace 6 `motion.*` elements with plain HTML equivalents. All `motion.*` elements have `initial={{ opacity: 1, y: 0 }}` — already at their final visible state. Plain HTML elements are identical in appearance and behaviour.

---

### A-1. Line 1 — Remove framer-motion import

**Current line 1:**
```jsx
import { motion } from "framer-motion";
```
**Replace with:** _(delete the line entirely)_

**Why safe:** After this change, `motion` is not referenced anywhere in the file (confirmed by A-2 through A-6 below replacing every `motion.*` usage).

---

### A-2. Lines 15–22 — Badge span

**Current (lines 15–22):**
```jsx
          <motion.span
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 text-brand-orange px-4 py-1.5 text-sm font-semibold"
            data-testid="hero-badge"
          >
            <span className="w-2 h-2 rounded-full bg-brand-orange" />{" "}
            <EditableText id="home.hero.badge" fallback="The Hospitality Operating System" />
          </motion.span>
```
**Replace with:**
```jsx
          <span
            className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 text-brand-orange px-4 py-1.5 text-sm font-semibold"
            data-testid="hero-badge"
          >
            <span className="w-2 h-2 rounded-full bg-brand-orange" />{" "}
            <EditableText id="home.hero.badge" fallback="The Hospitality Operating System" />
          </span>
```
**Lines changed:** 15–16 (open tag: remove `motion.` prefix + remove `initial/animate/transition` props), 22 (close tag: `</motion.span>` → `</span>`)

---

### A-3. Lines 24–32 — H1 heading (the LCP element)

**Current (lines 24–32):**
```jsx
          <motion.h1
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-brand-ink"
          >
            <EditableText id="home.hero.title_lead" fallback="Run a more profitable hospitality business — " />
            <span className="text-brand-green">
              <EditableText id="home.hero.title_accent" fallback="from your phone." />
            </span>
          </motion.h1>
```
**Replace with:**
```jsx
          <h1
            className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-brand-ink"
          >
            <EditableText id="home.hero.title_lead" fallback="Run a more profitable hospitality business — " />
            <span className="text-brand-green">
              <EditableText id="home.hero.title_accent" fallback="from your phone." />
            </span>
          </h1>
```
**Lines changed:** 24–25 (open tag), 32 (`</motion.h1>` → `</h1>`)

**Why safe for LCP:** The prerendered HTML snapshot already has this H1 at `opacity: 1` in the raw HTML. Without framer-motion, React hydrates it as a plain `<h1>` — always visible. No JS sets it to `opacity: 0`, so there is no re-hide on hydration.

---

### A-4. Lines 34–43 — Subtitle paragraph

**Current (lines 34–43):**
```jsx
          <motion.p
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 text-lg text-brand-muted leading-relaxed max-w-xl"
          >
            <EditableText
              id="home.hero.subtitle"
              rich
              fallback={'MyGenie POS boosts profit by up to ...'}
            />
          </motion.p>
```
**Replace with:**
```jsx
          <p
            className="mt-6 text-lg text-brand-muted leading-relaxed max-w-xl"
          >
            <EditableText
              id="home.hero.subtitle"
              rich
              fallback={'MyGenie POS boosts profit by up to ...'}
            />
          </p>
```
**Lines changed:** 34–35 (open tag), 43 (`</motion.p>` → `</p>`)

---

### A-5. Lines 45–64 — CTA buttons wrapper div

**Current (lines 45–64):**
```jsx
          <motion.div
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            ... (button and Link children — untouched) ...
          </motion.div>
```
**Replace with:**
```jsx
          <div
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            ... (button and Link children — untouched) ...
          </div>
```
**Lines changed:** 45–46 (open tag), 64 (`</motion.div>` → `</div>`)
**Children (lines 49–63):** UNTOUCHED — buttons, onClick handlers, data-testid attributes all unchanged.

---

### A-6. Lines 72–108 — Hero visual / image wrapper div

**Current (lines 72–75):**
```jsx
        <motion.div
          initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
          data-testid="hero-visual"
        >
```
**Replace with:**
```jsx
        <div
          className="relative"
          data-testid="hero-visual"
        >
```
**Line 108:** `</motion.div>` → `</div>`
**Lines 77–107 (image, floating cards):** UNTOUCHED — `EditableImage`, `fetchPriority`, `data-testid` attributes all unchanged. The hero image preload (from CR hero preload fix) relies on `data-testid="hero-visual"` — confirmed unaffected.

---

### A — Final state summary

| Before | After | Lines |
|--------|-------|-------|
| `import { motion } from "framer-motion"` | _(removed)_ | 1 |
| `<motion.span initial=...>` | `<span>` | 15–16, 22 |
| `<motion.h1 initial=...>` | `<h1>` | 24–25, 32 |
| `<motion.p initial=...>` | `<p>` | 34–35, 43 |
| `<motion.div initial=...>` (CTAs) | `<div>` | 45–46, 64 |
| `<motion.div initial=...>` (visual) | `<div>` | 72–75, 108 |
| **Total lines changed** | | **~14** |

---

## Change B — `src/components/site/Reveal.jsx` (full rewrite — 15 → 15 lines)

**Goal:** Replace framer-motion `whileInView` with native CSS transitions + IntersectionObserver. Identical visual output: elements fade in from 28px below when they enter the viewport.

**Current file (15 lines):**
```jsx
import { motion } from "framer-motion";

export default function Reveal({ children, delay = 0, className = "", y = 28 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

**Replace entire file with:**
```jsx
import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, className = "", y = 28 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "-80px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
```

**Line-by-line mapping to original behaviour:**
| Framer-motion prop | CSS/Observer equivalent |
|-------------------|------------------------|
| `initial={{ opacity: 0, y }}` | `style={{ opacity: 0, transform: translateY(28px) }}` at mount |
| `whileInView={{ opacity: 1, y: 0 }}` | `setVisible(true)` on IntersectionObserver callback |
| `viewport={{ once: true }}` | `obs.disconnect()` after first intersection |
| `viewport={{ margin: "-80px" }}` | `rootMargin: "-80px"` in IntersectionObserver |
| `transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}` | CSS `transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s...` |
| `className` prop | passed directly to `<div>` |
| `y` prop | used in transform value and style |

**framer-motion import removed** — this file no longer causes framer-motion to be in any bundle that imports it.

---

## Change C — `src/pages/Home.jsx` (2 edits)

**Goal:** Convert 8 below-fold section imports to `React.lazy()`. Wrap them in `<Suspense fallback={null}>`.

---

### C-1. Lines 1–16 — Update imports

**Current (lines 1–16):**
```jsx
import { useState, useCallback } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Hero from "@/components/home/Hero";
import TrustBand from "@/components/home/TrustBand";
import ProblemGrid from "@/components/home/ProblemGrid";
import BeforeAfter from "@/components/home/BeforeAfter";
import OutcomePillars from "@/components/home/OutcomePillars";
import SectorSelector from "@/components/home/SectorSelector";
import ModuleOverview from "@/components/home/ModuleOverview";
import AIBand from "@/components/home/AIBand";
import ProofSection from "@/components/home/ProofSection";
import CtaDemo from "@/components/home/CtaDemo";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, ORG_JSONLD, SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**Replace with:**
```jsx
import { useState, useCallback, lazy, Suspense } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Hero from "@/components/home/Hero";
import TrustBand from "@/components/home/TrustBand";
import Seo from "@/components/site/Seo";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import { PAGE_SEO, ORG_JSONLD, SOFTWARE_APP_JSONLD } from "@/lib/seo";

const ProblemGrid    = lazy(() => import("@/components/home/ProblemGrid"));
const BeforeAfter    = lazy(() => import("@/components/home/BeforeAfter"));
const OutcomePillars = lazy(() => import("@/components/home/OutcomePillars"));
const SectorSelector = lazy(() => import("@/components/home/SectorSelector"));
const ModuleOverview = lazy(() => import("@/components/home/ModuleOverview"));
const AIBand         = lazy(() => import("@/components/home/AIBand"));
const ProofSection   = lazy(() => import("@/components/home/ProofSection"));
const CtaDemo        = lazy(() => import("@/components/home/CtaDemo"));
```

**Decision rationale for each import:**
| Component | Decision | Reason |
|-----------|----------|--------|
| `Navbar` | Static | Above fold, needed immediately for nav UI |
| `Hero` | Static | Above fold — LCP element lives here |
| `TrustBand` | Static | Just below fold, lightweight, no heavy deps |
| `Seo` | Static | Head tags — must run on initial render |
| `StickyMobileCta` | Static | Tiny, layout-independent overlay |
| `Footer` | Static | Small, layout-stable |
| `ProblemGrid` → `CtaDemo` | **Lazy** | All below fold — 8 sections |

---

### C-2. Lines 37–44 — Wrap below-fold sections in Suspense

**Current (lines 37–44):**
```jsx
        <ProblemGrid />
        <BeforeAfter />
        <OutcomePillars />
        <SectorSelector onSectorDemo={handleSectorDemo} />
        <ModuleOverview />
        <AIBand />
        <ProofSection />
        <CtaDemo sector={sector} />
```

**Replace with:**
```jsx
        <Suspense fallback={null}>
          <ProblemGrid />
          <BeforeAfter />
          <OutcomePillars />
          <SectorSelector onSectorDemo={handleSectorDemo} />
          <ModuleOverview />
          <AIBand />
          <ProofSection />
          <CtaDemo sector={sector} />
        </Suspense>
```

**Why `fallback={null}`:** The prerendered `build/index.html` contains the full DOM for all these sections. When React encounters the Suspense boundary with unloaded lazy chunks, it renders the fallback — but since the prerendered HTML is already there, `null` means React keeps the server-rendered HTML visible while the lazy chunks load. No blank flash.

**Why one Suspense for all 8:** A single boundary means React yields control to the browser once (at the boundary) then loads all 8 chunks in parallel. Multiple Suspense boundaries would create multiple hydration phases — more complex, marginal benefit.

**Lines changed:** Lines 37–44 (add 2 lines: `<Suspense>` open + close, indent existing 8 lines).

---

## Change D — `public/index.html` (3 lines → ~8 lines)

**Goal:** Replace PostHog's `requestIdleCallback` + `load` deferral with an interaction-trigger + 6-second post-load timeout. This ensures PostHog fires AFTER TTI on Lighthouse (no user interaction) while still capturing real user sessions (fires on first click/touch/keydown).

---

### D-1. Lines 154–156 — Replace PostHog deferral

**Current (lines 154–156):**
```js
            var __idle = window.requestIdleCallback || function (cb) { setTimeout(cb, 2000); };
            if (document.readyState === "complete") __idle(__initPosthog);
            else window.addEventListener("load", function () { __idle(__initPosthog); });
```

**Replace with:**
```js
            var __phLoaded = false;
            function __loadPosthogOnce() {
                if (__phLoaded) return; __phLoaded = true; __initPosthog();
            }
            window.addEventListener("load", function () { setTimeout(__loadPosthogOnce, 6000); });
            ["click", "keydown", "touchstart", "scroll"].forEach(function (ev) {
                document.addEventListener(ev, __loadPosthogOnce, { once: true, passive: true });
            });
```

**Line-by-line explanation:**
| New line | Purpose |
|----------|---------|
| `var __phLoaded = false` | Guard flag — prevents double-init if timeout and interaction both fire |
| `function __loadPosthogOnce()` | Wrapper that respects the guard and calls `__initPosthog()` |
| `window.addEventListener("load", setTimeout(..., 6000))` | Lighthouse path: no interaction → fires 6s after page load, past TTI |
| `document.addEventListener("click/keydown/touchstart/scroll", ...)` | Real user path: fires on first interaction, whichever comes first |
| `{ once: true, passive: true }` | Each listener fires only once; `passive` prevents blocking scroll |

**Why 6000ms:** After CR-115, TTI is expected around 1–3s on Lighthouse mobile. A 6s delay comfortably clears any TTI window. The `load` event itself fires at ~4–6s on throttled Lighthouse, so PostHog executes at ~10–12s — well past TTI.

**Impact:** PostHog's 505ms of main-thread blocking is moved entirely outside the FCP→TTI window. TBT contribution from PostHog: 505ms → **0ms**.

**Note on `__initPosthog()`:** The function definition (lines 144–153) is NOT changed. Only the 3-line invocation pattern is replaced.

---

## Execution Pipeline

After all 4 changes are made, run in this exact order:

### Step 1 — Build
```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors
```

### Step 2 — Verify bundle (structural checks before prerender)
```bash
# main.js must be smaller
ls -lh /app/frontend/build/static/js/main.*.js
gzip -c /app/frontend/build/static/js/main.*.js | wc -c | awk '{printf "%.1f KB gzipped\n", $1/1024}'
# Expected: < 980 KB raw, < 260 KB gzipped (was 1,200 KB / 322 KB)

# framer-motion must NOT be in main.js
grep -c "framer.motion\|FramerMotion" /app/frontend/build/static/js/main.*.js
# Expected: 0

# Lazy chunks for below-fold sections must exist (new .chunk.js files)
ls /app/frontend/build/static/js/*.chunk.js | wc -l
# Expected: > 22 (more chunks than before — the 8 lazy sections split out)

# PostHog deferral must be in built HTML
grep -c "loadPosthogOnce\|__phLoaded" /app/frontend/build/index.html
# Expected: 2 (the function name appears twice in the guard pattern)
```

### Step 3 — Prerender
```bash
cd /app/frontend && node scripts/prerender.js 2>&1
# Expected: prerendered / -> /app/frontend/build/index.html
```

### Step 4 — Run full structural gate check
```bash
python3 << 'PYEOF'
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)

styles     = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
noscripts  = re.findall(r'<noscript>', head)
canonicals = re.findall(r'<link[^>]*canonical[^>]*>', html)
img_pre    = [l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]
fnt_pre    = [l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]

g = {
    "G1  style blocks == 2":        len(styles) == 2,
    "G2  noscript in head == 0":    len(noscripts) == 0,
    "G3  canonical == 1":           len(canonicals) == 1,
    "G4  image preload == 1":       len(img_pre) == 1,
    "G5  font preloads == 2":       len(fnt_pre) == 2,
    "G6  hero text present":        'boosts profit by up to' in html,
    "G7  no fontshare":             'fontshare' not in html,
    "G8  head < 25 KB":             len(head) < 25600,
    "G9  PostHog deferred (6s)":    'loadPosthogOnce' in html,
}
for k,v in g.items():
    print(f"{'✅' if v else '❌'} {k}")
print(f"\n{'ALL PASS' if all(g.values()) else 'FAILURES PRESENT'}")
PYEOF
```

### Step 5 — Screenshot (visual regression check)
Take a screenshot of the preview URL.
- Hero heading must be visible (no blank flash)
- Hero image must be visible
- No visual regression vs current state

### Step 6 — Testing agent (mandatory)

### Step 7 — Lighthouse run (user-side)
Expect TBT ≤ 400ms. If > 400ms, check `jsd/main.js` (platform script) — that 400ms is outside our control.

---

## Rollback Plan

If any change causes a regression, revert individually:

```bash
cd /app/frontend
# Revert specific file
git checkout src/pages/Home.jsx
git checkout src/components/home/Hero.jsx
git checkout src/components/site/Reveal.jsx
git checkout public/index.html

# Rebuild + reprerender
yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

All 4 changes are in tracked source files — `git checkout` fully restores them.

---

## File Change Summary

| File | Lines before | Lines after | Lines changed |
|------|-------------|-------------|--------------|
| `src/pages/Home.jsx` | 51 | 53 | 1 (React import), lines 6–14 (imports), lines 37–44 (Suspense) |
| `src/components/home/Hero.jsx` | 113 | 100 | Line 1 (remove import), lines 15–16/22, 24–25/32, 34–35/43, 45–46/64, 72–75/108 |
| `src/components/site/Reveal.jsx` | 15 | 22 | Full rewrite |
| `public/index.html` | 160 | 165 | Lines 154–156 (3 lines → 8 lines) |
| **Total** | — | — | **~43 lines changed** |

---

## Definition of Done

- [ ] `main.js` gzipped < 260 KB (from 322 KB)
- [ ] `framer-motion` not referenced in `main.js`
- [ ] ≥ 30 chunk files (8 new lazy sections created new chunks)
- [ ] Hero H1 visible on screenshot — no flash, no blank
- [ ] Below-fold sections animate in on scroll (CSS fade+slide)
- [ ] PostHog `loadPosthogOnce` present in `build/index.html`
- [ ] All 9 structural gates pass (G1–G9)
- [ ] Testing agent: no visual/functional regression
- [ ] Lighthouse TBT improvement confirmed by user run

---

*Line-by-line plan written 2026-08-23. No code changed. Ready for implementation.*
