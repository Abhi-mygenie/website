# CR-63 — Fix Missing `event_id`, `otp_verified` & `cf_rooms` for Quote/Contact Forms

**Type:** Bug Fix + Data Backfill  
**Date:** 2026-07-21  
**Status:** READY FOR IMPLEMENTATION  
**Scope:** Quote form, Contact form, all 3 endpoints (cf_category truncation)  
**Out of scope:** `upsert_contact` UPDATE merge fix → CR-64 (separate)  
**Related:** CR-47, CR-48, CR-51, CR-62, CR-63 (investigation)

---

## 1. Impact Analysis

### 1.1 Gap — `event_id` not sent/saved for Quote & Contact

**What breaks:**
- Meta CAPI server-side conversion events for quote and contact leads carry no `event_id`
- Browser → server deduplication fails: Meta counts the same conversion twice (once from Pixel, once from CAPI)
- ROAS is overstated for leads that came through Quote or Contact form
- The Ads Intelligence funnel (CR-24) cannot stitch browser event to server event for these leads
- `cf_contact_person` in Freshsales is empty or shows only `utm_ad` (ad name) — not the UUID — for all quote/contact leads

**Blast radius:** Every "Website Quote", "Buy Online", "Website Contact" tagged lead — all of them, all time.

**Severity:** HIGH for ad attribution integrity. All 5 existing quote leads and all future quote/contact submissions.

---

### 1.2 Gap — `otp_verified` initial state absent in MongoDB for Quote & Contact

**What breaks:**
- Querying `{otp_verified: false}` misses all unverified quote/contact leads — the field is simply absent
- Funnel analytics cannot correctly count "submitted but not OTP verified" for these form types
- `otp_verified` is `True` for leads that completed OTP (written by `lead_otp_confirm`), but `ABSENT` (not `False`) for those who didn't — making aggregations wrong

**Current state of 5 existing quote docs:**

| Name | Date | Mongo `otp_verified` | FS `cf_rooms` | Backfill action |
|---|---|---|---|---|
| CAFE Restro milan | 2026-07-10 | `True` ✅ | `Yes` ✅ | None |
| Kunal gupta | 2026-07-08 | `True` ✅ | `Yes` ✅ | None |
| Kuldeep Maurya | 2026-07-08 | `True` ✅ | `Yes` ✅ | None |
| Karthick Arumugam | 2026-07-01 | `ABSENT` ❌ | `-` ❌ | Set Mongo `False` + FS `cf_rooms=No` |
| VIkas Atwal | 2026-06-24 | `ABSENT` ❌ | `-` ❌ | Set Mongo `False` + FS `cf_rooms=No` |

**Severity:** MEDIUM — data integrity for funnel queries. 2 existing records to backfill.

---

### 1.3 Gap — `cf_rooms = "No"` never written to Freshsales on Quote/Contact initial submit

**What breaks:**
- Sales team cannot filter "submitted but unverified" leads in Freshsales for quote/contact types
- Quote leads that complete OTP are correctly marked `Yes`. Those who don't have no value — indistinguishable from leads where OTP was never offered
- Inconsistent with Demo form behaviour where `cf_rooms = "No"` is always written upfront

**Severity:** MEDIUM — sales workflow and CRM data consistency.

---

### 1.4 Gap — `cf_category` (User-Agent) not truncated in all 3 endpoints

**What breaks:**
- Android + Meta in-app browser UA strings are 250–450 chars
- Freshsales field limit is 255 chars → PUT returns 400
- 400 triggers the existing retry which sends `existing_cf` from old snapshot → **new `event_id` is silently discarded** even after this CR fixes Gap 1
- This means fixing Gap 1 without fixing Gap 4 will be partially ineffective for returning visitors on mobile

**Severity:** HIGH — directly sabotages Gap 1 fix for the largest traffic segment (Meta mobile).

**Affected endpoints:** `/demo-request`, `/quote`, `/contact` — all three.

---

### 1.5 Summary of Interactions Between Gaps

```
Gap 4 (UA truncation) ──► causes 400 ──► 400-retry discards new event_id
                                           ↑
Gap 1 (event_id for quote/contact) ────────┘
                          Fix Gap 4 first OR simultaneously, else Gap 1 fix is partially wasted
```

Gaps 2 and 3 (`otp_verified` + `cf_rooms`) are independent — no interaction risk.

---

## 2. Implementation Plan

### Phase 0 — Backfill existing 2 unverified quote docs (run BEFORE code deploy)

**Why before:** Code deploy will start writing `otp_verified: False` for new submissions. Running the backfill before deploy gives a clean baseline — existing unverified docs get `False`, then forward all new ones also start as `False`.

**Target:** MongoDB `quotes` collection + Freshsales

| Contact | FS ID | MongoDB change | Freshsales change |
|---|---|---|---|
| Karthick Arumugam | 402211223893 | Set `otp_verified: False` | Merge `cf_rooms = "No"` |
| VIkas Atwal | 402210602058 | Set `otp_verified: False` | Merge `cf_rooms = "No"` |

**Script logic (implementing agent must write this):**
```python
# For each of the 2 unverified quote docs:
# 1. MongoDB: update_one({"phone": phone}, {"$set": {"otp_verified": False}})
# 2. Freshsales: GET contact → merge existing_cf with {"cf_rooms": "No"} → PUT
# No reads/writes to demo_requests or contact_messages
```

---

### Phase 1 — Backend: `cf_category` truncation (Gap 4 — highest priority, fix first)

**File:** `backend/server.py`  
**3 locations** — one per endpoint:

#### 1a. `/demo-request` handler (~line 342)
```python
# BEFORE
"cf_longitude": ip,
"cf_category": ua,

# AFTER
"cf_longitude": _trunc(ip),
"cf_category":  _trunc(ua),
```

#### 1b. `/quote` handler (~line 617)
```python
# BEFORE
"cf_longitude": ip,
"cf_category": ua,

# AFTER
"cf_longitude": _trunc(ip),
"cf_category":  _trunc(ua),
```

#### 1c. `/contact` handler (~line 682)
```python
# BEFORE
"cf_longitude": ip,
"cf_category": ua,

# AFTER
"cf_longitude": _trunc(ip),
"cf_category":  _trunc(ua),
```

**Risk:** Zero. `_trunc` already exists, already used on all attribution fields. This is a 3-line defensive change.

---

### Phase 2 — Backend: Add `event_id` to Quote model and handler (Gap 1)

**File:** `backend/server.py`

#### 2a. Add field to `QuoteCreate` model (~line 576)
```python
# Add after elapsed_ms:
event_id: str | None = None
```

#### 2b. Pass `event_id` to Freshsales in `/quote` handler + save to MongoDB (~line 619)
```python
# In upsert_contact custom_field dict, after **attr_cf:
**({"cf_contact_person": payload.event_id} if payload.event_id else {}),

# After doc['geo'] = geo_data, before insert_one:
if payload.event_id:
    doc['event_id'] = payload.event_id
```

**Risk:** Low. `event_id` is optional (`str | None = None`) — old clients sending no `event_id` are unaffected.

---

### Phase 3 — Backend: Add `event_id` to Contact model and handler (Gap 1)

**File:** `backend/server.py`

#### 3a. Add field to `ContactMessageCreate` model (~line 648)
```python
# Add after elapsed_ms:
event_id: str | None = None
```

#### 3b. Pass `event_id` to Freshsales in `/contact` handler + save to MongoDB (~line 684)
```python
# In upsert_contact custom_field dict, after **attr_cf:
**({"cf_contact_person": payload.event_id} if payload.event_id else {}),

# After doc['geo'] = geo_data, before insert_one:
if payload.event_id:
    doc['event_id'] = payload.event_id
```

**Risk:** Low. Same pattern as Phase 2.

---

### Phase 4 — Backend: Add `otp_verified` initial state + `cf_rooms` for Quote (Gaps 2 & 3)

**File:** `backend/server.py`

#### 4a. Add `cf_rooms = "No"` to `/quote` initial upsert (~line 614)
```python
# In upsert_contact custom_field dict, add:
"cf_rooms": "No",
```

#### 4b. Save `otp_verified: False` in MongoDB for new quote submissions (~line 624)
```python
# After doc['geo'] = geo_data, before insert_one:
doc['otp_verified'] = False
```

**Risk:** Low. `cf_rooms = "No"` is already the exact pattern used by Demo form — `swap_otp_tag` correctly upgrades it to `"Yes"` when OTP is confirmed. No change to OTP confirm flow.

---

### Phase 5 — Backend: Add `otp_verified` initial state + `cf_rooms` for Contact (Gaps 2 & 3)

**File:** `backend/server.py`

#### 5a. Add `cf_rooms = "No"` to `/contact` initial upsert (~line 679)
```python
# In upsert_contact custom_field dict, add:
"cf_rooms": "No",
```

#### 5b. Save `otp_verified: False` in MongoDB for new contact submissions (~line 692)
```python
# After doc['geo'] = geo_data, before insert_one:
doc['otp_verified'] = False
```

**Risk:** Low. Same as Phase 4.

---

### Phase 6 — Frontend: Send `event_id` from CheckoutModal (Gap 1)

**File:** `frontend/src/components/pricing/CheckoutModal.jsx`

`eventId` is already generated at line 49 via `useState(() => newEventId())`.  
Only change needed: add it to the axios POST body.

#### 6a. Quote form submit (~line 76)
```javascript
// In axios.post(`${API}/quote`, { ... }), add:
event_id: eventId,
```

**Risk:** Zero. `eventId` is already in scope at that line.

---

### Phase 7 — Frontend: Send `event_id` from MessageForm (Gap 1)

**File:** `frontend/src/components/site/MessageForm.jsx`

`eventId` is already generated at line 46 via `useState(() => newEventId())`.

#### 7a. Contact form submit (~line 68)
```javascript
// In axios.post(`${API}/contact`, { ... }), add:
event_id: eventId,
```

**Risk:** Zero. `eventId` is already in scope at that line.

---

## 3. Execution Order

```
Phase 0  →  Backfill 2 existing unverified quote docs (Mongo + FS)
             ↓
Phase 1  →  cf_category + cf_longitude truncation (ALL 3 endpoints)  [highest risk blocker]
             ↓
Phase 2  →  event_id for Quote (backend model + handler)
Phase 3  →  event_id for Contact (backend model + handler)
Phase 4  →  otp_verified + cf_rooms for Quote
Phase 5  →  otp_verified + cf_rooms for Contact
             ↓  [backend deploy / hot reload]
Phase 6  →  CheckoutModal: send event_id in POST body
Phase 7  →  MessageForm: send event_id in POST body
             ↓  [frontend rebuild]
```

Phases 2–5 can be done in one pass (same file, same session).  
Phases 6–7 can be done in parallel.

---

## 4. Files Changed

| File | Phases | Change type |
|---|---|---|
| `backend/server.py` | 1, 2, 3, 4, 5 | 6 small additions/edits |
| `frontend/src/components/pricing/CheckoutModal.jsx` | 6 | 1 line add |
| `frontend/src/components/site/MessageForm.jsx` | 7 | 1 line add |
| One-off backfill script (ephemeral, not committed) | 0 | Mongo write + FS PUT |

---

## 5. Test Plan

### Backend curl tests (after deploy)

```bash
API="https://genie-react-api.preview.emergentagent.com"

# Quote: confirm event_id saved in Mongo + written to FS cf_contact_person
curl -s -X POST "$API/api/quote" \
  -H "Content-Type: application/json" \
  -d '{"name":"CR63 Quote Test","phone":"9000000001","plan_id":"starter",
       "plan_name":"Starter","event_id":"cr63-test-uuid-quote",
       "attribution":{"fbclid":"testfbc","last_utm_source":"facebook"}}'

# Contact: confirm event_id saved in Mongo + written to FS cf_contact_person
curl -s -X POST "$API/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"CR63 Contact Test","phone":"9000000002","message":"test",
       "event_id":"cr63-test-uuid-contact",
       "attribution":{"fbclid":"testfbc2"}}'

# Long UA (Android Meta in-app): confirm NO 400 in backend logs
curl -s -X POST "$API/api/demo-request" \
  -H "User-Agent: Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/444.0.0.49.109;]" \
  -H "Content-Type: application/json" \
  -d '{"name":"Long UA Test","phone":"9000000003","event_id":"cr63-test-uuid-demo",
       "attribution":{}}'
```

### Freshsales verification (manual, after curl)
For each test contact above, search in Freshsales by phone and confirm:
- `cf_contact_person` = the UUID sent ✅
- `cf_rooms` = `"No"` for quote and contact (unverified state) ✅
- `cf_latitude` = fbclid value ✅

### Log check
```bash
tail -n 50 /var/log/supervisor/backend.err.log | grep "upsert 400\|Freshsales.*400"
# Expected: zero hits
```

### MongoDB verification
```python
# Demo: event_id in doc
db.demo_requests.find_one({"phone": "9000000003"}, {"event_id": 1, "otp_verified": 1})

# Quote: event_id + otp_verified: False in doc
db.quotes.find_one({"phone": "9000000001"}, {"event_id": 1, "otp_verified": 1})

# Contact: event_id + otp_verified: False in doc
db.contact_messages.find_one({"phone": "9000000002"}, {"event_id": 1, "otp_verified": 1})
```

---

## 6. Success Criteria

- [ ] New quote submission: `cf_contact_person` = UUID in Freshsales ✅
- [ ] New contact submission: `cf_contact_person` = UUID in Freshsales ✅
- [ ] New quote submission: `cf_rooms = "No"` in Freshsales ✅
- [ ] New contact submission: `cf_rooms = "No"` in Freshsales ✅
- [ ] New quote submission: `otp_verified: False` in MongoDB ✅
- [ ] New contact submission: `otp_verified: False` in MongoDB ✅
- [ ] After OTP verify on quote: `cf_rooms = "Yes"` + `otp_verified: True` ✅
- [ ] Long Android UA: zero `upsert 400` log entries ✅
- [ ] Karthick Arumugam + VIkas Atwal: `otp_verified: False` in Mongo, `cf_rooms: No` in FS ✅

---

## 7. Rollback Plan

All changes are additive (new optional fields, defensive truncation). No breaking changes.  
If rollback needed: revert the 3 backend lines and 2 frontend lines. MongoDB `otp_verified: False` entries are harmless if left behind.

---

*CR-63 ready for implementation. Implement CR-64 separately after this is verified in production.*
