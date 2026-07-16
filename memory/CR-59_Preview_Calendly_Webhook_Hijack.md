# CR-59 — Preview environment hijacked production Calendly webhook

**Status**: FIXED + BACKFILLED (2026-07-14)
**Severity**: P0 production data loss (Demo Time + Meeting Link missing in Freshsales)

## Root cause
CR-40 startup sync (`_sync_calendly_webhook` in server.py) deletes ALL active user-scoped
Calendly webhook subscriptions and registers its own `CALENDLY_WEBHOOK_CALLBACK_URL`.
When this preview fork booted on **2026-07-13 05:56 UTC** with the real `CALENDLY_API_TOKEN`
and a preview callback URL in .env, it deleted production's subscription. All webhooks then
fired at the (frequently sleeping) preview pod → 9 real bookings lost their Freshsales update.

## Fix applied (all executed from preview, no prod deploy needed)
1. Deleted preview subscription + re-registered `https://mygenie.online/api/calendly/webhook`
   on Calendly (script: `/app/scripts/cr59_restore_prod_calendly_webhook.py`).
   Verified prod signature key matches via signed test POST → 200.
2. Blanked `CALENDLY_WEBHOOK_CALLBACK_URL` in preview `backend/.env`.
3. Code guard in `_sync_calendly_webhook`: refuses any callback_url containing
   `preview.emergentagent.com` (reaches prod on next GitHub push — harmless there).
4. Backfill: `/app/scripts/cr59_backfill_calendly_webhook_gap.py --live` → **8/9 leads repaired**
   in live Freshsales (cf_meeting_link, cf_channel_manager_name=Demo Time, cf_next_step, tags,
   existing cf preserved). Trail: `db.crm_backfill_log_cr59`.
   The 1 failure = owner's own test booking (geek.abhishek@gmal.com, contact 404/deleted).

## Verification
- `/app/test_reports/iteration_19.json` — 9/9 pytest pass (guard, startup log, webhook
  signature 200/401/400, mongo update path). Test file: `backend/tests/test_cr59_calendly_guard.py`.
- Live Calendly API shows single active sub → mygenie.online.
- Spot-checked contact 402212446424 (Neeraj patel) in Freshsales: all fields present.

## Prevention rules for future sessions
- NEVER put a production `CALENDLY_WEBHOOK_CALLBACK_URL` + real token combo in preview .env.
- Preview should keep `CALENDLY_WEBHOOK_CALLBACK_URL` BLANK — the sync then skips entirely.
- The CR-59 guard is a second line of defense; consider allow-list (only mygenie.online) later.

## RECURRENCE 2026-07-16 (RE-FIXED)
Another preview fork (`mygenie-runtime.preview.emergentagent.com`) hijacked prod webhook
again on 2026-07-15 08:45:44Z because the allow-list guard lives only in THIS preview
branch — it has NOT been pushed to GitHub yet, so any fresh preview fork clones OLD code
(no guard). Gap window: 2026-07-15T08:45 → 2026-07-16T18:14 UTC.
- Prod webhook re-registered via `scripts/cr59_restore_prod_calendly_webhook.py` → 201 OK.
- 6 affected bookings backfilled in live Freshsales (3 real leads, 3 owner test bookings 404).
  Real leads updated: Mahendra Vishwakarma (fcid 402212732712), Chandrakala Amritlal
  Bharadwaj (402212768471), Nishant (402212701179).
- ROOT CAUSE OF RECURRENCE: guard not deployed to prod. Any future preview fork will
  re-hijack until `git push` runs. USER MUST use "Save to GitHub" NOW.
