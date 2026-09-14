# CR-221 — Google Ads Remarketing Pings Failing (rmkt/collect 404/Fetch Error)

**Registered:** 2026-09-06
**Source:** Chrome DevTools Console screenshot — owner session on www.mygenie.online
**Status:** 🔲 Open — investigation required, no code change yet
**Priority:** P2
**Owner:** GTM dashboard + Google Ads console check
**File:** GTM container `GTM-K5D84Z3L` — remarketing tag configuration

---

## 1. Observed Symptom

Console filtered by "gtag" shows repeated Fetch failures:

```
Fetch failed loading: POST "<URL>"   (6 grouped)
  → https://www.google.com/rmkt/collect/16740091756/
    ?random=1788671572323&cv=11...b=0&uam=&uap=macOS&uapv=26.4.1&...

Fetch failed loading: POST "<URL>"   (5 grouped)
```

- **Source:** `js?id=AW-16740091756&cx=c&gtm=4e6921:509` — fired from within GTM container
- **Endpoint:** `https://www.google.com/rmkt/collect/16740091756/` — Google Ads Remarketing collection URL
- **Total failures:** 11 POST attempts failing (6 + 5 grouped)
- **Also confirms CR-216:** `AW-16740091756` is loading as a separate script inside GTM

---

## 2. Possible Causes (in order of likelihood)

### A — Consent blocked (most likely — expected behaviour)
`ad_storage: denied` (default for EEA visitors, or Indian visitors who haven't clicked Accept on cookie banner).  
CR-219 fix correctly gates Google Ads on consent. If the test session had no cookie consent, rmkt/collect is expected to be blocked by `gtag` itself.  
**How to verify:** Accept the cookie banner → reload → check if failures persist.

### B — Ad blocker / Privacy extension
`google.com/rmkt/collect` is on every major ad-blocker blocklist (uBlock Origin, Privacy Badger, Ghostery).  
Browser extension blocking the POST silently → "Fetch failed".  
**How to verify:** Test in Chrome Incognito with no extensions.

### C — GTM Remarketing tag misconfiguration
Remarketing tag firing with wrong Conversion ID, missing required parameters, or trigger firing on every page instead of specific events.  
**How to verify:** GTM → Tags → find Google Ads Remarketing tag → check Trigger and Tag config.

### D — Google Ads account / pixel mismatch
Conversion ID `16740091756` may be pointing to a paused or misconfigured remarketing audience in the Ads account.  
**How to verify:** Google Ads → Audience Manager → check if `16740091756` audience is active.

---

## 3. Investigation Checklist (no code change)

```
[ ] Test 1: Accept cookie banner on www.mygenie.online → DevTools Console → gtag filter
            → If failures stop: cause = consent (expected, not a bug)
            → If failures continue: proceed to Test 2

[ ] Test 2: Chrome Incognito (no extensions) + accept cookie banner
            → If failures stop: cause = ad blocker (not actionable from code)
            → If failures continue: proceed to Test 3

[ ] Test 3: GTM Preview mode → open www.mygenie.online
            → Find "Google Ads Remarketing" tag in tag fire list
            → Check: Is it firing? What trigger? What parameters?
            → Confirm Conversion ID = 16740091756

[ ] Test 4: Google Ads console → Tools → Audience Manager → Audience sources
            → Check if website tag (ID 16740091756) is "Recording" or "No recent activity"
            → Check if any audience lists are active
```

---

## 4. Impact

| Area | Impact |
|---|---|
| Core conversion tracking (`book_demo`) | **Not affected** — uses separate GA4 + GAds conversion tags |
| Remarketing audience building | **Affected** — visitors not added to remarketing lists |
| Google Ads smart bidding | Low impact — smart bidding primarily uses conversion signals, not remarketing pings |
| Lighthouse / performance | None |

---

## 5. Expected Resolution

- **If consent-related:** No fix needed — correct behaviour per CR-219
- **If ad-blocker:** Not actionable from code — document as known limitation
- **If misconfigured tag:** Fix in GTM dashboard (tag config change, no code)
- **If account issue:** Fix in Google Ads console (audience setup)

---

## 6. Related CRs

| CR | Relationship |
|---|---|
| CR-216 | Same tag (`AW-16740091756`) — CR-216 fix (consolidate into unified Google Tag) will change how this tag fires but won't fix the rmkt/collect failures independently |
| CR-219 | Consent mode implementation — `ad_storage: denied` is the primary suspect for these failures |
| CR-220 | Enhanced Conversions on the same GAds account |

---

*Registered 2026-09-06. Source: Owner console screenshot. No code change — investigation only.*
