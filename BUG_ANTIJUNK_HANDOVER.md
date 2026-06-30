# BUG INVESTIGATION HANDOVER — Anti-Junk / Lead Drop Issue

> **Opened:** 2026-06-22
> **Raised by:** Owner (Abhishek)
> **Status:** 🔴 Open — not investigated to root cause, not fixed
> **Priority:** P0 — production-blocking (real customer leads being silently dropped)
> **Assigned to:** Next dev agent

---

## What the Owner Observed

1. Filled the demo form on the preview URL with real details (name: Abhishek, phone: 7505242126)
2. Clicked "Verify phone with OTP" — received no OTP SMS (OTP was disabled in this session, now fixed)
3. Submitted the form — Calendly calendar appeared ("Almost there, Abhishek — pick your slot")
4. Booked a calendar slot and received a calendar invite
5. **No lead appeared in Freshsales CRM**
6. **No lead saved in MongoDB**

Owner's question: *"How did I get a calendar invite if the form was not submitted properly?"*

---

## Investigation Done This Session

### Finding 1 — Form reached backend, anti-junk dropped it silently

The backend access log confirms `POST /api/demo-request HTTP/1.1 200 OK` was received.

But:
- `submission_log` in MongoDB = empty for the owner's submission (written only AFTER `looks_like_bot` passes)
- `demo_requests` collection = no Abhishek lead
- Freshsales = no contact created

This definitively means `looks_like_bot(payload.hp, payload.elapsed_ms)` returned True.

Backend code path when this happens:
```python
# server.py line 178-179
if antijunk.looks_like_bot(payload.hp, payload.elapsed_ms):
    return DemoRequest(**payload.model_dump())  # fake 200, nothing saved
```

A 200 response is returned with the form data echoed back. The frontend interprets this as success and shows the Calendly calendar.

### Finding 2 — Most likely cause: Honeypot field autofilled by browser

The anti-junk has a hidden honeypot field:

```jsx
// frontend/src/lib/antiBot.jsx
<input
  type="text"
  name="company_website"      ← recognizable field name
  autoComplete="off"          ← NOT respected by all browsers
  style="position:absolute; left:-9999px; opacity:0;"
/>
```

`looks_like_bot` logic:
```python
def looks_like_bot(hp, elapsed_ms):
    if hp:               # ← non-empty honeypot = bot = True
        return True
    if elapsed_ms is not None and elapsed_ms < 2000:
        return True
    return False
```

The owner sent OTP at 02:59 and 03:05 (6 minutes elapsed), so `elapsed_ms` was far above 2000ms. The only remaining cause is `hp` being non-empty.

**Why the honeypot gets filled:** Chrome, Safari (especially mobile), LastPass, and other password managers/autofill tools recognize `name="company_website"` as a legitimate website URL field and autofill it — even when `autoComplete="off"` is set. `autoComplete="off"` is NOT honored by all browsers per spec.

This means: **any real customer whose browser has autofill enabled will silently lose their lead.**

### Finding 3 — Calendly appearing is WRONG behavior

The frontend shows Calendly on any 200 response from `/api/demo-request`. When the fake success path fires, the frontend has no way to distinguish it from a real save. The owner correctly identifies this as a bug:

> *"Calendar send should come only when the form is submitted [for real]."*

Currently:
```
fake success (lead dropped) → 200 response → DemoForm shows Calendly → user books → calendar invite sent → NO CRM lead
```

Expected behavior:
```
lead drop → show error OR still save lead → never show Calendly when lead not saved
```

---

## Two Separate Bugs to Fix

### Bug 1 — Honeypot autofill causing silent lead drop (P0 — critical)

**File:** `frontend/src/lib/antiBot.jsx`

**Problem:** `name="company_website"` is autofilled by browsers/password managers.

**Suggested fix options (pick one):**
- Option A: Rename to something unrecognizable — e.g. `name="mg_trap_field_xz7"` — browsers won't autofill unknown names
- Option B: Keep the honeypot but add backend logging when it fires (so dropped leads aren't completely invisible)
- Option C: Remove the honeypot entirely and rely only on rate limiting + timing check (less effective against bots but stops real lead loss)

**⚠️ Do NOT just use `autocomplete="new-password"` or other autocomplete tricks — these are unreliable across browsers.**

---

### Bug 2 — Calendly shown on fake success (P1 — UX/data integrity)

**File:** `frontend/src/components/site/DemoForm.jsx`

**Problem:** The form shows Calendly on any 200 response. Fake success returns 200 with form data echoed. Frontend can't tell the difference.

**Root cause:** Fake success returns same response shape as real success.

**Suggested fix options (pick one):**
- Option A: Add a distinguishing field in the response — e.g. `"saved": true/false`. Real save: `{"saved": true, ...}`. Fake: `{"saved": false, ...}`. Frontend checks `saved` before showing Calendly.
- Option B: Change fake success to return a specific error code (e.g. 202 Accepted or 418 I'm a Teapot) that the frontend handles differently — show a generic "thank you, we'll reach out" without Calendly.
- Option C: On the fake success path, still save to MongoDB (just tag as `Bot-Suspected`) — never silently drop a lead completely. Only drop Freshsales push.

**Owner's preferred outcome:** Calendly should only appear after a REAL save confirmed.

---

## What Was Fixed This Session

| Fix | Status |
|---|---|
| `OTP_SMS_ENABLED` set to `true` (was false) | ✅ Done |
| Real SMS now sends to user's phone | ✅ Done |

---

## What Was NOT Fixed (needs next agent)

| Bug | Priority | Files |
|---|---|---|
| Honeypot `company_website` autofilled by browsers → leads silently dropped | P0 | `frontend/src/lib/antiBot.jsx` |
| Calendly shows even on fake anti-junk success → misleading UX + lost data | P1 | `frontend/src/components/site/DemoForm.jsx` + `backend/server.py` |

---

## How to Reproduce

1. Open `https://full-stack-preview-32.preview.emergentagent.com` in Chrome (NOT incognito)
2. Make sure your browser has any contact autofill data saved
3. Fill the demo form with your real name + phone
4. Watch the `company_website` field (inspect element → find `[data-testid="honeypot-field"]`)
5. Check if its value is non-empty after autofill
6. Submit → Calendly will appear → but no lead in MongoDB

**Workaround to test without this bug:** Use Chrome Incognito or Safari Private (autofill disabled in private mode).

---

## Verification Query (run after fix)

```python
# After reproducing and fixing, confirm lead saves:
python3 << 'EOF'
import asyncio, motor.motor_asyncio, os
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
async def verify():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    recent = await db.demo_requests.find({}, {'_id':0,'name':1,'phone':1,'created_at':1,'freshsales_contact_id':1}).sort('created_at',-1).to_list(3)
    for l in recent: print(l)
    client.close()
asyncio.run(verify())
EOF
```

Real lead will show with `freshsales_contact_id` non-null.

---

## Context Files for Next Agent

| File | Relevant section |
|---|---|
| `/app/backend/antijunk.py` | `looks_like_bot()` function + `enforce_rate_limit()` |
| `/app/backend/server.py` | Lines 176–185 (demo-request handler, fake success path) |
| `/app/frontend/src/lib/antiBot.jsx` | `Honeypot` component + `useAntiBot` hook |
| `/app/frontend/src/components/site/DemoForm.jsx` | `submit()` function — Calendly display logic |
| `/app/CR_Control_Dashboard.md` | CR-4 (Anti-Junk + OTP) history |

---

*Handover written: 2026-06-22*
*Session that found this: 2026-06-22 (go-live validation session)*
