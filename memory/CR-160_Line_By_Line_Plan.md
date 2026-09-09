# Batch N — Line-By-Line Implementation Plan
# CR-160 — Reveal.jsx CSS Fallback (opacity:0 fix)

**Date:** 2026-08-26  
**Priority: P1** — Implement FIRST in Batch N (unblocks CR-157 homepage form visibility)  
**Files changed:** `Reveal.jsx` (1 file, 27 lines → 32 lines) + `public/index.html` (+5 lines)

---

## CRITICAL: Why this must be implemented first

`id="demo"` on homepage is inside `<Reveal delay={0.1}>`. Current `useState(false)` means the DemoForm starts invisible. The href fallback from CR-157 and the shortForm change from CR-156 are both ineffective if the form is invisible on arrival.

After CR-160: form starts visible (`useState(true)`) — all other CRs work correctly.

---

## FILE 1 — `frontend/src/components/site/Reveal.jsx`

### Current file (27 lines, shown in full):
```
L1   import { useEffect, useRef, useState } from "react";
L2
L3   export default function Reveal({ children, delay = 0, className = "", y = 28 }) {
L4     const ref = useRef(null);
L5     const [visible, setVisible] = useState(false);
L6     useEffect(() => {
L7       const obs = new IntersectionObserver(
L8         ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
L9         { threshold: 0.1, rootMargin: "-80px" }
L10      );
L11      if (ref.current) obs.observe(ref.current);
L12      return () => obs.disconnect();
L13    }, []);
L14    return (
L15      <div
L16        ref={ref}
L17        className={className}
L18        style={{
L19          opacity: visible ? 1 : 0,
L20          transform: visible ? "none" : `translateY(${y}px)`,
L21          transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
L22        }}
L23      >
L24        {children}
L25      </div>
L26    );
L27  }
```

### Target file (32 lines):
```
L1   import { useEffect, useRef, useState } from "react";
L2
L3   export default function Reveal({ children, delay = 0, className = "", y = 28 }) {
L4     const ref = useRef(null);
L5     const [visible, setVisible] = useState(true);  // START VISIBLE — progressive enhancement
L6     useEffect(() => {
L7       // Respect reduced-motion preference — skip animation entirely
L8       if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
L9       // Re-hide for animation, then reveal on intersection
L10      setVisible(false);
L11      const obs = new IntersectionObserver(
L12        ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
L13        { threshold: 0.1, rootMargin: "-80px" }
L14      );
L15      if (ref.current) obs.observe(ref.current);
L16      return () => obs.disconnect();
L17    }, []);
L18    return (
L19      <div
L20        ref={ref}
L21        className={className}
L22        style={{
L23          opacity: visible ? 1 : 0,
L24          transform: visible ? "none" : `translateY(${y}px)`,
L25          transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
L26        }}
L27      >
L28        {children}
L29      </div>
L30    );
L31  }
```

### Line-by-line diff

| Line | Before | After |
|---|---|---|
| L5 | `useState(false)` | `useState(true)` |
| L6 | `useEffect(() => {` | `useEffect(() => {` (same) |
| L7 | `const obs = new IntersectionObserver(` | `// Respect reduced-motion preference — skip animation entirely` (new comment) |
| L8 | `([e]) => { if...` | `if (window.matchMedia?.(...).matches) return;` (new guard) |
| L9–12 | Original observer code | Shift down by 2 lines, same code |

**Exact search_replace for L5:**
```
old_str: "  const [visible, setVisible] = useState(false);"
new_str: "  const [visible, setVisible] = useState(true);  // START VISIBLE — progressive enhancement"
```

**Exact search_replace for L6–13 (full useEffect):**
```
old_str:
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "-80px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

new_str:
  useEffect(() => {
    // Respect reduced-motion preference — skip animation entirely
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Re-hide for animation, then reveal on intersection
    setVisible(false);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "-80px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
```

---

## FILE 2 — `frontend/public/index.html`

### Add noscript fallback in `<head>` (after L150)

**Current L150:**
```html
        <noscript>You need to enable JavaScript to run this app.</noscript>
```

**Insert AFTER L150:**
```html
        <noscript>
          <style>
            /* When JS is disabled, ensure all Reveal-wrapped content is visible */
            [style*="opacity: 0"] { opacity: 1 !important; }
            [style*="translateY"] { transform: none !important; }
          </style>
        </noscript>
```

**Note:** This is a second `<noscript>` block — having two is valid HTML. Or merge into the existing noscript block at L150 by adding a `<style>` inside it.

---

## Post-Implementation Verification

### Verify prerendered HTML no longer has opacity:0

After `yarn build` + `node scripts/prerender.js`, run:
```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
matches = re.findall(r'opacity: 0', html)
print(f'opacity:0 in prerendered homepage: {len(matches)} (expected: 0)')
"
```
**Expected output:** `opacity:0 in prerendered homepage: 0`

### Verify animation still works
1. Visit the homepage in browser
2. Scroll down — feature sections should fade and slide up as they enter view
3. Sections already in view (hero area) appear immediately without animation

### Verify prefers-reduced-motion
```js
// In browser console: override media query to test
window.matchMedia = () => ({ matches: true });
// Then reload — all sections should be visible with no animation
```

---

## Definition of Done — CR-160

- [ ] `useState(true)` in Reveal.jsx (not `false`)
- [ ] `useEffect` has `prefers-reduced-motion` guard before `setVisible(false)`
- [ ] `noscript` CSS fallback added to `public/index.html`
- [ ] Prerendered homepage: `opacity:0` occurrences = 0 (was 41)
- [ ] Prerendered `/solutions/qsr`: `opacity:0` occurrences = 0 (was 18)
- [ ] Homepage animation still visible in browser (sections slide in on scroll)
- [ ] `id="demo"` div on homepage is visible on arrival (not opacity:0)
- [ ] No visual regression on any page

---

## Important note for build sequence

After implementing CR-160, run:
```bash
cd /app/frontend && yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

This is required for the prerendered HTML to reflect `opacity:1`. The dev server hot-reloads immediately.

*Plan written 2026-08-26. Implement before CR-156, CR-157.*
