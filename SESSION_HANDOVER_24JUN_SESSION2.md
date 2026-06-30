# Session Handover — 24 June 2026 (Session 2: Post Go-Live)

**Agent:** E1, Emergent Labs
**Date:** 24 June 2026
**Duration:** Full session — production setup, CR-19 Phase B, go-live validation, GTM/sGTM debugging
**Repo:** https://github.com/Abhi-mygenie/website.git (pulled fresh into /app)

---

## 1. What Was Done This Session

### 1.1 Repository Setup & Production Connection
- Pulled fresh code from GitHub into `/app`, preserving `.git` and `.emergent` platform folders
- Installed all backend (pip) and frontend (yarn) dependencies
- Restored platform `.env` files (MONGO_URL, REACT_APP_BACKEND_URL)
- User updated `.env` with **full production credentials**: remote MongoDB (`52.66.232.149:27017`), Freshsales API keys, Razorpay live keys, S3 bucket config, SMS keys, Calendly webhook secret
- Backend confirmed connecting to remote MongoDB (980 leads) and Freshsales CRM (HTTP 200)

### 1.2 CR-19 Phase B: Keyword-Level Cost Data (IMPLEMENTED ✅)
**Files changed:**
| File | Change |
|---|---|
| `backend/ad_spend.py` | Added `parse_google_keywords_csv()` parser, updated `detect_platform()` to recognize keyword reports, added `keyword` field to `SpendRow` dataclass |
| `backend/funnel.py` | Added `_get_spend_by_keyword()` aggregation helper, updated `get_funnel_by_attribution()` to join keyword spend with lead data (case-insensitive match) |
| `backend/server.py` | Added `keyword` field to ad_spend MongoDB insert, added `keyword` to upload preview response |
| `frontend/src/components/funnel/AttributionBreakdown.jsx` | Changed `showCost` from `dimension === "ad_set"` to `true` — both tabs now show cost columns |
| `frontend/src/components/funnel/AdSpendUpload.jsx` | Updated preview to show "Google Ads (Keywords)" label, keyword-first table layout, "Google KW" in upload history |

**How it works:**
- Auto-detects Google Ads Keywords CSV by presence of "Keyword" + "Ad group" column headers
- Stores spend rows with `keyword` field in `ad_spend` MongoDB collection
- "By Keyword" tab now shows Spend/CPL/CP Demo/CP Win columns (amber, matching existing "By Ad Set" pattern)
- Keywords without uploaded cost data gracefully show `—`
- **Zero changes to existing Meta or Google Campaign CSV parsers** (regression tested ✅)

**User action needed:** Export Google Ads → Reports → Keywords report as CSV → upload in dashboard

**Documents created:**
- `/app/CR-19_PhaseB_Keyword_Cost_Impact_Analysis.md` — full impact analysis
- `/app/frontend/public/CR-19_PhaseB_Mockup.html` — interactive before/after mockup

### 1.3 Production Go-Live SEO Audit (COMPLETED ✅)
Ran full validation against `https://www.mygenie.online`:

| Check | Status |
|---|---|
| All key pages return HTTP 200 (17+ tested) | ✅ Pass |
| 301 Redirects (19 old URLs) | ✅ **ALL 19 PASS** (Cloudflare Bulk Redirects imported by user) |
| SSL certificate valid (Google Trust Services, expires Sep 2026) | ✅ Pass |
| Sitemap: 50 URLs, www.mygenie.online only, no preview/localhost leaks | ✅ Pass |
| robots.txt valid, points to correct sitemap | ✅ Pass |
| Facebook domain verification (`52wnu6dg7xaa18lrghxek38u535rtw`) | ✅ Present |
| Backend API reachable on production (`/api/` returns 200) | ✅ Pass |
| CORS working (`access-control-allow-origin: https://www.mygenie.online`) | ✅ Pass |
| OTP SMS endpoint live (real SMS sent) | ✅ Pass |
| non-www → www redirect (HTTPS) | ❌ **STILL FAILING** — `https://mygenie.online/` returns 200 instead of 301 |

**User action needed:** Cloudflare → Redirect Rules → add: hostname `mygenie.online` → 301 → `https://www.mygenie.online${uri}`

### 1.4 Go-Live Readiness Checklist Walkthrough
Reviewed all 8 sections of `readiness.html` with the user:

**Section 1 — Website Code:** 8/8 ✅ (all complete)

**Section 2 — GTM Container:**
- 2.1–2.4: ✅ Done (calendly trigger, GA4 Book Appointment, FB OTP Verified, container published)
- 2.5: ✅ Done (AM replicated to FB - OTP Verified — user confirmed with screenshot)
- 2.6: ✅ Done (AM replicated to FB - Book Appointment — user confirmed with screenshot)
- 2.7: ⏸ Parked — Consent Mode v2 explained, recommended skip for now (India, not EU-required)
- 2.8: Pending — republish needed after all changes
- 2.9: ✅ **Verified in GTM Preview on production** — all events confirmed:
  - Page load: 4 base tags fired ✅
  - Form submit (thankyou_conversion): GAds Book Demo + FB Book demo + GA4 Book demo ✅
  - Calendly booked (demo_booked): GA4 Book Appointment + fb-schedule + 7 total tags ✅
  - OTP verified: skipped (user didn't enter OTP) — would fire FB/GA4 OTP Verified

**Section 3 — Google Ads:**
- Discussed Primary vs Secondary conversion strategy
- **Decision: Form submit (thankyou_conversion) stays as Primary for next 30 days**
- `demo_booked` to be added as Secondary after GA4 Key Event marking + 24h data collection
- 3.6 (Enhanced Conversions) and 3.7 (conversion_value mapping) recommended as immediate next steps

**Section 4 — Meta Ads:**
- 4.1–4.7: ✅ All done
- 4.8: Pending — user to check EMQ score in Meta Events Manager
- 4.9: Pending — user to verify domain in Meta Business Settings (meta tag confirmed present)

**Sections 5–8:** Validated via curl (see 1.3 above). Remaining items are user-side (GSC sitemap submission, Razorpay webhook, Calendly webhook re-registration).

### 1.5 Freshsales Webhook — Cloudflare Error 1010 (DIAGNOSED)
- User reported 403 "error code: 1010" when Freshsales sends webhook to `https://www.mygenie.online/api/webhooks/freshsales/stage`
- Confirmed production IS behind Cloudflare (`server: cloudflare` in headers)
- Other webhooks (Calendly, Razorpay) work — only Freshsales blocked
- **Root cause:** Cloudflare Browser Integrity Check blocks Freshsales server's User-Agent
- **Fix:** Cloudflare → Rules → Configuration Rules → If URI Path contains `/api/webhooks/` → Browser Integrity Check = OFF
- Webhook endpoint itself works fine (tested via curl: `{"ok":true}`)

### 1.6 GTM Server-Side (sGTM) Event ID Deduplication (IN PROGRESS ⚠️)

**Problem:** User has sGTM live at `https://mcap.mygenie.online`. Browser + server both send events to Meta → double counting (1 lead shows as 2 conversions).

**Root cause found:**
| Where | event_id | Source |
|---|---|---|
| Browser dataLayer | `28184e3e-7a73-4845-87c3-0ce647284fc1` | ✅ Real UUID from `gtm.js` → `newEventId()` |
| sGTM Event Data | `eid_mqsl06ir03vensu7z` | ❌ GA4's auto-generated internal ID |

GA4 overwrites the `event_id` with its own internal ID when sending hits to sGTM. The real UUID from the dataLayer is lost.

**What was tried (did NOT work):**
1. ❌ Adding `dl_event_id` as **Configuration Parameter** on Google Tag → not forwarded to sGTM
2. ❌ Adding `dl_event_id` as **Shared Event Settings → Event Parameter** on Google Tag → not forwarded to sGTM

**Why it didn't work:** The "Book demo" event is sent by a separate **GA4 Event tag** (e.g., "GA4 - Book demo"), not by the base Google Tag. Parameters on the base Google Tag don't apply to separate event tags.

**Next step to try:**
Add `dl_event_id = {{event_id}}` as an **Event Parameter directly on each GA4 Event tag** that fires conversions:
- **GA4 - Book demo** (fires on thankyou_conversion)
- **GA4 - Book Appointment** (fires on demo_booked)
- **GA4 - OTP Verified** (fires on lead_verifided)

Then in sGTM:
1. Create Event Data variable: key = `dl_event_id` → name: `DL Event ID`
2. Facebook Conversion API tag → Event ID → change to `{{DL Event ID}}`
3. Publish both containers

**If individual event tags also don't work**, the nuclear option is:
- Create a **Custom JavaScript variable** in sGTM that extracts the UUID from somewhere in the raw GA4 hit payload
- Or use the **GA4 Event tag's "send_to" parameter** with a custom endpoint that preserves the original event_id

**sGTM Meta CAPI tag current config:**
- Server Event Data Override → Event ID = `{{event_id}}` (which resolves to GA4's internal `eid_...`)
- Needs to be changed to `{{DL Event ID}}` once the variable is receiving the real UUID

---

## 2. Current Environment State

### Backend .env (`/app/backend/.env`)
Contains production credentials for:
- Remote MongoDB (`52.66.232.149:27017`)
- Freshsales CRM API (bundle token + domain)
- Razorpay (live keys: `rzp_live_*`)
- AWS S3 (bucket: `mygenie-prod`, ap-south-1)
- SMS provider (2Factor)
- Calendly webhook signing key
- CMS auth (admin/admin123, editor/editor123)

### Frontend .env (`/app/frontend/.env`)
- `REACT_APP_BACKEND_URL=https://react-mongo-deploy.preview.emergentagent.com`
- `REACT_APP_GTM_ID=GTM-K5D84Z3L`
- Other GA4/Meta/site URL vars

### Services
- Backend: RUNNING (FastAPI on port 8001, connected to remote MongoDB)
- Frontend: RUNNING (React on port 3000)
- Scheduler: Active (6-hour Freshsales CRM sync)

---

## 3. Key Decisions Made

| Decision | Rationale |
|---|---|
| Form submit stays as Primary conversion for 30 days | Not enough `demo_booked` volume yet for Google Ads bidding optimization |
| `demo_booked` to be Secondary conversion | Track it without affecting bidding, evaluate after 30 days |
| Consent Mode v2 parked | India-based business, not EU-required, low priority |
| Keyword cost parser uses case-insensitive string match | `utm_term` from leads matched against CSV "Keyword" column, normalized to lowercase+trim |

---

## 4. Pending Items for Next Agent

### P0 — Immediate
1. **sGTM event_id dedup** — try adding `dl_event_id` on individual GA4 Event tags (see 1.6 above)
2. **Cloudflare non-www → www redirect** — user needs to add redirect rule (see 1.3)
3. **Cloudflare webhook exception** — user needs to add Configuration Rule for `/api/webhooks/` (see 1.5)
4. **Publish GTM container** — AM changes + dl_event_id parameter added but may need republish

### P1 — This Week
5. **Section 3 items:** Enhanced Conversions ON (3.6), conversion_value mapping (3.7), mark demo_booked as GA4 Key Event (3.2)
6. **Section 4 items:** Check Meta EMQ score ≥ 6.0 (4.8), verify Facebook domain in Meta Business Settings (4.9)
7. **GSC:** Submit sitemap `https://www.mygenie.online/sitemap.xml`
8. **Razorpay + Calendly webhooks:** Re-register to production URL
9. **`event_id` passthrough to Freshsales** — for Zapier CAPI dedup (browser event_id → backend → Freshsales `cf_event_id` field). Code change needed: frontend sends `event_id` in form payload → backend stores in MongoDB + pushes to Freshsales.

### P2 — Backlog
10. CR-15: Zapier Offline Conversions (3 Zaps) — blocked on Freshsales field audit + deal stage names
11. Keyword cost trend over time (chart)
12. Campaign-level breakdown tab
13. server.py refactor into /routes
14. react-snap pre-rendering for SEO

---

## 5. Files Created/Modified This Session

| File | Action | Purpose |
|---|---|---|
| `backend/ad_spend.py` | Modified | CR-19 Phase B: keyword parser + detection |
| `backend/funnel.py` | Modified | CR-19 Phase B: keyword spend lookup + join |
| `backend/server.py` | Modified | CR-19 Phase B: store keyword field in MongoDB |
| `frontend/src/components/funnel/AttributionBreakdown.jsx` | Modified | Show cost columns on keyword tab |
| `frontend/src/components/funnel/AdSpendUpload.jsx` | Modified | Google Keywords preview + history label |
| `backend/.env` | Modified | Added CMS credentials, later overwritten by user with full production env |
| `CR-19_PhaseB_Keyword_Cost_Impact_Analysis.md` | Created | Impact analysis document |
| `frontend/public/CR-19_PhaseB_Mockup.html` | Created | Interactive before/after mockup |
| `memory/PRD.md` | Updated | Added Phase B status + production audit results |
| `memory/test_credentials.md` | Created | CMS login credentials |

---

## 6. Critical Technical Notes

1. **`readiness.html` is a STATIC snapshot** — generated 24 June, does not auto-update. User has completed more items than the document shows. Always verify current status with user.

2. **GTM event names include intentional typo:** `lead_verifided` (not `lead_verified`). This matches the live GTM container. DO NOT "fix" this.

3. **Google Ads CSV encoding:** The user's Google Campaign CSV is UTF-8 with commas (not UTF-16 LE with tabs as originally documented). The parser handles both.

4. **sGTM endpoint:** `https://mcap.mygenie.online` — this is the user's GTM Server Container URL.

5. **The site IS behind Cloudflare** despite user initially thinking it wasn't. Confirmed via `server: cloudflare` header + `cf-ray` header.

6. **Ad spend CSV parsers are sacred** — 3 parsers now exist: `parse_meta_csv()`, `parse_google_csv()`, `parse_google_keywords_csv()`. Do not modify existing parsers when adding new ones.

---

*Prepared by E1, Emergent Labs. 24 June 2026.*
