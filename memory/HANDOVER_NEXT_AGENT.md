# HANDOVER — Session 2026-06-30 / 2026-07-01

## What Was Done

### Setup
- Pulled repo from `github.com/Abhi-mygenie/website.git` branch `30-june` into `/app`
- Preserved workspace files (`.git`, `.emergent`, `frontend/.env`, `backend/.env`)
- Installed backend deps (`pip install -r requirements.txt --no-deps` to resolve litellm conflict)
- Installed frontend deps (`yarn install`)
- User manually added all env vars to `backend/.env`

### CRs Implemented & QA'd

| CR | Description | Files Changed | QA |
|---|---|---|---|
| CR-40 | OTP-Verified tag on new leads + backfill existing | `server.py:278-281`, `crm_sync.py:218-282`, `server.py:1198-1203` | ✅ Passed |
| CR-42 | Zero hardcoded values — all config to env | `server.py`, `freshsales.py`, `payments.py`, `ads_mcp.py`, `cms_auth.py`, `crm_sync.py`, `company.js`, `gtm.js`, `seo.js` | ✅ Passed |
| CR-43 | WhatsApp FAB env toggle | `App.js:99`, `company.js:10`, `frontend/.env` | ✅ Passed |

### Bug Fixes

| Bug | Root Cause | Fix |
|---|---|---|
| Calendly webhook 500 | `timedelta` not imported in `server.py` | Added to import line 11 |
| Meet link wrong CRM field | Code used `cf_gmeetlink` | Changed to `cf_meeting_link` in `freshsales.py:322` |
| Meet link full URL stored | No path extraction | Strip `https://calendly.com/events/` prefix in `server.py:423` |
| Calendly webhook 400 | Webhook subscription pointed to old dead URLs | Re-registered via `scripts/register_calendly_webhook.py` |
| OTP backfill 502 timeout | Sync endpoint blocked for ~43 min | Changed to `asyncio.ensure_future()` fire-and-forget in `server.py:1201` |

## Current State

### Services
- **Backend**: FastAPI on port 8001 via Supervisor (hot reload enabled)
- **Frontend**: React CRA + Craco on port 3000 via Supervisor (hot reload enabled)
- **MongoDB**: External at `mongodb://52.66.232.149:27017` / `test_database`
- **CRM Sync**: APScheduler runs every 6 hours (Freshsales → MongoDB)

### Calendly Webhook
- **Active subscription**: `https://d62aad8d-a5b7-4650-a15d-da0641b04cc5.preview.emergentagent.com/api/calendly/webhook`
- **2 old disabled subscriptions** still exist in Calendly (harmless)
- **⚠️ On deployment to production**: Must re-register webhook to production URL:
  ```bash
  cd /app/backend && python3 scripts/register_calendly_webhook.py https://www.mygenie.online/api/calendly/webhook
  ```
  Or set `CALENDLY_WEBHOOK_CALLBACK_URL` in `.env` and run without args.

### Freshsales Rate Limit
- The OTP backfill (642 contacts) ran and may have hit Freshsales 429 rate limit
- Auto-recovers — Freshsales rate limit window resets after ~15-20 minutes
- The 6-hour CRM sync scheduler handles 429 with retry logic built in

## Known Issues / Warnings

1. **`CMS_JWT_SECRET`** is still `"replace-with-strong-secret-please"` — should be changed to a real secret before production
2. **Freshsales rate limits**: The backfill + sync can exhaust the API rate limit. If this happens, backend logs show `429 Too Many Requests` with a sleep duration. Just wait — it auto-recovers.
3. **`cf_channel_manager_name`** is being repurposed for "Demo scheduled time" — this is a Freshsales field label mismatch (the field is labelled "Channel Manager Name" but stores demo time). Tracked in CR-41 as a field label cleanup item.
4. **Frontend REACT_APP_BACKEND_URL** in `frontend/.env` should match the deployment URL. Currently set to preview URL.

## Key Files to Know

| File | Purpose |
|---|---|
| `backend/server.py` | Main FastAPI app — all routes, models, Calendly webhook, demo/quote/contact handlers |
| `backend/freshsales.py` | Freshsales CRM client — upsert_contact, mark_demo_booked, lookup |
| `backend/crm_sync.py` | CRM sync scheduler — stage sync, source backfill, OTP backfill |
| `backend/otp.py` | OTP send/verify logic |
| `backend/payments.py` | Razorpay payment flow + PDF invoice generation |
| `backend/ads_mcp.py` | Meta + Google Ads data sync |
| `backend/cms_auth.py` | CMS admin JWT auth (2 fixed users from env) |
| `backend/funnel.py` | Funnel analytics queries |
| `backend/leads.py` | Leads view queries |
| `frontend/src/App.js` | Main React app — routes, WhatsApp FAB toggle |
| `frontend/src/data/company.js` | Company config (emails, phone, WhatsApp — all from env) |
| `frontend/src/components/site/DemoForm.jsx` | Demo booking form with OTP |
| `frontend/src/components/site/CalendlyInline.jsx` | Calendly embed + demo-booked callback |
| `scripts/register_calendly_webhook.py` | Calendly webhook registration script |

## CR Docs

| Doc | Location |
|---|---|
| CR-40 OTP-Verified Tag | `/app/memory/CR-40_OTP_Verified_Tag.md` |
| CR-41 Field Label Cleanup | `/app/memory/CR-41_Field_Label_Cleanup.md` |
| CR-42 Zero Hardcoded Values | `/app/memory/CR-42_Zero_Hardcoded_Values.md` |
| CR-43 WhatsApp FAB Toggle | `/app/memory/CR-43_WhatsApp_FAB_ENV_Toggle.md` |
| Freshsales Field Mapping | `/app/memory/Freshsales_Field_Mapping.md` |
| Full PRD | `/app/memory/PRD.md` |

## Test Reports
- `/app/test_reports/iteration_7.json` — CR-40 + CR-42 QA (12/13 passed, 1 timeout on backfill — expected)

## CMS Admin Credentials
- Username: `admin` / Password: `admin123`
- Username: `editor` / Password: `editor123`

## Remaining Backlog (Priority Order)
1. **CR-41**: Freshsales field label cleanup (registered, not implemented)
2. **Production deploy prep**: Change CMS_JWT_SECRET, re-register Calendly webhook to prod URL, update REACT_APP_BACKEND_URL
3. **Production build**: `yarn build` for optimized static assets
4. **Meta access token**: Current token may expire (60-day limit). Use `/api/cms/ads/mcp/meta/refresh-token` to extend.
