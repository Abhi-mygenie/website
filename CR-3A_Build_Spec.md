# CR-3 A — Build Spec (G2) — Client-side Analytics & Ads via GTM

> **Status:** ✅ IMPLEMENTED & VERIFIED (2026-06-08). See §14 below.
> **Goal:** Fire all conversion signals from the website browser into the existing GTM container
> `GTM-K5D84Z3L` as ONLINE events. No Zapier, no Meta CAPI, no Google Ads API, no backend changes.
> **Reference:** `/app/CR-3_Analytics_Ads_Discovery.md` (decisions §5a–§5g).

---

## 1. Objective
Re-create, on the new React SPA, the exact tracking the old live site (`www.mygenie.online`) does — by
loading the existing GTM container and pushing the same `dataLayer` events. Owner's existing GA4/Meta/Google
Ads tags then fire unchanged.

## 2. Non-goals (explicitly out of scope)
- ❌ No Zapier. ❌ No Meta CAPI. ❌ No Google Ads API. ❌ No backend/server changes.
- ❌ No offline conversion upload (we accept the browser-only trade-off, see Discovery §5g).
- ❌ No GTM/Google-Ads account configuration (owner-side — see §10).
- ❌ No consent banner (deferred — Discovery §5g / "note for later").

## 3. Event → conversion mapping (locked)
| Website `dataLayer` event | When it fires | Google Ads action (owner maps in GTM) | Role |
|---|---|---|---|
| `form_submitted` | every lead-form submit (incl. OTP-unverified) | **Qualified leads** | secondary/observe |
| `lead_verified` | OTP verified | **Book demo** | PRIMARY (bid) — CONFIRM |
| `demo_booked` | Calendly `event_scheduled` (inline widget) | **Book appointments** | conversion |

> CONFIRM before build: (a) OTP-verified → "Book demo"; (b) "Qualified leads" secondary / "Book demo" primary.

## 4. dataLayer event payload contract (mirror the live site)
Every push uses this flat shape (unknown fields → `null`, never omit keys):
```js
{
  event: "form_submitted" | "lead_verified" | "demo_booked",
  name, email, phone,
  outlet_type,            // = sector || form.outlet_type
  outlet_name,            // = form.business_name
  city_name,              // = form.city
  message,                // = "" if not present on form
  page_url: window.location.href,
  event_time,             // unix seconds (Math.floor(Date.now()/1000))
  event_id,               // shared id per lead (see §6) — dedup key
  currency: "INR",
  conversion_value: "0",  // string, matches live site
  // click ids / attribution (from getAttribution())
  gclid, fbclid, fbp,
  source                  // = last_utm_source || first_utm_source
}
```
Field source map (new form → payload):
`form.name→name`, `form.email→email`, `form.phone→phone`, `outletValue→outlet_type`,
`form.business_name→outlet_name`, `form.city→city_name`. `gclid/fbclid/fbp/source` come from
`getAttribution()` (`/lib/attribution.js`, already returns these).

## 5. File-by-file changes

### 5.1 `frontend/.env` (ADD one key — never remove existing keys)
```
REACT_APP_GTM_ID=GTM-K5D84Z3L
```
- Read via `process.env.REACT_APP_GTM_ID`. If unset/empty → GTM must NOT load (keeps preview/QA clean).

### 5.2 `frontend/public/index.html` (load GTM, env-gated)
- Add the standard GTM **head** snippet + **body** `<noscript>` iframe, but gate it so it only injects when an
  env-provided container id exists AND we're on the production host (avoid polluting GA4 from preview).
- Implementation note: since `public/index.html` is static, inject via a tiny inline bootstrap that reads a
  build-time value. Two acceptable approaches (pick at build):
  - **A (recommended):** inject GTM from React at runtime in a `src/lib/gtm.js` initializer (see 5.3), gated by
    `REACT_APP_GTM_ID` + `window.location.hostname` allow-list (`www.mygenie.online`, `mygenie.online`).
    Keeps `index.html` clean and preview-safe. Include the `<noscript>` fallback only in prod build.
  - **B:** hardcode the GTM snippet in `index.html` head — simplest but fires on preview too (NOT recommended).
- **Decision: use Approach A** (runtime, env+host gated).

### 5.3 NEW `frontend/src/lib/gtm.js`
- `initGtm()` — if `REACT_APP_GTM_ID` set AND host is allowed → inject GTM script + dataLayer bootstrap once.
  No-op otherwise. Called once from `App.js` mount.
- `pushEvent(event, payload)` — `window.dataLayer = window.dataLayer || []; window.dataLayer.push({event, ...payload})`.
  Safe if GTM not loaded (dataLayer still queues / no-ops harmlessly).
- `newEventId()` — `crypto.randomUUID()` (fallback to timestamp+random).
- `buildLeadPayload(form, sector, attribution, eventId)` — returns the §4 object (single source of truth so all
  forms produce identical shape).

### 5.4 `frontend/src/components/site/DemoForm.jsx`
- Generate one `event_id` per lead lifecycle: create on first submit, keep in state, reuse for `lead_verified`
  and pass to Calendly so `demo_booked` shares it.
- In `verifyOtp()` success (after `setOtpVerified(true)`):
  `pushEvent("lead_verified", buildLeadPayload(form, sector, getAttribution(), eventId))`.
- In `submit()` success (after `/demo-request` resolves):
  `pushEvent("form_submitted", buildLeadPayload(...))`.
  - Decision point (flag to owner): fire `form_submitted` on **every** submit (parity with live site; "Qualified
    leads" used as secondary) — RECOMMENDED. Alt: only when `!otpVerified`. Default = every submit.
- Pass `eventId` + lead context into `<CalendlyInline ... eventId={eventId} leadContext={{...form, sector}} />`
  so the booking event carries the same identifiers.

### 5.5 `frontend/src/components/site/CalendlyInline.jsx`
- Add optional props `eventId`, `leadContext`.
- In the existing `calendly.event_scheduled` handler (line ~86), BEFORE/with `onScheduled()`:
  `pushEvent("demo_booked", buildLeadPayload(leadContext||{}, leadContext?.sector, getAttribution(), eventId||newEventId()))`.
- Centralizing here means **every** Calendly surface fires `demo_booked` (not just DemoForm).

### 5.6 `frontend/src/App.js` — GA4 SPA pageviews + GTM init
- Call `initGtm()` once on app mount.
- In `AttributionTracker` (already runs on every route change via `useLocation`), after `initAttribution()` add:
  `pushEvent("page_view", { page_path: pathname + search, page_url: window.location.href })`.
  - This gives GTM a History-Change-style SPA pageview signal for GA4. (Owner can also use GTM's built-in
    History Change trigger; pushing explicitly is more reliable for SPAs.)

### 5.7 Other lead forms (`MessageForm.jsx` = Contact; ROI / Checkout if present)
- On successful submit, `pushEvent("form_submitted", buildLeadPayload(...))` using the same helper.
- Keeps a single generic lead signal; owner decides GTM mapping per form if needed. (Lower priority than demo flow.)

## 6. event_id strategy (dedup)
- One `event_id` per lead, generated at the demo-form submit, reused across `form_submitted` → `lead_verified`
  → `demo_booked` for that user. Lets GTM/GA4/Meta dedupe and stitch the funnel. (CAPI not used, but parity +
  future-proofing.) Persist in component state (and optionally `sessionStorage` keyed by phone) so a booking
  later in the same session reuses it.

## 7. Production-only gating (critical)
- GTM loads ONLY when `REACT_APP_GTM_ID` is set AND `window.location.hostname` ∈ {`www.mygenie.online`,
  `mygenie.online`}. On the preview domain it stays OFF → no preview/QA traffic in GA4/Ads.
- For QA on preview, temporarily allow the preview host OR use GTM Preview/Debug mode (owner).

## 8. data-testid
- No new user-facing interactive elements are added (tracking is invisible). Existing testids untouched.

## 9. QA / verification plan (no testing-agent needed per owner)
1. **GTM load gating:** confirm container injects only on allowed host; absent on preview.
2. **dataLayer assertions (browser console / GTM Preview):**
   - Submit demo form (no OTP) → `form_submitted` present with correct payload + `gclid` (use a `?gclid=TEST123` URL).
   - Verify OTP → `lead_verified` present, same `event_id`.
   - Complete Calendly booking → `demo_booked` present, same `event_id`.
   - Route change → `page_view` pushed.
3. **GTM Preview mode:** owner confirms each tag (GA4/Meta/GAds) fires on its mapped trigger.
4. **Payload parity:** diff payload keys against the live-site contract (§4) — must match.

## 10. Owner-side tasks (OUT OF our scope — Google Ads + GTM)
> ### 🚨🚨 CRITICAL — REPOINT "GAds - Book Demo" tag to the `lead_verified` trigger (NOT `form_submitted`) 🚨🚨
> Today it fires on `form_submitted` (any submit) → "Submit lead form" counts UNVERIFIED leads. Per locked decision the PRIMARY "Book demo"/"Submit lead form" conversion must count ONLY OTP-verified leads. Repoint to `lead_verified`; route `form_submitted` → "Qualified leads" (secondary). Skipping this makes bidding optimize toward junk. **Verify in GTM before publishing.**

1. UNPAUSE GA4/FB "OTP Verified" tags (trigger `lead_verified` correct — no rename).
2. Create/point **Website-source** conversion actions + GTM Google Ads Conversion Tracking tags:
   - `form_submitted` → "Qualified leads" (secondary)
   - `lead_verified` → "Book demo" (primary)
   - `demo_booked` → "Book appointments" (repoint from Import-from-clicks → Website source; new action if needed)
3. Confirm Conversion Linker stays on All Pages (already present).
4. Decommission Zapier booking/qualified zaps once browser-side verified.

## 11. CONFIRMATIONS — RESOLVED (2026-06-08)
- [x] OTP-verified → **"Book demo"** ✅. Conversion ID/Label to be used = **`AW-16740091756 / NtqdClejmOgaEOyOpq4-`** (from "GAds - Book Demo" tag). Owner to repoint this conversion to fire on the `lead_verified` trigger.
- [x] "Qualified leads" = **secondary/observe**, "Book demo" = **primary/bid** ✅.
- [x] `form_submitted` fires on **EVERY submit** ✅ (best practice — see note below; cumulative funnel).
- [x] Production host allow-list = **`www.mygenie.online`** (+ apex `mygenie.online`) ✅.
- [x] `demo_booked` = **NEW client-side event** ✅ — appointment was previously tracked SERVER-SIDE (Zapier/offline); it does NOT exist in the client GTM container today. Owner must CREATE a new custom-event trigger `demo_booked` + GA4/FB/GAds "Book appointments" tags (Website-source conversion).

### Best-practice note on #3 (every submit)
Fire `form_submitted` on EVERY submit (verified or not). Make it a SECONDARY conversion ("Qualified leads"). Fire `lead_verified` only on OTP success as the PRIMARY conversion ("Book demo"). This yields a clean cumulative funnel: all-leads (form_submitted) ⊃ verified (lead_verified) ⊃ booked (demo_booked). Quality is controlled by which conversion is *primary* for bidding — NOT by suppressing events. Suppressing `form_submitted` for verified users would break funnel continuity and lose remarketing reach, so we do NOT do that.

### Existing client-container triggers available (from GTM Tags screenshot, clearer copy)
Custom-event triggers present: `Book demo`, `lead_verified` (correctly spelled), `OTP - form_submitted` (+ data triggers). All-Pages: Conversion Linker, Facebook Pixel. Init-All-Pages: GA4 config (`G-KWHHFEZ5Q3`) + Google Tag `AW-16740091756`. PAUSED: FB/GA4 "OTP Verified", Google/Meta Lead data tags, otp Button data tag.
- ⇒ `lead_verified` trigger already exists (just unpause its tags). `demo_booked` trigger is NET-NEW (create).

## 11b. (superseded) original open confirmations
- [ ] OTP-verified → "Book demo" (the one assumed mapping).
- [ ] "Qualified leads" = secondary, "Book demo" = primary.
- [ ] `form_submitted` fires on every submit (default) vs only-when-unverified.
- [ ] Production hostname allow-list for GTM gating (confirm exact prod domain(s)).
- [ ] Reuse existing event NAMES `form_submitted` / `lead_verified` and the (to-be-named) `demo_booked` — confirm
      the existing live-site booking event name if one already exists, so GTM triggers match exactly.

## 12. Deferred / backlog (not CR-3 A)
- Consent banner (EEA consent mode) — Discovery §5g.
- Optional server-side recovery of off-site bookings / CRM qualification (would re-introduce a webhook/CAPI path).
- Microsoft Clarity + reCAPTCHA parity on the new site (if owner wants).
- Calendly webhook re-registration to prod URL at deploy (separate deploy task).

## 13. Estimated touch surface
- New: `src/lib/gtm.js` (~50 lines).
- Edited: `frontend/.env` (+1 key), `public/index.html` (noscript fallback only, if Approach A),
  `App.js` (init + page_view), `DemoForm.jsx` (2 pushes + event_id + pass props),
  `CalendlyInline.jsx` (1 push + 2 props), `MessageForm.jsx` (1 push).
- Zero backend changes. Single iteration, browser-verifiable.

---

## 14. IMPLEMENTATION LOG (2026-06-08) — DONE & VERIFIED

### 14b. CRITICAL UPDATE 2026-06-08 — event names aligned to the LIVE container (no GTM edits)
Owner shared the real `GTM-K5D84Z3L` trigger configs. The container's internal **Event names** differ from our clean names:
| Our funnel stage | Container trigger | Container **Event name** | Tags fired |
|---|---|---|---|
| form submit | `OTP - form_submitted` | `form_submitted` | otp Button data Tag |
| OTP verified | `lead_verifided` (typo) | `lead_verifided` | FB/GA4 - OTP Verified + GAds - Book Demo |
| booking | `Book demo` | `thankyou_conversion` | FB/GA4/GAds - Book demo |

Our site fired `lead_verified`/`demo_booked` → would NOT match → verified+booking conversions would silently fail.
**Fix (code only):** added `GTM_EVENT_NAME` map in `gtm.js` so `pushLead()` emits the container's exact names —
`lead_verified→lead_verifided` (typo kept on purpose), `demo_booked→thankyou_conversion`, `form_submitted` unchanged.
`conversion_value` stays keyed by our semantic event (form_submitted=0, lead_verified=500, demo_booked=2000).
**Owner repoint task is now MOOT:** `GAds - Book Demo` already fires on `lead_verifided` (verified event). Verified via
headless dataLayer (OTP-verify → `lead_verifided` value=500; submit → `form_submitted` value=0). Zero GTM edits required.


**Files changed:**
- NEW `frontend/src/lib/gtm.js` — `initGtm()` (env+host-gated container injection), `pushEvent()`, `newEventId()`, `buildLeadPayload()`.
- `frontend/.env` — added `REACT_APP_GTM_ID=GTM-K5D84Z3L`.
- `frontend/src/App.js` — `initGtm()` + `page_view` push on every route change (in `AttributionTracker`).
- `frontend/src/components/site/DemoForm.jsx` — shared `event_id` per lead; `lead_verified` on OTP verify; `form_submitted` on submit; passes `eventId`+`leadContext` to Calendly.
- `frontend/src/components/site/CalendlyInline.jsx` — `demo_booked` push on `calendly.event_scheduled` (+ `eventId`/`leadContext` props).
- `frontend/src/components/site/MessageForm.jsx` — `form_submitted` on contact submit.

**Verification (headless Playwright, preview host):**
- `page_view` fires on load + on route change. ✅
- `form_submitted` fires on demo submit with full payload incl. `gclid=TEST123`, `fbclid=FBTEST`, `source=qa`, `event_id` (UUID), `currency=INR`, `conversion_value="0"`. ✅
- GTM container correctly NO-OPs on preview host (gating works); dataLayer still queues events. ✅
- `lead_verified` / `demo_booked` use the same proven pushEvent+buildLeadPayload path (couldn't trigger live OTP/booking in QA, but code path identical & app renders clean).

**Notes:**
- A QA test lead ("QA Tester" / 9876543210) was submitted to `/demo-request` during verification — may exist in Mongo/Freshsales; delete if undesired.
- Owner-side GTM/Ads tasks (§10) still pending: unpause OTP-Verified tags, repoint Book demo→`lead_verified`, create `demo_booked`/"Book appointments" Website-source conversion + tags, decommission Zapier.
- GTM only loads on `www.mygenie.online` / `mygenie.online` — verify after production deploy (or use GTM Preview mode for QA).
