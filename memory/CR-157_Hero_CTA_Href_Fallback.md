# CR-157 — Hero.jsx "Book a Free Demo" Button: Add href Fallback

**Type:** Resilience / Conversion Fix
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P2
**Finding:** #4 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

`Hero.jsx` L45–52 renders the primary homepage CTA as a plain `<button>`:

```jsx
<button
  onClick={() => onDemo()}
  data-testid="hero-demo-btn"
  className="...">
  Book a Free Demo
</button>
```

**No `href`. If JavaScript fails, stalls, or hasn't loaded yet, clicking this button does nothing.** For the primary conversion CTA on the homepage, this is a single point of failure.

By contrast:
- The Navbar CTA on non-homepage pages already uses `<a href="/#demo" onClick={handleDemoCtaClick}>` with smart anchor fallback ✅
- The mobile Navbar CTA uses `<a href="/#demo" ...>` ✅
- Only Hero.jsx's primary button is a pure `<button>` ❌

---

## 2. Fix — Change to `<a>` with href + onClick override

**File:** `frontend/src/components/home/Hero.jsx` L45–52

```jsx
// BEFORE:
<button
  onClick={() => onDemo()}
  data-testid="hero-demo-btn"
  className="group bg-brand-green...">
  <EditableText id="home.hero.cta_primary" fallback="Book a Free Demo" />
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</button>

// AFTER:
<a
  href="#demo"
  onClick={(e) => { e.preventDefault(); onDemo(); }}
  data-testid="hero-demo-btn"
  className="group bg-brand-green...">
  <EditableText id="home.hero.cta_primary" fallback="Book a Free Demo" />
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</a>
```

**Behaviour when JS works:** `e.preventDefault()` stops the `href="#demo"` navigation. `onDemo()` fires — same as before.  
**Behaviour when JS fails/slow:** `href="#demo"` resolves — browser scrolls to `id="demo"` on the page (the CtaDemo section anchor). User reaches the form.

---

## 3. Verify the `id="demo"` anchor exists on homepage

The homepage has `<CtaDemo />` section. Check that it has `id="demo"`:

```bash
grep -n 'id="demo"\|id=.demo.' /app/frontend/src/pages/Home.jsx
```

If the anchor ID is different (e.g., `id="top"` or `id="hero"`), align the `href` accordingly.

---

## 4. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/components/home/Hero.jsx` | Change `<button>` → `<a href="#demo" onClick={e => {e.preventDefault(); onDemo();}}>` | L45–52: 2 lines changed |

---

## 5. Definition of Done

- [ ] Hero primary CTA is `<a>` element with `href="#demo"` (not a `<button>`)
- [ ] Click still calls `onDemo()` (scroll to demo section) — zero behaviour change when JS works
- [ ] If JS is disabled, clicking CTA scrolls to demo section on the page
- [ ] `data-testid="hero-demo-btn"` preserved

*CR-157 registered 2026-08-26. Source: UX/SEO Audit Finding #4.*
