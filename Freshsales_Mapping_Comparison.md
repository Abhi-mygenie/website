# Freshsales Field Mapping — Old vs New Website Comparison

> **Purpose:** Side-by-side comparison of what the current live website sends to Freshsales
> vs what the new website (this codebase) will send after go-live.
>
> **Old website** = current live website at mygenie.online (sending data to CRM today).
> **New website** = this React + FastAPI codebase (not yet live).
> **New + CR-18** = new website after CR-18 standard fields remap is implemented.
>
> Source for old website mapping: inferred from CRM field labels, Freshsales account setup,
> and project handover docs. Source for new website: `backend/freshsales.py` + `server.py`.
> Last updated: 2026-06-23

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ Retained | Same field, same mapping — no change |
| 🔄 Changed | Field exists on both, but value/logic is different |
| 🆕 New | Not sent by old website, new website adds this |
| 🔁 Improved | Old website sent this but with a bug/limitation; new website fixes it |
| ⬛ Dropped | Old website sent this, new website does not |
| 🔜 Planned | New website will add this after CR-18 |
| ➖ Neither | Not sent by either (exists in Freshsales but unused) |

---

## 1. Identity & Contact Fields

| Freshsales field | CRM label | Old website | New website | Status | Notes |
|---|---|---|---|---|---|
| `first_name` | First name | ✅ Sent | ✅ Sent | ✅ Retained | Same split logic |
| `last_name` | Last name | ✅ Sent | ✅ Sent | ✅ Retained | |
| `mobile_number` | Mobile | ✅ Sent | ✅ Sent | ✅ Retained | |
| `work_number` | Work phone | ✅ Sent | ✅ Sent | ✅ Retained | Same as mobile |
| `email` | Email | ✅ Sent | ✅ Sent | ✅ Retained | Optional on both |
| `city` | City | Typed only | Typed + IP geo fallback | 🔄 Changed | New site auto-detects city from IP if not typed |
| `job_title` | Restaurant Name | Likely not sent | ✅ Sent = `business_name` | 🆕 New | Field label "Restaurant Name" — new site uses it for business name |
| `external_id` | External ID | Unknown / likely blank | ✅ `web_<phone>` | 🆕 New | Cross-form dedup key introduced in new site |
| `country` | Country | ➖ Not sent | ➖ Not sent yet | 🔜 Planned (CR-18) | Will be hardcoded "India" |
| `state` | STATE | ➖ Not sent | ➖ Not sent yet | 🔜 Planned (CR-18) | Will come from IP geo |

---

## 2. Lifecycle & Status

| Freshsales field | CRM label | Old website | New website | Status | Notes |
|---|---|---|---|---|---|
| `lifecycle_stage_id` | Lifecycle stage | ✅ Likely set | ✅ Set = Lead `403021121245` | ✅ Retained | Verified write-only on this account |
| `contact_status_id` | Status (New) | ✅ Likely set | ✅ Set = New `402001137706` | ✅ Retained | |
| `contact_status_id` | Status (Demo Scheduled) | ✅ On booking | ✅ Set = Demo Scheduled `402001963264` via webhook | ✅ Retained | New site adds HMAC-verified Calendly webhook (more reliable) |
| `tags` | Tags | Basic tags | Full tag matrix incl. OTP-Unverified, Multi-Form | 🔄 Changed | New site adds more granular tagging |

---

## 3. Attribution — First Touch

| Freshsales field | CRM label | Old website | New website | Status | Notes |
|---|---|---|---|---|---|
| `first_source` | Original source | Unknown | ✅ `first_utm_source` (localStorage) | 🆕 New / Unconfirmed | Old site may have sent basic utm_source but without first/last distinction |
| `first_medium` | Original medium | Unknown | ✅ `first_utm_medium` | 🆕 New / Unconfirmed | |
| `first_campaign` | Original campaign | Unknown | ✅ `first_utm_campaign` | 🆕 New / Unconfirmed | |
| `last_source` | Created from source | Unknown | ➖ Not sent yet | 🔜 Planned (CR-18) | |
| `last_medium` | Created from medium | Unknown | ➖ Not sent yet | 🔜 Planned (CR-18) | |
| `last_campaign` | Created through campaign | Unknown | ➖ Not sent yet | 🔜 Planned (CR-18) | |

---

## 4. Attribution — Last Touch

| Freshsales field | CRM label | Old website | New website | Status | Notes |
|---|---|---|---|---|---|
| `latest_source` | Most recent source | Unknown | ✅ `gclid` (priority) or `last_utm_source` | 🆕 New | New site prioritises gclid for Google Ads attribution |
| `latest_medium` | Most recent medium | Unknown | ✅ `last_utm_medium` | 🆕 New | |
| `latest_campaign` | Most recent campaign | Unknown | ✅ `last_utm_campaign` | 🆕 New | |
| `lead_source_id` | Source | Unknown | ➖ Not sent yet | 🔜 Planned (CR-18) | Will auto-derive: Paid Search / Organic / Social / Direct etc. |
| `keyword` | Keyword | Unknown | ➖ Not sent yet | 🔜 Planned (CR-18) | utm_term already goes to cf_ field; native slot also available |
| `medium` | Medium | Unknown | ➖ Not sent yet | 🔜 Planned (CR-18) | Standalone native medium field |
| `locale` | Locale | ➖ Not sent | ➖ Not sent yet | 🔜 Planned (CR-18) | Browser language |

---

## 5. Custom Fields — Lead Qualifiers

| Freshsales field | CRM label | Old website | New website | Status | Notes |
|---|---|---|---|---|---|
| `cf_outlet_type` | OUTLET TYPE | ✅ Likely sent | ✅ Sent | ✅ Retained | |
| `cf_sku` | Year of operation | ✅ Likely sent | ✅ Sent = `years_in_business` | ✅ Retained | |
| `cf_pos_used` | POS USED | ✅ Likely sent | ✅ Sent = `using_pos` text | ✅ Retained | |
| `cf_pos_name` | POS NAME | ✅ Likely sent | ✅ Sent = `current_pos` | ✅ Retained | |
| `cf_rooms` | OTP verified | ➖ Not sent (OTP didn't exist) | ✅ Sent = Yes / No | 🆕 New | OTP introduced in CR-4B |
| `cf_first_interest` | Message | ➖ Not sent (no contact form) | ✅ Sent = contact form message | 🆕 New | Contact "Send a message" form is new |
| `cf_pos` | POS (Yes/No dropdown) | ➖ | ➖ | ➖ Neither | Available — could map `using_pos` Yes/No here instead of text `cf_pos_used` |
| `cf_channel_manager_name` | Number of outlets | ➖ | ➖ | ➖ Neither | Available — no field in current forms |
| `cf_demo_fixed` | DEMO Fixed | ✅ Likely set on booking | ➖ Not set by new site | ⬛ Dropped | New site sets status + tag instead; could re-add |
| `cf_priority` | Lead Quality | ➖ | ➖ | ➖ Neither | Internal sales use — could be auto-set |

---

## 6. Custom Fields — Attribution & Tracking

| Freshsales field | CRM label | Old website | New website | Status | Notes |
|---|---|---|---|---|---|
| `cf_latitude` | fbclid | ✅ Sent | ✅ Sent = `fbclid` from URL | ✅ Retained | Field named "fbclid" in CRM — intentional |
| `cf_orders_taken_via` | fpb | ✅ Sent | ✅ Sent = `_fbp` cookie | ✅ Retained | Field named "fpb" in CRM |
| `cf_longitude` | IP Address | ✅ Likely sent | ✅ Sent = visitor IP | ✅ Retained | |
| `cf_category` | User agent | ✅ Likely sent | ✅ Sent = browser UA | ✅ Retained | |
| `cf_pos_satifcation_level` | Keywords (term) | Unknown | ✅ Sent = `utm_term` | 🆕 New / Unconfirmed | |
| `cf_est_name` | AD SET | Unknown | ✅ Sent = `utm_content` | 🆕 New / Unconfirmed | |

---

## 7. Key Structural Differences (Old vs New)

| Area | Old website | New website |
|---|---|---|
| **Custom field bug** | May have been sending `custom_fields` (plural) — silently dropped | Fixed: sends `custom_field` (singular) with correct `cf_` keys |
| **Dedup / returning visitors** | Unknown — likely created duplicate contacts | New site dedupes by email → phone → `external_id`; tags returning contacts `Multi-Form` |
| **OTP verification signal** | Not applicable | `cf_rooms` = Yes/No; unverified leads tagged `OTP-Unverified` |
| **Geo auto-detect** | City only from typed form field | Auto-detects city from IP if not typed (via `ipwho.is`) |
| **Attribution granularity** | Basic utm_source/medium at best | First-touch localStorage + last-touch sessionStorage; gclid/fbclid; device/browser/OS |
| **Calendly webhook** | Unknown | HMAC-SHA256 signed webhook — maps booking to exact CRM contact via `utm_content` embed |
| **Contact form → CRM** | No contact form | New contact form → `Website Contact` tag + `cf_first_interest` = message |
| **Anti-junk** | None | Honeypot + min-fill-time + per-IP/per-phone rate limiting |

---

## 8. Summary Counts

| Category | Old website | New website (live) | New + CR-18 |
|---|---|---|---|
| Standard fields sent | ~6–8 (estimated) | 16 | 24 |
| Custom fields sent | ~4–6 (estimated) | 12 | 12 |
| Attribution fields | 0–2 | 6 | 10 |
| **Total** | **~10–16** | **~28** | **~36** |

> **Note on "old website" estimates:** The exact old website field mapping is inferred from
> CRM field labels and handover docs. Fields marked "Likely sent" are those whose Freshsales
> labels (e.g. "IP Address", "User agent", "fbclid") indicate they were set up and used before
> this new build. For a definitive audit, pull a live contact from the old site and compare
> field population in the Freshsales UI.
