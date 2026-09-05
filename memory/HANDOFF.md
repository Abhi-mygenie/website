# Session Handover — 2026-07-05 (evening IST)

**Prev handoff:** archived context — first session set up the pod from the fresh `Abhi-mygenie/website` clone, restored OTP SMS `verify=False`, fixed .env quote issue. That session's issues are resolved.
**This session:** Deep-dive investigation into Freshsales attribution data loss, Meta CAPI event loss suspicion, and OTP-tag anomalies. **NO code was written this session.** Everything is documented in `/app/memory/CR-*.md` awaiting owner approval to implement.

---

## 🚦 Where we are

The pod is healthy: backend + frontend + mongo running under supervisor. `.env` points to production Atlas Mongo (`mygenie.xdqqdpi.mongodb.net/test_database`). All services reachable at `https://0939fd83-5e58-41f8-a658-2091510ab2e7.preview.emergentagent.com`.

**No breakage, no active outage.** Investigation-only session. Five CRs registered.

---

## 🎯 The bug story this session uncovered (one paragraph summary)

Owner reported that Meta was not seeing "Book demo" events for recent Facebook-ad-sourced leads (Mustakbhai 7990444024 was the trigger case). Investigation revealed **two independent, unrelated problems** that happened to affect the same lead:

1. **Freshsales cf_* wipe** — since ~2026-07-04, every OTP-verified website lead loses all attribution custom fields (fbclid, IP, browser, ad set, event_id, fbp, etc.) in Freshsales, keeping only `cf_rooms=Yes`. Root cause: `swap_otp_tag()` and `mark_demo_booked()` in `backend/freshsales.py` send `PUT /contacts/{id}` with a single-key `custom_field` object, and Freshsales' PUT semantics treat that as a full-object replacement. Additionally, some individual contacts (e.g. Mustakbhai specifically) got DELETE+RESTORE'd in Freshsales UI which also resets custom_field. → **CR-47** (code fix) + **CR-48** (backfill).

2. **Meta events under-delivery (unrelated to #1)** — for OTP-verified leads coming via the Instagram in-app browser (referrer `instagram.com` + placement `Instagram_Reels/Feed`), the browser-side GTM Web → GTM Server → Meta CAPI hop fails, so Meta never sees `Book demo`. GTM setup itself is proven-working (Test Events landed cleanly with browser + server + dedup). Not registered as a CR yet — owner deemed it "assume late reporting" for now.

Alongside those, the Freshsales schema audit found: `cf_demo_fixed` is still a Yes/No dropdown (not text) so fbc cookies are silently rejected; `cf_self_delivery_take_away` doesn't exist so ad_id is silently rejected; native `last_*` and `latest_*` fields carry duplicate data 84% of the time. Owner's decisions: repurpose native `latest_source` for fbc and native `work_number` for ad_id, rename UI labels in Freshsales admin. → **CR-44** (final decisions locked) + **CR-49** (redundancy cleanup, bundled).

---

## 📋 CRs registered this session — all in `/app/memory/`

| CR | File | Priority | What it does | Depends on |
|---|---|---|---|---|
| **CR-44** | `CR-44_FBC_AdID_Data_Loss.md` | HIGH | Remap fbc → `latest_source`, ad_id → `work_number` (native FS fields). Rename UI labels. Update `crm_sync.py` reads. | Bundle with CR-47/49 |
| **CR-45** | `CR-45_Freshsales_Journey_Webhook.md` | MEDIUM | Wire Freshsales Journey → POST `/api/webhooks/freshsales/stage` for real-time stage sync (only 3 events in DB, ~0.6% delivery). Freshsales admin work, no code. | — |
| **CR-47** | `CR-47_Freshsales_CustomField_Merge_Fix.md` | **CRITICAL** | Fetch existing cf before PUT, merge, then send full object. Fixes `swap_otp_tag`, `mark_demo_booked`, `upsert_contact` 400-retry. | — |
| **CR-48** | `CR-48_Backfill_Wiped_CustomField.md` | HIGH | One-time script `scripts/cr48_backfill_wiped_cf.py` to restore 3 wiped leads (Aryen, Luhit, Mustakbhai) using Mongo attribution as source. | CR-47 must ship FIRST |
| **CR-49** | `CR-49_Attribution_Field_Redundancy.md` | LOW-MEDIUM | Stop writing `latest_medium` and `latest_campaign` (they duplicate `last_*`). Frees `latest_source` for fbc per CR-44. | Bundle with CR-44/47 |

Every CR document includes: Problem Statement · Root Cause · Impact Analysis · Implementation Plan (with exact code diffs) · Files Affected · Testing Plan · Risks · Rollback · Success Criteria. Read them cover-to-cover before implementing anything.

### CRs NOT registered but investigated (context for future work)

- **Luhit 9665339697 has both `OTP-Verified` and `OTP-Unverified` tags** — rare (1 of 100 sampled), caused by Freshsales Journey `id 89533` re-adding the Unverified tag after our `swap_otp_tag` cleared it. Owner deferred CR — inspect Journey config.
- **Meta CAPI under-delivery for IG-in-app leads** — hypothesis only, cannot verify via Meta API. Owner assumes late reporting.
- **`event_id` not persisted in Mongo `demo_requests`** — `DemoRequest` Pydantic model at `server.py:81` doesn't declare `event_id` and `extra="ignore"` drops it. Value reaches Freshsales `cf_contact_person` but Mongo copy is None. Small fix (1-line model change) — mentioned in CR-47 §Related, not its own CR.
- **`ad_spend` collection is stale** (last sync 2026-07-02 07:22 UTC, missing `date` and `book_demo_count` fields) — Meta sync job likely broken. Not registered yet.

---

## 🎯 Recommended deploy order (single bundle for CR-44 + CR-47 + CR-49)

All three change the same functions/files. Ship together.

### Step 1 — Owner-side (parallel, any time)
- [ ] Freshsales admin → rename `latest_source` UI label to **"fbc"**
- [ ] Freshsales admin → rename `work_number` UI label to **"Ad ID"**
- [ ] (Separately) Wire the Journey webhook per CR-45

### Step 2 — Code fix (single commit)
Files to modify:
- `backend/freshsales.py` — introduce `_get_contact()` helper, fix `swap_otp_tag`, `mark_demo_booked`, `upsert_contact` 400-retry, `_create_contact` 400-retry logging
- `backend/server.py` — update `_attribution_to_crm()` (fbc → `latest_source`, ad_id → `work_number`, remove `latest_medium`/`latest_campaign` writes, remove `cf_demo_fixed` / `cf_self_delivery_take_away` writes)
- `backend/crm_sync.py` — line 102, 632 read from `contact.get("work_number")` instead of `cf.get("cf_self_delivery_take_away")`; read fbc from `contact.get("latest_source")` instead of `cf.get("cf_demo_fixed")`

Exact diffs are in CR-47 §"Fix" (Diffs #1–#5), CR-44 §"Implementation Plan → Code changes", and CR-49 §"Resolution".

### Step 3 — Post-deploy verification
- Submit fresh test demo lead via `mygenie.online` with Facebook UTM in URL. Follow CR-47 §"Validation plan" — must see all cf_* survive OTP verify.
- Backfill 3 wiped leads via `python scripts/cr48_backfill_wiped_cf.py --dry-run` then live. Log in `crm_backfill_log_cr48`.

### Step 4 — Bonus (small, do together)
Add `event_id: str | None = None` to `class DemoRequest` in `server.py:81`. 1-line change. Enables future audits.

---

## ⚠️ Critical rules that got confirmed this session

1. **`MONGO_URL` in `backend/.env`** — user manually edits this on env switches. If it disappears, backend crashes with `KeyError: 'MONGO_URL'`. Do NOT auto-append fallback lines; if user's .env is missing keys, ask them.
2. **Never remove `verify=False`** from `otp.py:117` and `payments.py:900` — SMS provider uses IP with self-signed cert.
3. **Freshsales PUT `custom_field` is REPLACE, not merge.** Whenever writing to it, fetch existing first then merge. Same likely true for `tags` array (Luhit case).
4. **Freshsales RESTORE from soft-delete resets custom_field.** Not our bug, but expect it.
5. **CR-48 backfill MUST run after CR-47.** Otherwise the restored cf_* gets wiped again by the next swap_otp_tag call.

---

## 🗺️ Investigation trail (in case next agent needs to reproduce)

Key files touched during investigation (READ ONLY):
- `backend/server.py:81` — `DemoRequest` model (event_id drop)
- `backend/server.py:203-289` — `_attribution_to_crm()` (attribution mapping)
- `backend/server.py:292-343` — `create_demo_request()` (demo submit flow)
- `backend/server.py:384-406` — `/lead/otp-confirm` (calls swap_otp_tag)
- `backend/server.py:1434-1460` — Freshsales stage webhook (CR-45 endpoint)
- `backend/freshsales.py:129-146` — `_create_contact` 400-retry (drops cf)
- `backend/freshsales.py:149-260` — `upsert_contact` (new + existing branches)
- `backend/freshsales.py:287-308` — `swap_otp_tag` (the main wipe culprit)
- `backend/freshsales.py:311-361` — `mark_demo_booked` (secondary wipe culprit)
- `frontend/src/components/site/DemoForm.jsx:137-153, 284-287` — form submit + pushLead calls
- `frontend/src/components/site/OtpVerifyBlock.jsx:61-82` — OTP verify chain
- `frontend/src/lib/gtm.js:140-259` — pushLead / dataLayer / event_id

Test leads used as reference (production Mongo `test_database`):
- **Aryen** 9696965595 (FS 402211514598) — 2026-07-04, IG in-app, wiped by swap_otp_tag
- **Mustakbhai** 7990444024 (FS 402211617324) — 2026-07-05, IG in-app, wiped by DELETE+RESTORE (17:03/17:09 IST)
- **Luhit** 9665339697 (FS 402211624215) — 2026-07-05, IG in-app, wiped by swap_otp_tag, also has double-OTP-tag anomaly
- **parth_test** 7602832329 (FS 402211627155) — 2026-07-05 test, multi-form, cf_* survived because 2nd submission re-populated it via upsert_contact PUT
- **Tarun** 8860777328 (FS 402211574986) — OTP-Unverified control, all cf_* intact (never triggered swap_otp_tag)

---

## 🧰 Environment snapshot

- `/app/backend/.env` → `MONGO_URL=mongodb+srv://...mygenie.xdqqdpi.mongodb.net/mygenie`, `DB_NAME=test_database` (production Atlas)
- `/app/frontend/.env` → `REACT_APP_BACKEND_URL=https://0939fd83-5e58-41f8-a658-2091510ab2e7.preview.emergentagent.com`, `REACT_APP_BUY_ONLINE_ENABLED=false` (CR-46 hides Buy Online)
- Freshsales base URL: `https://mygenie-org.myfreshworks.com/crm/sales/api`; API key in backend/.env
- Backend framework: FastAPI. Frontend: React + Vite/CRA (yarn). MongoDB: Atlas.
- All routes under `/api` (per ingress convention).
- Universal admin owner in FS: Mayur Suryavanshi (id 402000380084) — every new contact auto-owned by him.

---

## 📎 Ancillary docs updated / created this session

- `/app/memory/CR-44_FBC_AdID_Data_Loss.md` — final resolution + impact + implementation
- `/app/memory/CR-45_Freshsales_Journey_Webhook.md` — impact + Journey runbook
- `/app/memory/CR-47_Freshsales_CustomField_Merge_Fix.md` — root cause + code diffs + backfill hook
- `/app/memory/CR-48_Backfill_Wiped_CustomField.md` — script skeleton + runbook + audit log design
- `/app/memory/CR-49_Attribution_Field_Redundancy.md` — redundancy analysis + trade-offs
- `/app/memory/HANDOFF.md` — this file
- `/app/memory/PRD.md` — NOT updated this session (no code shipped); update once bundle deploys
- `/app/memory/test_credentials.md` — NOT modified (no auth changes)

---

## ▶️ First things the next agent should do

1. **Confirm with owner** — "You approved fbc → `latest_source`, ad_id → `work_number`, and the CR-47 merge fix. Ready to implement in one bundle?" (Get an explicit YES before touching code.)
2. **Verify prerequisites in Freshsales** — confirm owner has renamed the UI labels (or is OK doing it alongside the deploy).
3. **Implement the bundle** — follow the exact diffs in CR-47 §Fix, CR-44 §Implementation Plan, CR-49 §Resolution. Total ~45 lines net across 3 files.
4. **Lint + supervisor restart** — `sudo supervisorctl restart backend`.
5. **Smoke test** — submit one fresh demo through the preview URL, verify Freshsales contact via curl.
6. **Run CR-48 backfill** — dry-run first, then live. Audit `crm_backfill_log_cr48`.
7. **Update PRD.md** — mark CR-44/47/48/49 as shipped with dates.
8. **Confirm test_credentials.md** is not empty; add any new test accounts if the deploy required them.
9. **Update this HANDOFF.md** — append what shipped, what remains.

---

## 🔮 Deferred / backlog (for later sessions)

- **CR-45 wiring** — depends on owner having Freshsales admin access
- **CR-49 marketing signoff** — sales team may object to `latest_medium`/`latest_campaign` going empty
- **Persist `event_id` in Mongo** — 1-line CR (worth doing alongside CR-47 for free)
- **Meta ad_spend sync fix** — separate investigation, blocks CR-24 dashboard freshness
- **Luhit's double-OTP-tag** — inspect Freshsales Journey `id 89533` for Add-Tag action
- **Backend server-side CAPI fallback** — resilience layer for IG-in-app browser losses (owner deferred, "not touching working setup")

---

*Handover written 2026-07-05 by E1 (Emergent Labs). Next agent: read the 5 CRs in `/app/memory/CR-4*.md` before touching anything.*
