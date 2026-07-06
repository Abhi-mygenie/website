# Session Handover — 2026-02-05

## Session summary
Closed the CR-57 mobile-UX loop that was carried over from the previous fork.

**Shipped this session (preview only — awaiting production push):**
- ✅ **CR-57** — Sector demo anchor shift to inner `<div>` with `scroll-mt-20`
  - Files: `PetpoojaAlternative.jsx`, `SectorPage.jsx`, `SolutionsIndex.jsx`, `ProductIndex.jsx`, `ProductPage.jsx`, `AiPage.jsx`
- ✅ **CR-57b** — `Navbar.jsx` desktop + mobile "Book a Free Demo" CTAs now smart-scroll to nearest local demo anchor instead of forcing `/#demo` route change. Anchor ID list includes home `#demo`.

**Data-fix executed this session (already live in production Freshsales):**
- ✅ **CR-48 backfill · Shubham Rajput** (`8445507759` / FS `402211642191`)
  - Dry-run then live PUT → HTTP 200 → 11 `cf_*` keys restored (1 pre-run → 11 post-run)
  - Audit row `status: "success"` in `crm_backfill_log_cr48` with `existing_cf_before = {cf_rooms: "Yes"}` for rollback
  - Skipped by design: `cf_pos_type` (gclid null), `cf_longitude` (ip null), `cf_contact_person` (event_id never persisted), `cf_pos_used`, `cf_pos_name` (source data null)
  - Note: user restarted services once at end of session ("restart server change env") — new env values active on both backend & frontend

**Not touched (per user instruction "no code edit yet" then "that's all for today"):**
- CR-57c (Footer `/#demo`) — analyzed & queued
- CR-45b, CR-54, CR-52, CR-53 — parked / backlog

## Verification done
Manual mobile screenshots at `390×844` (no testing agent — user forbade it):
- `/petpooja-alternative` → hero CTA lands on form
- `/solutions/restaurants` → hero CTA + Nav mobile CTA both land on form, URL unchanged
- `/` regression → Nav CTA smooth-scrolls to `#demo`, no route change

## Critical context for next agent
1. **User's iron rule:** Do NOT use `testing_agent_v3_fork`. Use screenshot tool + curl only.
   - **EXCEPTION:** If CR-53 (Backend Meta CAPI) gets implemented, the system reminder mandates testing_agent verification. Reconcile with user before violating the "no testing agent" rule.
2. **User's iron rule:** Do NOT edit code without explicit approval. Always present impact analysis + planning first, then ask.
3. **CR-50, CR-57, CR-57b are in preview only.** Production (`mygenie.online`) will still show the old buggy Calendly popup and old anchor behavior until user pushes to GitHub → production. Remind them if relevant.
4. **PetpoojaAlternative uses its own `LandingNavbar`** (logo-only, no CTA). CR-57b Navbar changes don't apply there — the hero CTA (`href="#vsp-demo"`) is the only entry point, and CR-57 anchor shift handles it.
5. Correct route is `/petpooja-alternative`, NOT `/solutions/petpooja-alternative` (wildcard route redirects unknown to `/`).
6. **Backend has NO Meta CAPI code** — do not assume server-side conversion events are ours. They come from external tools (sGTM / CAPI Gateway / Partner integration).
7. **All 4 funnel events in dataLayer share the same `event_id` UUID** — generated at DemoForm mount via `newEventId()` (crypto.randomUUID). This UUID is the dedup key across form_submitted → lead_verifided → thankyou_conversion → demo_booked, AND across browser Pixel ↔ server CAPI. Do NOT regenerate per-event.

## Files changed this session (7)
```
frontend/src/pages/PetpoojaAlternative.jsx   (id moved to form-wrap div)
frontend/src/pages/SectorPage.jsx            (id moved into new wrapper div)
frontend/src/pages/SolutionsIndex.jsx        (same)
frontend/src/pages/ProductIndex.jsx          (same)
frontend/src/pages/ProductPage.jsx           (same)
frontend/src/pages/AiPage.jsx                (same)
frontend/src/components/site/Navbar.jsx      (DEMO_ANCHOR_IDS + handleDemoCtaClick)
memory/PRD.md                                 (completion log)
```

## Next priorities (in order)

### 🔴 P0 — User verification / deployment + pending decision

**Pending user decision (Meta CAPI dedup — see "Open bug" section above):**
- Path A: Fix external server-side integration → no code change from us
- Path B: Implement CR-53 (Backend Meta CAPI mirror) → requires META_PIXEL_ID + META_CAPI_ACCESS_TOKEN + testing_agent verification
- Path C (recommended): Combo — kill external + build CR-53

**Also pending:**
- User to verify CR-57 + CR-57b on preview, then push to production so live users get:
  - CR-50 Calendly popup fix
  - CR-57 mobile anchor fix
  - CR-57b Navbar context-aware CTA

### 🟡 P1 — Queued, planning done
- **CR-57c**: `Footer.jsx` L21 uses `window.location.href = "/#demo"` — hard nav route change from every page. Fix pattern: reuse the same `DEMO_ANCHOR_IDS` array + smart scroll; keep hard-nav as final fallback. ~5 line change. Impact analysis in previous chat + PRD.md.

### 🟡 P1 — Parked by user
- **CR-45b**: Freshmarketer nested webhook payload adapter for `POST /api/webhooks/freshsales/stage`. User said "leave this one".
- **CR-54**: OTP SMS response-body parsing in `otp.py` `_send_sms` — gateway returns HTTP 200 for both success and failure; need to parse `status:"error"` and capture `MessageId`.

### 🟢 P2 — Backlog
- **CR-52**: Browser Meta Pixel heartbeat telemetry
- **CR-53**: Backend Meta CAPI mirror — **NOW LIKELY TO BE PROMOTED TO P0** if user picks Path B or C in the Meta dedup issue above

## Suggested enhancement offered to user (pending response)
Adding per-page attribution capture inside `handleDemoCtaClick` (2 lines) — record `document.location.pathname` at click time into `latest_source` so Freshsales shows whether the conversion came from the sector page or generic Nav. User has not responded yet.

## Ad-hoc data ops performed at end of session
- CR-48 backfill script (`/app/scripts/cr48_backfill_wiped_cf.py`) run with `--contacts 402211642191` for lead `Shubham Rajput / 8445507759`. Live PUT succeeded. Freshsales confirmed 11 populated `cf_*` keys post-run. Full trail in `db.crm_backfill_log_cr48`.
- Services restarted once at the very end via `sudo supervisorctl restart backend frontend` (user reported env change). Both services healthy post-restart.

## 🔴 CRITICAL — Open bug awaiting user decision (Meta Pixel + CAPI dedup)

**User reported** (last part of session): Meta Events Manager is showing `form_submitted` and `Lead` as TWO SEPARATE events instead of one deduplicated `Lead`. Shared screenshot confirms:

| | Browser event | Server event |
|---|---|---|
| `event_name` | **`Lead`** | **`form_submitted`** ← WRONG |
| `event_id` | `9f25cd1a-252f-4699-81ab-6711042a677e` | **MISSING** |
| Source | Browser (Partner integration) | Server (Manual Setup) |
| Action source | website | website |

**Root causes identified:**
1. **event_name mismatch** — server sends the raw dataLayer event name `form_submitted` instead of Meta standard event `Lead`. Dedup is impossible.
2. **event_id missing** on the server-side payload. Even if event_name were fixed, no dedup key present.
3. Server-side payload also missing `fbc/fbp/fbclid` — weaker EMQ score.

**Confirmed via code inspection (read-only):**
- Our frontend `gtm.js` L202 IS pushing `event_id: <UUID>` to dataLayer on `form_submitted` — proven via live browser spy on `window.dataLayer.push`.
- Full payload captured: `event_id`, `external_id`, `phone`, `email`, `fbclid`, `fbc`, `fbp`, `gclid`, etc.
- Our **backend has NO Meta CAPI code**. Grep confirmed: no `graph.facebook.com/events` POST anywhere. So the server-side `form_submitted` visible in Events Manager originates from an **external source** (GTM sGTM / Meta CAPI Gateway / Zapier / Partner integration).

**Two paths presented to user, awaiting decision:**
- **Path A**: Owner fixes the external server-side integration (rename event to `Lead`, add `event_id`). No code change from us.
- **Path B**: Implement **CR-53 (Backend Meta CAPI mirror)** in `backend/server.py` `POST /api/demo-request`. Requires `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, optional `META_TEST_EVENT_CODE`. Testing agent verification mandatory (per system reminder).
- **Path C (combo, my recommendation)**: Kill current external server-side + implement CR-53 for single source of truth.

**Full analysis captured in this session's chat above.** Next agent should NOT re-investigate — pick up from the user's answer to the 2 questions asked at the end.

## Suggested enhancement offered to user (pending response)
Adding per-page attribution capture inside `handleDemoCtaClick` (2 lines) — record `document.location.pathname` at click time into `latest_source` so Freshsales shows whether the conversion came from the sector page or generic Nav. User has not responded yet.

## Environment status
- Backend/frontend running via supervisor, healthy
- MongoDB local, `stack-runner-4.preview.emergentagent.com` is the preview URL
- No secrets modified this session
- No dependencies added

## Key debug references
- Anchor IDs registry: `Navbar.jsx` `DEMO_ANCHOR_IDS` const
- Homepage anchor: `CtaDemo.jsx` L54 (`id="demo"` on div — already correct, unchanged)
- Petpooja custom Navbar: `PetpoojaAlternative.jsx` L17 `LandingNavbar`
