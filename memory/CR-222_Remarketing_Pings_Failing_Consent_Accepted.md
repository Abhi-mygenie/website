# CR-222 — Google Ads Remarketing Pings Failing on Production (India, Consent Accepted)

**Registered:** 2026-09-06
**Source:** Owner confirmed — tested on www.mygenie.online from India with cookie banner accepted
**Status:** 🔲 Open — investigation required, no code change yet
**Priority:** P1
**Owner:** GTM dashboard + Google Ads console check
**File:** GTM container `GTM-K5D84Z3L` — remarketing tag configuration

---

## 1. Context

CR-221 was registered with consent-blocking as the most likely cause.

Owner has **confirmed the test was run from India with the cookie banner accepted** (ad_storage: granted). This rules out consent as the cause. The rmkt/collect pings are failing **even with full consent** — this is a real misconfiguration, not expected behaviour.

---

## 2. What Is Confirmed

| Signal | Detail |
|---|---|
| Location | India |
| Cookie consent | Accepted (banner clicked) |
| ad_storage state | `granted` (per CR-219 — India defaults to granted) |
| Endpoint failing | `POST https://www.google.com/rmkt/collect/16740091756/` |
| Failures | 6 + 5 = 11 grouped "Fetch failed loading" errors |
| Source tag | `js?id=AW-16740091756&cx=c&gtm=4e6921:509` |

Since consent is accepted and India visitors have `ad_storage: granted` by default (CR-219 implementation), the remarketing tag should fire successfully. It is not. This is a bug.

---

## 3. Likely Causes (consent ruled out)

### A — Ad blocker / browser extension (must eliminate first)
Even with consent accepted, uBlock Origin / Privacy Badger / Ghostery block `google.com/rmkt/collect` at network level. The Fetch fails silently regardless of consent state.
**How to verify:** Repeat test in Chrome Incognito with zero extensions → if failures stop, cause is ad blocker (not actionable from code).

### B — GTM Remarketing tag firing before gtag library is ready
With CR-209 (interaction-first GTM defer), GTM fires on first scroll/click. If the remarketing tag has a trigger that fires immediately on GTM load (before `gtag` is fully initialised), the `rmkt/collect` POST may fire into a race condition.
**How to verify:** GTM Preview mode → check remarketing tag fire sequence relative to `gtm.js` load completion.

### C — Google Ads account: Remarketing audience paused or ID mismatch
Conversion ID `16740091756` may point to a paused remarketing audience or a pixel that has been reset/replaced in the Google Ads account.
**How to verify:** Google Ads → Tools & Settings → Audience Manager → Audience sources → Website tag → check if `16740091756` shows "Recording activity" or "No recent activity / Tag inactive".

### D — CORS / Cloudflare blocking the POST
Production is behind Cloudflare. A WAF rule may be blocking POST requests to `google.com` originating from the site. Less likely since this is a browser-originated request, not server-to-server.

### E — `rmkt/collect` endpoint deprecated
Google has been migrating from `rmkt/collect` to `google-analytics.com/g/collect`. The older endpoint may be returning errors for certain account configurations.
**How to verify:** Check the actual HTTP response code (not just "Fetch failed") — open Network tab, find the failing POST, check status code (403? 404? CORS preflight failure?).

---

## 4. Investigation Checklist

```
[ ] Step 1: Repeat test in Chrome Incognito (no extensions) + accept cookie banner
            → Still failing? → Not ad-blocker → continue
            → Stopped? → Ad blocker confirmed — document, not actionable

[ ] Step 2: Open DevTools → Network tab → find failing POST to rmkt/collect
            → Check actual HTTP status code (not just console "Fetch failed")
            → 403 = permission/auth issue
            → 404 = endpoint gone / wrong ID
            → CORS error = preflight blocked (check response headers)

[ ] Step 3: Google Ads console → Tools → Audience Manager → Audience sources
            → Find "Website visitors" tag
            → Check status: "Recording" vs "Inactive" vs "No recent activity"
            → Confirm tag ID matches 16740091756

[ ] Step 4: GTM Preview → open www.mygenie.online → trigger GTM
            → Find Google Ads Remarketing tag in fired tags list
            → Check parameters: is Conversion ID correct? Any error in preview?

[ ] Step 5: If Step 2 shows 404 or deprecated endpoint
            → Update GTM remarketing tag to use google-analytics.com endpoint
            (GTM usually handles this automatically in newer tag versions — check tag version)
```

---

## 5. Impact

| Area | Impact |
|---|---|
| Core conversion tracking (`book_demo`) | Not affected |
| Remarketing audience building | **Broken** — no visitors being added to Google Ads remarketing lists |
| Google Ads smart bidding (RLSA) | Affected — remarketing lists used for bid adjustments not growing |
| Revenue impact | Medium — RLSA audiences improve conversion rates on search campaigns |

---

## 6. Resolution Paths

| Finding | Action | Who |
|---|---|---|
| Ad blocker | Document, no fix needed | — |
| GTM tag race condition | Add `gtm.load` event as trigger condition | Agent (GTM change) |
| Google Ads account inactive | Reactivate audience source in Ads console | Owner |
| Deprecated endpoint | Recreate tag in GTM using latest Google Ads Remarketing tag type | Owner (GTM) |
| CORS / Cloudflare | Add Cloudflare exception for `www.google.com/rmkt/` | Owner (Cloudflare) |

---

## 7. Related CRs

| CR | Relationship |
|---|---|
| CR-221 | Parent observation — same symptom, consent not yet eliminated as cause |
| CR-216 | Same tag (`AW-16740091756`) — after CR-216 consolidation, remarketing fires from unified Google Tag, may resolve race condition (Cause B) |
| CR-219 | Consent mode — India `ad_storage: granted` confirmed, rules out consent as cause |

---

*Registered 2026-09-06. Source: Owner confirmed — India session, consent accepted, pings still failing.*
*No code change until root cause confirmed via investigation checklist above.*
