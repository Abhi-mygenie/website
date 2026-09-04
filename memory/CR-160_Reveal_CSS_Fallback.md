# CR-160 — Reveal.jsx: CSS Fallback for opacity:0 on Slow Connections

**Type:** Performance / Resilience
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P1 — Affects ALL pages, high bounce risk on 3G
**Finding:** #7 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

`Reveal.jsx` starts every wrapped element at `opacity: 0`:

```js
const [visible, setVisible] = useState(false);
style={{
  opacity: visible ? 1 : 0,
  transform: visible ? "none" : `translateY(${y}px)`,
}}
```

`IntersectionObserver` triggers `setVisible(true)` when the element enters the viewport. **If JS hasn't loaded, is blocked, or the IntersectionObserver fires too slowly, every section wrapped in `<Reveal>` is invisible — permanently.**

**Scope:** `<Reveal>` is used on virtually every section of every page site-wide, including:
- Homepage: TrustBand, ProofSection, OutcomePillars, ModuleOverview, BeforeAfter, etc.
- All 11 SectorPage sections
- All 5 new LP pages (hero features, pricing, proof sections)
- /pricing plan cards
- /customers story grid

`rootMargin: "-80px"` compounds the issue — content must be 80px **inside** the viewport before becoming visible. On mobile, sections near the bottom of the viewport fire late.

**Risk scenario:** A visitor on 3G in a rural area visits a SectorPage. React JS bundle loads slowly. The hero form is visible (not in Reveal), but all sections below — proof, features, pricing — are invisible. High bounce, no conversion.

---

## 2. Root Cause

`useState(false)` initialises to invisible. There is no CSS fallback that makes elements visible without JS.

---

## 3. Fix Options

### Option A — CSS `@starting-style` / `noscript` fallback (Recommended)

Add to `index.css`:
```css
/* Fallback: if JS hasn't run, content is visible by default.
   IntersectionObserver will override this inline style when it fires. */
@media (prefers-reduced-motion: reduce) {
  /* Also helps for accessibility — users who prefer no animation see content immediately */
  [style*="opacity: 0"] {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

Add a `<noscript>` style in `public/index.html` `<head>`:
```html
<noscript>
  <style>
    /* When JS is disabled, make all Reveal elements visible */
    [style*="opacity: 0"] { opacity: 1 !important; transform: none !important; }
  </style>
</noscript>
```

### Option B — Change `useState` initial value to `true` with SSR-safe check (Recommended for prerender)

Since the site uses prerendering (Puppeteer visits pages and snapshots HTML), the prerendered HTML captures `opacity: 0` in the inline style. Googlebot and crawlers see invisible content.

Fix in `Reveal.jsx`:

```jsx
// BEFORE:
const [visible, setVisible] = useState(false);

// AFTER:
// Start visible — animate entrance only when IntersectionObserver fires.
// Content is always visible without JS; animation is progressive enhancement.
const [visible, setVisible] = useState(true);

useEffect(() => {
  // Re-hide and then reveal for animation (only if motion is not reduced)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  setVisible(false);
  // Re-observe: the element will become visible again when it enters viewport
  const obs = new IntersectionObserver(
    ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
    { threshold: 0.1, rootMargin: "-80px" }
  );
  if (ref.current) obs.observe(ref.current);
  return () => obs.disconnect();
}, []);
```

**Why Option B is better:**
- Prerendered HTML has `opacity: 1` → Googlebot and crawlers see all content ✅
- Users with JS: animation still works (brief re-hide then reveal) ✅
- Users without JS: content always visible ✅
- Users with `prefers-reduced-motion`: content visible immediately, no animation ✅
- 3G slow load: content visible as soon as CSS renders, animation fires when JS loads ✅

---

## 4. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/components/site/Reveal.jsx` | EDIT — change `useState(false)` to `useState(true)` + restructure useEffect | ~8 lines |
| `frontend/public/index.html` | ADD `<noscript>` CSS fallback in `<head>` | +5 lines |

---

## 5. SEO Impact

With current `useState(false)`, the prerendered HTML snapshot captures `opacity: 0` as an inline style on every Reveal-wrapped element. While Googlebot can execute JS, slow crawls or cached snapshots may show invisible content. After Option B, prerendered HTML will have `opacity: 1` — all content visible to crawlers by default.

---

## 6. Definition of Done

- [ ] `Reveal.jsx` starts with `visible = true` (content visible by default)
- [ ] Animation still runs when JS loads and user scrolls
- [ ] `prefers-reduced-motion` users see content immediately with no animation
- [ ] Prerendered HTML (`build/*/index.html`) shows `opacity: 1` on Reveal-wrapped elements
- [ ] `<noscript>` fallback added to `public/index.html`
- [ ] No visual regression on pages with many Reveal sections (homepage, SectorPage, LPs)

*CR-160 registered 2026-08-26. Source: UX/SEO Audit Finding #7.*
