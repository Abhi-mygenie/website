# CR-39: Direct Visitor Attribution Default (`first_source = "website"`)

## Date: 2026-06-30
## Status: DISCOVERY COMPLETE — Awaiting owner approval
## Priority: HIGH (data integrity / lead recovery safety net)

---

## Problem Statement

When a visitor arrives at the website **without UTM parameters** (direct traffic, organic search, bookmarked link, etc.) and submits a demo form:

1. No `first_source` is set in Freshsales
2. The CRM source sync (`run_source_sync`) filters `first_source is NOT null` — so these leads are **invisible** to sync
3. If the MongoDB `insert_one` also fails (like the recent Atlas quota issue) — the lead is **unrecoverable**

This is how the 3 lost leads (Gffh, Himanshu Gupta, Prajjwal Chaubey) became orphaned.

---

## Root Cause Trace

```
STEP 1 — Frontend (attribution.js line 67)
  readParams() → parses URL query string for utm_source, utm_medium, etc.
  Direct visitor has no UTM params → returns {}

STEP 2 — Frontend (attribution.js line 70-79)
  localStorage stores { landing_page, referrer, first_seen }
  BUT no utm_source key (because readParams returned empty)

STEP 3 — Frontend (attribution.js line 124)
  getAttribution() → first_utm_source: first.utm_source || null → NULL

STEP 4 — Backend (server.py line 204-205)
  _attribution_to_crm(attr) →
    if _trunc(a.get("first_utm_source")):    ← NULL is falsy → SKIPS
        native["first_source"] = ...          ← NEVER EXECUTED
  
  Result: native dict has NO "first_source" key

STEP 5 — Backend (server.py line 228-230)
  _derive_lead_source_id(a) →
    src = "" (no first_utm_source, no last_utm_source)
    Returns LS_DIRECT (402001798782)
  
  Result: lead_source_id = "Direct" ← CORRECTLY set
  BUT first_source = NOT SET ← PROBLEM

STEP 6 — Freshsales (freshsales.py line 250-251)
  New contact creation:
    contact.update({k: v for k, v in extra_fields.items() if v not in (None, "")})
  
  Since "first_source" is not in native dict at all → NOT sent to Freshsales

STEP 7 — CRM Source Sync (crm_sync.py line 514)
  run_source_sync() →
    filter: {"attribute": "first_source", "operator": "is_not_null", "value": ""}
  
  This lead has NO first_source → EXCLUDED from sync → INVISIBLE
```

---

## Proposed Fix

**ONE line change in `backend/server.py` line 204-205:**

```python
# CURRENT:
if _trunc(a.get("first_utm_source")):
    native["first_source"] = _trunc(a.get("first_utm_source"))

# PROPOSED:
native["first_source"] = _trunc(a.get("first_utm_source")) or "website"
```

This ensures every lead gets `first_source = "website"` as a fallback when no UTM source is present.

---

## Full Impact Analysis

### 1. Freshsales Native Field: `first_source`

| Scenario | Current | After Fix |
|---|---|---|
| Direct visitor (no UTM) | first_source = NOT SET | first_source = "website" |
| Google paid (gclid + utm_source=google) | first_source = "google" | first_source = "google" (unchanged) |
| Meta paid (fbclid + utm_source=facebook) | first_source = "facebook" | first_source = "facebook" (unchanged) |
| Organic (utm_source=google, no gclid) | first_source = "google" | first_source = "google" (unchanged) |

**Impact:** Only affects leads with NULL first_utm_source. Paid/attributed leads are untouched.

**Freshsales guard (freshsales.py line 198-206):** On UPDATE (returning visitor), `first_*` fields are protected by the guard:
```python
and not k.startswith("first_")
```
So if a returning visitor first came via paid (first_source="google") and later returns as direct, the "website" default will NOT overwrite "google" — the guard blocks it. ✅ SAFE.

On CREATE (new contact, line 250-251), all extra_fields are sent. So new direct leads will get first_source="website". ✅ CORRECT.

### 2. Freshsales `lead_source_id` (CR-18)

**`_derive_lead_source_id()` (server.py line 143-179):**

Currently for direct visitors:
```python
src = "" (no UTM)
→ falls through all checks
→ return LS_DIRECT (402001798782)
```

After fix, the `_derive_lead_source_id` function reads from `a` (the raw attribution dict), NOT from `native`. It uses `a.get("first_utm_source")` which will still be NULL. So `lead_source_id` will still be `LS_DIRECT`.

**Impact: NONE.** The fix sets `native["first_source"]` AFTER `_derive_lead_source_id` runs. The lead_source_id derivation is unaffected. ✅ SAFE.

### 3. CRM Source Sync (crm_sync.py)

**`run_source_sync()` (line 514):**
```python
{"attribute": "first_source", "operator": "is_not_null", "value": ""}
```
After fix, direct leads will have `first_source = "website"` → they will now be **included** in source sync. ✅ THIS IS THE DESIRED EFFECT.

**Source backfill buckets (crm_sync.py line 271-276):**
```python
_SOURCE_BUCKETS_DEFAULT = [
    ("google",   ["google", "google1", "Google", "Google "]),
    ("facebook", ["facebook", "facebook-SiteLink", "fb", "Facebook"]),
    ("website",  ["website", "Website", "web", "Web"]),      ← "website" IS ALREADY HERE
    ("chat",     ["chat", "Chat", "livechat", "live_chat"]),
]
```
The value "website" is already in the `_SOURCE_BUCKETS`. So:
- `run_source_backfill()` (line 352): searches by `first_source is_in ["website", "Website", "web", "Web"]` → will find these new leads ✅
- `run_source_sync()` (line 514): searches `first_source is_not_null` → will find them ✅
- `_build_stage_map()` (line 323): uses `first_source is_in [all source vals]` — "website" is included ✅

**Impact: ALL POSITIVE.** Direct leads become visible to all sync paths. No negative side effects.

### 4. Funnel Source Bucketing (funnel.py)

**`_source_label()` (funnel.py line 29-74):**
```python
src = (a.get("first_utm_source") or doc.get("first_source") or "").lower()
...
if src in ("website", "web"):
    return "website"
```

For demo_requests with `attribution.first_utm_source = null`:
- `a.get("first_utm_source")` → None
- `doc.get("first_source")` → None (demo_requests doesn't have flat first_source field)
- src = "" → falls to `return "direct"`

After fix, nothing changes in funnel.py for the *frontend display* because demo_requests docs store attribution in the nested `attribution` dict, not flat `first_source`. The fix is backend → Freshsales, not backend → MongoDB schema.

**However**, if a future sync pulls back the "website" value from Freshsales into `backfilled_leads.first_source`, then the funnel will correctly bucket it as "website" instead of "direct". ✅ BETTER.

**Impact: NEUTRAL to POSITIVE.** No breakage. Improves classification after sync-back.

### 5. Leads Table (leads.py)

**`_source()` (leads.py line 33-34):**
```python
return attr.get("last_utm_source") or attr.get("first_utm_source")
```
This reads from the `attribution` nested dict in `demo_requests`. The fix doesn't change what's stored in `attribution` — it only changes what's sent to Freshsales. The MongoDB `attribution` object will still have `first_utm_source: null` for direct leads.

**Impact: NONE.** Leads table display unchanged. ✅ SAFE.

### 6. GTM / Meta CAPI (gtm.js)

**`gtm.js` (line 214):**
```python
source: attr.last_utm_source || attr.first_utm_source || null,
```
This reads from the frontend attribution object (localStorage/sessionStorage), not from the backend. The fix doesn't touch frontend attribution storage.

**Impact: NONE.** GTM events unchanged. ✅ SAFE.

### 7. Meta Ads / Google Ads Spend (ads_mcp.py)

No dependency on `first_source`. The ads sync pulls spend data from Meta/Google APIs, completely independent of lead attribution.

**Impact: NONE.** ✅ SAFE.

---

## Dependency Matrix

| System | Reads first_source? | Writes first_source? | Affected by fix? | Safe? |
|---|---|---|---|---|
| Frontend attribution.js | No (writes first_utm_source) | No | No | ✅ |
| Frontend gtm.js | Reads first_utm_source | No | No | ✅ |
| Backend server.py _attribution_to_crm | Reads first_utm_source → writes native["first_source"] | **YES — this is the fix location** | **YES** | ✅ |
| Backend server.py _derive_lead_source_id | Reads first_utm_source (raw attr) | No | No | ✅ |
| Backend freshsales.py upsert_contact | Receives native as extra_fields | No (passes through) | Receives "website" for direct leads | ✅ (guard protects existing) |
| Backend crm_sync.py run_source_sync | Filters first_source is_not_null | No | Direct leads now visible | ✅ (desired) |
| Backend crm_sync.py source_backfill | Filters first_source is_in [...,"website",...] | Writes first_source from bucket | Direct leads now included | ✅ (desired) |
| Backend funnel.py _source_label | Reads first_utm_source OR first_source | No | Neutral (reads from attribution dict) | ✅ |
| Backend funnel.py _load_all | Filters backfilled_leads by first_source != None | No | More backfilled leads visible after sync-back | ✅ |
| Backend leads.py _source | Reads attribution.first_utm_source | No | No | ✅ |
| Backend ads_mcp.py | No dependency | No | No | ✅ |
| MongoDB demo_requests | attribution.first_utm_source stays null | No | No | ✅ |
| Freshsales CRM | Receives first_source on create | N/A | Gets "website" for direct leads | ✅ |

---

## Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | "website" overwrites a paid source on returning visitor | ZERO | N/A | freshsales.py guard blocks first_* on UPDATE (line 204) |
| 2 | Funnel shows wrong bucket for direct leads | LOW | LOW | Funnel reads from attribution dict (null), not from Freshsales. Stays "direct" until sync-back. |
| 3 | Source sync pulls too many leads after fix | LOW | LOW | Only new leads get "website". Existing null-source contacts in Freshsales are untouched. |
| 4 | lead_source_id changes from DIRECT to something else | ZERO | N/A | _derive_lead_source_id reads raw attr, not native dict. Unaffected. |
| 5 | Meta CAPI events affected | ZERO | N/A | gtm.js reads frontend attribution, independent of backend fix. |
| 6 | Google Ads conversion tracking affected | ZERO | N/A | Conversion tracking uses gclid/event_id, not first_source. |

---

## Implementation Plan

### Files Modified: 1 file, 1 line

| File | Line | Change |
|---|---|---|
| `backend/server.py` | 204-205 | Replace conditional with fallback default |

### Before:
```python
if _trunc(a.get("first_utm_source")):
    native["first_source"] = _trunc(a.get("first_utm_source"))
```

### After:
```python
native["first_source"] = _trunc(a.get("first_utm_source")) or "website"
```

### Files NOT Modified:
- frontend/* — no changes
- freshsales.py — guard already handles it
- crm_sync.py — already has "website" in source buckets
- funnel.py — already has "website" bucket
- leads.py — reads from attribution dict, unaffected
- ads_mcp.py — no dependency
- .env — no new env vars

### Validation Steps (post-implementation):
1. Submit a demo form as a direct visitor (no UTM params)
2. Check Freshsales contact → verify first_source = "website"
3. Check MongoDB demo_requests → verify attribution.first_utm_source is still null (unchanged)
4. Trigger source sync → verify the new lead appears in sync results
5. Check funnel → verify the lead is in the correct bucket

---

*CR-39 registered: 2026-06-30. Agent: E1, Emergent Labs.*
