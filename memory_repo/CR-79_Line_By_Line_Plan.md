# CR-79 — Line-by-Line Implementation Plan: NotFound Page (React side)
**Written:** 2026-08-21  
**Scope (agreed with backend team):**
- Frontend (us): NotFound.jsx + App.js wildcard change
- Backend: Nginx whitelist + HTTP 404 status for unknown routes
- _redirects: NOT changing — backend owns HTTP status via Nginx

**Files changed:** 2 (`NotFound.jsx` new + `App.js` 2 edits)  
**Execution order:** Step 1 → Steps 2+3 (file must exist before import)  
**Estimated time:** 20 min

---

## Pre-flight

- [ ] `sudo supervisorctl status` — both running
- [ ] Open `/some-fake-url` in browser — confirm it currently redirects to homepage (baseline behaviour to fix)

---

## STEP 1 — Create `frontend/src/pages/NotFound.jsx` (new file)

**File:** `frontend/src/pages/NotFound.jsx` (does not exist — create)

**Full file content:**
```jsx
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Seo from "@/components/site/Seo";

export default function NotFound() {
  return (
    <div className="bg-white" data-testid="not-found-page">
      <Seo
        title="Page Not Found | MyGenie POS"
        description="The page you're looking for doesn't exist."
        noindex={true}
      />
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center py-24 px-4">
        <div className="text-center max-w-md">
          <p
            className="font-display text-8xl font-bold text-brand-green leading-none"
            data-testid="not-found-code"
          >
            404
          </p>
          <h1
            className="font-display text-2xl sm:text-3xl font-bold text-brand-ink mt-6"
            data-testid="not-found-heading"
          >
            Page not found
          </h1>
          <p className="text-brand-muted mt-3 leading-relaxed">
            The page you're looking for doesn't exist or may have moved.
          </p>
          <Link
            to="/"
            data-testid="not-found-home-btn"
            className="mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.3)]"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

**Design decisions:**
- `Navbar` — no `onDemo` prop passed. Navbar line 153 shows it falls back to `<a href="/#demo">` when `onDemo` is absent — "Book a Free Demo" still appears and works via href.
- `Footer` — no `onDemo` prop. Footer line 21 uses `window.location.href = "/#demo"` fallback — works correctly.
- `noindex={true}` — 404 page should not be indexed by Google.
- Large "404" in brand green — on-brand, immediately clear.
- `<Link to="/">` — React Router client-side navigation back to homepage, no full page reload.
- `data-testid` on key elements — for testing agent validation.

**What NOT included (intentionally):**
- No sticky mobile CTA bar (404 page doesn't need booking conversion)
- No hero section, no trust band — minimal and focused

**Checkpoint after Step 1:**
- Hot-reload compiles clean (component is created but not yet used)
- No visual change to any existing page

**Rollback:** Delete the file.

---

## STEP 2 — `App.js`: Add `NotFound` lazy import (line 23)

**File:** `frontend/src/App.js`

**Before (exact, lines 22–23):**
```js
const DemoLanding         = lazy(() => import("@/pages/DemoLanding"));
const PaymentSuccess      = lazy(() => import("@/pages/PaymentSuccess"));
```

**After:**
```js
const DemoLanding         = lazy(() => import("@/pages/DemoLanding"));
const PaymentSuccess      = lazy(() => import("@/pages/PaymentSuccess"));
const NotFound            = lazy(() => import("@/pages/NotFound"));
```

**Why lazy:** `NotFound` is accessed only when someone hits an invalid URL — rare by definition. Keeping it lazy is consistent with CR-72 code splitting pattern and correct for a page that most users will never see.

**Why after Step 1:** The file must exist before webpack can build the lazy chunk. Steps 2 and 3 can be done in the same save after Step 1.

---

## STEP 3 — `App.js`: Change wildcard route (line 95)

**File:** `frontend/src/App.js`

**Before (exact, lines 93–95):**
```jsx
            {/* Unknown -> home */}
            <Route path="*" element={<Navigate to="/" replace />} />
```

**After:**
```jsx
            {/* Unknown -> NotFound (CR-79) */}
            <Route path="*" element={<NotFound />} />
```

**What changed:**
- `<Navigate to="/" replace />` → `<NotFound />` — instead of silently redirecting to homepage, React now renders the 404 page
- Comment updated from "Unknown -> home" to "Unknown -> NotFound (CR-79)"
- URL bar stays at the bad URL (e.g. `/xyz-fake`) — user understands what happened

**Why `Navigate` is removed:**
The old behaviour was to redirect users to `/` — this hides the fact that the URL doesn't exist. Users were confused (URL changes without explanation). Google also saw homepage content at every URL. With NotFound, both problems are solved.

**Note:** The `Navigate` import in App.js line 3 is still needed — it's used by the REDIRECTS map on line 91 (`<Route key={from} path={from} element={<Navigate to={to} replace />} />`). Do NOT remove it.

---

## Post-Implementation Validation Checklist

### React-side (testable now in preview)
- [ ] Visit `/some-fake-url-xyz` → NotFound page renders (does NOT redirect to homepage)
- [ ] URL bar stays at `/some-fake-url-xyz` (no redirect)
- [ ] `data-testid="not-found-page"` present in DOM
- [ ] `data-testid="not-found-code"` shows "404"
- [ ] `data-testid="not-found-heading"` shows "Page not found"
- [ ] `data-testid="not-found-home-btn"` present — clicking goes to `/`
- [ ] Navbar renders with "Book a Free Demo" button (via href fallback)
- [ ] Footer renders
- [ ] No console errors

### Existing routes unaffected
- [ ] `/pricing` → loads Pricing page (not 404)
- [ ] `/solutions/restaurants` → loads SectorPage (not 404)
- [ ] `/fine-dining` → redirects to `/solutions/restaurants` (REDIRECTS map still works)

### HTTP status (testable AFTER backend Nginx change)
```bash
curl -I https://www.mygenie.online/some-fake-url-xyz
# Expected AFTER backend fix: HTTP/2 404
# Currently: HTTP/2 200 (this is what we're fixing)
```
```bash
curl -I https://www.mygenie.online/pricing
# Must remain: HTTP/2 200
```

---

## Execution Summary Table

| Step | File | Change | Depends on |
|---|---|---|---|
| 1 | `NotFound.jsx` (NEW) | Create full 404 page component | — |
| 2 | `App.js` line 23 | Add `NotFound` lazy import | Step 1 |
| 3 | `App.js` line 95 | Replace `Navigate to="/"` with `<NotFound />` | Step 1 |

**Steps 2 and 3 can be done in the same save (same file).**  
**`_redirects` — NOT changing.** Backend owns HTTP status via Nginx.

---

## What This Does NOT Fix (backend's job)
The React changes fix the **user experience** (proper 404 UI, URL stays unchanged).  
The **HTTP 404 status code** is backend's responsibility via Nginx. Until they deploy their Nginx change, visiting `/xyz` will still return HTTP 200 to Google — even though the user now sees the proper 404 page.

Both halves must be live together for Google to see proper 404 responses.

---

*Plan written 2026-08-21. Line numbers verified against live App.js (107 lines). No code changes made.*
