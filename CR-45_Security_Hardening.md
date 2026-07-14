# CR-45 — Security Hardening: Pricing Integrity, Auth, Webhook & Config Gaps

**Registered:** 2026-07-03  
**Status:** G3 — Partially Implemented  
**Priority:** P0 — Security / Pre-launch Blocker  
**Source:** Security Audit (read-only) — 2026-07-03  
**Files in scope:** `payments.py`, `cms_auth.py`, `server.py`, `otp.py`, `backend/.env`

## Implementation Status

| Issue | Status | Notes |
|---|---|---|
| SEC-001 Server-side price catalog | ✅ DONE | Prices seeded into `db.plans` / `db.addons` on startup; `payments.py` looks up DB prices — client values ignored |
| SEC-002 Admin credentials / JWT | ✅ DONE (env) | Handled by user directly in `.env` |
| SEC-003 Freshsales webhook auth | ⏸ DEFERRED | User decision — document retained for future sprint |
| SEC-004 CORS explicit origins | ✅ DONE (env) | Handled by user directly in `.env` |
| SEC-005 AWS key comments | ✅ DONE (env) | Handled by user directly in `.env` |
| SEC-006 Payment endpoint auth | 📋 BACKLOG | Low priority — UUID guessing difficulty accepted for now |
| SEC-007 TLS verify=False | ⚠️ PARTIAL | payments.py fixed; otp.py reverted — SMS panel uses self-signed IP cert (`123.108.46.13`), TLS verify must stay disabled until provider fixes cert |
| SEC-008 PII log masking | ⏸ DEFERRED | User decision — document retained for future sprint |

---

## 1. Audit Summary

A read-only security audit of the full codebase identified 2 HIGH severity issues, 1 MEDIUM, and 5 hardening items. No secrets were found hardcoded in the frontend bundle. MongoDB queries showed no injection risk. `.env` is git-ignored (not committed).

**Verdict from audit:** FAIL — ACTION REQUIRED before production launch.

---

## 2. Findings

---

### SEC-001 — Client-controlled checkout price [HIGH / P1]

**File:** `payments.py` lines 104–110, 178–185

**What's happening:**
Razorpay order amount is derived from `payload.plan_price` and `payload.addon_prices` — values sent directly from the buyer's browser. No server-side price validation exists.

**Attack path:**
```
Attacker → POST /api/payments/razorpay/order
           { plan_id: "pro", plan_price: 1, addon_prices: [] }
         → Razorpay order created for ₹1
         → Payment succeeds
         → GST invoice generated at ₹1
         → Freshsales contact marked "Won"
         → Attacker has Pro plan for ₹1
```

**Business impact:** Revenue loss, fraudulent GST invoices, corrupted Freshsales pipeline data.

---

### SEC-002 — Default admin credentials + placeholder JWT secret [HIGH / P1]

**File:** `backend/.env` lines 89–93, `cms_auth.py` lines 29, 47

**What's happening:**
- `CMS_PASS_1` and `CMS_PASS_2` set to guessable default passwords
- `CMS_JWT_SECRET` = `replace-with-strong-secret-please` (literal placeholder — also flagged in earlier env audit)

**Attack path:**
```
Attacker → POST /api/cms/login { password: "admin123" }
         → Valid JWT issued (signed with known placeholder secret)
         → GET /api/cms/leads → all lead PII (name, phone, email, city)
         → DELETE /api/cms/leads → all leads wiped
```

OR without credentials:
```
Attacker → forge JWT using known secret "replace-with-strong-secret-please"
         → All CMS endpoints accessible
```

**Business impact:** Full exposure of all lead PII. All leads deletable. GDPR/DPDP liability.

---

### SEC-003 — Unauthenticated Freshsales stage webhook [MEDIUM / P2]

**File:** `server.py` lines 1434–1471

**What's happening:**
`POST /api/webhooks/freshsales/stage` accepts any request with no signature or auth verification. Writes to `crm_stage_events` collection and updates lead documents by `contact_id`.

**Attack path:**
```
Attacker → POST /api/webhooks/freshsales/stage
           { contact_id: 402211323363, stage: "Closed Lost" }
         → Lead stage corrupted in MongoDB
         → Funnel analytics poisoned
```

**Business impact:** Corrupted funnel data, wrong lead statuses, misleading sales reports.

---

### SEC-004 — CORS wildcard with credentials [LOW / P3]

**File:** `server.py:1480`, `backend/.env:3`

`CORS_ORIGINS="*"` combined with `allow_credentials=True`. This is a CORS misconfiguration — browsers block credentialed requests to wildcard origins, but the intent should be explicit allowed origins for production.

---

### SEC-005 — AWS key/secret in `.env` comments [LOW / P3]

**File:** `backend/.env` lines 12–13

Real AWS credentials appear to be present in commented-out lines. Even if commented, they are readable to anyone with file access and could be accidentally uncommented.

---

### SEC-006 — Payment endpoints auth by UUID only [LOW / P3]

**File:** `payments.py` lines 233–313

Order lookup (`/api/payments/order/{id}`), invoice download, and menu upload are protected only by UUID guessing difficulty — no user ownership or session auth check.

---

### SEC-007 — TLS verification disabled [LOW / P3]

**File:** `otp.py:117`, `payments.py:882`

`verify=False` disables TLS certificate verification on outbound HTTP calls to the SMS panel and one payments endpoint. Vulnerable to MITM attacks (CWE-295).

---

### SEC-008 — PII written to server logs [LOW / P3]

**File:** `server.py` lines 329–330, 525

Email, phone, IP address, and user-agent are written to server logs. Logs may be stored, rotated, or accessed by infra tooling — creating unintended PII exposure surfaces (DPDP concern).

---

## 3. What is Clean ✅

- No secrets hardcoded in frontend bundle (only public REACT_APP_* keys) ✅
- `.env` is git-ignored, not committed to repository ✅
- No NoSQL injection risks (typed filters throughout) ✅
- No open redirects or SSRF (all external URLs env-derived) ✅
- Frontend exposes only intentionally public keys (GTM ID, Razorpay public key, backend URL) ✅

---

## 4. Implementation Plan

---

### Task 1 — Server-side price lookup (SEC-001) [P1]
**File:** `payments.py`  
**Effort:** 30 min | **Risk:** Medium (payments flow)

Create a server-side price catalog dict keyed by plan ID:

```python
PLAN_CATALOG = {
    "starter": {"name": "Starter", "amount_paise": 79900},
    "growth":  {"name": "Growth",  "amount_paise": 129900},
    "pro":     {"name": "Pro",     "amount_paise": 249900},
}

ADDON_CATALOG = {
    "whatsapp": {"name": "WhatsApp", "amount_paise": 49900},
    # ...
}
```

In the order endpoint, replace:
```python
# Before
amount_paise = payload.plan_price + sum(payload.addon_prices)

# After
plan = PLAN_CATALOG.get(payload.plan_id)
if not plan:
    raise HTTPException(400, "Invalid plan")
amount_paise = plan["amount_paise"] + sum(
    ADDON_CATALOG[a]["amount_paise"]
    for a in payload.addon_ids
    if a in ADDON_CATALOG
)
```

The existing plan/addon IDs need to be confirmed with the owner before implementation to ensure catalog matches current pricing (₹799/₹1299/₹2499).

---

### Task 2 — Replace CMS credentials + JWT secret (SEC-002) [P1]
**Type:** `.env` change only — no code needed  

**In `backend/.env`:**
```
# Replace these
CMS_JWT_SECRET=replace-with-strong-secret-please   → generate: python3 -c "import secrets; print(secrets.token_hex(32))"
CMS_PASS_1=<current default>                        → strong unique password (16+ chars, mixed)
CMS_PASS_2=<current default>                        → strong unique password (16+ chars, mixed)
```

Then restart backend: `sudo supervisorctl restart backend`

**This is the fastest P1 fix — pure env change, zero code.**

---

### Task 3 — Freshsales webhook signature verification (SEC-003) [P2]
**File:** `server.py` lines 1434–1471  
**Effort:** 15 min

Add a shared secret check at the top of the webhook handler:
```python
FRESHSALES_WEBHOOK_SECRET = os.environ.get("FRESHSALES_WEBHOOK_SECRET", "")

@api_router.post("/webhooks/freshsales/stage")
async def freshsales_stage_webhook(request: Request):
    sig = request.headers.get("X-Freshsales-Signature", "")
    body = await request.body()
    if FRESHSALES_WEBHOOK_SECRET:
        expected = hmac.new(
            FRESHSALES_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise HTTPException(401, "Invalid signature")
    # ... rest of handler
```

Add `FRESHSALES_WEBHOOK_SECRET` to `backend/.env` and configure in Freshsales webhook settings.

---

### Task 4 — Fix CORS to explicit origins (SEC-004) [P3]
**File:** `backend/.env`  
**Type:** `.env` change only

```
# Before
CORS_ORIGINS=*

# After
CORS_ORIGINS=https://www.mygenie.online,https://mygenie.online,https://mygenie-runtime.preview.emergentagent.com
```

Restart backend after change.

---

### Task 5 — Remove AWS comments from .env (SEC-005) [P3]
**File:** `backend/.env`  
**Type:** Manual edit — delete commented lines 12–13 containing AWS credentials.  
If those AWS keys are still in use anywhere, rotate them in AWS IAM first.

---

### Task 6 — TLS verification fix (SEC-007) [P3]
**Files:** `otp.py:117`, `payments.py:882`  
**Effort:** 5 min

```python
# Before
response = requests.post(url, ..., verify=False)

# After
response = requests.post(url, ...)  # default verify=True
```

Note: If the SMS provider uses a self-signed cert, obtain their CA cert and pass `verify="/path/to/ca.pem"` instead.

---

### Task 7 — Minimise PII in logs (SEC-008) [P3]
**File:** `server.py` lines 329–330, 525  
**Effort:** 10 min

Replace full PII values with truncated/masked versions in log statements:
```python
# Before
logger.info("Lead created: email=%s phone=%s", email, phone)

# After
logger.info("Lead created: phone=***%s", phone[-4:])
```

---

## 5. Implementation Order

| Order | Task | Type | Effort | Priority |
|---|---|---|---|---|
| 1 | Replace JWT secret + admin passwords in `.env` | ENV only | 2 min | P1 — do NOW |
| 2 | Server-side price catalog in `payments.py` | Code | 30 min | P1 — before payments go live |
| 3 | Freshsales webhook signature check | Code | 15 min | P2 |
| 4 | CORS explicit origins in `.env` | ENV only | 2 min | P3 |
| 5 | Remove AWS key comments from `.env` | ENV only | 1 min | P3 |
| 6 | TLS `verify=False` fix | Code | 5 min | P3 |
| 7 | PII log masking | Code | 10 min | P3 |

---

## 6. Definition of Done

- [ ] `CMS_JWT_SECRET` is a random 256-bit hex string (not placeholder)
- [ ] `CMS_PASS_1` and `CMS_PASS_2` are strong unique passwords
- [ ] POST `/api/payments/razorpay/order` with tampered `plan_price:1` returns 400 / correct amount
- [ ] POST `/api/webhooks/freshsales/stage` without valid signature returns 401
- [ ] `CORS_ORIGINS` is an explicit list of allowed domains
- [ ] No `verify=False` in any outbound HTTP call
- [ ] No full PII values in server log lines
- [ ] AWS key comments removed from `.env`

---

## 7. Out of Scope

- Penetration testing / dynamic scanning
- WAF / rate limiting (separate infrastructure concern)
- Razorpay webhook signature (already implemented per existing code review)
- Frontend auth (no user login on marketing site)
