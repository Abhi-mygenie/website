# CR-33 — `fbc` (Meta Click Cookie) Forwarding to Browser Pixel + Server CAPI

**Opened:** 2026-06-27
**Raised by:** Owner
**Priority:** P1 (match-quality lift, completes CR-3B sGTM wireup)
**Status:** G3 ✅ Code shipped → G4 QA in progress (owner GTM wireup pending)
**Effort:** ~20 minutes total (5 min code ✅ DONE + 15 min GTM ⏳ owner action)
**Risk:** LOW — additive only, no behavior change to existing fields

---

## 1. Problem Statement

The Meta `_fbc` cookie (the click-attribution counterpart to `_fbp`) is currently being **read** by our attribution layer (`attribution.js:148`) but is **not pushed** into the dataLayer payload (`gtm.js:209` is missing the `fbc` line). As a result:

- **Browser FB Pixel:** Auto-detects `_fbc` cookie directly — works on ~50–67% of events (only Meta-attributed traffic where the cookie was set by Meta's SDK when `fbclid` was first seen). No action needed there.
- **Server-side Meta CAPI tag:** Receives `null` / nothing for `fbc` because:
  - The dataLayer doesn't expose it
  - GA4 Event tags don't forward it
  - Server container has no Event Data path for it
  - CAPI tag userDataList has no `fbc` row

Per Meta Events Manager (verified 27 Jun 2026):
- `Browser ID (fbp)`: **100% coverage** ✅
- `Click ID (fbc)`: **50% coverage** ⚠️ (browser-only auto-detection; server-side = 0%)

Meta's documentation states `fbc` is **second only to `fbp`** in match-quality weight for Meta-attributed conversions. Closing this gap on the server CAPI path will:
1. Recover attribution for users with ad blockers / iOS ITP (where browser pixel can't fire but CAPI can)
2. Improve browser↔server dedup confidence
3. Lift Event Match Quality (EMQ) score for Meta-attributed leads from ~9.0 → ~9.7

---

## 2. Background — Why Only Half-Wired?

This was originally flagged in **CR-32 Phase 2 Group D** (Freshsales Field Mapping Closure proposal) as one of the click-ID gaps. The cookie-capture half was implemented as part of **CR-2 Attribution Mapping** (Apr 2026) but the dataLayer payload + GTM forwarding was deferred.

Now that CR-3B Step A + server-side CAPI tag are LIVE (27 Jun 2026), `fbc` is the last remaining piece to complete full **browser + server identity parity**.

---

## 3. Owner Confirmations Required Before G3

| # | Question | Owner decision |
|---|---|---|
| 1 | Proceed with this CR now? | ☐ Yes / ☐ Defer |
| 2 | OK to ship code + ask for GTM action in same release? | ☐ Yes / ☐ No |
| 3 | Apply to all 3 GA4 tags (`Book demo`, `OTP Verified`, `Book Appointment`)? | ☐ Yes / ☐ Only Book demo for now |

---

## 4. Scope

### IN SCOPE
- Push `fbc` from `attribution` object → dataLayer payload in `buildLeadPayload()`
- Document the GTM wireup required (web container + server container)
- Update Freshsales Field Contract doc (informational — `fbc` is dataLayer-only, no `cf_` slot needed)

### OUT OF SCOPE
- Persisting `fbc` to Freshsales (would need a new `cf_` slot — bundled into CR-32 Phase 2 instead, since `fbc` is short-lived and not used for sales ops)
- Persisting `fbc` to MongoDB (already captured via the existing `attribution` object stored on each lead doc — no change needed)
- Building `fbc` from `fbclid` when cookie is missing (Meta CAPI tag template handles this server-side)
- GA4 Enhanced Conversions for Google Ads (separate CR — Google uses `gclid`, not `fbc`)

---

## 5. Impact Analysis

### 5A. Code changes (Frontend only)

| File | Lines changed | Change |
|---|---|---|
| `frontend/src/lib/gtm.js` | +1 line | Add `fbc: attr.fbc \|\| null,` to `buildLeadPayload()` return object |

### 5B. Code already in place (no change needed)

| File | Lines | What's already working |
|---|---|---|
| `frontend/src/lib/attribution.js` | 148 | `fbc: getCookie("_fbc")` — cookie already read into the attribution object ✅ |
| `frontend/src/lib/attribution.js` | 21 | `fbclid` already in `CLICK_PARAMS` array — URL param captured ✅ |
| `frontend/src/lib/gtm.js` | 208 | `fbclid: attr.fbclid \|\| null,` — fbclid already in dataLayer (server CAPI can build fbc from this as fallback) ✅ |

### 5C. Backend impact

**ZERO.** Backend does not process `fbc` — it's a browser/server tag attribute only. The `attribution` dict already arrives at backend with `fbc` populated (since it was already in `attribution.js`); backend stores it in MongoDB as part of `lead.attribution` but never reads it. No `freshsales.py` / `server.py` / `funnel.py` change needed.

### 5D. GTM container impact

| Container | What changes |
|---|---|
| **Web container** (`GTM-K5D84Z3L`) | 1 new DLV (`fbc`, key path `fbc`) + 1 new Event Parameter row in each of 3 GA4 tags |
| **Server container** (`GTM-KN4B3Q2H`) | 1 new Event Data variable (`fbc`, key path `fbc`) + 1 new row in Facebook Conversion API tag's `userDataList`: `{name: "fbc", value: {{fbc}}}` |

### 5E. Downstream impact

| System | Impact |
|---|---|
| **Browser FB Pixel** | NONE — already auto-reads `_fbc` cookie. Stays at 50–67% coverage. |
| **Server Meta CAPI** | Coverage of `fbc` jumps from 0% → 80–90% of Meta-attributed traffic |
| **Event Match Quality (EMQ)** | Expected lift: +0.5 to +0.7 points within 24–72 hours of publish |
| **Meta Ads attribution** | Better recovery of ad-attributed conversions for ITP / ad-block users |
| **Dedup with browser pixel** | Improved confidence — Meta can match server event to browser pixel via fbc + event_id + fbp |
| **MongoDB / Freshsales** | NONE — `fbc` is already stored on the lead doc as part of `attribution`; not pushed to Freshsales (intentional — short-lived, no sales value) |

### 5F. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `fbc` cookie value malformed → CAPI rejects entire event | Very Low | Medium | Meta CAPI silently drops bad `fbc`; rest of payload still processed. Cookie format is set by Meta's own SDK, so format is reliable. |
| Hot reload misses the gtm.js change | Very Low | Low | Frontend service auto-restart fallback. Verify via DevTools dataLayer inspection post-deploy. |
| GTM publish blocked by unrelated workspace errors | Low | Low | Each container can be published independently after Validate passes. |
| Owner forgets to publish one of the two containers | Low | Medium | Provide explicit checklist in G3 ship doc. |

**Overall risk: LOW.** Single-line additive code change + standard GTM additive config.

---

## 6. Planning (G2 — Approach Locked)

### 6A. Code change spec

**File:** `frontend/src/lib/gtm.js`
**Function:** `buildLeadPayload()`
**Location:** Inside the return object, immediately after the `fbp` line (currently line 209)

**Diff:**
```diff
     fbclid: attr.fbclid || null,
     fbp: attr.fbp || null,
+    fbc: attr.fbc || null,
     gbraid: attr.gbraid || null,
```

That's it. One line. No other code touched.

### 6B. GTM wireup spec (owner-side, NOT in this CR's code scope)

Provide this as an owner action brief to be executed by the GTM admin AFTER code ships:

#### Web Container (`GTM-K5D84Z3L`)
1. Create new variable:
   - Name: `fbc`
   - Type: Data Layer Variable
   - Data Layer Variable Name: `fbc` (plain, no braces)
   - Version: Version 2
   - Default Value: (blank)

2. Open each GA4 Event tag (× 3) and add one Event Parameter row:
   - `GA4 - Book demo` → add row: `fbc` → `{{fbc}}`
   - `GA4 - OTP Verified` → add row: `fbc` → `{{fbc}}`
   - `GA4 - Book Appointment` → add row: `fbc` → `{{fbc}}`

3. Submit → Publish web container

#### Server Container (`GTM-KN4B3Q2H`)
1. Create new variable:
   - Name: `fbc`
   - Type: Event Data
   - Key Path: `fbc`
   - Default Value: (blank)

2. Open **Facebook Conversion API** tag → `userDataList` → add row:
   - `name: "fbc", value: {{fbc}}`

3. Validate Workspace → should show zero new errors
4. Submit → Publish server container

### 6C. Acceptance criteria

| # | Criterion | How to verify |
|---|---|---|
| 1 | `fbc` present in browser dataLayer payload | Submit form on www.mygenie.online → Chrome DevTools Console → `dataLayer.find(d => d.fbc !== undefined)` → returns object with `fbc: "fb.1.…"` (or `null` for non-Meta traffic) |
| 2 | `fbc` reaches server container eventData | Server container → Preview → submit form → click event → Event Data tab → confirm `fbc` row present |
| 3 | Server CAPI tag includes `fbc` in userDataList | Server container Preview → click "Facebook Conversion API" tag → Tag Details → userDataList → row `{name: "fbc", value: "fb.1.…"}` present |
| 4 | Meta CAPI accepts the event | Server container Preview → Outgoing HTTP Request → POST to `graph.facebook.com` returns 200 |
| 5 | Meta Events Manager shows fbc | Test Events → submit form → click event → Customer Information → "Click ID (fbc)" present (for Meta-attributed clicks) |
| 6 | Coverage lift visible (post-publish) | Meta Events Manager → Datasets → Book demo → Event match quality → "Click ID (fbc)" coverage jumps from ~50% → 80%+ within 48 hours |

### 6D. Test cases

| # | Scenario | Expected `fbc` value | Expected Meta CAPI behavior |
|---|---|---|---|
| 1 | User arrives via Meta ad (URL has `fbclid`) → submits form same session | `fb.1.{timestamp}.{fbclid}` (set by Meta SDK) | `fbc` populated server-side ✅ |
| 2 | User arrives via Meta ad, returns 3 days later (cookie still valid 90 days), submits | Same `fb.1.…` as session 1 | `fbc` populated server-side ✅ |
| 3 | User arrives via Google ad → submits | `null` (no `_fbc` cookie) | `fbc` field omitted from CAPI userDataList — Meta accepts event with other identity fields |
| 4 | User arrives via direct / organic → submits | `null` | Same as case 3 — graceful null handling |
| 5 | User has `_fbc` blocked by ad blocker → submits | `null` | Same as case 3 — graceful null handling. Browser pixel may also fail; CAPI catches the conversion via other identity |
| 6 | Lead submits twice (e.g. demo + quote on same visit) | Same `fbc` on both events | Meta dedups via event_id; fbc identical confirms same user |

### 6E. Rollback plan

If anything goes wrong:
- **Code rollback:** Single-line revert (`git revert`) on `gtm.js` — instantly removes `fbc` from dataLayer, GTM falls back to its current null state. ZERO production impact.
- **GTM rollback:** GTM has built-in version history. Owner can revert either container to the previous published version in 2 clicks. Tags will continue firing minus the `fbc` row.

---

## 7. Dependencies

| Dependency | Status |
|---|---|
| `attribution.js` already captures `_fbc` cookie | ✅ Done (CR-2, Apr 2026) |
| Server container Facebook Conversion API tag exists and is live | ✅ Done (27 Jun 2026 session) |
| Owner has admin access to both GTM containers | ✅ Confirmed |
| Meta Pixel base code firing on All Pages (to set `_fbc` cookie on `fbclid` landings) | ✅ Confirmed (66% coverage proves cookie-setting works) |

**No blockers.** Ready for G3 implementation on owner go-ahead.

---

## 8. Effort & Timeline

| Phase | Owner time | Dev time | Calendar |
|---|---|---|---|
| **G3 — Code** | 0 | 5 min | Same day |
| **G3 — GTM Web Container** | 5 min | 0 | Same day |
| **G3 — GTM Server Container** | 5 min | 0 | Same day |
| **G4 — QA (Test cases 1-5)** | 0 | 10 min | Same day |
| **G5 — Owner smoke + Meta Test Events** | 5 min | 0 | Same day |
| **Total active time** | **15 min** | **15 min** | **Same day end-to-end** |
| Match-quality lift visible in Meta dashboard | — | — | 24–72 hrs post-publish |

---

## 9. Open Questions

None. Spec is complete; awaiting owner approval to enter G3.

---

## 10. Sign-Off

| Gate | Status | Signed off by | Date |
|---|---|---|---|
| G1 — Discovery & Impact | ✅ Complete | _agent_ | 2026-06-27 |
| G2 — Planning | ✅ Complete | _agent_ | 2026-06-27 |
| G3 — Implementation | ⏸ Pending owner go-ahead | — | — |
| G4 — QA | ⏸ Pending | — | — |
| G5 — Owner Smoke | ⏸ Pending | — | — |
ing owner GTM publish + end-to-end test | — | — |
| G5 — Owner Smoke | ⏸ Pending | — | — |
