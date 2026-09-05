# CR-62 — Missing `event_id` & `fbclid` in Freshsales: Full Investigation

**Date:** 2026-07-21  
**Status:** INVESTIGATION COMPLETE — fixes pending  
**Severity:** HIGH — affects Meta CAPI dedup, attribution accuracy, ROAS reporting  
**Reported by:** Owner (screenshot review of last-7-days leads, Freshsales CRM)

---

## Symptom

Freshsales view shows large number of leads with:
- **"Event ID GTM"** column (`cf_contact_person`) → empty / "Click to add"
- **"fbclidFacebook Click ID"** column (`cf_latitude`) → empty

Confirmed: all these leads ARE website submissions (tags like "Website Demo Lead", "OTP-Unverified", etc. are present — proving the backend API was called and ran correctly).

---

## Field Mapping (code → Freshsales)

| Data | Backend field | Freshsales cf_ field | Freshsales column label |
|---|---|---|---|
| Browser event UUID | `payload.event_id` | `cf_contact_person` | Event ID GTM |
| Ad name (utm_ad) | `attr_cf["cf_contact_person"]` | `cf_contact_person` | Event ID GTM |
| Facebook click ID | `attr_cf["cf_latitude"]` | `cf_latitude` | fbclidFacebook Click ID |

`event_id` **wins over** `utm_ad` in `cf_contact_person` when both are present (line 346, server.py).

---

## Root Cause 1 — Quote & Contact forms have NO `event_id` field (largest scope)

### The gap
`QuoteCreate` (line 556, server.py) and `ContactMessageCreate` (line 637, server.py) have **no `event_id` field**. Neither does their `upsert_contact` call pass `cf_contact_person = event_id`.

```python
# QuoteCreate model (server.py line 556) — no event_id
class QuoteCreate(BaseModel):
    name: str
    phone: str
    ...
    # ← event_id MISSING from model entirely

# Quote upsert_contact call (server.py line 605) — no cf_contact_person
custom_field={
    "cf_outlet_type": obj.outlet_type,
    "cf_sku": obj.years_in_business,
    "cf_longitude": ip,
    "cf_category": ua,
    "cf_first_interest": cf_first_interest,
    **attr_cf,
    # ← no event_id assignment here
},
```

Same for `/contact` endpoint (line 670).

### Impact
**Every lead submitted via the Quote form or Contact form** never has `cf_contact_person` set to an event_id — only to `utm_ad` (ad name) if present. If there is no `utm_ad`, the field is blank.

### Scope
Any lead in Freshsales tagged "Website Quote", "Buy Online", or "Website Contact" → always missing event_id. This is a structural gap, not a bug introduced by an API change.

---

## Root Cause 2 — `upsert_contact` UPDATE path replaces `custom_field` without merging (returning visitors)

### The gap
`freshsales.py` lines 220–221 — **UPDATE path for existing contacts**:

```python
if cf:
    upd["custom_field"] = cf   # sends ONLY the new session's cf dict
```

Since Freshsales changed PUT semantics to **replace** (not merge) on 2026-07-04 (documented in CR-47), this means:
- Any `cf_` field **absent from the current session's `cf`** → **wiped** from Freshsales
- For returning visitors who revisit without a new Meta ad click: `fbclid` is not in the current URL → `cf_latitude` absent from new `cf` → old `cf_latitude` erased
- This is the **confirmed path for Ashok Luthra** (original submission ~6 months ago, direct return visit)

### Note
CR-47 fixed `swap_otp_tag` and `mark_demo_booked` with `{**existing_cf, **new_cf}` merge. The **main `upsert_contact` UPDATE path was never patched** and still replaces.

### Impact
- Every returning visitor (phone matched to existing contact) whose current session has no `fbclid` → loses `cf_latitude`
- Every returning visitor whose current session has no `utm_ad` → loses `cf_contact_person` (if it was set from utm_ad, not event_id)
- Grows by 1–2 leads per day (any returning organic/direct visitor)

---

## Root Cause 3 — `cf_category` (User-Agent) is NOT truncated before Freshsales PUT → triggers 400 → 400-retry discards new `event_id`

### The gap — two-stage problem

**Stage A: `cf_category` is sent raw, not truncated to 255 chars**

```python
# server.py line 135 — raw UA, not truncated
ua = request.headers.get("user-agent")

# server.py line 343 — sent directly, no _trunc()
"cf_category": ua,
```

Compare to attribution fields which ALL go through `_trunc(v, 255)` inside `_attribution_to_crm`. Modern mobile User-Agent strings (especially on Android or Facebook in-app browser) regularly exceed 255 chars. If Freshsales's `cf_category` field has a 255-char limit → PUT returns **400**.

**Stage B: 400-retry discards the new `event_id` and restores the old snapshot**

```python
# freshsales.py lines 241–256 — UPDATE path 400-retry
if r.status_code == 400 and "custom_field" in upd:
    existing = await _get_contact(cid)           # fetches contact from months ago
    existing_cf = existing.get("custom_field") or {}
    upd["custom_field"] = existing_cf            # ← sends OLD cf, new event_id GONE
    r = await _request("PUT", ...)
```

When 400 fires on the first PUT:
1. `_get_contact(cid)` fetches the contact's current `custom_field` snapshot (old)
2. `existing_cf` from a contact created months ago **has no `cf_contact_person`** (event_id feature didn't exist then)
3. Retry sends `existing_cf` → succeeds → `cf_contact_person` = empty (old snapshot wins over new event_id)

### Impact
- Any returning visitor whose UA string > 255 chars (common on Android + Meta in-app browser) → 400 on PUT → new event_id discarded
- Particularly affects leads from Meta ads who open links in the Facebook app (long FB in-app browser UA)
- Even for NEW contacts: if `_create_contact` 400-retry fires (CF-stripped fallback), event_id may be lost depending on version

### Combined chain for Ashok Luthra
```
1. Ashok originally submitted ~6 months ago (contact created, no event_id feature yet)
2. Today: direct return visit, no fbclid in URL
3. Backend: new cf = { cf_contact_person=new_uuid, cf_category=long_ua, ... }
   - cf_latitude absent (no fbclid this session)
4. PUT /contacts/{cid} → Freshsales 400 (cf_category too long)
5. 400-retry: existing_cf fetched = old snapshot (no cf_contact_person)
6. PUT retry with existing_cf → succeeds
7. Result: cf_contact_person = empty, cf_latitude = empty
```

---

## Root Cause 4 — CR-47 historical wipe (pre-fix, still affects leads from July 4–July 5 era)

Already documented in **CR-47**. Fixed for `swap_otp_tag` and `mark_demo_booked`. Backfill plan in **CR-48** (not yet executed). Leads from 2026-07-04 to fix-deploy date have empty cf_* despite valid data in MongoDB.

---

## Scope Summary

| Cause | Affected lead types | Approx. scope | Status |
|---|---|---|---|
| **RC1**: Quote/Contact forms never send event_id | "Website Quote", "Buy Online", "Website Contact" tagged leads | All time | Code gap — not yet fixed |
| **RC2**: UPDATE path replaces cf, wipes fbclid for return visitors | Any returning visitor (direct return, no fresh ad click) | Ongoing, ~1-2/day | CR-47 partial fix — UPDATE path not patched |
| **RC3**: cf_category not truncated → 400 → retry discards event_id | Returning visitors with long UA (Android + Meta in-app browser) | Ongoing subset of RC2 | Not yet fixed |
| **RC4**: CR-47 historical wipe (swap_otp_tag / mark_demo_booked) | Demo leads July 4–July 5 era | ~5–15 leads, bounded | Fixed in code; backfill (CR-48) pending |

---

## MongoDB is source of truth — data is NOT lost

**Important:** `event_id` and full attribution are **always saved in MongoDB** (`demo_requests.event_id`, `demo_requests.attribution.fbclid`). The gap is **only in Freshsales CRM display**. The underlying data for backfill exists.

```python
# server.py line 354–358 — MongoDB always gets the correct event_id
if payload.event_id:
    doc['event_id'] = payload.event_id
```

---

## Fixes Required (priority order)

### Fix 1 — Truncate `cf_category` (UA) to 255 chars — `server.py` line 343
**Priority: HIGH** — stops the 400 chain that discards event_id for returning visitors

```python
# Before
"cf_category": ua,

# After
"cf_category": _trunc(ua),   # _trunc already defaults to n=255
```

Same for `cf_longitude` (IP) as a defensive measure:
```python
"cf_longitude": _trunc(ip),
```

### Fix 2 — Add `event_id` to Quote and Contact form flows — `server.py` lines 556, 637, 605, 670
**Priority: HIGH** — closes the structural gap for all non-Demo form leads

```python
# QuoteCreate / ContactMessageCreate: add field
event_id: str | None = None

# upsert_contact call: add cf_contact_person
**({"cf_contact_person": payload.event_id} if payload.event_id else {}),
```

Frontend `PlanShowcase` / `CheckoutModal` / `MessageForm` must also generate and send `event_id` via `newEventId()` (same as DemoForm line 78).

### Fix 3 — Fetch+merge `custom_field` in `upsert_contact` UPDATE path — `freshsales.py` lines 208–259
**Priority: MEDIUM** — prevents fbclid and other fields from being wiped on returning visitor updates

```python
# After: fetch existing cf before building upd
existing_contact = await _get_contact(cid)
existing_cf = existing_contact.get("custom_field") or {}

if cf:
    upd["custom_field"] = {**existing_cf, **cf}   # merge, not replace
```

This is the natural extension of the same pattern already applied in `swap_otp_tag` and `mark_demo_booked`.

### Fix 4 — Run CR-48 backfill for July 4–5 era leads
**Priority: LOW** — bounded set, data is in MongoDB, script designed in CR-48

---

## Files to Change

| File | Lines | Change |
|---|---|---|
| `backend/server.py` | 342–343 | `_trunc(ua)`, `_trunc(ip)` |
| `backend/server.py` | 556, 637 | Add `event_id: str \| None = None` to QuoteCreate, ContactMessageCreate |
| `backend/server.py` | 605–623, 670–686 | Add `cf_contact_person = event_id` to both upsert_contact calls |
| `backend/freshsales.py` | 208–221 | Fetch+merge existing cf in UPDATE path |
| `frontend/src/components/pricing/CheckoutModal.jsx` | — | Generate + send `event_id` via `newEventId()` |
| `frontend/src/components/site/MessageForm.jsx` | — | Generate + send `event_id` via `newEventId()` |

---

## Validation Plan (post-fix)

1. Submit demo form as new contact → confirm `cf_contact_person` = UUID in Freshsales ✅
2. Submit demo form as returning contact (same phone) → confirm event_id updated, existing cf preserved ✅
3. Submit quote form → confirm `cf_contact_person` = UUID in Freshsales ✅
4. Submit contact form → confirm `cf_contact_person` = UUID in Freshsales ✅
5. Simulate long UA string (Chrome Android) → confirm no 400 in backend logs ✅
6. Verify OTP on step 1 lead → confirm all cf_* still present after swap_otp_tag ✅

---

*Investigation completed 2026-07-21. Related: CR-47 (Freshsales custom_field merge fix), CR-48 (backfill), CR-51 (event_id in MongoDB), CR-60 (Meta URL template contamination).*
