# CR-52: Server-Observable Browser Pixel Heartbeat

## Date: 2026-07-05
## Status: **REGISTERED — parked (not implemented)**
## Priority: MEDIUM (diagnostics — unblocks future browser-event forensics)
## Reporter: E1 investigation — surfaced during CR-47 / CR-51 browser↔server dedup analysis
## Related: CR-47 (wipe fix), CR-51 (persist event_id), CR-53 (backend CAPI)

---

## Problem Statement

Today the backend has **zero server-side observability of whether the browser actually fired a given `pushLead(...)` call** to GTM / Meta Pixel. When Meta Events Manager shows a browser↔server mismatch (e.g., recent 6 browser / 12 server on 2026-07-05), we cannot determine per-lead whether:

1. The browser attempted the Pixel push at all (i.e., `pushLead` ran), or
2. The push ran but GTM's Meta Pixel tag didn't fire (consent gate, adblock, race), or
3. GTM fired the tag but the network beacon didn't complete (tab close, DNT, network fail).

Without this signal, browser-event drop-off is a black box. We currently attribute the 6/12 gap to a combination of pre-CR-47 wipe (breaks dedup) and consent-mode gating — but that's inference, not measurement.

---

## Proposed Fix

Add a **fire-and-forget telemetry endpoint** on the backend that the frontend calls immediately after every `pushLead(...)` — server-side "I attempted the Pixel push" record.

### Backend (new endpoint, ~20 lines)

`POST /api/telemetry/pixel-fire`

Body:
```json
{
  "event_id":       "<uuid from DemoForm useState>",
  "gtm_event_name": "form_submitted" | "lead_verified" | "book_demo" | "demo_booked",
  "lead_phone":     "<optional — for join>",
  "consent_state":  "<mg_consent value or 'unset'>",
  "user_agent":     "<navigator.userAgent, truncated>",
  "page_url":       "<window.location.href, truncated>",
  "fired_at":       "<ISO timestamp from client>"
}
```

Behavior:
- Insert one document into new collection `pixel_fire_log`.
- Return HTTP 204 immediately (no body).
- Best-effort, non-blocking; do NOT rate-limit or auth (would defeat the purpose).
- TTL index on `pixel_fire_log.fired_at` — auto-expire after 90 days.

### Frontend (2-line addition in `gtm.js`)

In `pushEvent()`, right after `dataLayer.push(...)`, `navigator.sendBeacon()` a JSON blob to `/api/telemetry/pixel-fire`. Uses `sendBeacon` (not `fetch`) so it survives page navigation.

---

## Impact Analysis

### 1. Diagnostic value
- **Per-lead browser-fire proof.** Cross-join `pixel_fire_log` with `demo_requests.event_id` to see exactly which leads' browsers attempted each Pixel call.
- **Consent-state correlation.** Bin browser-fire rate by `consent_state` to prove/disprove the "consent gating" hypothesis.
- **Adblock detection.** If the telemetry ping succeeds but Meta Events Manager shows no browser event for that `event_id`, adblock is the likely cause. If the ping fails silently (sendBeacon returns false), the connectivity is broken to our own domain too.

### 2. Business impact
- Enables faster forensic diagnosis of ad-attribution drops.
- Reduces reliance on Meta Events Manager UI (which lags and doesn't expose per-lead granularity easily).
- Unblocks CR-53 quality checks (server-side CAPI must have a 1:1 counterpart per browser fire).

### 3. Cost / risk
- ~20 backend lines + ~2 frontend lines.
- New Mongo collection with TTL — negligible storage (~100 bytes/row * ~50 leads/day * 4 events = 20 KB/day).
- `sendBeacon` is non-blocking, cannot slow the user experience.
- No PII stored beyond phone (which is already in `demo_requests`); no third-party pings; no consent implications.

### 4. Anti-goals
- **NOT** a replacement for Meta Events Manager — this observes only the client attempt, not Meta's ingestion.
- **NOT** a full analytics platform — one-way write, no query API beyond `db.pixel_fire_log.find(...)`.

---

## Fix Sketch

### `backend/server.py` — new endpoint

```python
class PixelFirePayload(BaseModel):
    event_id: str
    gtm_event_name: str
    lead_phone: str | None = None
    consent_state: str | None = None
    user_agent: str | None = None
    page_url: str | None = None
    fired_at: str | None = None

@api_router.post("/telemetry/pixel-fire", status_code=204)
async def pixel_fire(payload: PixelFirePayload):
    doc = payload.model_dump()
    doc["server_received_at"] = datetime.now(timezone.utc).isoformat()
    try:
        await db.pixel_fire_log.insert_one(doc)
    except Exception:
        pass   # best-effort
    return Response(status_code=204)
```

Add a TTL index at startup: `db.pixel_fire_log.create_index("fired_at", expireAfterSeconds=7776000)` (90 days).

### `frontend/src/lib/gtm.js` — inside `pushEvent()`

```javascript
try {
  const blob = new Blob([JSON.stringify({
    event_id: payload.event_id,
    gtm_event_name: event,
    lead_phone: payload.phone,
    consent_state: localStorage.getItem("mg_consent") || "unset",
    user_agent: navigator.userAgent?.slice(0, 250),
    page_url: window.location.href?.slice(0, 250),
    fired_at: new Date().toISOString(),
  })], { type: "application/json" });
  navigator.sendBeacon("/api/telemetry/pixel-fire", blob);
} catch { /* no-op */ }
```

---

## Verification Plan

1. Submit a fresh demo form → check `db.pixel_fire_log` has a `gtm_event_name="form_submitted"` row.
2. Verify OTP → 2 more rows (`lead_verified` + `book_demo`).
3. Book a Calendly slot → 4th row (`demo_booked`).
4. Confirm the 4 rows share the same `event_id`.
5. Submit with adblock → check that the row still lands (our own domain, not blocked).
6. Submit with consent denied → verify `consent_state="denied"` is recorded.

---

## Not in Scope

- No cross-check with Meta Events Manager (owner-side API access + separate CR).
- No dashboard UI for the collection (grep-first, dashboard later if needed).
- No alerting rules on missed pushes.

---

*CR-52 registered: 2026-07-05. Parked pending owner approval.*
