# CR-40: OTP-Verified Tag + Backfill

## Date: 2026-06-30
## Status: IMPLEMENTED
## Priority: MEDIUM (CRM usability / filtering)

---

## Problem Statement

When a lead submits the demo form with a verified OTP, Freshsales receives:
- Tag: `"Website Demo Lead"` (no OTP indication)
- Custom field: `cf_rooms = "Yes"`

When OTP is NOT verified:
- Tag: `"Website Demo Lead", "OTP-Unverified"`
- Custom field: `cf_rooms = "No"`

**There is no positive `"OTP-Verified"` tag.** Sales team cannot easily filter verified leads in Freshsales by tag — they must use the obscure `cf_rooms` custom field.

---

## Fix: Two Parts

### Part 1 — New Leads (code change)

**File:** `backend/server.py` line 278

```python
# Current:
demo_tags = ["Website Demo Lead"] if otp_verified else ["Website Demo Lead", "OTP-Unverified"]

# Fix:
demo_tags = ["Website Demo Lead", "OTP-Verified"] if otp_verified else ["Website Demo Lead", "OTP-Unverified"]
```

**Impact:** All future verified leads get `"OTP-Verified"` tag in Freshsales. Zero side effects — tags are additive.

### Part 2 — Backfill Existing Verified Leads (DB/API operation)

Existing verified leads in Freshsales have `cf_rooms = "Yes"` but NO `"OTP-Verified"` tag.

**Approach:**
1. Query Freshsales: `filtered_search` where `cf_rooms = "Yes"`
2. For each contact: check if tags already contain `"OTP-Verified"` → skip if yes
3. If not: `PUT /contacts/{id}` with tags merged to include `"OTP-Verified"`

**Alternatively:** Single MongoDB query to find all `demo_requests` with `otp_verified: true`, get their `freshsales_contact_id`, then batch-update tags in Freshsales.

---

## Files Modified

| Part | File | Change |
|---|---|---|
| Part 1 | `backend/server.py` line 278 | Add "OTP-Verified" to tags for verified leads |
| Part 2 | No code change — one-time script/query | Backfill tag via Freshsales API |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Tag added to wrong contacts | LOW | Backfill only touches cf_rooms="Yes" contacts |
| Freshsales rate limit on backfill | LOW | Use 2s delay between API calls (same as crm_sync) |
| Existing tags overwritten | ZERO | Using tag merge (append), not replace |

---

*CR-40 registered: 2026-06-30. Agent: E1, Emergent Labs.*
