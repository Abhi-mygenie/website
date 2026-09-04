# CR-44: fbc Cookie + ad_id Attribution Data Loss to Freshsales

## Date: 2026-07-05
## Status: REGISTERED (fix pending owner approval)
## Priority: HIGH (Ads attribution / ROAS reporting)
## Reporter: E1 investigation — traced from lead 7990444024 (Mustakbhai)

---

## Problem Statement

Two critical Facebook attribution values are **completely lost** on the way from the MyGenie website to Freshsales for **every single lead** (not just OTP-verified ones):

1. **`fbc` (Facebook Click cookie `_fbc`)** — the click-timestamped identifier used for Meta CAPI de-duplication and ROAS attribution.
2. **`ad_id`** — the specific creative-level ad ID that produced the click (finer granularity than `adset_id`).

Both values are captured correctly by the frontend and persisted in `demo_requests.attribution` in Mongo, but **neither survives the write to Freshsales**.

### Evidence (verified 2026-07-05 against production Atlas + Freshsales API)

| Lead (recent, OTP-Unverified so cf_* not wiped by CR-44b/bug) | fbc value in Mongo | ad_id in Mongo | fbc anywhere in Freshsales? | ad_id anywhere in Freshsales? |
|---|---|---|---|---|
| Tarun 8860777328 (FS 402211574986) | `fb.1.1783196895252.IwZXh0bg...` | `120252933808790558` | ❌ NO field contains this value | ❌ NO field contains this value |
| Adv 8851309133 | present in `demo_requests.attribution` | present | ❌ | ❌ |
| Kakali 8910604782 | present | present | ❌ | ❌ |

All 33 `cf_*` fields on the contact were scanned; the fbc string and the ad_id number appear **nowhere** in Freshsales.

---

## Root Cause

### For `fbc`
Code (`backend/server.py:277`) writes fbc → `cf_demo_fixed`:
```python
if a.get("fbc"): cf["cf_demo_fixed"] = _trunc(a.get("fbc"))
```

But the current **live Freshsales schema** for `cf_demo_fixed` (verified via `GET /settings/contacts/fields` on 2026-07-05) is:
```
name    : cf_demo_fixed
label   : "Ad Name " (with trailing space)
type    : dropdown
choices : [{"value":"Yes","id":740}, {"value":"No","id":894}]
```

Sending an arbitrary text (fbc cookie string) to a Yes/No dropdown → **Freshsales silently drops the value**. Field is untouched.

The code comment at `server.py:213` says *"CR-25: moved from cf_demo_fixed which was dropdown"* — the migration was documented in code but **never executed on the Freshsales admin side**. Field type is still dropdown.

### For `ad_id`
Code (`backend/server.py:280`) writes ad_id → `cf_self_delivery_take_away`:
```python
if a.get("ad_id"): cf["cf_self_delivery_take_away"] = _trunc(a.get("ad_id"))
```

The custom field **`cf_self_delivery_take_away` does not exist in Freshsales**. Verified: 99 contact fields queried, 33 cf_* fields listed — none match this name.

Any field name not in the schema is silently dropped by Freshsales on write, and returned as `null` on read. Downstream code that reads it back (`crm_sync.py:102`, `crm_sync.py:632`) always sees `None`.

---

## Fix — FINAL RESOLUTION (owner-approved 2026-07-05)

Both fields will be remapped to existing available native Freshsales fields — no FS admin schema change beyond renaming UI labels for clarity.

### 1. fbc → `latest_source` (native "Most recent source")
- Existing `latest_source` (native, type text) is currently populated with a duplicate of `last_source` (see CR-49 for the redundancy). Since it's a text field we control exclusively, repurposing it for fbc is safe.
- Owner action: rename the FS UI label from "Most recent source" to "fbc" (or "Meta Click Cookie") in Freshsales admin.
- Code change (in `backend/server.py:_attribution_to_crm()`):
  - Remove the write to `native["latest_source"]` from `last_utm_source` (lines 234-236).
  - Instead: `if a.get("fbc"): native["latest_source"] = _trunc(a.get("fbc"))`.
  - Also remove `latest_medium` and `latest_campaign` writes if they were duplicates of last_* (see CR-49).
  - Remove the now-dead write to `cf_demo_fixed` at line 277.

### 2. ad_id → `work_number` (native "Work phone")
- Native Freshsales text field. Currently unused by our code. Accepts numeric string ad_ids.
- Owner action: rename UI label from "Work phone" to "Ad ID" in Freshsales admin.
- Code change (in `backend/server.py:_attribution_to_crm()`):
  - Move ad_id from the `cf` dict to the `native` dict.
  - Remove line 279-280: `if a.get("ad_id"): cf["cf_self_delivery_take_away"] = _trunc(a.get("ad_id"))`.
  - Add: `if a.get("ad_id"): native["work_number"] = _trunc(a.get("ad_id"))`.

### Code deltas (bundled with CR-47 deploy)
- 4 lines added, ~5 lines removed in `backend/server.py:_attribution_to_crm()`.
- No new Freshsales fields required. No custom-field schema change required.

### Backfill via CR-48
CR-48's backfill script uses `_attribution_to_crm(attr)` — after the code change above, the same script will restore `fbc` to `latest_source` and `ad_id` to `work_number` for the 2 wiped leads. No changes needed to the backfill script.

---

---

## 📊 Impact Analysis

### Blast radius (before fix)

| Data path | Affected | Consequence |
|---|---|---|
| **Every** demo submission (OTP-verified or not) | 100% of leads since CR-25 deployment (2026-06-27) | `ad_id` and `fbc` never reach Freshsales; Ads Intelligence dashboard (CR-24) ad-creative column blank |
| Meta CAPI dedup keys | Every browser+server event pair | fbc is a critical dedup+attribution key; without it Meta can't attribute back to specific ad clicks reliably |
| Sales team CRM view | 0 (fields never populated) | No perceived loss (sales didn't know these were supposed to be there) |
| Downstream Freshsales reports/filters | 0 direct | `latest_source` currently shows utm_source (facebook / google) — after remap it'll show fbc strings; sales filters using this field must be reviewed |

### Data at risk (existing populated data)

- **`work_number`** — currently null on all mygenie.online-sourced contacts (verified via schema audit). Zero risk of overwrite.
- **`latest_source`** — currently duplicates `last_source` (utm_source values). Historical utm data is preserved in `last_source` and `first_source`. Freeing `latest_source` for fbc loses only the multi-visit refresh signal, which affects <16% of contacts (see CR-49).

### Downstream systems

| System | Impact | Action needed |
|---|---|---|
| `crm_sync.py` source-sync job | Reads `cf_self_delivery_take_away` (ad_id) at lines 102, 632 → currently always null → after fix will read from `work_number` | ⚠️ Update `crm_sync.py:102, 632` to read `work_number` instead of `cf_self_delivery_take_away`. Include in deploy bundle. |
| Ads Intelligence dashboard (CR-24) | Ad-creative column driven by ad_id lookup → currently blank | Will populate correctly post-fix + backfill |
| Sales UI filters | May reference "Most recent source = facebook" | Owner to audit + update filters after label rename |
| Freshsales Journey `id 89533` ("Customer Journey 12 July - WATI and MCAP and LIST") | If it filters by `latest_source = facebook`, will stop matching | Owner to review Journey rules |

---

## 🔧 Implementation Plan

### Prerequisites (owner-side, can run parallel to code work)

1. Rename `latest_source` UI label from "Most recent source" → **"fbc"** in Freshsales admin.
2. Rename `work_number` UI label from "Work phone" → **"Ad ID"**.
3. Audit any Freshsales reports/filters using `latest_source` — update or archive.
4. Notify sales team of the label changes (short internal note).

### Code changes — exact diffs

**File: `backend/server.py`** (2 blocks)

**Block 1 — `_attribution_to_crm()` native writes** (lines 234-240):
```diff
-    # ── Last-touch refreshing ─────────────────────────────────────────────────
-    latest_source = _trunc(a.get("last_utm_source"))
-    if latest_source:
-        native["latest_source"] = latest_source
-    if _trunc(a.get("last_utm_medium")):
-        native["latest_medium"] = _trunc(a.get("last_utm_medium"))
-    if _trunc(a.get("last_utm_campaign")):
-        native["latest_campaign"] = _trunc(a.get("last_utm_campaign"))
+    # ── CR-44: repurpose latest_source for fbc cookie ─────────────────────────
+    # latest_source was previously written from last_utm_source but duplicated
+    # last_source (see CR-49). We now use it for the Meta Click Cookie (fbc).
+    # UI label in Freshsales renamed to "fbc".
+    if _trunc(a.get("fbc")):
+        native["latest_source"] = _trunc(a.get("fbc"))
+    # NB: latest_medium and latest_campaign are intentionally NO LONGER written.
```

**Block 2 — `_attribution_to_crm()` cf writes** (lines 276-280):
```diff
-    if _trunc(a.get("fbc")):
-        cf["cf_demo_fixed"] = _trunc(a.get("fbc"))
     # CR-25: ad identifiers for attribution stitching
-    if _trunc(a.get("ad_id")):
-        cf["cf_self_delivery_take_away"] = _trunc(a.get("ad_id"))
+    # CR-44: ad_id now goes to native work_number (label "Ad ID" in FS UI).
+    if _trunc(a.get("ad_id")):
+        native["work_number"] = _trunc(a.get("ad_id"))
```

**File: `backend/crm_sync.py`** (2 lines — read-side):

At lines 102 and 632 (source_sync reading ad_id from Freshsales):
```diff
-        "ad_id": cf.get("cf_self_delivery_take_away"),
+        "ad_id": contact.get("work_number"),
```
(Note: `work_number` is a native field, not inside `custom_field` — so we read from `contact.get("work_number")` not `cf.get(...)`.)

Also review any read of `cf_demo_fixed` for fbc in the same file:
```diff
-        "fbc": cf.get("cf_demo_fixed"),
+        "fbc": contact.get("latest_source"),
```

### Deploy bundle

CR-44 code changes MUST be deployed together with **CR-47** and **CR-49**. They share the same `_attribution_to_crm()` function and would conflict as separate commits.

### Testing plan (post-deploy)

1. Submit a fresh test demo request via mygenie.online with Facebook UTM params (or spoof via URL).
2. Curl the Freshsales contact:
   ```
   curl -s -H "Authorization: Token token=$KEY" \
        "$BASE/contacts/{new_cid}" | jq '{first_source, last_source, latest_source, work_number, custom_field: .custom_field | {cf_latitude, cf_orders_taken_via, cf_est_name}}'
   ```
   Expected:
   - `latest_source` = the fbc cookie value (starts with `fb.1.`)
   - `work_number` = the ad_id (numeric string)
   - `cf_latitude` = fbclid, `cf_orders_taken_via` = fbp, `cf_est_name` = utm_content — unchanged
3. Verify OTP → confirm `latest_source` still shows fbc (not wiped by swap_otp_tag; validated by CR-47 fix in same deploy).
4. Verify Ads Intelligence dashboard renders ad_id column for the test lead.

### Rollback

Single-file revert of `backend/server.py` and `backend/crm_sync.py`. No schema migration required. Existing populated `work_number` / `latest_source` values remain but are ignored by reverted code.

### Success criteria

- 100% of new demo submissions have `work_number` and `latest_source` populated in Freshsales with ad_id and fbc respectively.
- CR-48 backfill script (after CR-47 deploy) restores the 2 previously-wiped leads with the new field mapping.

---

*Impact + implementation section added 2026-07-05.*

---

## Files affected (for reference — no code change if Option A)

| File | Line | Current | Notes |
|---|---|---|---|
| `backend/server.py` | 277 | `cf["cf_demo_fixed"] = _trunc(a.get("fbc"))` | Keep as-is (Option A) |
| `backend/server.py` | 280 | `cf["cf_self_delivery_take_away"] = _trunc(a.get("ad_id"))` | Keep as-is (Option A) |
| `backend/server.py` | 213 (comment) | *"CR-25: moved from cf_demo_fixed which was dropdown"* | Update comment once FS type is changed |
| `backend/crm_sync.py` | 102, 632 | reads `cf_self_delivery_take_away` for ad_id | Will start returning values once field exists |
| `memory/Freshsales_Field_Mapping.md` | — | | Update once Option A applied |

---

## Impact if left unfixed

- Meta CAPI cannot de-duplicate events (no fbc to match with Pixel events → duplicate conversions in Ads Manager, inflated CAC).
- Cannot attribute conversions to specific ad creatives — only to ad-set level, which limits creative-testing decisions.
- Any Ads-Intelligence reports (CR-24) that depend on ad_id will show empty columns.

---

## Validation plan (post-fix)

1. Submit a real demo request through mygenie.online with a live Facebook click.
2. Check `demo_requests.attribution.fbc` and `demo_requests.attribution.ad_id` in Mongo — must be non-null.
3. Fetch the created contact from Freshsales API — verify `cf_demo_fixed` contains the fbc string and `cf_self_delivery_take_away` contains the ad_id.
4. Do NOT verify OTP for this test — CR-45 (swap_otp_tag cf_* wipe) must be resolved separately for the OTP-verified path to also work.

---

*CR-44 registered: 2026-07-05. Agent: E1, Emergent Labs.*
