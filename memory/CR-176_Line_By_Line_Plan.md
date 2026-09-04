# CR-176 — Line-by-Line Implementation Plan
## /thank-you Page After Calendly Booking

**Plan written:** 2026-09-01 — Planning Agent
**Impact analysis:** `/app/memory/CR-176_ThankYou_ImpactAnalysis.md`
**Status:** READY — no code changed. Awaiting "go ahead".
**Files touched:** 5 (1 new file + 4 existing)
**Effort:** ~35 minutes
**Rebuild required:** ✅ Yes — new route requires `yarn build` + `prerender.js` + frontend restart

---

## CRITICAL: Do Not Change

The `thankyou_conversion` GTM event fires at **Stage 2 (OTP verify)** — DemoForm.jsx line 292:
```js
pushLead("book_demo", form, outletValue, eventId, { otp_verified: true, ... });
```
This is intentional. Owner confirmed. **Do not touch this line under any circumstance.**
CR-176 only adds navigation at Stage 3 (Calendly scheduling). The GTM event is a separate
code path and is not affected by any change in this plan.

---

## Execution Order

```
STEP 1 → Create src/pages/ThankYou.jsx           (new file)
STEP 2 → Edit   src/components/site/DemoForm.jsx  (3 positions)
STEP 3 → Edit   src/App.js                        (2 positions)
STEP 4 → Edit   src/lib/seo.js                    (1 addition)
STEP 5 → Edit   scripts/prerender.js              (1 word)
STEP 6 → yarn build
STEP 7 → node scripts/prerender.js
STEP 8 → sudo supervisorctl restart frontend
STEP 9 → Verify (5 gates)
```

Steps 1–5 are **independent** — apply in any order or in parallel.
Steps 6–9 **must run in sequence** after all edits are complete.

---

## Pre-flight Checklist

```bash
# A. Both services running
sudo supervisorctl status
# Expected: backend RUNNING, frontend RUNNING

# B. Confirm /thank-you does not exist yet
ls /app/frontend/src/pages/ThankYou.jsx 2>/dev/null && echo "EXISTS - STOP" || echo "OK - does not exist"

# C. Confirm target lines in DemoForm before editing
sed -n '1p' /app/frontend/src/components/site/DemoForm.jsx
# Expected: import { useState, useEffect, useRef } from "react";
sed -n '155,165p' /app/frontend/src/components/site/DemoForm.jsx
# Expected: markBooked function with setBooked(true) on line 156
```

---

## STEP 1 — Create `src/pages/ThankYou.jsx` (new file)

**File:** `src/pages/ThankYou.jsx`
**Action:** Create new file. Does not exist yet.

**Full file content:**
```jsx
import { useLocation, Link } from "react-router-dom";
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
            <CalendarCheck className="w-11 h-11 text-brand-green" data-testid="thank-you-icon" />
          </div>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mt-6"
            data-testid="thank-you-heading"
          >
            You&apos;re booked, {name}!
          </h1>
          <p className="text-brand-muted mt-3 leading-relaxed">
            Your Google Meet invite is on its way to your inbox, and we&apos;ve sent the details on WhatsApp too.
          </p>
          <p className="text-brand-muted mt-2 leading-relaxed">
            Our specialist will walk you through MyGenie at your booked time.
          </p>
          <Link
            to="/"
            data-testid="thank-you-home-btn"
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

**Line-by-line notes:**

| Line | What it does | Why |
|---|---|---|
| `import { useLocation, Link }` | Router hooks in one import | `useLocation` reads the `state.name` passed by navigate; `Link` for the back button |
| `const name = location?.state?.name?.split(" ")[0] \|\| "there"` | Extracts first name from router state | `split(" ")[0]` gives first name only ("John" from "John Smith"). Falls back to "there" if user navigates directly to URL with no state |
| `data-testid="thank-you-page"` | **Critical** — prerender.js line 52 selector: `[data-testid$="-page"]`. Must end in `-page` | ✅ Matches selector |
| `<Seo ... noindex={true} />` | Marks page as non-indexed | Retargeting page only — no SEO value |
| `data-testid="thank-you-heading"` | For testing | Can assert name personalisation |
| `data-testid="thank-you-home-btn"` | For testing | Can assert link to homepage |
| `&apos;` not `'` | JSX apostrophe escaping | Avoids JSX parse error in "You're" and "we've" |

**Checkpoint after Step 1:**
- File exists: `ls /app/frontend/src/pages/ThankYou.jsx` → exists
- Not yet navigable — App.js route not added until Step 3

**Rollback:** Delete the file.

---

## STEP 2 — Edit `src/components/site/DemoForm.jsx` (3 positions)

**File:** `src/components/site/DemoForm.jsx`
**Total lines:** 377
**Changes:** 3 positions (2 additions + 1 substitution)

---

### Change 2-A — Line 1: Add `useNavigate` import

**Current line 1:**
```js
import { useState, useEffect, useRef } from "react";
```

**Insert after line 1 (new line 2):**
```js
import { useNavigate } from "react-router-dom";
```

**Result (lines 1–2 after change):**
```js
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
```

All subsequent line numbers shift **+1** after this point.

**Why after line 1 specifically:**
- Line 1 is React hooks import — all react-router-dom imports follow by convention
- No existing react-router-dom import in DemoForm.jsx — this is the first one

**What does NOT change:** All other imports (lines 2–11, now 3–12) — untouched.

---

### Change 2-B — Line 67 (now 68 after 2-A): Add `navigate` declaration

All line numbers below are **after the +1 shift from Change 2-A**.

**Current lines 65–68 (now 66–69, context for verification):**
```js
  const scheduledRef = useRef(false);
  const otpCardRef = useRef(null);

  const outletValue = sector || form.outlet_type;
```

**Insert after line 67 `const otpCardRef = useRef(null);` (new line 68):**
```js
  const navigate = useNavigate();
```

**Result (lines 66–70 after change):**
```js
  const scheduledRef = useRef(false);
  const otpCardRef = useRef(null);
  const navigate = useNavigate();

  const outletValue = sector || form.outlet_type;
```

All subsequent line numbers shift **+2** total (1 from 2-A + 1 from 2-B).

**Why here:**
- Placed with other `const` hook declarations at the top of the component body
- After `useRef` declarations — follows React hook ordering convention
- Before any function that uses it (`markBooked` at line 155, now 157)

**Safety:** `useNavigate()` requires a Router context. DemoForm always renders inside
`<BrowserRouter>` in App.js line 61. ✅ Safe.

---

### Change 2-C — Line 156 (now 158 after shifts): Replace `setBooked(true)` with navigate

All line numbers below are **after the +2 shift from Changes 2-A and 2-B**.

**Current `markBooked` function (original lines 155–165, now 157–167, context):**
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

**Change line 158 only** (was original line 156, was `setBooked(true);`):

Before:
```js
    setBooked(true);
```

After:
```js
    navigate("/thank-you", { state: { name: form.name } });
```

**Result (`markBooked` after change):**
```js
  const markBooked = async () => {
    navigate("/thank-you", { state: { name: form.name } });
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

**Why this exact substitution:**

| Choice | Why |
|---|---|
| Replace `setBooked(true)` not add after it | `navigate()` causes component unmount. Calling `setBooked(true)` first triggers a React state update on a component about to unmount — React 18 batches it but it's unnecessary noise. |
| `navigate` before `toast.success` | Both fire synchronously. Order does not matter for the user — the toast is global (App.js Toaster) and persists across navigation. BUT: placing navigate first ensures we leave the page immediately and the toast is seen on the destination. |
| `{ state: { name: form.name } }` | Passes first name to ThankYou page for personalisation ("You're booked, John!"). Router state is not visible in the URL. |
| `form.name` is safe here | `markBooked` is unreachable without a successful form submission + OTP verify + Calendly scheduling. Name is required field. Cannot be empty. |
| `setBooked(true)` removed, not kept | The inline booked card (original lines 207–225) becomes dead code. The component navigates away before React re-renders the `booked` guard. Safe to remove `setBooked(true)` entirely. The `booked` state declaration and the card JSX can stay in the file — dead code, harmless. |

**What does NOT change:**
- `toast.success` line — identical, just now line after navigate
- The `axios.post` to `/api/demo-booked` — completely untouched. The backend still receives the booking notification.
- The mobile `scheduledRef` guard (line 106) — untouched. Prevents double-fire.
- The desktop `onScheduled={markBooked}` callback in CalendlyInline (line 270) — untouched.
- `pushLead("book_demo", ...)` at OTP verify (line 292 → ~294 after shifts) — NOT touched.

**Checkpoint after Step 2:**
- Hot-reload fires (DemoForm.jsx is hot-reloadable)
- No console errors (useNavigate requires Router context — already present)
- The form renders correctly at `/` — no visual change at this point (navigation only fires on booking completion)

**Rollback:**
- Remove line 2 (`import { useNavigate }`)
- Remove `const navigate = useNavigate();`
- Change `navigate(...)` back to `setBooked(true);`

---

## STEP 3 — Edit `src/App.js` (2 positions)

**File:** `src/App.js`
**Total lines:** 135
**Changes:** 2 positions (1 import + 1 route)

---

### Change 3-A — After line 24: Add ThankYou lazy import

**Current lines 23–25:**
```js
const PaymentSuccess      = lazy(() => import("@/pages/PaymentSuccess"));
const NotFound            = lazy(() => import("@/pages/NotFound"));
const RestaurantBillingSoftware  = lazy(() => import("@/pages/RestaurantBillingSoftware"));
```

**Insert after line 24 (new line 25):**
```js
const ThankYou            = lazy(() => import("@/pages/ThankYou"));
```

**Result (lines 23–26):**
```js
const PaymentSuccess      = lazy(() => import("@/pages/PaymentSuccess"));
const NotFound            = lazy(() => import("@/pages/NotFound"));
const ThankYou            = lazy(() => import("@/pages/ThankYou"));
const RestaurantBillingSoftware  = lazy(() => import("@/pages/RestaurantBillingSoftware"));
```

All subsequent line numbers shift **+1** after this point.

**Why after line 24:** Grouped with transactional pages (`PaymentSuccess`, `NotFound`) — same category as `/thank-you`.

---

### Change 3-B — After line 115 (now 116 after 3-A): Add ThankYou route

**Current lines 114–117 (now 115–118, context):**
```jsx
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* 301-equivalent redirects from old live-site URLs */}
            {Object.entries(REDIRECTS).map(([from, to]) => (
```

**Insert after line 116 `<Route path="/payment-success" .../>` (new lines 117–118):**
```jsx

            {/* CR-176 — Thank-you page (post-Calendly booking) */}
            <Route path="/thank-you" element={<ThankYou />} />
```

**Result (lines 115–120 after change):**
```jsx
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* CR-176 — Thank-you page (post-Calendly booking) */}
            <Route path="/thank-you" element={<ThankYou />} />

            {/* 301-equivalent redirects from old live-site URLs */}
```

**Why here:** Grouped with `/payment-success` — both are transactional post-action pages that appear after user completion flows.

**Checkpoint after Step 3:**
- Hot-reload fires
- Visit `http://localhost:3000/thank-you` (or the preview URL + `/thank-you`) in browser
- Expected: ThankYou page renders with "You're booked, there!" (no name state passed directly)
- Navbar, Footer visible
- Back to Home link works

**Rollback:**
- Remove ThankYou lazy import line
- Remove the ThankYou `<Route>` and comment

---

## STEP 4 — Edit `src/lib/seo.js` (1 addition)

**File:** `src/lib/seo.js`
**Total lines:** 184
**Change position:** Lines 178–183

---

**Current lines 178–184 (end of file):**
```js
  },
  "/cloud-kitchen-pos": {
    title: "Cloud Kitchen POS & Billing Software India | MyGenie",
    description: "POS built for cloud kitchens — manage every brand, every aggregator, and all inventory from one screen. GST-ready. Book a free demo.",
  },
};

```

**Replace lines 183 `};` with new entry + closing brace:**
```js
  },
  "/cloud-kitchen-pos": {
    title: "Cloud Kitchen POS & Billing Software India | MyGenie",
    description: "POS built for cloud kitchens — manage every brand, every aggregator, and all inventory from one screen. GST-ready. Book a free demo.",
  },
  "/thank-you": {
    title: "Demo Booked | MyGenie POS",
    description: "Your MyGenie POS demo is confirmed. A specialist will walk you through the platform at your booked time.",
    noindex: true,
  },
};
```

**What changed:** The existing closing `};` (line 183) is replaced with the new 4-line entry + the closing `};` after it.

**Why this content:**

| Field | Value | Why |
|---|---|---|
| `title` | `"Demo Booked \| MyGenie POS"` | Confirms booking completion. Short. Browser tab shows it. |
| `description` | (see above) | Describes the page if a bot somehow indexes it despite noindex. Best practice. |
| `noindex: true` | Present | ThankYou.jsx passes this to `<Seo noindex={true} />`. Prevents Google indexing a transactional page with no organic SEO value. |

**ThankYou.jsx uses this entry at:**
```js
const seo = PAGE_SEO["/thank-you"];
// → { title: "Demo Booked | MyGenie POS", ... }
```
The `noindex` field is redundant in PAGE_SEO (ThankYou.jsx hardcodes `noindex={true}` in the `<Seo>` call). Kept in PAGE_SEO for completeness and to document intent.

**Checkpoint after Step 4:**
- Hot-reload fires (seo.js is imported by Home.jsx which is already loaded)
- Visit `/thank-you` — browser tab title reads "Demo Booked | MyGenie POS"
- DevTools → Elements → `<head>` → confirm `<meta name="robots" content="noindex,follow">`

**Rollback:** Remove the 5 added lines (the `"/thank-you"` block).

---

## STEP 5 — Edit `scripts/prerender.js` (1 word)

**File:** `scripts/prerender.js`
**Total lines:** 146
**Change position:** Line 13

---

**Current line 13:**
```js
  const extraRoutes = ["/demo", "/payment-success", "/404"];
```

**Replace with:**
```js
  const extraRoutes = ["/demo", "/payment-success", "/404", "/thank-you"];
```

**What changed:** Added `"/thank-you"` to the end of the array.

**Effect:** prerender.js now processes 57 routes (53 sitemap + 4 extra). The last route
processed will be `/thank-you`.

**Why prerender `/thank-you`:** Users arrive at this page after a Calendly booking — from
a Calendly redirect. They should see full HTML immediately, not a blank loading screen.
Prerendering eliminates the React hydration delay on what is a high-value, high-emotion
moment (the user just booked).

**prerender.js selector compatibility:**
`ThankYou.jsx` has `data-testid="thank-you-page"`. prerender.js line 52 waits for:
`[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]`
→ `"thank-you-page"` ends in `-page` → matches `[data-testid$="-page"]` ✅

**Checkpoint:** Verified after Step 7 (yarn build + prerender run).

**Rollback:** Remove `"/thank-you"` from the array.

---

## STEP 6 — `yarn build`

```bash
cd /app/frontend && npx craco build 2>&1 | tail -8
```

**Expected:**
```
File sizes after gzip:
  [sizes listed — ThankYou chunk will be new, small: ~1-2kB]
The build folder is ready to be deployed.
Done in XX.XXs.
```

**If compilation errors appear:**
- `Cannot find module '@/pages/ThankYou'` → Step 1 (file creation) was not saved correctly — re-check ThankYou.jsx exists
- `useNavigate` error → Step 2-A import was not applied — re-check DemoForm.jsx line 2
- `PAGE_SEO["/thank-you"] is undefined` → Step 4 was not applied — re-check seo.js last entry
- JSX syntax errors → Check apostrophe escaping in ThankYou.jsx (`&apos;`)

**Never proceed to Step 7 if build fails.**

---

## STEP 7 — `node scripts/prerender.js`

```bash
cd /app/frontend && node scripts/prerender.js 2>&1 | tee /app/frontend/prerender_cr176.log
tail -10 /app/frontend/prerender_cr176.log
```

**Expected last line:**
```
prerendered /thank-you -> /app/frontend/build/thank-you/index.html
```

**Expected total:** 57 routes (check line count):
```bash
wc -l /app/frontend/prerender_cr176.log
# Expected: 57
```

**Duration:** ~5–6 minutes (57 routes × ~5–6s each).

**If `/thank-you` route fails:**
```bash
grep "thank-you\|error\|Error" /app/frontend/prerender_cr176.log
```
Most likely cause: `data-testid="thank-you-page"` not present → check ThankYou.jsx Step 1 content.

---

## STEP 8 — Restart frontend

```bash
sudo supervisorctl restart frontend && sleep 3 && sudo supervisorctl status frontend
# Expected: RUNNING
```

---

## STEP 9 — Verification Gates

### Gate A — Thank-you page renders + is noindex

```bash
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
python3 - "$BACKEND_URL" << 'PYEOF'
import sys, subprocess, re
BASE = sys.argv[1]
html = subprocess.run(["curl", "-s", BASE + "/thank-you"], capture_output=True, text=True).stdout
title  = (re.search(r'<title>(.*?)</title>', html) or type('',(),{'group':lambda s,x:''})).group(1)
robots = re.search(r'<meta name="robots"[^>]*content="([^"]*)"', html)
has_heading = 'thank-you-heading' in html
has_noindex = 'noindex' in (robots.group(1) if robots else '')
print(f"Title:    {'PASS' if title == 'Demo Booked | MyGenie POS' else 'FAIL'} → {title}")
print(f"Noindex:  {'PASS' if has_noindex else 'FAIL'} → {robots.group(1) if robots else 'MISSING'}")
print(f"Heading:  {'PASS' if has_heading else 'FAIL'} (data-testid=thank-you-heading present)")
PYEOF
```
**Expected:**
```
Title:    PASS → Demo Booked | MyGenie POS
Noindex:  PASS → noindex,follow
Heading:  PASS (data-testid=thank-you-heading present)
```

---

### Gate B — prerendered file exists with correct content

```bash
python3 -c "
import re
html = open('/app/frontend/build/thank-you/index.html').read()
title = re.search(r'<title>(.*?)</title>', html).group(1)
has_content = 'thank-you-page' in html
print('PASS' if title == 'Demo Booked | MyGenie POS' and has_content else 'FAIL',
      f'title={title} | page-testid present={has_content}')
"
```
**Expected:** `PASS title=Demo Booked | MyGenie POS | page-testid present=True`

---

### Gate C — DemoForm navigate change in source

```bash
grep -n "navigate\|useNavigate\|setBooked" /app/frontend/src/components/site/DemoForm.jsx | head -10
```
**Expected:**
```
2:import { useNavigate } from "react-router-dom";
68:  const navigate = useNavigate();
158:    navigate("/thank-you", { state: { name: form.name } });
```
`setBooked(true)` should NOT appear in the output.

---

### Gate D — Route registered in App.js

```bash
grep "thank-you\|ThankYou" /app/frontend/src/App.js
```
**Expected: 2 lines** — the lazy import + the Route element

---

### Gate E — Regression: Stage 2 GTM event untouched

```bash
grep -n "thankyou_conversion\|book_demo\|pushLead" /app/frontend/src/components/site/DemoForm.jsx | head -10
```
**Expected:** `pushLead("book_demo", ...)` still present at the OTP verify `onVerified` callback.
No `thankyou_conversion` string (that lives in gtm.js, not DemoForm — confirming nothing changed).

---

### Gate F — Page count: 57 prerendered pages

```bash
find /app/frontend/build -name "index.html" | wc -l
# Expected: 57
```

---

## Complete File Change Summary

| File | Action | Positions | Lines added |
|---|---|---|---|
| `src/pages/ThankYou.jsx` | New file | — | 42 |
| `src/components/site/DemoForm.jsx` | Edit | Lines 1, 67, 156 | +2 lines, 1 substitution |
| `src/App.js` | Edit | Lines 24, 115 | +3 lines |
| `src/lib/seo.js` | Edit | Line 183 | +5 lines |
| `scripts/prerender.js` | Edit | Line 13 | +1 word |
| **TOTAL** | | | **+52 lines net** |

**1 `yarn build` · 1 `prerender.js` (57 routes) · 1 restart · 6 verification gates**

---

## Rollback Plan

```bash
# 1. Delete new file
rm /app/frontend/src/pages/ThankYou.jsx

# 2. Revert 3 edits in DemoForm.jsx
#    - Remove line 2: import { useNavigate } from "react-router-dom";
#    - Remove const navigate = useNavigate();
#    - Change navigate(...) back to setBooked(true);

# 3. Revert 2 edits in App.js
#    - Remove ThankYou lazy import
#    - Remove <Route path="/thank-you" ... />

# 4. Revert seo.js
#    - Remove /thank-you entry (last 5 lines before closing };)

# 5. Revert prerender.js
#    - Remove "/thank-you" from extraRoutes

# Then:
cd /app/frontend && npx craco build && node scripts/prerender.js && sudo supervisorctl restart frontend
```

---

## Out of Scope

- The inline "You're booked!" card in DemoForm.jsx (lines ~207–225 in original) — becomes dead
  code after `setBooked(true)` is removed, but is deliberately left in place. Removing it is a
  separate cleanup task beyond this CR.
- `REACT_APP_THANKYOU_URL` env var approach — rejected. Hardcoded `/thank-you` is simpler and
  there is no use case for configuring this path differently across environments.
- Adding a secondary `thankyou_conversion` GTM event at Stage 3 (Calendly) — explicitly OUT
  OF SCOPE. Owner confirmed Stage 2 fire is correct. Do not add any GTM push to markBooked.

---

*Plan written 2026-09-01. Planning Agent. All 5 target files read in full before writing. No code changed. Awaiting "go ahead".*
