# CR-45: Freshsales Journey Webhook Not Firing → `crm_stage_events` Empty

## Date: 2026-07-05
## Status: REGISTERED (config change on Freshsales side, not a code bug)
## Priority: MEDIUM (funnel accuracy / real-time automations blocked)
## Reporter: E1 investigation — traced from lead 7990444024 (Mustakbhai)

---

## Problem Statement

The Mongo collection `crm_stage_events` — the audit log of contact stage transitions in Freshsales (New → Demo Booked → Demo Given → Won → Lost) — has **only 3 rows** in the entire production Atlas database, despite the account having **1500+ backfilled leads and 76+ website-submitted demo requests**.

The collection is only written by the endpoint `POST /api/webhooks/freshsales/stage` (`backend/server.py:1434–1460`), which is intended to be triggered by a **Freshsales Journey / workflow automation** every time a contact's sales stage changes.

The evidence indicates the Journey is **either not configured, disabled, or misrouted**, so stage transitions on the Freshsales side are not being propagated to our backend in real time.

---

## Root Cause

Not a code bug — the backend endpoint works and is idempotent. The failure is entirely on the Freshsales configuration side:

Possible reasons (need Freshsales admin inspection):
1. **No Journey/Workflow was ever created** in Freshsales for "contact stage changed → POST webhook".
2. **Journey exists but is disabled** or paused.
3. **Journey exists but the target URL is wrong** — e.g. old preview URL, `/webhook/` (singular) instead of `/webhooks/` (plural), missing `/api/` prefix.
4. **Authentication mismatch** — if a shared secret / signature was configured on the webhook, Freshsales calls could be silently rejected. However the current endpoint code has **no signature verification**, so this is unlikely to be the current failure.
5. **Journey only fires on 3 specific contacts** for a legacy test reason.

---

## Impact

| Area | Impact |
|---|---|
| Funnel dashboard | Stage-progression counts (`crm_status` on `demo_requests`) are only updated by the periodic `source_sync` cron (~every 10 minutes) — not real-time. |
| Attribution reports (CR-24) | Time-to-Won / time-to-Demo metrics based on stage transitions are inaccurate. |
| Real-time automations | Any Slack notification, WhatsApp follow-up, or welcome email hooked to "Demo Given" or "Won" events cannot fire. |
| Data completeness | The stage-transition audit trail is missing — cannot compute historical funnel drop-off accurately. |

Not a lead-data-loss issue — leads themselves are still captured. This affects downstream analytics + automation only.

---

## Fix (Freshsales admin work — no code deploy)

### Step 1 — Verify the webhook endpoint is reachable

```
curl -X POST https://www.mygenie.online/api/webhooks/freshsales/stage \
     -H "Content-Type: application/json" \
     -d '{"contact_id":"12345","email":"test@example.com","phone":"9999999999","stage":"demo_booked","updated_at":"2026-07-05T12:00:00Z"}'
```

Expected response: `{"ok": true}` with HTTP 200. Also verify a new row lands in Mongo `crm_stage_events`.

### Step 2 — Create / repair the Freshsales Journey

In Freshsales admin:
1. **Admin Settings → Journeys** (or "Workflows" in older UI).
2. Create/edit a Journey with:
   - **Trigger:** Contact stage updated (or Contact custom-field updated → for `Lifecycle Stage`).
   - **Filter:** Owner = Website / Source contains "web_" / all — depending on scope needed. Recommended: all website-sourced contacts (tag `Website Demo Lead`).
   - **Action:** HTTP Request (webhook) with:
     - Method: `POST`
     - URL: `https://www.mygenie.online/api/webhooks/freshsales/stage`
     - Body (JSON):
       ```json
       {
         "contact_id": "{{contact.id}}",
         "email":      "{{contact.email}}",
         "phone":      "{{contact.mobile_number}}",
         "stage":      "{{contact.custom_field.cf_stage}}"  // or the field that represents your funnel stage
         ,"updated_at":"{{contact.updated_at}}"
       }
       ```
   - **Stages to include:** at minimum — `demo_booked`, `demo_given`, `won`, `lost` (see `_VALID_STAGES` in `backend/server.py`).
3. **Enable** the Journey.

### Step 3 — Backfill missed stage events (optional)

If you need historical accuracy:
- Use the existing `source_sync` job (already running, backfills `crm_status` from `cf_priority` / `cf_pipeline`) — it's a decent second-best.
- Or run a one-time script: query Freshsales for all contacts with `first_created_at > cutoff`, POST synthetic stage events into `/api/webhooks/freshsales/stage`.

---

## Files affected

No code changes required. Documentation to update after fix:
- `memory/HANDOFF.md` — remove this from open issues.
- `memory/PRD.md` — mark Journey webhook as configured.

---

## Validation plan (post-fix)

1. In Freshsales, move any test contact from stage A → stage B.
2. Wait ~30 seconds.
3. Check backend logs: `grep "Freshsales webhook:" /var/log/supervisor/backend.out.log`.
4. Check Mongo: `db.crm_stage_events.find({contact_id: <that contact id>})` → expect a new row.
5. Check the lead's `crm_status` field in the relevant collection — should now match the new stage.

---

## Related notes / cross-references

- The `source_sync` job that runs every ~10 min (see `crm_sync.py`) already brings status information over from Freshsales as a fallback. This CR is about achieving **real-time** parity, not first-time capture.
- The endpoint at `server.py:1434` returns HTTP 200 even on invalid stages (`_VALID_STAGES` filter at line 1441) to avoid Freshsales retries; that behaviour is fine and should be preserved.
- Consider adding shared-secret validation on the endpoint after this is wired up — currently anyone with the URL could POST fake events.

---

---

## 📊 Impact Analysis

### Current data state (as of 2026-07-05 investigation)

| Metric | Value |
|---|---|
| Total `crm_stage_events` rows in Atlas | **3** (in the entire lifetime of the account) |
| Total contacts in Freshsales (via `backfilled_leads`) | 1500+ |
| Expected `crm_stage_events` if webhook worked (rough est.) | 500+ (one per stage transition per lead per lifecycle) |
| **Delivery rate** | **~0.6%** |

### What breaks because of this

| System | Impact | Severity |
|---|---|---|
| Ads Intelligence dashboard (CR-24) real-time funnel counters | Only reflects data updated via `source_sync` cron (every ~10 min) — no true real-time | Medium — dashboard lags reality by up to 10 min |
| Time-to-Won / time-to-Demo metrics | Inaccurate — stage-transition timestamps come from `source_sync` snapshot time, not actual event time | Medium |
| Slack/WhatsApp notifications on stage change | Never fire | Not currently implemented, but blocks future work |
| Historical funnel drop-off analysis | Cannot be reconstructed | Low — accepted loss |
| CRM data quality | No visible impact on lead data | None |

### What does NOT break

- Lead capture (leads still land in Mongo + Freshsales normally)
- `crm_status` field on `demo_requests` (populated by `source_sync` fallback every 10 min)
- Backfilled_leads collection (source_sync populates it)

---

## 🔧 Implementation Plan (Freshsales admin — no code)

### Step 1 — Verify the endpoint works from outside

Owner should test locally with a curl POST to confirm the endpoint is reachable and idempotent:

```bash
curl -X POST https://www.mygenie.online/api/webhooks/freshsales/stage \
     -H "Content-Type: application/json" \
     -d '{
       "contact_id": "TEST-99999",
       "email": "webhook-test@mygenie.online",
       "phone": "9999999999",
       "stage": "demo_booked",
       "updated_at": "2026-07-05T18:00:00Z"
     }'
```

Expected: HTTP 200 with `{"ok": true, "known_stage": true}` (or similar per `server.py:1434-1460`). If HTTP 404 → check ingress routing. If HTTP 500 → check backend logs.

### Step 2 — Create/repair the Journey in Freshsales

**In Freshsales admin → Marketer → Journeys (or Workflows)** — create a new Journey named "Contact Stage → MyGenie Backend Sync":

- **Trigger:** Contact updated → filter on field change: `Lifecycle stage` OR `Contact status` (whichever your team uses for the funnel).
- **Audience filter (recommended):** Tag contains "Website Demo Lead" OR External ID starts with "web_" — to scope to website leads only.
- **Actions (in order):**
  1. HTTP request:
     - Method: `POST`
     - URL: `https://www.mygenie.online/api/webhooks/freshsales/stage`
     - Headers: `Content-Type: application/json`
     - Body:
       ```json
       {
         "contact_id": "{{contact.id}}",
         "email":      "{{contact.email}}",
         "phone":      "{{contact.mobile_number}}",
         "stage":      "{{contact.custom_field.cf_stage}}",
         "updated_at": "{{contact.updated_at}}"
       }
       ```
       ⚠️ Replace `cf_stage` with your actual funnel-stage field API name.

- **Enable** the Journey and turn on **"Re-enter journey when stage changes"** so subsequent stage changes for the same contact also fire.

### Step 3 — Verify the wiring end-to-end

1. Pick a test contact in Freshsales, change their stage manually (New → Demo Booked).
2. Wait 30 seconds for the Journey to fire.
3. Verify in Mongo:
   ```python
   db.crm_stage_events.find({"contact_id": <test_cid>}).sort([("_id", -1)]).limit(1)
   ```
   Expected: new row with `stage: demo_booked`, `event_time` ≈ now.
4. Verify the lead's `crm_status` field in `demo_requests` (or other) collection reflects the new stage.
5. Check backend logs: `grep "Freshsales webhook:" /var/log/supervisor/backend.out.log` — should show the received event.

### Step 4 — (Optional) Historical backfill

Not urgent since `source_sync` already fills `crm_status` retroactively. If exact stage-transition timestamps matter, a one-off script could POST synthetic events by scanning Freshsales contact history. Deferred.

---

## 🚦 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Journey misconfigured → sends malformed body | Low | 400 responses, no data written; endpoint logs the error | Backend logs; test with Step 1 first |
| Endpoint receives unauthenticated calls | Live already | Anyone with URL could inject fake stages | Add shared-secret HMAC in a future CR (deferred; endpoint is best-effort) |
| Journey fires too often → rate-limits our backend | Low | 429s from ingress | Acceptable — endpoint is fast (single Mongo insert + update) |
| `contact.updated_at` template not populated for some transitions | Low | `event_time` field falls back to `now()` in backend (per `server.py:1441`) | Handled |

---

## 🎯 Success criteria

- `crm_stage_events` grows by 1+ row per stage change per contact.
- `crm_status` on `demo_requests` / `quotes` / `contact_messages` reflects Freshsales-side changes within 30 seconds of the change.
- Backend logs show `Freshsales webhook: contact=X stage=Y` messages.

---

*Impact + implementation section added 2026-07-05.*
