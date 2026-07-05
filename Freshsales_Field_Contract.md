# Freshsales Field Contract — MyGenie Website

> **Version:** 1.2 (CR-18 implemented)
> **Last updated:** 2026-06-24
> **Status of this doc:** Section A = LIVE TODAY. Section B = empty (all planned fields now live).
> **Shareable:** Yes — this is the single source of truth for any project connected to the
> MyGenie Freshsales account (`mygenie-org.myfreshworks.com`).
>
> Code references: `backend/freshsales.py` → `upsert_contact()`, `backend/server.py` →
> `_attribution_to_crm()`, `_derive_lead_source_id()`, `create_demo_request()`, `create_quote()`, `create_contact_message()`.

---

## How to read this doc

| Column | Meaning |
|---|---|
| **Freshsales field** | Exact API key to use in the JSON payload |
| **CRM label** | What it's called in the Freshsales UI |
| **Type** | native = standard contact field; custom = `custom_field{}` sub-key |
| **Data source** | Where the value comes from |
| **Forms** | D = Demo request, Q = Quote/Buy, C = Contact message |
| **Set rule** | CREATE = set only on new contact; ALWAYS = set + refresh on update too |

---

## SECTION A — LIVE TODAY (current codebase, pre-CR-18)

### A1. Identity & Contact Fields

| Freshsales field | CRM label | Type | Data source | Forms | Set rule |
|---|---|---|---|---|---|
| `first_name` | First name | native | Split from form `name` field | D Q C | CREATE |
| `last_name` | Last name | native | Split from form `name` field | D Q C | CREATE |
| `mobile_number` | Mobile | native | Form `phone` field | D Q C | ALWAYS |
| `work_number` | Work phone | native | Same as `phone` (fallback) | D Q C | ALWAYS |
| `email` | Email | native | Form `email` field (optional) | D Q C | CREATE |
| `city` | City | native | Form `city` field → fallback to IP geo | D Q C | ALWAYS |
| `job_title` | Restaurant Name | native | Form `business_name` field | D Q | ALWAYS |
| `external_id` | External ID | native | `web_<phone>` — cross-form dedup key | D Q C | CREATE |

### A2. Lifecycle & Status

| Freshsales field | CRM label | Type | Value | Forms | Set rule |
|---|---|---|---|---|---|
| `lifecycle_stage_id` | Lifecycle stage | native | `403021121245` (Lead) | D Q C | CREATE only |
| `contact_status_id` | Status | native | `402001137706` (New) on create; `402001963264` (Demo Scheduled) on booking | D Q C | CREATE; updated on booking |
| `tags` | Tags | native | See tag matrix below | D Q C | ALWAYS (merged, never removed) |

**Tag matrix:**

| Event | Tag added |
|---|---|
| Demo request — OTP verified | `Website Demo Lead` |
| Demo request — OTP not verified | `Website Demo Lead` + `OTP-Unverified` |
| Quote / pricing request | `Website Quote` |
| Buy online intent | `Buy Online` |
| Contact message | `Website Contact` |
| Demo booked (Calendly) | `Demo Scheduled (Web)` |
| Returning visitor — same phone | `Multi-Form` (merged with existing tags) |

### A3. Attribution — First Touch (set once, never overwritten on returning contact)

| Freshsales field | CRM label | Type | Data source | Forms | Set rule |
|---|---|---|---|---|---|
| `first_source` | Original source | native | `first_utm_source` (localStorage) | D Q C | CREATE only |
| `first_medium` | Original medium | native | `first_utm_medium` (localStorage) | D Q C | CREATE only |
| `first_campaign` | Original campaign | native | `first_utm_campaign` (localStorage) | D Q C | CREATE only |

### A4. Attribution — Last Touch (refreshed on every re-submit)

| Freshsales field | CRM label | Type | Data source | Forms | Set rule |
|---|---|---|---|---|---|
| `latest_source` | Most recent source | native | `gclid` (priority) → fallback `last_utm_source` | D Q C | ALWAYS |
| `latest_medium` | Most recent medium | native | `last_utm_medium` | D Q C | ALWAYS |
| `latest_campaign` | Most recent campaign | native | `last_utm_campaign` | D Q C | ALWAYS |
| `keyword` | Keyword | native | `utm_term` from attribution | D Q C | ALWAYS |
| `medium` | Medium | native | `last_utm_medium` (fallback first) | D Q C | ALWAYS |
| `locale` | Locale | native | `navigator.language` from browser | D Q C | ALWAYS |
| `state` | STATE | native | `geo.py` region field (IP-based) | D Q C | ALWAYS |

### A5. Attribution — Creation Snapshot (set once, never overwritten on returning contact)

| Freshsales field | CRM label | Type | Data source | Forms | Set rule |
|---|---|---|---|---|---|
| `last_source` | Created from source | native | `last_utm_source` | D Q C | CREATE only |
| `last_medium` | Created from medium | native | `last_utm_medium` | D Q C | CREATE only |
| `last_campaign` | Created through campaign | native | `last_utm_campaign` | D Q C | CREATE only |
| `lead_source_id` | Source | native | Auto-derived from UTMs + click IDs (see §lead_source_id) | D Q C | CREATE only |
| `country` | Country | native | Hardcoded `"India"` | D Q C | CREATE only |

#### `lead_source_id` derivation (priority order)

```
gclid present                              → 402001798783  Paid Search
utm_medium in [cpc, ppc, paid, paidsearch] → 402001798783  Paid Search
fbclid present                             → 402002468721  Facebook Lead Form
utm_medium in [social, social-media]       → 402001798785  Social Media
utm_source in [facebook, instagram, meta]  → 402001798785  Social Media
utm_medium = display                       → 402001798786  Display Ads
utm_medium = email                         → 402001798777  Email
utm_medium = referral                      → 402001798781  Referral
utm_source = google (no gclid)             → 402001798776  Organic Search
any utm_source present                     → 402001798775  Web
(nothing)                                  → 402001798782  Direct
```

### A5. Custom Fields — Lead Qualifiers

| Freshsales field | CRM label | Type | Data source | Forms | Set rule |
|---|---|---|---|---|---|
| `cf_outlet_type` | OUTLET TYPE | custom | Form `outlet_type` field | D Q | ALWAYS |
| `cf_sku` | Year of operation | custom | Form `years_in_business` field | D | ALWAYS |
| `cf_pos_used` | POS USED | custom | Form `using_pos` field (text) | D | ALWAYS |
| `cf_pos_name` | POS NAME | custom | Form `current_pos` field | D | ALWAYS |
| `cf_rooms` | OTP verified | custom | `"Yes"` / `"No"` from OTP gate | D | ALWAYS |
| `cf_first_interest` | Message | custom | Form `message` field | C | ALWAYS |

### A6. Custom Fields — Attribution & Tracking

| Freshsales field | CRM label | Type | Data source | Forms | Set rule |
|---|---|---|---|---|---|
| `cf_pos_satifcation_level` | Keywords (term) | custom | `utm_term` from attribution | D Q C | ALWAYS |
| `cf_est_name` | AD SET | custom | `utm_content` from attribution | D Q C | ALWAYS |
| `cf_latitude` | fbclid | custom | `fbclid` URL param from attribution | D Q C | ALWAYS |
| `cf_orders_taken_via` | fpb | custom | `_fbp` browser cookie from attribution | D Q C | ALWAYS |
| `cf_longitude` | IP Address | custom | Visitor IP (from `X-Forwarded-For` header) | D Q C | ALWAYS |
| `cf_category` | User agent | custom | Browser `User-Agent` header | D Q C | ALWAYS |

---

## SECTION B — ALL FIELDS NOW LIVE (CR-18 implemented 2026-06-24)

All fields previously listed here have been moved to Section A above.

---

## SECTION C — CAPTURED IN MONGODB ONLY (no Freshsales field yet)

> Stored in `attribution{}` on every lead document. To push to Freshsales, create a
> `cf_` custom text field in Freshsales and add one line to `_attribution_to_crm()`.

| Data | MongoDB key | Suggested CRM label |
|---|---|---|
| Last-touch utm_source | `attribution.last_utm_source` | Latest source (UTM) |
| Landing page URL | `attribution.landing_page` | Landing page |
| Conversion page URL | `attribution.conversion_page` | Conversion page |
| Referrer | `attribution.referrer` | Referrer |
| Device type | `attribution.device_type` | Device type |
| OS | `attribution.os` | OS |
| Browser | `attribution.browser` | Browser |
| Pages viewed | `attribution.pages_viewed` | Pages viewed |
| Time on site (seconds) | `attribution.time_on_site` | Time on site (s) |
| gbraid (Google iOS click ID) | `attribution.gbraid` | gbraid |
| wbraid (Google iOS click ID) | `attribution.wbraid` | wbraid |
| msclkid (Microsoft Ads) | `attribution.msclkid` | msclkid |
| _fbc cookie (Meta click) | `attribution.fbc` | fbc |
| OTP verified flag (Demo) | `doc.otp_verified` | — (already in `cf_rooms`) |
| Geo region / state | `geo.region` | — (will be `state` after CR-18) |
| Geo country | `geo.country_name` | — (will be hardcoded after CR-18) |

---

## SECTION D — FIELDS NOT SENT (and why)

| Freshsales field | CRM label | Reason not sent |
|---|---|---|
| `subscription_status` etc. | Email/SMS opt-in | Not collected; marketing channel, not lead data |
| `owner_id` | Sales owner | Manual CRM assignment — not automated from web |
| `territory_id`, `campaign_id` | Territory / Campaign | Internal CRM IDs — not applicable at lead creation |
| `lead_score`, `customer_fit` | Score / Fit | Auto-calculated by Freshsales |
| `facebook`, `twitter`, `linkedin` | Social profiles | Not collected on any form |
| `address`, `zipcode` | Address | Not collected |
| `work_email` | Work email | Not collected separately |
| `time_zone` | Time zone | Freshsales expects specific string keys (e.g. "Mumbai"); browser `Intl` timezone string doesn't map cleanly — deferred |
| `phone_numbers` | Other phone numbers | Group field; not needed |
| `recent_note` | Recent note | Manual CRM use |
| Chat / sequence / activity fields | Various | Auto-managed by Freshsales |

---

## SECTION E — DEMO BOOKED TRIGGER (separate from form submit)

Fired by `POST /api/demo-booked` (browser, after Calendly inline) or `POST /api/calendly/webhook`
(signed HMAC-SHA256 server-to-server from Calendly).

| Field updated | Value |
|---|---|
| `tags` | Existing tags + `Demo Scheduled (Web)` (merged, no removal) |
| `lifecycle_stage_id` | `403021121245` (Lead) — env `FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID` |
| `contact_status_id` | `402001963264` (Demo Scheduled) — env `FRESHSALES_STATUS_DEMO_BOOKED_ID` |

---

## Integration Notes (for connected projects)

1. **Auth header:** `Authorization: Token token=<FRESHSALES_API_KEY>`
2. **Base URL:** `https://mygenie-org.myfreshworks.com/crm/sales/api`
3. **Custom fields use `custom_field` (singular)** with `cf_`-prefixed keys. `custom_fields` (plural) is silently ignored by this account.
4. **`lifecycle_stage_id` and `contact_status_id` are write-only** on this account — they persist in the UI but the API returns `null` on a GET. Always verify via the Freshsales UI, not the API.
5. **Dedup key:** `external_id` = `web_<phone>`. Lookup order: email first → phone fallback.
6. **All CRM writes are best-effort** — a Freshsales failure must never block lead capture in MongoDB or surface an error to the visitor.
7. **Tags are merged, never removed** — use `_merge_tags(existing, *new)` pattern.
8. **Field list API:** `GET /crm/sales/api/settings/contacts/fields` — run this to get current `cf_` names before adding any new field.
