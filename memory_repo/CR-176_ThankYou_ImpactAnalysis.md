# CR-176 — Impact Analysis: /thank-you Page After Calendly Booking
**Date:** 2026-09-01 — Planning Agent
**Status:** READY — awaiting implementation approval
**Effort:** 5 files (1 new) · ~35 minutes

---

## What the CR Wants

After a user completes Calendly booking (Stage 3 of the demo flow), navigate them to a
dedicated `/thank-you` page instead of showing an inline confirmation card. This page:
1. Tells the user their booking is confirmed
2. Creates a retargeting segment ("visited /thank-you" = full booking funnel completion)
3. Gives a clean secondary Google Ads conversion destination (supplements Stage 2 GTM event)

**Owner-confirmed rule (DO NOT CHANGE):**
The `thankyou_conversion` GTM event fires at Stage 2 (OTP verify) — this is correct and
intentional. CR-176 adds a page navigate at Stage 3 (Calendly). The GTM event is untouched.

---

## Files Read & Verified

| File | Lines | Key finding |
|---|---|---|
| `src/components/site/DemoForm.jsx` | 1–377 | `markBooked()` at line 155. Called from desktop (line 270) and mobile (line 112). `form.name` is in scope. `useNavigate` not yet imported. |
| `src/App.js` | 1–135 | All pages use `lazy()`. BrowserRouter wraps everything (line 61). No `/thank-you` route exists yet. |
| `src/lib/seo.js` | 1–184 | No `/thank-you` entry in `PAGE_SEO`. |
| `scripts/prerender.js` | 1–146 | `extraRoutes = ["/demo", "/payment-success", "/404"]` on line 13. `/thank-you` not present. |
| `src/pages/NotFound.jsx` | 1–46 | Reference template for a simple standalone page with `data-testid="not-found-page"`. |

---

## Conversion Flow — Confirmed Unchanged

```
Stage 1: Form submit    →  pushLead("form_submitted")           →  GTM: form_submitted   ₹0
Stage 2: OTP verify     →  pushLead("book_demo")                →  GTM: thankyou_conversion  ₹200  ← DO NOT TOUCH
Stage 3: Calendly done  →  markBooked() → navigate("/thank-you")   (NEW)
```

The `navigate("/thank-you")` fires ONLY at Stage 3, AFTER Calendly scheduling confirms.
It does not touch, move, or duplicate any GTM event.

---

## Where markBooked() Is Called

Two paths inside DemoForm.jsx both converge on the same `markBooked()` function:

1. **Desktop (CalendlyInline.jsx callback):** `onScheduled={markBooked}` — line 270
2. **Mobile popup:** `window.addEventListener("message", handler)` → `markBooked()` — line 112

Both paths will navigate to `/thank-you`. This is correct — whether booking happens via
inline widget (desktop) or popup (mobile), the user lands on the confirmation page.

---

## Current markBooked() — Exact Lines (155–165)

```js
const markBooked = async () => {
  setBooked(true);
  toast.success("Demo booked! Check your email for the invite.");
  try {
    await axios.post(`${API}/demo-booked`, {
      freshsales_contact_id: lead?.contactId ?? null,
      email: form.email || null,
      lead_id: lead?.id ?? null,
    });
  } catch { /* best-effort */ }
};
```

**What changes:**
1. Add `useNavigate` to the React Router import at line 1
2. Add `const navigate = useNavigate();` inside the component body (after existing `const` declarations)
3. Inside `markBooked()`, replace `setBooked(true)` with a `navigate` call

---

## New Findings

**Finding CR176-A — `setBooked(true)` becomes dead code but safe to keep**
`setBooked(true)` renders the inline "You're booked!" card (lines 207–225). After adding
`navigate("/thank-you")`, the component unmounts before the `booked` guard re-renders.
The card never shows. The `booked` state stays in the code but is effectively a no-op.
Removing it is a larger refactor — keep it for safety.

**Finding CR176-B — Toast fires on the destination page**
`Toaster` is mounted in `App.js` (line 60), not inside any page component. It persists
across navigation. So `toast.success("Demo booked!")` fires BEFORE `navigate()`, and the
toast message is visible on the `/thank-you` page. Good UX: user sees the confirmation
toast on arrival at the thank-you page.

**Finding CR176-C — markBooked fires for ALL DemoForm instances**
DemoForm is embedded in: homepage (CtaDemo), sector pages (SectorPage), PetpoojaAlternative,
DemoLanding. After this change, completing a Calendly booking on ANY of these pages
navigates to `/thank-you`. This is the intended behaviour — the thank-you page is the
universal post-booking destination.

**Finding CR176-D — `useNavigate` is safe inside DemoForm**
DemoForm renders inside `<BrowserRouter>` (App.js line 61). `useNavigate()` only works
inside a Router context. ✅ Safe.

**Finding CR176-E — `form.name` is guaranteed non-empty at markBooked time**
`markBooked` is only reachable after Stage 2 (OTP) and Stage 3 (Calendly scheduling).
The form name field is required (REQUIRED array, line 15). Cannot be empty. ✅ Safe.

**Finding CR176-F — ThankYou.jsx needs `data-testid="thank-you-page"`**
`prerender.js` line 51–54 waits for:
`[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], ...`
`"thank-you-page"` ends in `-page` → matches `[data-testid$="-page"]` ✅

**Finding CR176-G — Direct navigation to /thank-you (no state)**
If a user types `/thank-you` directly in the browser, `location.state` is null. The page
must handle this gracefully with a fallback: `const name = location?.state?.name || "there"`.
Display a generic "Your demo is booked!" without crashing.

**Finding CR176-H — `/thank-you` must be `noindex`**
This page is a transactional confirmation page — not a content page for Google to index.
Add `noindex: true` to `PAGE_SEO["/thank-you"]` in seo.js. (Same as `/demo`.)

**Finding CR176-I — Prerender needs `/thank-you` in extraRoutes**
Prerender the page so users arriving from Calendly redirect see fast HTML.
Add `"/thank-you"` to `extraRoutes` array in prerender.js line 13.

---

## All Files & Exact Changes

### Change 1 — New file: `src/pages/ThankYou.jsx`

New file (~45 lines). Structure mirrors NotFound.jsx for consistency.

```jsx
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";

export default function ThankYou() {
  const location = useLocation();
  const name = location?.state?.name?.split(" ")[0] || "there";
  const seo = PAGE_SEO["/thank-you"];
  return (
    <div className="bg-white" data-testid="thank-you-page">
      <Seo title={seo.title} description={seo.description} path="/thank-you" noindex={true} />
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center py-24 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-11 h-11 text-brand-green" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mt-6"
              data-testid="thank-you-heading">
            You're booked, {name}!
          </h1>
          <p className="text-brand-muted mt-3 leading-relaxed">
            Your Google Meet invite is on its way to your inbox, and we've sent the details on WhatsApp too.
          </p>
          <p className="text-brand-muted mt-2 leading-relaxed">
            Our specialist will walk you through MyGenie at your booked time.
          </p>
          <Link to="/"
            data-testid="thank-you-home-btn"
            className="mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.3)]">
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

**Why this content:** Mirrors the existing inline booked card (DemoForm lines 207–225) for
message consistency. Name is personalised from router state. Falls back gracefully.

---

### Change 2 — `src/components/site/DemoForm.jsx`

**Change 2-A — Line 1: Add `useNavigate` to import**

Current line 1:
```js
import { useState, useEffect, useRef } from "react";
```
Replace with:
```js
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
```

**Change 2-B — After line 65 (`const [isMobile, ...]`): Add navigate declaration**

Current line 65:
```js
const [isMobile, setIsMobile] = useState(false);
```
Insert after line 65 (becomes new line 66):
```js
const navigate = useNavigate();
```

**Change 2-C — Line 155: Replace `setBooked(true)` with navigate in markBooked()**

Current lines 155–165:
```js
const markBooked = async () => {
  setBooked(true);
  toast.success("Demo booked! Check your email for the invite.");
  try {
```
Replace lines 155–157 with:
```js
const markBooked = async () => {
  toast.success("Demo booked! Check your email for the invite.");
  navigate("/thank-you", { state: { name: form.name } });
  try {
```

`setBooked(true)` is removed. The component navigates away immediately, making the
`booked` state and inline card dead code (lines 207–225 become unreachable). They are safe
to leave in place — no regression risk, just unused JSX.

---

### Change 3 — `src/App.js`

**Change 3-A — After line 24 (`const NotFound = lazy(...)`):** Add ThankYou lazy import

```js
const ThankYou = lazy(() => import("@/pages/ThankYou"));
```

**Change 3-B — After line 115 (`<Route path="/payment-success" .../>`):**

```jsx
{/* CR-176 — Thank-you page (post-Calendly booking) */}
<Route path="/thank-you" element={<ThankYou />} />
```

Both changes follow the exact pattern used for every other page in the file.

---

### Change 4 — `src/lib/seo.js`

After the `/cloud-kitchen-pos` entry (line 182), add:

```js
"/thank-you": {
  title: "Demo Booked | MyGenie POS",
  description: "Your MyGenie POS demo is confirmed. A specialist will walk you through the platform at your booked time.",
  noindex: true,
},
```

---

### Change 5 — `scripts/prerender.js`

**Line 13:** Add `"/thank-you"` to extraRoutes.

Current line 13:
```js
  const extraRoutes = ["/demo", "/payment-success", "/404"];
```
Replace with:
```js
  const extraRoutes = ["/demo", "/payment-success", "/404", "/thank-you"];
```

---

## Risk Register

| Risk | Assessment | Verdict |
|---|---|---|
| `thankyou_conversion` GTM event (Stage 2) moved or duplicated | Not touched at all — fires in `onVerified` callback (DemoForm line 292), completely separate code path | ✅ Zero |
| `useNavigate` outside BrowserRouter context | DemoForm renders inside BrowserRouter (App.js line 61). Context is always present | ✅ Safe |
| Toast fires on wrong page | Toaster is global in App.js — survives navigation. Toast shows on `/thank-you` arrival | ✅ Correct |
| `form.name` empty at navigate time | Impossible — name is required field, form can't submit without it | ✅ Safe |
| User lands directly on `/thank-you` (no state) | `location?.state?.name \|\| "there"` fallback handles null state gracefully | ✅ Handled |
| Double markBooked via scheduledRef | `scheduledRef.current` guard on line 106 prevents mobile double-fire. Unchanged. | ✅ Already guarded |
| Inline booked card (lines 207–225) — dead code | Component navigates away before `setBooked` would re-render the card. Dead code only, no regression | ✅ Safe |
| PetpoojaAlternative / SectorPage users now navigate to /thank-you | Intended — universal post-booking page for all form instances | ✅ By design |
| prerender — `data-testid="thank-you-page"` matches selector | `[data-testid$="-page"]` matches. Confirmed pattern in prerender.js line 52. | ✅ Confirmed |
| A rebuild is needed | Yes — new page requires `yarn build` + `node scripts/prerender.js`. Cannot hot-reload a new route. | ⚠️ Plan for rebuild |

---

## Execution Order

```
Step 1  Create  src/pages/ThankYou.jsx            (new file)
Step 2  Edit    src/components/site/DemoForm.jsx   (3 positions)
Step 3  Edit    src/App.js                         (2 positions)
Step 4  Edit    src/lib/seo.js                     (1 addition)
Step 5  Edit    scripts/prerender.js               (1 word change)
Step 6  Run     yarn build
Step 7  Run     node scripts/prerender.js
Step 8  Run     sudo supervisorctl restart frontend
```

Steps 1–5 are independent and can be done in any order (or in parallel).
Steps 6–8 must run in sequence after all edits are complete.

---

## Validation Checklist

- [ ] Complete a full demo booking flow (form → OTP → Calendly → schedule slot)
- [ ] After scheduling: URL changes to `/thank-you`, page shows "You're booked, [name]!"
- [ ] Toast "Demo booked!" is visible on the /thank-you page
- [ ] Navigate directly to `/thank-you` — page loads, name shows "there" (no crash)
- [ ] `data-testid="thank-you-page"` present in DOM (DevTools Elements)
- [ ] `<meta name="robots" content="noindex">` in page source
- [ ] Stage 2 GTM event `thankyou_conversion` still fires on OTP verify — NOT on Calendly (regression check)
- [ ] Homepage form still works end-to-end after changes
- [ ] DevTools Console — no errors

---

## Complete File Change Summary

| File | CR | Change | New lines |
|------|----|--------|-----------|
| `src/pages/ThankYou.jsx` | 176 | New file | ~45 |
| `src/components/site/DemoForm.jsx` | 176 | Import + navigate + remove setBooked | +2 / -1 |
| `src/App.js` | 176 | Lazy import + route | +3 |
| `src/lib/seo.js` | 176 | PAGE_SEO entry | +6 |
| `scripts/prerender.js` | 176 | Add to extraRoutes | +1 word |

**1 `yarn build` · 1 `prerender.js` run (57 routes now) · 1 restart**

---

*Impact analysis written 2026-09-01. Planning Agent. No code changed. All 5 files read in full.*
