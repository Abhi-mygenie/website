# CR-98 — Line-by-Line Implementation Plan: Calendly Singleton Loader
**Written:** 2026-08-21  
**Impact analysis:** CR-98 section in this session  
**Files changed:** 4 (1 new + 3 edits)  
**Execution order:** Step 1 → Steps 2+3+4 (Step 1 must exist before imports can resolve)  
**Estimated time:** 20 min  
**Hot-reload:** All steps auto-reload

---

## Pre-flight

- [ ] `sudo supervisorctl status` — both services running
- [ ] Confirm Calendly booking flow currently works on `/petpooja-alternative` (open QuickDemoSheet → fill form → OTP → Calendly stage shows "Book My Slot" button) — baseline

---

## STEP 1 — Create `src/lib/calendly.js` (new file)

**This step must complete before Steps 2, 3, 4. All three import from this file.**

**New file: `frontend/src/lib/calendly.js`**

```js
/**
 * CR-98 — Singleton Calendly script loader.
 *
 * Problem: DemoForm.jsx, CalendlyInline.jsx, and PetpoojaAlternative.jsx each
 * had independent loadCalendly* functions. If two components race to load
 * widget.js simultaneously (before window.Calendly is set), both could inject
 * duplicate <script> tags.
 *
 * Fix: one module-level promise (_loadPromise). All callers share it. First
 * call loads the script; subsequent calls return the same resolved promise.
 * No duplicate network request, no race condition.
 *
 * CR-50 safety: ensureCalendlyCss() is called inside the singleton so the
 * overlay CSS is injected exactly once, regardless of which component calls first.
 */
import { ensureCalendlyCss } from "./calendlyCss";

const CALENDLY_SRC = "https://assets.calendly.com/assets/external/widget.js";
let _loadPromise = null;

export function loadCalendly() {
  if (_loadPromise) return _loadPromise;
  ensureCalendlyCss();
  _loadPromise = new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const existing = document.querySelector(`script[src="${CALENDLY_SRC}"]`);
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = CALENDLY_SRC; s.async = true; s.onload = () => resolve();
    document.body.appendChild(s);
  });
  return _loadPromise;
}
```

**Key decisions in this file:**
- `_loadPromise` is module-level — shared across all importers in the same page load
- `ensureCalendlyCss()` called ONCE inside the singleton — CR-50 protection preserved ✅
- No `ensureCalendlyCss` import needed anywhere else after this
- Import path `"./calendlyCss"` (relative) — same directory as `calendlyCss.js` in `src/lib/`

**Checkpoint after Step 1:**
- Hot-reload compiles clean
- No usage yet — zero behaviour change at this point
- Can verify: `ls /app/frontend/src/lib/` — `calendly.js` appears

**Rollback:** Delete the new file.

---

## STEP 2 — `DemoForm.jsx`: Replace internal loader

**File:** `frontend/src/components/site/DemoForm.jsx`  
**3 sub-changes in this file — do together in one pass.**

### 2a — Replace `ensureCalendlyCss` import with `loadCalendly` import (line 11)

**Before (exact, line 11):**
```js
import { ensureCalendlyCss } from "@/lib/calendlyCss";
```

**After:**
```js
import { loadCalendly } from "@/lib/calendly";
```

**Why:** `ensureCalendlyCss` was imported here only to be called inside `loadCalendlyScript()`. That function is being deleted. The new singleton handles CSS internally.

---

### 2b — Delete `loadCalendlyScript()` function (lines 23–37)

**Before (exact, lines 23–37):**
```js
function loadCalendlyScript() {
  // CR-50: ensure our overlay/popup CSS is present in the parent document.
  // Calendly's widget.js no longer self-injects it (as of 2026-07-05), which
  // was making the popup invisible (position:static at page bottom).
  ensureCalendlyCss();
  const SRC = "https://assets.calendly.com/assets/external/widget.js";
  return new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const ex = document.querySelector(`script[src="${SRC}"]`);
    if (ex) { ex.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = SRC; s.async = true; s.onload = () => resolve();
    document.body.appendChild(s);
  });
}
```

**After:** Delete entirely. The blank line between `loadCalendlyScript` and `brandedUrl` (line 38) stays — just remove lines 23–37.

**Why safe to delete:** `loadCalendlyScript` is module-private (not exported) and its only caller is `openPopup()` at line 185. That call is updated in 2c.

---

### 2c — Replace call site (line 185)

**Before (exact, line 185):**
```js
      await loadCalendlyScript();
```

**After:**
```js
      await loadCalendly();
```

**Why:** One-for-one swap. Same async behaviour. `openPopup()` already `await`s the loader — same pattern, now shared singleton.

---

**Checkpoint after Step 2:**
- Hot-reload compiles clean
- `openPopup()` still works: mobile Calendly booking flow triggers correctly
- `ensureCalendlyCss` no longer in DemoForm.jsx — `grep ensureCalendlyCss DemoForm.jsx` returns nothing
- `loadCalendlyScript` no longer in DemoForm.jsx — `grep loadCalendlyScript DemoForm.jsx` returns nothing

**Rollback:** Restore line 11, re-add the `loadCalendlyScript()` function at lines 23–37, revert line 185.

---

## STEP 3 — `CalendlyInline.jsx`: Remove internal loader + orphaned const

**File:** `frontend/src/components/site/CalendlyInline.jsx`  
**⚠️ Name collision note:** The internal function is ALSO named `loadCalendly()`. Steps 3a and 3b must be done together — deleting the internal function and adding the import simultaneously avoids a window where the name is undefined.

### 3a — Replace `ensureCalendlyCss` import with `loadCalendly` import (lines 1–5)

**Before (exact, lines 1–5):**
```js
import { useEffect, useRef } from "react";
import { pushLead, newEventId } from "@/lib/gtm";
import { ensureCalendlyCss } from "@/lib/calendlyCss";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
```

**After:**
```js
import { useEffect, useRef } from "react";
import { pushLead, newEventId } from "@/lib/gtm";
import { loadCalendly } from "@/lib/calendly";

```

**What changed:**
- Line 3: `ensureCalendlyCss` import → `loadCalendly` import
- Line 5: `const SCRIPT_SRC = "..."` **deleted** — this constant was only used inside the internal `loadCalendly()` function which is being deleted
- Blank line 4 kept (cosmetic)

---

### 3b — Delete internal `loadCalendly()` function (lines 7–24)

**Before (exact, lines 7–24):**
```js
function loadCalendly() {
  // CR-50: defensive parity with DemoForm — the same CSS must be present even
  // if a page mounts CalendlyInline without going through DemoForm.
  ensureCalendlyCss();
  return new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}
```

**After:** Delete entirely (lines 7–24 including the trailing blank line).

**Why safe:** The function's only caller is line 75 (`loadCalendly().then(...)`). After deleting the internal function and importing the shared one with the same name, line 75 resolves to the imported singleton — **zero change to the call site**.

---

### Step 3 — call site unchanged

**Line 75 (unchanged):**
```js
    loadCalendly().then(() => {
```
This already calls `loadCalendly()` — now it references the imported singleton instead of the deleted internal function. No edit needed.

---

**Checkpoint after Step 3:**
- Hot-reload compiles clean
- Desktop Calendly inline widget still initialises and renders correctly
- `grep "ensureCalendlyCss\|SCRIPT_SRC\|function loadCalendly" CalendlyInline.jsx` → nothing

**Rollback:** Restore original imports (lines 1–5), re-add `loadCalendly()` function (lines 7–24).

---

## STEP 4 — `PetpoojaAlternative.jsx`: Remove sheet loader

**File:** `frontend/src/pages/PetpoojaAlternative.jsx`  
**3 sub-changes — do together.**

### 4a — Replace `ensureCalendlyCss` import with `loadCalendly` import (line 16)

**Before (exact, line 16):**
```js
import { ensureCalendlyCss } from "@/lib/calendlyCss";
```

**After:**
```js
import { loadCalendly } from "@/lib/calendly";
```

---

### 4b — Delete `loadCalendlyForSheet()` function (lines 52–63)

**Before (exact, lines 52–63):**
```js
function loadCalendlyForSheet() {
  ensureCalendlyCss();
  const SRC = "https://assets.calendly.com/assets/external/widget.js";
  return new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const ex = document.querySelector(`script[src="${SRC}"]`);
    if (ex) { ex.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = SRC; s.async = true; s.onload = () => resolve();
    document.body.appendChild(s);
  });
}
```

**After:** Delete entirely (lines 52–63 + blank line 64).

**Why safe:** Only caller is `openCalendly()` at line 165 — updated in 4c.

---

### 4c — Replace call site (line 165)

**Before (exact, line 165):**
```js
      await loadCalendlyForSheet();
```

**After:**
```js
      await loadCalendly();
```

---

**Checkpoint after Step 4:**
- Hot-reload compiles clean
- QuickDemoSheet Calendly stage still works: "Book My Slot" button triggers popup
- `grep "ensureCalendlyCss\|loadCalendlyForSheet" PetpoojaAlternative.jsx` → nothing

**Rollback:** Restore line 16 import, re-add `loadCalendlyForSheet()` function, revert line 165.

---

## Post-Implementation Validation

### Source checks
- [ ] `grep -r "loadCalendlyScript\|loadCalendlyForSheet" src/` → nothing (both deleted)
- [ ] `grep -r "ensureCalendlyCss" src/` → only `src/lib/calendly.js` and `src/lib/calendlyCss.js` (no longer in DemoForm, CalendlyInline, PetpoojaAlternative)
- [ ] `grep -r "loadCalendly" src/` → 4 files: `lib/calendly.js` (export), `DemoForm.jsx` (import+call), `CalendlyInline.jsx` (import+call), `PetpoojaAlternative.jsx` (import+call)
- [ ] `cat src/lib/` → shows `calendly.js` exists

### Functional checks (booking flow end-to-end)
- [ ] `/solutions/restaurants` desktop: fill DemoForm → OTP → CalendlyInline renders correctly
- [ ] `/solutions/restaurants` mobile: fill DemoForm → OTP → "Book My Slot" opens Calendly popup
- [ ] `/petpooja-alternative` mobile: open QuickDemoSheet → fill form → OTP → "Book My Slot" opens popup
- [ ] `/petpooja-alternative` desktop: main VspCta DemoForm → OTP → CalendlyInline renders

### Singleton verification (DevTools Network tab)
- [ ] Open DevTools → Network → filter `widget.js`
- [ ] Navigate to any page with a DemoForm
- [ ] Complete OTP → reach Calendly stage
- [ ] Exactly **1** request for `widget.js` in Network tab (not 2)

### CR-50 regression check (critical)
- [ ] On mobile: Calendly popup appears in the centre of the screen (fixed, z-9999)
- [ ] NOT: popup appearing at the bottom of the page as a static element
- [ ] This confirms `ensureCalendlyCss()` is firing correctly from the new singleton

---

## Execution Summary Table

| Step | File | Change | Lines |
|---|---|---|---|
| 1 | `src/lib/calendly.js` (NEW) | Create singleton loader | — |
| 2a | `DemoForm.jsx` | Swap import: `ensureCalendlyCss` → `loadCalendly` | Line 11 |
| 2b | `DemoForm.jsx` | Delete `loadCalendlyScript()` function | Lines 23–37 |
| 2c | `DemoForm.jsx` | Replace `loadCalendlyScript()` call | Line 185 |
| 3a | `CalendlyInline.jsx` | Swap import + remove `SCRIPT_SRC` const | Lines 1–5 |
| 3b | `CalendlyInline.jsx` | Delete internal `loadCalendly()` function | Lines 7–24 |
| 3c | `CalendlyInline.jsx` | Call site unchanged — already `loadCalendly()` | Line 75 |
| 4a | `PetpoojaAlternative.jsx` | Swap import: `ensureCalendlyCss` → `loadCalendly` | Line 16 |
| 4b | `PetpoojaAlternative.jsx` | Delete `loadCalendlyForSheet()` function | Lines 52–63 |
| 4c | `PetpoojaAlternative.jsx` | Replace `loadCalendlyForSheet()` call | Line 165 |

**Mandatory order:** Step 1 before Steps 2/3/4. Steps 2, 3, 4 are independent of each other.  
**Steps 2a+2b+2c**: Do together (same file, one pass).  
**Steps 3a+3b**: Do together — name collision means internal function and import must swap atomically.  
**Steps 4a+4b+4c**: Do together (same file, one pass).

---

*Plan written 2026-08-21. All line numbers verified against live files. No code changes made.*
