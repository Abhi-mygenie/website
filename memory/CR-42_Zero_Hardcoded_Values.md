# CR-42: Zero Hardcoded Values — Full ENV Extraction

## Date: 2026-06-30
## Status: IMPLEMENTED ✅
## Priority: P1 (config hygiene / multi-environment readiness)

---

## Problem Statement

Deep scan revealed multiple hardcoded values across backend and frontend that should be
configurable via environment variables. Any value that could change between environments
(dev/staging/production) or based on business decisions must live in `.env`, not in code.

**Principle: ZERO hardcoded config in code. Everything in ENV.**

---

## Part A — Calendly Webhook URL (P0 — DONE)

| Item | Detail |
|---|---|
| File | `backend/.env` |
| Change | Add `CALENDLY_WEBHOOK_CALLBACK_URL` |
| Status | ✅ Webhook registered manually for current env. ENV var needs to be added for future deploys |

---

## Part B — Backend Hardcoded Values

### B1: Payment Currency (payments.py)

| Line(s) | Current | Env Var | Default |
|---|---|---|---|
| 116, 147, 182 | `"INR"` hardcoded | `PAYMENT_CURRENCY` | `INR` |

### B2: Invoice Footer (payments.py)

| Line | Current | Env Var | Default |
|---|---|---|---|
| 817 | `"support@mygenie.in  |  mygenie.in"` | `INVOICE_FOOTER_TEXT` | current value |

### B3: Meta Graph API Version (ads_mcp.py)

| Line | Current | Env Var | Default |
|---|---|---|---|
| 20 | `"https://graph.facebook.com/v21.0"` | `META_GRAPH_API_VERSION` → build URL dynamically | `v21.0` |

### B4: CRM Tags (server.py, freshsales.py)

| Line | Current Value | Env Var | Default |
|---|---|---|---|
| server.py:278 | `"Website Demo Lead"` | `FRESHSALES_TAG_DEMO_LEAD` | `Website Demo Lead` |
| server.py:278 | `"OTP-Verified"` | `FRESHSALES_TAG_OTP_VERIFIED` | `OTP-Verified` |
| server.py:278 | `"OTP-Unverified"` | `FRESHSALES_TAG_OTP_UNVERIFIED` | `OTP-Unverified` |
| server.py:521 | `"Buy Online"` | `FRESHSALES_TAG_BUY_ONLINE` | `Buy Online` |
| server.py:521 | `"Website Quote"` | `FRESHSALES_TAG_QUOTE` | `Website Quote` |
| server.py:579 | `"Website Contact"` | `FRESHSALES_TAG_CONTACT` | `Website Contact` |
| freshsales.py:211 | `"Multi-Form"` | `FRESHSALES_TAG_MULTI_FORM` | `Multi-Form` |

### B5: CMS Session Duration (cms_auth.py)

| Line | Current | Env Var | Default |
|---|---|---|---|
| 14 | `SESSION_HOURS = 12` | `CMS_SESSION_HOURS` | `12` |

### B6: Lifecycle + Lost Reason Maps (crm_sync.py)

| Lines | Current | Env Var | Status |
|---|---|---|---|
| 34-36 | `{403021121245: "lead", ...}` | `FRESHSALES_LIFECYCLE_MAP` | ✅ Env fallback exists — remove hardcoded defaults |
| 42-51 | `{403021121249: "Not able to reach", ...}` | `FRESHSALES_LOST_REASONS` | ✅ Env fallback exists — remove hardcoded defaults |

---

## Part C — Frontend Hardcoded Values

### C1: GTM Allowed Hosts (gtm.js)

| Line | Current | Env Var | Default |
|---|---|---|---|
| 15 | `["www.mygenie.online", "mygenie.online"]` | `REACT_APP_ALLOWED_HOSTS` (comma-separated) | current values |

### C2: Company Contact Info (company.js, seo.js)

| File:Line | Current | Env Var |
|---|---|---|
| company.js:5 | `support@mygenie.online` | `REACT_APP_SUPPORT_EMAIL` |
| company.js:6 | `customersupport@mygenie.online` | `REACT_APP_CUSTOMER_SUPPORT_EMAIL` |
| company.js:7 | `support@mail.mygenie.online` | `REACT_APP_PRIVACY_EMAIL` |
| seo.js:24 | `support@mygenie.online` | (same as above) |

---

## Implementation Plan

### Step 1: Backend .env additions
Add all new env vars with current hardcoded values as defaults to `backend/.env`

### Step 2: Backend code changes
Replace each hardcoded value with `os.environ.get("ENV_VAR", "default")`

### Step 3: Frontend .env additions
Add `REACT_APP_*` vars to `frontend/.env`

### Step 4: Frontend code changes
Replace hardcoded values with `process.env.REACT_APP_*`

### Step 5: Validation
- Verify all existing behavior unchanged (defaults match current values)
- Test with modified env vars to confirm they take effect

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Missing env var on deploy | LOW | All env vars have sensible defaults matching current behavior |
| Typo in env var name | LOW | Use consistent naming convention (FRESHSALES_TAG_*, PAYMENT_*, etc.) |
| Breaking existing flows | ZERO | Defaults = current hardcoded values, so behavior is identical without env changes |

---

## Files Modified (estimated)

| File | Changes |
|---|---|
| `backend/.env` | +15 new vars |
| `backend/server.py` | ~7 tag strings → env reads |
| `backend/freshsales.py` | 1 tag string → env read |
| `backend/payments.py` | 3 currency + 1 footer → env reads |
| `backend/ads_mcp.py` | 1 API version → env read |
| `backend/cms_auth.py` | 1 session hours → env read |
| `backend/crm_sync.py` | Remove hardcoded defaults (env fallbacks already exist) |
| `frontend/.env` | +4 new vars |
| `frontend/src/lib/gtm.js` | 1 hosts array → env read |
| `frontend/src/data/company.js` | 3 emails → env reads |
| `frontend/src/lib/seo.js` | 1 email → env read |

---

*CR-42 registered: 2026-06-30. Agent: E1, Emergent Labs.*
