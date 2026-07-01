# CR-4B — OTP Verification (Demo form only) — IMPLEMENTATION SPEC

> Status: **PLANNED, fully unblocked, owner-approved 2026-06-08.** No code written yet.
> This is the build brief for the implementation agent. Read `HANDOVER.md` first, then this.
> **Build via `integration_expert` FIRST** (auth-adjacent protocol), then backend → frontend.

---

## 1. Goal
Require a phone-verified OTP before a **Demo** lead is accepted. OTP is **Demo form only**
(Quote/Buy, ROI, Contact stay as-is). Anti-junk Part A (honeypot/timing/rate-limit) already
guards all lead endpoints — this adds a verification layer on top of `/demo-request`.

## 2. Owner-locked decisions (do NOT re-litigate)
| Decision | Value |
|---|---|
| Forms requiring OTP | **Demo only** |
| Failure mode (panel down / SMS error) | **Graceful** — still accept the lead, tag it **`OTP-Unverified`** in Freshsales. NEVER hard-block. |
| OTP length | **4 digits** |
| OTP validity | **10 minutes** |
| OTP storage | **hashed** in Mongo, TTL auto-expire |
| Mobile format | **10-digit**, leading-zero stripped, no `+91` (exactly like the owner's PHP) |
| Resend cooldown | 30s |
| Max sends | 5 / phone / hour |
| Verify attempts | 5, then short lock |
| Message text | **Option A (corrected)** — OTP in slot 1, "10" minutes in slot 2 |
| Live SMS | **OFF until owner flips `OTP_SMS_ENABLED`** — build with sends guarded/logged |

## 3. SMS provider contract (from owner's production PHP — replicate exactly)
- **Method/URL:** `GET https://123.108.46.13/sms-panel/api/http/index.php`
- **TLS:** self-signed/IP cert → `verify=False` (httpx). Owner confirmed the IP is **public** (still run a live reachability test at build).
- **Query params:**
  - `username=MYGENIE`
  - `apikey=<SMS_API_KEY — store in backend/.env, do NOT hardcode>`
  - `apirequest=Text`
  - `sender=HSEGNI`
  - `route=TRANS`
  - `TemplateID=1707178030188539801`
  - `mobile=<10-digit, leading-zero stripped>`
  - `message=<rendered template>`
  - `format=JSON`
- **DLT-approved template (2 placeholders):**
  > `Your One-Time Password (OTP) for verification is: {#var#}. Mygenie This OTP is valid for {#var#} minutes. Please do not share this OTP with anyone for security reasons. TEAM HOSIGENIE`
  - **Option A render (locked):** slot 1 = OTP, slot 2 = `10`. (The owner's PHP `str_replace(['{#var#}','{#var#}'], [$otp, 10], …)` is buggy — it puts the OTP in BOTH slots. Do it **positionally** instead.)

## 4. Backend (`backend/`)
- New module `otp.py` (or fold into `server.py`): generate 4-digit code, hash (e.g. hashlib/secrets), store in Mongo collection `otp_codes` `{phone_norm, code_hash, expires_at, attempts, sends, created_at}` with a TTL index on `expires_at`.
- `POST /api/otp/send` → body `{phone}` → rate-check (30s resend, 5/hr) → generate+store → if `OTP_SMS_ENABLED` send SMS (else log code). Returns `{sent: true, cooldown: 30}`.
- `POST /api/otp/verify` → body `{phone, code}` → check hash + expiry + attempts → on success return a short-lived **verification token** (signed, ~15-min, bound to phone). On fail increment attempts (lock after 5).
- `/api/demo-request` → accept optional `otp_token`:
  - valid token matching phone ⇒ normal lead (no extra tag).
  - missing / invalid / panel was down ⇒ **still save the lead**, add tag **`OTP-Unverified`** to the Freshsales `tags` list (alongside `Website Demo Lead`).
- `.env` keys: `SMS_API_KEY`, `SMS_SENDER=HSEGNI`, `SMS_TEMPLATE_ID=1707178030188539801`, `SMS_BASE_URL=https://123.108.46.13/sms-panel/api/http/index.php`, `SMS_ROUTE=TRANS`, `OTP_SMS_ENABLED=false`.
- Reuse existing `antijunk.py` (already on `/demo-request`).

## 5. Frontend (`frontend/src/components/site/DemoForm.jsx` only)
- After phone entry: **"Send OTP"** button → 4-digit input + **"Verify"** → on verify, store the returned token and enable Submit.
- Resend with 30s cooldown timer.
- If `/api/otp/send` or `/verify` errors (panel down), allow the user to submit anyway (lead flows through as `OTP-Unverified`) — surface a soft notice, never a hard block.
- `data-testid`s: `otp-send-btn`, `otp-input`, `otp-verify-btn`, `otp-resend-btn`, `otp-status`.

## 6. Verification / QA
- Build-time: live reachability test to the panel IP (sends stay OFF via flag).
- With `OTP_SMS_ENABLED=false`: test send→log→verify→demo-submit (verified path) and panel-down→`OTP-Unverified` path via curl + Playwright.
- Then `testing_agent` (frontend+backend) → `/app/test_reports/iteration_8.json`.
- Owner flips `OTP_SMS_ENABLED=true` for a real end-to-end SMS test when ready.

## 7. Gotchas
- Don't hardcode `SMS_API_KEY` — `.env` only.
- DLT template matching is by TemplateID + structure; Option A render is compliant.
- Phone normalization must match `antijunk._norm_phone` (last 10 digits) so cooldowns line up.
- Graceful degrade is a HARD requirement — a panel outage must never cost a Demo lead.
