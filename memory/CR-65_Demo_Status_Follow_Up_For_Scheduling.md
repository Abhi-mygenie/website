# CR-65 — Change Calendly Demo-Booked Status: "Demo Scheduled" → "Follow Up for Scheduling"

**Type:** Behaviour Change / CRM Status Mapping  
**Date Raised:** 2026-07-21  
**Raised By:** Owner  
**Status:** INTAKE — awaiting clarification before planning  
**Priority:** MEDIUM  
**Scope:** `backend/freshsales.py` → `mark_demo_booked()` + `.env` status ID  
**Related:** CR-47 (cf merge fix), CR-40 (OTP-verified tag)

---

## 1. What the User Requested

> "demo scheduled to be changed to follow up for scheduling status"

When a Calendly booking fires (`invitee.created` webhook → `/api/calendly/webhook`)
or a manual `/api/demo-booked` call is made, the Freshsales contact status should
become **"Follow Up for Scheduling"** instead of the current "Demo Scheduled" status.

---

## 2. Current Behaviour (fully traced)

### 2.1 Trigger paths

| Path | When fired | Function called |
|---|---|---|
| `POST /api/calendly/webhook` | Calendly `invitee.created` event | `freshsales.mark_demo_booked(...)` |
| `POST /api/demo-booked` | Manual CMS / internal trigger | `freshsales.mark_demo_booked(...)` |

Both paths call the same `mark_demo_booked()` function in `freshsales.py`.

### 2.2 What `mark_demo_booked()` currently writes to Freshsales

```python
# freshsales.py lines 396–402
merged = _merge_tags(existing_tags, DEMO_BOOKED_TAG)   # adds tag
update: dict = {"tags": merged}

if DEMO_BOOKED_LIFECYCLE_ID:
    update["lifecycle_stage_id"] = int(DEMO_BOOKED_LIFECYCLE_ID)  # 403021121245 (Lead)

if DEMO_BOOKED_STATUS_ID:
    update["contact_status_id"] = int(DEMO_BOOKED_STATUS_ID)      # 402001963264
```

### 2.3 Current env values (from `backend/.env`)

| Variable | Current Value | Meaning |
|---|---|---|
| `FRESHSALES_DEMO_BOOKED_TAG` | `"Demo Scheduled (Web)"` | Tag added to contact |
| `FRESHSALES_STATUS_DEMO_BOOKED_ID` | `402001963264` | Freshsales contact_status_id |
| `FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID` | `403021121245` | lifecycle_stage_id (same as Lead — likely a config gap) |

### 2.4 Full status ID map (known from env)

| Variable | ID | Purpose |
|---|---|---|
| `FRESHSALES_STATUS_NEW_ID` | `402001137706` | On initial form submit |
| `FRESHSALES_STATUS_DEMO_BOOKED_ID` | `402001963264` | On demo booking ← **changing this** |
| `FRESHSALES_STATUS_DEMO_GIVEN_ID` | `402001226981` | After demo is completed |
| `FRESHSALES_STATUS_PAYMENT_AWAITED` | `402001783018` | Payment stage |
| `FRESHSALES_STATUS_WON_ID` | `402001137712` | Closed-won |
| `FRESHSALES_STATUS_LOST_ID` | `402001137713` | Closed-lost |

### 2.5 MongoDB side-effect

Both trigger paths also set `demo_requests.status = "demo_booked"` in MongoDB.
No change requested here (MongoDB field is internal, not CRM-facing).

---

## 3. Desired Behaviour

When a demo is booked via Calendly (or manually via `/api/demo-booked`):

| Field | Current | Desired |
|---|---|---|
| Freshsales contact status | `402001963264` ("Demo Scheduled") | **`<FOLLOW_UP_FOR_SCHEDULING_STATUS_ID>`** |
| Freshsales tag | `"Demo Scheduled (Web)"` | **TBD** (see Clarifications) |
| Freshsales lifecycle | `403021121245` (Lead) | Likely unchanged |
| MongoDB `status` | `"demo_booked"` | Likely unchanged |

---

## 4. Implementation Plan (pending clarifications)

This is a **two-line change** once the Freshsales status ID is confirmed:

### Option A — env-only change (zero code edit)
If "Follow Up for Scheduling" is an existing Freshsales status, simply update `.env`:
```
FRESHSALES_STATUS_DEMO_BOOKED_ID=<new_id>
FRESHSALES_DEMO_BOOKED_TAG=Follow Up for Scheduling
```
Hot-reload picks it up immediately. No code change. No deployment.

### Option B — add new env variable + code update
If a new env variable name is preferred for clarity:
1. Add `FRESHSALES_STATUS_FOLLOW_UP_ID=<new_id>` to `.env`
2. Update `freshsales.py` line 33 and line 401 to reference new variable

---

## 5. Clarifications Required Before Implementation

1. **Freshsales status ID**: What is the Freshsales `contact_status_id` for
   "Follow Up for Scheduling"? Please check:
   `Freshsales → Admin → Contacts → Contact Statuses` and share the ID.
   (Or share a screenshot — we can read the ID from the Freshsales API response.)

2. **Tag change?** Should the TAG also change from `"Demo Scheduled (Web)"` to
   `"Follow Up for Scheduling"`, or only the contact status? Tags drive CRM
   filtering; the status drives the pipeline view.

3. **Trigger scope**: Does this change apply to BOTH trigger paths
   (`/calendly/webhook` AND `/demo-booked`), or only one?

4. **Lifecycle stage**: Should `lifecycle_stage_id` also change? Currently it
   stays on `"Lead"` (`403021121245`) even after booking — is this intentional?
   (Note: current `.env` has `FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID = 403021121245`
   which is the same as the lead lifecycle — looks like a pre-existing config gap.)

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Wrong status ID used → silent no-op (Freshsales ignores unknown IDs) | Low | Low | Verify via `curl /contacts/{id}` after change |
| Status ID for "Follow Up for Scheduling" doesn't exist in this Freshsales account | Medium | Blocks implementation | Owner to create status in Freshsales Admin first |
| Calendly webhook + `/demo-booked` now set different status than before → sales team workflow breaks | Low | Medium | Communicate change to sales team before deploy |

---

## 7. Files Affected

| File | Change | Type |
|---|---|---|
| `backend/.env` | Update `FRESHSALES_STATUS_DEMO_BOOKED_ID` and `FRESHSALES_DEMO_BOOKED_TAG` | Config-only (no code edit) |
| `backend/freshsales.py` | Possibly rename env var reference (Option B only) | Optional, 2-line |

---

## 8. Definition of Done

- [ ] Clarifications answered (status ID confirmed).
- [ ] `.env` updated with correct status ID.
- [ ] Test: call `POST /api/demo-booked` with a test contact_id → verify Freshsales contact status shows "Follow Up for Scheduling".
- [ ] Backend logs show no 400 errors from the PUT.

---

*CR-65 intake completed 2026-07-21. Status: AWAITING CLARIFICATION. Agent: E1, Emergent Labs.*
