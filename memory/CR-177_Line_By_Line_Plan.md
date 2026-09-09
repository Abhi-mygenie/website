# CR-177 — Line-by-Line Implementation Plan
## AutoFocus Name Field on DemoForm (Homepage)

**Plan written:** 2026-09-01 — Planning Agent
**Impact analysis:** `/app/memory/CR-177_AutoFocus_ImpactAnalysis.md`
**Status:** READY — no code changed. Awaiting "go ahead".
**Files touched:** 1 (`src/pages/Home.jsx`)
**Effort:** ~5 minutes
**Rebuild required:** ❌ No — Home.jsx hot-reloads

---

## Pre-flight Checklist

Run before touching any file:

```bash
# A. Both services running
sudo supervisorctl status
# Expected: backend RUNNING, frontend RUNNING

# B. Confirm current state — name field does NOT autofocus at page load
# Open homepage in browser, observe: no input is focused when page loads
# Open browser DevTools → Console — confirm no errors

# C. Confirm the target testid exists in the live DOM
# DevTools → Elements → search for: demo-input-name
# Expected: 1 match — <input data-testid="demo-input-name" ...>

# D. Confirm the exact lines to be changed
sed -n '20,29p' /app/frontend/src/pages/Home.jsx
# Expected: scrollToDemo function body is a single scrollIntoView call
```

---

## STEP 1 — Edit `src/pages/Home.jsx` (CR-177)

**File:** `src/pages/Home.jsx`
**Total lines:** 54
**Change position:** Lines 22–24
**Changes:** 1 (add 3 lines inside existing function body)

---

### Exact before/after

**Current lines 22–24 (full context lines 20–29 shown for verification):**
```js
  const [sector, setSector] = useState("");

  const scrollToDemo = useCallback(() => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSectorDemo = useCallback((name) => {
    setSector(name);
    setTimeout(scrollToDemo, 60);
  }, [scrollToDemo]);
```

**After (lines 22–27 — only the `scrollToDemo` body changes):**
```js
  const [sector, setSector] = useState("");

  const scrollToDemo = useCallback(() => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      document.querySelector('[data-testid="demo-input-name"]')?.focus();
    }, 450);
  }, []);

  const handleSectorDemo = useCallback((name) => {
    setSector(name);
    setTimeout(scrollToDemo, 60);
  }, [scrollToDemo]);
```

**What changed — line by line:**

| Before | After | Notes |
|---|---|---|
| Line 24: `}, []);` | Line 27: `}, []);` | Closing brace/array pushed down by 3 lines |
| — | Line 25: `setTimeout(() => {` | New |
| — | Line 26: `  document.querySelector('[data-testid="demo-input-name"]')?.focus();` | New |
| — | Line 27: `}, 450);` | New — closes the setTimeout |

**Why these 3 exact lines:**

| Choice | Why |
|---|---|
| `setTimeout(..., 450)` | `scrollIntoView({ behavior: "smooth" })` takes ~400ms on most browsers. Focusing before scroll completes causes the browser to fight itself — it interrupts the smooth scroll and snaps. 450ms gives a comfortable 50ms buffer after the animation finishes. |
| `document.querySelector('[data-testid="demo-input-name"]')` | Stable, specific selector. DemoForm.jsx line 325: `data-testid={\`demo-input-${key}\`}` where key="name" → `data-testid="demo-input-name"`. Confirmed present. |
| `?.focus()` | Optional chain: if CtaDemo lazy component has not mounted yet (edge case: user clicks CTA within ~100ms of page load), querySelector returns null — silently does nothing. No error, no crash. |
| `useCallback` dependency array unchanged `[]` | The added lines use only `document` (global, not reactive). No new reactive values referenced inside the callback. ESLint react-hooks/exhaustive-deps: no violation. |

**What does NOT change:**

- `handleSectorDemo` (lines 26–29, now 30–33) — identical to current. It calls `setTimeout(scrollToDemo, 60)` — this still calls the same `scrollToDemo`, which now also schedules a focus. This is correct: clicking a sector CTA also scrolls to the form and should focus the name field.
- All JSX in `return (...)` — completely untouched.
- Every other file — not touched.
- DemoLanding.jsx (`/demo` page) — not touched. Autofocus there works via `autoFocusName` prop at mount. Different mechanism, different page.

**Checkpoint after Step 1:**
- Hot-reload fires within 1–2s (Home.jsx is a direct import, not lazy — instant reload)
- Open homepage in browser
- Click "Book a Free Demo" (hero button, OR navbar button, OR StickyMobileCta)
- Page scrolls to the form
- After scroll settles (~450ms): name input gains blue focus ring
- Type immediately — characters appear in name field without clicking into it
- No console errors

**Rollback:**
Remove the 3 added lines. Revert `scrollToDemo` to its original single-line body.

---

## Post-Implementation Validation Checklist

### Desired behaviour — must PASS
- [ ] Page loads on `/` — name field does NOT have focus, no blue ring (confirms: not autofocusing at mount)
- [ ] Click hero "Book a Free Demo" button → smooth scroll to form → name field focused after scroll settles
- [ ] Click Navbar "Book a Free Demo" button → same outcome
- [ ] Click StickyMobileCta "Book a Free Demo" (mobile viewport, 390px) → same outcome
- [ ] Click a sector card in the sector selector (e.g. "Restaurants") → page scrolls to form → name field focused
- [ ] After focus: type immediately → characters appear in name field without clicking first

### Regression — must still PASS
- [ ] Visit `/demo` (DemoLanding page) → name field autofocuses at page load (different mechanism: `autoFocusName` prop — must not be broken)
- [ ] Full form submission on homepage still works end-to-end (name focus does not interfere with form state)
- [ ] DevTools Console → zero errors on homepage

### Out-of-scope — confirm NOT changed
- [ ] Sector pages (`/solutions/restaurants` etc.) — name field does NOT autofocus at page load (these pages are not affected)

---

## Execution Summary

| Step | File | Lines changed | Change description | Hot-reload? | Reversible? |
|---|---|---|---|---|---|
| 1 | `src/pages/Home.jsx` | 22–24 → 22–27 | Add `setTimeout` + `?.focus()` inside `scrollToDemo` | ✅ Yes | ✅ Yes |

**No rebuild. No restart. One file. Three new lines.**

---

## Out of Scope

- Sector pages (`SectorPage.jsx`) — the UAT audit finding was specifically about the homepage CTA. Sector pages have their own DemoForm instances but no equivalent `scrollToDemo` handler.
- The `autoFocusName` prop on DemoForm — still used and working for the `/demo` landing page. Untouched.
- Other landing pages (PetpoojaAlternative, RestaurantBillingSoftware, etc.) — all have DemoForm embedded directly without a scroll handler. Out of scope.

---

*Plan written 2026-09-01. Planning Agent. `src/pages/Home.jsx` read in full before writing. No code changed. Awaiting "go ahead".*
