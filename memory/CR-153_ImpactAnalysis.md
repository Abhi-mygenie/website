# CR-153 — Impact Analysis
# ENV-Gated Lead Dashboard

**Date:** 2026-08-26  
**Analyst:** E1  
**Status:** REVISED — original implementation plan has a critical collision risk (see §3)

---

## 1. Scope Audit — What `get_current_admin` Actually Guards

The original CR-153 plan proposed gating the entire `get_current_admin()` dependency.
Investigation reveals this is too broad — `get_current_admin` serves **two separate features**,
not one.

### Category A — Lead Dashboard (37 endpoints) — SHOULD be gated

```
GET  /cms/leads
DEL  /cms/leads/{type}/{id}
GET  /cms/leads/quality-summary
GET  /cms/funnel/summary
GET  /cms/funnel/by-source
GET  /cms/funnel/lost
GET  /cms/funnel/by-attribution
GET  /cms/funnel/by-landing-page
GET  /cms/funnel/by-device
GET  /cms/funnel/by-city
GET  /cms/churn-report
GET  /cms/ads/executive-summary
GET  /cms/ads/recommendations
GET  /cms/ads/mcp/status
POST /cms/ads/mcp/meta/sync
POST /cms/ads/mcp/meta/refresh-token
POST /cms/ads/mcp/google/sync
GET  /cms/ads/adset-performance
GET  /cms/ads/ad-performance
GET  /cms/ads/placement-breakdown
GET  /cms/ads/ai-insights (POST)
POST /cms/ads/strategy-brainstorm
GET  /cms/ads/attribution-by-campaign
GET  /cms/ads/attribution-by-adset
GET  /cms/ads/attribution-by-ad
GET  /cms/ads/cross-channel-summary
GET  /cms/google-ads/auth-url
GET  /cms/google-ads/status
GET  /cms/sync/status
POST /cms/sync/trigger
POST /cms/sync/backfill
POST /cms/sync/source-backfill
POST /cms/sync/otp-backfill
POST /cms/sync/source-sync
POST /cms/ad-spend/upload
GET  /cms/ad-spend/history
DEL  /cms/ad-spend/{upload_id}
```

### Category B — CMS Content Editor (9 endpoints) — MUST NOT be gated

These power the live site's floating CMS admin layer (`CmsAdminLayer.jsx`).
They must remain accessible regardless of dashboard toggle.

```
GET  /cms/me                    → CmsProvider session check
GET  /cms/content/draft         → EditableText draft values
PUT  /cms/content               → Save field edit
POST /cms/publish               → Publish content to live site
GET  /cms/meta                  → CMS metadata
POST /cms/discard               → Discard draft
POST /cms/media/presign         → S3/local upload presign
POST /cms/media/confirm         → Confirm upload
POST /cms/media                 → Upload media file
```

### Category C — Public (4 endpoints) — No auth, completely unaffected

```
POST /cms/login                         → Login endpoint (must stay public)
GET  /cms/content                       → CmsProvider live content (marketing site)
GET  /cms/media/{name}                  → Serve images on live site
GET  /cms/google-ads/oauth-callback     → Google OAuth redirect target
```

---

## 2. Critical Collision Risk — Original Plan vs Reality

### What the original CR-153 plan said

> Add `LEADS_DASHBOARD_ENABLED` check at the top of `get_current_admin()` in `cms_auth.py`.
> "This single change gates ALL `/api/cms/*` endpoints simultaneously."

### Why this breaks the live site

`get_current_admin()` is used by BOTH Category A (dashboard) AND Category B (CMS editor).
If the check is added to `get_current_admin()`, disabling the dashboard would ALSO disable:

- `PUT /cms/content` — admins can no longer edit copy on the live site
- `POST /cms/publish` — cannot publish content updates
- `POST /cms/media/presign` — cannot upload new images via CMS
- All other Category B endpoints

**Result:** Setting `LEADS_DASHBOARD_ENABLED=false` on preview would silently break the
live site CMS editor. This is a MAJOR unintended side effect.

### The correct fix

Create a **new `get_dashboard_admin()` wrapper dependency** that only the Category A (dashboard) 
endpoints use. Category B endpoints keep their existing `get_current_admin()` unchanged.

```python
# cms_auth.py — NEW function (4 lines)
DASHBOARD_ENABLED = os.environ.get("LEADS_DASHBOARD_ENABLED", "true").lower() == "true"

def get_dashboard_admin(admin: str = Depends(get_current_admin)) -> str:
    if not DASHBOARD_ENABLED:
        raise HTTPException(status_code=503, detail="Dashboard disabled")
    return admin
```

Then in `server.py`, the 37 Category A endpoints swap:
```python
# BEFORE (all 37 Category A endpoints):
admin: str = Depends(cms_auth.get_current_admin)

# AFTER:
admin: str = Depends(cms_auth.get_dashboard_admin)
```

Category B endpoints keep `Depends(cms_auth.get_current_admin)` — zero change.

---

## 3. Impact on Each Integration

### 3a. Freshsales

**Lead capture path (UNAFFECTED):**
```
DemoForm submit → POST /api/demo-request → freshsales.upsert_contact()
```
This does NOT use `get_dashboard_admin`. Freshsales contact creation on form submission
continues regardless of `LEADS_DASHBOARD_ENABLED`.

**Dashboard path (GATED):**
```
/leads → GET /api/cms/sync/trigger → crm_sync.run_sync()
```
When dashboard is disabled, CRM sync cannot be triggered manually from the UI.

**Scheduled sync (INDEPENDENT):**
`crm_sync.py` runs on APScheduler (every 6h). It reads `CRM_SYNC_ENABLED` env var,
not `LEADS_DASHBOARD_ENABLED`. The sync job continues running in background even when
dashboard is off. Data is pulled from Freshsales and stored in MongoDB regardless.

**Recommendation:** Document `LEADS_DASHBOARD_ENABLED` and `CRM_SYNC_ENABLED` as
a pair but keep them independent. In "full off" mode, set both to `false`.

---

### 3b. Meta Ads

**Current partial gating (already exists):**
`ads_mcp.py` L21: `META_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")`
`get_status()` returns `{"enabled": False}` if `META_TOKEN` or `META_AD_ACCOUNT_ID` is empty.

**When dashboard is disabled (`LEADS_DASHBOARD_ENABLED=false`):**
- `POST /cms/ads/mcp/meta/sync` → 503 (Category A, gated by `get_dashboard_admin`)
- Meta sync never triggers
- No impact on marketing site

**When dashboard is enabled but Meta keys are missing:**
- `AdsIntelTab` loads, calls `/api/cms/ads/mcp/status`
- Response: `{"meta": {"enabled": false, "message": "META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured"}}`
- Frontend: renders "Connect Meta first" message in the Meta panel
- No crash, no broken UI elsewhere

**Degradation chain:**
```
META_ACCESS_TOKEN missing
  → ads_mcp.get_status().meta.enabled = False
    → AdsIntelTab renders "not configured" state
      → MetaCreativeTable, CrossChannelPanel, PlacementPanel show empty state
        → Site continues working normally
```

---

### 3c. Google Ads

**Current partial gating (already exists):**
`ads_mcp.py` L67: checks `GOOGLE_TOKEN` and `GOOGLE_CUSTOMER`.
`get_status()` returns `{"enabled": False}` if not configured.

**When dashboard is disabled:**
- `POST /cms/ads/mcp/google/sync` → 503
- `GET /cms/google-ads/auth-url` → 503 (Category A)
- `GET /cms/google-ads/oauth-callback` → NOT gated (Category C public) — OAuth flow still completes

**Google OAuth flow consideration:**
The OAuth callback (`/cms/google-ads/oauth-callback`) is a public endpoint. When `LEADS_DASHBOARD_ENABLED=false`, the user cannot initiate the OAuth flow (auth-url endpoint returns 503) but if they somehow had an outstanding OAuth state, the callback would still complete. This is acceptable edge-case behaviour.

**When dashboard is enabled but Google Ads keys are missing:**
- `AdsIntelTab` shows "Connect Google Ads" button
- Google Ads panels render empty state with connect instructions
- No crash

---

### 3d. Lead Capture (DemoForm, OTP, Calendly)

**Zero impact — all lead capture endpoints are outside `/cms/*`:**

```
POST /api/demo-request      → DemoForm submit     — NEVER gated
POST /api/otp/send          → OTP send            — NEVER gated
POST /api/otp/verify        → OTP verify          — NEVER gated
POST /api/demo-booked       → Calendly post-book  — NEVER gated
POST /api/contact           → Contact form        — NEVER gated
POST /api/quote             → Quote form          — NEVER gated
POST /api/calendly/webhook  → Calendly webhook    — NEVER gated
```

These endpoints use no CMS auth and are completely isolated from the dashboard toggle.

---

### 3e. CMS Content Editor (CmsAdminLayer)

**With correct implementation (using `get_dashboard_admin` wrapper):**

The live site CMS editor (`CmsAdminLayer.jsx`) uses Category B endpoints (`/cms/content/draft`, 
`/cms/publish`, `/cms/media/*`). These keep `Depends(cms_auth.get_current_admin)`.
Setting `LEADS_DASHBOARD_ENABLED=false` has ZERO effect on these endpoints.

Admins can still:
- Log in at `/api/cms/login`
- Edit live site content (EditableText fields)
- Publish content updates
- Upload media

**With wrong implementation (gating `get_current_admin` directly):**
All Category B endpoints would return 503. Live site editor broken.

---

## 4. Revised Implementation Plan (5 changes → 6 changes)

The original plan said 5 changes. The collision risk adds one change:

| # | File | Operation | Lines | Revised? |
|---|------|-----------|-------|---------|
| 1 | `backend/cms_auth.py` | **REVISED** — add `get_dashboard_admin()` wrapper (NOT modify `get_current_admin`) | +6 | ✅ Revised |
| 2 | `backend/server.py` | **REVISED** — swap `get_current_admin` → `get_dashboard_admin` on 37 Category A endpoints | ~37 | ✅ Revised |
| 3 | `backend/server.py` | Add `GET /api/cms/config` public endpoint | +8 | Unchanged |
| 4 | `backend/.env` | Add `LEADS_DASHBOARD_ENABLED=true` | +1 | Unchanged |
| 5 | `frontend/src/App.js` | Wrap `/leads` route in `REACT_APP_LEADS_ENABLED !== "false"` check | +2 | Unchanged |
| 6 | `frontend/.env` | Add `REACT_APP_LEADS_ENABLED=true` | +1 | Unchanged |

**Line count revised:** 18 lines → ~55 lines (bulk of change is the 37 endpoint swaps in server.py)

### Change 1 — `cms_auth.py` (revised)

```python
# Add after existing code — do NOT modify get_current_admin()
import os
from fastapi import Depends

DASHBOARD_ENABLED = os.environ.get("LEADS_DASHBOARD_ENABLED", "true").lower() == "true"

def get_dashboard_admin(admin: str = Depends(get_current_admin)) -> str:
    """Extends get_current_admin with dashboard feature flag check."""
    if not DASHBOARD_ENABLED:
        raise HTTPException(status_code=503, detail="Dashboard disabled")
    return admin
```

### Change 2 — `server.py` (revised scope)

All 37 Category A endpoint signatures change from:
```python
admin: str = Depends(cms_auth.get_current_admin)
```
to:
```python
admin: str = Depends(cms_auth.get_dashboard_admin)
```

Category B (9 endpoints) keep `Depends(cms_auth.get_current_admin)` — UNTOUCHED.

### Change 3 — `server.py` — new public endpoint (unchanged)

```python
@api_router.get("/cms/config")
async def cms_config():
    return {"leads_enabled": cms_auth.DASHBOARD_ENABLED}
```

---

## 5. Complete Behaviour Matrix (updated)

| Scenario | Lead capture | CMS editor | Dashboard | Scheduled sync |
|---|---|---|---|---|
| `LEADS_DASHBOARD_ENABLED=true` (default) | ✅ | ✅ | ✅ | ✅ |
| `LEADS_DASHBOARD_ENABLED=false` | ✅ | ✅ | ❌ 503 | ✅ (independent) |
| `LEADS_DASHBOARD_ENABLED=false` + `CRM_SYNC_ENABLED=false` | ✅ | ✅ | ❌ 503 | ❌ skips |
| `LEADS_DASHBOARD_ENABLED=true`, `FRESHSALES_API_KEY` missing | ✅ (MongoDB only) | ✅ | ✅ (CRM col = "—") | ✅ (skips FS) |
| `LEADS_DASHBOARD_ENABLED=true`, `META_ACCESS_TOKEN` missing | ✅ | ✅ | ✅ (Meta = "connect first") | ✅ |
| `LEADS_DASHBOARD_ENABLED=true`, `GOOGLE_ADS_*` missing | ✅ | ✅ | ✅ (Google = "not connected") | ✅ |
| User visits `/leads` when `REACT_APP_LEADS_ENABLED=false` | ✅ | ✅ | `<NotFound />` | ✅ |
| Bot hits `/api/cms/leads` when disabled | ✅ | ✅ | 503 JSON | ✅ |
| Admin edits CMS copy when `LEADS_DASHBOARD_ENABLED=false` | ✅ | ✅ | ❌ 503 | ✅ |

---

## 6. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Original plan gating `get_current_admin` breaks CMS editor | **HIGH** | Certain if original plan followed | Use `get_dashboard_admin` wrapper instead |
| `LEADS_DASHBOARD_ENABLED` set inconsistently between frontend/backend | Medium | Low | Document as a pair in deploy checklist |
| Freshsales scheduled sync continues when dashboard disabled (unexpected data updates) | Low | Possible | Document that `CRM_SYNC_ENABLED` is independent |
| Google OAuth callback unreachable (already public, unaffected) | None | N/A | No action needed |
| `/cms/login` returning 200 when dashboard is disabled (user can "log in" but gets 503 everywhere) | Low | Edge case | Acceptable — frontend route not exposed anyway |

---

## 7. Definition of Done (revised)

- [ ] `LEADS_DASHBOARD_ENABLED=false` → all 37 Category A endpoints return 503
- [ ] `LEADS_DASHBOARD_ENABLED=false` → Category B endpoints (CMS editor) return 200/401 as normal
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `/api/cms/login` still returns token (Category C, public)
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `/api/cms/content` (public) still returns live site content
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `/api/cms/media/{name}` still serves images
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `/api/demo-request` still returns 200 (lead capture)
- [ ] `REACT_APP_LEADS_ENABLED=false` → `/leads` renders `<NotFound />`, login form not shown
- [ ] `REACT_APP_LEADS_ENABLED=true` (default) → dashboard fully functional
- [ ] `GET /api/cms/config` returns `{"leads_enabled": bool}` without authentication
- [ ] CMS editor (EditableText on live site) works regardless of `LEADS_DASHBOARD_ENABLED`
- [ ] All 5 LP pages render correctly regardless of dashboard ENV state

---

## 8. Updated Files List

| File | Change | Note |
|---|---|---|
| `backend/cms_auth.py` | Add `get_dashboard_admin()` after existing code | +6 lines |
| `backend/server.py` | Swap `get_current_admin` → `get_dashboard_admin` on 37 endpoints | ~37 lines |
| `backend/server.py` | Add `GET /api/cms/config` endpoint | +8 lines |
| `backend/.env` | Add `LEADS_DASHBOARD_ENABLED=true` | +1 line |
| `frontend/src/App.js` | Conditional `/leads` route | +2 lines |
| `frontend/.env` | Add `REACT_APP_LEADS_ENABLED=true` | +1 line |

*Impact analysis written 2026-08-26. Revises original CR-153 implementation plan. Critical change: use `get_dashboard_admin` wrapper dependency, NOT `get_current_admin` modification.*
