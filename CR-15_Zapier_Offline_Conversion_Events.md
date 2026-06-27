# CR-15 — Zapier Offline Conversion Events: Demo Scheduled + Demo Given + Purchase

> **CR Number:** CR-15
> **Opened:** 2026-06-22
> **Raised by:** Owner (Abhishek)
> **Priority:** P0 — directly impacts Google Ads bidding quality and Meta attribution
> **Status:** 🟡 G2 Complete — awaiting owner mapping of Freshsales field names before build
> **Depends on:** Go-live (Step 4) — Zapier zaps use production data
> **Related CRs:** CR-3A (GTM tracking), CR-3B (GTM enhancements)

---

## Background

MyGenie has been running Google Ads for 9 months. The existing Zapier setup already handles
offline conversion firing — this CR formalises the exact event contract, deduplication
strategy, and mapping for the **new website's data model**.

Three events need to fire from Zapier to both Google Ads (OCI) and Meta (CAPI):

| # | Event | Source | Fires when |
|---|---|---|---|
| 1 | **Demo Scheduled** | Offline (Zapier only) | Sales team manually books Calendly on behalf of user who did NOT self-book |
| 2 | **Demo Given** | Exclusively offline | Customer actually appeared and attended the demo |
| 3 | **Purchase** | Online (client-side GTM) + Offline (Zapier) | Customer buys — online via Razorpay on website OR offline via bank transfer/UPI/cheque |

---

## Gate G1 — Impact Analysis ✅

### Event 1 — Demo Scheduled (offline path only)

**When it fires:** User filled the form → OTP verified or not → did NOT book Calendly themselves
→ sales team follows up → calls them → manually books Calendly on their behalf via the
sales team's Calendly link.

**Trigger in Zapier:** Calendly webhook `invitee.created` → filter: source ≠ website (or
filter by which Calendly calendar — sales team calendar vs embedded website calendar).

**Does client-side also fire?** No. If user didn't use the website Calendly widget, `demo_booked`
never fired client-side. These are mutually exclusive paths. **No deduplication risk.**

**Google Ads mapping:** Same conversion action as online → "Book appointment" (feeds the
same GA4-imported conversion). Goal: "Book appointment" in Google Ads.

**Meta mapping:** Same event as fb-schedule → `Schedule` standard event.

---

### Event 2 — Demo Given (exclusively offline)

**When it fires:** Calendly appointment time passes → Zapier checks if invitee attended
(via Calendly `invitee_no_show` absent, or manual CRM update in Freshsales) → fires
conversion signalling the prospect actually showed up.

**Does client-side also fire?** Never. This is a 100% offline signal. No deduplication needed.

**Google Ads mapping:** NEW conversion action to create — "Demo given". This is a higher-intent
signal than "Demo scheduled" and Google can eventually use it for bidding.

**Meta mapping:** Custom event — "Demo Given" OR standard `ViewContent` (your call — custom
event gives cleaner naming in Meta Events Manager).

**Conversion value:** Recommend ₹2,000 (higher intent than booking = ₹1,000).

---

### Event 3 — Purchase (online + offline, deduplication required)

**When it fires:**
- **Online path:** Customer completes Razorpay payment on website → client-side GTM tag
  fires `purchase` event → GA4 → Google Ads (Step 7 / CR-10 scope)
- **Offline path:** Sales team collects payment outside website (UPI, NEFT, cheque) →
  Freshsales deal marked "Won" → Zapier fires CAPI + OCI

**Deduplication required:** The same customer CANNOT buy both ways, but the same lead ID
might appear in both systems. Use `order_id` = lead UUID to prevent double-counting.

**Google Ads mapping:** Existing "Purchased" conversion action (19 historical conversions,
₹1,40,000 value). Source: "Website (Import from clicks)" → update to fire via OCI for
offline path using same conversion action name.

**Meta mapping:** Standard `Purchase` event with `value` and `currency: INR`.

**Conversion value:** Actual deal value from Freshsales (variable per deal) OR fixed ₹7,368
(historical average). Recommend passing actual deal value for value-based bidding.

---

## Gate G2 — Deduplication Strategy ✅

### The deduplication fields — complete reference

This is the definitive list of what to pass in every Zapier call for each platform.

---

#### Google Ads Offline Conversion Import (OCI)

Google matches the offline conversion to an ad click using the `gclid`. If `gclid` is null
(user came from organic/direct), Google will not attribute the conversion to an ad — but
it still records it in conversion history.

**Required fields for every Google Ads OCI call:**

| Field | Value | Where to get it in Freshsales |
|---|---|---|
| `gclid` | Google Click ID | Attribution custom field on contact (cf_gclid or equivalent) |
| `conversion_name` | Exact name of conversion action in Google Ads | See mapping table below |
| `conversion_time` | ISO 8601 with timezone: `2026-06-22T14:30:00+05:30` | Event timestamp (IST) |
| `conversion_value` | INR value (number, not string) | Event-specific — see below |
| `order_id` | Lead UUID from MongoDB | Stored as custom field on Freshsales contact (cf_lead_id or equivalent) |

**Deduplication:** If same `order_id` + same `conversion_name` is uploaded twice → Google Ads
ignores duplicate. One record per `order_id` per conversion action.

**Conversion name → value mapping:**

| Zapier event | Google Ads conversion_name | conversion_value |
|---|---|---|
| Demo Scheduled (offline) | `Book appointments` | ₹1,000 |
| Demo Given | `Demo given` (new — create in Google Ads) | ₹2,000 |
| Purchase (offline) | `Purchased` | Actual deal value from Freshsales |

---

#### Meta Conversions API (CAPI)

Meta deduplicates using `event_id`. If the client-side pixel fires with `event_id: "abc123"`
AND Zapier CAPI fires with `event_id: "abc123"`, Meta counts it once. The `event_id` is
the **single most important deduplication field**.

**Required fields for every Meta CAPI call:**

| Field | Value | Where to get it in Freshsales | Notes |
|---|---|---|---|
| `event_name` | Exact Meta event name (see below) | — | Must match pixel event name |
| `event_time` | Unix timestamp (seconds) | Event timestamp | `int(datetime.now().timestamp())` |
| `event_id` | Lead UUID | Stored as custom field on Freshsales contact | **PRIMARY dedup key** |
| `event_source_url` | `https://www.mygenie.online/` | Hardcode | Required by Meta |
| `user_data.ph` | Phone number | Contact phone field | Meta hashes it automatically in Zapier |
| `user_data.em` | Email address | Contact email field | Meta hashes it automatically in Zapier |
| `user_data.external_id` | Phone with +91 prefix | Contact phone field | Same as client-side |
| `user_data.fbc` | fbclid value | Attribution field on contact (if present) | Optional but improves match rate |
| `user_data.fbp` | _fbp cookie value | Attribution field on contact (if present) | Optional but improves match rate |
| `custom_data.value` | Conversion value (number) | Event-specific | |
| `custom_data.currency` | `INR` | Hardcode | |

**Event name → Meta standard event mapping:**

| Zapier event | Meta event_name | custom_data.value |
|---|---|---|
| Demo Scheduled (offline) | `Schedule` | `1000` |
| Demo Given | `ViewContent` (or custom: `Demo Given`) | `2000` |
| Purchase (offline) | `Purchase` | Actual deal value |

**Why event_id is the dedup key:**
Our code generates a UUID per lead at form submit time. This UUID is:
- Pushed to dataLayer as `event_id` (all 5 events share the same UUID per lead)
- Must be stored in Freshsales as a custom field
- Used here for CAPI deduplication

If the UUID is NOT stored in Freshsales, the fallback dedup key is `phone + event_name + date`
(less reliable but acceptable).

---

### What needs to be stored in Freshsales (data audit)

The following fields must exist on each Freshsales contact for this to work. Verify and tick:

| Field | What it is | Already mapped? | Freshsales field name |
|---|---|---|---|
| `gclid` | Google Click ID from ad | ? | `cf_????` — confirm from freshsales.py |
| `fbclid` | Facebook Click ID from ad | ? | `cf_????` — confirm |
| `fbp` | Facebook browser ID cookie | ? | `cf_????` — confirm |
| `event_id` | Lead UUID (MongoDB `id`) | ? | `cf_????` — **confirm or add** |
| `lead_id` | Same as event_id | ? | Used as order_id for Google OCI |

**Action required (owner):** Open a Freshsales contact created from the new website → check
which custom fields are populated → map them to the table above → share with dev team.

---

## Gate G3 — Implementation Plan

### What Zapier needs to build (3 zaps)

---

#### Zap 1 — Demo Scheduled (offline)

```
Trigger: Calendly → Invitee Created
         (filter: booked from sales team calendar, NOT website-embedded calendar)
         OR
         filter: no matching demo_requests record with otp_verified=true
         (i.e., online demo_booked didn't fire)

Actions (run in parallel):
  A. Google Ads OCI:
     - conversion_name: "Book appointments"
     - gclid: [from Freshsales contact attribution]
     - conversion_time: [Calendly invitee created_at, IST]
     - conversion_value: 1000
     - order_id: [lead UUID from Freshsales]

  B. Meta CAPI:
     - event_name: "Schedule"
     - event_id: [lead UUID from Freshsales]
     - event_time: [Unix timestamp]
     - user_data: phone, email, external_id, fbc, fbp
     - custom_data: value=1000, currency=INR
```

---

#### Zap 2 — Demo Given (exclusively offline)

```
Trigger: Freshsales → Deal stage changed to "Demo Given" (or contact field updated)
         OR
         Calendly → Invitee cancelled is ABSENT for a past appointment
         (i.e., appointment was NOT cancelled = attended)

Actions (run in parallel):
  A. Google Ads OCI:
     - conversion_name: "Demo given"  ← NEW conversion action, create first
     - gclid: [from Freshsales contact]
     - conversion_time: [demo appointment time, IST]
     - conversion_value: 2000
     - order_id: [lead UUID]

  B. Meta CAPI:
     - event_name: "ViewContent" (or custom "Demo Given")
     - event_id: [lead UUID] + "_demo_given"  ← append suffix to avoid dedup with Demo Scheduled
     - event_time: [Unix timestamp of demo]
     - user_data: phone, email, external_id, fbc, fbp
     - custom_data: value=2000, currency=INR
```

**Note on event_id for Demo Given:** Since Demo Given is a different conversion than
Demo Scheduled (same lead, different stage), append `_demo_given` suffix to the UUID so
Meta doesn't deduplicate it against the Schedule event for the same lead.

---

#### Zap 3 — Purchase (offline path)

```
Trigger: Freshsales → Deal stage changed to "Won" (or Razorpay webhook for offline payment)
         filter: payment method = offline (bank/UPI/cheque)
         OR Razorpay Subscription activated (for offline plan)

Actions (run in parallel):
  A. Google Ads OCI:
     - conversion_name: "Purchased"
     - gclid: [from Freshsales contact]
     - conversion_time: [payment date, IST]
     - conversion_value: [actual deal value from Freshsales]
     - order_id: [lead UUID] + "_purchase"  ← prevents dedup with online purchase

  B. Meta CAPI:
     - event_name: "Purchase"
     - event_id: [lead UUID] + "_purchase"
     - event_time: [Unix timestamp of payment]
     - user_data: phone, email, external_id, fbc, fbp
     - custom_data: value=[actual deal value], currency=INR
```

---

### New Google Ads conversion action to create

**"Demo given"** doesn't exist yet. Create before Zap 2 runs:

Google Ads → Tools → Conversions → New conversion action → Website (or Import from clicks)
- Name: `Demo given`
- Category: Book appointment
- Value: ₹2,000 (or use variable from Zap)
- Count: One per click
- Add to goal: "Book appointment" (same goal as Demo Scheduled)

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC1 | Demo Scheduled (offline) fires to Google Ads OCI → "Book appointments" conversion records +1 |
| AC2 | Demo Scheduled (offline) fires to Meta CAPI → "Schedule" event in Meta Events Manager |
| AC3 | If same lead self-booked online → demo_booked already fired → NO duplicate in Google Ads (order_id check) |
| AC4 | Demo Given fires to Google Ads OCI → "Demo given" conversion action records it |
| AC5 | Demo Given fires to Meta CAPI → "ViewContent"/"Demo Given" event |
| AC6 | Purchase (offline) fires to Google Ads OCI → "Purchased" conversion action |
| AC7 | Purchase (offline) fires to Meta CAPI → "Purchase" event with correct value |
| AC8 | Purchase online + Purchase offline for same lead → only ONE recorded (order_id dedup) |
| AC9 | All CAPI calls use correct Freshsales field for event_id, gclid, fbclid, fbp |
| AC10 | All OCI calls use IST timestamp in ISO 8601 format |

---

## Open Actions Before Build

| Owner | Action |
|---|---|
| **Owner** | Open a Freshsales contact → identify custom field names for gclid, fbclid, fbp, event_id (lead UUID) |
| **Owner** | Create "Demo given" conversion action in Google Ads |
| **Owner** | Confirm which Calendly calendar = sales team vs website-embedded (for Zap 1 filter) |
| **Owner** | Confirm Freshsales deal stage name for "Demo Given" (for Zap 2 trigger) |
| **Owner** | Confirm Freshsales deal stage name for "Won" / offline purchase signal (for Zap 3 trigger) |
| **Dev** | Verify `event_id` (lead UUID) is being stored as a Freshsales custom field in freshsales.py |
| **Dev** | Verify `gclid`, `fbclid`, `fbp` custom field names in freshsales.py → confirm they match what owner sees |

---

## Gate G4 — QA (post-build)

Test each Zap in Zapier test mode:
1. Create a test Freshsales contact with known gclid + event_id
2. Trigger Zap manually
3. Check Google Ads OCI upload → "All conversions" column should increment within 3h
4. Check Meta Events Manager → Test Events tab → event should appear

---

*CR-15 opened: 2026-06-22*
*G1 + G2 complete: 2026-06-22*
*Blockers: Freshsales field name audit (owner) + "Demo given" conversion action creation (owner)*
