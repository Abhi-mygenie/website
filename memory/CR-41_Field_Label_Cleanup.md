# CR-41: Freshsales Custom Field Label Cleanup

## Date: 2026-06-30
## Status: REGISTERED — Awaiting owner approval
## Priority: LOW (CRM usability — no code changes)

---

## Problem Statement

Many Freshsales custom fields were repurposed from their original names (e.g., `cf_latitude` stores fbclid, `cf_longitude` stores IP address). While some labels have already been updated to match their actual purpose, a few remain confusing or could be clearer.

---

## Recommended Label Changes

All changes are **Freshsales Admin → Settings → Contact Fields** only. Zero code changes — API names stay the same.

| # | API Name | Current Label | Recommended Label | Reason |
|---|---|---|---|---|
| 1 | `cf_pos_satifcation_level` | Search Keyword | **Search Term (utm_term)** | Clearer — matches UTM parameter name |
| 2 | `cf_demo_fixed` | Ad Name | **[DEPRECATED] Ad Name (old)** | Field is unused since CR-25. Mark clearly. |
| 3 | `cf_latitude` | fbclid | **Facebook Click ID (fbclid)** | More descriptive for sales team |
| 4 | `cf_orders_taken_via` | fpb Cookie | **FB Pixel Cookie (_fbp)** | Fix typo "fpb" → "_fbp", more descriptive |
| 5 | `cf_account_software_integrated` | Campaign ID | **UTM Campaign ID (utm_id)** | Distinguish from campaign name |
| 6 | `cf_take_away__delivery` | Ad Creative ID | **[UNUSED] Ad Creative ID** | Not mapped in code — mark clearly |
| 7 | `job_title` | Restaurant Name | **Business Name** | Not all leads are restaurants (hotels, bars, etc.) |
| 8 | `cf_pos_name` | POS NAME | **Current POS Name** | Cleaner formatting |
| 9 | `cf_category` | User agent | **Browser / User Agent** | More descriptive |

---

## Fields Already Named Well (no change needed)

| API Name | Current Label | Stores |
|---|---|---|
| `cf_est_name` | Ad Set | ✅ Correct |
| `cf_contact_person` | Ad Name / Event ID | ✅ Correct |
| `cf_pos_type` | Google Click ID | ✅ Correct |
| `cf_inventory_used` | Ad Set ID | ✅ Correct |
| `cf_complete_address` | Ad Placement | ✅ Correct |
| `cf_aggreator_management` | Source Platform | ✅ Correct |
| `cf_outlet_type` | Outlet Type | ✅ Correct |
| `cf_sku` | Years in Business | ✅ Correct |
| `cf_rooms` | OTP Verified | ✅ Correct |
| `cf_longitude` | IP Address | ✅ Correct |
| `cf_pos_used` | Currently Using POS? | ✅ Correct |

---

## Execution

1. Owner logs into Freshsales Admin → Settings → Contact Fields
2. For each field in the table above, click Edit → change Label → Save
3. No code deployment needed
4. No data migration needed

---

## Reference Document

Full field mapping saved at: `/app/memory/Freshsales_Field_Mapping.md`

---

*CR-41 registered: 2026-06-30. Agent: E1, Emergent Labs.*
