# CR-49: Attribution Field Redundancy Cleanup (`last_*` / `latest_*`)

## Date: 2026-07-05
## Status: REGISTERED (bundle with CR-47 code deploy)
## Priority: LOW-MEDIUM (data hygiene + enables CR-44 fbc→latest_source remap)
## Reporter: E1 investigation — surfaced during Freshsales schema audit
## Related: CR-44 (fbc → latest_source uses the freed slot), CR-47 (deploy together)

---

## Problem Statement

Our code writes **9 native attribution fields** on every Freshsales contact submission:

| UI label | API field | Written from | Set-once guard |
|---|---|---|---|
| Original source / medium / campaign | `first_source` / `first_medium` / `first_campaign` | `attribution.first_utm_*` | ✅ (freshsales.py:204) |
| Created from source / medium / campaign | `last_source` / `last_medium` / `last_campaign` | `attribution.last_utm_*` | ✅ (freshsales.py:205) |
| Most recent source / medium / campaign | `latest_source` / `latest_medium` / `latest_campaign` | `attribution.last_utm_*` | ❌ (refreshes) |

The `last_*` and `latest_*` sets both read from the **same `attribution.last_utm_*` keys** at write-time. Empirical audit against production Atlas — **16 out of 19 recent Freshsales contacts have `last_* == latest_*` (84% redundancy)**.

The 3 that differed had multiple submissions across different UTMs (rare — normal contact lifetime is one visit).

## Design intent (recovered from git + comments)

- `first_*` = **first-touch, set-once** — the campaign that originally acquired the contact.
- `last_*` = **creation-snapshot, set-once** — the campaign at first form submission.
- `latest_*` = **refreshing** — the most recent campaign that touched the contact.

For single-visit contacts (84% of leads), `last_*` and `latest_*` are always identical because both are populated from the same request's `last_utm_*` payload at creation. `latest_*` only diverges on repeat visits from different UTMs.

Nothing is fundamentally wrong with the guard logic — the redundancy is structural given the input shape.

## Resolution (bundled with CR-44 + CR-47)

Because CR-44 needs an unused native text field for the `fbc` cookie, we're **repurposing `latest_source`** for that. This eliminates the redundancy naturally.

### Code changes in `backend/server.py` `_attribution_to_crm()` (lines 234-240)

**Remove** these 6 lines (latest_* writes from utm data):
```python
latest_source = _trunc(a.get("last_utm_source"))
if latest_source:
    native["latest_source"] = latest_source
if _trunc(a.get("last_utm_medium")):
    native["latest_medium"] = _trunc(a.get("last_utm_medium"))
if _trunc(a.get("last_utm_campaign")):
    native["latest_campaign"] = _trunc(a.get("last_utm_campaign"))
```

**Add** (from CR-44):
```python
# CR-44: repurpose latest_source for fbc cookie (label renamed in FS UI to "fbc")
if _trunc(a.get("fbc")):
    native["latest_source"] = _trunc(a.get("fbc"))
```

**Keep** `first_*` and `last_*` writes untouched — they carry the intended semantics without duplication.

### Trade-off: multi-visit refresh signal is dropped

Losing `latest_*` writes means: for the ~16% of contacts who return via a NEW UTM later, we no longer capture the "current" campaign attribution — only the "first" and "creation" ones. This is an acceptable trade-off because:
- 84% of contacts don't do this
- The `first_*` set already captures multi-visit history via localStorage on the frontend
- `first_utm_*` refreshes to the newest campaign only if it's the first touchpoint of a session (per frontend attribution logic)
- `latest_medium` and `latest_campaign` become empty going forward — sales team should be advised or those columns hidden in FS UI

If the marketing team objects: we could keep `latest_medium` and `latest_campaign` writing while only repurposing `latest_source` for fbc. Trade-off: fbc is the value that matters for Meta CAPI dedup, so `latest_source` is the critical slot to free.

---

## Files affected

| File | Lines | Change |
|---|---|---|
| `backend/server.py` | 234-240 (`_attribution_to_crm`) | Remove latest_* writes; add fbc → latest_source |
| `backend/server.py` | 277 (existing cf_demo_fixed write) | Remove — no longer needed |
| `backend/server.py` | 279-280 (existing cf_self_delivery_take_away write) | Move ad_id → native["work_number"] (per CR-44) |

Total: ~10 lines net removed.

---

## Freshsales admin actions (owner)

- Rename UI label of `latest_source` from "Most recent source" → **"fbc"** (or "Meta Click Cookie").
- Rename UI label of `work_number` from "Work phone" → **"Ad ID"**.
- (Optional) Hide `latest_medium` and `latest_campaign` from contact form/list views since they'll go stale.

---

## Validation (post-deploy)

1. Submit a fresh test lead with Facebook UTM + fbc cookie.
2. Verify Freshsales contact:
   - `first_source` = `facebook`, `first_campaign` set
   - `last_source` = `facebook`, `last_campaign` set (same as first for single-visit)
   - `latest_source` = the fbc cookie value (`fb.1.…`)
   - `work_number` = the ad_id (e.g., `120252933808790558`)
3. Confirm no downstream FS reports/journeys break (owner check).

---

## Risk / rollback

Risk: minimal. Code diff is small and localized to one function. Rollback = single-file revert.

Existing contacts keep their old `latest_*` values (utm-based) until a future submission refreshes them. Backfill via CR-48 will fix the 2 wiped leads with the new mapping.

---

*CR-49 registered: 2026-07-05. Agent: E1, Emergent Labs.*
