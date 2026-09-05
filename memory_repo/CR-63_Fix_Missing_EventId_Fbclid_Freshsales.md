# CR-63 — Fix Missing `event_id` & `fbclid` in Freshsales CRM

**Type:** Bug Fix (multi-cause)  
**Date Raised:** 2026-07-21  
**Raised By:** Owner (intake via investigation session)  
**Status:** READY FOR PLANNING  
**Priority:** HIGH  
**Investigation Doc:** `memory/CR-62_Missing_EventId_Fbclid_Investigation.md`  
**Related CRs:** CR-47 (Freshsales cf merge fix), CR-48 (backfill), CR-51 (event_id in Mongo), CR-62 (investigation)

---

## Problem Statement

Large number of Freshsales contacts show empty values for:
- **"Event ID GTM"** (`cf_contact_person`) — used for Meta CAPI browser↔server dedup and attribution stitching
- **"fbclidFacebook Click ID"** (`cf_latitude`) — used for Meta ad attribution

**Confirmed facts (from investigation):**
- All affected leads ARE genuine website submissions (backend API was called — tags like "Website Demo Lead" are present)
- MongoDB always captures `event_id` and full attribution correctly — the data is NOT lost, only missing in Freshsales
- Root causes are purely in the backend write path to Freshsales + one missing frontend field pass-through

**Business impact:**
- Meta CAPI deduplication broken for affected leads → inflated conversion counts / incorrect ROAS
- Ads Intelligence dashboard (CR-24) shows incomplete attribution data
- Sales team cannot filter/segment leads by event source reliably

---

## Root Causes (4 confirmed, from CR-62)

---

### Gap 1 — Quote & Contact forms structurally never send `event_id` *(highest volume)*

**Where:** `backend/server.py` models + `upsert_contact` calls + frontend axios payloads

**Backend:**
- `QuoteCreate` model (line 556) has no `event_id` field
- `ContactMessageCreate` model (line 637) has no `event_id` field
- `/quote` → `upsert_contact` call (lines 605–623): no `cf_contact_person = event_id` in `custom_field`
- `/contact` → `upsert_contact` call (lines 670–686): no `cf_contact_person = event_id` in `custom_field`

**Frontend:**
- `CheckoutModal.jsx` line 49: `eventId` IS generated via `useState(() => newEventId())` ✅
- `CheckoutModal.jsx` line 73–88: axios POST to `/quote` does NOT include `event_id: eventId` ❌
- `MessageForm.jsx` line 46: `eventId` IS generated via `useState(() => newEventId())` ✅
- `MessageForm.jsx` line 67–69: axios POST to `/contact` does NOT include `event_id: eventId` ❌

**Scope:** Every "Website Quote", "Buy Online", "Website Contact" tagged lead — all time, ongoing.

---

### Gap 2 — `cf_category` (User-Agent) not truncated → triggers Freshsales 400 → 400-retry discards new `event_id`

**Where:** `backend/server.py` lines 135, 342–343 + `backend/freshsales.py` lines 241–256

**Stage A — not truncated:**
```python
# server.py line 135
ua = request.headers.get("user-agent")   # raw, up to 400-500 chars

# server.py line 342-343 — sent without _trunc()
"cf_longitude": ip,
"cf_category": ua,
```
All attribution fields in `_attribution_to_crm` go through `_trunc(v, 255)`. These two are set directly and bypass `_trunc`. Modern Android / Meta in-app browser UAs are 250–450 chars. Freshsales field limit is 255 chars → PUT returns 400.

**Stage B — 400-retry discards new `event_id`:**
```python
# freshsales.py lines 241–256 — UPDATE path 400-retry
if r.status_code == 400 and "custom_field" in upd:
    existing = await _get_contact(cid)           # fetches OLD contact snapshot
    existing_cf = existing.get("custom_field") or {}
    upd["custom_field"] = existing_cf            # ← OLD snapshot replaces new cf
    r = await _request("PUT", ...)               # new event_id GONE
```

The new `cf` (which contains the fresh `event_id`) is discarded. The retry sends the OLD `existing_cf` snapshot from when the contact was created (possibly months ago, before `event_id` was implemented → `cf_contact_person` empty).

**Scope:** Any returning visitor on Android or Facebook in-app browser (i.e. a large share of Meta ad traffic). Combined with Gap 1 most affected form: Demo form returning visitor path.

---

### Gap 3 — `upsert_contact` UPDATE path replaces `custom_field` without merging existing

**Where:** `backend/freshsales.py` lines 220–221

```python
# freshsales.py line 220-221 — UPDATE path for existing contacts
if cf:
    upd["custom_field"] = cf   # sends ONLY the new session's cf, no fetch+merge
```

Freshsales changed PUT `/contacts/{id}` semantics on 2026-07-04: `custom_field` is now fully **replaced** (not merged). Any `cf_` key absent from the current session's `cf` dict is permanently wiped from Freshsales.

**Most common effect:** Returning visitor on direct/organic visit (no `fbclid` in URL) → `cf_latitude` absent from new `cf` → old `fbclid` erased.

**Note:** `swap_otp_tag` and `mark_demo_booked` were fixed in CR-47 with `{**existing_cf, **new_cf}` merge. The general UPDATE path in `upsert_contact` was never patched.

**Scope:** Every returning visitor (phone matched) on a session without a fresh Meta ad click. Ongoing.

---

### Gap 4 — CR-47 historical wipe backfill not executed *(bounded, not growing)*

**Where:** Freshsales contacts for leads from 2026-07-04 to CR-47 fix deploy date.

Documented in CR-47 and CR-48. The code fix is deployed. The backfill script and process was designed in CR-48 but never executed. ~5–15 specific leads are affected. MongoDB has all their data.

**Scope:** Frozen set. No new leads added. Unblocks once CR-63 Gap 2 / Gap 3 are fixed (run backfill AFTER code fixes per CR-48 instruction).

---

## Exact Code Changes Required

### Change 1 — Truncate `cf_category` and `cf_longitude` in server.py
**File:** `backend/server.py`  
**Lines:** 342–343  

```python
# BEFORE
"cf_longitude": ip,
"cf_category": ua,

# AFTER
"cf_longitude": _trunc(ip),
"cf_category": _trunc(ua),
```

Same change needed in the `/quote` upsert call (lines 617–618) and `/contact` upsert call (lines 682–683).

---

### Change 2 — Add `event_id` field to QuoteCreate model
**File:** `backend/server.py`  
**Line:** ~576 (end of `QuoteCreate` model fields)

```python
# BEFORE (QuoteCreate, line 556–576)
class QuoteCreate(BaseModel):
    name: str
    phone: str
    ...
    hp: str | None = None
    elapsed_ms: int | None = None

# AFTER
class QuoteCreate(BaseModel):
    name: str
    phone: str
    ...
    hp: str | None = None
    elapsed_ms: int | None = None
    event_id: str | None = None          # ← ADD
```

---

### Change 3 — Add `event_id` field to ContactMessageCreate model
**File:** `backend/server.py`  
**Line:** ~648 (end of `ContactMessageCreate` model fields)

```python
# BEFORE
class ContactMessageCreate(BaseModel):
    ...
    hp: str | None = None
    elapsed_ms: int | None = None

# AFTER
class ContactMessageCreate(BaseModel):
    ...
    hp: str | None = None
    elapsed_ms: int | None = None
    event_id: str | None = None          # ← ADD
```

---

### Change 4 — Pass `event_id` to Freshsales in `/quote` upsert call
**File:** `backend/server.py`  
**Lines:** 614–621 (inside `create_quote`, the `custom_field` dict)

```python
# BEFORE
custom_field={
    "cf_outlet_type": obj.outlet_type,
    "cf_sku": obj.years_in_business,
    "cf_longitude": ip,
    "cf_category": ua,
    "cf_first_interest": cf_first_interest,
    **attr_cf,
},

# AFTER
custom_field={
    "cf_outlet_type": obj.outlet_type,
    "cf_sku": obj.years_in_business,
    "cf_longitude": _trunc(ip),
    "cf_category": _trunc(ua),
    "cf_first_interest": cf_first_interest,
    **attr_cf,
    **({"cf_contact_person": payload.event_id} if payload.event_id else {}),   # ← ADD
},
```

---

### Change 5 — Pass `event_id` to Freshsales in `/contact` upsert call
**File:** `backend/server.py`  
**Lines:** 679–685 (inside `create_contact_message`, the `custom_field` dict)

```python
# BEFORE
custom_field={
    "cf_first_interest": obj.message,
    "cf_sku": obj.years_in_business,
    "cf_longitude": ip,
    "cf_category": ua,
    **attr_cf,
},

# AFTER
custom_field={
    "cf_first_interest": obj.message,
    "cf_sku": obj.years_in_business,
    "cf_longitude": _trunc(ip),
    "cf_category": _trunc(ua),
    **attr_cf,
    **({"cf_contact_person": payload.event_id} if payload.event_id else {}),   # ← ADD
},
```

---

### Change 6 — Send `event_id` from CheckoutModal (frontend)
**File:** `frontend/src/components/pricing/CheckoutModal.jsx`  
**Lines:** 73–88 (axios POST to `/quote`)

```javascript
// BEFORE
const res = await axios.post(`${API}/quote`, {
  ...form,
  ...signals(),
  attribution: getAttribution(),
  intent,
  outlet_type: config.outletType || null,
  ...
});

// AFTER
const res = await axios.post(`${API}/quote`, {
  ...form,
  ...signals(),
  attribution: getAttribution(),
  event_id: eventId,                          // ← ADD
  intent,
  outlet_type: config.outletType || null,
  ...
});
```

`eventId` is already declared at line 49 — no new import needed.

---

### Change 7 — Send `event_id` from MessageForm (frontend)
**File:** `frontend/src/components/site/MessageForm.jsx`  
**Lines:** 67–69 (axios POST to `/contact`)

```javascript
// BEFORE
const res = await axios.post(`${API}/contact`, {
  ...form, source_page: "contact", ...signals(), attribution: getAttribution(),
});

// AFTER
const res = await axios.post(`${API}/contact`, {
  ...form, source_page: "contact", ...signals(), attribution: getAttribution(),
  event_id: eventId,                          // ← ADD
});
```

`eventId` is already declared at line 46 — no new import needed.

---

### Change 8 — Fetch+merge `custom_field` in `upsert_contact` UPDATE path
**File:** `backend/freshsales.py`  
**Lines:** 208–259 (the `if existing:` block)

The UPDATE path currently does:
```python
if cf:
    upd["custom_field"] = cf   # replaces ALL existing cf
```

Must be changed to:
```python
# Fetch full contact to merge cf (Freshsales PUT is REPLACE since 2026-07-04 — CR-47)
existing_full = await _get_contact(cid)
existing_cf = existing_full.get("custom_field") or {}
if cf:
    upd["custom_field"] = {**existing_cf, **cf}   # merge: new session's fields win, old fields preserved
```

**Note:** `_get_contact` is already implemented in `freshsales.py` (lines 139–153). This adds one extra GET call per returning visitor upsert — ~50 ms, well within rate limits.

**Also update the 400-retry within the same block** (lines 241–256) to not discard the merged result on retry:
```python
# BEFORE (on 400)
upd["custom_field"] = existing_cf   # sends OLD snapshot, discards new event_id

# AFTER
# existing_cf is already fetched above. On 400, log the bad keys and retry
# WITHOUT custom_field entirely (worst case: lose cf update, keep contact alive)
logger.warning(
    "Freshsales upsert 400 (cf keys=%s): %s",
    list(upd.get("custom_field", {}).keys()),
    r.text[:300],
)
upd.pop("custom_field", None)   # drop cf on persistent 400, don't send stale snapshot
r = await _request("PUT", f"/contacts/{cid}", json={"contact": upd})
```

---

## Files Affected Summary

| File | Changes | Lines |
|---|---|---|
| `backend/server.py` | `_trunc(ua)`, `_trunc(ip)` in all 3 endpoints (demo, quote, contact) | 342–343, 617–618, 682–683 |
| `backend/server.py` | Add `event_id: str \| None = None` to `QuoteCreate` | ~576 |
| `backend/server.py` | Add `event_id: str \| None = None` to `ContactMessageCreate` | ~648 |
| `backend/server.py` | Add `cf_contact_person = event_id` to `/quote` upsert call | 619–621 |
| `backend/server.py` | Add `cf_contact_person = event_id` to `/contact` upsert call | 684–686 |
| `backend/freshsales.py` | Fetch+merge `existing_cf` in UPDATE path | 208–259 |
| `backend/freshsales.py` | Fix 400-retry to drop cf instead of sending stale snapshot | 241–256 |
| `frontend/src/components/pricing/CheckoutModal.jsx` | Add `event_id: eventId` to `/quote` POST body | ~76 |
| `frontend/src/components/site/MessageForm.jsx` | Add `event_id: eventId` to `/contact` POST body | ~68 |

**Total:** 2 backend files, 2 frontend files. No new dependencies. No schema changes. No DB migration.

---

## What Does NOT Need to Change

- `DemoForm.jsx` — already sends `event_id` correctly ✅
- `demo-request` endpoint — already writes `cf_contact_person = event_id` correctly ✅
- `swap_otp_tag` — already does `{**existing_cf, "cf_rooms": "Yes"}` merge ✅
- `mark_demo_booked` — already does `{**existing_cf, **cf}` merge ✅
- MongoDB — always captures event_id and full attribution correctly ✅
- `_attribution_to_crm` — no changes needed ✅

---

## Dependencies & Order of Operations

```
Change 8 (freshsales.py merge fix)     ← implement first (foundational)
    ↓
Changes 1–5 (server.py backend fixes)  ← can be done in parallel
Changes 6–7 (frontend event_id pass)   ← can be done in parallel with backend
    ↓
Deploy + verify (test plan below)
    ↓
Gap 4: Run CR-48 backfill script       ← run AFTER deploy, not before
```

---

## Test Plan

### Backend (curl)

```bash
API="https://genie-react-api.preview.emergentagent.com"

# 1. New demo lead — confirm event_id in cf_contact_person
curl -s -X POST "$API/api/demo-request" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"9999999999","email":"test@test.com",
       "business_name":"Test Cafe","years_in_business":"0-2",
       "event_id":"test-uuid-1234",
       "attribution":{"fbclid":"testfbclid123","last_utm_source":"facebook"}}'

# 2. New quote lead — confirm event_id in cf_contact_person (NEW after this CR)
curl -s -X POST "$API/api/quote" \
  -H "Content-Type: application/json" \
  -d '{"name":"Quote User","phone":"9888888888","email":"q@test.com",
       "business_name":"Quote Cafe","plan_id":"starter","plan_name":"Starter",
       "event_id":"test-uuid-quote-5678",
       "attribution":{"fbclid":"qfbclid456","last_utm_source":"facebook"}}'

# 3. New contact message — confirm event_id (NEW after this CR)
curl -s -X POST "$API/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Contact User","phone":"9777777777","message":"Test message",
       "event_id":"test-uuid-contact-9012",
       "attribution":{"last_utm_source":"facebook"}}'
```

### Freshsales Verification (manual, post-curl)
For each test contact above:
1. Search in Freshsales by phone number
2. Confirm `cf_contact_person` = the `event_id` UUID sent ✅
3. Confirm `cf_latitude` = fbclid value sent (where applicable) ✅
4. Verify OTP for test #1 → confirm cf_contact_person still has the UUID (swap_otp_tag merge working) ✅

### Regression — Long UA string (confirms Gap 2 fix)
```bash
curl -s -X POST "$API/api/demo-request" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/444.0.0.49.109;]" \
  -d '{"name":"Long UA Test","phone":"9666666666","email":"ua@test.com",
       "business_name":"UA Test","years_in_business":"0-2",
       "event_id":"test-uuid-longua-3456","attribution":{}}'
# Confirm: NO "upsert 400" in backend logs
# Confirm: event_id visible in Freshsales
```

### Backend log check (confirms no 400s)
```bash
tail -n 100 /var/log/supervisor/backend.err.log | grep "upsert 400\|Freshsales.*400"
# Expected: no new 400 errors after fix
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Extra GET call in UPDATE path adds latency | HIGH (every returning visitor) | LOW (~50ms, best-effort async) | Already done in swap_otp_tag and mark_demo_booked — proven safe |
| Merge could overwrite a manual sales rep edit in Freshsales | LOW (race window <1s) | LOW | Acceptable; new session data should win over stale |
| Freshsales rate limit increase | LOW | LOW | One extra GET per UPDATE; well within 100 req/min quota |
| 400-retry change (drop cf vs restore stale) | LOW | LOW | Worst case: cf not updated on this submission. Contact still saved in Mongo. |

---

## Success Criteria

After deploy:
- [ ] New demo leads: `cf_contact_person` = UUID in Freshsales ✅
- [ ] New quote leads: `cf_contact_person` = UUID in Freshsales ✅ (was always empty before)
- [ ] New contact leads: `cf_contact_person` = UUID in Freshsales ✅ (was always empty before)
- [ ] Returning visitor (demo form): `cf_latitude` (fbclid) preserved from prior session if current session has no fbclid ✅
- [ ] No "upsert 400" log lines for normal mobile UAs in backend logs ✅
- [ ] After OTP verify on any lead: `cf_contact_person` still has UUID (no wipe) ✅

---

## Out of Scope for This CR

- CR-48 backfill of historical July 4–5 era leads → run separately after this deploys
- `cf_longitude` IP address field type validation in Freshsales → monitor, no action now
- Freshsales consent / GTM-set fields — separate concern, not code-side

---

*CR-63 intake completed 2026-07-21. Ready for planning and implementation.*
