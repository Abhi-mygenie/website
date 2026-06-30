# CR-24 — Ads Intelligence Platform
## G1 Discovery & Impact Analysis

**Date:** 2026-06-26
**Status:** G1 ✅ Complete — Approved for G2 Planning
**Prepared by:** E1, Emergent Labs

---

## Requirement Summary

Build an Ads Intelligence layer on top of existing MongoDB leads + Freshsales CRM + ad spend data,
connecting Meta Ads (via Meta MCP `mcp.facebook.com/ads`) and Google Ads (via Google Ads MCP) so the
team can answer: **which rupee of ad spend produces a real paying customer.**

## Current State

### Already Built (reuse everything)
| Asset | File | Reuse |
|---|---|---|
| 6-stage funnel (Lead→OTP→Demo Sched→Demo Given→Won→Lost) | `funnel.py` + `FunnelPanel` | ✅ Direct reuse |
| Funnel by source (Google/Meta/Direct) + CPL | `funnel.py` + `FunnelBySource` | ✅ Direct reuse |
| Funnel by keyword + ad_set + CPL/CP-Win | `funnel.py` + `AttributionBreakdown` | ✅ Extend with signals |
| Ad spend CSV upload (Google Campaign/Keywords + Meta Campaign/AdSet) | `ad_spend.py` + `AdSpendUpload` | ✅ Extend parsers |
| Full attribution per lead (utm_term, utm_content, utm_ad, gclid, fbclid, device, landing_page, city) | Every lead doc | ✅ Mine for new dimensions |
| Lost reason breakdown | `funnel.py` + `LostPanel` | ✅ Direct reuse |
| Internal leads panel at `/leads` | `LeadsView.jsx` | ✅ Add tab |

### MongoDB Collections Available
- `demo_requests`, `quotes`, `contact_messages`, `backfilled_leads` — all have full `attribution` object
- `ad_spend` — campaign/ad_set/keyword/spend/impressions/clicks per CSV upload
- `crm_stage_events`, `crm_sync_log` — CRM sync tracking

### Attribution Fields Available Per Lead
```
attribution.utm_term        → keyword (Google bid keyword)
attribution.utm_content     → ad set name
attribution.utm_ad          → ad/creative name
attribution.gclid           → Google Click ID
attribution.fbclid          → Facebook Click ID
attribution.landing_page    → /demo | /petpooja-alternative | / etc.
attribution.device_type     → mobile | desktop
attribution.device_os       → Android | iOS | Windows | macOS
attribution.browser         → Chrome | Safari | Firefox etc.
attribution.language        → en-IN | hi | etc.
attribution.pages_viewed    → integer
attribution.time_on_site    → seconds
geo.city / doc.city         → city name (IP-based or typed)
```

## Gaps Identified
1. No search terms (actual user query vs bid keyword) — needs new CSV parser
2. No ad-copy level data (headlines, CTR) — needs new CSV parser
3. No Meta placement breakdown — needs new CSV parser
4. No Meta ad-level data (frequency, reach per ad) — needs new CSV parser
5. `landing_page` + `device_type` + `city` captured but not used in funnel queries
6. No rules engine for SCALE/PAUSE/BLOCK/FATIGUED signals
7. No AI/LLM recommendation layer
8. No Meta MCP client
9. No Google Ads MCP client

## Credentials Required (Owner)
| Key | Where | Needed For |
|---|---|---|
| `META_ACCESS_TOKEN` | Meta Business Manager → System Users → Generate Token | Phase 3 |
| `META_AD_ACCOUNT_ID` | Meta Ads Manager → Account overview (format: `act_XXXXXXXXX`) | Phase 3 |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads Manager → Admin → API Center | Phase 4 |
| `GOOGLE_ADS_CUSTOMER_ID` | Google Ads Account ID (format: `XXX-XXX-XXXX`) | Phase 4 |

## Files to Modify (6) + Create (8)
See `CR-24_Implementation_Plan.md` for exact code changes.

---
*G1 complete. Implementation plan in CR-24_Implementation_Plan.md.*
