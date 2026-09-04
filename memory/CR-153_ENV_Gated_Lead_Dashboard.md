# CR-153 — ENV-Gated Lead Dashboard (Meta + Google Ads + Freshsales)

**Type:** Feature / ENV Control
**Date Raised:** 2026-08-26
**Impact Analysis:** 2026-08-26 — see CR-153_ImpactAnalysis.md — REVISED implementation plan
**Status:** OPEN — ready to build
**Priority:** P1 — Security / Environment hygiene
**Improves:** Deployment safety · Preview isolation · Production control

---

## 1. Problem Statement

The lead dashboard at `/leads` (LeadsView, Ads Intelligence, Funnel, Churn) is always accessible to anyone who knows the URL, in every environment — preview pods, beta, production. There is no master toggle.

The individual integrations (Meta, Google Ads, Freshsales) already have partial ENV gating but each fails independently. There is no single switch that disables the entire dashboard without code changes.

**Requirement:** A single ENV variable that:
1. Hides `/leads` route from the frontend
2. Returns 503 on all `/api/cms/*` backend endpoints
3. Does NOT affect lead capture (`/api/demo-request`, OTP, Calendly) in any way
4. Does NOT break the marketing site or any LP pages

---

## 2. Architecture — What Already Exists

### Already ENV-gated (partial, per-integration)

| Integration | ENV var checked | File | Behaviour if missing |
|---|---|---|---|
| Freshsales | `FRESHSALES_API_KEY` | `freshsales.py` L28/L36 `is_enabled()` | Returns early, lead saved to MongoDB only |
| Meta Ads | `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` | `ads_mcp.py` L60 `get_status()` | Returns `{"enabled": False, "message": "..."}` |
| Google Ads | `GOOGLE_ADS_DEVELOPER_TOKEN` + `GOOGLE_ADS_CUSTOMER_ID` | `ads_mcp.py` L67 | Returns `{"enabled": False}` |
| CRM sync scheduler | `CRM_SYNC_ENABLED` | `crm_sync.py` | Sync job skips |
| GTM (frontend) | `REACT_APP_GTM_ID` + `REACT_APP_ALLOWED_HOSTS` | `gtm.js` L18 `gtmAllowed()` | GTM not injected |

### Not gated (the actual gap)

| Gap | Current behaviour |
|---|---|
| `/leads` route | Always accessible — `App.js` has `<Route path="/leads">` with no ENV check |
| All `/api/cms/*` endpoints | Always running — login, leads, funnel, sync, ads-mcp |
| Frontend bundle | `LeadsView` always in App.js lazy bundle |

### Critical separation (must be preserved)

```
Lead CAPTURE  →  /api/demo-request  →  ALWAYS ON  (never gated)
Lead VIEWING  →  /api/cms/*         →  GATED by LEADS_DASHBOARD_ENABLED
```

The DemoForm, OTP verification, and Calendly flows are completely independent.
Disabling the dashboard must never affect lead capture.

---

## 3. ENV Variables Required

### Backend — `/app/backend/.env`

```
# Master toggle for lead dashboard + CMS endpoints
LEADS_DASHBOARD_ENABLED=true

# Per-integration (already exist — document as a group)
CRM_SYNC_ENABLED=true           # independent: controls Freshsales pull scheduler
FRESHSALES_API_KEY=             # if empty → freshsales.is_enabled() returns False
META_ACCESS_TOKEN=              # if empty → Meta ads panel shows "connect first"
META_AD_ACCOUNT_ID=             # if empty → Meta ads panel shows "connect first"
GOOGLE_ADS_DEVELOPER_TOKEN=     # if empty → Google ads panel shows "not connected"
GOOGLE_ADS_CUSTOMER_ID=         # if empty → Google ads panel shows "not connected"
```

### Frontend — `/app/frontend/.env`

```
# Must match backend LEADS_DASHBOARD_ENABLED
REACT_APP_LEADS_ENABLED=true
```

**Note:** Both must be set together. Backend is the authority; frontend is for UX-layer hiding only (prevents lazy bundle load).

---

## 4. Implementation Plan — 5 Changes

### Change 1 — Backend: `cms_auth.py` — add `get_dashboard_admin` wrapper

**⚠️ REVISED from original plan** — do NOT modify `get_current_admin()` directly.
That would break the live site CMS editor (EditableText, publish, media upload).

Instead, add a new wrapper dependency after the existing code:

```python
DASHBOARD_ENABLED = os.environ.get("LEADS_DASHBOARD_ENABLED", "true").lower() == "true"

def get_dashboard_admin(admin: str = Depends(get_current_admin)) -> str:
    """Extends get_current_admin with dashboard feature flag check."""
    if not DASHBOARD_ENABLED:
        raise HTTPException(status_code=503, detail="Dashboard disabled")
    return admin
```

**Effect:** Only endpoints that use `Depends(cms_auth.get_dashboard_admin)` are gated.
CMS editor endpoints that use `Depends(cms_auth.get_current_admin)` are completely unaffected.

### Change 2 — Backend: `server.py` — swap dependency on 37 endpoints

**⚠️ REVISED from original plan** — only Category A (dashboard) endpoints get swapped.
Category B (CMS editor) endpoints keep `get_current_admin` unchanged.

All 37 lead/funnel/ads/sync/churn endpoints change:
```python
# BEFORE
admin: str = Depends(cms_auth.get_current_admin)
# AFTER
admin: str = Depends(cms_auth.get_dashboard_admin)
```

Category B (CMS editor — 9 endpoints) keep `get_current_admin` untouched.
See CR-153_ImpactAnalysis.md §1 for full category split.

**File:** `backend/server.py`  
**Where:** After health check endpoint  
**What:** Public (no auth) endpoint that returns dashboard availability

```python
@api_router.get("/cms/config")
async def cms_config():
    """Public endpoint — returns dashboard feature flags. No auth required."""
    return {
        "leads_enabled": os.environ.get("LEADS_DASHBOARD_ENABLED", "true").lower() == "true",
    }
```

**Why:** Frontend queries this on page load to decide whether to show the leads route. Avoids hardcoding the decision only in frontend env (which can be stale in prerendered HTML).

### Change 3 — Backend: `.env` — add new key

```
LEADS_DASHBOARD_ENABLED=true
```

Default `true` — preserves current behaviour exactly. No behaviour change unless explicitly set to `false`.

### Change 4 — Frontend: `App.js` — conditional route

**File:** `frontend/src/App.js`  
**Where:** Around the existing `/leads` route (line ~80)  
**What:** Check `REACT_APP_LEADS_ENABLED` before rendering route

```jsx
// BEFORE:
<Route path="/leads" element={<LeadsView />} />

// AFTER:
{process.env.REACT_APP_LEADS_ENABLED !== "false" && (
  <Route path="/leads" element={<LeadsView />} />
)}
```

**Effect:** When `REACT_APP_LEADS_ENABLED=false`, the `/leads` route does not exist in the router — visiting it falls through to `<NotFound />`. The `LeadsView` lazy import is also never executed (bundle not loaded).

### Change 5 — Frontend: `.env` — add new key

```
REACT_APP_LEADS_ENABLED=true
```

---

## 5. Behaviour Matrix — No-Break Guarantee

| Scenario | Lead capture | Dashboard | Site |
|---|---|---|---|
| Both ENVs `true`, all API keys set | ✅ Works | ✅ Fully functional | ✅ |
| Both ENVs `false` | ✅ Works | ❌ 503 + NotFound | ✅ |
| ENVs `true`, `FRESHSALES_API_KEY` missing | ✅ Works, FS skipped | ✅ CRM column shows "—" | ✅ |
| ENVs `true`, `META_ACCESS_TOKEN` missing | ✅ Works | ✅ Ads Intel: "Connect Meta first" | ✅ |
| ENVs `true`, `GOOGLE_ADS_*` missing | ✅ Works | ✅ Google panel: "not connected" | ✅ |
| ENVs `false`, `CRM_SYNC_ENABLED=true` | ✅ Works | ❌ Login blocked (503) | ✅ Scheduler still runs |
| User visits `/leads` when disabled | ✅ Works | Shows `<NotFound />` page | ✅ |
| DemoForm submit when disabled | ✅ Works | n/a | ✅ |
| Bot or crawler hits `/api/cms/leads` when disabled | ✅ Works | 503 JSON response | ✅ |

**Note on scheduler vs dashboard:** `CRM_SYNC_ENABLED` and `LEADS_DASHBOARD_ENABLED` are independent by design:
- `LEADS_DASHBOARD_ENABLED=false` disables viewing — sales team cannot access
- `CRM_SYNC_ENABLED=true` continues pulling Freshsales data in background — data stays fresh
- Recommendation: In a full "off" mode, set both to `false`

---

## 6. Files to Change

| File | Operation | Lines changed |
|---|---|---|
| `backend/cms_auth.py` | **EDIT** — add `DASHBOARD_ENABLED` check in `get_current_admin()` | +6 lines |
| `backend/server.py` | **EDIT** — add `GET /api/cms/config` endpoint | +8 lines |
| `backend/.env` | **EDIT** — add `LEADS_DASHBOARD_ENABLED=true` | +1 line |
| `frontend/src/App.js` | **EDIT** — wrap `/leads` route in `REACT_APP_LEADS_ENABLED` check | +2 lines |
| `frontend/.env` | **EDIT** — add `REACT_APP_LEADS_ENABLED=true` | +1 line |

**Total: 18 lines changed across 5 files. Zero new files needed.**

---

## 7. Definition of Done

- [ ] `LEADS_DASHBOARD_ENABLED=false` → all `/api/cms/*` return 503 `{"detail": "Dashboard disabled"}`
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `/api/demo-request` still returns 200 (lead capture unaffected)
- [ ] `REACT_APP_LEADS_ENABLED=false` → `/leads` renders `<NotFound />`, no JWT login shown
- [ ] `REACT_APP_LEADS_ENABLED=true` (default) → dashboard accessible and fully functional
- [ ] `LEADS_DASHBOARD_ENABLED=true` + `FRESHSALES_API_KEY` empty → dashboard loads, CRM column shows "—", no crash
- [ ] `LEADS_DASHBOARD_ENABLED=true` + `META_ACCESS_TOKEN` empty → Ads Intel tab shows "Connect Meta first", no crash
- [ ] `LEADS_DASHBOARD_ENABLED=true` + `GOOGLE_ADS_*` empty → Google panel shows "not connected", no crash
- [ ] Marketing site pages (homepage, all 5 new LPs) load normally regardless of dashboard ENV state
- [ ] `GET /api/cms/config` returns `{"leads_enabled": bool}` without authentication

---

## 8. ENV Reference (complete set for dashboard)

```bash
# ─── Master toggle ─────────────────────────────────────
LEADS_DASHBOARD_ENABLED=true          # false → 503 on all /api/cms/* endpoints

# ─── Frontend toggle (must match above) ────────────────
# In frontend/.env:
# REACT_APP_LEADS_ENABLED=true        # false → /leads shows NotFound

# ─── CRM sync (independent of dashboard) ───────────────
CRM_SYNC_ENABLED=true                 # false → Freshsales pull scheduler skips

# ─── Per-integration (graceful degradation when missing) ─
FRESHSALES_API_KEY=                   # empty → leads saved to MongoDB only
META_ACCESS_TOKEN=                    # empty → Meta Ads panel disabled
META_AD_ACCOUNT_ID=                   # empty → Meta Ads panel disabled
GOOGLE_ADS_DEVELOPER_TOKEN=           # empty → Google Ads panel disabled
GOOGLE_ADS_CUSTOMER_ID=               # empty → Google Ads panel disabled
```

---

*CR-153 registered 2026-08-26. Implementation is 18 lines across 5 files. All changes are additive (default=true preserves current behaviour). No DB changes. No new dependencies.*
