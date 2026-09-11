# CR-153 — Line-By-Line Implementation Plan
# ENV-Gated Lead Dashboard

**Date:** 2026-08-26  
**Estimated total lines changed:** ~57 lines across 5 files  
**Must read before building:** CR-153_ImpactAnalysis.md

---

## FILES TO CHANGE — ORDERED

| # | File | Operation | Lines |
|---|------|-----------|-------|
| 1 | `backend/cms_auth.py` | EDIT — add `DASHBOARD_ENABLED` const + `get_dashboard_admin()` | +9 lines |
| 2 | `backend/server.py` | EDIT — add `GET /api/cms/config` endpoint | +8 lines |
| 3 | `backend/server.py` | EDIT — swap 37 Category A lines from `get_current_admin` → `get_dashboard_admin` | 37 lines swapped |
| 4 | `backend/.env` | EDIT — add `LEADS_DASHBOARD_ENABLED=true` | +1 line |
| 5 | `frontend/src/App.js` | EDIT — conditional `/leads` route | +2 lines |
| 6 | `frontend/.env` | EDIT — add `REACT_APP_LEADS_ENABLED=true` | +1 line |

---

## FILE 1 — `backend/cms_auth.py`

**Current state:** 64 lines. `get_current_admin()` is the only auth dependency.  
**Goal:** Add `DASHBOARD_ENABLED` constant + `get_dashboard_admin()` wrapper without touching any existing code.

### Change 1a — Add `Depends` to the fastapi import (Line 12)

```
BEFORE (L12):
from fastapi import Request, HTTPException

AFTER:
from fastapi import Request, HTTPException, Depends
```

### Change 1b — Add `DASHBOARD_ENABLED` constant after `SESSION_HOURS` (Line 15)

```
BEFORE (L15):
SESSION_HOURS = int(os.environ.get("CMS_SESSION_HOURS", "12"))


AFTER:
SESSION_HOURS = int(os.environ.get("CMS_SESSION_HOURS", "12"))
DASHBOARD_ENABLED = os.environ.get("LEADS_DASHBOARD_ENABLED", "true").lower() == "true"
```

### Change 1c — Add `get_dashboard_admin()` after `get_current_admin()` (after Line 64)

Append after the existing last line of the file:

```python
def get_dashboard_admin(admin: str = Depends(get_current_admin)) -> str:
    """Extends get_current_admin with lead dashboard feature flag.
    Apply only to Category A (leads/funnel/ads/sync/churn) endpoints.
    Category B (CMS editor) endpoints keep get_current_admin — untouched.
    """
    if not DASHBOARD_ENABLED:
        raise HTTPException(status_code=503, detail="Dashboard disabled")
    return admin
```

**Result:** `cms_auth.py` is now 73 lines. `get_current_admin()` is completely unchanged.

---

## FILE 2 — `backend/server.py`

### Change 2a — Add `GET /api/cms/config` public endpoint (after Line 102)

Insert immediately after the `root()` function (after `return {"message": "Hello World"}`):

```python
@api_router.get("/cms/config")
async def cms_config():
    """Public endpoint — returns dashboard feature flags. No auth required.
    Used by frontend to conditionally render /leads route.
    """
    return {"leads_enabled": cms_auth.DASHBOARD_ENABLED}
```

**Insert after:** Line 102 (`return {"message": "Hello World"}`)  
**Blank line before and after:** yes

### Change 2b — Swap `get_current_admin` → `get_dashboard_admin` on Category A endpoints

**CRITICAL:** Only swap the lines listed below. Do NOT touch lines 763, 774, 786, 797, 818, 824, 832, 857, 874 (Category B — CMS editor).

#### Approach — Python bulk-swap script (run once, safe by line number):

```python
# Run this in /app/backend to swap all 37 Category A lines safely
CATEGORY_A_LINES = {
    922, 946, 960, 973, 985, 996,
    1066, 1078, 1090, 1103, 1113,
    1121, 1133, 1142, 1161, 1171, 1181, 1190,
    1199, 1204, 1210,
    1221, 1230, 1239, 1248,
    1277, 1354,
    1367, 1372, 1382, 1389, 1397, 1405,
    1426, 1454, 1525, 1534,
}

with open("server.py", "r") as f:
    lines = f.readlines()

changed = 0
for i, line in enumerate(lines, start=1):
    if i in CATEGORY_A_LINES:
        new = line.replace(
            "Depends(cms_auth.get_current_admin)",
            "Depends(cms_auth.get_dashboard_admin)"
        )
        if new != line:
            lines[i - 1] = new
            changed += 1

with open("server.py", "w") as f:
    f.writelines(lines)

print(f"Changed {changed} lines (expected 37)")
```

**Save this script as `/app/backend/scripts/cr153_swap.py` and run:**
```bash
cd /app/backend && python3 scripts/cr153_swap.py
```

**Expected output:** `Changed 37 lines (expected 37)`  
**If output says < 37:** Some lines were already changed or line numbers shifted — verify manually.

#### Manual verification — confirm Category B lines are untouched

After running the script, verify these 9 lines still say `get_current_admin` (NOT `get_dashboard_admin`):

```bash
python3 << 'PYEOF'
CATEGORY_B_LINES = [763, 774, 786, 797, 818, 824, 832, 857, 874]
with open("server.py") as f:
    lines = f.readlines()
for n in CATEGORY_B_LINES:
    text = lines[n-1].strip()
    status = "OK" if "get_current_admin" in text else "WRONG"
    print(f"L{n} {status}: {text[:80]}")
PYEOF
```

**Expected:** All 9 lines print `OK`.

#### Manual verification — confirm Category A lines are swapped

```bash
python3 << 'PYEOF'
CATEGORY_A_LINES = [
    922, 946, 960, 973, 985, 996,
    1066, 1078, 1090, 1103, 1113,
    1121, 1133, 1142, 1161, 1171, 1181, 1190,
    1199, 1204, 1210,
    1221, 1230, 1239, 1248,
    1277, 1354,
    1367, 1372, 1382, 1389, 1397, 1405,
    1426, 1454, 1525, 1534,
]
with open("server.py") as f:
    lines = f.readlines()
errors = []
for n in CATEGORY_A_LINES:
    text = lines[n-1]
    if "get_current_admin" in text and "get_dashboard_admin" not in text:
        errors.append(f"L{n} NOT SWAPPED: {text.strip()[:80]}")
if errors:
    [print(e) for e in errors]
else:
    print(f"All {len(CATEGORY_A_LINES)} Category A lines correctly swapped")
PYEOF
```

**Expected:** `All 37 Category A lines correctly swapped`

---

## FILE 3 — `backend/.env`

Add one line after `CORS_ORIGINS`:

```
MONGO_URL="mongodb://appuser:i6FB0atA40qw@52.66.232.149:27017/mygenie?authSource=admin"
DB_NAME="test_database"
CORS_ORIGINS="*"
LEADS_DASHBOARD_ENABLED=true    ← ADD THIS LINE
```

**Default is `true`** — zero behaviour change until explicitly set to `false`.

---

## FILE 4 — `frontend/src/App.js`

**Current state (Lines 84-85):**
```jsx
{/* CR-7 — Internal Leads View (CMS-auth gated) */}
<Route path="/leads" element={<LeadsView />} />
```

**After change (Lines 84-87):**
```jsx
{/* CR-7 — Internal Leads View (CMS-auth gated, dashboard ENV-gated — CR-153) */}
{process.env.REACT_APP_LEADS_ENABLED !== "false" && (
  <Route path="/leads" element={<LeadsView />} />
)}
```

**Why `!== "false"` not `=== "true"`:**  
Using `!== "false"` means the route is ENABLED by default even if `REACT_APP_LEADS_ENABLED` is not set.
This preserves current behaviour — the ENV must be explicitly set to `"false"` to disable.

**Lines changed:** 84–85 (2 lines replaced with 4 lines, net +2)

---

## FILE 5 — `frontend/.env`

Add one line:

```
REACT_APP_BACKEND_URL=https://mygenie-frontend-run.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_LEADS_ENABLED=true    ← ADD THIS LINE
```

**Default is `true`** — zero behaviour change until explicitly set to `false`.

---

## POST-IMPLEMENTATION VERIFICATION

### Step 1 — Restart backend (env change requires restart)
```bash
sudo supervisorctl restart backend
sleep 5
sudo supervisorctl status backend
```

### Step 2 — Verify config endpoint is public
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
curl -s "$API_URL/api/cms/config"
# Expected: {"leads_enabled": true}
```

### Step 3 — Verify dashboard endpoints still work (token required)
```bash
# Login and get token
TOKEN=$(curl -s -X POST "$API_URL/api/cms/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Category A endpoint — should return 200
curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/cms/funnel/summary" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200

# Category B endpoint — should still return 200
curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/cms/me" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200
```

### Step 4 — Set `LEADS_DASHBOARD_ENABLED=false` and verify 503

```bash
# Temporarily set to false
sed -i 's/LEADS_DASHBOARD_ENABLED=true/LEADS_DASHBOARD_ENABLED=false/' /app/backend/.env
sudo supervisorctl restart backend && sleep 5

# Category A must return 503
curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/cms/funnel/summary" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 503

# Category B must still return 200/401 (not 503)
curl -s "$API_URL/api/cms/me" -H "Authorization: Bearer $TOKEN"
# Expected: 200 (with user info, not 503)

# Lead capture must still return 200
curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/demo-request" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"9999999999","email":"t@t.com","hp":"","elapsed_ms":5000}'
# Expected: 200

# Config endpoint must still return (now shows false)
curl -s "$API_URL/api/cms/config"
# Expected: {"leads_enabled": false}

# Reset to true
sed -i 's/LEADS_DASHBOARD_ENABLED=false/LEADS_DASHBOARD_ENABLED=true/' /app/backend/.env
sudo supervisorctl restart backend
```

---

## ROLLBACK PLAN

If something goes wrong after implementing Change 2b (server.py swap):

```bash
cd /app/backend && git diff server.py | head -100
# OR
git checkout server.py   # reverts ALL server.py changes including the swap
```

Then re-apply only Change 2a (`/cms/config` endpoint) manually.

---

## DEFINITION OF DONE

- [ ] `GET /api/cms/config` returns `{"leads_enabled": true}` without auth
- [ ] `LEADS_DASHBOARD_ENABLED=true` → `GET /api/cms/funnel/summary` with valid token returns 200
- [ ] `LEADS_DASHBOARD_ENABLED=false` → all 37 Category A endpoints return 503
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `GET /api/cms/me` with valid token returns 200 (Category B unaffected)
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `POST /api/demo-request` returns 200 (lead capture unaffected)
- [ ] `LEADS_DASHBOARD_ENABLED=false` → `GET /api/cms/content` (public) returns 200 (live site unaffected)
- [ ] `REACT_APP_LEADS_ENABLED=false` → `/leads` URL renders `<NotFound />` in browser
- [ ] `REACT_APP_LEADS_ENABLED=true` (default) → `/leads` loads dashboard normally
- [ ] Category B lines 763, 774, 786, 797, 818, 824, 832, 857, 874 still say `get_current_admin`
- [ ] Category A lines 922–1534 (37 lines) say `get_dashboard_admin`

---

## QUICK CHANGE SUMMARY (for builder)

```
File                      Change
─────────────────────────────────────────────────────────────────
cms_auth.py               +Depends to import; +DASHBOARD_ENABLED const; +get_dashboard_admin() fn
server.py (line ~103)     +GET /api/cms/config endpoint (8 lines)
server.py (37 lines)      get_current_admin → get_dashboard_admin via cr153_swap.py script
backend/.env              +LEADS_DASHBOARD_ENABLED=true
frontend/src/App.js       /leads route wrapped in process.env.REACT_APP_LEADS_ENABLED !== "false"
frontend/.env             +REACT_APP_LEADS_ENABLED=true
─────────────────────────────────────────────────────────────────
Total:  ~57 lines changed / added  |  0 new files  |  1 helper script (cr153_swap.py)
```

*Plan written 2026-08-26. Run cr153_swap.py for the bulk server.py change, not sed — line numbers are precise.*
