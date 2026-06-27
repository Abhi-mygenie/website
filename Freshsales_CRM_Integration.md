# Freshsales CRM Integration (Lead Routing) — Durable Doc

> Source of truth for the website → Freshsales lead sync + Calendly demo booking.
> Code: `backend/freshsales.py`, `backend/server.py` (`/api/demo-request`, `/api/quote`,
> `/api/demo-booked`, `/api/calendly/webhook`), `frontend/.../DemoForm.jsx`,
> `frontend/.../CalendlyInline.jsx`. Last verified: 2026-06-07.

## What it does
Every demo-request and pricing-quote submission is **mirrored as a Contact in Freshsales Suite**
(Freshworks Neo), in addition to MongoDB. After a demo form submits, a **branded inline Calendly**
scheduler appears (prefilled with name/email/phone); when the visitor books a slot, the contact's
**Status moves to "Demo Scheduled"** and it's tagged **"Demo Scheduled (Web)"**. The CRM push is
**best-effort** — a Freshsales failure never blocks the lead from saving or shows the visitor an error
(it's only logged). This protects the North-Star metric (demo bookings).

## Account / config
- Domain bundle: `mygenie-org.myfreshworks.com`, CRM path `/crm/sales`.
- API base (`FRESHSALES_BASE_URL`): `https://mygenie-org.myfreshworks.com/crm/sales/api`
- Auth header: `Authorization: Token token=<FRESHSALES_API_KEY>` (key in `backend/.env`).
- Entity: **Contact** (classic "Leads" are deprecated on Neo).

### Env vars (`backend/.env`)
| Var | Notes |
|---|---|
| `FRESHSALES_API_KEY` | Enables CRM push. Freshsales → Admin → API Settings. |
| `FRESHSALES_BASE_URL` | `.../crm/sales/api` |
| `FRESHSALES_DEMO_BOOKED_TAG` | Tag added on booking. Default `Demo Scheduled (Web)`. |
| `FRESHSALES_LIFECYCLE_LEAD_ID` | `403021121245` (Lead stage) — set on create. |
| `FRESHSALES_STATUS_NEW_ID` | `402001137706` (New) — set on create. |
| `FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID` | `403021121245` (Lead) — set on booking. |
| `FRESHSALES_STATUS_DEMO_BOOKED_ID` | `402001963264` (Demo Scheduled) — set on booking. |

## ✅ Lifecycle / Status — IS writable (write-only quirk)
**Verified live (2026-06-07):** this account's API **accepts** writes to `lifecycle_stage_id` and
`contact_status_id` — they persist and show correctly in the Freshsales UI — but a subsequent API
**GET returns `null`** for those fields (the API masks them on read). So we *set* them and trust the
write; never rely on reading them back to verify (use the UI). An earlier read-back check wrongly
concluded the fields were unwritable; that was a false negative.

Mapping in use:
- New lead (create) → Lifecycle **Lead** (`403021121245`) + Status **New** (`402001137706`).
- Demo booked → Lifecycle **Lead** + Status **Demo Scheduled** (`402001963264`).
  ("Demo Scheduled" lives in the **Lead** stage — correct for a *booked-but-not-attended* demo.
  "Qualified" stage statuses like "Demo Given" are for *after* the demo.)
- Existing contacts are **never downgraded** on re-submit (only phone/tags/custom fields updated).

Other lifecycle stages (reference): Qualified `403021121246`, Customer `403021121247`.

### Tags (belt-and-suspenders, also writable & readable)
| Source | Tag on create | On booking |
|---|---|---|
| Demo form | `Website Demo Lead` | + `Demo Scheduled (Web)` |
| Pricing quote | `Website Quote` | — |
| Buy Online | `Buy Online` | — |
Tags ARE readable via API, so they double as a verifiable signal and survive even if status-read is masked.

### Optional backup — tag→status Workflow
Not required (the status write works directly). But if you ever want an extra safety net, create a
Freshsales Workflow (Admin → Workflows): *Tag contains `Demo Scheduled (Web)` → set Status
`Demo Scheduled`*. Harmless alongside the direct write (idempotent).

### ⚠️ Custom fields NOT yet persisting (future enhancement)
Custom fields on this account use the key **`custom_field`** (singular) with **`cf_`-prefixed** names
(e.g. `cf_outlet_type`, `cf_pos_used`, `cf_pos_name`, `cf_est_name`, `cf_owner_phone_number`,
`cf_contact_person`, `cf_demo_fixed`, `cf_take_away__delivery`, `cf_priority`, `cf_next_step` …).
Our code currently sends `custom_fields` (plural) with generic keys (`source`, `sector`, …) which
Freshsales **silently ignores**. To persist outlet type / current POS / business name etc., map our
form fields to the real `cf_` names under a `custom_field` object. Get the exact field list:
`GET /crm/sales/api/settings/contacts/fields` (or inspect a contact's `custom_field` object).

### Required "External ID" field
This account marks `external_id` required on contacts. We set it to the lead's UUID (fallback email →
phone) so creation never fails, and it cross-references our DB record to the CRM contact.

## Calendly (demo booking)
The website demo scheduler and the booking → CRM trigger are documented separately in
**`Calendly_Integration.md`**. In short: after the demo form submits, a branded inline Calendly
(prefilled name/email/phone) appears; on booking, an in-browser event AND a signed webhook call
`mark_demo_booked()`, which sets Status **Demo Scheduled** + adds the `Demo Scheduled (Web)` tag. The
CRM contact id is carried to Calendly via embed `utm_content` so the webhook maps to the exact contact.

## Flow (end to end)
1. Form POST → `/api/demo-request` (or `/api/quote`).
2. Lead saved to MongoDB; `upsert_contact()` looks up by email → updates, else creates with
   Lead/New + source tag + external_id. Returns `freshsales_contact_id` (stored on Mongo doc + returned to FE).
3. Demo form shows branded inline Calendly (prefilled). On booking → `/api/demo-booked` (browser) and/or
   `/api/calendly/webhook` → `mark_demo_booked()` sets Status **Demo Scheduled** + adds tag; Mongo lead
   status → `demo_booked`.

## Verified (2026-06-07)
- Forms → contacts created, tagged, Status **New**.
- Real Calendly booking ("Abhishek", `geek.abhishek@gmal.com`, contact `402208996047`): webhook fired,
  mapped via utm_content, tag added, **Status moved to "Demo Scheduled"** (confirmed by owner in CRM UI).
- Webhook signature: valid → 200 + tag/status applied; bad sig → 401.
- Calendly prefill (name/email/phone) verified on the live booking screen.
- 3 backend regression tests pass (`backend/tests/test_freshsales.py`).
- Test contacts used emails `emergent.*@example.com` — safe for owner to delete.

## Done since (2026-06-07 — CR-1a & CR-4 Part A)
- **Contact "Send a message" form** live: new `POST /api/contact` (+ `GET /api/contact-messages`) → Mongo
  `contact_messages` + Freshsales `upsert_contact(tags=["Website Contact"])`; on submit auto-opens WhatsApp
  to the business number. Fields incl. preferred contact method (WhatsApp/Phone/Email). Code:
  `frontend/src/components/site/MessageForm.jsx`, `pages/Contact.jsx`.
- **All Call + WhatsApp CTAs switched to `9579504871`** (`tel:+919579504871`, `wa.me/919579504871`);
  old `7505242126` removed (`data/company.js`, `lib/seo.js`).
- **No-cost anti-junk layer** on all lead endpoints (`/demo-request`, `/quote`, `/contact`): honeypot +
  min-fill-time + per-IP/per-phone rate-limit. Code: `backend/antijunk.py`, `frontend/src/lib/antiBot.jsx`.

## Pending (owner / next)
- **OTP validation (CR-4 Part B):** delivery channel = client's bulk-SMS XML panel (route `OTP`). Needs
  panel base URL + provider, `username`, `apikey`, DLT `sender` ID, DLT OTP `templateid` + exact text.
- **`cf_` custom-field mapping (CR-1b):** map form data → real `cf_` fields so outlet type / POS / business /
  message / preferred-contact persist. Request doc: `Freshsales_Field_Mapping_Request.md`.
- Re-register Calendly webhook with prod URL after deploy (now env-driven: `CALENDLY_WEBHOOK_CALLBACK_URL`).
- Note: Turnstile (Cloudflare) is NOT implemented — covered later if needed; current layer is honeypot+timing+rate-limit.

> CR tracking for all the above lives in `/app/CR_Control_Dashboard.md` (5-gate model).
