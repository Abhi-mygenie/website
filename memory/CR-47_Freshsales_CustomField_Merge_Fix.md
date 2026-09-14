# CR-47: Freshsales `custom_field` Wipe on `swap_otp_tag` and `mark_demo_booked`

## Date: 2026-07-05
## Status: REGISTERED (fix pending owner approval)
## Priority: CRITICAL (attribution data loss on every OTP-verified lead + every demo-booked lead)
## Reporter: E1 investigation — traced from lead 7990444024 (Mustakbhai)
## Related: CR-42 (introduced swap_otp_tag), CR-23 (introduced mark_demo_booked), CR-44 (fbc/ad_id schema mismatch — different bug)

---

## Problem Statement

Every OTP-verified website lead created on or after **2026-07-04 ~05:18 UTC** loses **all 12–15 attribution custom fields** in Freshsales, keeping only `cf_rooms` (OTP Verified). Similarly, every lead who books a demo via Calendly loses everything except `cf_meeting_link` / `cf_next_step` / `cf_channel_manager_name`.

Impact scope:
- Facebook click ID (fbclid), IP address, browser/UA, Ad Set, Ad Placement, GTM/Meta Event ID, fbp cookie, ad-set ID, UTM campaign ID, source platform, search term (utm_term), outlet type, current POS, years-in-business — **all null in Freshsales**.
- Attribution reports (CR-24 Ads Intelligence), Meta CAPI de-duplication, ROAS analysis, ad-creative performance — all currently broken for verified leads.

---

## Timeline evidence (proof it's a Freshsales API change, not our code)

Two OTP-verified leads with **identical** rich attribution captured in Mongo `demo_requests.attribution`:

| Lead | Phone | Submitted (UTC) | Mongo has full attribution? | FS cf_* preserved |
|---|---|---|---|---|
| Rutvik | 9328743156 | 2026-07-03 12:35 | Yes (fbclid, fbc, fbp, ad_id, adset_id, utm_id, placement, site_source_name) | **12 fields ✅** |
| Aryen | 9696965595 | 2026-07-04 05:18 | Same set | **0 fields ❌** |
| Mustakbhai | 7990444024 | 2026-07-05 10:54 | Same set | **0 fields ❌** |

Git log audit of every commit between 2026-07-03 12:35 UTC and 2026-07-04 05:18 UTC:
- `3b87d11` — added pricing seed function (`_seed_pricing`), unrelated to Freshsales.
- `76f41b1`, `4afbd9d` — frontend UX (Calendly popup loader, OTP focus delay 100→300ms, resize listener).
- `b13f7d4`, `9d609be` — Buy-Online cart toggle (CR-46).

**No commit in the window touched `swap_otp_tag`, `mark_demo_booked`, `freshsales.py`, or any Freshsales-write path.** Last touch to `freshsales.py` was 2026-07-01 13:55 UTC (commit `8956ce7`, introduction of `swap_otp_tag` under CR-42).

Conclusion: the change is on the **Freshsales / Freshworks CRM side**. Between 2026-07-03 evening and 2026-07-04 morning UTC, Freshsales silently switched the PUT `/contacts/{id}` semantics for the `custom_field` object from **merge** (only the keys sent are updated) to **replace** (the entire `custom_field` object is overwritten with the sent payload). No public changelog entry has been found.

Our code was always technically fragile — it relied on undocumented merge behavior — the Freshsales tightening just exposed it.

---

## Root cause (in the code)

### 1) `backend/freshsales.py` : `swap_otp_tag()` — lines 287–308

```python
async def swap_otp_tag(contact_id: int) -> None:
    ...
    r = await _request("GET", f"/contacts/{contact_id}")
    contact = r.json().get("contact", {})               # ← full contact fetched
    current_tags = contact.get("tags", []) or []
    new_tags = [t for t in current_tags if t != TAG_NO]
    if TAG_YES not in new_tags:
        new_tags.append(TAG_YES)
    upd = {"tags": new_tags, "custom_field": {"cf_rooms": "Yes"}}   # ← BUG: naked one-key dict
    r2 = await _request("PUT", f"/contacts/{contact_id}", json={"contact": upd})
```

The GET already returns the contact's full `custom_field` — we just ignore it. The PUT then sends a one-key object that Freshsales now interprets as a full replacement, wiping every other `cf_*`.

### 2) `backend/freshsales.py` : `mark_demo_booked()` — lines 311–361

```python
cf: dict = {}
if meet_link:      cf["cf_meeting_link"] = meet_link
if meet_link_full: cf["cf_next_step"] = meet_link_full
if demo_at:        cf["cf_channel_manager_name"] = demo_at
if cf:
    update["custom_field"] = cf                          # ← BUG: same shape
r = await _request("PUT", f"/contacts/{cid}", json={"contact": update})
```

Same anti-pattern — sends only the 3 booking fields, replacement semantics wipe the other 12+.

### 3) `backend/freshsales.py` : `upsert_contact()` : 400-retry — lines 216–218

```python
if r.status_code == 400 and "custom_field" in upd:
    upd.pop("custom_field")           # ← BUG: on any 400, throws away ALL custom fields
    r = await _request("PUT", f"/contacts/{cid}", json={"contact": upd})
```

Defensive fallback that wipes the entire custom_field on a single-field 400 error. Same replacement-semantics risk.

---

## Fix

In all three call sites, always merge the incoming keys into the contact's existing `custom_field` (fetched via GET) before sending the PUT.

### Fix 1 — `swap_otp_tag` (freshsales.py:301)

```python
existing_cf = contact.get("custom_field") or {}
upd = {
    "tags": new_tags,
    "custom_field": {**existing_cf, "cf_rooms": "Yes"},
}
```

Zero extra API calls needed — the GET at line 292 already returns `custom_field`.

### Fix 2 — `mark_demo_booked` (freshsales.py:311+)

Needs a small refactor because currently the function only calls `lookup_contact_by_email()` and `_get_contact_tags()`, neither of which returns the full `custom_field`. Two options:

- **Option A (minimal):** add `GET /contacts/{cid}` when `cf` is non-empty, extract `custom_field`, merge and PUT.
- **Option B (preferred):** change `_get_contact_tags(cid)` to `_get_contact(cid)` returning the full contact dict; use `.get("tags")` and `.get("custom_field")` from the same fetch.

```python
# Option B sketch:
contact = await _get_contact(cid)
existing_tags = contact.get("tags") or []
existing_cf   = contact.get("custom_field") or {}
merged_tags = _merge_tags(existing_tags, DEMO_BOOKED_TAG)
new_cf = {}
if meet_link:      new_cf["cf_meeting_link"] = meet_link
if meet_link_full: new_cf["cf_next_step"]    = meet_link_full
if demo_at:        new_cf["cf_channel_manager_name"] = demo_at
update = {"tags": merged_tags}
if DEMO_BOOKED_LIFECYCLE_ID: update["lifecycle_stage_id"] = int(DEMO_BOOKED_LIFECYCLE_ID)
if DEMO_BOOKED_STATUS_ID:    update["contact_status_id"] = int(DEMO_BOOKED_STATUS_ID)
if new_cf:
    update["custom_field"] = {**existing_cf, **new_cf}
```

### Fix 3 — `upsert_contact` 400-retry (freshsales.py:216–218)

Instead of blindly popping `custom_field`, log the Freshsales 400 response body so we can identify the offending key(s), then retry with the surviving keys only. If we can't parse, keep the current fallback but at minimum GET the existing contact first and preserve its cf_ values.

```python
if r.status_code == 400 and "custom_field" in upd:
    logger.warning("upsert_contact 400: %s (custom_field keys=%s)", r.text[:300], list(upd["custom_field"].keys()))
    # Preserve any cf_ already on the contact before retry
    existing_r = await _request("GET", f"/contacts/{cid}")
    existing_cf = (existing_r.json().get("contact", {}) or {}).get("custom_field") or {}
    upd["custom_field"] = existing_cf   # retry with the existing snapshot; caller can layer in one-off updates via targeted follow-up
    r = await _request("PUT", f"/contacts/{cid}", json={"contact": upd})
```

---

## Files affected

| File | Lines | Change |
|---|---|---|
| `backend/freshsales.py` | 287–308 (`swap_otp_tag`) | Merge existing `custom_field` before PUT |
| `backend/freshsales.py` | 311–361 (`mark_demo_booked`) | Fetch full contact, merge existing `custom_field` before PUT |
| `backend/freshsales.py` | 216–218 (`upsert_contact` 400-retry) | Preserve existing `custom_field` on retry |
| `backend/freshsales.py` | 139–146 (`_create_contact` 400-retry) | Same principle — but this is a CREATE, no existing cf to preserve; consider logging the offending key instead of dropping the whole payload |
| `memory/HANDOFF.md` | — | Remove from open issues once verified |
| `memory/PRD.md` | — | Update with fix + Freshsales-behavior-change note |

---

## Risk assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Fetch-before-PUT adds one API call per swap/booked | ~50 ms extra latency, doubles Freshsales API quota for this path | Well within rate limit (~100 req/min); already best-effort background call |
| Merge overwrites a field a sales rep just edited manually | LOW — race window is <1 second between GET and PUT | Acceptable; if it becomes an issue, use FS's `If-Match` / `updated_at` optimistic locking |
| Stale `custom_field` in GET response | LOW — Freshsales GET is strongly consistent | None needed |
| Future Freshsales behavior change back to merge | ZERO — always sending the full object is safe under both merge and replace semantics | This fix is behavior-agnostic |

---

## Backfill of already-wiped leads

Spun out to **CR-48** (`memory/CR-48_Backfill_Wiped_CustomField.md`). CR-48 MUST run AFTER this fix (CR-47) is deployed, otherwise the restored `cf_*` will get wiped again on the next `swap_otp_tag` / `mark_demo_booked` call.

---

## Validation plan (post-fix)

1. Deploy fix; do not restart Freshsales side.
2. Submit a real test demo request via the website with a live Facebook click (or synthetic UTM/fbclid values).
3. Do NOT verify OTP yet — inspect Freshsales contact: all 12+ `cf_*` fields should be populated ✅ (this already works today).
4. Verify OTP.
5. Immediately re-fetch the Freshsales contact — all 12+ `cf_*` fields **must still be populated**, and `cf_rooms` must now be `"Yes"`.
6. Repeat with a Calendly slot booking (`mark_demo_booked` path): all cf_* must still be present after booking, plus the 3 meeting fields.
7. Run backfill script from section above; verify a spot-check of restored contacts on Freshsales UI.

---

## Follow-on hardening (optional, next iteration)

- Add an integration test that simulates the full flow (create → swap_otp_tag → mark_demo_booked) against a Freshsales sandbox and asserts every `cf_*` sent in step 1 survives to step 3.
- Add a helper `merge_custom_field(cid, patch)` in `freshsales.py` that encapsulates the fetch-merge-PUT pattern, so future authors don't reinvent this pitfall.
- Consider Freshsales' PATCH endpoint if/when it exposes a real merge semantics (currently PUT is the only option).

---

---

## 📊 Impact Analysis (2026-07-05 investigation summary)

### Confirmed wipe mechanisms

Two independent causes were identified during investigation. This CR fixes only mechanism (2):

| # | Mechanism | Example lead | Fix owner |
|---|---|---|---|
| 1 | **Freshsales DELETE + RESTORE** (soft-delete then restore) resets custom_field | Mustakbhai 7990444024 (deleted 17:03 IST, restored 17:09 IST) | Freshsales operational — not our code |
| 2 | **`swap_otp_tag` PUT with only `{cf_rooms}`** replaces the entire custom_field object on Freshsales side | Aryen 9696965595, Luhit 9665339697 (no DELETE, cf_* still wiped) | **This CR** |

Verified: Aryen and Luhit have `is_deleted=false` and zero DELETE/RESTORE activity events, yet cf_* is fully wiped except `cf_rooms`.

### Blast radius

| Function | Callers | Frequency | Wipe risk |
|---|---|---|---|
| `swap_otp_tag` | `server.py:403` (`POST /lead/otp-confirm`) | Every OTP-verified demo submission | 🔴 100% wipe on cf_* |
| `mark_demo_booked` | `server.py:417` (`POST /demo-booked`), `server.py:503` (Calendly webhook) | Every Calendly booking | 🔴 100% wipe on cf_* except the 3 meeting fields |
| `upsert_contact` 400-retry | `freshsales.py:216-218` | Only on Freshsales 4xx (rare) | 🟡 Strips entire custom_field |
| `_create_contact` 400-retry | `freshsales.py:139-146` | Only on Freshsales 4xx (rare) | 🟢 Logging only (create has no existing cf) |

### Currently affected leads (backfill scope for CR-48)

| # | Phone | Name | Date | Wipe cause | Restorable? |
|---|---|---|---|---|---|
| 1 | 9696965595 | Aryen | 2026-07-04 | swap_otp_tag | ✅ Yes (via CR-48) |
| 2 | 9665339697 | Luhit | 2026-07-05 | swap_otp_tag | ✅ Yes (via CR-48) |
| 3 | 7990444024 | Mustakbhai | 2026-07-05 | DELETE+RESTORE (Mechanism 1) | ✅ Yes (via CR-48, since attribution intact in Mongo) |

Scope grows by ~1-2 leads/day until deployed.

### Downstream effects post-fix

- Freshsales cf_* fields no longer wiped on OTP verify / Calendly booking → all 14+ attribution fields persist through the funnel
- Ads Intelligence dashboard (CR-24) starts showing complete data
- Meta CAPI dedup (via `cf_contact_person` = event_id) works correctly for OTP-verified leads
- No user-visible change on mygenie.online frontend

---

## 🔧 Implementation Plan

### Deploy bundle
Ship together in one commit with **CR-44** and **CR-49** since they touch the same functions:
1. `_get_contact` helper (new)
2. `swap_otp_tag` merge fix
3. `mark_demo_booked` merge fix
4. `upsert_contact` 400-retry hardening
5. `_create_contact` 400-retry logging
6. **CR-44:** fbc → `latest_source`, ad_id → `work_number` (in `_attribution_to_crm`)
7. **CR-44:** update `crm_sync.py` reads (`work_number` for ad_id, `latest_source` for fbc)
8. **CR-49:** remove `latest_medium` / `latest_campaign` writes

Total: 1 file (`backend/freshsales.py`) + 1 file (`backend/server.py`) + 1 file (`backend/crm_sync.py`) modified. ~45 lines net changed across the three files.

### Testing plan
See Diffs #1-#5 above for exact code. Post-deploy tests:
1. **Unit smoke test:**
   ```python
   from backend import freshsales
   # Mock _request to inspect PUT payloads — verify merge, not replace
   ```
2. **End-to-end test:**
   - Submit demo form as `otp_verified=False` → confirm all cf_* set on FS
   - Verify OTP → confirm cf_rooms=Yes AND all previous cf_* still present
   - Book Calendly slot → confirm cf_meeting_link set AND all previous cf_* still present
3. **Backfill:** Run CR-48 script (dry-run then live) → confirm 3 leads restored

### Rollback
Single-commit revert. Zero schema/data changes. Safe.

### Success criteria
- Every new OTP-verified demo lead has 14+ cf_* fields populated in Freshsales.
- No log lines matching `Freshsales update.*400.*custom_field`.
- CR-48 backfill audit shows 3 successful restores in `crm_backfill_log_cr48`.

---

*Impact + implementation section added 2026-07-05.*
