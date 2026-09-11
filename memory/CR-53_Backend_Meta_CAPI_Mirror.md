# CR-53: Backend-Driven Meta CAPI Mirror

## Date: 2026-07-05
## Status: **REGISTERED — parked (not implemented). Requires owner-provided credentials + integration playbook consultation.**
## Priority: HIGH (removes last dependency on external CAPI pipelines; guarantees 1:1 browser/server dedup)
## Reporter: E1 investigation — surfaced by CR-47 wipe + CR-51 event_id persistence
## Related: CR-47 (wipe fix), CR-51 (persist event_id), CR-52 (browser heartbeat)

---

## Problem Statement

The 12/6 browser-vs-server Meta event mismatch on 2026-07-05 revealed we do not own our server-side CAPI pipeline. The 12 server events are being produced by **something else** — most likely one of:
- Meta CAPI Gateway (Meta-hosted proxy of Pixel events)
- A GTM Server-Side container (stape.io / Google Cloud Run)
- A third-party middleware (Zapier / FS-native Meta connector / WATI)

Whatever the source, it:
- Cannot use the `event_id` we generated in the browser unless it can read that ID from a store we control (currently the only store was `FS.cf_contact_person`, which was wiped by CR-47's bug pre-fix).
- Fires on stages our code does not directly control (probably lifecycle-stage transitions in Freshsales).
- Is not observable from our backend logs (we don't send it, we just see the aftermath in Meta Events Manager).

This CR proposes replacing that mystery pipeline with a **first-party Meta CAPI mirror**: our backend calls Meta's Conversions API directly with the exact same `event_id` the browser uses, guaranteeing dedup and full observability.

---

## Proposed Fix

Introduce a `backend/meta_capi.py` module that mirrors every meaningful lead event to Meta's Conversions API. Called from the existing code sites — no new event triggers needed.

### CAPI mirror points

| Funnel stage | Backend hook | Meta event | Data source |
|---|---|---|---|
| Form submit → 200 | Inside `create_demo_request` (server.py:354, right after `insert_one`) | `Lead` | `demo_requests.event_id` (now durable — CR-51), attribution dict, phone/email hashed |
| OTP verified | Inside `/api/lead/otp-confirm` handler | `Lead` (with `custom_data.stage="otp_verified"`) | Same event_id from `demo_requests` |
| Calendly booked | Inside `/api/demo-booked` handler | `Schedule` | Same event_id |

Each call sends:
- `event_id` — the SAME UUID the browser Pixel used → Meta dedups ✅
- `event_source_url` — the page URL from `attribution`
- `event_time` — Unix timestamp
- Hashed user data: SHA-256 of email, phone, first name, last name, city, country
- Attribution: `fbc`, `fbp`, `fbclid` (unhashed, passed as `user_data.fbc`, `user_data.fbp`)
- Custom data: `value`, `currency`, `content_name` if relevant

---

## Impact Analysis

### 1. Business impact — HIGH
- **Deduplicated attribution.** Every browser Pixel event has a matching server CAPI event with the same event_id → Meta's Aggregated Event Measurement gets clean signal → better campaign optimization.
- **Complete coverage.** Server events fire even when browser Pixel fails (adblock, consent denied, tab close race).
- **Independence from FS.** If Freshsales fields ever get wiped again, CAPI still fires from Mongo.
- **Independence from third parties.** If Meta CAPI Gateway or GTM SS goes down or we drop those subscriptions, CAPI continues.

### 2. Data quality impact
- Restores full 1:1 browser/server dedup for all leads captured **after** CR-51 ships (i.e., after 2026-07-05 evening).
- Pre-CR-51 leads (no persisted event_id) get CAPI events with a fallback dedup key (`event_id = f"lead_{mongo_id}"`) — still helps aggregate reporting even without perfect Pixel match.

### 3. Cost & complexity
- **~120 lines** in new `backend/meta_capi.py` (event builder, hashing helpers, retry queue).
- **~15 lines** added across `server.py` at 3 call sites.
- **1 new module** + optional retry queue if we want at-least-once delivery (Redis-less: use a Mongo `capi_outbox` collection + a background task).
- No frontend changes.
- No env changes IF owner uses same META_PIXEL_ID/META_ACCESS_TOKEN they already have; new env keys otherwise (see below).

### 4. Requires (before implementation)
- `META_ACCESS_TOKEN` — long-lived access token generated in Meta Business Manager → System Users → CAPI access.
- `META_PIXEL_ID` — same one currently used by the browser Pixel.
- `META_TEST_EVENT_CODE` — optional, for Test Events tab validation before going live.
- Consult **`integration_playbook_expert_v2`** for exact SDK / raw HTTP recommendation, Graph API version (v21+ as of 2026), and retry-behavior recommendations.

### 5. Risk
| Risk | Mitigation |
|---|---|
| CAPI call blocks `POST /api/demo-request` if Meta is slow | Fire-and-forget via `asyncio.create_task` — never awaited in the request path |
| Meta rate limits / 429s | Best-effort with exponential backoff; drop after 3 retries; log to `capi_error_log` |
| Duplicate events on retry | Idempotent by `event_id` — Meta dedups within a 7-day window |
| PII leak in logs | Log only event_id + status code; never the hashed PII payload |
| Regression: someone starts double-firing browser + server | Not applicable — same event_id guarantees dedup |
| Retire of the current server-side pipeline breaks something else | Diagnose first (via CR-52 heartbeat) → confirm the 12 server events source → coordinate cutover |

### 6. What this does NOT solve
- **cf_contact_person for pre-CR-51 legacy leads** — cannot be recovered (browser UUIDs lost)
- **Journey 89533 double-tag bug** — separate issue (owner-side FS admin)
- **Google Ads conversion tracking** — a similar CR-XX would mirror to Google Ads Enhanced Conversions API server-side

---

## Fix Design (skeleton — details on implementation)

### New file `backend/meta_capi.py`

```python
"""Meta Conversions API mirror. Ships every meaningful lead event server-side
with the same event_id the browser Pixel uses → clean 1:1 dedup on Meta side."""

import asyncio, hashlib, os, time
from datetime import datetime, timezone
import httpx

META_PIXEL_ID    = os.environ.get("META_PIXEL_ID")
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN")
META_TEST_CODE   = os.environ.get("META_TEST_EVENT_CODE")   # optional
GRAPH_URL        = f"https://graph.facebook.com/v21.0/{META_PIXEL_ID}/events"

def _sha256(v: str | None) -> str | None:
    return hashlib.sha256(v.strip().lower().encode()).hexdigest() if v else None

async def send_lead_event(*, event_name, event_id, user_data, custom_data,
                          event_source_url, action_source="website", event_time=None):
    if not META_PIXEL_ID or not META_ACCESS_TOKEN:
        return
    body = {
        "data": [{
            "event_name": event_name,
            "event_time": int((event_time or datetime.now(timezone.utc)).timestamp()),
            "event_id": event_id,
            "action_source": action_source,
            "event_source_url": event_source_url,
            "user_data": {k: v for k, v in {
                "em":  _sha256(user_data.get("email")),
                "ph":  _sha256(user_data.get("phone")),
                "fn":  _sha256(user_data.get("first_name")),
                "ln":  _sha256(user_data.get("last_name")),
                "ct":  _sha256(user_data.get("city")),
                "country": _sha256(user_data.get("country")),
                "fbp": user_data.get("fbp"),
                "fbc": user_data.get("fbc"),
                "client_ip_address": user_data.get("ip"),
                "client_user_agent": user_data.get("user_agent"),
            }.items() if v},
            "custom_data": custom_data or {},
        }],
        "access_token": META_ACCESS_TOKEN,
    }
    if META_TEST_CODE:
        body["test_event_code"] = META_TEST_CODE
    try:
        async with httpx.AsyncClient(timeout=8.0) as c:
            r = await c.post(GRAPH_URL, json=body)
            if r.status_code >= 400:
                logger.warning("Meta CAPI %s error: %s", event_name, r.text[:300])
    except Exception as e:
        logger.warning("Meta CAPI %s exception: %s", event_name, e)
```

### `backend/server.py` — mirror at 3 sites

```python
# Site 1 — create_demo_request (after insert_one, ~line 354)
asyncio.create_task(meta_capi.send_lead_event(
    event_name="Lead",
    event_id=payload.event_id or f"lead_{obj.id}",
    user_data={"email": obj.email, "phone": obj.phone, "first_name": obj.name,
               "city": obj.city, "country": geo_data.get("country"),
               "fbp": (payload.attribution or {}).get("fbp"),
               "fbc": (payload.attribution or {}).get("fbc"),
               "ip": ip, "user_agent": ua},
    custom_data={"content_name": "demo_request", "stage": "form_submitted"},
    event_source_url=(payload.attribution or {}).get("landing_page"),
))

# Site 2 — /api/lead/otp-confirm (after verified=True)
# Site 3 — /api/demo-booked (Schedule event)
```

---

## Verification Plan

1. Set env: `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `META_TEST_EVENT_CODE`.
2. Submit demo form → Meta Events Manager → **Test Events** tab → find `Lead` event with matching `event_id`.
3. Verify OTP → second `Lead` event, same `event_id`.
4. Book Calendly → `Schedule` event, same `event_id`.
5. Confirm Meta shows `Deduplicated: Yes` badge on each.
6. Turn off `META_TEST_EVENT_CODE`, run live for a day.
7. Meta Events Manager overview → verify browser vs server counts converge to ~1:1 ratio.

---

## Dependencies

- **CR-51** — required. Without persisted `event_id`, server cannot use the browser's UUID.
- Owner-provided **META_ACCESS_TOKEN** (System User token with `ads_management` + `business_management` scopes).
- **`integration_playbook_expert_v2` consultation** before writing meta_capi.py — this is a third-party integration and must go through the playbook expert for exact SDK / API version / auth flow.

---

## Not in Scope

- Retiring the existing 12-event server pipeline. That decision comes AFTER CR-53 verifies our own CAPI works reliably — parallel-run for 1-2 weeks first.
- CAPI for Google Ads Enhanced Conversions (separate CR).
- CAPI for Contact form / Quote form leads (separate mini-CRs; same pattern).

---

*CR-53 registered: 2026-07-05. Parked pending owner approval + credentials + integration playbook consultation.*
