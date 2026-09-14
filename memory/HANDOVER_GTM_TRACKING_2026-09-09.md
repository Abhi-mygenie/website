# Agent Handover — GTM / Tracking Focus
**Date:** 2026-09-09
**Outgoing session focus:** CR-220 Enhanced Conversions (GTM dashboard work)
**Incoming session focus:** GTM tracking — present summary of what's been done, then work on remaining open tracking CRs

---

## FIRST ACTION FOR NEXT AGENT

**Do not start coding immediately.** Read this entire handover, then present the user with:
1. A plain-English summary of what was accomplished in the last session (CR-220 done)
2. Current state of all open GTM/Tracking CRs
3. Proposed next steps in priority order
4. Ask the user which to tackle next

---

## What Was Accomplished This Session (2026-09-09)

### CR-220 Enhanced Conversions — ✅ FULLY COMPLETE

**Background:** Google Ads Enhanced Conversions was sending zero hashed identity data. Google Ads console showed "Needs attention / Last ping: Sep 2".

**Three fixes completed:**

| Fix | What | Status |
|---|---|---|
| Fix B (Code) | `user_data: { email_address, phone_number, address: { first_name, last_name } }` added to `buildLeadPayload()` in `src/lib/gtm.js` | ✅ Done (prev session) |
| Fix A (GTM) | `user_data` event parameter added to "GA4 - Book demo" tag | ✅ Done this session |
| Step A (GTM) | `user_data` variable created → Manual configuration: Email→{{email}}, Phone→{{phone}}, First Name→{{DLV First Name}}, Last Name→{{DLV Last Name}}, Country→Constant-IN, Postal Code→DLV-Postal Code | ✅ Done this session |
| Step B (GTM) | Tag 85 "Google Analytics - GA4" → Shared event settings → `user_data: {{user_data}}` added | ✅ Done this session |
| Step C (GTM) | Tag 100 "Google Tag AW-16740091756" → Shared event settings → `user_data: {{user_data}}` added | ✅ Done this session |
| Step D (GTM) | Published as Version "Step A-D" description "Enhanced conversion" | ✅ Published live |

**Key architectural discovery:**
- Tag 88 "GAds - Book Demo" (awct type) was ALREADY correctly reading EC data from DataLayer via "Provide new customer data" + event parameters (Email/Phone/Name). It was NOT using Automatic DOM scanning.
- Tags 85 and 100 (googtag type) had `allow_enhanced_conversions: true` but no user_data variable attached — this was the real gap.
- Tag 85 routes ALL GA4 events through Stape server-side container at `https://mcap.mygenie.online` — the most powerful EC path.

**What to monitor (passive — no action needed):**
- Google Ads console → Conversions → "Book demo" → Last ping date should update within 2h of next conversion
- "Needs attention" diagnostic should clear within 24-72h
- Enhanced Conversions coverage % should appear after ~7 days of data
- **Full monitoring log with timestamps:** `/app/memory/CR-220_Monitoring_Log.md` — next check due Sep 11, 2026

**GA4 property-level setting (confirmed correct Sep 9, 2026):**
- Location: analytics.google.com → MyGenie Website (G-KWHHFEZ5Q3) → Admin → Google Tag → Settings → "Allow user-provided data capabilities"
- Master toggle: **ON** ✅
- "Automatically detect user-provided data": **UNCHECKED** ✅ (DOM scanning — broken with React)
- "Specify CSS selectors / JS variables": **UNCHECKED** ✅ (not needed)
- Method in use: "Add a code snippet" = our GTM user_data event parameter approach ✅
- **No further changes needed in GA4 property settings.**

### CR-264 — ✅ CLOSED
- GTM-K5D84Z3L confirmed live on `www.mygenie.online` via HTML source inspection
- Consent mode, host guard, and interaction-first defer all confirmed present

### Full GTM Tag Documentation — ✅ Created
- `/app/memory/GTM_TAG_REGISTRY.md` — complete audit of all 13 tags with purpose, config, and status
- `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md` — detailed GTM implementation plan

---

## Current State of All Open GTM/Tracking CRs

### 🔴 P1 — CR-221 / CR-222: Remarketing Pings Failing — ✅ CLOSED 2026-09-09

**Resolution:** Owner tested in Chrome Incognito (zero extensions) on mygenie.online. Network tab shows:
- `16740091756/?random=...` → **200 ✅** — Remarketing pixel IS firing correctly
- All GA4, Google Ads, and Stape requests return 200/204
- Zero failed requests before OR after consent acceptance
- After consent: additional `e/` and `s/` requests from Stape server-side relay — all 200 ✅

**Root cause of original failures:** Ad blocker in the test browser was blocking `rmkt/collect` requests. In a clean Incognito session with no extensions, everything works perfectly.

**CR-221 and CR-222 are both CLOSED.**

---

### 🟡 P1 — CR-216: Duplicate Google Scripts (Library download)

**What's happening:** Both Tag 85 (Google Analytics - GA4) and Tag 100 (Google Tag AW-16740091756) were recently migrated to "Google Tag" type (6 days before this session). This was a step in the right direction. But they may still be loading `gtag.js` twice if they're not linked.

**Status:** PARTIALLY done. Need to verify:
- Open Tag 85 in GTM → check if there's a "Linked Google Tag" field pointing to G-KWHHFEZ5Q3
- If both tags reference the same underlying library → CR-216 resolved
- If they load independently → still wasting 179KB / 308ms

**Note:** The marketing team brief confirmed both tags are "googtag" type. This typically means they DO share the library if the IDs are linked. **The CR-220 changes we made this session (attaching user_data to Tag 100's shared event settings) means Tag 100 is now working correctly as a linked tag.**

**Action:** Owner should verify in GTM whether Tag 85 and Tag 100 are truly sharing one gtag.js or loading two.

---

### 🟡 P1 — CR-254: Freshsales Data Hygiene Bug

**What's happening:** ~10-15 leads (out of 700) show unrelated values in "Search Term (utm_term)" and "Google Click ID" Freshsales fields. Values seen: "3 or Less", "Stand Alone", "Cloud Based", "Hybrid" — these are outlet-type/POS answers, not attribution data. Some form or chatbot is reusing the same Freshsales custom field IDs.

**Owner action needed:** Audit Freshsales field IDs to find which form/chatbot reuses these field IDs → remap to correct fields. No code change required.

---

### 🟢 P2 — CR-52: Server-Observable Pixel Heartbeat

**What it is:** Add `navigator.sendBeacon` to `src/lib/gtm.js` (frontend) and a `/api/telemetry/pixel-fire` endpoint to backend. Gives server-side visibility into browser-side GTM fires — helps diagnose silent tracking failures without relying on browser DevTools.

**This requires codebase changes (frontend + backend).** Medium complexity.

**Files to modify:** `src/lib/gtm.js`, `backend/server.py`

---

### 🟢 P2 — CR-253: Capture Verbatim Google Search Query

**What it is:** Capture the literal search query the user typed (not just the matched keyword) in Freshsales. Requires owner to create a new Freshsales custom field first, then add `&utm_query={searchterm}` to Google Ads Final URL suffix.

**Owner action needed first.** No code change until Freshsales field exists.

---

## Summary Table — All Open Tracking CRs

| CR | Title | Status | Owner | Priority |
|---|---|---|---|---|
| CR-216 | Duplicate Google Scripts | 🔲 Verify library sharing in GTM | GTM owner | P1 |
| CR-52 | Server pixel heartbeat | 🔲 Code change needed | Developer | P2 |
| CR-253 | Capture utm_query in Freshsales | 🔲 Owner creates field first | Owner + Developer | P2 |
| CR-254 | Freshsales field ID hygiene bug | 🔲 Owner audit | Owner | P1 |

---

## Closed This Session (2026-09-09)

| CR | Title | How Closed |
|---|---|---|
| CR-220 | Enhanced Conversions — all 3 fixes done, GTM published | GTM dashboard + code (Fix B prev session) |
| CR-264 | GTM ID confirmed live on production | Owner confirmed via HTML source inspection |
| CR-221 | Remarketing pings failing | Incognito test: 16740091756 pixel returns 200 ✅ — ad blocker was the cause |
| CR-222 | Remarketing pings failing (consent confirmed) | Same Incognito test — all requests 200/204 after consent ✅ |

---

## Key Technical Context for Next Agent

### GTM Container Structure
- **Client-side:** GTM-K5D84Z3L (www.mygenie.online)
- **Server-side:** GTM-KN4B3Q2H (Stape, at https://mcap.mygenie.online)
- All GA4 events are proxied through Stape (configured via `server_container_url` in Tag 85)

### Key Variables in GTM
| Variable | Type | Reads |
|---|---|---|
| `user_data` | User-Provided Data, Manual config | email, phone, first_name, last_name, country (IN), postal_code |
| `{{email}}` | Data Layer Variable | `email` key from dataLayer |
| `{{phone}}` | Data Layer Variable | `phone` key from dataLayer |
| `{{DLV First Name}}` | Data Layer Variable | `first_name` key |
| `{{DLV Last Name}}` | Data Layer Variable | `last_name` key |
| `{{DLV GCLID}}` | Data Layer Variable | `gclid` key |
| `{{GA4 ID}}` | Constant | G-KWHHFEZ5Q3 |

### Conversion Flow
```
User submits form → "form_submitted" event → Fb form submit + Google form submit tags fire
User completes OTP → "book_demo" / "thankyou_conversion" event → 
  FB - Book demo + GA4 - Book demo + GAds - Book Demo tags fire
  GA4 event proxied to Stape (https://mcap.mygenie.online) → server-side EC matching
```

### Code Reference
- `src/lib/gtm.js` — `buildLeadPayload()` function — contains Fix B (user_data object)
- `src/components/site/DemoBottomSheet.jsx` — triggers the book_demo event on OTP verify
- `/app/memory/GTM_TAG_REGISTRY.md` — complete audit of all GTM tags

### Important Rules
- **Do NOT edit GTM-K5D84Z3L directly without the owner's confirmation** — these are production tracking tags
- GTM changes are always: Preview test → verify → Publish
- Tag 88 (GAds - Book Demo) should NOT be modified — it's already working correctly
- CR-247, CR-248, CR-262 are CANCELLED by the owner — do not implement

---

## Files to Read on Session Start
1. `/app/memory/GTM_TAG_REGISTRY.md` — tag audit
2. `/app/memory/CR-220_Monitoring_Log.md` — check Sep 11 entry first
3. `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md` — full GTM plan
4. `/app/memory/CR_INTAKE_REGISTER.md` — full CR register

*Note: CR-221 and CR-222 are CLOSED — no need to read their individual files.*
5. `/app/memory/CR_INTAKE_REGISTER.md` — full CR register

---

*Handover written 2026-09-09. Outgoing agent.*
