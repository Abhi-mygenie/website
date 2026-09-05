# CR-60 — Legacy Meta Ad URL Template Contamination (single-lead)

**Status:** LOGGED FOR REFERENCE (not being actioned — user decided to let it go, "only 1 ad affected")
**Reported:** 2026-07-16
**Type:** Data-quality bug (advertising-side config, NOT a code bug)
**Affected:** 1 Freshsales contact — Chandrakala Amritlal Bharadwaj (id `402212768471`, phone 9350082659)

---

## Symptom
Lead landed in Freshsales with numeric IDs instead of readable names, and mangled source/medium:
- `first_source = "fb"` (expected `"facebook"`)
- `first_medium = "paid"` (expected `"cpm"`)
- `first_campaign = "120232987483260558"` (expected `"AK: Scaling | Leads"`)
- `keyword = "120232987483250558"` (expected `<ad.name>`)
- `cf_est_name = "120253458258350558"` (expected `<adset.name>`)
- Missing: `work_number` (ad_id), `cf_inventory_used` (adset_id), `cf_complete_address` (placement), `cf_aggreator_management` (site_source_name)

Owner spotted this because the row differed from every other recent FB lead in CRM.

## Root cause (investigated via Meta Graph API)
The lead clicked a specific Meta ad (id `120253458258350558`) under campaign "AK: Scaling | Leads"
that has since been **DELETED from Meta**. Meta continued delivering it briefly after deletion.
That deleted ad carried a legacy URL parameters template with EVERY name macro swapped for an ID macro
AND non-standard source/medium constants:

```
Legacy (bad) template on the deleted ad:
    utm_source=fb
    utm_medium=paid
    utm_content={{ad.id}}          -- should be {{adset.name}}
    utm_campaign={{campaign.id}}   -- should be {{campaign.name}}
    utm_term={{adset.id}}          -- should be {{ad.name}}
    utm_id={{campaign.id}}
    -- no ad_id / adset_id / placement / site_source_name / fbclid
```

The 7 other currently-visible ads in the same campaign all have the correct standard template
(`utm_source=facebook&utm_medium=cpm&utm_content={{adset.name}}...`) — verified via Graph API.

## Why this is NOT a code bug
- `git log --since=30d` on `backend/server.py` and `backend/freshsales.py` shows last relevant edits were CR-44/CR-49 on 2026-07-05.
- Nothing in this session (2026-07-14 → 07-16) touched attribution mapping.
- Comparison leads Nishant (same campaign, same day, ~17h earlier) captured with `first_source="facebook"`, `first_campaign="AK: Scaling | Leads"` — proving pipeline handles the correct template flawlessly.
- Server persists whatever `utm_*` values arrive in the URL — it does not translate `{{ad.id}}` into `{{ad.name}}`.

## Prevention (documented, not implemented)
User's action, advertising-side:
1. **Preferred: Campaign-level `url_tags` override.** In Meta Ads Manager set `url_tags` at CAMPAIGN LEVEL for every active campaign. Campaign-level URL params override anything set at adset/ad/creative level, immunizing future ads (including reactivated legacy ones) from creating this bug.
2. **Alternate:** Manual audit — every existing ad's URL params template. Not scalable.

## Backfill option (available but declined by user)
Deliverables designed (but NOT written) during investigation:
- `scripts/cr60_meta_url_audit.py` — read-only scan of Website Demo Leads, cross-check numeric UTM values against Meta Graph API, output CSV of contacts on non-standard templates.
- `scripts/cr60_meta_url_backfill.py` — rewrite for contacts flagged Y: source `fb→facebook`, medium `paid→cpm`, campaign IDs → names (Meta lookup), moved-wrong ad_id/adset_id fields to correct slots. Dry-run default. `crm_backfill_log_cr60` audit trail.

For Chandrakala specifically, 10 of ~13 fields are recoverable via Meta lookup + reshuffle. 3 fields (ad_name, placement, site_source_name) are lost forever because the ad is deleted and the URL never sent them.

## Reference — what CAN and CANNOT be recovered per lead
Recoverable via Meta Graph API (if IDs are still valid):
- `first_source`, `last_source` → constant `"facebook"`
- `first_medium`, `last_medium`, `medium` → constant `"cpm"`
- `first_campaign`, `last_campaign`, `latest_campaign` → Meta Campaign `name` lookup
- `cf_est_name` (utm_content) → Meta Adset `name` lookup (from misplaced adset_id in utm_term)
- `work_number` (ad_id) → move from misplaced utm_content field
- `cf_inventory_used` (adset_id) → move from misplaced utm_term field

Unrecoverable (never sent by the deleted ad's URL):
- `keyword`, `cf_pos_satifcation_level` — was `{{adset.id}}` in that URL; ad name was never sent, ad now deleted.
- `cf_complete_address` (placement)
- `cf_aggreator_management` (site_source_name)

## Decision
User's call (2026-07-16): **do not backfill**. Only 1 ad impacted only 1 lead. Log as reference in case pattern recurs. Priority: LOW / CLOSED.

## Escalation trigger
Re-open if:
- Another lead in Freshsales shows `first_source = "fb"` (short) OR any numeric-looking `first_campaign`.
- Existing "AK: Scaling | Leads" campaign spawns another mis-templated ad.
