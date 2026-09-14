# CR-51: Persist `event_id` in `demo_requests` Mongo document

## Date: 2026-07-05
## Status: **REGISTERED — awaiting owner approval to implement**
## Priority: **HIGH** — restores durable browser↔server dedup after CR-47 exposed the previous single-store weakness
## Reporter: Owner (Meta Events Manager showed 12 server vs 6 browser events; forensic analysis in CR-47 + CR-50 investigation traced part of the gap to `event_id` being wiped from FS)
## Related:
- CR-47 (fixed the wipe that first surfaced this weakness)
- CR-50 (Calendly popup fix — separately restored the `demo_booked` browser event)
- Adjacent to Meta CAPI / Pixel dedup pipeline

---

## Problem Statement

The browser generates a per-lead UUID `event_id` in `DemoForm.jsx › useState(() => newEventId())`. That same UUID is passed to:

1. **Every `pushLead(…)` call** for this lead (`form_submitted`, `lead_verifided`, `thankyou_conversion`, `demo_booked`) — GTM/Meta Pixel emits it as the `eventID` on each Pixel `track` call.
2. **`POST /api/demo-request` payload** as the `event_id` field.

The backend accepts the UUID (`DemoRequestCreate.event_id`, `server.py:74`) and writes it **only** to Freshsales as `cf_contact_person` (`server.py:345`) — falling back to nothing if empty. **The UUID is never written to Mongo `demo_requests`.**

### Consequence

Meta browser↔server event deduplication requires the same `event_id` on both sides. Any downstream server-side CAPI mirror (GTM SS container, CAPI Gateway, FS Journey webhook, Zapier, etc.) that needs to send the SAME `event_id` at OTP-verify / Calendly-booked stages **must source it from Freshsales** because that's the only place it's stored.

That coupling proved fragile:

- The CR-47 bug wiped every `cf_*` on OTP-verify — including `cf_contact_person`. Any server-side CAPI that fired AT or AFTER OTP-verify had no `event_id` to send → Meta could not deduplicate → server events counted separately from browser events.
- Even now that CR-47 is fixed, `cf_contact_person` is still a **single point of failure**: FS soft-delete-then-restore resets `cf_*`; manual FS edits could clear it; a future FS API change could regress the merge.
- The 3 legacy leads (Aryen, Luhit, Mustakbhai) will never have their original `event_id` restored — the UUID is gone forever because we never persisted it outside FS.

Persisting `event_id` in Mongo `demo_requests` at insert time gives us a **durable server-side copy** that survives any FS mutation, and unlocks safer downstream architectures (backend can send its own CAPI keyed by the Mongo record).

---

## Impact Analysis

### 1. Business impact
- **Dedup accuracy** — future Meta Events Manager reports show accurate browser vs server matched counts. Restores confidence in ad-spend attribution.
- **Enables safer server-side CAPI** — we can move CAPI firing from a fragile FS-driven flow to a Mongo-driven flow, which is under our full control and never wiped.
- **Cost of NOT doing this** — every future FS platform change that touches `custom_field` (mergers, soft-delete restores, admin-triggered field clears) risks re-losing the dedup key. Compounding integration risk.

### 2. Data / attribution impact
- New field `event_id` (string, UUID v4) added to `demo_requests` documents.
- **Backfill impossible for existing docs** — the browser UUIDs for pre-existing leads were never captured in Mongo and are lost. `event_id` will be present only for leads captured after this CR ships.
- No schema migration needed — Mongo is schema-less; existing docs simply lack the field. All read code paths use `.get("event_id")` with `None` fallback.
- Downstream consumers that today read `cf_contact_person` from FS can be updated to prefer Mongo `event_id` when available.

### 3. Integration impact
- **Meta CAPI (browser + any server mirror)** — better dedup, no behavior change unless server mirror is updated to source from Mongo.
- **Freshsales** — no change. `cf_contact_person` still written from `payload.event_id` as it is today.
- **GTM / Pixel (browser)** — no change.
- **Google Ads, Calendly, WATI, Twilio SMS, other integrations** — no interaction with this field, no change.

### 4. Code / architecture impact
- ~3 lines in `backend/server.py`: extend `DemoRequest` model with `event_id: str | None` OR append `doc["event_id"] = payload.event_id` before `insert_one`.
- 0 lines frontend.
- 0 env changes, 0 dependency changes.
- Reversible in a single commit.

### 5. Privacy / compliance impact
- `event_id` is a random UUID with no personal information. Zero PII.
- No new consent implication (this is a technical identifier, not tracking cookie).
- No regulatory review needed.

### 6. Risk
| Risk | Mitigation |
|---|---|
| Duplicate/conflicting `event_id` on multi-form Multi-Form same-phone submissions | Each `DemoForm` mount generates a fresh UUID; multi-submissions get distinct IDs (matches current FS behavior — `cf_contact_person` was already being overwritten). Preserving both requires a separate CR. |
| Storage bloat | Negligible — UUID is 36 chars, adds ~0.05 KB per doc. Existing docs unchanged. |
| Existing readers assuming absent field | All reads use `.get()` — safe. |
| Downstream CAPI mirror changes needed | Not required. This CR just makes the field available. A follow-up CR would migrate the CAPI mirror to source from Mongo. |

---

## Fix Design

### Backend (`backend/server.py › create_demo_request`)

```diff
     doc = obj.model_dump()
     doc['created_at'] = doc['created_at'].isoformat()
     doc['otp_verified'] = otp_verified
     doc['attribution'] = payload.attribution
+    # CR-51: persist the browser-generated event_id as a durable dedup key.
+    # Historically we stored this only in Freshsales.cf_contact_person, which
+    # proved wipeable (see CR-47). Mongo is our source of truth.
+    if payload.event_id:
+        doc['event_id'] = payload.event_id
     doc['geo'] = geo_data
     await db.demo_requests.insert_one(doc)
```

Optional companion (defensive): mirror on the `DemoRequest` output model so API responses can echo it back to the browser if we ever want confirm-your-event_id UX.

### DB / migration
None. Mongo is schema-less. Existing docs without `event_id` remain valid; new inserts include it.

### Downstream consumers (informational — not part of this CR)
- Server-side CAPI mirror (wherever configured) SHOULD switch to sourcing `event_id` from Mongo `demo_requests` (primary) with FS `cf_contact_person` as fallback. Register as CR-53 if you want us to build our own CAPI firing from the backend.

---

## Verification checklist

- [ ] `POST /api/demo-request` with `event_id: "test-uuid"` in payload → new Mongo doc contains `event_id: "test-uuid"`.
- [ ] `POST /api/demo-request` without `event_id` → new Mongo doc has no `event_id` field (or `None`), does not crash.
- [ ] Existing docs (created before this CR) remain readable, no schema errors on the `/api/cms/leads` endpoint (main consumer).
- [ ] `cf_contact_person` in Freshsales still populated as before (unchanged behavior).
- [ ] Playwright smoke: submit demo form → inspect Mongo → confirm `event_id` matches the UUID in the network request payload.

---

## Rollback

Single-line revert. No downstream cleanup — existing docs with `event_id` are inert if the field is unread.

---

## Not in scope (candidates for future CRs)

- **Backend-driven Meta CAPI mirror** — CR-53 (would source `event_id` from Mongo, eliminates all FS dependency). Estimated ~120 lines + owner-provided CAPI access token.
- **Multi-Form same-phone `event_id` preservation** — currently overwritten; a future CR could track them as an array.
- **Consent-state capture** at submit — record `mg_consent` at insert time for consent-audit + correlation with browser-event success rate.

---

*CR-51 registered: 2026-07-05. Agent: E1, Emergent Labs.*
