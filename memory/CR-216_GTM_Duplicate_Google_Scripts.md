# CR-216 — GTM: Duplicate Google Scripts — GA4 + Google Ads Load Separately (524 KiB, 645ms)

**Registered:** 2026-09-05
**Source:** Production Lighthouse audit — `www.mygenie.online` (3rd-party code 1,580ms blocking)
**Status:** 🔲 Open — 👤 Owner action (GTM dashboard only, no code change)
**Priority:** P1
**Owner:** GTM dashboard access required
**File:** GTM container `GTM-K5D84Z3L` — tag configuration change only

---

## 1. Problem

Production is loading **three separate Google scripts** on every page load:

| Script | Size | Blocking time |
|---|---|---|
| `gtm.js?id=GTM-K5D84Z3L` (GTM container) | 157 KiB | 70ms |
| `gtag/js?id=G-KWHHFEZ5Q3` (GA4) | 188 KiB | 267ms |
| `gtag/js?id=AW-167...` (Google Ads) | 179 KiB | 308ms |
| **Total Google** | **524 KiB** | **645ms blocking** |

GA4 and Google Ads are configured as **separate tags** in GTM, each loading its own
`gtag.js` library independently. Google loads the full gtag library once for GA4
(188 KiB) and then again for Google Ads (179 KiB) — **two downloads of effectively
the same base library**.

Total unused code across these three scripts: **211.6 KiB** (40% of download is
unused code Google ships for all possible tag configurations).

---

## 2. Root Cause

GTM container has GA4 and Google Ads implemented as two independent tag types:
- **Tag 1:** Google Analytics 4 Configuration tag (fires gtag/js?id=G-KWHHFEZ5Q3)
- **Tag 2:** Google Ads Conversion Linker tag (fires gtag/js?id=AW-167...)

Each tag loads its own `gtag.js` file. Google's modern "Google Tag" consolidation
approach was released in 2022 but GTM containers created before that (or not updated)
still use the old multi-tag approach.

---

## 3. Fix — Google Tag Consolidation (GTM dashboard)

### Step-by-step in GTM (`tagmanager.google.com`):

```
1. Open GTM → Container: GTM-K5D84Z3L
2. Tags → New → Tag type: "Google Tag"
3. Tag ID: G-KWHHFEZ5Q3  (your GA4 Measurement ID)
4. Add configuration parameter: "ads_data_redaction" = true (optional, EEA compliance)
5. Trigger: All Pages (existing trigger)
6. Save as "Google Tag - G-KWHHFEZ5Q3"

7. Tags → New → Tag type: "Google Ads Conversion Tracking" (or "Google Ads Remarketing")
8. In the tag settings, set "Google Tag ID" = G-KWHHFEZ5Q3 (links to the Google Tag above)
9. This tells Google Ads to REUSE the gtag library already loaded by the Google Tag above
   → only ONE gtag/js download instead of TWO
10. Save → Submit → Publish
```

### Why this works
The unified "Google Tag" approach tells the browser to load ONE shared `gtag.js` library
for all Google products. When both GA4 and Google Ads reference the same Google Tag ID,
they share a single 188 KiB download instead of 188 + 179 = 367 KiB.

**Saving:** ~179 KiB removed from page load + 308ms blocking time eliminated.

---

## 4. Impact

| Metric | Before | After |
|---|---|---|
| Google scripts blocking time | 645ms | ~337ms (−308ms) |
| Google scripts download | 524 KiB | ~345 KiB (−179 KiB) |
| Total third-party blocking | 1,580ms | ~1,272ms |
| Production Lighthouse score | ~70 | +2-3 pts |

Combined with CR-209 (GTM defer, code done — needs deployment):
All Google scripts fire after LCP → effectively 0ms added to TBT window.

---

## 5. Note on Unused JS (211 KiB)

Even after consolidation, ~100-120 KiB of Google's gtag library will show as "unused"
in Lighthouse. This is Google's own code that loads handlers for all possible tag
configurations. Not reducible — Google controls their own library size.

---

## 6. Summary

| Item | Detail |
|---|---|
| Action | GTM dashboard — replace separate GA4+Ads tags with unified Google Tag |
| Code change | None |
| Expected saving | −179 KiB download, −308ms blocking per page load |
| Risk | Low — standard Google-recommended migration; existing tracking continues |
| Who | Owner with GTM publish access |

*Registered 2026-09-05. Source: Production Lighthouse — 3rd party scripts 1,580ms blocking.*
