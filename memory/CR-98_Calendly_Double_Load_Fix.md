# CR-98 — Consolidate Calendly Widget Double-Load

**Type:** Performance Fix / Code Quality  
**Date Raised:** 2026-08-20  
**Raised By:** Code Investigation  
**Status:** IMPLEMENTED — 2026-08-21
**Priority:** MEDIUM  
**Plan ID:** M10  
**Effort:** 30 min  
**Improves:** Perf · Reliability  
**Scope:** `frontend/src/components/site/DemoForm.jsx`, `frontend/src/components/site/CalendlyInline.jsx`, new `frontend/src/lib/calendly.js`  
**Related:** CR-50 (Calendly overlay CSS fix)

---

## 1. Problem Statement

Both `DemoForm.jsx` and `CalendlyInline.jsx` contain independent `loadCalendlyScript()` functions that both fetch and inject `https://assets.calendly.com/assets/external/widget.js`. On pages where both components could exist, this causes:
1. Duplicate network request for the Calendly script
2. Potential race condition if both try to inject the script simultaneously
3. Code duplication to maintain in two places

---

## 2. Root Cause

**`frontend/src/components/site/DemoForm.jsx` (lines 28–38):**
```js
function loadCalendlyScript() {
  const SRC = "https://assets.calendly.com/assets/external/widget.js";
  return new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const ex = document.querySelector(`script[src="${SRC}"]`);
    if (ex) { ex.addEventListener("load", () => resolve()); return; }
    // ... creates new <script>
  });
}
```

**`frontend/src/components/site/CalendlyInline.jsx` (line 5):**
```js
const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
// ... similar load logic
```

Duplicate logic. No shared singleton.

---

## 3. Exact Changes Required

### Change 1 — Create `frontend/src/lib/calendly.js`
```js
import { ensureCalendlyCss } from "./calendlyCss";

const CALENDLY_SCRIPT = "https://assets.calendly.com/assets/external/widget.js";
let loadPromise = null;

/**
 * Loads the Calendly widget script exactly once (singleton promise).
 * Subsequent calls return the same promise — no duplicate network requests.
 */
export function loadCalendly() {
  if (loadPromise) return loadPromise;
  ensureCalendlyCss();
  loadPromise = new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const existing = document.querySelector(`script[src="${CALENDLY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = CALENDLY_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
  return loadPromise;
}
```

### Change 2 — Update `DemoForm.jsx`
Replace the internal `loadCalendlyScript()` function and its `ensureCalendlyCss()` call with:
```js
import { loadCalendly } from "@/lib/calendly";
// Remove the internal loadCalendlyScript function and ensureCalendlyCss import
// Replace all loadCalendlyScript() calls with loadCalendly()
```

### Change 3 — Update `CalendlyInline.jsx`
Same import swap:
```js
import { loadCalendly } from "@/lib/calendly";
// Use loadCalendly() instead of internal load logic
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/lib/calendly.js` | New singleton loader (create) |
| `frontend/src/components/site/DemoForm.jsx` | Import from lib/calendly; remove internal loader |
| `frontend/src/components/site/CalendlyInline.jsx` | Import from lib/calendly; remove internal loader |

---

## 5. Definition of Done

- [ ] Calendly widget.js appears only once in Network tab regardless of how many components are on page
- [ ] DemoForm flow works end-to-end (OTP → Calendly booking)
- [ ] CalendlyInline renders correctly on /demo page
- [ ] No race condition — both components get the same resolved promise

---

*CR-98 registered 2026-08-20. Source: Code investigation · Plan ID M10.*
