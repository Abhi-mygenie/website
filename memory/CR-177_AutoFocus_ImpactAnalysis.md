# CR-177 — Impact Analysis: AutoFocus on DemoForm Name Field
**Date:** 2026-09-01 — Planning Agent
**Status:** READY — awaiting implementation approval
**Effort:** 1 file · 2 lines changed · ~5 minutes

---

## What the CR Wants

When a user clicks "Book a Free Demo" on the homepage hero (or any CTA) and the page
scrolls down to the form, the cursor should land automatically in the Name field so the
user can start typing without clicking first.

---

## Files Read & Verified

| File | Lines | Key finding |
|---|---|---|
| `src/pages/Home.jsx` | 1–54 | `scrollToDemo` (line 22–24) only calls `scrollIntoView`. No focus. |
| `src/components/home/CtaDemo.jsx` | 1–62 | Calls `<DemoForm sector={sector} shortForm />` — no `autoFocusName` prop passed |
| `src/components/site/DemoForm.jsx` | 1–377 | `autoFocusName=false` default (line 54). `autoFocus={autoFocusName && key === "name"}` (line 324) |
| `src/pages/DemoLanding.jsx` | line 145 | `<DemoForm ... autoFocusName />` — this page passes it correctly |

---

## Root Cause (Exact Lines)

`src/pages/Home.jsx` lines 22–24:
```js
const scrollToDemo = useCallback(() => {
  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
}, []);
```

Scrolls but does not focus the name input. That is the entire gap.

---

## Why the Existing `autoFocusName` Prop Alone Is Not Enough

The HTML `autoFocus` attribute fires exactly once: when the element is mounted in the DOM.
CtaDemo (and its DemoForm) mounts at page load — long before the user clicks "Book a Free Demo".
Passing `autoFocusName={true}` statically to CtaDemo would autofocus the field at page load,
not on click — which would scroll the page to the form the moment someone lands on the homepage.
That is wrong UX.

The correct fix is imperative focus, triggered inside the click handler, not a prop.

---

## The Fix (1 File, 2 Lines)

**File:** `src/pages/Home.jsx`
**Target:** Lines 22–24

**Current:**
```js
const scrollToDemo = useCallback(() => {
  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
}, []);
```

**After:**
```js
const scrollToDemo = useCallback(() => {
  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    document.querySelector('[data-testid="demo-input-name"]')?.focus();
  }, 450);
}, []);
```

**What the 2 new lines do:**
- `setTimeout(..., 450)` — waits 450ms for the smooth scroll animation to finish before
  firing focus. Without the delay, the browser autoscrolls to the focused element which
  fights the smooth scroll and causes a jump.
- `document.querySelector('[data-testid="demo-input-name"]')?.focus()` — programmatically
  focuses the input. The `?.` means: if CtaDemo hasn't mounted yet (edge case: user clicks
  within 100ms of page load), this silently does nothing.

**Why `data-testid="demo-input-name"` is safe:**
DemoForm.jsx line 325: `data-testid={`demo-input-${key}`}` where key="name" →
`data-testid="demo-input-name"`. This testid exists as long as DemoForm renders its form
stage (which it always does initially). Confirmed stable.

---

## Scope: Does This Need to Change SectorPage or PetpoojaAlternative?

No. The UAT audit finding was specifically about the homepage. Sector pages and the VSP
page have their own sticky CTAs and scroll mechanisms — out of scope for this CR.

The DemoLanding page (`/demo`) already works correctly via `autoFocusName` prop (not touched).

---

## Risk Register

| Risk | Assessment | Verdict |
|---|---|---|
| `autoFocus` fires at page load (wrong UX) | Our fix uses imperative focus inside the click handler — never fires at page load | ✅ Zero risk |
| Scroll fights focus | 450ms delay lets scroll animation complete before focus fires | ✅ Handled |
| CtaDemo not yet mounted when user clicks | `?.focus()` silently no-ops if element not found | ✅ Graceful |
| Regression on `/demo` DemoLanding page | DemoLanding.jsx is not touched. It uses `autoFocusName` at mount which is correct for that page | ✅ Zero |
| Regression on homepage scroll CTA (Navbar "Book a Free Demo") | `scrollToDemo` is the same function used by Hero + Navbar + StickyMobileCta + Footer. All will now focus the field after scroll — which is the desired behavior on all of them | ✅ Correct |
| Multiple rapid clicks competing | Each click schedules a separate 450ms timeout. All focus the same input. No conflict, no crash | ✅ Benign |
| Hot-reload flicker | Home.jsx is not lazy-loaded — hot reload applies cleanly | ✅ Clean |
| Prerender impact | `scrollToDemo` is a browser click handler. Puppeteer never fires it. Zero prerender impact | ✅ None |
| No rebuild needed | Home.jsx hot-reloads — no `yarn build` required for this change alone | ✅ |

---

## Validation Checklist

- [ ] Open homepage. Do NOT click anything. Confirm form name field does NOT have focus at page load.
- [ ] Click hero "Book a Free Demo" → confirm page scrolls → confirm name field gets a blue border (focused) after scroll settles.
- [ ] Click Navbar "Book a Free Demo" → same outcome.
- [ ] Type immediately after clicking → characters appear in Name field without clicking into it.
- [ ] Visit `/demo` — confirm name field still autofocuses there (regression check).
- [ ] DevTools Console — no errors.

---

## Execution Summary

| Step | File | Change | Hot-reload? |
|---|---|---|---|
| 1 | `src/pages/Home.jsx` lines 23–24 | Add 3 lines inside `scrollToDemo` | ✅ Yes |

**Total: 1 file · 3 lines added · ~2 min to implement.**

---

*Impact analysis written 2026-09-01. Planning Agent. No code changed.*
