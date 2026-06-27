# CR-18 — Freshsales Standard Fields Completion

> **Status:** ✅ SHIPPED — 2026-06-24
> **Raised:** 2026-06-23
> **Raised by:** Attribution & CRM review session
> **Related docs:** `Freshsales_CRM_Integration.md`, `CR-2_Attribution_Mapping.md`, `Freshsales_Field_Contract.md`

---

## 1. Objective

The new website currently leaves **8 standard Freshsales fields blank** that have available data
in the attribution payload or can be derived automatically. This CR fills those gaps — all without
collecting anything new from the user. All changes are in the backend only.

---

## 2. Scope

### In scope
- 3 missing creation-time fields: `last_source`, `last_medium`, `last_campaign`
- 1 hardcoded field: `country` = "India"
- 1 geo-derived field: `state` (from existing `geo.py` response)
- 2 native attribution fields: `keyword` (utm_term), `medium` (utm_medium)
- 1 smart-derived field: `lead_source_id` (auto-mapped from utm_source/medium/click IDs)
- 1 locale field: `locale` (browser language, already in attribution payload)

### Out of scope
- Custom field (`cf_`) remapping — separate CR
- `time_zone` — Freshsales expects specific string values (e.g. "Mumbai"); browser timezone string
  (e.g. "Asia/Kolkata") does not map 1:1 to available choices. Deferred.
- `state` — only if `geo.py` returns it reliably. To be confirmed during implementation.
- Any new data collection from forms

---

## 3. Fields Being Added

| # | Field | CRM Label | Value Source | On Create | On Update |
|---|---|---|---|---|---|
| 1 | `last_source` | Created from source | `last_utm_source` | ✅ Set | ❌ Never change |
| 2 | `last_medium` | Created from medium | `last_utm_medium` | ✅ Set | ❌ Never change |
| 3 | `last_campaign` | Created through campaign | `last_utm_campaign` | ✅ Set | ❌ Never change |
| 4 | `country` | Country | Hardcoded `"India"` | ✅ Set | ❌ Never change |
| 5 | `state` | STATE | From `geo.py` region field | ✅ Set if available | ✅ Refresh |
| 6 | `keyword` | Keyword | `utm_term` from attribution | ✅ Set | ✅ Refresh |
| 7 | `medium` | Medium | `utm_medium` (last touch) | ✅ Set | ✅ Refresh |
| 8 | `locale` | Locale | `language` from attribution | ✅ Set | ✅ Refresh |
| 9 | `lead_source_id` | Source | Auto-derived (see §4) | ✅ Set | ❌ Never change (first-touch signal) |

> **Set-once rule for `last_*` and `lead_source_id`:** These capture the moment of contact creation.
> On an UPDATE (returning visitor), they are skipped — same as `first_*` fields today.

---

## 4. `lead_source_id` Derivation Logic

Freshsales Source field is a dropdown. Auto-derive in priority order:

```
IF gclid present                              → Paid Search      (402001798783)
ELSE IF utm_medium in [cpc, ppc, paid, paidsearch]  → Paid Search (402001798783)
ELSE IF fbclid present                        → Facebook Lead Form (402002468721)
ELSE IF utm_medium in [social, social-media]  → Social Media     (402001798785)
ELSE IF utm_source in [facebook, instagram, meta] → Social Media (402001798785)
ELSE IF utm_medium = display                  → Display Ads      (402001798786)
ELSE IF utm_medium = email                    → Email            (402001798777)
ELSE IF utm_medium = referral                 → Referral         (402001798781)
ELSE IF utm_source = google AND no gclid      → Organic Search   (402001798776)
ELSE IF any utm_source present                → Web              (402001798775)
ELSE                                          → Direct           (402001798782)
```

---

## 5. Impact Analysis

### Backend files changed

| File | Function | Change |
|---|---|---|
| `backend/server.py` | `_attribution_to_crm()` | Add 6 new native fields to the `native{}` dict: `last_source`, `last_medium`, `last_campaign`, `keyword`, `medium`, `locale` |
| `backend/server.py` | `_attribution_to_crm()` | Add `lead_source_id` derivation logic |
| `backend/freshsales.py` | `upsert_contact()` | On CREATE: pass `country`, `state`, `lead_source_id` to contact payload |
| `backend/freshsales.py` | `upsert_contact()` | On UPDATE: skip `last_*`, `country`, `lead_source_id`; refresh `state`, `keyword`, `medium`, `locale` |
| `backend/server.py` | `create_demo_request()` | Pass `geo_data.get("region")` → `state` via `extra_fields` |
| `backend/server.py` | `create_quote()` | Same as above |
| `backend/server.py` | `create_contact_message()` | Same as above |

### Frontend files changed
- **None.** All changes are backend only. Attribution payload already captures everything needed.

### Database changes
- **None.** MongoDB lead docs already store the full `attribution{}` object.

### Environment variable changes
- **None.**

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `lead_source_id` wrong value for edge-case UTM | Low | Low | Fallback to `Direct` — never null |
| `state` not returned by geo.py | Medium | None | Guard with `if geo_data.get("region")` |
| `last_*` accidentally overwritten on update | Low | Medium | Explicit `not k.startswith("last_")` guard, same pattern as existing `first_*` guard |
| Freshsales rejects `locale` format | Low | None | Best-effort, CRM failure never blocks lead |

**Overall risk: LOW** — all writes are best-effort. A CRM failure never blocks lead capture.

---

## 7. Implementation Plan (step-by-step)

```
Step 1: Update _attribution_to_crm() in server.py
  - Add last_source, last_medium, last_campaign to native{}
    (these go into extra_fields → set-once logic in upsert_contact)
  - Add keyword, medium, locale to native{}
    (these refresh on every update — not first_ or last_)
  - Add lead_source_id derivation logic (returns int or None)

Step 2: Update upsert_contact() in freshsales.py
  - Add new signature params: country, state, lead_source_id
  - On CREATE: include country="India", state, lead_source_id in contact payload
  - On UPDATE: skip country + lead_source_id; refresh state only if present
  - Extend the "first_" guard to also skip "last_" on update

Step 3: Update all 3 form endpoints in server.py
  - Pass state=geo_data.get("region") to upsert_contact() calls
  - (lead_source_id derived inside _attribution_to_crm, passed via extra_fields)

Step 4: Update Freshsales_Field_Contract.md to reflect new state

Step 5: Test
  - Submit demo form with ?utm_source=google&utm_medium=cpc&gclid=TEST123
  - Verify in Freshsales: last_source, last_campaign, lead_source_id (Paid Search),
    country (India), keyword, medium all populated
  - Re-submit same phone → verify last_* and country NOT overwritten
```

---

## 8. Effort Estimate

| Task | Estimate |
|---|---|
| Code changes (server.py + freshsales.py) | 1.5 hrs |
| Testing (curl + Freshsales UI verification) | 0.5 hrs |
| Doc update (Field Contract) | 0.25 hrs |
| **Total** | **~2.5 hrs** |

---

## 9. Definition of Done (G4 sign-off criteria)

- [ ] All 9 fields appear populated on a new test contact in Freshsales UI
- [ ] `last_*` and `country` NOT overwritten when same phone submits again
- [ ] `lead_source_id` correctly maps: gclid → Paid Search, no UTMs → Direct, fbclid → Facebook Lead Form
- [ ] `state` populated when geo returns a region; gracefully absent when geo fails
- [ ] No lead drops (anti-junk, OTP, Mongo save all unaffected)
- [ ] `Freshsales_Field_Contract.md` updated to reflect live state

---

## 10. CR Dashboard entry

```
CR-18 | Standard Fields Completion | Status: PLANNED | Priority: P1
Owner: TBD | Effort: 2.5h | Risk: LOW
Blocks: nothing | Blocked by: nothing
```
