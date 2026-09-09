# CR-130 — Lazy-Load CmsAdminLayer to Reduce Unused JavaScript (52 KiB)

**Type:** Performance / Bundle size
**Date Raised:** 2026-08-24
**Status:** 🔲 OPEN
**Priority:** P1
**Effort:** ~5 lines
**Improves:** "Reduce unused JavaScript — 52 KiB" Lighthouse diagnostic · TBT
**Score gain:** +2–3 pts
**Scope:** `frontend/src/App.js`
**Related:** CR-115 (React.lazy for home sections — done), CR-124 (hydrateRoot)

---

## Problem Statement

Lighthouse flags: **"Reduce unused JavaScript — Est savings of 52 KiB"**

`CmsAdminLayer` is statically imported in `App.js` and loaded on **every page visit for every visitor**, including regular users who never interact with the CMS:

```js
// App.js line 25 — always loaded
import CmsAdminLayer from "@/components/cms/CmsAdminLayer";
```

`CmsAdminLayer` contains:
- The full admin toolbar UI (Editing / Preview badges, Publish / Discard buttons)
- Lucide icons (Pencil, Eye, EyeOff, LogOut, X, Check)
- Admin login modal (TextFieldModal, ImageModal, ListModal)
- All CMS editor components

**99.9% of visitors are not admins.** They download and parse this code on every page load but never see it rendered (CmsAdminLayer returns `null` for non-admins). This contributes directly to the "52 KiB unused JavaScript" Lighthouse diagnostic.

---

## Root Cause

`CmsAdminLayer` checks `cms.isAdmin` to decide whether to render. But the check happens at **runtime** — the code is already downloaded and parsed before React knows the user is not an admin.

---

## Fix

Lazy-load `CmsAdminLayer` so the code only downloads if the user is an admin (has a CMS token in localStorage):

```js
// App.js — BEFORE
import CmsAdminLayer from "@/components/cms/CmsAdminLayer";

// App.js — AFTER
import { lazy, Suspense } from "react";
const CmsAdminLayer = lazy(() => import("@/components/cms/CmsAdminLayer"));
```

And in JSX:
```jsx
// BEFORE
<CmsAdminLayer />

// AFTER
<Suspense fallback={null}>
  <CmsAdminLayer />
</Suspense>
```

**Why safe:** `CmsAdminLayer` already returns `null` for non-admins. Making it lazy means it simply doesn't download until React loads the chunk. For non-admins, React encounters the Suspense boundary, the chunk never loads, `fallback={null}` is shown — functionally identical.

For admins: the chunk downloads after hydration. The admin toolbar appears ~100–200ms after page load instead of immediately. Acceptable for an internal tool.

**Bundle impact:** `CmsAdminLayer` + its Lucide icon imports + editor modals = estimated **40–55 KiB** moved out of the initial bundle. This directly addresses the 52 KiB diagnostic.

---

## Additional: WhatsApp FAB

`WhatsAppFab` is imported statically even when `REACT_APP_WHATSAPP_ENABLED=false`:
```js
// App.js line 27
import WhatsAppFab from "@/components/site/WhatsAppFab";
```

With env = `false`, the component is never rendered but is still bundled. Small additional saving (~3–5 KiB) from making this conditional or lazy.

---

## Files Changed

| File | Change |
|---|---|
| `src/App.js` | `CmsAdminLayer` → `lazy(() => import(...))` + `<Suspense fallback={null}>` |
| `src/App.js` | `WhatsAppFab` → conditional lazy import when env is enabled |

---

## Definition of Done

- [ ] Lighthouse "Reduce unused JavaScript" savings drop from 52 KiB to < 15 KiB
- [ ] `CmsAdminLayer` chunk not in Network tab for non-admin visitors
- [ ] CMS admin toolbar still appears and works correctly after login at `/leads`
- [ ] No visual regression on any page for regular visitors

---

*CR-130 registered 2026-08-24. CmsAdminLayer identified as primary contributor to unused JS 52 KiB on homepage.*
