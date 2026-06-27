# Agent Handover — 27 June 2026

**Prepared by:** E1, Emergent Labs
**For:** Next Agent
**Language:** English only

---

## 1. PRODUCT OVERVIEW

**MyGenie POS** — restaurant/hospitality POS SaaS (India). Marketing website + internal CRM operations dashboard.

| Layer | Tech | Notes |
|---|---|---|
| Frontend | React 19 + CRACO + Tailwind | `yarn`, not npm |
| Backend | FastAPI on port 8001, all routes `/api` | Hot reload via supervisor |
| DB | MongoDB via `MONGO_URL` env var | External: 52.66.232.149:27017, DB: test_database |
| Live URL | `process.env.REACT_APP_BACKEND_URL` | Never hardcode |
| CMS login | `/leads` → admin / admin123 | |

---

## 2. WHAT WAS BUILT THIS SESSION (27 Jun 2026)

| CR | What | Files Changed |
|---|---|---|
| CR-25 | 5 new attribution fields (ad_id, adset_id, placement, utm_id, site_source_name) + cf_demo_fixed bug fix | `attribution.js`, `server.py`, `crm_sync.py` |
| CR-26 | Source sync (pull all contacts where first_source not null after Jun 20), delete button, hardcoding removal, Sync CRM button | `crm_sync.py`, `server.py`, `payments.py`, `LeadsView.jsx`, `.env` |
| CR-27 | Phase G: 3-level attribution stitching (campaign/adset/ad → CRM outcomes) | `funnel.py`, `server.py`, `CampaignTable.jsx`, `AdSetTable.jsx`, `AdPerformanceTable.jsx`, `AdsIntelTab.jsx` |
| CR-28 | gclid → cf_pos_type (fix latest_source pollution), "New" stage badge, Meta vs Google cross-channel panel | `server.py`, `crm_sync.py`, `LeadsView.jsx`, `CrossChannelPanel.jsx`, `AdsIntelTab.jsx` |

---

## 3. KEY FILES

```
/app/backend/
  server.py              — All API endpoints, _attribution_to_crm(), _derive_lead_source_id()
  funnel.py              — Funnel aggregation + attribution stitching (CR-27) + cross-channel (CR-28)
  ads_mcp.py             — Meta Graph API v21.0 + Google Ads GAQL sync
  crm_sync.py            — Freshsales → MongoDB sync (stage-based + source sync CR-26)
  recommendations.py     — Rule-based signals + Claude Sonnet Strategy Lab
  freshsales.py          — Freshsales CRM REST (upsert_contact, get_contacts_by_status)
  payments.py            — Razorpay + GST invoicing

/app/frontend/src/
  lib/attribution.js     — UTM + ad ID capture (CR-25: ad_id, adset_id, placement, utm_id, site_source_name)
  pages/LeadsView.jsx    — Leads table + funnel + Sync CRM button + delete button (CR-26)
  components/ads/
    AdsIntelTab.jsx      — Main container, fetches attribution data + passes to all panels
    CampaignTable.jsx    — Campaign table with 6 CRM teal columns (CR-27)
    AdSetTable.jsx       — Ad set table with CRM columns (CR-27)
    AdPerformanceTable.jsx — Individual ad table with CRM columns (CR-27)
    CrossChannelPanel.jsx — Meta vs Google comparison with winner badges (CR-28)
    ExecutiveSummary.jsx  — 6 KPI cards
    PlacementPanel.jsx   — Meta placement breakdown
    LeadQualityPanel.jsx  — Lead quality scoring
    AiRecommendations.jsx — Rule-based signals + LLM
    StrategyLabPanel.jsx  — Claude Sonnet strategic hypotheses

/app/docs/
  Freshsales_Field_Contract_v2.md — Source of truth for all cf_ field mappings
  CR-25_Attribution_Field_Expansion.md — CR-25 plan
  CR-26_Sync_Overhaul_Plan.md — CR-26 plan
  CR-27_Phase_G_Attribution_Stitching.md — CR-27 plan

/app/frontend/public/docs/
  field-contract.html    — Styled HTML of field contract (live labels from Freshsales API)
  cr-25.html             — Styled HTML of CR-25
```

---

## 4. FRESHSALES FIELD MAPPING (v2.1)

Full contract: `/app/Freshsales_Field_Contract_v2.md` and `/docs/field-contract.html`

**20 cf_ fields mapped by code.** Key additions this session:

| cf_ field | Stores | CR |
|---|---|---|
| `cf_self_delivery_take_away` | ad_id (Meta/Google ad creative ID) | CR-25 |
| `cf_inventory_used` | adset_id (Meta/Google ad group ID) | CR-25 |
| `cf_complete_address` | placement (Feed/Reels/Stories) | CR-25 |
| `cf_account_software_integrated` | utm_id (campaign numeric ID) | CR-25 |
| `cf_aggreator_management` | site_source_name (facebook/instagram/google) | CR-25 |
| `cf_contact_person` | event_id / utm_ad (replaces cf_demo_fixed) | CR-25 |
| `cf_pos_type` | gclid (Google Click ID) | CR-28 |

**Spare fields remaining:** `cf_next_step` (text) — 1 only.

**CRITICAL:** Freshsales silently drops values written to dropdown fields. Never write free text to dropdown cf_ fields. See Field Contract Section 5 for the full list.

---

## 5. CRM SYNC ARCHITECTURE

### Regular sync (`_run`, every 6 hours)
- Loops through 4 stages: demo_scheduled, demo_given, won, lost
- Fetches contacts by `contact_status_id`
- Upserts to `backfilled_leads`

### Source sync (`run_source_sync`, manual via "Sync CRM" button or `/api/cms/sync/source-sync`)
- Fetches all contacts where `first_source IS NOT NULL` AND `created_at > SOURCE_SYNC_AFTER_DATE` (default: 2026-06-20)
- Compares with MongoDB to find gap contacts (missing attribution)
- Does individual GET per gap contact to fetch full data (native + all cf_ fields)
- Last run: 127 discovered, 115 gap synced, 0 errors, ~5 min

### Manual sync trigger (`/api/cms/sync/trigger`)
- Runs stage sync first, then source sync sequentially
- Called by "Sync CRM" button in /leads header

---

## 6. ATTRIBUTION STITCHING (Phase G — CR-27)

Three endpoints join `backfilled_leads` (CRM outcomes) with `ad_spend` (spend data):

| Endpoint | Join Level | Join Keys |
|---|---|---|
| `GET /api/cms/ads/attribution-by-campaign` | Campaign | first_campaign (text) → campaign (text) OR campaign_id (numeric for Google) + fuzzy " - Copy" handling |
| `GET /api/cms/ads/attribution-by-adset` | Ad Set | adset_id (numeric, CR-25) → adset_id OR ad_set (text) → ad_set |
| `GET /api/cms/ads/attribution-by-ad` | Ad | ad_id (numeric, CR-25) → ad_id OR keyword (text) → ad_name |

**Current match rates:** Campaign 80%, Ad Set 29%, Ad 33%. Will reach 100% once Meta/Google URL templates take effect on new leads.

---

## 7. ENV VARIABLES ADDED THIS SESSION

```
SOURCE_SYNC_AFTER_DATE=2026-06-20
BACKFILL_DATE_FROM=2025-07-01
BACKFILL_DATE_TO=
DEFAULT_COUNTRY=India
FRESHSALES_STATUS_PAYMENT_AWAITED=402001783018
FRESHSALES_LEAD_SOURCE_PAID_SEARCH=402001798783
FRESHSALES_LEAD_SOURCE_FACEBOOK_LEAD=402002468721
FRESHSALES_LEAD_SOURCE_SOCIAL_MEDIA=402001798785
FRESHSALES_LEAD_SOURCE_DISPLAY=402001798786
FRESHSALES_LEAD_SOURCE_EMAIL=402001798777
FRESHSALES_LEAD_SOURCE_REFERRAL=402001798781
FRESHSALES_LEAD_SOURCE_ORGANIC=402001798776
FRESHSALES_LEAD_SOURCE_WEB=402001798775
FRESHSALES_LEAD_SOURCE_DIRECT=402001798782
```

---

## 8. OWNER ACTIONS COMPLETED
- ✅ Meta URL template updated (fbclid + ad_id + adset_id + placement + utm_id + site_source_name)
- ✅ Google Ads tracking template set at account level
- ✅ All backend .env credentials filled (Freshsales, Meta, Google Ads, Razorpay, SMS, S3)

## OWNER ACTIONS STILL PENDING
- Relabel 7 cf_ fields in Freshsales Admin (see `/docs/field-contract.html` Section 8)
- Cloudflare WAF exception for `/api/calendly/webhook`
- sGTM event_id dedup fix

---

## 9. KNOWN ISSUES / WARNINGS

1. **Freshsales 429 rate limit** — aggressively rate-limits after ~30 requests. Add `asyncio.sleep(2)` between calls.
2. **Google Ads `login_customer_id`** — Do NOT set it. Account 6928859217 is directly accessible.
3. **`cf_latitude`, `cf_longitude`, `cf_category` are repurposed** — store fbclid, IP, User-Agent respectively. Do not rename.
4. **`cf_demo_fixed` is ABANDONED** — dropdown, silently drops text. Use `cf_contact_person` instead.
5. **Leads table shows 0 on preview** — Normal. `demo_requests`/`quotes`/`contact_messages` are empty on preview (form submissions go to production). `backfilled_leads` has 1,387 contacts (from CRM sync).
6. **Source sync date cutoff** — `SOURCE_SYNC_AFTER_DATE=2026-06-20` limits scope. Adjust in .env if you need older contacts.

---

## 10. NEXT TASKS (PRIORITY ORDER)

| # | Task | Effort | Notes |
|---|---|---|---|
| 1 | **Strategy Lab persistence** — save hypotheses to MongoDB collection, add list endpoint | 1-2 hrs | Currently ephemeral (frontend state only) |
| 2 | **Budget Reallocation Advisor** — auto-suggest shifting spend from high-CPL to low-CPL campaigns | 2-3 hrs | Data ready from cross-channel panel |
| 3 | **Weekly Slack/email digest** — automated CPL/Won summary per channel | 3-4 hrs | Needs SendGrid/Resend integration |
| 4 | **Blog per-article CRUD** — create/edit/delete posts via CMS | 3-4 hrs | Index copy wired, full post management deferred |
| 5 | **CR-13: Post-payment onboarding** — Thank You page, setup brief | 4-6 hrs | Blocked on owner POS API endpoint |
| 6 | **CR-15: Zapier Offline Conversions** — Demo Scheduled/Given/Purchase → Google Ads OCI + Meta CAPI | 4-6 hrs | Blocked on owner Freshsales field audit |

---

## 11. API ENDPOINTS (complete list of new ones this session)

```
# CR-25 (no new endpoints — changes to existing _attribution_to_crm)

# CR-26
POST /api/cms/sync/source-sync          — Trigger source sync (first_source not null after date)
POST /api/cms/sync/trigger              — Stage sync + source sync (both sequential)
DELETE /api/cms/leads/{type}/{id}        — Delete lead from MongoDB only

# CR-27 Phase G
GET /api/cms/ads/attribution-by-campaign — CRM outcomes joined to ad spend by campaign
GET /api/cms/ads/attribution-by-adset   — CRM outcomes joined to ad spend by ad set
GET /api/cms/ads/attribution-by-ad      — CRM outcomes joined to ad spend by ad

# CR-28
GET /api/cms/ads/cross-channel-summary  — Meta vs Google side-by-side with winners
```

---

## 12. MONGODB COLLECTIONS

```
backfilled_leads      — 1,387 contacts synced from Freshsales (full attribution after CR-26)
ad_spend              — Meta API + Google Ads rows (campaign/adset/ad/placement levels)
demo_requests         — Web form submissions (empty on preview, populated on production)
quotes                — Quote/buy form submissions
contact_messages      — Contact form submissions
crm_sync_log          — Sync audit log
crm_stage_events      — Freshsales webhook stage events
google_ads_tokens     — OAuth refresh tokens
```

---

*Handover document — 27 June 2026 by E1, Emergent Labs.*
*Next agent: respond in English only. Read `/app/memory/test_credentials.md` for all credentials.*
