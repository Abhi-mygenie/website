# CR-3B — Owner GTM / Ads / Meta Action Brief (blockers on YOUR side)

> ## 🔄 STATUS UPDATE — 2026-06-09 (progress this session)
> **DONE (owner, in GTM):** ✅ `calendly Trigger` created (Custom Event, Event name `demo_booked`) · ✅ `GA4 - Book Appointment` tag created on it · ✅ **container PUBLISHED** (13 tags / 9 triggers).
> **DONE (code side, by main agent):** ✅ Site event names aligned to the live container — emits `form_submitted`, `lead_verifided` (typo matched on purpose), `thankyou_conversion` (= Book Demo), and the NET-NEW `demo_booked` (Calendly). ✅ Pre-deploy fixes: re-added missing `REACT_APP_GTM_ID` + unblocked `.env` in `.gitignore`; deployment_agent PASS.
> **KEY FINDING:** Google Ads **"Book appointments" conversion is Source = "Import from clicks"** (Zapier-fed) → it has **no tag / Conversion-ID / Label**, so you CANNOT attach a GTM tag to it. Path chosen: the `GA4 - Book Appointment` tag sends `demo_booked` to GA4 → after a live test booking, mark `demo_booked` as a **GA4 Key event** → import it into Google Ads as the appointment conversion (your account is GA4-linked).
> **MOOT/SUPERSEDED:** the earlier "repoint GAds - Book Demo → lead_verified" item — `GAds - Book Demo` already fires on the verified event (`lead_verifided`), so no repoint needed.
> **REMAINING owner TODO (priority):** (1) Deploy site → 1 test booking → verify all events in GTM Preview + GA4 Realtime; (2) finish the Google Ads "Book appointment" conversion from the GA4 `demo_booked` event → set Primary → **turn off Zapier appointment import**; (3) **unpause `FB - OTP Verified` + `GA4 - OTP Verified`**; (4) #1 Enhanced Conversions + Advanced Matching; (5) #3 map values; (6) #4 GA4 custom dimensions; (7) #5 junk exclusion audience; (8) #2 consent variables.


> Our website code is DONE — every field below is already pushed to `window.dataLayer` on
> `www.mygenie.online`. The remaining work is configuration inside GTM / Google Ads / Meta that
> only you (account owner) can do. Nothing here needs another code change.
> **Container:** `GTM-K5D84Z3L` · **GA4:** `G-KWHHFEZ5Q3` · **Pixel:** `2862017797322752` · **Google Ads:** `AW-16740091756 / NtqdClejmOgaEOyOpq4-`

## Events our site now fires (with the new fields)
| Event | When | Key new fields in the payload |
|---|---|---|
| `form_submitted` | every lead submit | `conversion_value`, `form_location`, `otp_verified`, `lead_quality`, `plan_interest`, click-IDs |
| `lead_verified` | OTP verified | same + `conversion_value:500` |
| `demo_booked` | Calendly booked | same + `conversion_value:2000` |
| `page_view` | every route change | page_path/page_url |
Identity for matching on every lead event: `email`, `phone` (E.164), `first_name`, `last_name`, `city_name`, `external_id`.
Click-IDs: `gclid`, `fbclid`, `fbp`, `gbraid`, `wbraid`, `msclkid`, `source`.

---

## 🔴 BLOCKER 1 — Repoint the "Book demo" conversion to `lead_verified` (do this first)
- **Where:** GTM → Tags → `GAds - Book Demo`.
- **Today:** it fires on the `form_submitted` trigger → Google Ads "Submit lead form" is counting **unverified** leads.
- **Do:** change its trigger to the existing **`lead_verified`** custom-event trigger. Route `form_submitted` to a "Qualified leads" tag instead (secondary). Publish.
- **Why it matters:** until this is changed, smart bidding optimizes toward junk/unverified submits.

## 🔴 BLOCKER 2 — Unpause the OTP-Verified tags
- **Where:** GTM → Tags → `FB - OTP Verified` and `GA4 - OTP Verified` (both currently PAUSED).
- **Do:** unpause both. Their trigger `lead_verified` is already correct (no rename needed). Publish.

## 🟠 BLOCKER 3 — Enhanced Conversions (Google) + Advanced Matching (Meta)  ⭐ biggest lever
- **Google (GTM/Ads):** Google Ads → Conversions → your lead action → turn **ON "Enhanced conversions for leads"**. In GTM, on the Google Ads conversion tag, add **User-Provided Data** → map from dataLayer: `email`, `phone`, `first_name`, `last_name`, `city_name`. GTM hashes automatically.
- **Meta (Events Manager/GTM):** turn **ON Advanced Matching** and map: `em`→`email`, `ph`→`phone`, `fn`→`first_name`, `ln`→`last_name`, `ct`→`city_name`, `external_id`→`external_id`.
- **Verify:** Google Tag Assistant (EC active) + Meta Event Match Quality score goes up.
- **Why it's on you:** the raw fields are in the dataLayer already; turning EC/AM on + the variable mapping is account-side only.

## 🟠 BLOCKER 4 — Tiered conversion values (value-based bidding)
- **Where:** GTM → the GA4/Ads/Meta conversion tags.
- **Do:** map the dataLayer **`conversion_value`** (and `currency` = INR) into each conversion tag's Value field. Values our site sends: form_submitted=₹0, **lead_verified=₹500**, demo_booked=₹2000. In Google Ads, set "Book appointments"/demo_booked as a **value-based secondary** conversion.
- **Confirm:** is ₹2000 the right value for a booked demo, or your real avg deal value? Tell us and we'll change one line.

## 🟠 BLOCKER 5 — Create the `demo_booked` → "Book appointments" conversion
- **Where:** GTM + Google Ads.
- **Do:** create a custom-event trigger **`demo_booked`**, then a Google Ads Conversion tag (Website source — the old one was Import-from-clicks/offline, which can't take a browser tag; create a NEW Website-source action if needed) + GA4/FB tags on it.

## 🟡 BLOCKER 6 — Register GA4 custom dimensions (segmentation)
- **Where:** GA4 Admin → Custom definitions → Custom dimensions (event-scoped).
- **Do:** register `otp_verified`, `form_location`, `plan_interest` (and optionally `lead_quality`). Then they appear in GA4 reports/audiences.

## 🟡 BLOCKER 7 — Build the junk-exclusion audience (suppression)
- **Where:** Google Ads / Meta audiences.
- **Do:** build an exclusion/remarketing-suppression audience where **`lead_quality = junk`** so you stop paying to retarget bots/too-fast submits.

## 🟡 BLOCKER 8 — Map Consent Mode v2 variables
- **Where:** GTM → Consent settings.
- **Do:** our site sets the consent **default (denied)** before the container loads and pushes a **`consent update`** when the visitor clicks Accept/Decline on the banner (signals: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`). In GTM, ensure tags have "Additional consent checks" / built-in consent configured and the Consent Overview shows them respecting these signals.

## ⚪ BLOCKER 9 — Decommission Zapier + re-verify after deploy
- Once browser-side conversions are confirmed, **turn off the Zapier** Freshsales→Ads zaps (booking/qualified) to avoid double counting.
- GTM is **host-gated to www.mygenie.online** → it does NOT load on the preview URL by design. After production deploy, use **GTM Preview mode** to confirm every tag fires on its trigger.

---

### Quick priority order
1. Blocker 1 (repoint Book demo) + Blocker 2 (unpause OTP tags) — correctness, do today.
2. Blocker 3 (Enhanced Conversions / Advanced Matching) — biggest match-rate gain.
3. Blockers 4 & 5 (values + demo_booked conversion).
4. Blockers 6, 7, 8 (dimensions, exclusion audience, consent mapping).
5. Blocker 9 (kill Zapier + post-deploy verify).
