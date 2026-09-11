# CR-174 — Line-by-Line Implementation Plan
## `#demo` Missing `scroll-margin-top` — Form Hides Under Sticky Nav

**File count:** 1
**Lines changed:** 1 (add one CSS class)
**Rebuild required:** Yes
**Risk:** NONE — CSS-only, activates only during anchor scroll

---

## Pre-flight checks

```bash
# 1. Confirm current state — no scroll-mt on id="demo"
grep -n "id=\"demo\"" /app/frontend/src/components/home/CtaDemo.jsx
# Expected: line 54 — <div id="demo" data-testid="demo-anchor"> (no scroll-mt class)

# 2. Confirm pattern used on all other demo anchors (consistency check)
grep -rn "id=\".*-demo\"\|id=\"demo\"" /app/frontend/src/
# Expected: all OTHER demo divs have className="scroll-mt-20", only CtaDemo is missing it

# 3. Confirm navbar height to validate scroll-mt-20 = 80px is sufficient
grep -n "h-\[72px\]\|h-\[64px\]" /app/frontend/src/components/site/Navbar.jsx | head -3
# Expected: h-[72px] → scroll-mt-20 (80px) gives 8px breathing room ✓
```

---

## File 1 of 1 — `frontend/src/components/home/CtaDemo.jsx`

### Change 1 — Line 54: Add `className="scroll-mt-20"` to `id="demo"` div

```
BEFORE (L54):
          <div id="demo" data-testid="demo-anchor">

AFTER (L54):
          <div id="demo" className="scroll-mt-20" data-testid="demo-anchor">
```

**Exact diff:**
```diff
-          <div id="demo" data-testid="demo-anchor">
+          <div id="demo" className="scroll-mt-20" data-testid="demo-anchor">
```

**Why `scroll-mt-20`:**
- `scroll-mt-20` = `scroll-margin-top: 5rem = 80px`
- Sticky nav height = `h-[72px]` = 72px
- 80px clears the nav with 8px visual breathing room
- Matches exact same class used on ALL other demo anchors sitewide

**DOM context — what scroll-mt-20 does here:**
```
When browser scrolls to id="demo":
BEFORE: top of <div id="demo"> aligns with viewport top
        → sticky nav (72px) overlaps the form card top ← BAD

AFTER:  top of <div id="demo"> aligns 80px BELOW viewport top
        → sticky nav clears, full form card visible ← CORRECT
```

**Reveal wrapper — no interference:**
Reveal renders `<div ref={ref} style={{opacity, transform}}>` as parent.
`scroll-mt-20` is on the child `id="demo"` div — this is the element the browser
targets for anchor scrolling. Parent Reveal div is not the scroll target.

---

## Pages and triggers affected

Only homepage (`/`). `CtaDemo.jsx` is imported exclusively by `Home.jsx`.

All 4 scroll-to-demo entry points on homepage now work correctly:

| Trigger | Source | Behaviour after fix |
|---|---|---|
| "Book a Free Demo" primary CTA | `Hero.jsx` L46 `href="#demo"` | Form fully visible ✓ |
| Sticky mobile CTA bar | `StickyMobileCta.jsx` | Scrolls to form, nav clears ✓ |
| Footer "Book a Free Demo" button | `Footer.jsx` L21 `window.location.href = "/#demo"` | Form fully visible ✓ |
| Navbar demo button (non-homepage fallback) | `Navbar.jsx` L132 | Form fully visible ✓ |

---

## Verification (post-rebuild)

```bash
# 1. Confirm class in prerendered HTML
grep "scroll-mt-20" /app/frontend/build/index.html | grep "demo-anchor"
# Expected: <div id="demo" class="scroll-mt-20" data-testid="demo-anchor">

# 2. Confirm it does NOT appear on other pages (CtaDemo not used elsewhere)
grep -r "demo-anchor" /app/frontend/build/ | grep -v "build/index.html" | wc -l
# Expected: 0 — only homepage has id="demo" from CtaDemo
```

---

## Rollback

```
Remove className="scroll-mt-20" from CtaDemo.jsx L54. Rebuild.
```

*Plan written 2026-08-30.*
