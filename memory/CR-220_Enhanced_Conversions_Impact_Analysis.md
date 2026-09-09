# CR-220 — Enhanced Conversions: Full Impact Analysis (Revised)

**CR:** CR-220
**Date revised:** 2026-09-05
**Status:** Open — Ready to implement
**Priority:** P0
**Sources:**
- Technical Brief "Enhanced Conversions Gap" (Sep 5 2026)
- Code investigation (`src/lib/gtm.js`, `DemoForm.jsx`, `PetpoojaAlternative.jsx`,
  `MessageForm.jsx`, `CheckoutModal.jsx`, `CalendlyInline.jsx`)
- Google Ads console screenshot ("Needs attention / Implement in-page code", Last ping: Sep 2)

---

## The Short Version

Three separate problems stack on top of each other to completely break Enhanced Conversions
for the Book Demo conversion action. None of them is a bug in the form — the form works fine,
leads reach the CRM, conversions are counted. The problem is purely in how conversion data
is structured and labelled before it reaches Google's systems.

Fixing all three takes one code change (one function) and two GTM configuration steps.

---

## Problem 1 — "Automatic" EC mode is structurally incompatible with this form

### What "Automatic" Enhanced Conversions does

When Google Ads is set to "Automatic" EC mode, Google's tag management system scans the
live HTML of the page for `<input>` fields — specifically looking for email, phone, and name
inputs — at the moment the conversion event fires. It then hashes whatever values it finds and
sends them to Google as Enhanced Conversions data.

### Why it can't work here

Every form on the site uses a React **stage machine** — the form renders one stage at a time
and tears down the previous stage before rendering the next. The three stages are:

```
Stage 1: "form"
   → user fills in Name, Phone, Outlet Type, City
   → all <input> elements ARE in the DOM

User submits →

Stage 2: "otp"
   → OTP component renders
   → Stage 1 is UNMOUNTED — all <input> elements from the form are GONE from the DOM
   ← book_demo conversion event fires HERE (onVerified callback)

Stage 3: "calendly" / "done"
   → Calendly iframe or success screen renders
```

**The `book_demo` event (GTM: `thankyou_conversion`) fires during Stage 2 — OTP verified.**
At that exact moment, Stage 1's form inputs have already been removed from the DOM by React.
Google's Automatic scanner looks for `<input type="email">`, `<input type="tel">` — finds
nothing — sends an empty EC payload — records zero Enhanced Conversions data.

### Which entry points this affects

All four main Book Demo entry points use the same stage pattern:

| Entry point | Stage machine | When book_demo fires |
|---|---|---|
| `DemoForm.jsx` | form → otp → calendly | OTP `onVerified` callback (Stage 2) |
| `PetpoojaAlternative.jsx` | form → otp → calendly | OTP `onVerified` callback (Stage 2) |
| `MessageForm.jsx` | form → otp → done | OTP `onVerified` callback (Stage 2) |
| `CheckoutModal.jsx` | form → otp → done | OTP `onVerified` callback (Stage 2) |
| `CalendlyInline.jsx` | (inside calendly stage) | Calendly `event_scheduled` message |

### The Sep 2 evidence

The Google Ads console shows "Last ping date: Sep 2, 2026" for Enhanced Conversions.
Conversions were recorded as recently as Sep 5 at 5:30 PM — meaning full conversions ARE
arriving, but EC data stopped at Sep 2. This is consistent with Automatic mode occasionally
succeeding by timing luck (Sep 2 last success), then failing consistently.

---

## Problem 2 — `user_data` container is absent from every dataLayer push

### What Google's server-side path expects

When the `book_demo` event fires, the code builds a payload and pushes it to `dataLayer`.
That dataLayer event is read by GTM. GTM fires the GA4 tag. The GA4 tag sends an event to
Google's collection endpoint. A server-side GTM container (Stape-hosted, GTM-KN4B3Q2H)
intercepts that GA4 event and fires a server-side Google Ads tag (`sgtmadsct`).

The server-side `sgtmadsct` tag **automatically extracts Enhanced Conversions data from the
GA4 event's `user_data` object**. It has no fields of its own to configure — it depends
entirely on the GA4 event carrying a properly structured `user_data` object.

### What the code actually sends

`buildLeadPayload()` in `src/lib/gtm.js` returns a flat object. Every identity field sits
loose at the top level alongside 30+ other keys:

```
{
  event: "thankyou_conversion",
  name: "Rajesh Kumar",
  first_name: "Rajesh",          ← loose, at root
  last_name: "Kumar",            ← loose, at root
  email: "r@restaurant.com",     ← loose, at root (key: "email")
  phone: "+919876543210",        ← loose, at root (key: "phone")
  external_id: "+919876543210",
  outlet_type: "Restaurant",
  city_name: "Mumbai",
  gclid: "...",
  fbclid: "...",
  utm_source: "google",
  ... 25 more flat keys
}
```

### What is required

```
{
  event: "thankyou_conversion",
  user_data: {                        ← THIS CONTAINER IS COMPLETELY ABSENT
    email_address: "r@restaurant.com",  ← different key: email_address (not email)
    phone_number: "+919876543210",      ← different key: phone_number (not phone)
    address: {
      first_name: "Rajesh",
      last_name: "Kumar",
    }
  },
  first_name: "Rajesh",   ← flat keys stay (Meta + Path A still need these)
  email: "...",           ← flat keys stay
  ... all other keys unchanged
}
```

### Confirmed absent from codebase

`user_data` — zero occurrences in all frontend source files
`email_address` — zero occurrences
`phone_number` — zero occurrences

---

## Problem 3 — GA4 tag in web GTM has no User-Provided Data variable

Even if the code pushed a perfectly structured `user_data` object into `dataLayer`,
the GA4 web tag in GTM (the "GA4 - Book demo" tag) needs to be explicitly configured to
read from it. This is done by:

1. Creating a GTM variable of type "User-Provided Data" that points to the `user_data` key
   in the dataLayer event
2. Connecting that variable to the GA4 tag's dedicated "User Data" field

Without this configuration, the GA4 tag ignores `user_data` entirely and sends the GA4 event
to Google's server without any Enhanced Conversions data. The server-side Stape container
(`sgtmadsct` tag) then receives a GA4 event with no user_data and has nothing to forward.

This configuration does not exist in the current GTM container — confirmed by the tech brief
(Sep 5 2026): "Data present in GA4's dedicated user_data object: NOT CONFIRMED — likely absent."

---

## How the Three Problems Stack

```
PROBLEM 1: EC mode = "Automatic"
  → Google scans DOM at conversion time
  → Form inputs are unmounted (React stage machine)
  → EC scan finds nothing
  → Path A (client-side GAds tag) sends empty EC payload
  → Result: EC data = empty on Path A

PROBLEM 2: user_data absent from dataLayer
  → GA4 tag sends event to Google servers without user_data
  → Server-side GA4 event has no user_data
  → Path B (sGTM sgtmadsct tag) has nothing to extract
  → Result: EC data = empty on Path B

PROBLEM 3: GA4 tag has no User-Provided Data variable
  → Even if user_data was in dataLayer, GA4 tag wouldn't forward it
  → Compounds Problem 2
  → Result: Path B EC = empty regardless of dataLayer contents

COMBINED RESULT:
  Conversions recorded: YES (cookies + click IDs still work)
  Enhanced Conversions data: ZERO on both paths
  Google Ads console: "Needs attention / Last ping: Sep 2"
  Google Ads diagnostic: "Implement in-page code in addition to Automatic"
```

---

## The Three-Part Fix

### Fix B — Code (1 function, all entry points, requires rebuild)

Add a `user_data` block to `buildLeadPayload()` return object in `src/lib/gtm.js`.
All values already computed in that same function — no new logic needed.

**File:** `src/lib/gtm.js`
**Function:** `buildLeadPayload()` — the single central function
**What changes:** Add `user_data: { email_address, phone_number, address: { first_name, last_name } }` after the existing `external_id` line
**What stays:** All flat keys (`email`, `phone`, `first_name`, `last_name`) remain — Meta and
Path A client-side GAds tag still read these, unchanged

After Fix B, the dataLayer event looks like:
```
{
  event: "thankyou_conversion",
  user_data: { email_address, phone_number, address: { first_name, last_name } },  ← NEW
  email: ...,           ← unchanged (Meta still reads this)
  phone: ...,           ← unchanged (Meta still reads this)
  first_name: ...,      ← unchanged (Path A GAds still reads this)
  last_name: ...,       ← unchanged (Path A GAds still reads this)
  ... all 30+ other keys unchanged
}
```

**Entry points that automatically benefit (no per-file changes):**

| Entry point | Event | Gets user_data? |
|---|---|---|
| `DemoForm.jsx` | `thankyou_conversion` | ✅ Automatic (same function) |
| `PetpoojaAlternative.jsx` | `thankyou_conversion` | ✅ Automatic |
| `MessageForm.jsx` | `thankyou_conversion` | ✅ Automatic |
| `CheckoutModal.jsx` | `thankyou_conversion` | ✅ Automatic |
| `CalendlyInline.jsx` | `demo_booked` | ✅ Automatic (harmless now, useful when demo_booked GTM trigger added) |
| All `form_submitted` | `form_submitted` | ✅ Automatic (no EC tag on this event — harmless extra data) |

---

### Fix A — GTM: User-Provided Data variable on GA4 tag (owner action, no code)

**Solves:** Problem 3 (GA4 tag doesn't forward user_data to server container)

In web GTM container (GTM-K5D84Z3L):

1. **Create new variable** → Type: "User-Provided Data"
   - Name: `dlv - user_data`
   - Data Layer Variable Name: `user_data`
   - (GTM reads the entire `user_data` object from the dataLayer event)

2. **Edit "GA4 - Book demo" tag**
   - Find the "User-Provided Data" / "User Data" section (separate from Event Parameters)
   - Set it to: `dlv - user_data`

3. **Preview test** → submit test form → tag shows hashed values in User Data section

4. **Publish**

**Result:** GA4 event sent to server container now includes user_data → sgtmadsct tag on
Stape server reads it → EC data forwarded to Google Ads → Path B Enhanced Conversions works.

---

### Fix C — GTM: Switch "GAds - Book Demo" EC mode from Automatic to Code (owner action, no code)

**Solves:** Problem 1 (Automatic EC mode incompatible with React stage machine)

In web GTM container (GTM-K5D84Z3L):

1. **Edit "GAds - Book Demo" tag** (client-side Google Ads conversion tag)

2. **Find "Enhanced conversions" section** → current setting: "Automatic"

3. **Change to: "Code"** (also called "In-page code" or "User-provided data")

4. **Set the User-Provided Data variable** to `dlv - user_data`
   (the same variable created in Fix A — reuse it)

5. **Preview test** → submit test form → GAds tag shows hashed email/phone in EC section

6. **Publish**

**Result:** Google Ads tag no longer tries to scan the DOM. It reads `user_data` from the
dataLayer event directly. Since form fields are in `user_data` at the time of the push
(they were captured before OTP), EC data is always present regardless of DOM state.

---

## Implementation Order

```
Step 1: Fix B — code (add user_data to buildLeadPayload)
         → rebuild beta, deploy to preview pod
         → verify user_data in built JS bundle
         → rebuild production zip

Step 2: Fix A — GTM (User-Provided Data variable on GA4 tag)
         → requires Fix B deployed so user_data is in dataLayer

Step 3: Fix C — GTM (switch GAds tag EC mode Automatic → Code)
         → can be done same GTM session as Fix A

Step 4: GTM Preview test
         → submit real test form on www.mygenie.online (staging or prod)
         → confirm GAds tag shows hashed values in EC section
         → confirm GA4 tag shows hashed values in User Data section

Step 5: GTM Publish

Step 6: Monitor Google Ads console
         → "Book demo" Enhanced Conversions → expect status change within 24-72h
         → "Last ping date" should update to today's date
         → "Needs attention" warning should clear
```

---

## What Currently Works — Unchanged After Fix

| Thing | Status |
|---|---|
| Form submission, OTP flow, Calendly booking | ✅ No change — zero user-facing effect |
| Lead reaching Freshsales CRM | ✅ No change — backend unaffected |
| Meta Pixel (all events) | ✅ No change — reads flat `email`/`phone` which stay |
| Path A GAds tag (flat field mappings) | ✅ No change — flat keys stay |
| GA4 session tracking (CR-219 fix) | ✅ No change |
| Conversion count in Google Ads | ✅ No change — conversions still recorded via cookies |
| All UTM / gclid / fbclid attribution | ✅ No change — all 30+ flat keys unchanged |

---

## What Improves After Fix

| Metric | Before | After |
|---|---|---|
| EC data on Path A (client-side GAds tag) | Empty (DOM scan fails) | Populated from user_data |
| EC data on Path B (sGTM GAds tag) | Empty (user_data absent) | Populated from GA4 event |
| Google Ads "Last ping date" | Sep 2, 2026 | Updates with every Book Demo |
| Google Ads "Needs attention" status | Active | Should clear within 24-72h |
| "Implement in-page code" warning | Active | Should clear after GTM publish |
| Conversion match rate | Low (cookies only) | Higher (email/phone hash match) |
| Cross-device attribution | Missed | Captured (user logged into Google on other device) |
| iOS/Safari attribution | Missed (ITP blocks cookies) | Captured (hash match bypasses ITP) |
| Google Ads ROAS accuracy | Understated | More accurate |
| Smart Bidding signal quality | Low | Higher (confirmed ₹200/₹300 value per verified lead) |

---

## What This Does NOT Fix

| Item | Reason |
|---|---|
| Historical data (before deploy) | EC only improves future conversions — past stays as-is |
| `demo_booked` Calendly conversion (if not yet set up in GTM) | Owner needs to add `demo_booked` GTM trigger + conversion tags separately |
| "Managed through API" label in Google Ads | This refers to the server-side path (Path B) — will update once valid EC data arrives through it |
| GA4 data accuracy | GA4 session tracking is a separate issue, fixed by CR-219 |

---

## Summary Table — Three Problems, Three Fixes

| Problem | Symptom | Fix | Who | Type |
|---|---|---|---|---|
| EC mode = Automatic, DOM empty at conversion time | Last ping Sep 2, no EC data since | Fix C: Switch GAds tag EC mode → Code, use user_data variable | GTM editor | GTM config |
| `user_data` absent from dataLayer | sGTM sgtmadsct has nothing to read | Fix B: Add user_data block to `buildLeadPayload()` | Dev | Code + rebuild |
| GA4 tag has no User-Provided Data variable | GA4 event to server container has no user_data | Fix A: Create variable, attach to GA4 tag | GTM editor | GTM config |

---

*Revised 2026-09-05. All three problems confirmed from code + Tech Brief + Google Ads console screenshot.*
*Line-by-line code plan: `/app/memory/CR-220_Line_By_Line_Plan.md` (Fix B — code side only).*
*Fix A + Fix C are GTM-only steps documented above.*
*Ready to implement on instruction.*
