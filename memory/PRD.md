# MyGenie POS — Product Requirements Document

## Project Overview
Full-stack marketing website + CRM operations platform for MyGenie POS — a hospitality point-of-sale system targeting restaurants, cafes, resorts, hotel chains across India.

**Live production:** https://www.mygenie.online
**Stack:** React 19 (CRACO) + FastAPI + MongoDB + Freshsales CRM + Razorpay + AWS S3

---

## What's Been Implemented (latest)

| CR | What | Status |
|---|---|---|
| CR-1 through CR-28 | See full list in previous PRD | All COMPLETE ✅ |
| **CR-28 update** | Cross-channel panel: 4 cost-per-stage metrics (Cost/Book Demo, Cost/Scheduled, Cost/Demo Given, Cost/Won) | **COMPLETE ✅ (27 Jun)** |
| **CR-29** | Ads Intelligence: Live Filter + Cross-Contamination Fix + Landing Page & Device Gaps | **COMPLETE ✅ (27 Jun)** |

### CR-29 Details (27 Jun 2026)
- **Part 1 — Live Only Toggle:** Backend `status` param on 4 endpoints + frontend toggle. Campaigns 20→5, AdSets 42→6 when filtered
- **Part 2 — Cross-Contamination Fix:** Added `source=google_paid` to KeywordIntelTable, `source=meta` to MetaCreativeTable
- **Part 3 — Landing Page:** Included homepage `/` (was excluded), added context note
- **Part 4 — Device Breakdown:** Added `backfilled_excluded` count + context note

### Files Modified (CR-29)
- `backend/funnel.py` — `_status_filter()`, status param on 4 functions, landing page `/` inclusion, backfilled_count
- `backend/server.py` — status query param on 4 endpoints
- `frontend/src/components/ads/AdsIntelTab.jsx` — liveOnly state + toggle + prop passing
- `frontend/src/components/ads/CampaignTable.jsx` — client-side liveOnly filter
- `frontend/src/components/ads/AdSetTable.jsx` — liveOnly → status param
- `frontend/src/components/ads/AdPerformanceTable.jsx` — liveOnly → status param
- `frontend/src/components/ads/PlacementPanel.jsx` — liveOnly → status param
- `frontend/src/components/ads/KeywordIntelTable.jsx` — source=google_paid
- `frontend/src/components/ads/MetaCreativeTable.jsx` — source=meta
- `frontend/src/components/ads/LandingPagePanel.jsx` — "/" → "/ (Homepage)" + note
- `frontend/src/components/ads/DeviceCityPanel.jsx` — backfilled note

---

## Next Tasks (Priority Order)
1. Strategy Lab persistence — save hypotheses to MongoDB (1-2 hrs)
2. Budget Reallocation Advisor — auto-suggest spend shifts (2-3 hrs)
3. CR-12 Pricing expansion — blocked on owner confirmations
4. CR-10 Razorpay payment — blocked on keys
5. Blog per-article CRUD

---

*Updated by E1, Emergent Labs. 27 June 2026.*
