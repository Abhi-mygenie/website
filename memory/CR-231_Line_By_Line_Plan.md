# CR-231 — Line-by-Line Implementation Plan: Disable WhatsApp FAB

**Date:** 2026-09-08
**Priority:** P1
**Decision:** Disable via REACT_APP_WHATSAPP_ENABLED=false

---

## Overview

This is a single-line environment variable change. No JSX or component edits required.

| # | File | Operation |
|---|---|---|
| 1 | `frontend/.env` | Add `REACT_APP_WHATSAPP_ENABLED=false` |

Then: full yarn build + package production zip + deploy to production nginx + CF Purge Everything.

---

## Op 1 — `frontend/.env`

**Current state of `frontend/.env`:**
```
REACT_APP_BACKEND_URL=https://c64bf491-0019-40f7-a113-57c2be3dae5d.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```
*(REACT_APP_WHATSAPP_ENABLED is absent — undefined defaults to showing the FAB)*

**Add this line (at end of file):**
```
REACT_APP_WHATSAPP_ENABLED=false
```

**Result:**
```
REACT_APP_BACKEND_URL=https://c64bf491-0019-40f7-a113-57c2be3dae5d.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_WHATSAPP_ENABLED=false
```

---

## How It Works (no further code changes needed)

The env var is already wired in two places:

**App.js line 151 — FAB:**
```jsx
{process.env.REACT_APP_WHATSAPP_ENABLED !== "false" && <WhatsAppFab />}
// Before: undefined !== "false" = true  → FAB renders
// After:  "false" !== "false"   = false → FAB removed from render tree
```

**MessageForm.jsx line 12 — Contact form option:**
```jsx
const WA_ENABLED = process.env.REACT_APP_WHATSAPP_ENABLED !== "false";
// Before: undefined !== "false" = true  → WhatsApp shown in contact method dropdown
// After:  "false" !== "false"   = false → WhatsApp hidden from dropdown
```

**⚠️ Side effect:** The WhatsApp option in the `/contact` page MessageForm dropdown will also be hidden. This is intentional — documented in CR-231 Impact Analysis. Low impact (contact page is not a paid ad landing page).

---

## Build Commands (for production deploy)

```bash
# Step 1: Beta build (verify on preview pod first)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build

# Step 2: Verify on preview pod — open on phone, confirm no green WhatsApp circle

# Step 3: Production build
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online \
REACT_APP_GTM_ID=GTM-K5D84Z3L \
yarn build

# Step 4: Package zip
cd /app && zip -r mygenie-prod-build.zip frontend/build/

# Step 5: Deploy zip to production nginx web root

# Step 6: Cloudflare → Purge Everything
```

**Important:** `REACT_APP_WHATSAPP_ENABLED` is baked at build time (webpack `DefinePlugin`). A `supervisorctl restart` does NOT apply this change. A full `yarn build` is required.

---

## Can be batched with CR-215B and CR-230

All three CRs (230, 231, 215B) can go in the same build:
- CR-231: adds 1 line to `.env`
- CR-215B: edits `content.js`
- CR-230: edits 5 page files + StickyMobileCta

Single `yarn build` → single production zip → single deploy → single CF Purge.

---

## Verification Checklist

- [ ] Open `/restaurant-pos-system` on iPhone → no green WhatsApp circle in bottom-right corner
- [ ] Open `/` (homepage) on Android → no green circle
- [ ] Open `/contact` → WhatsApp option absent from "Preferred contact method" dropdown
- [ ] Phone number still visible in nav bar and hero CTA `<a href="tel:...">` → unaffected
- [ ] Desktop — no change expected (was already `lg:hidden`)

---

## Rollback

If WhatsApp FAB needs to be re-enabled:

```
frontend/.env → remove REACT_APP_WHATSAPP_ENABLED=false (or set to "true")
Then: yarn build → redeploy → CF Purge
```

---

*Plan written 2026-09-08. Source: App.js:151, MessageForm.jsx:12, frontend/.env investigation 2026-09-08.*
