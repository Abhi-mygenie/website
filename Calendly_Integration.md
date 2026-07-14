# Calendly Integration (Demo Booking) — Durable Doc

> Inline demo-scheduling on the website + booking → CRM sync. Last verified: 2026-06-07.
> Code: `frontend/src/components/site/CalendlyInline.jsx`, `frontend/src/components/site/DemoForm.jsx`,
> `frontend/src/data/content.js` (`CALENDLY_URL`), `backend/server.py` (`/api/demo-booked`,
> `/api/calendly/webhook`), `backend/scripts/register_calendly_webhook.py`.
> Related: `Freshsales_CRM_Integration.md` (what happens to the lead after booking).

## Overview
After the demo form submits, a **branded inline Calendly** scheduler appears in our own card,
prefilled with the visitor's details. When they book, the Freshsales contact's Status moves to
**"Demo Scheduled"** and it's tagged `Demo Scheduled (Web)`. Detection runs via TWO idempotent paths
(in-browser event + server webhook), so a booking is never missed.

## Account / config
- Event: **MyGenie Demo** — `https://calendly.com/mygenie-abhishek/mygenie-demo`
  (set in `frontend/src/data/content.js` → `CALENDLY_URL`). 45-minute event.
- Event type URI: `https://api.calendly.com/event_types/b68d4d43-4f69-4193-b850-1f983e7061f1`
- Calendly user UUID: `06cd9ab4-02e3-4680-9987-635d553fea3d`

### Env vars (`backend/.env`)
| Var | Notes |
|---|---|
| `CALENDLY_API_TOKEN` | Personal Access Token. Scopes required: `scheduled_events:read`, `webhooks:read`, `webhooks:write`, `users:read`. Used ONLY by the registration script. |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Auto-generated 64-hex secret; backend uses it to HMAC-verify every webhook. |

## Branded inline embed
`CalendlyInline.jsx` appends Calendly's styling **URL query params** (the JS `pageSettings` option was
unreliable, so we build the URL directly):
- `primary_color=18A84A` (MyGenie green), `background_color=ffffff`, `text_color=14201A`
- `hide_gdpr_banner=1`, `hide_landing_page_details=1`, `hide_event_type_details=1`
The "45-minute walkthrough" context lives in our own card copy since event details are hidden.
**"Powered by Calendly" ribbon:** not a URL param — remove it via Calendly → Account → Branding (paid plan).

## Prefill (zero re-typing)
`Calendly.initInlineWidget({ url, parentElement, prefill, utm })`:
- `prefill.name`, `prefill.email`
- `prefill.customAnswers`:
  - `a1` = "Please share anything…" → auto-filled with `Outlet: … | Business: … | City: …` (text)
  - `a2` = **Phone Number** (required, phone type) → `+91` + visitor's 10-digit number
- Question slot mapping (a1/a2) discovered via `GET /event_types/{uuid}` → `custom_questions[].position`.
  Re-check if the event's questions are reordered/changed.
- `utm.utmContent` = Freshsales contact id, `utm.utmTerm` = our Mongo lead id → carried into the webhook
  payload's `tracking` object so the booking maps to the exact contact.
Verified live: name, email, and phone all populate on the actual Calendly "Enter Details" screen.

## Booking detection (two idempotent paths)
1. **In-browser** — `CalendlyInline` listens for the `calendly.event_scheduled` window message →
   frontend POSTs `/api/demo-booked` `{freshsales_contact_id, email, lead_id}`. Instant UX.
2. **Webhook** — Calendly POSTs `invitee.created` → `POST /api/calendly/webhook`:
   - Verifies `Calendly-Webhook-Signature` (HMAC-SHA256 over `"{t}.{body}"` with the signing key).
   - Reads `payload.tracking.utm_content` (contact id) + `utm_term` (lead id) + invitee email.
   - Calls `freshsales.mark_demo_booked()` → Status "Demo Scheduled" + tag; updates Mongo lead status.
   - Fires even if the visitor closes the tab.
Both call the same idempotent `mark_demo_booked`, so running both is safe.

## Webhook registration
```bash
cd /app/backend
python scripts/register_calendly_webhook.py            # uses preview URL from frontend/.env
python scripts/register_calendly_webhook.py https://PROD/api/calendly/webhook   # after deploy
python scripts/register_calendly_webhook.py --list     # inspect existing subscriptions
```
- Subscription currently **registered & active** for `invitee.created` (scope=user) against the preview URL.
- ⚠️ **Re-register with the production callback URL after deploying** — the preview URL changes.
- NOTE: an existing **Zapier** webhook also listens on `invitee.created`. Independent, no conflict.

## Verified (2026-06-07)
- Inline embed renders branded (green calendar, no GDPR banner, decluttered) inside our card.
- Prefill (name/email/phone) confirmed on the live booking screen.
- Real booking ("Abhishek", `geek.abhishek@gmal.com`): webhook fired, mapped via `utm_content`,
  contact `402208996047` → tag added + Status moved to "Demo Scheduled" (owner-confirmed in CRM UI).
- Signature check: valid → 200 + applied; bad signature → 401.

## Pending / ops
- Re-register webhook with prod URL after deploy.
- Remove "Powered by Calendly" ribbon (Account → Branding, paid plan).
- Optional: upgrade to webhook-only if you want to drop the in-browser path (not necessary).
