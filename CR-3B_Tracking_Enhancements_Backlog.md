# CR-3 — Tracking Enhancements Backlog (post Part A)

> **Status:** Backlog — to be addressed ONE BY ONE in the priority order below.
> **UPDATE 2026-06-08 (iteration_10):** Shipped the low-risk **code batch** (#4 + #5 + #6) + **#3 tiered values** + **#2 Consent Mode v2 + banner**. See ✅ markers per item. All remaining work on these items is owner/GTM-side (mapping in GTM, registering custom dimensions, building exclusion audiences). Verified via headless dataLayer assertion (lead API mocked → no real lead created).
> **Context:** CR-3 A (browser dataLayer events into `GTM-K5D84Z3L`) is DONE & verified
> (`/app/CR-3A_Build_Spec.md`). These items make the tracking best-in-class. Browser-first means
> Enhanced Conversions / Advanced Matching is the highest-value gap (recovers cookieless/ITP loss
> without a server). Each item notes: what it does · what to send · who does it (our code vs GTM/owner) · impact.
> **Created:** 2026-06-08.

---

## P0 — #1 Enhanced Conversions (Google) + Advanced Matching (Meta)  ⭐ BIGGEST LEVER
> **Step A (our code) DONE & VERIFIED 2026-06-08:** `buildLeadPayload` now emits `first_name`/`last_name` (split from name), normalized `email` (lowercase+trim) and `phone` (E.164 `+91…`), and `external_id` (= normalized phone). Verified in dataLayer for `form_submitted` (same helper feeds `lead_verified`/`demo_booked`). Steps B/C/D below are owner/GTM-side and still pending.
- **What:** Send hashed email + phone (+ name/city) WITH each conversion so Google/Meta match the user even when cookies fail. Recovers most of the ~10–30% ad-blocker/iOS-ITP loss WITHOUT any server-side.
- **What to send:** email, phone, first/last name, city (already in our dataLayer as `email`,`phone`,`name`,`city_name`). Meta Advanced Matching keys: `em`,`ph`,`fn`,`ln`,`ct`,`external_id`.
- **Who:** Mostly GTM/owner — turn ON Google "Enhanced Conversions for Leads" + Meta "Advanced Matching", and map our dataLayer fields as user-provided data (GTM hashes automatically). Our code: ensure name is split to first/last + add `external_id` (e.g., phone) — tiny payload tweak.
- **Impact:** Single biggest match-rate + measured-conversion gain for a browser-only setup.

## P0 — #2 Consent Mode v2 (Google)
> **✅ CODE DONE 2026-06-08 (iteration_10):** `gtm.js` sets EEA-safe `consent default` (all denied + `wait_for_update:500`) BEFORE the container loads, applies any stored choice immediately, and exposes `updateConsent()`. New `ConsentBanner.jsx` (Accept all / Decline, testids `consent-banner`/`consent-accept-btn`/`consent-decline-btn`/`consent-privacy-link`) persists `mg_consent` in localStorage and pushes a `consent update`. Verified: Accept → ad_storage/ad_user_data/ad_personalization/analytics_storage all `granted`. **Remaining (owner/GTM):** map the consent variables/templates in GTM; confirm EEA targeting.
- **What:** Consent signals so Google can MODEL conversions it can't directly observe; required for EEA. Improves modeling even for non-EEA traffic.
- **What to send:** `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` (default + update) via GTM.
- **Who:** GTM/owner (consent default+update templates); pairs with a lightweight consent banner (deferred item). Our code: optional banner UI later.
- **Impact:** Compliance + recovered/modeled conversions; protects EEA data.

## P1 — #3 Tiered conversion values (value-based bidding)
> **✅ CODE DONE 2026-06-08 (iteration_10):** `gtm.js` `CONVERSION_VALUES` map drives `conversion_value` per event via the new `pushLead(event, …)` helper — **form_submitted=₹0, lead_verified=₹500 (owner-set "Book demo"), demo_booked=₹2000 (default — confirm/adjust with owner)**. Emitted as string (live-site contract). **Remaining (owner/GTM):** map `conversion_value`→GA4/Ads/Meta; set demo_booked as a value-based secondary conversion.
- **What:** Different `conversion_value` per funnel stage so smart bidding optimizes toward revenue, not raw counts. Extends the demo_booked value idea.
- **What to send:** suggested — `form_submitted`(qualified)=₹0–50, `lead_verified`=₹200, `demo_booked`=expected demo→deal value (e.g. ₹2,000). Confirm real numbers with owner.
- **Who:** Our code (set `conversion_value`/`currency` per event in `buildLeadPayload`/per push) + GTM maps value to GA4/Ads/Meta. Set `demo_booked`/"Book appointments" as a value-based (secondary) conversion in Google Ads.
- **Impact:** Bidding chases revenue; lowers effective cost-per-deal.

## P1 — #4 Lead-quality & segmentation params (GA4 custom dimensions)
> **✅ CODE DONE 2026-06-08 (iteration_10):** payload now carries `otp_verified` (bool), `form_location` (homepage/sector:<slug>/contact/roi/pricing-buy/pricing-quote/calendly), and `plan_interest` (CheckoutModal → plan name). **Remaining (owner/GTM):** register these as GA4 custom dimensions.
- **What:** Extra params to segment which leads actually convert.
- **What to send:** `otp_verified` (bool), `outlet_type` (have), `city` (have), `plan_interest`, `form_location` (which page/CTA fired it). Add `otp_verified` + `form_location` (2-line payload tweak).
- **Who:** Our code (payload) + GTM registers them as GA4 custom dimensions.
- **Impact:** Budget reallocation by segment (e.g., "cafés in Pune from gclid convert 3×").

## P2 — #5 Negative / suppression signals
> **✅ CODE DONE 2026-06-08 (iteration_10):** `lead_quality: "junk"|"ok"` added to every lead push, derived by `leadQuality(signals)` in `antiBot.jsx` (mirrors backend `looks_like_bot`: honeypot filled OR sub-2000ms fill = junk). **Remaining (owner/GTM):** build an exclusion/suppression audience from `lead_quality=junk`.
- **What:** Mark low-quality/junk leads so you can build EXCLUSION audiences and stop paying to retarget bots/junk.
- **What to send:** `lead_quality: "junk"|"ok"` derived from the existing anti-junk layer (honeypot / too-fast / rate-limited).
- **Who:** Our code surfaces the flag (anti-junk already detects) + GTM/Ads builds exclusion audience.
- **Impact:** Less wasted spend on junk retargeting.

## P2 — #6 Full click-ID coverage
> **✅ CODE DONE 2026-06-08 (iteration_10):** `buildLeadPayload` now also emits `gbraid`, `wbraid`, `msclkid` (alongside existing `gclid`/`fbclid`/`fbp`). All sourced from CR-2 `getAttribution()`. Verified present in dataLayer. No further code needed; owner enables Bing/Microsoft Ads mapping only if running those campaigns.
- **What:** Include all click ids for complete attribution.
- **What to send:** already send `gclid`,`fbclid`,`fbp`. ADD `gbraid`/`wbraid` (iOS Google) and `msclkid` (only if running Microsoft/Bing Ads). CR-2 already captures all of these.
- **Who:** Our code (add to `buildLeadPayload`) — quick.
- **Impact:** Recovers iOS Google attribution; future-proofs for Bing.

## P2 — #7 GA4 standard/recommended event names
- **What:** Map custom events to GA4 recommended events so built-in reports/audiences auto-populate.
- **What to send:** `form_submitted`→`generate_lead`, `demo_booked`→`schedule`, future deal→`purchase`.
- **Who:** GTM/owner (tag config). No code.
- **Impact:** Cleaner GA4 reporting + automatic audiences.

## P3 — #8 `user_id` for cross-device (optional, higher effort)
- **What:** Stable `user_id` to stitch a user across devices in GA4.
- **What to send:** a stable id (needs login/portal first).
- **Who:** Our code (when auth/portal exists) + GA4 config.
- **Impact:** True de-duplicated cross-device journeys. Only worthwhile once there's a login.

---

## Recommended execution order
1. **#1 Enhanced Conversions + Advanced Matching** (P0, near-zero code, biggest gain) — do first.
2. **#3 Tiered values** (P1) — needs owner's ₹ values.
3. **#2 Consent Mode v2** (P0 compliance) — pairs with consent banner.
4. **#4 Quality/segmentation params** + **#6 click-ID coverage** + **#5 suppression** (small code batch).
5. **#7 GA4 recommended events** (GTM only).
6. **#8 user_id** (deferred until login/portal exists).

## Small code batch we can ship together (when greenlit)
`buildLeadPayload` / forms additions: split name→`first_name`/`last_name`, add `external_id`, `otp_verified`,
`form_location`, `lead_quality`, and pass `gbraid`/`wbraid`/`msclkid`. Enables #1, #4, #5, #6 in one low-risk edit.
Values (#3) + GA4/Ads/Meta mapping (#1,#2,#7) are owner/GTM-side.
