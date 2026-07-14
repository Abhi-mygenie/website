# Session Handover — 2026-02-05 (Late)

## Session summary
Executed a 7-change funnel-tracking + attribution batch after user-locked planning. **5 of 7 fixes shipped and verified by testing_agent (100% pass on all iterations).** 2 fixes remain queued for next session per user's "one at a time" pace.

---

## ✅ Shipped this session (preview only — awaiting production push)

### Batch A — Structural fixes (from previous fork, still preview-only)
- **CR-57** — Sector demo anchor shift on 6 pages (Petpooja/Sector/Solutions/Product/AI)
- **CR-57b** — Navbar context-aware "Book a Free Demo" CTA (smart-scroll to local anchor)

### Batch B — CRM data ops (live in production Freshsales)
- **CR-48 backfill** for Shubham Rajput (`8445507759` / FS `402211642191`) — 11 `cf_*` keys restored

### Batch C — Funnel tracking (this session, 5 of 7 done)

| # | Fix | File(s) | Status | Verification |
|---|---|---|---|---|
| **1** | Conversion values → `0/200/200/300` | `gtm.js` L223-232 | ✅ SHIPPED | `iteration_13.json` PASS 100% |
| **2** | `conversion_value` type: String → **Number** for value-based bidding | `gtm.js` L205 | ✅ SHIPPED | `iteration_13.json` PASS 100% |
| **3** (G3) | Delete duplicate `lead_verified` push in `onVerified` callback | `DemoForm.jsx` L299-303 | ✅ SHIPPED | `iteration_14.json` PASS 100% |
| **4** (G1) | Gate DemoForm's `demo_booked` postMessage listener to `isMobile` only (kills desktop double-fire) | `DemoForm.jsx` L112-131 | ✅ SHIPPED | `iteration_15.json` PASS 100% both desktop + mobile |
| **5** (G4) | Stable per-mount `eventId` UUID in `RoiCalculator`, `MessageForm`, `CheckoutModal` (+ modal-open reset) | 3 files (see below) | ✅ SHIPPED | `iteration_16.json` PASS 100% 5/5 tasks |

Files edited in Batch C:
```
frontend/src/lib/gtm.js                                — CONVERSION_VALUES table + Number cast
frontend/src/components/site/DemoForm.jsx              — deleted lead_verified push, gated listener to isMobile
frontend/src/pages/RoiCalculator.jsx                   — added stable eventId (useState + newEventId)
frontend/src/components/site/MessageForm.jsx           — added stable eventId (both form_submitted + book_demo)
frontend/src/components/pricing/CheckoutModal.jsx      — added stable eventId + regen on modal-open useEffect
```

---

## 🚧 Remaining work (2 fixes) — user's iron rule: run testing_agent after each

### Fix #6 (G5) — Add UTM + ad params to dataLayer payload
**File**: `frontend/src/lib/gtm.js` `buildLeadPayload` function (approx L200-215 return block)

**What to add** — 8 fields to the returned object (values already captured in `attribution.js` via `getAttribution()`):
```js
utm_source:   attr.last_utm_source   || null,
utm_medium:   attr.last_utm_medium   || null,
utm_campaign: attr.last_utm_campaign || null,
utm_content:  attr.utm_content       || null,
utm_term:     attr.utm_term          || null,
utm_id:       attr.utm_id            || null,
ad_id:        attr.ad_id             || null,
adset_id:     attr.adset_id          || null,
```

**IMPORTANT — verified attribution field names** (grepped `attribution.js` L124-140):
- `attr` object has `first_utm_source`/`last_utm_source` split. Use `last_*` for the *most recent* touchpoint.
- Simple keys `utm_content`, `utm_term`, `utm_id`, `ad_id`, `adset_id` exist without prefix (they use `last || first || null` fallback internally).
- `attr.utm_ad`, `attr.placement`, `attr.site_source_name` are also available but NOT in the current 8-field ask.

**Test plan for testing_agent:**
1. Load URL `?utm_source=facebook&utm_medium=cpc&utm_campaign=diwali&utm_content=adset-42&utm_term=kw-pos&utm_id=12345&ad_id=999&adset_id=888&fbclid=DIAGFBCLID`.
2. Fill DemoForm on homepage, submit.
3. Spy dataLayer push → assert all 8 UTM/ad fields present with URL values.
4. Verify same-mount OTP verify + booking events also carry the 8 fields (they should — same `buildLeadPayload`).
5. Regression: no change in existing 28 fields (event_id, phone, email, conversion_value, etc.).

**Estimated:** 8 lines added, ~1 line each.

---

### Fix #7 (G6) — Format `fbc` at capture as `fb.1.<unix_ms>.<fbclid>`
**File**: `frontend/src/lib/attribution.js` (function `getAttribution` — needs to be located; grep confirmed it lives in this file)

**Current problem:** Meta CAPI EMQ score suffers because we send raw `fbclid` instead of the properly-formatted `fbc` cookie value that Meta expects.

**Fix approach — at first fbclid capture:**
```js
// Inside the persist/capture step where fbclid is first seen from URL
if (fbclid && !state.fbc) {
  state.fbc = `fb.1.${Date.now()}.${fbclid}`;
}
```

Then in `buildLeadPayload` (gtm.js), `attr.fbc` will already be formatted correctly and can be passed through as-is.

**Test plan for testing_agent:**
1. Load URL `?fbclid=ABC123XYZ`.
2. Open devtools → Application → Cookies (or localStorage — check what `attribution.js` uses).
3. Find the attribution cookie/storage key → verify `fbc` field is `fb.1.<timestamp>.ABC123XYZ` (not raw `ABC123XYZ`).
4. Submit form → spy dataLayer → assert `fbc` field in push payload has the properly formatted value.
5. Reload page (with no fbclid in URL now) → verify `fbc` persists from cookie/storage (Meta requires 90-day persistence).

**Estimated:** ~5 lines in `attribution.js`.

---

## 🚫 Explicitly SKIPPED (user decisions — do NOT re-propose)

| Item | User decision |
|---|---|
| **G2** — Server-side Meta event_name mismatch (form_submitted vs Lead) | User handling externally via Meta CAPI Gateway UI mapping |
| **G7** — Backend Meta CAPI mirror (CR-53) | User said NO — do not build backend CAPI at this time |
| **G8** — Calendly webhook CAPI extension | Skipped — external CAPI will dedup re-fires via same event_id |
| **Different values per platform** (Meta vs Google) | Same value for both (Approach A) |

---

## 📚 Required reading for next agent (in order)

1. **`/app/memory/HANDOVER_NEXT_AGENT.md`** (THIS FILE) — start here
2. **`/app/memory/PRD.md`** — product requirements + completion log
3. **`/app/test_reports/iteration_13.json`** → Fix #1+#2 verification (conversion values + Number cast)
4. **`/app/test_reports/iteration_14.json`** → Fix #3 verification (lead_verified deletion)
5. **`/app/test_reports/iteration_15.json`** → Fix #4/G1 verification (demo_booked single-fire on desktop+mobile)
6. **`/app/test_reports/iteration_16.json`** → Fix #5/G4 verification (stable event_id in 3 forms) — **includes the reusable spy pattern, OTP helper path, and full data-testid map**
7. **`/app/memory/CR-48_Backfill_Wiped_CustomField.md`** — CR-48 backfill spec (if any more leads need it)
8. Prior handovers if needed: `/app/memory/HANDOVER_NEXT_AGENT.md` history is via `git log`

---

## 🧪 Testing agent context (reusable across Fix #6 + #7)

**Do NOT reinvent these** — testing agent already built them in iterations 13-16:

- **OTP recovery helper**: `/tmp/get_otp.py <phone10>` — HMAC-SHA256 brute-force over `otp_codes.code_hash` using `CMS_JWT_SECRET`. Prints the 6-digit code.
- **dataLayer.push spy** (install AFTER cookie accept, BEFORE any form submit):
  ```js
  window.__spy = [];
  const orig = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function(...args) {
    window.__spy.push(JSON.parse(JSON.stringify(args)));
    return orig(...args);
  };
  ```
- **Full data-testid map** (see iteration_16.json context_for_next_testing_agent):
  - DemoForm: `demo-input-name/phone/email/business_name/city`, `demo-select-years`, `demo-submit-btn`
  - MessageForm: `message-input-{name,phone,email,business_name,text}`, `message-select-years`, `message-submit-btn`
  - CheckoutModal: `checkout-{name,phone,email,business_name,years,submit,close,done-btn}`, entry via `cart-demo-btn` / `cart-buy-btn`
  - ROI: `roi-name/phone/submit`
  - OTP input: `otp-digit-{0..3}` — auto-submits at 4 chars
  - Cookie banner: click button with text `"Accept"`
- **Calendly booking simulation** (desktop, no real click):
  ```js
  page.evaluate("window.postMessage({event:'calendly.event_scheduled', payload:{}}, '*')")
  ```
- **WhatsApp**: `WA_ENABLED=false` in env — no popup handling needed on `/contact`

---

## 🎯 Critical context for next agent

1. **User's rule OVERRIDDEN for this batch**: user explicitly said "we will call bug fixing agent later" — so testing_agent_v3_fork IS mandatory after each fix. Do NOT skip.
2. **One fix at a time**: user's cadence is "apply → validate → next". Do not batch multiple fixes into one test run.
3. **Don't touch skipped items** (G2/G7/G8) unless user re-opens them.
4. **CR-50, CR-57, CR-57b, and Batch C fixes are ALL preview-only**. Production (`mygenie.online`) still shows old behavior until user pushes to GitHub → prod deploy.
5. **`GTM_EVENT_NAME.lead_verified` and `CONVERSION_VALUES.lead_verified`** are now dead code (post-Fix #3) but non-blocking — leave alone unless user asks for cleanup. Flagged in `iteration_14/15/16` reviews.
6. **Backend has NO Meta CAPI code** — do not assume server-side conversion events are ours. They come from external tools (Meta CAPI Gateway / sGTM / Partner integration).
7. **All 4 funnel events share the same `event_id` UUID** via `useState(() => newEventId())` — generated once per component mount. Do NOT regenerate per push, do NOT wire to sessionStorage without user approval.

---

## 📌 Recommended next-session flow

1. Read HANDOVER_NEXT_AGENT.md + PRD.md + iteration_16.json (most recent).
2. Confirm with user: "Ready to execute Fix #6 (G5 — UTM params in dataLayer)?"
3. On yes: apply the 8-line change in `gtm.js buildLeadPayload`, lint, call testing_agent with the test plan above.
4. On PASS: propose Fix #7 (G6 — fbc format in attribution.js).
5. On BOTH pass: finish + update PRD.md with Batch C completion → prompt user to push preview → production.

---

## Environment status
- Backend/frontend healthy via supervisor
- Preview URL: `https://stack-runner-4.preview.emergentagent.com` (from `REACT_APP_BACKEND_URL`)
- No secrets modified this session (Fixes #1-5 were all frontend-only)
- No dependencies added
- MongoDB local, healthy

## Ad-hoc data ops performed at end of session (unchanged from prior handover section)
- CR-48 backfill script (`/app/scripts/cr48_backfill_wiped_cf.py`) run with `--contacts 402211642191` for lead Shubham Rajput (`8445507759`). Live PUT succeeded. Freshsales confirmed 11 `cf_*` keys post-run. Full trail in `db.crm_backfill_log_cr48`.
- Services restarted once mid-session via `sudo supervisorctl restart backend frontend` (user changed env). Both healthy post-restart.

---

## Suggested enhancement offered to user (still pending — carry forward)
Adding per-page attribution capture inside `handleDemoCtaClick` (2 lines) — record `document.location.pathname` at click time into `latest_source` so Freshsales shows whether the conversion came from the sector page or generic Nav. User has not responded yet.
