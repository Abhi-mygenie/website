# CR-65 — Change Demo-Booking Status: "Demo Scheduled" → "Follow Up for Scheduling"

**Type:** Behaviour Change / CRM Status Mapping  
**Date Raised:** 2026-07-21  
**Raised By:** Owner  
**Status:** INTAKE — 1 clarification pending before planning  
**Priority:** MEDIUM  
**Scope:** `backend/.env`, `backend/freshsales.py`, potentially `backend/crm_sync.py`, `frontend/src/pages/LeadsView.jsx`, `frontend/src/components/funnel/FunnelPanel.jsx`  
**Related:** CR-47 (cf merge), CR-40 (OTP tag)

---

## 1. User's Request (confirmed answers)

> "demo scheduled to be changed to follow up for scheduling status"

| Question | Answer |
|---|---|
| Tag also changes? | **Yes** — tag & status both change |
| Applies to both trigger paths? | **Yes** — Calendly webhook + manual `/api/demo-booked` |
| Lifecycle stage change? | **No** — stays as "Lead" (`403021121245`) — confirmed correct |
| Freshsales status ID for new status? | **⚠️ PENDING — see Section 6** |

---

## 2. Current Behaviour (fully traced)

### 2.1 Two trigger paths, one function

| Path | Trigger | Code |
|---|---|---|
| `POST /api/calendly/webhook` | Calendly `invitee.created` event | `server.py:521` → `freshsales.mark_demo_booked()` |
| `POST /api/demo-booked` | Manual CMS call | `server.py:435` → `freshsales.mark_demo_booked()` |

Both paths call `freshsales.mark_demo_booked()` → single change point.

### 2.2 What `mark_demo_booked()` writes to Freshsales today

```python
# freshsales.py lines 396–402
DEMO_BOOKED_TAG     = "Demo Scheduled (Web)"         # env: FRESHSALES_DEMO_BOOKED_TAG
DEMO_BOOKED_STATUS  = 402001963264                   # env: FRESHSALES_STATUS_DEMO_BOOKED_ID
DEMO_BOOKED_LC      = 403021121245                   # env: FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID (= Lead)

update = {
    "tags":                merged_tags_with(DEMO_BOOKED_TAG),
    "contact_status_id":   DEMO_BOOKED_STATUS,          # → "Demo Scheduled" in FS
    "lifecycle_stage_id":  DEMO_BOOKED_LC,              # → "Lead"
    "custom_field":        {**existing_cf, **booking_cf}
}
```

### 2.3 What MongoDB stores

Both trigger paths write: `demo_requests.status = "demo_booked"`.  
This MongoDB field is independent of Freshsales and stays **unchanged** by this CR.

---

## 3. Complete Impact Analysis

### 3.1 WRITE path impact (Freshsales)

**File:** `backend/freshsales.py`  
**What changes:**

| Field | Before | After |
|---|---|---|
| `DEMO_BOOKED_TAG` | `"Demo Scheduled (Web)"` | `"Follow Up for Scheduling"` |
| `contact_status_id` | `402001963264` | `<NEW_STATUS_ID>` |
| `lifecycle_stage_id` | `403021121245` (Lead) | unchanged |

**Code change:** Zero (env-only) — both values come from `.env`.

---

### 3.2 READ/SYNC path impact (crm_sync — CRITICAL)

`crm_sync.py` has a **bidirectional dependency** on `FRESHSALES_STATUS_DEMO_BOOKED_ID`.  
It uses this same env var for TWO purposes:

**Purpose A — Querying Freshsales for leads to pull into MongoDB (lines 26–27, 135):**
```python
DEMO_SCHEDULED_ID = int(os.environ.get("FRESHSALES_STATUS_DEMO_BOOKED_ID") or 0)
STAGE_STATUS_IDS = {
    "demo_scheduled": DEMO_SCHEDULED_ID,   # ← polls FS for contacts at this status
    ...
}
```
Every 6 hours, `crm_sync` calls Freshsales `/filtered_search/contact` with this status ID to find booked leads and write `crm_status = "demo_scheduled"` back to MongoDB.

**Purpose B — Per-contact status mapping (lines 301–302):**
```python
_STATUS_ID_TO_STAGE = {
    int(os.environ.get("FRESHSALES_STATUS_DEMO_BOOKED_ID") or 0): "demo_scheduled",
    ...
}
```
When any Freshsales contact record is processed, its `contact_status_id` is looked up here to get the MongoDB `crm_status` string.

**Effect of changing the env var to the new "Follow Up for Scheduling" status ID:**

| Scenario | Effect | Safe? |
|---|---|---|
| New bookings after this CR | Correctly picked up by sync as `crm_status = "demo_scheduled"` | ✅ |
| Old leads already in Freshsales with OLD status `402001963264` | `crm_sync` no longer polls for them; their Mongo `crm_status` stays frozen at current value | ✅ (no regression — they won't flip backward) |
| Old leads whose Freshsales status is manually moved to new status | Will be picked up correctly by the new status poll | ✅ |
| MongoDB `crm_status` internal key | Stays `"demo_scheduled"` — no change (the env var maps to the same internal label) | ✅ |

**Conclusion:** Updating the env var is safe. Old leads are not disrupted. New leads flow correctly.

---

### 3.3 Frontend internal label impact

The internal string `"demo_scheduled"` is used in **9 frontend components**. This is a MongoDB `crm_status` key — not a display string from Freshsales. It does NOT change when the env var changes. However, the display label shown to the sales team in the CRM dashboard will still read **"Demo Scheduled"** unless code is updated.

**Affected display labels (if label change is desired):**

| File | Line | Current label | Needs change? |
|---|---|---|---|
| `frontend/src/pages/LeadsView.jsx` | 51 | `demo_scheduled: "Demo Scheduled"` | ⚠️ depends on Q-A below |
| `frontend/src/components/funnel/FunnelPanel.jsx` | 73 | `label="Demo Scheduled"` | ⚠️ depends on Q-A |
| `frontend/src/components/ads/CrossChannelPanel.jsx` | 44 | `label: "Demo Scheduled"` | ⚠️ depends on Q-A |
| `frontend/src/components/funnel/FunnelPanel.jsx` | 56 | `"Lead → Demo Scheduled"` | ⚠️ depends on Q-A |

**These are cosmetic only — zero functional impact either way.**

---

### 3.4 Backend internal label impact

The string `"demo_scheduled"` appears in:
- `funnel.py` — stage bucketing logic (~20 occurrences)
- `leads.py` — counter logic
- `recommendations.py` — `demos = f.get("demo_scheduled", 0)`
- `server.py` — `_VALID_STAGES` validator set

All use `"demo_scheduled"` as an **internal MongoDB enum** — not a display string and not Freshsales-facing. These do **NOT** need to change (and should not change — it would require a MongoDB migration of all existing `crm_status` values).

---

### 3.5a Tracking impact — GTM / Meta / Google (verified 2026-07-21)

**Verdict: ZERO impact on all ad tracking.**

Conversion chain (traced): Calendly booking → `CalendlyInline.jsx:98` / `DemoForm.jsx:123` → `pushLead("demo_booked", …)` → `gtm.js` dataLayer push → GTM triggers → GA4 / Meta Pixel / Google Ads tags.

| Channel | Keyed on | Impact |
|---|---|---|
| GTM dataLayer | Event name `demo_booked` (frontend constant, unchanged) | ✅ ZERO |
| Meta Pixel | GTM trigger on `demo_booked` | ✅ ZERO |
| Meta CAPI | Does not exist (client-side only architecture, per gtm.js header) | ✅ N/A |
| GA4 / Google Ads conversion (₹300) | Same GTM trigger | ✅ ZERO |
| `ads_mcp.py` / `ad_spend.py` Meta & Google APIs | READ-ONLY spend/performance pulls; no conversion uploads | ✅ ZERO |
| event_id / fbclid cf fields (CR-63/64) | Written at lead creation, not at demo status | ✅ ZERO |

Reasons: (1) no offline conversion uploads exist anywhere in backend; (2) tracking fires at booking time in the browser, upstream of CRM status; (3) GTM container trigger `demo_booked` needs no change since the dataLayer event name is not renamed; (4) funnel/ROAS metrics bucket on internal Mongo enum `crm_status="demo_scheduled"`, which is unchanged.

### 3.5 Tag-dedup safety

`_merge_tags(existing_tags, DEMO_BOOKED_TAG)` adds the new tag without removing the old one if it exists on a contact. Old contacts already tagged `"Demo Scheduled (Web)"` will accumulate both tags on next update. This is standard CRM append behaviour — not a problem, but worth noting.

---

## 4. Exact Changes Required

### Minimal (env-only — 2 lines in `.env`)

```bash
# backend/.env
FRESHSALES_DEMO_BOOKED_TAG=Follow Up for Scheduling
FRESHSALES_STATUS_DEMO_BOOKED_ID=<NEW_ID>
```

No code changes in `freshsales.py`, `server.py`, or `crm_sync.py` — they all read from env.  
Hot-reload picks up the tag change. The status ID loads at startup (supervisor restart needed).

### Optional frontend label update (if Q-A answer is yes)

3 cosmetic string changes across `LeadsView.jsx`, `FunnelPanel.jsx`, `CrossChannelPanel.jsx`.

---

## 5. Files Touched

| File | Change | Required? |
|---|---|---|
| `backend/.env` | 2 env var updates | ✅ Yes |
| `backend/freshsales.py` | None | ❌ Not needed |
| `backend/crm_sync.py` | None | ❌ Not needed |
| `frontend/src/pages/LeadsView.jsx` | Label string update | ⚠️ Only if Q-A = yes |
| `frontend/src/components/funnel/FunnelPanel.jsx` | Label string update | ⚠️ Only if Q-A = yes |
| `frontend/src/components/ads/CrossChannelPanel.jsx` | Label string update | ⚠️ Only if Q-A = yes |

---

## 6. One Remaining Clarification

### Q1 — Freshsales Status ID *(BLOCKER — cannot implement without this)*

What is the `contact_status_id` for **"Follow Up for Scheduling"** in your Freshsales account?

To find it:
> Freshsales → Admin Settings → CRM → Contact Status → hover or click "Follow Up for Scheduling" → copy the ID from the URL or API

If this status does not yet exist in Freshsales, it must be created there first (Admin → CRM → Contact Statuses → + Add).

---

### Q-A — Frontend label change *(non-blocking)*

The internal Leads table and funnel dashboard still shows **"Demo Scheduled"** for all booked leads (the badge in the CRM table). Should this label be updated to **"Follow Up for Scheduling"** in the frontend dashboard too?

> Note: This is purely cosmetic — 3 string changes. MongoDB data key stays `"demo_scheduled"` regardless (no data migration needed).

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Wrong status ID → silently ignored by FS | Low | Medium (sync polls wrong ID) | Verify via POST `/api/demo-booked` with test contact after deploy |
| "Follow Up for Scheduling" status doesn't exist in FS account | Medium | Blocks impl | Create in FS Admin first |
| Old contacts retain `"Demo Scheduled (Web)"` tag | Certain | Negligible | Sales-team communication; tags accumulate, not replace |
| crm_sync stops picking up old `402001963264` status | Certain | None (they stay at current crm_status — not regressed) | Documented above |
| Supervisor restart required for status ID change | Certain | 1–2 min downtime | Schedule off-peak |

---

## 8. Definition of Done

- [ ] `FRESHSALES_STATUS_DEMO_BOOKED_ID` updated in `.env` (new ID confirmed).
- [ ] `FRESHSALES_DEMO_BOOKED_TAG` updated in `.env`.
- [ ] Supervisor restarted (backend picks up new status ID).
- [ ] Test: `POST /api/demo-booked` with a test `freshsales_contact_id` → Freshsales shows tag "Follow Up for Scheduling" + new status.
- [ ] Backend logs: no 400 from the PUT.
- [ ] `crm_sync` next run correctly picks up contacts with new status ID.
- [ ] (If Q-A = yes) Frontend labels updated in 3 files.

---

*CR-65 impact analysis complete 2026-07-21. Status: AWAITING 1 CLARIFICATION (status ID). Agent: E1, Emergent Labs.*
