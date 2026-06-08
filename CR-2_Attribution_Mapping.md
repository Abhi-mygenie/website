# CR-2 — Attribution & Data Capture — MAPPING REFERENCE

> Status: **BUILT & LIVE-VERIFIED (2026-06-08).** Captured on all 4 lead forms (Demo, Quote/Buy, ROI, Contact).
> Frontend: `frontend/src/lib/attribution.js` (first-touch in localStorage, last-touch in sessionStorage) + `AttributionTracker` in `App.js`. Backend map: `server.py._attribution_to_crm()`; native fields written via `freshsales.upsert_contact(extra_fields=...)`.

## ✅ Confirmed mapping (website → Freshsales) — owner-approved
| Website data | Freshsales field | CRM label | Type |
|---|---|---|---|
| utm_source (first touch) | `first_source` | Original source | native |
| utm_medium (first touch) | `first_medium` | Original medium | native |
| utm_campaign (first touch) | `first_campaign` | Original campaign | native |
| **gclid** | `latest_source` | Most recent source | native (Option B; falls back to last utm_source if no gclid) |
| utm_medium (last touch) | `latest_medium` | Most recent medium | native |
| utm_campaign (last touch) | `latest_campaign` | Most recent campaign | native |
| utm_term | `cf_pos_satifcation_level` | "Keywords (term)" | custom |
| utm_content | `cf_est_name` | "AD SET" | custom |
| fbclid | `cf_latitude` | "fbclid" | custom |
| _fbp cookie | `cf_orders_taken_via` | "fpb" | custom |
| IP address | `cf_longitude` | "IP Address" | custom (pre-existing) |
| User agent | `cf_category` | "User agent" | custom (pre-existing) |
| otp_verified (Demo) | `cf_rooms` | "OTP verified" | custom (Yes/No) |

**Rule:** on a returning contact, `first_*` is never overwritten (set-once); `latest_*` + cf_ refresh each submit.

## 🟠 MISSING — captured in MongoDB but NO Freshsales field yet
These are stored on every lead in Mongo (`demo_requests` / `quotes` / `contact_messages` → `attribution{}`),
but are **not pushed to the CRM** because there's no matching field. To get them into Freshsales, ask the
CRM team to **create a text custom field** for each you want, then send me the `cf_` API name (1-line wire each):

| Website data | Suggested new Freshsales field label | Why it matters |
|---|---|---|
| `last_utm_source` (last touch source) | "Latest source (UTM)" | currently `latest_source` holds gclid (Option B), so last-touch source has no slot |
| `landing_page` | "Landing page" | first page of the session |
| `conversion_page` | "Conversion page" | page where the form was submitted |
| `referrer` | "Referrer" | where the visitor came from (e.g. google.com) |
| `device_type` | "Device type" | mobile / desktop |
| `os` | "OS" | Android / iOS / Windows… |
| `browser` | "Browser" | Chrome / Safari… |
| `language` | "Language" | e.g. en-IN |
| `timezone` | "Timezone" | e.g. Asia/Kolkata |
| **geo / city** | `city` (native) | ✅ **DONE** — IP→city via `ipwho.is` (keyless HTTPS), used only when the visitor didn't type a city. region/country stored in Mongo `geo{}`. |
| `pages_viewed` | "Pages viewed" | engagement signal |
| `time_on_site` | "Time on site (s)" | engagement signal |
| `gbraid` / `wbraid` | "gbraid" / "wbraid" | iOS Google click ids (privacy-safe) |
| `msclkid` | "msclkid" | Microsoft/Bing Ads click id |
| `event_id` | `latest_campaign` (PHP) | we map last utm_campaign here instead; revisit if Meta CAPI dedup needed |

## Notes / future
- **Geo/city DONE** — `backend/geo.py` uses `ipwho.is` (keyless HTTPS; ipapi.co was 429-blocked for datacenter IPs). City → native `city` field (typed city wins); region+country stored in Mongo `geo{}`. Best-effort, never blocks lead capture.
- Once any field above is created in Freshsales, add one line to `_attribution_to_crm()` and it flows automatically.
