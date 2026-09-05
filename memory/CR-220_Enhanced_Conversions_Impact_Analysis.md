# CR-220 — Enhanced Conversions Gap: Impact Analysis

**CR:** CR-220
**Date:** 2026-09-05
**Status:** Open — Ready to implement
**Priority:** P0
**Source:** Technical Brief "Enhanced Conversions Gap" (Sep 5 2026) + code investigation
**Risk of fix:** Zero — no visual change, no form behaviour change, no user-facing effect

---

## Plain-English Summary (the short version)

When someone fills in the Book Demo form, the code sends their email, phone, and name to
Google's tracking system. The data arrives correctly — but it's packed in the wrong shape.
Google's server-side ad system expects user identity data inside a labelled box called
`user_data`. Our code puts it loose in the parcel with 30 other items and doesn't label it.
The server-side system can't find it, so it reports "Enhanced Conversions: Setup issues
detected" and the conversion matching doesn't work for that path.

The form still works. The lead still reaches the CRM. The user still gets the demo.
This is a measurement-only gap — Google Ads can't tell which ad led to which booked demo
as accurately as it could if the data was structured correctly.

---

## Part 1 — What Enhanced Conversions Actually Does (plain English)

When someone clicks a Google Ad and later books a demo, Google Ads wants to confirm that
the person who clicked the ad is the same person who booked. It does this by taking the
email or phone number the person submitted on the form, hashing it (turning it into a
scrambled code that can't be reversed), and matching it against Google's own signed-in
user database.

If the match works:
- Google Ads knows with high confidence: "This specific ad click led to this booking"
- Attribution is accurate even when cookies are blocked or the person switched devices
- Value-based bidding improves (Google knows ₹200 of conversion value came from that ad)
- ROAS and cost-per-conversion numbers in the dashboard become more accurate

If Enhanced Conversions is broken:
- Google Ads can only use cookies and click IDs to attribute conversions
- Cookie-based attribution misses cross-device journeys and Safari/iOS users
- ROAS numbers are understated — making good campaigns look worse than they are
- The Google Ads diagnostic shows a warning: "Enhanced Conversions: Setup issues detected"

---

## Part 2 — The Two Paths That Exist Today

The site sends Book Demo conversions to Google Ads via two parallel routes.

### Path A — Client-side (web browser → Google directly)

```
User submits form
      ↓
Browser pushes event to dataLayer
      ↓
Web GTM (GTM-K5D84Z3L) fires "GAds - Book Demo" tag
      ↓
Google Ads receives the conversion with hashed email/phone
```

**Status: WORKING ✅**

This was fixed on Sept 3, 2026. The GTM tag has its own explicit field mapping — it reads
`email`, `phone`, `first_name`, `last_name` directly from the flat dataLayer event and sends
them to Google correctly. No `user_data` structure is required for this path.

### Path B — Server-side (web browser → GA4 → Stape server → Google)

```
User submits form
      ↓
Browser pushes event to dataLayer
      ↓
Web GTM fires "GA4 - Book demo" tag → sends GA4 event to Google's collect endpoint
      ↓
Stape server GTM (GTM-KN4B3Q2H) intercepts the GA4 event
      ↓
Server GTM fires "GAds - Book demo" (sgtmadsct tag)
      ↓
This tag reads user identity data from the GA4 event's user_data object
      ↓
[user_data is absent → Enhanced Conversions data = empty → Google Ads reports "Setup issues detected"]
```

**Status: BROKEN for Enhanced Conversions ❌**

---

## Part 3 — The Exact Gap (confirmed from code)

### What the code currently sends

Every time a Book Demo event fires, the code builds one flat parcel of data:

```
event = "thankyou_conversion"
email = "owner@restaurant.com"         ← at the TOP LEVEL, loose
phone = "+919876543210"                ← at the TOP LEVEL, loose
first_name = "Rajesh"                  ← at the TOP LEVEL, loose
last_name = "Kumar"                    ← at the TOP LEVEL, loose
outlet_type = "Restaurant"
city_name = "Mumbai"
gclid = "..."
fbclid = "..."
utm_source = "google"
... (30+ more keys, all flat)
```

### What Google's server-side system expects

```
event = "thankyou_conversion"
user_data = {                           ← DEDICATED LABELLED BOX — COMPLETELY ABSENT
    email_address = "owner@..."         ← different key name (email_address, not email)
    phone_number = "+91..."             ← different key name (phone_number, not phone)
    address = {
        first_name = "Rajesh"
        last_name = "Kumar"
    }
}
email = "owner@restaurant.com"          ← flat keys can stay (Meta still reads these)
phone = "+919876543210"                 ← flat keys can stay
... (everything else unchanged)
```

### The three problems in one

| Problem | What it means |
|---|---|
| `user_data` container is absent | Server-side GAds tag finds no Enhanced Conversions data at all |
| Key names differ (`email` vs `email_address`, `phone` vs `phone_number`) | Even if the server checked flat keys, the names don't match Google's parser |
| Confirmed by grep | `user_data`, `email_address`, `phone_number` — zero occurrences across the entire codebase |

---

## Part 4 — What Currently Works (will not be changed)

| Thing | Status after fix | Notes |
|---|---|---|
| The form itself | ✅ Unchanged | Book Demo flow, OTP, Calendly — all untouched |
| Lead reaching CRM (Freshsales) | ✅ Unchanged | Backend `/api/leads` endpoint unaffected |
| Meta Pixel tracking | ✅ Unchanged | Reads flat `email`, `phone`, `first_name` — exactly what we send. Not affected by `user_data` |
| Path A (client-side Google Ads) | ✅ Already working | GTM maps flat keys directly on the GAds tag. Was fixed Sept 3. |
| GA4 session tracking | ✅ Fixed by CR-219 | Indian visitors now tracked after consent region fix |
| All other events (form_submitted, lead_verified) | ✅ Unchanged | They will also get `user_data` added (same function), which is harmless for them |
| Calendly demo_booked event | ✅ Unchanged | Gets `user_data` added — also harmless, improves EC if GTM trigger is added later |

---

## Part 5 — What Gets Fixed

| What improves | Plain-English explanation |
|---|---|
| Path B Enhanced Conversions | Server-side GAds tag now finds the `user_data` it needs. Hashed email/phone sent to Google. Conversion matching works. |
| Google Ads "Setup issues detected" diagnostic | Should clear within 24-72 hours of deploy as Google confirms valid EC data arriving |
| Attribution accuracy | Google can match more ad clicks to actual bookings, including cross-device and cookie-blocked users |
| ROAS numbers | More conversions attributed correctly → cost-per-book-demo number in Google Ads becomes more accurate |
| Value-based bidding | Google can see ₹200 conversion value per Book Demo confidently → Smart Bidding improves over time |

---

## Part 6 — Scope of the Code Change

### What needs to change

**One function in one file: `buildLeadPayload()` in `src/lib/gtm.js`**

Add a `user_data` block to the return object. The values are already being calculated in that
same function (email is already normalized by `normEmail()`, phone is already in E.164 format
from `normPhone()`, name is already split into first/last). It's a matter of packaging them
into the expected structure alongside the existing flat keys.

### What automatically benefits (because it's one central function)

All 5 places that call `pushLead()` automatically get the fix:

| Entry point | Event fired | Gets user_data? |
|---|---|---|
| Main demo form (`DemoForm.jsx`) | `thankyou_conversion` (book_demo) | ✅ Yes |
| Petpooja landing page | `thankyou_conversion` (book_demo) | ✅ Yes |
| Contact form (`MessageForm.jsx`) | `thankyou_conversion` (book_demo) | ✅ Yes |
| Pricing / checkout modal (`CheckoutModal.jsx`) | `thankyou_conversion` (book_demo) | ✅ Yes |
| Calendly post-booking (`CalendlyInline.jsx`) | `demo_booked` | ✅ Yes (harmless now, useful if demo_booked GTM trigger is added later) |
| All `form_submitted` events | `form_submitted` | ✅ Yes (harmless — no Google Ads conversion tag on this event, data is just richer) |

### What does NOT change

- None of the 30+ existing flat keys are removed (Meta and Path A still work as before)
- No form fields, no UI, no user flow
- No backend code, no API changes
- No new network requests
- No rebuild needed for the GTM-only path (Fix A)
- One rebuild needed if the code-side path (Fix B) is chosen

---

## Part 7 — The Two Fix Options

### Option A — GTM Only (no code, no rebuild)

Someone with edit access to web GTM (GTM-K5D84Z3L) does this:

1. Create a new variable → type "User-Provided Data"
2. In that variable: map `email_address` from dataLayer `email`, `phone_number` from
   dataLayer `phone`, `address.first_name` from dataLayer `first_name`,
   `address.last_name` from dataLayer `last_name`
3. Open the "GA4 - Book demo" tag → find the "User Data" section → set it to this variable
4. Test in GTM Preview → confirm "User Data" shows up hashed → Publish

**Risk:** If the GTM container is ever cloned, reset, or the variable accidentally deleted,
Enhanced Conversions silently breaks again with no trace in the codebase.

### Option B — Code-side (one edit, one rebuild)

Add the `user_data` block to `buildLeadPayload()`. This is a single-function change.
All values are already computed in the same function.

**Advantage:** The fix lives in the codebase permanently. Can be version-controlled, reviewed,
and audited. GTM variable becomes optional rather than mandatory.

### Recommended approach: Both A + B

Do the code fix (B) so the structure is correct at source, AND configure the GTM variable (A)
as a belt-and-suspenders mapping. GTM will find `user_data` directly in the event data and
use it — the variable just becomes a documented backup.

---

## Part 8 — What "Getting It Right" Looks Like

After the fix, when a Book Demo fires, the dataLayer push will contain:

```
event = "thankyou_conversion"
user_data = {
    email_address = "owner@restaurant.com"   ← Google finds this
    phone_number = "+919876543210"           ← Google finds this
    address = {
        first_name = "Rajesh"
        last_name = "Kumar"
    }
}
email = "owner@restaurant.com"              ← Meta still finds this (unchanged)
phone = "+919876543210"                     ← Meta still finds this (unchanged)
first_name = "Rajesh"                       ← Path A GAds still finds this (unchanged)
... (all other keys unchanged)
```

GTM Preview test: "User Data" section of the GA4 tag shows hashed values (not empty).
Google Ads: "Enhanced Conversions: Setup issues detected" clears within 24-72 hours.
Google Ads dashboard: More conversions attributed with "Enhanced" label.

---

## Part 9 — What This Does NOT Fix

| Item | Why not affected |
|---|---|
| Historical conversion data | Enhanced Conversions only improves future attribution. Past conversions stay as-is in Google Ads. |
| Calendly sGTM demo_booked trigger | If the owner hasn't added a GTM trigger for `demo_booked` yet, the data will arrive correctly but no tag will fire on it. That's a separate GTM setup step. |
| The "Managed through API" part of the diagnostic | This refers to the server-side API path (Path B) — which is the exact path being fixed. The diagnostic should update once Google confirms valid EC data. |

---

*Registered 2026-09-05. Source: Technical Brief (Enhanced Conversions Gap, Sep 5 2026) + full code investigation.*
*Line-by-line implementation plan: this file (Fix B scope is 1 function, ~8 lines added).*
*Ready to implement on instruction.*
