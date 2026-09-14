# CR-64 — Fix `upsert_contact` UPDATE Path: Replace → Merge for Returning Visitors

**Type:** Bug Fix  
**Date:** 2026-07-21  
**Status:** READY FOR PLANNING — implement AFTER CR-63 is live and verified  
**Scope:** `backend/freshsales.py` — UPDATE path only  
**Predecessor:** CR-47 (fixed `swap_otp_tag` + `mark_demo_booked`), CR-63 (fixes quote/contact gaps)  
**Forms affected:** All three — `/demo-request`, `/quote`, `/contact`

---

## 1. Impact Analysis

### 1.1 What is currently broken

Freshsales changed `PUT /contacts/{id}` semantics on **2026-07-04**: `custom_field` is now fully **replaced** (not merged) on every PUT. CR-47 fixed this for `swap_otp_tag` and `mark_demo_booked` but left the main `upsert_contact` UPDATE path untouched.

**Current code (`freshsales.py` ~line 220):**
```python
if cf:
    upd["custom_field"] = cf   # sends ONLY the current session's cf dict
```

Because Freshsales replaces the entire `custom_field` object, any `cf_` key present on the contact in Freshsales but **absent from the current session's `cf`** is **permanently wiped**.

---

### 1.2 Affected scenarios

| Scenario | Field wiped | Frequency |
|---|---|---|
| Returning visitor, direct/organic visit (no fbclid in URL) | `cf_latitude` (fbclid from original visit) | Every returning organic visitor |
| Returning visitor whose original contact was created before `event_id` feature existed | `cf_contact_person` wiped and replaced with new UUID (not a loss, but stale snapshot replaced) | Every returning visitor |
| Any returning visitor on a form that adds fewer cf_ keys than the original submission | Any cf_ key not in the new form's dict | Depends on form path |
| 400-retry fires (cf_category too long) | `cf_contact_person` (new event_id discarded) + all new cf_ keys | Returning visitor on Android/Meta app browser (fixed separately by CR-63 Phase 1, but this is defence-in-depth) |

---

### 1.3 Business impact

- **fbclid lost for returning Meta visitors**: Any lead who originally clicked a Meta ad (got fbclid), then re-submits the form directly weeks later (no ad click), loses their `cf_latitude`. Attribution stitching for that lead is broken in Freshsales even though MongoDB still has it.
- **Attribution audit trail degraded**: Each re-submission of the form overwrites the previous session's cf_ snapshot. The last submission wins across all cf_ fields — including those the current session has no opinion on.
- **Freshsales ≠ MongoDB**: MongoDB is a reliable first-touch record. Freshsales drifts toward last-touch-only for returning visitors.

---

### 1.4 Why isolated from CR-63

- This is the highest blast-radius change in the backend: affects EVERY returning visitor across ALL forms
- Adding a `_get_contact()` call to the UPDATE path introduces one extra Freshsales API call per returning visitor upsert (~50 ms)
- Requires careful testing against real returning visitors to confirm no regression
- Must be deployed after CR-63 is verified, so the baseline (cf_category truncation, event_id for quote/contact) is already stable

---

## 2. Root Cause (precise)

`freshsales.py` — `upsert_contact()` function, the `if existing:` branch:

```python
# Lines ~208–259 — current state
if existing:
    cid = existing.get("id")
    upd: dict = {}
    ...
    if cf:
        upd["custom_field"] = cf          # ← THE GAP: no fetch+merge

    if upd:
        r = await _request("PUT", f"/contacts/{cid}", json={"contact": upd})
        if r.status_code == 400 and "custom_field" in upd:
            ...
            existing_cf = existing.get("custom_field") or {}   # ← uses STALE snapshot from lookup (not a fresh GET)
            upd["custom_field"] = existing_cf                   # ← discards new cf entirely, sends old one
            r = await _request(...)
```

Two issues in this block:
1. **Main path**: `upd["custom_field"] = cf` — no merge with existing contact's current cf state
2. **400-retry path**: uses `existing.get("custom_field")` from the initial lookup payload (which is the shallow search result, not a full contact GET and may be incomplete) — then discards all new cf keys

---

## 3. Implementation Plan

### Change 1 — Fetch fresh cf snapshot before building UPDATE payload

**File:** `backend/freshsales.py`  
**Location:** `upsert_contact()`, inside `if existing:` block, before `upd` is built

```python
# BEFORE (current)
if existing:
    cid = existing.get("id")
    upd: dict = {}
    ...
    if cf:
        upd["custom_field"] = cf

# AFTER
if existing:
    cid = existing.get("id")

    # CR-64: Freshsales PUT replaces custom_field entirely (post-2026-07-04).
    # Fetch the live snapshot so we can merge — prevents wiping fbclid,
    # event_id, or any other field not present in the current session's cf.
    try:
        live_contact = await _get_contact(cid)
        existing_cf  = live_contact.get("custom_field") or {}
    except Exception as _fetch_err:
        logger.warning("CR-64: failed to fetch existing cf for %s: %s", cid, _fetch_err)
        existing_cf = {}

    upd: dict = {}
    ...
    if cf:
        upd["custom_field"] = {**existing_cf, **cf}   # merge: current session wins, old fields preserved
```

**Merge semantics:** Current session's fields override existing ones (`**cf` wins). Fields in Freshsales that are not touched by this session are preserved (`**existing_cf` base). This is identical to the pattern already used in `swap_otp_tag` and `mark_demo_booked`.

---

### Change 2 — Fix 400-retry to not discard new cf on persistent failure

**File:** `backend/freshsales.py`  
**Location:** 400-retry block within same `if existing:` branch

```python
# BEFORE (current 400-retry)
if r.status_code == 400 and "custom_field" in upd:
    logger.warning(...)
    try:
        existing = await _get_contact(cid)
        existing_cf = existing.get("custom_field") or {}
    except Exception:
        existing_cf = {}
    upd["custom_field"] = existing_cf   # discards merged cf, sends stale snapshot
    r = await _request("PUT", ...)

# AFTER
if r.status_code == 400 and "custom_field" in upd:
    logger.warning(
        "CR-64: upsert PUT 400 (cf keys=%s): %s — retrying without custom_field",
        list(upd.get("custom_field", {}).keys()),
        r.text[:300],
    )
    upd.pop("custom_field", None)       # drop cf entirely on persistent 400
    if upd:                             # still update other fields (tags, phone, city, etc.)
        r = await _request("PUT", f"/contacts/{cid}", json={"contact": upd})
```

**Why this is better than the current retry:**
- Old retry: sends `existing_cf` (stale, from initial search payload) → silently overwrites the contact's current Freshsales state with a potentially outdated snapshot
- New retry: if cf can't be written (400), skip cf update entirely — contact is still updated for tags, phone, city, state. cf remains as-is in Freshsales. No data loss.

---

## 4. Files Changed

| File | Lines | Change |
|---|---|---|
| `backend/freshsales.py` | ~208–259 (UPDATE path) | Fetch live cf + merge; fix 400-retry |

**No frontend changes. No MongoDB changes. No model changes.**

---

## 5. Performance Impact

| Operation | Cost | Frequency | Notes |
|---|---|---|---|
| Extra `_get_contact(cid)` call | ~50–80 ms | Once per returning visitor upsert | Acceptable; already done in `swap_otp_tag` and `mark_demo_booked` |
| New contact (CREATE path) | No change | — | CREATE path is unaffected |
| Freshsales rate limit | +1 GET per returning visitor | ~5–15/day currently | Well within 100 req/min limit |

---

## 6. Test Plan

### Returning visitor — fbclid preserved

```bash
# Step 1: Create contact with fbclid
curl -s -X POST "$API/api/demo-request" \
  -H "Content-Type: application/json" \
  -d '{"name":"CR64 Test","phone":"9100000001","event_id":"cr64-uuid-1",
       "attribution":{"fbclid":"cr64-test-fbclid","last_utm_source":"facebook"}}'

# Verify: cf_latitude = "cr64-test-fbclid" in Freshsales

# Step 2: Same phone, new session — NO fbclid this time
curl -s -X POST "$API/api/demo-request" \
  -H "Content-Type: application/json" \
  -d '{"name":"CR64 Test","phone":"9100000001","event_id":"cr64-uuid-2",
       "attribution":{"last_utm_source":"direct"}}'

# Verify after CR-64:
# cf_latitude STILL = "cr64-test-fbclid" (preserved from session 1) ✅
# cf_contact_person = "cr64-uuid-2" (updated to new event_id) ✅
```

### 400-retry: no stale snapshot written
```bash
# Submit with a very long custom field that forces a 400 (simulate via a known bad value)
# Verify: contact tags + phone still updated in Freshsales ✅
# Verify: cf_contact_person NOT reverted to stale value ✅
```

### Log check
```bash
tail -n 50 /var/log/supervisor/backend.err.log | grep "CR-64"
# On normal returning visitor: no warnings (GET succeeds, merge applied)
# On 400: "retrying without custom_field" warning — cf skipped, rest updated
```

---

## 7. Success Criteria

- [ ] Returning visitor re-submit (no fbclid in new session): `cf_latitude` preserved from original session ✅
- [ ] Returning visitor re-submit: `cf_contact_person` updated to new `event_id` ✅
- [ ] New visitor (CREATE path): no change to behaviour ✅
- [ ] 400-retry: no stale snapshot written; other fields (tags, phone) still updated ✅
- [ ] No increase in Freshsales 429 rate-limit errors ✅

---

## 8. Rollback Plan

Single function change in `freshsales.py`. If regression found:
- Revert `if existing:` block to previous state
- Zero impact on MongoDB or any other service

---

## 9. Deployment Sequence

```
CR-63 deploy + verify (production smoke test)
     ↓  [minimum 48h observation]
CR-64 deploy
     ↓
Verify returning visitor test (manual curl test above)
     ↓
Monitor backend logs for 24h — watch for unexpected 400 patterns
```

---

*CR-64 intake completed 2026-07-21. Do not implement until CR-63 is live and verified in production.*
