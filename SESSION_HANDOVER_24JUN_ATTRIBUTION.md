# Session Handover — Attribution Intelligence & Production Prep
**Date:** 24 June 2026
**Agent:** E1 (Emergent Labs)
**Session focus:** Production readiness, SEO 301 redirects, beta server debugging, CR-19 Phase 4

---

## 1. What Was Done This Session

### 1.1 SEO Go-Live Checklist Delivered
- Extracted full readiness contract from `readiness.html`
- Provided complete checklist across all 8 sections (GTM, Google Ads, Meta, SEO cutover, Webhooks, Post-deploy verification)
- Clarified `demo_booked` vs `lead_verifided` distinction for Google Ads conversion setup

### 1.2 301 Redirect Files Created
Both files were missing — generated from the 19 old→new URL mappings:

| File | Purpose |
|---|---|
| `/app/frontend/cloudflare-bulk-redirects.csv` | Import directly into Cloudflare → Bulk Redirects |
| `/app/frontend/nginx-redirects.conf` | Include inside nginx `server {}` block |

User provided their live nginx config — 19 `rewrite` directives added before `location /` block. Zero other changes.

### 1.3 Beta Server Bug Fixed — White Screen After Login
**Bug:** `Uncaught TypeError: n is not iterable` — blank page after login on beta.mygenie.online

**Root cause:** Beta server running old backend (pre-CR-18/19). New funnel endpoints returning `{"detail":"Not Found"}`. FastAPI's JSON error body parsed as valid data → `[...object]` spread crashed React.

**Fix (2 files):**
- `frontend/src/pages/LeadsView.jsx` — `safeJson` helper (rejects non-ok responses before parsing)
- `frontend/src/components/funnel/FunnelBySource.jsx` — `Array.isArray(data)` guard

**Server action required:** Pull latest `server.py` to beta. New endpoints are at lines 751, 764, 785 of `server.py`.

### 1.4 Complete Freshsales Custom Field Rename List
Provided full mapping of all 13 `cf_` fields — what they store vs what their Freshsales labels currently say. User can rename in Freshsales Admin → Custom Fields.

### 1.5 Lead Table — New Attribution Columns (Leads Dashboard)
Added 3 new columns + improved Source display:

| Column | Data source | Notes |
|---|---|---|
| Source (badge) | `utm_source` / gclid / fbclid | Colour-coded pill: Google Paid (blue), Meta (indigo), Organic (green), etc. |
| Campaign / Ad Set / Ad | `utm_campaign` / `utm_content` / `utm_ad` | Stacked multi-line cell |
| Search Term | `utm_term` | Monospace chip, Google only |

CSV export updated to include `ad_set`, `ad_name`, `keyword`.

### 1.6 New UTM Parameter — `utm_ad`
- Added `utm_ad` capture to `frontend/src/lib/attribution.js`
- Stored as `ad_name` top-level field in MongoDB lead docs (`leads.py`)
- Mapped to `cf_demo_fixed` in Freshsales (`server.py`)
- Freshsales field rename needed: "DEMO Fixed" → "Ad Name"

### 1.7 CR-19 Phase 4 — Attribution Breakdown Dashboard
Full implementation planning doc created first (`/app/CR-19_Phase4_Attribution_Breakdown.md`), then implemented.

**New endpoint:** `GET /api/cms/funnel/by-attribution?dimension=keyword|ad_set`

**New component:** `frontend/src/components/funnel/AttributionBreakdown.jsx`
- Tab toggle: By Keyword / By Ad Set
- Keyword table: VALUE · SOURCE · LEADS · DEMO SCHED · SCHED% · DEMO GIVEN · GIVEN% · WON · LEAD→WIN%
- Ad Set table: same + SPEND · CPL · CP DEMO · CP WIN (amber columns, from existing spend data)
- Empty state with actionable instruction text
- Skeleton loading rows
- Client-side column sorting (click any header)
- **New data only** — leads without UTM attribution silently excluded

**Wired into** `LeadsView.jsx` below FunnelBySource, respects all existing date/type filters.

### 1.8 Session Handover Documents Created
- `/app/SESSION_HANDOVER_PRODUCTION_PREP.md` — earlier in session
- `/app/PRODUCTION_GOLIVE_HANDOVER.md` — 10-stage production go-live checklist (master doc)

---

## 2. Files Created / Modified This Session

| File | Action | What changed |
|---|---|---|
| `/app/frontend/cloudflare-bulk-redirects.csv` | Created | 19 old→new 301 mappings for Cloudflare import |
| `/app/frontend/nginx-redirects.conf` | Created | 19 rewrite directives for nginx |
| `/app/frontend/src/lib/attribution.js` | Modified | Added `utm_ad` to captured params + return payload |
| `/app/backend/leads.py` | Modified | Added `ad_set`, `keyword`, `ad_name` extraction from `attribution` blob; added to search blob |
| `/app/backend/funnel.py` | Modified | Added `_get_spend_by_adset()` + `get_funnel_by_attribution()` |
| `/app/backend/server.py` | Modified | `utm_ad → cf_demo_fixed` mapping; new `/cms/funnel/by-attribution` route |
| `/app/frontend/src/components/funnel/AttributionBreakdown.jsx` | Created | Full attribution breakdown component |
| `/app/frontend/src/components/funnel/FunnelBySource.jsx` | Modified | `Array.isArray(data)` guard (crash fix) |
| `/app/frontend/src/pages/LeadsView.jsx` | Modified | `safeJson` fix; SourceBadge component; 3 new table columns; AttributionBreakdown wired in |
| `/app/CR-19_Phase4_Attribution_Breakdown.md` | Created | Full implementation plan doc |
| `/app/SESSION_HANDOVER_PRODUCTION_PREP.md` | Created | Earlier session handover |
| `/app/PRODUCTION_GOLIVE_HANDOVER.md` | Created | 10-stage production go-live master checklist |
| `/app/memory/PRD.md` | Updated | Completed features list, backlog updated |

---

## 3. Outstanding Owner Actions (before going live)

### Freshsales — Rename Custom Fields
Go to Freshsales → Admin → Custom Fields → Contacts → rename:

| `cf_` Key | Current Label | Rename To |
|---|---|---|
| `cf_est_name` | AD SET | Ad Set |
| `cf_demo_fixed` | DEMO Fixed | Ad Name |
| `cf_pos_satifcation_level` | Keywords (term) | Search Keyword |
| `cf_outlet_type` | OUTLET TYPE | Outlet Type |
| `cf_sku` | Year of operation | Years in Business |
| `cf_pos_used` | POS USED | Currently Using POS? |
| `cf_pos_name` | POS NAME | Current POS Name |
| `cf_rooms` | OTP verified | OTP Verified |
| `cf_first_interest` | Message | Contact Message |

### Ad URL Tagging (to populate new attribution columns)
```
Meta:   &utm_content={{adset.name}}&utm_ad={{ad.name}}
Google: &utm_content={adgroupname}&utm_ad={creative}&utm_term={keyword}
```

### Beta Server Deploy
```bash
cd /var/www/website
git pull origin main
pip install -r backend/requirements.txt
cd frontend && yarn build
sudo supervisorctl restart backend   # or pm2 / systemctl
```

---

## 4. Pending Issues

### Issue 1: Freshsales Webhook — Cloudflare WAF Block (P2)
- Freshworks servers get 403 Cloudflare Error 1010 when hitting the preview domain
- **Status: BLOCKED** — will resolve naturally once deployed to production domain
- No code fix needed

---

## 5. Upcoming / Future Work

| Task | Priority | Notes |
|---|---|---|
| Production Go-Live | P0 | Checklist: `/app/PRODUCTION_GOLIVE_HANDOVER.md` |
| CR-19 Phase B: Keyword CPL/CPDemo/CPWin | P1 | Needs Google Ads Keyword Performance Report CSV upload (new upload type) |
| CR-15: Zapier Offline Conversions | P1 | 3 Zaps: Demo Scheduled, Demo Given, Purchase → Google OCI + Meta CAPI. Spec: `/app/CR-15_Zapier_Offline_Conversion_Events.md` |
| Ad Name (`utm_ad`) breakdown table | P2 | Deferred until ad URLs updated with `utm_ad` — no data yet |
| CR-19 Phase 4 dimensions (campaign-level cost) | P2 | Campaign breakdown in funnel |
| CloudFront CDN for S3 media | P2 | DNS-level routing for media assets |
| `server.py` refactor into `/routes` | P2 | 1000+ lines — split into CMS, funnel, sync, ad-spend, payments routers |
| Consent Mode v2 in GTM | P1 | Wire localStorage consent vars to all conversion tags |

---

## 6. Key Files Reference

| File | Purpose |
|---|---|
| `/app/PRODUCTION_GOLIVE_HANDOVER.md` | **Master production checklist** — 10 stages, all owners |
| `/app/CR-19_Phase4_Attribution_Breakdown.md` | Attribution breakdown design + implementation plan |
| `/app/SEO_Production_Cutover_Gate.md` | SEO gate + curl QA commands for post-deploy |
| `/app/SEO_Migration_Strategy.md` | Full 301 redirect map + strategy |
| `/app/CR-15_Zapier_Offline_Conversion_Events.md` | Zapier offline conversion spec |
| `/app/frontend/cloudflare-bulk-redirects.csv` | 19 redirects — import to Cloudflare Bulk Redirects |
| `/app/frontend/nginx-redirects.conf` | 19 redirects — include in nginx server block |
| `/app/memory/PRD.md` | Product requirements + backlog |

---

## 7. Architecture State

```
/app/
├── backend/
│   ├── server.py          # FastAPI entrypoint (~1010 lines — refactor pending)
│   ├── funnel.py          # Funnel aggregations (summary, by-source, by-attribution, lost, sync)
│   ├── leads.py           # Lead query engine (ad_set, keyword, ad_name now extracted)
│   ├── ad_spend.py        # CSV parsers (Google UTF-16 LE, Meta UTF-8)
│   ├── crm_sync.py        # Freshsales background sync + backfill
│   ├── freshsales.py      # CRM API wrapper
│   └── storage.py         # S3 config
├── frontend/src/
│   ├── pages/LeadsView.jsx            # CMS dashboard (login + funnel + leads table)
│   ├── components/funnel/
│   │   ├── AttributionBreakdown.jsx   # NEW — By Keyword / By Ad Set tables
│   │   ├── FunnelBySource.jsx         # Per-source funnel + cost metrics
│   │   ├── FunnelPanel.jsx            # Summary funnel panel
│   │   ├── LostPanel.jsx              # Lost leads breakdown
│   │   ├── SyncStatus.jsx             # Freshsales sync status
│   │   └── AdSpendUpload.jsx          # CSV upload UI
│   └── lib/
│       ├── attribution.js             # UTM capture (now includes utm_ad)
│       └── cms/CmsProvider.jsx        # Presigned URL upload flow
├── cloudflare-bulk-redirects.csv      # 19 old→new 301s for Cloudflare
├── nginx-redirects.conf               # 19 old→new 301s for nginx
└── memory/PRD.md
```

---

## 8. Testing State
- **Testing agent:** NOT used (user constraint — manual testing only)
- **API tests:** All endpoints verified via curl ✅
- **UI tests:** Screenshot confirmation ✅
- **Known regressions:** None
- **Mocked integrations:** None

---

## 9. Critical Info for Next Agent

1. **STRICT CONSTRAINT:** User said **no testing agent**. Test only via curl + screenshot tool.
2. Freshsales webhook blocked on preview domain — do not debug, wait for production deploy.
3. Google Ads CSVs export as UTF-16 LE with tabs. Meta as UTF-8 commas. Do NOT change parsers in `ad_spend.py`.
4. `REACT_APP_BACKEND_URL` in `frontend/.env` still points to preview — must be updated to production backend URL before final build.
5. The attribution breakdown tables will show empty state until the user updates their ad URLs with proper UTM params.
6. Next agent should start by asking user what they want to work on (production deploy or next feature).

---

*Prepared by E1, Emergent Labs. 24 June 2026.*
