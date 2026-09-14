# CR-160 — Impact Analysis
# Reveal.jsx CSS Fallback — opacity:0 on Slow Connections

**Date:** 2026-08-26

---

## 1. Code Investigation

### Current Reveal.jsx
```js
const [visible, setVisible] = useState(false);   // starts invisible
useEffect(() => {
  const obs = new IntersectionObserver(
    ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
    { threshold: 0.1, rootMargin: "-80px" }     // fires 80px INSIDE viewport
  );
  if (ref.current) obs.observe(ref.current);
  return () => obs.disconnect();
}, []);
return (
  <div style={{
    opacity: visible ? 1 : 0,                   // invisible until observed
    transform: visible ? "none" : `translateY(${y}px)`,
  }}>
```

### Prerender verification (confirmed)
```
opacity:0 in prerendered homepage HTML:    41 occurrences
opacity:0 in prerendered /solutions/qsr:   18 occurrences
```

**41 elements on the homepage are invisible in the prerendered HTML.** Googlebot and social scrapers receive content with `opacity: 0` inline styles. While Googlebot executes JS and can see content, slow crawls and cached snapshots may score the page lower.

### Scope
- **130 `<Reveal>` usages** across **24 files**
- Every single feature section, proof card, pricing plan, FAQ, hero image, CTA section on every page is wrapped in Reveal
- **Includes:** `id="demo"` div on homepage (inside `<Reveal delay={0.1}>` in CtaDemo.jsx L53) — the form itself starts invisible

### rootMargin: "-80px" specifics
Content must be 80px **inside** the viewport before becoming visible. On a phone with a 700px tall viewport, an element at `top: 680px` (near bottom) won't trigger until the user scrolls so it's at `top: 600px`. This delays visibility by an extra scroll amount.

---

## 2. The Fix — `useState(true)` with progressive enhancement

### Proposed Reveal.jsx

```jsx
export default function Reveal({ children, delay = 0, className = "", y = 28 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);   // START VISIBLE

  useEffect(() => {
    // Skip animation for users who prefer reduced motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Re-hide for animation setup, then reveal on intersection
    setVisible(false);
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

### How it works

| State | Behaviour |
|---|---|
| **Server-side render / prerender (no JS)** | `useState(true)` → `opacity: 1` → prerendered HTML has all content visible |
| **JS not loaded (3G, blocked JS)** | Initial render: `opacity: 1` — content visible immediately. No JS = no animation, no re-hide. |
| **JS loads, user has no motion preference** | `useEffect` runs → `setVisible(false)` → element hides → IntersectionObserver fires → `setVisible(true)` → animation plays |
| **JS loads, `prefers-reduced-motion: reduce`** | `useEffect` returns early — element stays `opacity: 1` permanently. No animation. |
| **Normal JS, fast connection** | Brief opacity:0 flash on `setVisible(false)` → immediately re-visible as IntersectionObserver fires for in-viewport elements |

### "Brief flash" consideration
When `useEffect` fires and calls `setVisible(false)`, elements that are **already in viewport** will flicker briefly (opacity 0 → 0.6s → 1). This is the same animation as before, just starting slightly later (after mount vs. after scroll). For in-viewport elements it fires almost immediately and is imperceptible.

For elements **below the fold** (the common case), the behaviour is: starts visible → JS loads → hides → stays hidden until scroll → reveals with animation. This is correct.

---

## 3. Prerender Impact

**Before (current):**
Prerendered HTML: 41 `opacity: 0` inline styles on homepage. All section headings, features, proofs invisible in snapshot.

**After fix:**
Prerendered HTML: ALL elements start `opacity: 1`. Google sees full page content in the static snapshot. No `opacity: 0` in prerendered HTML.

This directly improves:
- Googlebot content indexing (less risk of thin-page assessment)
- Social share previews (OG scrapers see content)
- Lighthouse "Content is not visible" audits

---

## 4. Risk Assessment

| Risk | Likelihood | Notes |
|---|---|---|
| Animation breaks (no entrance effect) | None | Animation still plays — just triggered slightly differently |
| Flash of content (FOC) for in-viewport items | Very low | Milliseconds between mount and useEffect — invisible at normal speed |
| `prefers-reduced-motion` users see content | ✅ Correct behaviour | They should see content without animation |
| DemoForm visibility fix (combined with CR-157) | ✅ | After this fix, `id="demo"` in CtaDemo starts visible — `href="#demo"` fallback works correctly |

---

## 5. noscript Fallback

Add to `public/index.html` in `<head>`:
```html
<noscript>
  <style>
    /* Ensure all content visible when JavaScript is disabled */
    [style*="opacity: 0"] { opacity: 1 !important; }
    [style*="translateY"] { transform: none !important; }
  </style>
</noscript>
```

This handles the edge case where JS is completely disabled (the `useState(true)` fix already handles slow JS).

---

## 6. Files Changed

| File | Change | Lines |
|---|---|---|
| `frontend/src/components/site/Reveal.jsx` | Change `useState(false)` → `useState(true)`, restructure `useEffect` | ~8 lines modified |
| `frontend/public/index.html` | Add `<noscript>` CSS fallback in `<head>` | +5 lines |

---

## 7. Cross-Impact — Most Connected CR in Batch N

CR-160 unblocks or enhances 4 other CRs:

| CR | Dependency on CR-160 |
|---|---|
| **CR-157** (Hero href fallback) | `id="demo"` is in `<Reveal>`. After CR-160, form is visible on arrival — href fallback works fully |
| **CR-156** (shortForm) | CtaDemo DemoForm is in `<Reveal>`. After CR-160, form renders visible on homepage |
| **CR-159** (/customers sticky CTA) | Story cards are in `<Reveal>`. After CR-160, mid-page CTA card renders immediately |
| **CR-155** (/pricing DemoForm) | New DemoForm on /pricing should NOT be in Reveal — document this explicitly |

**Implement CR-160 first or alongside CR-156/157 for maximum combined effect.**

*Impact analysis written 2026-08-26.*
