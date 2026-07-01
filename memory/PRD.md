# MyGenie POS Website — PRD

## Original Problem Statement
Pull code from https://github.com/Abhi-mygenie/website.git (branch: 30-june), set up the project, install dependencies, and make the website run. Then implement CRs 40, 42, 43 and fix bugs found during testing.

## Architecture

| Layer | Technology | Port |
|---|---|---|
| Frontend | React 19 (CRA + Craco) + Tailwind CSS + Radix UI + Framer Motion + Recharts | 3000 |
| Backend | Python FastAPI + Motor (async MongoDB) + APScheduler | 8001 |
| Database | MongoDB (external — configurable via MONGO_URL) | — |
| Process Mgr | Supervisor (backend, frontend, mongodb, nginx-code-proxy) | — |

## Integrations

| Service | Purpose | Config |
|---|---|---|
| Freshsales CRM | Lead sync, contact upsert, lifecycle/stage tracking | FRESHSALES_API_KEY, FRESHSALES_BASE_URL |
| Calendly | Demo booking webhook (invitee.created → meet link + time) | CALENDLY_WEBHOOK_SIGNING_KEY, CALENDLY_API_TOKEN |
| Razorpay | Payment processing (order → verify → webhook) | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET |
| Meta Ads | Ad spend sync via Graph API | META_ACCESS_TOKEN, META_AD_ACCOUNT_ID |
| Google Ads | Ad spend sync via OAuth + MCP | GOOGLE_ADS_* vars |
| OTP/SMS | Phone verification for demo form | SMS_* vars, OTP_SMS_ENABLED |
| AWS S3 | Media/document storage | AWS_* vars |

## CRs Implemented This Session

### CR-40: OTP-Verified Tag + Backfill ✅ QA PASSED
- **Part 1** (`server.py:278-281`): New OTP-verified demo leads get `"OTP-Verified"` tag in Freshsales
- **Part 2** (`crm_sync.py:218-282`): Backfill endpoint tags existing `cf_rooms="Yes"` contacts
- **Async fix**: `POST /api/cms/sync/otp-backfill` now returns instantly (fire-and-forget)

### CR-42: Zero Hardcoded Values ✅ QA PASSED
All hardcoded config extracted to env vars with fallback defaults:
- **Backend (14 vars)**: CRM tags (7), payment currency, invoice footer, Meta Graph API version, CMS session hours, lifecycle map, lost reasons map, Calendly webhook URL
- **Frontend (4 vars)**: GTM allowed hosts, support email, customer support email, privacy email

### CR-43: WhatsApp FAB ENV Toggle ✅ QA PASSED
- `REACT_APP_WHATSAPP_ENABLED=true/false` — toggle FAB visibility
- `REACT_APP_WHATSAPP_NUMBER` — change WhatsApp number without code deploy

## Bug Fixes This Session

| Bug | File | Fix |
|---|---|---|
| `timedelta` not imported → Calendly webhook 500 | `server.py:11` | Added `timedelta` to datetime import |
| Meet link wrong Freshsales field | `freshsales.py:322` | Changed `cf_gmeetlink` → `cf_meeting_link` |
| Meet link stored as full URL | `server.py:423` | Strip `https://calendly.com/events/` prefix, store path only |
| Calendly webhook pointing to old URLs | Infrastructure | Re-registered webhook via `scripts/register_calendly_webhook.py` |

## Freshsales Field Mapping (Current)

### Demo Form → Freshsales Contact

| Website Field | Freshsales API Name | Freshsales Label | Source |
|---|---|---|---|
| name | first_name, last_name | First/Last Name | server.py |
| email | email | Email | server.py |
| phone | mobile_number, work_number | Mobile/Work | server.py |
| city | city | City | server.py + geo lookup |
| business_name | job_title | Job Title | server.py |
| outlet_type | cf_outlet_type | Outlet Type | server.py |
| years_in_business | cf_sku | SKU | server.py |
| using_pos | cf_pos_used | POS Used | server.py |
| current_pos | cf_pos_name | POS Name | server.py |
| otp_verified | cf_rooms | OTP Verified (Yes/No) | server.py |
| IP address | cf_longitude | Longitude | server.py |
| User-Agent | cf_category | Category | server.py |
| first_utm_source | first_source (default: "website") | First Source | server.py |
| last_utm_source | latest_source + last_source | Latest/Last Source | server.py |
| utm_term | keyword + cf_pos_satifcation_level | Keyword + POS Satisfaction | server.py |
| utm_content | cf_est_name | Est Name (AD SET) | server.py |
| utm_ad | cf_contact_person | Contact Person (Ad Name) | server.py |
| fbclid | cf_latitude | Latitude | server.py |
| gclid | cf_pos_type | POS Type | server.py |
| fbp cookie | cf_orders_taken_via | Orders Taken Via | server.py |
| ad_id | cf_self_delivery_take_away | Self Delivery | server.py |
| adset_id | cf_inventory_used | Inventory Used | server.py |
| placement | cf_complete_address | Complete Address | server.py |
| utm_id | cf_account_software_integrated | Account Software | server.py |
| site_source_name | cf_aggreator_management | Aggregator Management | server.py |
| lead_source_id | lead_source_id | Lead Source (auto-derived) | server.py |
| country | country (default: India) | Country | server.py |

### Calendly Webhook → Freshsales Contact

| Data | Freshsales API Name | Label |
|---|---|---|
| Google Meet link (path only) | cf_meeting_link | Meeting Link |
| Demo scheduled time (IST formatted) | cf_channel_manager_name | Channel Manager Name |

### CRM Tags (all from env vars)

| Tag | Env Var | When Applied |
|---|---|---|
| Website Demo Lead | FRESHSALES_TAG_DEMO_LEAD | Every demo form submission |
| OTP-Verified | FRESHSALES_TAG_OTP_VERIFIED | OTP verified leads |
| OTP-Unverified | FRESHSALES_TAG_OTP_UNVERIFIED | OTP not verified leads |
| Buy Online | FRESHSALES_TAG_BUY_ONLINE | Payment/quote with intent=buy |
| Website Quote | FRESHSALES_TAG_QUOTE | Quote requests |
| Website Contact | FRESHSALES_TAG_CONTACT | Contact form submissions |
| Multi-Form | FRESHSALES_TAG_MULTI_FORM | Returning visitors (auto-added on update) |
| Demo Scheduled (Web) | FRESHSALES_DEMO_BOOKED_TAG | Calendly booking completed |

## API Endpoints Summary

### Public
| Method | Path | Purpose |
|---|---|---|
| GET | /api/ | Health check |
| POST | /api/demo-request | Demo form submission |
| POST | /api/otp/send | Send OTP to phone |
| POST | /api/otp/verify | Verify OTP code |
| POST | /api/demo-booked | Mark demo as booked (frontend) |
| POST | /api/calendly/webhook | Calendly invitee.created (HMAC signed) |
| POST | /api/quote | Quote/pricing request |
| POST | /api/contact | Contact form submission |
| POST | /api/webhooks/freshsales/stage | CRM stage change webhook |
| GET | /api/cms/content | Public CMS content |
| POST | /api/payments/razorpay/* | Payment flow (order/verify/webhook) |

### CMS Admin (requires Bearer token)
| Method | Path | Purpose |
|---|---|---|
| POST | /api/cms/login | Admin login → JWT |
| GET | /api/cms/leads | Lead list with filters |
| GET | /api/cms/funnel/* | Funnel analytics (6 endpoints) |
| GET | /api/cms/ads/* | Ads intelligence (8 endpoints) |
| POST | /api/cms/sync/trigger | Manual CRM sync |
| POST | /api/cms/sync/otp-backfill | OTP tag backfill (async) |
| POST | /api/cms/ads/mcp/meta/sync | Meta ads data sync |
| POST | /api/cms/ads/mcp/google/sync | Google ads data sync |

## Environment Variables — Complete Reference

### backend/.env
See `/app/backend/.env` for all values. Key groups:
- **Database**: MONGO_URL, DB_NAME
- **Freshsales CRM**: FRESHSALES_API_KEY, FRESHSALES_BASE_URL, all status/lifecycle IDs, tag names, lifecycle map, lost reasons map
- **Calendly**: CALENDLY_WEBHOOK_SIGNING_KEY, CALENDLY_API_TOKEN, CALENDLY_WEBHOOK_CALLBACK_URL
- **Razorpay**: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
- **Meta Ads**: META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_APP_ID, META_APP_SECRET, META_GRAPH_API_VERSION
- **Google Ads**: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET
- **OTP/SMS**: OTP_SMS_ENABLED, SMS_BASE_URL, SMS_USERNAME, SMS_API_KEY, SMS_SENDER, SMS_ROUTE, SMS_TEMPLATE_ID
- **S3 Storage**: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, AWS_S3_REGION
- **CMS Auth**: CMS_JWT_SECRET, CMS_USER_1, CMS_PASS_1, CMS_USER_2, CMS_PASS_2, CMS_SESSION_HOURS
- **Payments**: PAYMENT_CURRENCY, INVOICE_FOOTER_TEXT, GST_* vars
- **CRM Sync**: CRM_SYNC_ENABLED, BACKFILL_DATE_FROM, SOURCE_SYNC_AFTER_DATE

### frontend/.env
- REACT_APP_BACKEND_URL, WDS_SOCKET_PORT, ENABLE_HEALTH_CHECK
- REACT_APP_WHATSAPP_ENABLED, REACT_APP_WHATSAPP_NUMBER
- REACT_APP_ALLOWED_HOSTS, REACT_APP_SUPPORT_EMAIL, REACT_APP_CUSTOMER_SUPPORT_EMAIL, REACT_APP_PRIVACY_EMAIL

## Backlog

| Priority | Item | Status |
|---|---|---|
| P0 | OTP backfill (~642 contacts) | ✅ Triggered, ran in background |
| P0 | Calendly webhook registration | ✅ Active on preview URL |
| P1 | CR-41: Field Label Cleanup | REGISTERED (see /app/memory/CR-41_Field_Label_Cleanup.md) |
| P2 | Production build optimization (yarn build) | Not started |
| P2 | CMS_JWT_SECRET — change from placeholder to strong secret | Pending |
| P3 | SSL/domain configuration for production | Not started |
