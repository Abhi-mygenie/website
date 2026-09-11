# CR-157 — Impact Analysis
# Hero.jsx "Book a Free Demo" Button → href Fallback

**Date:** 2026-08-26

---

## 1. Code Investigation

### Current Hero CTA (no href)
`Hero.jsx` L45–52:
```jsx
<button
  onClick={() => onDemo()}
  data-testid="hero-demo-btn"
  className="group bg-brand-green...">
  Book a Free Demo
</button>
```
Pure `<button>`. No `href`. JS required for any action.

### How `onDemo` works on the homepage
`Home.jsx` L22–29:
```js
const scrollToDemo = useCallback(() => {
  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
}, []);
// Passed to Hero as:
<Hero onDemo={scrollToDemo} />
```

`id="demo"` target is `CtaDemo.jsx` L54:
```jsx
<div id="demo" data-testid="demo-anchor">
  <DemoForm ... />
</div>
```

### Navbar already has the href fallback (for reference)
`Navbar.jsx` L162 (non-homepage pages):
```jsx
<a href="/#demo" onClick={handleDemoCtaClick} ...>Book a Free Demo</a>
```
`handleDemoCtaClick` tries local anchors first, falls through to `href="/#demo"`. This is the correct pattern.

### `CtaDemo` is lazy-loaded
`Home.jsx` L17: `const CtaDemo = lazy(() => import("@/components/home/CtaDemo"));`

`CtaDemo` (and therefore `id="demo"`) only exists in the DOM after the lazy bundle loads. On very slow connections, the anchor `#demo` may not exist when the page first loads. The `?` optional chaining in `getElementById("demo")?` handles this gracefully — if the element isn't there yet, scrollToDemo does nothing.

**With href="#demo" fallback:** The browser's native `#demo` scroll behaviour will work once the element exists. If the element hasn't rendered yet (lazy not loaded), the browser scroll simply won't find it — same outcome as today.

---

## 2. Fix Impact

### Change: `<button>` → `<a>`

```jsx
// BEFORE:
<button onClick={() => onDemo()} data-testid="hero-demo-btn" className="...">

// AFTER:
<a
  href="#demo"
  onClick={(e) => { e.preventDefault(); onDemo(); }}
  data-testid="hero-demo-btn"
  className="...">
```

**When JS works:** `e.preventDefault()` blocks the `href="#demo"` browser navigation. `onDemo()` fires. Smooth scroll to demo section. **Zero behaviour change.**

**When JS slow/failed:** `href="#demo"` resolves natively. Browser jumps to `id="demo"`. User reaches form. (No smooth scroll, but form is accessible.)

**When JS and `id="demo"` both missing:** `href="#demo"` scroll fails silently — same as current behaviour.

---

## 3. Styling Notes

`<a>` and `<button>` render identically with Tailwind classes. No visual change. The `group` class for hover effects works on `<a>` elements.

`<a>` without explicit `target` defaults to same-tab. No change in navigation context.

---

## 4. SEO Side Note

`<a href="#demo">` is semantically correct for an on-page anchor link. Google parses `<a>` more naturally than `<button>` for internal navigation signals. Minor positive.

---

## 5. Risk Assessment

| Risk | Likelihood | Notes |
|---|---|---|
| Visual regression | None | Same classes, same children |
| `group` hover class breaks on `<a>` | None | Tailwind `group` works on any element |
| Double navigation (both href and onClick fire) | None | `e.preventDefault()` blocks href when JS runs |
| `data-testid` tests break | None | Same testid preserved |

---

## 6. Cross-Impact

- **CR-160 (Reveal):** The `id="demo"` div is inside `<Reveal delay={0.1}>` — even with href fallback, if Reveal is at `opacity: 0`, the form is invisible on arrival. CR-157 + CR-160 should be implemented together for maximum effect.
- **No other CRs affected.**

*Impact analysis written 2026-08-26.*
