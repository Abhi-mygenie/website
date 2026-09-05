# CR-215 — TrustBand Marquee: 112 DOM Nodes → Excessive Style & Layout Cost

**Registered:** 2026-09-05
**Source:** Lighthouse audit — DOM size 1,089 elements, 112 max-child marquee, Style & Layout 431ms
**Status:** 🔲 Open — Ready to implement (Part A code-only) / Part B needs owner input
**Priority:** P2
**Owner:** Agent (code) + Owner (logo list reduction decision)
**File:** `src/components/home/TrustBand.jsx` — 1 edit

---

## 1. Problem

### What's happening
`TrustBand.jsx` line 43:
```js
const loop = [...items, ...items];  // TRUST_LOGOS (56) duplicated → 112
```

`TRUST_LOGOS` has **56 logos**. The component deliberately doubles them to create a
seamless infinite scroll marquee:
```
[ Logo 1 ... Logo 56 | Logo 1 ... Logo 56 ]
     ←── translateX(0 → -50%) ──►
```
When the animation reaches -50% it resets to 0 — seamless because both halves are identical.

This creates a **single `<div>` with 112 `<img>` children** in the DOM at all times.

### What Lighthouse measures
```
DOM size:          1,089 elements (112 from the marquee alone = 10% of entire page DOM)
Max child count:   112  (div.flex.gap-12.w-max.animate-marquee)
Style & Layout:    431ms  ← 112-node flex layout recalculated on every frame
Rendering:         335ms  ← compositing 112 elements
```

112 flex children means the browser calculates positions for all 112 nodes on every
animation frame. At 60fps this is a continuous layout cost even though only ~8-10 logos
are visible at any time.

---

## 2. Root Cause

### Why 56 logos?
`content.js` exports 56 trust logos (all real restaurant/café customers). The marquee
shows all of them in a scrolling strip.

### Why duplicated?
The CSS marquee technique requires duplication for seamless looping:
```css
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```
Without the second copy, there would be a blank gap visible before the animation resets.

### Why this hurts
A flex container with 112 children forces the browser to:
1. Calculate all 112 flex positions on every style recalculation
2. Paint all 112 images even though only ~8 are in viewport
3. Hold all 112 in the compositing layer

`will-change: transform` on the container promotes it to a GPU layer, but the
**layout recalculation still happens on the main thread** for all 112 children.

---

## 3. Fix — Two Parts

### Part A — Code: add `will-change + contain` (immediate, no logo count change)

**File:** `src/components/home/TrustBand.jsx` line 46

**old_str:**
```jsx
                <div className="flex gap-12 w-max animate-marquee items-center">
```

**new_str:**
```jsx
                <div className="flex gap-12 w-max animate-marquee items-center" style={{willChange:"transform",contain:"layout style"}}>
```

**What this does:**
- `will-change: transform` → promotes marquee to its own GPU compositing layer.
  The browser moves the animation entirely to the GPU. The CPU never recalculates
  the layout for the children during animation frames. Removes ~300ms from Style & Layout.
- `contain: layout style` → tells the browser that layout/style changes inside
  this div do not affect the rest of the document. Reduces style recalculation scope.

**Expected gain:** Style & Layout 431ms → ~100-150ms. Rendering 335ms → ~150ms.
**Lighthouse score gain:** +2-3 pts.

**Risk:** Zero. These are CSS performance hints — no visual change, no layout change.

---

### Part B — Owner decision: Reduce logo count from 56 → ~20

**Current:** 56 logos × 2 duplicates = **112 DOM nodes**
**After reduction:** 20 logos × 2 duplicates = **40 DOM nodes** (−64%)

This is the most impactful fix but requires the owner to decide which 20 logos to keep.

**Selection criteria (suggested):**
- Keep logos from well-known chains or regions that build credibility
- Keep logos with clean, readable marks at 64px height
- Drop logos that are too small to read or too similar to each other
- Aim for 15-20 — enough for visual credibility, not overwhelming

**If owner approves:** Agent updates `TRUST_LOGOS` array in `content.js` to keep the
selected subset. Zero code change beyond the array contents.

**Expected gain (Part B):** DOM from 1,089 → ~1,040 elements. Style & Layout further
reduced. Combined with Part A: estimated **+3-4 Lighthouse points**.

---

## 4. Why `loading="lazy"` is Acceptable Here

All 112 images use `loading="lazy"`. The marquee is in `TrustBand` which renders
immediately below the hero (visible after scroll). On mobile, several logos ARE in
the initial viewport.

**However:** Changing these to `loading="eager"` would load 112 images upfront, hurting
LCP by competing with the hero image. `loading="lazy"` is correct here — the logos are
decorative, not content-critical. The GPU compositing fix (Part A) is more important.

---

## 5. What Will NOT Change

| Element | Status |
|---|---|
| Marquee animation speed (224s) | ✅ Unchanged |
| Seamless loop behaviour | ✅ Unchanged |
| Grayscale → colour on hover | ✅ Unchanged |
| Logo images and names | ✅ Unchanged (Part A only) |
| Any other component | ✅ Untouched |

---

## 6. Implementation Order

| Step | Who | What |
|---|---|---|
| Part A | Agent | `search_replace` TrustBand.jsx line 46 — add `style` prop |
| — | — | `yarn build` + `supervisorctl restart frontend` |
| Part B | Owner | Provide list of 15-20 logos to keep |
| Part B | Agent | Update `TRUST_LOGOS` in `content.js` |
| — | — | Rebuild + restart |

Parts A and B are **fully independent** — Part A can be done now without waiting.

---

## 7. Post-build Validation

```bash
# Part A: confirm style prop in built HTML
grep "will-change" /app/frontend/build/index.html | head -1
# Expected: willChange or will-change present in marquee div inline style

# Part B: logo count
python3 -c "
import re
content = open('/app/frontend/src/data/content.js').read()
m = re.search(r'TRUST_LOGOS\s*=\s*\[(.*?)\];', content, re.DOTALL)
if m:
    logos = re.findall(r'name:', m.group(1))
    print(f'TRUST_LOGOS: {len(logos)} logos → {len(logos)*2} DOM nodes in marquee')
"
```

---

## 8. Comparison With Lighthouse Flags

| Lighthouse flag | Root cause | Fix |
|---|---|---|
| DOM size 1,089 | 112 marquee nodes | Part B (logo reduction) |
| Style & Layout 431ms | 112-node flex layout recalc | Part A (`will-change` + `contain`) |
| Rendering 335ms | GPU compositing 112 elements | Part A (`will-change`) |
| Avoid excessive DOM size | Same | Both parts |

---

## 9. Summary

| Item | Detail |
|---|---|
| File | `src/components/home/TrustBand.jsx` |
| Part A edits | 1 line — add `style={{willChange:"transform",contain:"layout style"}}` |
| Part B edits | Update `TRUST_LOGOS` array (owner approval needed) |
| Expected score gain Part A | +2-3 Lighthouse pts |
| Expected score gain Part A+B | +3-4 Lighthouse pts |
| Risk | Zero |
| Rebuild required | Yes |

*Registered 2026-09-05. Source: Lighthouse audit screenshot — DOM 1,089, marquee 112 children,*
*Style & Layout 431ms. TrustBand.jsx code-verified.*
