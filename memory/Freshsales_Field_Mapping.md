# Freshsales Field Mapping — Complete Reference
## Last updated: 2026-06-30

This document maps every field the website code sends to Freshsales,
with the actual Freshsales UI label, API name, and data source.

---

## 1. ATTRIBUTION — Native Freshsales Fields

These are built-in Freshsales contact fields. Labels can be changed in Freshsales Admin but API names are fixed.

| Freshsales Label (UI) | API Name | Data Source (code) | Code Location | Notes |
|---|---|---|---|---|
| Original source | `first_source` | `attribution.first_utm_source` or "website" default | `server.py:204` | CR-39: falls back to "website" for direct visitors |
| Original medium | `first_medium` | `attribution.first_utm_medium` | `server.py:206` | Set-once on create |
| Original campaign | `first_campaign` | `attribution.first_utm_campaign` | `server.py:208` | Set-once on create |
| Most recent source | `latest_source` | `attribution.last_utm_source` | `server.py:213` | Refreshes on every form submit |
| Most recent medium | `latest_medium` | `attribution.last_utm_medium` | `server.py:215` | Refreshes |
| Most recent campaign | `latest_campaign` | `attribution.last_utm_campaign` | `server.py:217` | Refreshes |
| Created from source | `last_source` | `attribution.last_utm_source` | `server.py:221` | CR-18: creation-time snapshot, set-once |
| Created from medium | `last_medium` | `attribution.last_utm_medium` | `server.py:223` | CR-18: snapshot |
| Created through campaign | `last_campaign` | `attribution.last_utm_campaign` | `server.py:225` | CR-18: snapshot |
| Keyword | `keyword` | `attribution.utm_term` | `server.py:233` | CR-18: refreshing native field |
| Medium | `medium` | `last_utm_medium` or `first_utm_medium` | `server.py:235` | CR-18: refreshing |
| Locale | `locale` | `attribution.language` | `server.py:238` | Browser locale e.g. "en-GB" |
| Source | `lead_source_id` | Derived from gclid/medium/source | `server.py:228` → `_derive_lead_source_id()` | Dropdown: Paid Search, Facebook, Direct, etc. |
| Country | `country` | `DEFAULT_COUNTRY` env var | `server.py:227` | Always "India" |

### Freshsales guard on UPDATE (returning visitor):
- `first_*`, `last_*`, `country`, `lead_source_id` are NEVER overwritten on existing contacts
- Only `latest_*`, `keyword`, `medium`, `locale` refresh
- See `freshsales.py:198-206`

---

## 2. AD TRACKING — Custom Fields

These are repurposed Freshsales custom fields. The API name (cf_*) is the original field; the label was renamed to match the actual data stored.

| Freshsales Label (UI) | API Name | Data Source (code) | Code Location | Notes |
|---|---|---|---|---|
| Ad Set | `cf_est_name` | `attribution.utm_content` | `server.py:244` | Ad Set name from UTM |
| Search Keyword | `cf_pos_satifcation_level` | `attribution.utm_term` | `server.py:242` | Duplicate of native `keyword` field |
| Ad Name / Event ID | `cf_contact_person` | `event_id` (overrides `utm_ad`) | `server.py:247` + line 304 | CR-25: event_id wins when present |
| Ad Name (old) | `cf_demo_fixed` | **UNUSED** — dropdown, was old ad name field | — | Deprecated after CR-25 moved to cf_contact_person |
| fbclid | `cf_latitude` | `attribution.fbclid` | `server.py:248` | Facebook Click ID |
| Google Click ID | `cf_pos_type` | `attribution.gclid` | `server.py:250` | CR-28: gclid in dedicated field |
| fpb Cookie | `cf_orders_taken_via` | `attribution.fbp` | `server.py:252` | _fbp browser cookie for Meta CAPI |
| Ad Set ID | `cf_inventory_used` | `attribution.adset_id` | `server.py:257` | CR-25: numeric adset ID |
| Ad Placement | `cf_complete_address` | `attribution.placement` | `server.py:259` | CR-25: ad placement |
| Campaign ID | `cf_account_software_integrated` | `attribution.utm_id` | `server.py:261` | CR-25: utm_id (campaign numeric ID) |
| Source Platform | `cf_aggreator_management` | `attribution.site_source_name` | `server.py:263` | CR-25: site_source_name |
| Ad Creative ID | `cf_take_away__delivery` | **UNUSED** — not mapped in code | — | Dropdown field, available for future use |

---

## 3. BUSINESS / FORM FIELDS

| Freshsales Label (UI) | API Name | Data Source (code) | Code Location |
|---|---|---|---|
| First name | `first_name` | `name` → `_split_name()` first part | `freshsales.py:223` |
| Last name | `last_name` | `name` → `_split_name()` remaining | `freshsales.py:223` |
| Mobile | `mobile_number` | Form `phone` | `server.py:289` |
| Work phone | `work_number` | Form `phone` (same) | `freshsales.py:229` |
| City | `city` | Form `city` or geo IP fallback | `server.py:291` |
| STATE | `state` | `geo.region` (IP geolocation) | `server.py:292` |
| Restaurant Name | `job_title` | Form `business_name` | `server.py:293` |
| External ID | `external_id` | `web_{phone}` | `server.py:290` |
| Tags | `tags` | Code logic: "Website Demo Lead" + OTP tag + source tag | `server.py:278-281` |
| Outlet Type | `cf_outlet_type` | Form `outlet_type` | `server.py:296` |
| Years in Business | `cf_sku` | Form `years_in_business` | `server.py:297` |
| Currently Using POS? | `cf_pos_used` | Form `using_pos` | `server.py:298` |
| POS NAME | `cf_pos_name` | Form `current_pos` | `server.py:299` |
| OTP Verified | `cf_rooms` | `otp_verified` → "Yes" / "No" | `server.py:302` |
| IP Address | `cf_longitude` | Request client IP | `server.py:300` |
| User agent | `cf_category` | Request User-Agent header | `server.py:301` |

---

## 4. UNUSED CUSTOM FIELDS (not mapped in code)

| Freshsales Label (UI) | API Name | Status |
|---|---|---|
| POS | `cf_pos` | Unused (dropdown) |
| Demo Scheduled At | `cf_channel_manager` | Unused (dropdown) |
| Number of outlets | `cf_channel_manager_name` | Unused |
| Contact Phone | `cf_owner_phone_number` | Unused (number) |
| Contact Message | `cf_first_interest` | Unused |
| Renewal Date | `cf_renewal_date` | Unused (date) |
| Lead Quality | `cf_priority` | Unused (dropdown) |
| Subscription Start Date | `cf_subscription_start_date` | Unused (date) |
| Subscription End Date | `cf_subscription_end_date` | Unused (date) |
| Pipeline | `cf_pipeline` | Unused (dropdown) |
| Sales Priority | `cf_sp` | Unused (dropdown) |
| Menu Uploaded | `cf_menu_uploaded` | Unused (dropdown) |
| Basva Contacted | `cf_basva_contacted` | Unused (dropdown) |
| NEXT STEP | `cf_next_step` | Unused |

---

## 5. EXAMPLE: Google Paid Lead (Abhishek Purohit, 9624056756)

| Freshsales Label | Value |
|---|---|
| Original source | google |
| Original medium | cpc |
| Original campaign | 22893707509 |
| Most recent source | google |
| Most recent medium | cpc |
| Most recent campaign | 22893707509 |
| Keyword | petpooja |
| Ad Set | 190599557224 |
| Search Keyword | petpooja |
| Google Click ID | CjwKCAjw0o3S... |
| fpb Cookie | fb.1.1782... |
| Ad Name / Event ID | 994aba23-... |
| Restaurant Name | HOTEL SHREE DAAN |
| Outlet Type | Hotel / Resort |
| OTP Verified | No |
| Tags | Website Demo Lead, OTP-Unverified, Demo Scheduled (Web) |

## 6. EXAMPLE: Direct/Website Lead (mtt, 9579504871)

| Freshsales Label | Value |
|---|---|
| Original source | website (CR-39 default) |
| Original medium | *(null)* |
| Original campaign | *(null)* |
| All other attribution | *(null)* — no UTM params |
| Ad Name / Event ID | 6c701bd0-... (event_id only) |
| Restaurant Name | vv |
| Outlet Type | Bar & Brewery |
| OTP Verified | No |
| Tags | Website Demo Lead, OTP-Unverified, Demo Scheduled (Web) |

---

*Document created: 2026-06-30. Agent: E1, Emergent Labs.*
