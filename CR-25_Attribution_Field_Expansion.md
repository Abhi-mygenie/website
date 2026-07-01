# CR-25 — Attribution Field Expansion + Phase G Enablement

**Date:** 2026-06-27
**Raised by:** Owner
**Priority:** P0
**Status:** G2 — Planning Complete, awaiting owner pre-requisites before G3

---

## 1. OBJECTIVE

Capture 5 missing Meta/Google ad parameters (ad_id, adset_id, placement, utm_id, site_source_name) from click URLs through the full pipeline: **browser → MongoDB → Freshsales CRM → backfill sync**. This unblocks Phase G attribution stitching (tying CRM outcomes to individual ads).

---

## 2. FRESHSALES FIELD AUDIT RESULTS (2026-06-27)

### 2A. Field Type Discovery

34 total cf_ fields exist. Critical finding: **Freshsales silently drops values written to dropdown fields when the value doesn't match the allowed choices.** This affects existing production mappings.

### 2B. Existing Production Bug — `cf_demo_fixed`

| Field | Code sends | Field type | Allowed choices | Result |
|---|---|---|---|---|
| `cf_demo_fixed` | event_id string (e.g. `"abc123"`) or utm_ad text | **dropdown** | `Yes`, `No` | ❌ **Silently dropped for every lead** |

**Evidence:** Contact 402210846454 (S Sayyad, 26 Jun) — all native attribution fields populated correctly by production code, but ALL cf_ fields are empty. The `keyword` native field has `"Ad Test: DCA | Video 02"` (from utm_term), but `cf_pos_satifcation_level` (same utm_term mapping) is empty on this contact.

> **Note:** This needs further investigation. `cf_pos_satifcation_level` IS a text field and should accept values. The fact that it's empty on Sayyad's contact while `keyword` (same utm_term source) is populated suggests the cf_ write may be failing for a different reason — possibly a Freshsales API quirk with bulk field updates, or the production code path for this specific form submission. Other recent contacts (e.g. shetty dinesh, id=402210781136) DO have cf_ fields populated. This is not a universal failure.

### 2C. Available Text Fields for New Mapping

8 text-type cf_ fields exist that are NOT mapped by any code:

| # | cf_ API name | Current Freshsales label | Available? |
|---|---|---|---|
| 1 | `cf_self_delivery_take_away` | SELF DELIVERY /TAKE AWAY | ✅ text |
| 2 | `cf_inventory_used` | INVENTORY USED | ✅ text |
| 3 | `cf_complete_address` | Placement | ✅ text (already relabeled) |
| 4 | `cf_account_software_integrated` | ACCOUNT SOFTWARE INTEGRATED | ✅ text |
| 5 | `cf_aggreator_management` | AGGREATOR MANAGEMENT | ✅ text |
| 6 | `cf_contact_person` | Contact person | ✅ text (spare) |
| 7 | `cf_next_step` | NEXT STEP | ✅ text (spare) |
| 8 | `cf_pos_type` | POS TYPE | ✅ text (spare) |

### 2D. Dropdown Fields — Cannot Use for Free Text

These were originally considered but are **dropdown type** and will silently reject arbitrary text:

| cf_ field | Type | Choices |
|---|---|---|
| `cf_take_away__delivery` | dropdown | Yes, No |
| `cf_basva_contacted` | dropdown | Yes, NO |
| `cf_pipeline` | dropdown | Today, This Week, Next Week, Next Month |
| `cf_pos` | dropdown | Yes, No |
| `cf_demo_fixed` | dropdown | Yes, No |

---

## 3. CONFIRMED FIELD MAPPING (5 new fields)

| # | URL Param | What it captures | → cf_ field | Field type |
|---|---|---|---|---|
| 1 | `ad_id` | Meta ad creative ID / Google ad creative ID | `cf_self_delivery_take_away` | text ✅ |
| 2 | `adset_id` | Meta adset ID / Google adgroup ID | `cf_inventory_used` | text ✅ |
| 3 | `placement` | Where ad showed (Feed/Reels/Stories/Search) | `cf_complete_address` | text ✅ |
| 4 | `utm_id` | Meta campaign numeric ID / Google campaign ID | `cf_account_software_integrated` | text ✅ |
| 5 | `site_source_name` | Platform (facebook/instagram/google/audience_network) | `cf_aggreator_management` | text ✅ |

**Spare fields (not mapped, available for future use):**
- `cf_contact_person` (text)
- `cf_next_step` (text)
- `cf_pos_type` (text)

---

## 4. IMPACT ANALYSIS

### 4A. Files Changed

| File | Change | Risk |
|---|---|---|
| `frontend/src/lib/attribution.js` | Add 5 params to `UTM_PARAMS` array + expose in `getAttribution()` return | LOW — additive, no existing params touched |
| `backend/server.py` | Add 5 `cf_` lines in `_attribution_to_crm()` (~line 230) | LOW — additive block after existing cf_ mappings |
| `backend/crm_sync.py` | Add 5 fields to `attribution` dict in `_upsert_lead()` (~line 108) | LOW — additive, reads new cf_ values from Freshsales during backfill |
| `memory/HANDOVER_NEXT_AGENT.md` | Update field mapping table (Section 5) | NONE |

### 4B. Data Flow (after implementation)

```
Meta Ad click → URL has ad_id={{ad.id}}&adset_id={{adset.id}}&placement={{placement}}&utm_id={{campaign.id}}&site_source_name={{site_source_name}}
  ↓
attribution.js captures into localStorage/sessionStorage (UTM_PARAMS)
  ↓
Form submit → getAttribution() includes ad_id, adset_id, placement, utm_id, site_source_name
  ↓
POST /api/demo-request → payload.attribution has the 5 new fields
  ↓
_attribution_to_crm() → maps to cf_self_delivery_take_away, cf_inventory_used, cf_complete_address, cf_account_software_integrated, cf_aggreator_management
  ↓
freshsales.upsert_contact() → writes cf_ fields to Freshsales
  ↓
MongoDB demo_requests → stores full attribution object (already stores everything)
  ↓
crm_sync.py backfill → reads cf_ fields back from Freshsales → stores in backfilled_leads.attribution
```

### 4C. Google Ads Flow (same fields, different ValueTrack syntax)

```
Google Ad click → URL has ad_id={creative}&adset_id={adgroupid}&utm_id={campaignid}&placement={placement}&site_source_name={network}
  ↓
Same attribution.js pipeline → same cf_ fields in Freshsales
```

### 4D. DB Impact

- **MongoDB:** No schema change needed. `attribution` object in `demo_requests`/`quotes`/`contact_messages` already stores the full `getAttribution()` output as a dict. New fields appear automatically.
- **Freshsales:** 5 existing cf_ fields get repurposed. No new fields created.
- **backfilled_leads:** `attribution` dict gains 5 new keys on next sync.

### 4E. Regression Risk

| Area | Risk | Why |
|---|---|---|
| Existing UTM capture | NONE | Only adding to `UTM_PARAMS`, not modifying existing entries |
| Existing cf_ mappings | NONE | New `cf_` lines are appended after existing block |
| Form submission | NONE | `getAttribution()` return object is spread into `payload.attribution` — extra keys are harmless |
| Freshsales API | LOW | 5 additional cf_ fields in the `custom_field` dict. All text type, all currently empty — no conflict |
| CRM sync backfill | NONE | Reads cf_ values that don't exist yet → returns None → same as today |

### 4F. Effort

| Task | Effort |
|---|---|
| attribution.js changes | 15 min |
| server.py changes | 15 min |
| crm_sync.py changes | 10 min |
| Documentation update | 10 min |
| Test (submit form via preview, verify in Freshsales) | 15 min |
| **Total** | **~1 hr** |

---

## 5. META ADS — URL TEMPLATE

### Current template (in your Meta ads now):
```
utm_source=facebook&utm_medium=cpm&utm_content={{adset.name}}&utm_campaign={{campaign.name}}&utm_term={{ad.name}}
```

### New template (add to all Meta ad destination URLs):
```
utm_source=facebook&utm_medium=cpm&utm_content={{adset.name}}&utm_campaign={{campaign.name}}&utm_term={{ad.name}}&fbclid={{fbclid}}&utm_id={{campaign.id}}&ad_id={{ad.id}}&adset_id={{adset.id}}&placement={{placement}}&site_source_name={{site_source_name}}
```

### What's added:
| Param | Meta dynamic tag | What it gives you |
|---|---|---|
| `fbclid` | `{{fbclid}}` | Facebook click ID → enables offline conversion matching |
| `utm_id` | `{{campaign.id}}` | Campaign numeric ID → ties lead to exact campaign |
| `ad_id` | `{{ad.id}}` | Ad creative ID → ties lead to exact ad (most valuable) |
| `adset_id` | `{{adset.id}}` | Ad set ID → ties lead to exact ad set |
| `placement` | `{{placement}}` | Feed/Reels/Stories/Marketplace |
| `site_source_name` | `{{site_source_name}}` | facebook/instagram/audience_network |

---

## 6. GOOGLE ADS — TRACKING TEMPLATE

### Current state:
Google Ads uses auto-tagging (`gclid` appended automatically). No structured UTM tracking template set.

### New tracking template (set at Account level → Settings → Tracking → Tracking Template):
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_term={keyword}&ad_id={creative}&adset_id={adgroupid}&utm_id={campaignid}&placement={placement}&site_source_name={network}
```

### Google Ads ValueTrack params:
| Param | ValueTrack | What it captures |
|---|---|---|
| `utm_source` | `google` (hardcoded) | Source identifier |
| `utm_medium` | `cpc` (hardcoded) | Medium identifier |
| `utm_campaign` | `{_campaign}` | Campaign name (custom param — set per campaign) |
| `utm_term` | `{keyword}` | Matched keyword text |
| `ad_id` | `{creative}` | Google ad creative ID |
| `adset_id` | `{adgroupid}` | Google ad group ID |
| `utm_id` | `{campaignid}` | Google campaign numeric ID |
| `placement` | `{placement}` | Placement URL (display/YouTube) |
| `site_source_name` | `{network}` | `g`=Search, `d`=Display, `y`=YouTube |

### Note on `{_campaign}`:
`{_campaign}` is a **custom parameter** — you need to set it per campaign in Google Ads:
- Campaign → Settings → Additional settings → Campaign URL options → Custom parameter
- Name: `_campaign` | Value: `AK: Search | MyGenie` (or whatever the campaign name is)

Alternatively, use `{campaignid}` for both `utm_campaign` and `utm_id` if you don't want to maintain custom params — but then you get numeric IDs instead of human-readable names.

### Note on `gclid`:
`gclid` is auto-appended by Google when auto-tagging is ON (it already is for your account). Do NOT add it to the template — it's handled automatically.

---

## 7. OWNER ACTION ITEMS (before code goes live)

### Must Do (blocks full value of the code change):

| # | Action | Where | Priority | Notes |
|---|---|---|---|---|
| 1 | **Update Meta URL template** on ALL active campaigns/ad sets | Meta Ads Manager → Ad level → Destination URL → URL Parameters | P0 | Use template from Section 5. Apply to all active + future ads |
| 2 | **Set Google Ads tracking template** at account level | Google Ads → Account Settings → Tracking → Tracking Template | P0 | Use template from Section 6. Account-level applies to all campaigns |
| 3 | **Set `{_campaign}` custom param** on each Google campaign | Google Ads → Campaign → Settings → URL options → Custom parameter | P1 | Name: `_campaign`, Value: campaign name. Only needed if you want human-readable names |
| 4 | **Relabel 5 cf_ fields** in Freshsales Admin for sales team clarity | Freshsales → Admin Settings → Contacts → Edit field labels | P2 (cosmetic) | See table below |

### Freshsales Field Relabeling (cosmetic — recommended but not blocking):

| cf_ field | Current label | Suggested new label |
|---|---|---|
| `cf_self_delivery_take_away` | SELF DELIVERY /TAKE AWAY | **Ad Creative ID** |
| `cf_inventory_used` | INVENTORY USED | **Ad Set ID** |
| `cf_complete_address` | Placement | **Ad Placement** (already done!) |
| `cf_account_software_integrated` | ACCOUNT SOFTWARE INTEGRATED | **Campaign ID** |
| `cf_aggreator_management` | AGGREATOR MANAGEMENT | **Source Platform** |

### Optional but recommended:

| # | Action | Impact |
|---|---|---|
| 5 | Change `cf_demo_fixed` from dropdown → text in Freshsales Admin | Fixes existing production bug — event_id/utm_ad values are silently dropped today |
| 6 | Verify `cf_rooms` dropdown accepts "Yes"/"No" exactly (case-sensitive) | Confirms OTP status is being written correctly |

---

## 8. WHAT CODE DOES NOT NEED TO CHANGE

- `freshsales.py` → `upsert_contact()` — already accepts arbitrary `custom_field` dict, no change needed
- `payments.py` — does not touch attribution fields
- `antijunk.py`, `otp.py`, `geo.py` — unrelated
- Frontend form components (DemoForm, MessageForm, CheckoutModal) — already pass `getAttribution()` output as `attribution` field, new keys flow through automatically
- MongoDB schema — attribution is stored as a flexible dict, new keys appear automatically

---

## 9. TESTING PLAN (after implementation)

1. Submit a demo form on preview site with URL params: `?utm_source=test&ad_id=12345&adset_id=67890&placement=instagram_reels&utm_id=99999&site_source_name=instagram`
2. Check MongoDB `demo_requests` → `attribution` object should contain all 5 new fields
3. Check Freshsales contact → `cf_self_delivery_take_away=12345`, `cf_inventory_used=67890`, `cf_complete_address=instagram_reels`, `cf_account_software_integrated=99999`, `cf_aggreator_management=instagram`
4. Trigger CRM backfill → check `backfilled_leads` → `attribution` dict should contain the new fields read back from Freshsales

---

*CR-25 Planning Document — Created 2026-06-27 by E1, Emergent Labs*
*Status: G2 Planning Complete. Awaiting owner action items (Meta/Google URL templates) before G3 implementation.*
