# MyGenie — Freshsales Custom Field Contract (Source of Truth)

**Version:** 2.0
**Date:** 2026-06-27
**Owner:** MyGenie POS
**Maintained by:** Engineering

> **This is the authoritative mapping between website attribution data and Freshsales CRM custom fields.**
> Any agent or developer modifying cf_ field usage MUST update this document.
> Freshsales silently drops values written to dropdown fields when the value doesn't match allowed choices — all attribution fields MUST be text type.

---

## 1. FIELD MAPPING TABLE

### 1A. Attribution Fields (set by `_attribution_to_crm()` in server.py)

| # | cf_ API Name | Freshsales Label (suggested) | Data Source | Touch Type | Type | Status |
|---|---|---|---|---|---|---|
| 1 | `cf_pos_satifcation_level` | Search Keyword | `utm_term` from URL | Refreshing (last touch) | text | ✅ Live |
| 2 | `cf_est_name` | Ad Set | `utm_content` from URL | Refreshing (last touch) | text | ✅ Live |
| 3 | `cf_contact_person` | Ad Name / Event ID | `event_id` (demo form) or `utm_ad` from URL | Refreshing | text | 🔧 NEW (replaces cf_demo_fixed) |
| 4 | `cf_latitude` | fbclid | `fbclid` from URL | Refreshing (last touch) | text | ✅ Live |
| 5 | `cf_orders_taken_via` | fbp Cookie | `_fbp` browser cookie | Refreshing | text | ✅ Live |
| 6 | `cf_self_delivery_take_away` | Ad Creative ID | `ad_id` from URL — Meta `{{ad.id}}` / Google `{creative}` | Refreshing | text | 🆕 CR-25 |
| 7 | `cf_inventory_used` | Ad Set ID | `adset_id` from URL — Meta `{{adset.id}}` / Google `{adgroupid}` | Refreshing | text | 🆕 CR-25 |
| 8 | `cf_complete_address` | Ad Placement | `placement` from URL — Meta `{{placement}}` / Google `{placement}` | Refreshing | text | 🆕 CR-25 |
| 9 | `cf_account_software_integrated` | Campaign ID | `utm_id` from URL — Meta `{{campaign.id}}` / Google `{campaignid}` | Refreshing | text | 🆕 CR-25 |
| 10 | `cf_aggreator_management` | Source Platform | `site_source_name` from URL — Meta `{{site_source_name}}` / Google `{network}` | Refreshing | text | 🆕 CR-25 |
| 11 | `cf_pos_type` | Google Click ID | `gclid` from URL (auto-appended by Google Ads) | Refreshing | text | 🆕 CR-28 |

### 1B. Form Data Fields (set directly from form submission payload)

| # | cf_ API Name | Freshsales Label | Data Source | Set By | Type | Status |
|---|---|---|---|---|---|---|
| 11 | `cf_outlet_type` | Outlet Type | Form field: `outlet_type` | Demo + Quote forms | text | ✅ Live |
| 12 | `cf_sku` | Years in Business | Form field: `years_in_business` | Demo form | text | ✅ Live |
| 13 | `cf_pos_used` | Currently Using POS? | Form field: `using_pos` | Demo form | text | ✅ Live |
| 14 | `cf_pos_name` | POS NAME | Form field: `current_pos` | Demo form | text | ✅ Live |
| 15 | `cf_first_interest` | Contact Message | Form field: `message` | Contact form only | text | ✅ Live |

### 1C. Server-Side Context Fields (set from request headers / IP lookup)

| # | cf_ API Name | Freshsales Label | Data Source | Set By | Type | Status |
|---|---|---|---|---|---|---|
| 16 | `cf_longitude` | IP Address | `request.headers["x-forwarded-for"]` | All 3 form endpoints | text | ✅ Live |
| 17 | `cf_category` | User Agent | `request.headers["user-agent"]` | All 3 form endpoints | text | ✅ Live |

### 1D. Verification & Booking Fields

| # | cf_ API Name | Freshsales Label | Data Source | Set By | Type | Status |
|---|---|---|---|---|---|---|
| 18 | `cf_rooms` | OTP Verified | `"Yes"` if OTP passed, `"No"` otherwise | Demo form + OTP backfill | dropdown (Yes/No) | ✅ Live |
| 19 | `cf_channel_manager_name` | Demo Scheduled At | `demo_at` (IST formatted datetime) | Calendly webhook | text | ✅ Live |

---

## 2. NATIVE FRESHSALES FIELDS (also set by our code)

These are built-in Freshsales fields (not cf_ prefixed), set via `extra_fields` in `upsert_contact()`:

| Native Field | Data Source | Touch Type | Set By |
|---|---|---|---|
| `first_source` | `first_utm_source` | First touch (set once) | `_attribution_to_crm()` |
| `first_medium` | `first_utm_medium` | First touch (set once) | `_attribution_to_crm()` |
| `first_campaign` | `first_utm_campaign` | First touch (set once) | `_attribution_to_crm()` |
| `latest_source` | `last_utm_source` (no longer polluted by gclid — CR-28) | Refreshing (every touch) | `_attribution_to_crm()` |
| `latest_medium` | `last_utm_medium` | Refreshing (every touch) | `_attribution_to_crm()` |
| `latest_campaign` | `last_utm_campaign` | Refreshing (every touch) | `_attribution_to_crm()` |
| `last_source` | `last_utm_source` | Set once (creation snapshot) | `_attribution_to_crm()` |
| `last_medium` | `last_utm_medium` | Set once (creation snapshot) | `_attribution_to_crm()` |
| `last_campaign` | `last_utm_campaign` | Set once (creation snapshot) | `_attribution_to_crm()` |
| `keyword` | `utm_term` | Refreshing | `_attribution_to_crm()` |
| `medium` | `last_utm_medium` or `first_utm_medium` | Refreshing | `_attribution_to_crm()` |
| `locale` | `navigator.language` | Refreshing | `_attribution_to_crm()` |
| `country` | `"India"` (hardcoded) | Always | `_attribution_to_crm()` |
| `lead_source_id` | Derived from UTM params + click IDs | Set once (creation) | `_derive_lead_source_id()` |
| `city` | Form field or IP geo lookup | Set once | Form endpoint |
| `state` | IP geo lookup | Set once | Form endpoint |
| `job_title` | Form field: `business_name` | Set once | Demo + Quote forms |
| `tags` | Computed from form type + OTP status | Additive | Form endpoint |

---

## 3. ABANDONED FIELDS

| cf_ API Name | Previous Use | Why Abandoned | Replaced By |
|---|---|---|---|
| `cf_demo_fixed` | event_id / utm_ad | **dropdown type** — Freshsales silently drops free text values. Was broken since original mapping. | `cf_contact_person` (text) |

---

## 4. SPARE FIELDS (available for future use)

| cf_ API Name | Current Label | Type |
|---|---|---|
| `cf_next_step` | NEXT STEP | text |

---

## 5. FIELDS NOT USABLE (dropdown/date/number — cannot store free text)

| cf_ API Name | Type | Choices | Status |
|---|---|---|---|
| `cf_demo_fixed` | dropdown | Yes, No | ❌ Abandoned (see §3) |
| `cf_take_away__delivery` | dropdown | Yes, No | ❌ Cannot use |
| `cf_basva_contacted` | dropdown | Yes, NO | ❌ Cannot use |
| `cf_channel_manager` | dropdown | Yes, No | ❌ Not used by code |
| `cf_menu_uploaded` | dropdown | Yes, No | ❌ Not used by code |
| `cf_pipeline` | dropdown | Today, This Week, Next Week, Next Month | ❌ Cannot use |
| `cf_pos` | dropdown | Yes, No | ❌ Cannot use |
| `cf_priority` | dropdown | 1-Qualified, 2-Follow up, 3-Demo Scheduled, 4-Demo Given, 5-Trail started | ❌ Not used by code |
| `cf_sp` | dropdown | critical, P1, P2, P3 | ❌ Not used by code |
| `cf_owner_phone_number` | number | — | ❌ Not used by code |
| `cf_renewal_date` | date | — | ❌ Not used by code |
| `cf_subscription_start_date` | date | — | ❌ Not used by code |
| `cf_subscription_end_date` | date | — | ❌ Not used by code |

---

## 6. URL TEMPLATES

### Meta Ads (set per ad → Destination URL → URL Parameters):
```
utm_source=facebook&utm_medium=cpm&utm_content={{adset.name}}&utm_campaign={{campaign.name}}&utm_term={{ad.name}}&fbclid={{fbclid}}&utm_id={{campaign.id}}&ad_id={{ad.id}}&adset_id={{adset.id}}&placement={{placement}}&site_source_name={{site_source_name}}
```

### Google Ads (set at Account level → Settings → Tracking → Tracking Template):
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_term={keyword}&ad_id={creative}&adset_id={adgroupid}&utm_id={campaignid}&placement={placement}&site_source_name={network}
```

---

## 7. CODE REFERENCE

| File | Function/Area | What it does |
|---|---|---|
| `frontend/src/lib/attribution.js` | `UTM_PARAMS`, `getAttribution()` | Captures URL params into localStorage/sessionStorage, returns flat attribution object |
| `backend/server.py` | `_attribution_to_crm()` (~line 174) | Maps attribution object → (native fields dict, cf_ fields dict) |
| `backend/server.py` | `_derive_lead_source_id()` (~line 143) | Derives Freshsales `lead_source_id` from UTM params + click IDs |
| `backend/freshsales.py` | `upsert_contact()` | Sends native + cf_ fields to Freshsales API (search by phone → create or update) |
| `backend/crm_sync.py` | `_upsert_lead()` (~line 95) | Reads cf_ fields FROM Freshsales during backfill → stores in MongoDB `backfilled_leads.attribution` |

---

## 8. CHANGE LOG

| Date | Change | CR |
|---|---|---|
| Pre-Jun 2026 | Initial 15 cf_ field mapping (CR-1/CR-2) | CR-1, CR-2 |
| 2026-06-24 | Standard fields remap — added native first_*/latest_*/last_*, keyword, medium, locale, country, lead_source_id | CR-18 |
| 2026-06-27 | +5 new fields (ad_id, adset_id, placement, utm_id, site_source_name) + cf_demo_fixed bug fix (moved to cf_contact_person) | CR-25 |
| 2026-06-27 | gclid moved to own field `cf_pos_type` — stops polluting `latest_source`. 1 spare field remaining (`cf_next_step`) | CR-28 |

---

*Freshsales Field Contract v2.1 — Updated 2026-06-27 by E1, Emergent Labs.*
*This document supersedes all previous field mapping references in HANDOVER.md, CR-2_Attribution_Mapping.md, and PRD.md.*
