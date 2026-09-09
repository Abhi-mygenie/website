# Handover — CR-216 Evening Session
# GTM Duplicate Scripts — Step 1 Done, Steps 2–3 Tomorrow Morning

**Date:** 2026-09-09 (evening)
**Container:** GTM-K5D84Z3L
**Production:** https://www.mygenie.online

---

## FIRST ACTION FOR NEXT AGENT

Read this file. Present the owner with:
1. What was done (Step 1 complete)
2. The validation checklist (Step 2)
3. The GTM action (Step 3)
4. Ask: "Ready to validate and proceed?"

---

## What Was Done This Session

### Investigation ✅
- Fetched live GTM container JS (version 120)
- Confirmed both "Google Analytics - GA4" (Tag 85) and "Google Tag AW-16740091756" (Tag 100)
  are independent `__googtag` tags with no `linked_id` — two separate gtag.js downloads confirmed
- GA4 Admin showed **"0 connected"** site tags → AW was never linked to GA4 Google Tag

### Tag-by-Tag Understanding ✅
- "Google Tag AW-16740091756" serves TWO jobs:
  1. Base Google Ads library initialisation (required for conversion tracking)
  2. Remarketing pixel — fires `gtag('config', 'AW-16740091756')` on every page to build
     RLSA audiences in Google Ads
- Safe to replace with Connected Site Tag because GA4's connected tag calls
  `gtag('config', 'AW-16740091756')` identically — both jobs transfer

### Step 1 — GA4 Admin Connected Site Tag ✅ DONE
- Location: analytics.google.com → Admin → Data Streams → Web stream →
  Google tag → Manage connected site tags
- Action: Connected `AW-16740091756` with nickname `Google Ads — AW-16740091756`
- Current state: **Overlap period** — AW-16740091756 is now initialised by BOTH:
  - GA4 Google Tag (via connected site tag) ← NEW
  - GTM "Google Tag AW-16740091756" ← still active, not yet paused
- This overlap is harmless. Google deduplicates. Remarketing audiences get a double signal
  (slightly positive). No tracking loss.

---

## Morning Session — Steps 2 & 3

### Step 2 — Validate on production (do BEFORE touching GTM)

Open `www.mygenie.online` in Chrome → DevTools → Network tab (no extensions, no ad blocker)

| Check | Filter | Pass condition |
|---|---|---|
| Remarketing pixel | `collect` or `16740091756` | Request returns 200 ✅ |
| GA4 still firing | `collect?v=2` or `gtag` | GA4 pageview requests present ✅ |
| No JS errors | Console tab | No gtag-related errors ✅ |

Optional stronger test: GTM Preview → submit real demo form → verify "GAds - Book Demo"
tag fires in the debug panel.

**If all 3 checks pass → proceed to Step 3.**

### Step 3 — GTM: Pause the redundant tag

```
GTM → GTM-K5D84Z3L → Tags
→ Find: "Google Tag AW-16740091756"
→ Click ⋮ menu → Pause
→ Submit → Publish
   Version name: "CR-216 — Pause AW Google Tag (now via GA4 Connected Site Tag)"
```

**Do NOT delete yet — just pause.** Observe for 24h:
- Remarketing audiences still recording in Google Ads → Audience Manager → Website tag
  (should show "Recording activity")
- No drop in conversion counts in Google Ads console

**After 24h clean observation:**
```
GTM → Tags → "Google Tag AW-16740091756" → Delete → Publish
   Version name: "CR-216 COMPLETE — Remove AW Google Tag"
```

---

## Expected Result Once Complete

| Metric | Before | After |
|---|---|---|
| Google scripts download | 367 KB (188+179) | 188 KB |
| Blocking time | 645ms | ~337ms |
| TBT improvement | — | −308ms per page load |
| Lighthouse score | ~70 | +2–3 pts |

---

## Current State of All Tracking Tags (for context)

| Tag | Status | Notes |
|---|---|---|
| Conversion Linker | ✅ Active | Handles gclid across pages |
| Facebook Pixel | ✅ Active | Meta base pixel |
| FB - Book demo | ✅ Active | Meta conversion on OTP verify |
| Fb form submit | ✅ Active | Meta top-of-funnel signal |
| GA4 - Book demo | ✅ Active | CR-220 Fix A done — user_data attached |
| GAds - Book Demo | ✅ Active | Conversion tag — EC disabled (Fix C pending) |
| Google Analytics - GA4 | ✅ Active | G-KWHHFEZ5Q3, Stape connected, user_data |
| Google Tag AW-16740091756 | ✅ Active (pending pause) | Will be paused in morning session |
| FB - OTP Verified | ⏸️ Paused | Redundant with FB - Book demo |
| fb-schedule | ⏸️ Paused | Calendly trigger — superseded |
| GA4 - Book Appointment | ⏸️ Paused | Calendly trigger — superseded |
| GA4 - OTP Verified | ⏸️ Paused | Redundant with GA4 - Book demo |

---

## Other Open CRs (do not start until CR-216 Steps 2–3 complete)

| CR | What | Who |
|---|---|---|
| CR-220 Fix C | GAds Book Demo tag — EC mode still "Automatic" (checkbox=false in live container). Switch to Code + {{dlv - user_data}} | GTM owner |
| CR-52 | Server pixel heartbeat — navigator.sendBeacon + /api/telemetry/pixel-fire endpoint | Developer |
| CR-253 | Capture utm_query in Freshsales | Owner creates field first |
| CR-254 | Freshsales field ID hygiene (outlet answers in utm_term/gclid) | Owner audit |

---

## Key Files
- `/app/memory/CR-216_GTM_Duplicate_Google_Scripts.md` — updated with progress log
- `/app/memory/GTM_TAG_REGISTRY.md` — full tag audit
- `/app/memory/HANDOVER_GTM_TRACKING_2026-09-09.md` — previous session context
- `/app/memory/CR-220_Monitoring_Log.md` — EC monitoring (next check Sep 11)

---

*Handover written 2026-09-09 evening. CR-216 Step 1 done. Steps 2–3 tomorrow morning.*
