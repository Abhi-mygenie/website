# Agent Handover — 2026-09-08
# Session: GTM Batch + Registry Cleanup + Prerender Fixes

**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Preview URL:** https://react-app-preview-11.preview.emergentagent.com
**Production:** https://www.mygenie.online / https://beta.mygenie.online
**Current build hash (pod):** main.f8f2d731.js ✅

---

## HOW TO USE THIS HANDOVER

When the owner says "read the handover and tell me the plan":
1. Read this file fully
2. Summarise what was done this session
3. Present the open GTM batch plan clearly
4. Ask: "Which step do you want to start with?"

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| frontend (static-server.js) | RUNNING | 3000 |
| backend (uvicorn) | RUNNING | 8001 |
| MongoDB | remote 52.66.232.149 | — |

**frontend/.env keys set:**
```
REACT_APP_BACKEND_URL=https://react-app-preview-11.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_WHATSAPP_ENABLED=false
```

---

## 2. What Was Done This Session

### 2A — Full CR Registry Validation

Every open CR in `CR_INTAKE_REGISTER.md` was validated against actual source code. Result: **16 CRs that were marked open were already implemented** and registry was out of date. All updated to ✅ CLOSED.

Newly closed this session (were incorrectly showing as open):
CR-44, CR-74, CR-126, CR-182, CR-191, CR-192, CR-193, CR-194, CR-195, CR-196, CR-197, CR-202, CR-203, CR-204, CR-210, CR-211, CR-212, CR-228, CR-91, CR-137, CR-180 (reclassified LOW)

### 2B — CR-235: Phone Number Links Removed ✅ SHIPPED

All 12 `<a href="tel:...">` instances replaced with `<span>` across 10 files.
**Why:** Clicking phone number in header/footer was triggering browser "Open Phone?" / "Open FaceTime?" dialog on desktop — unwanted UX.
**Result:** Phone numbers still display. No dialog on click. Built + deployed.

### 2C — CR-231: WhatsApp FAB Disabled ✅ SHIPPED

`REACT_APP_WHATSAPP_ENABLED=false` added to `frontend/.env`. WhatsApp circle button no longer appears on mobile.

### 2D — CR-233 + CR-234: prerender.js Hero Preload Fixes ✅ SHIPPED

**One edit in `frontend/scripts/prerender.js`** — the hero image preload block.

Two problems fixed together:
- **CR-233:** Prerendered `<head>` had zero `<link rel="preload">` for hero image on all 5 paid ad landing pages. Browser discovered the hero image 200–400ms too late. Fixed by extending selector to catch `img[data-testid$="-hero-image"]`.
- **CR-234:** Homepage preload was using single `href="/brand/banner.webp"` — on mobile, srcset picks `banner-mobile.webp` (18KB) but preload was fetching `banner.webp` (38KB) → 20KB wasted per mobile visit. Fixed by reading `imagesrcset + imagesizes` from the `<img>` element at build time.

**Verified live:**
```
homepage:                     imagesrcset="...banner-mobile.webp 400w, ...banner.webp 776w" ✅
restaurant-pos-system:        imagesrcset="...400w, ...776w" ✅  (was: NO preload)
restaurant-billing-software:  imagesrcset="...400w, ...776w" ✅  (was: NO preload)
restaurant-management-software: imagesrcset="...400w, ...776w" ✅  (was: NO preload)
cloud-kitchen-pos:            imagesrcset="...400w, ...776w" ✅  (was: NO preload)
qsr-pos-system:               imagesrcset="...400w, ...776w" ✅  (was: NO preload)
```

### 2E — CR-220 Fix B: user_data Added to dataLayer ✅ SHIPPED (code, earlier session)

`buildLeadPayload()` in `src/lib/gtm.js` now emits a `user_data` block alongside existing flat keys:
```js
user_data: {
  email_address: email,      // Google's required key name (not "email")
  phone_number: phone,       // Google's required key name (not "phone")
  address: { first_name, last_name }
}
```
All flat keys (`email`, `phone`, `first_name`, `last_name`) stay unchanged — Meta + client-side GAds still read them. Confirmed in `main.f8f2d731.js`.

---

## 3. The Open GTM Batch — PLANNED, NOT YET EXECUTED

This is the main work for the next session. All steps are **GTM dashboard only — no code changes, no rebuild**.

### Container: GTM-K5D84Z3L (web GTM)
### URL: tagmanager.google.com

---

### What the 4 CRs are (plain English)

**CR-220 Fixes A+C — Enhanced Conversions broken (P0)**

Google Ads "Book Demo" conversion is recording visits but NOT Enhanced Conversion data (hashed email/phone that improves matching). Two GTM steps needed:
- **Fix A:** Create a GTM variable called `dlv - user_data` that reads the `user_data` object from the dataLayer event. Attach it to the "GA4 - Book demo" tag so the server-side container gets EC data.
- **Fix C:** Switch the "GAds - Book Demo" tag's Enhanced Conversions mode from "Automatic" (which scans the DOM for form inputs — but React has already unmounted them by conversion time) to "Code" (which reads from `user_data` directly).
- **Why this works:** CR-220 Fix B already ships `user_data: { email_address, phone_number, address }` in every `book_demo` dataLayer push. GTM just needs to be told to use it.
- **Evidence:** Google Ads console shows "Last ping date: Sep 2, 2026" + "Needs attention" warning.

**CR-216 — GTM loads 3 separate Google scripts, 524KB / 645ms blocking (P1)**

GTM currently fires 3 separate scripts: GTM loader (157KB) + GA4 (188KB) + Google Ads (179KB). GA4 and Google Ads each load their own copy of the gtag.js library. Fix: create a unified "Google Tag" that loads gtag.js once for both GA4 and Ads together. Saves −179KB download, −308ms blocking per page load. Pure GTM config change.

**CR-221/222 — Google Ads Remarketing pings failing (P1)**

`POST https://www.google.com/rmkt/collect/16740091756/` is failing with "Fetch failed" 11 times on every production page load, confirmed even with cookie consent accepted and `ad_storage: granted`. Not an ad blocker (owner confirmed India test in browser). Possible causes in order of likelihood:
1. Race condition: GTM fires after CR-209 defer (on first interaction), but remarketing tag may fire before gtag library is ready
2. Google Ads audience inactive / tag ID mismatch in Ads console
3. Deprecated `rmkt/collect` endpoint (Google migrating to different endpoint)
4. Tag type outdated in GTM (old remarketing tag vs new Google Ads Remarketing tag)

CR-216 fix (unified Google Tag) may resolve the race condition automatically — test after CR-216 is published.

---

### The 7 GTM Steps (from `GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md`)

```
STEP 1 — CR-216: Create unified Google Tag
  GTM → Tags → New
  Type: "Google Tag"
  Tag name: "Google Tag - G-KWHHFEZ5Q3"
  Tag ID: G-KWHHFEZ5Q3
  Trigger: All Pages
  Save
  
  Then: Pause (do NOT delete yet) old "GA4 Configuration" + "Ads Conversion Linker" tags
  (Verify in Preview that new tag fires before deleting old ones)

STEP 2 — CR-220 Fix A: Create variable
  GTM → Variables → New
  Type: "User-Provided Data"
  Name: "dlv - user_data"
  Data Layer Variable Name: user_data
  Save

STEP 3 — CR-220 Fix A: Edit GA4 tag
  GTM → Tags → "GA4 - Book demo"
  Find "User-Provided Data" section (separate from Event Parameters)
  Set: {{dlv - user_data}}
  Save

STEP 4 — CR-220 Fix C: Edit GAds tag
  GTM → Tags → "GAds - Book Demo"
  Find "Enhanced conversions" section
  Change: Automatic → Code
  Set User-Provided Data: {{dlv - user_data}}
  Save

STEP 5 — CR-221/222: Inspect remarketing tag
  GTM → Tags → "Google Ads Remarketing"
  Check trigger: is it "All Pages (gtm.js)"? If yes, consider changing to "DOM Ready"
  Check tag type: is it the latest Google Ads Remarketing tag type?
  (May be auto-resolved by STEP 1 — test in Preview first)

STEP 6 — GTM Preview Test (all changes together)
  GTM → Preview → open beta.mygenie.online
  Accept cookie banner
  Submit real Book Demo form (real email + phone)
  Complete OTP
  
  In debug panel verify:
  ✅ "thankyou_conversion" event fires
  ✅ "GA4 - Book demo" tag → User Data section shows hashed values (not empty)
  ✅ "GAds - Book Demo" tag → Enhanced Conversions section shows hashed values
  ✅ "Google Tag - G-KWHHFEZ5Q3" fires on page load (old tags paused)
  ✅ Remarketing tag fires without errors in debug panel

STEP 7 — Publish
  Submit → Version name: "CR-216 + CR-220 A+C — Unified Google Tag + EC fix"
  → Publish
```

---

### Post-Publish Monitoring

- **Same day:** Google Ads → Conversions → "Book demo" → "Last ping date" updates to today
- **24-72h:** "Needs attention" warning clears; Enhanced Conversions coverage % appears
- **Remarketing:** Google Ads → Audience Manager → Website tag → should show "Recording activity"

---

## 4. Other Open CRs (not in this session's scope)

### Dev code — can be done any time

| CR | What | File | Effort |
|---|---|---|---|
| CR-236 | ProductPage hero: add `data-testid="product-hero-image"` to `<img>` (Step A) | `ProductPage.jsx` | 1 line |
| CR-236 | ProductPage mobile images: create `feature1-5-mobile.webp` + add srcSet (Step B) | Owner/design | Asset creation |

### Owner actions

| CR | What | Where |
|---|---|---|
| CR-200 | Deploy production build — production still on old hash | SSH to www server |
| CR-146 | Add `X-Robots-Tag: noindex` for `beta.mygenie.online` | Cloudflare Page Rule |
| CR-88 | Provide individual blog author names (all 21 posts say "MyGenie Editorial Team") | Content decision |
| CR-48 | Approve running attribution backfill script | `backend/scripts/cr48_backfill_wiped_cf.py` |

---

## 5. Key Files for Reference

| File | What it contains |
|---|---|
| `/app/memory/CR_INTAKE_REGISTER.md` | Full CR register — all 235 CRs with status |
| `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md` | Full step-by-step GTM plan for this batch |
| `/app/memory/CR-220_Enhanced_Conversions_Impact_Analysis.md` | Deep explanation of why EC is broken |
| `/app/memory/CR-220_Line_By_Line_Plan.md` | Code + GTM detail for CR-220 |
| `/app/memory/CR-222_Remarketing_Pings_Failing_Consent_Accepted.md` | Investigation checklist for remarketing |
| `/app/memory/CR-233_CR-234_Combined_ImpactAnalysis.md` | Why prerender preload was broken |
| `/app/memory/CR-233_CR-234_Combined_Line_By_Line_Plan.md` | How the prerender fix was implemented |
| `/app/memory/test_credentials.md` | CMS login: admin/admin123, editor/editor123 |

---

## 6. Build Commands (if rebuild needed)

```bash
# Preview build (current pod)
cd /app/frontend && yarn build
sudo supervisorctl restart frontend

# Production build (for www.mygenie.online)
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
cd /app && zip -r mygenie-prod-build.zip frontend/build/
# Upload zip to production + CF Purge Everything
```

---

## 7. Quick Health Check

```bash
# Services running?
sudo supervisorctl status

# Current build hash?
ls /app/frontend/build/static/js/main.*.js | grep -v .map

# CR-220 Fix B in build?
grep -c "email_address" /app/frontend/build/static/js/main.*.js
# Expected: 1

# Prerender fix working?
grep -o 'imagesrcset="[^"]*"' /app/frontend/build/restaurant-pos-system/index.html
# Expected: imagesrcset="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"

# Backend healthy?
curl -s http://localhost:8001/api/ | python3 -c "import sys,json;print(json.load(sys.stdin))"
# Expected: {"message": "Hello World"}
```

---

## 8. Recommended Next-Session Flow

1. Owner says "read the handover" → agent reads this file, summarises, asks next step.
2. Owner says "go ahead with GTM batch" → agent walks owner through Steps 1–7 of `GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md`.
3. After GTM published → monitor for 24-72h.
4. Next dev task: CR-236 Step A (1-line JSX change to ProductPage.jsx).
5. After that: CR-200 production deploy (owner action).

---

*Handover written 2026-09-08. E1 Agent. Session 9.*
*Previous handover: `/app/memory/HANDOVER_2026-09-04_Session6.md`*
*Full CR register: `/app/memory/CR_INTAKE_REGISTER.md`*
