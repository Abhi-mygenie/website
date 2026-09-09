# GTM Tag Registry — GTM-K5D84Z3L
# MyGenie Website — Complete Tag Audit

**Container:** GTM-K5D84Z3L (Web)
**Server-side container:** GTM-KN4B3Q2H (Stape-hosted at https://mcap.mygenie.online)
**Last audited:** 2026-09-09 (full tag-by-tag review from owner screenshots)
**GTM Version published:** "Step A-D" — Enhanced conversion (published 2026-09-09)
**Related CRs:** CR-216, CR-220 ✅, CR-221, CR-222, CR-264 ✅

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ Active | Tag is live and firing |
| ⏸️ Paused | Tag exists but is disabled — does NOT fire |
| ⚠️ Needs action | Something to fix or verify |

---

## Active Tags

---

### 1. Conversion Linker
| Field | Value |
|---|---|
| Type | Conversion Linker |
| Trigger | All Pages |
| Status | ✅ Active |
| Last edited | ~1 month ago |

**What it does:**
When a visitor arrives from a Google Ad, the URL contains a `gclid` (Google Click ID) parameter. This tag reads that `gclid` and stores it in a first-party cookie on the browser. It also cross-domain links clicks between domains.

**Why it exists:**
Without this tag, if the user lands on the homepage from a Google Ad and then navigates to `/demo`, the `gclid` in the original URL would be lost. The Conversion Linker preserves it across navigation so Google Ads can attribute the eventual booking to the original ad click.

**Note:** With the new unified "Google Tag" approach (CR-216), the Conversion Linker functionality can be built into the Google Tag itself. This tag is technically redundant if the Google Tag (tag #11 below) has "Conversion Linking" enabled. No immediate action needed — it is harmless to have both.

---

### 2. Facebook Pixel
| Field | Value |
|---|---|
| Type | Facebook Pixel |
| Trigger | All Pages |
| Status | ✅ Active |
| Last edited | ~1 year ago |

**What it does:**
Fires the Facebook `PageView` base event on every single page. This is the foundation of all Meta (Facebook/Instagram) tracking.

**Why it exists:**
- Builds Meta remarketing audiences (everyone who visited the site)
- Sends browsing behaviour back to Meta for ad optimisation
- Required prerequisite for all other FB Pixel event tags to work

---

### 3. FB - Book demo
| Field | Value |
|---|---|
| Type | Facebook Pixel |
| Trigger | Book demo (custom event = `thankyou_conversion` or `book_demo` from dataLayer) |
| Status | ✅ Active |
| Last edited | 5 days ago |

**What it does:**
Fires a Meta conversion event (likely `Lead` or custom `BookDemo`) when a user successfully completes OTP verification — i.e., a verified demo booking is confirmed.

**Why it exists:**
This is the Meta Ads conversion tag. Meta uses this signal to:
- Attribute the conversion to the specific Meta ad/campaign that drove the visitor
- Optimise campaign bidding towards users likely to book demos (Target CPA/ROAS)
- Build a "Lookalike" audience of people who booked demos

**Relationship to code:**
Fired by the `thankyou_conversion` dataLayer push from `buildLeadPayload()` in `src/lib/gtm.js`. The push includes flat `email` and `phone` fields which Meta Advanced Matching uses for hashed identity.

---

### 4. Fb form submit
| Field | Value |
|---|---|
| Type | Facebook Pixel |
| Trigger | OTP - form_submitted |
| Status | ✅ Active |
| Last edited | ~2 months ago |

**What it does:**
Fires a Meta event (likely `InitiateCheckout` or custom `FormSubmit`) when the demo form is first submitted — i.e., before OTP verification. This is an earlier, softer funnel signal than "FB - Book demo".

**Why it exists:**
Gives Meta a top-of-funnel signal. Meta can optimise ads towards users who even begin the form, not just those who complete OTP. Useful for scaling campaigns when completed conversions are low-volume.

---

### 5. GA4 - Book demo
| Field | Value |
|---|---|
| Type | Google Analytics: GA4 Event |
| Trigger | Book demo |
| Status | ✅ Active |
| Last edited | ~1 month ago |
| Measurement ID | `{{GA4 ID}}` variable |
| Linked Google Tag | ✅ "Google tag found in this container — MyGenie Website" (CR-216 confirmed ✅ for GA4 side) |
| CR-220 Fix A | ⚠️ PENDING — No dedicated "User-Provided Data" section exists in this GTM version. Fix: add `user_data` as a named Event Parameter row (see below) |

**What it does:**
Fires a GA4 event (`Book demo`) when OTP is verified. This is the **central event in the entire Enhanced Conversions pipeline**.

**Why it exists — two paths:**
- **Path A (client-side):** GA4 records the conversion in GA4 reports directly.
- **Path B (server-side):** This GA4 event is intercepted by the Stape server-side container (GTM-KN4B3Q2H). A server-side Google Ads tag (`sgtmadsct`) reads the `user_data` from this event (hashed email + phone) and sends Enhanced Conversions data to Google Ads. This is the most reliable EC path — bypasses ad blockers and iOS ITP.

**Current Event Parameters (confirmed from screenshot):**
| Parameter | Variable |
|---|---|
| event_id | `{{event_id}}` |
| email | `{{email}}` |
| phone | `{{phone}}` |
| first_name | `{{DLV First Name}}` |
| last_name | `{{DLV Last Name}}` |
| city_name | `{{city_name}}` |
| external_id | `{{External ID}}` |
| gclid | `{{DLV GCLID}}` |
| fbclid | `{{fbclid}}` |
| fbp | `{{fbp}}` |
| page_url | `{{page_url}}` |
| event_time | `{{event_time}}` |

**Current User Properties (confirmed from screenshot):**
| Property | Variable |
|---|---|
| email | `{{email}}` |
| phone | `{{phone}}` |
| first_name | `{{DLV First Name}}` |
| last_name | `{{DLV Last Name}}` |

**Consent Settings (confirmed from screenshot):**
Built-in checks: `ad_storage`, `ad_personalization`, `ad_user_data`, `analytics_storage` — all present ✅

**What is MISSING — CR-220 Fix A:**
The dedicated "User-Provided Data" section does NOT exist in this GTM version's GA4 Event tag template (confirmed from full tag screenshot). 

**Correct fix: Add `user_data` as a named Event Parameter row:**
- Parameter Name: `user_data`
- Value: `{{dlv - user_data}}`

This passes the full `user_data` object (email_address, phone_number, address.first_name, address.last_name) as a GA4 event parameter. The Stape server-side container (GTM-KN4B3Q2H) reads `user_data` from the event parameters and extracts Enhanced Conversions data from it. This is a fully supported alternative when the dedicated "User-Provided Data" field is absent.

**Complete tag structure (confirmed from owner screenshots 2026-09-08):**
1. Tag Type + Measurement ID ({{GA4 ID}})
2. Event Name: "Book demo"
3. Event Parameters: event_id, email, phone, first_name, last_name, city_name, external_id, gclid, fbclid, fbp, page_url, event_time
4. User Properties: email, phone, first_name, last_name
5. More Settings: Ecommerce (unchecked)
6. Advanced Settings: Once per event, no sequencing
7. Consent Settings: ad_storage, ad_personalization, ad_user_data, analytics_storage all gated

---

### 6. GAds - Book Demo
| Field | Value |
|---|---|
| Type | Google Ads Conversion Tracking |
| Trigger | Book demo |
| Status | ✅ Active |
| Last edited | 19 days ago |
| CR-220 Fix C | ⚠️ EC mode is currently "Automatic" → needs to be changed to "Code" (Step 5) |

**What it does:**
Fires a Google Ads conversion tracking event when OTP is verified. This is **Path A** of Enhanced Conversions — the client-side Google Ads conversion tag.

**Why it exists:**
Records the conversion directly in Google Ads for:
- Campaign performance reporting
- Smart Bidding signal (Target CPA, Target ROAS)
- Enhanced Conversions — hashed email/phone sent directly from browser to Google Ads

**The current problem (CR-220 Fix C — PENDING):**
EC mode is set to "Automatic" — Google tries to scan live HTML for form inputs at the moment the conversion fires. But the React form has already unmounted those inputs by OTP stage. Google scans the page, finds nothing, sends empty EC data.

Fix: Switch EC mode from **Automatic → Code**, point it to `{{dlv - user_data}}`. Then it reads from the dataLayer object (captured before OTP) instead of scanning the DOM.

---

### 7. Google Analytics - GA4
| Field | Value |
|---|---|
| Type | Google Tag |
| Trigger | Initialization - All Pages |
| Status | ✅ Active |
| Last edited | 6 days ago |

**What it does:**
Base initialisation tag for Google Analytics 4. Loads the GA4 measurement library and initialises the GA4 property (`G-KWHHFEZ5Q3`) on every page before any other tags fire.

**Why it exists:**
Without this, no GA4 events fire anywhere on the site. All session data, page views, form events, and the conversion event (tag #5 above) depend on this being present.

**Note on CR-216:**
This tag was recently migrated to "Google Tag" type (6 days ago). This is the right direction. However, tag #9 ("Google Tag AW-16740091756") is also a separate "Google Tag" type. If they are independently loading `gtag.js`, that is still the CR-216 duplicate-download problem. If AW-16740091756 is configured as a "linked tag" to this one (sharing the library), CR-216 is resolved. **Needs verification inside the tag config.**

---

### 8. Google form submit
| Field | Value |
|---|---|
| Type | Google Analytics: GA4 Event |
| Trigger | OTP - form_submitted |
| Status | ✅ Active |
| Last edited | ~2 months ago |

**What it does:**
Fires a GA4 `form_submitted` event when the demo form is first submitted (before OTP). The GA4 mirror of "Fb form submit" (#4).

**Why it exists:**
Top-of-funnel funnel signal in GA4. Allows analysis of form submission → OTP drop-off rate. Can also be used as a Google Ads trigger for "Form Submit" micro-conversions to supplement the primary "Book demo" conversion.

---

### 9. Google Tag AW-16740091756
| Field | Value |
|---|---|
| Type | Google Tag |
| Trigger | Initialization - All Pages |
| Status | ✅ Active |
| Last edited | 6 days ago |

**What it does:**
Base initialisation tag for Google Ads. Loads the Google Ads tracking library for Conversion ID `AW-16740091756` on every page. Also handles the Google Ads Remarketing pixel (adding visitors to remarketing audiences).

**Why it exists:**
Required for Google Ads conversion tracking (tag #6) and remarketing (adding visitors to RLSA audiences) to function.

**CR-216 note:**
This tag was migrated to "Google Tag" type (6 days ago — same day as tag #7). If it is independently loading `gtag.js`, it adds ~179 KB and ~308ms blocking on top of tag #7. Needs to be verified: open this tag and check if it has "Linked Tag ID" = `G-KWHHFEZ5Q3`. If yes → library shared, CR-216 done. If no → still duplicating the download.

**CR-221/222 connection:**
The remarketing pings (`rmkt/collect/16740091756`) that are failing in DevTools come from this tag. The trigger is "Initialization - All Pages" (fires immediately on GTM load). With CR-209 interaction-first defer active, GTM only loads after first scroll/click — so this tag fires after interaction, which should be fine for remarketing. The failing pings may be from a separate remarketing-specific sub-tag inside this Google Tag config.

---

## Paused Tags (inactive — do not fire)

---

### 10. FB - OTP Verified ⏸️
| Field | Value |
|---|---|
| Type | Facebook Pixel |
| Trigger | lead_verifided |
| Status | ⏸️ Paused |
| Last edited | ~2 months ago |

**What it was doing:**
Was firing a Meta event on OTP verification (trigger: `lead_verifided`). Likely superseded by "FB - Book demo" (tag #3) which fires on the same moment via the `book_demo` / `thankyou_conversion` event.

**Why paused:**
Redundant with "FB - Book demo". Pausing avoids double-counting the same conversion in Meta Ads.

---

### 11. fb-schedule ⏸️
| Field | Value |
|---|---|
| Type | Facebook Pixel |
| Trigger | calendly Trigger |
| Status | ⏸️ Paused |
| Last edited | ~2 months ago |

**What it was doing:**
Was firing a Meta event when a Calendly appointment was scheduled (stage 3 of the demo booking flow). This would have fired *after* "FB - Book demo" (which fires at OTP, stage 2).

**Why paused:**
Calendly-stage tracking was deprioritised or the trigger was unreliable. The primary conversion (OTP verified) is already captured in tag #3.

---

### 12. GA4 - Book Appointment ⏸️
| Field | Value |
|---|---|
| Type | Google Analytics: GA4 Event |
| Trigger | calendly Trigger |
| Status | ⏸️ Paused |
| Last edited | ~2 months ago |

**What it was doing:**
Was firing a GA4 event when a Calendly appointment was actually scheduled (the third and final stage). This would have been a confirmed "appointment made" signal, not just "demo booking started."

**Why paused:**
Likely the Calendly trigger was unreliable, or the event was consolidated into the "Book demo" event. Worth considering whether to reactivate if reliable Calendly event detection is needed.

---

### 13. GA4 - OTP Verified ⏸️
| Field | Value |
|---|---|
| Type | Google Analytics: GA4 Event |
| Trigger | lead_verifided |
| Status | ⏸️ Paused |
| Last edited | ~2 months ago |

**What it was doing:**
Was firing a GA4 event specifically on OTP verification (trigger: `lead_verifided`). This is the same moment as "GA4 - Book demo" (tag #5) but using a different trigger name (`lead_verifided` vs `book_demo`).

**Why paused:**
Redundant with "GA4 - Book demo". Two triggers for the same moment → double-counting conversions in GA4.

---

## Funnel Map — What Fires When

```
User Journey                     Tags That Fire
─────────────────────────────────────────────────────────
Page load (any page)             → Conversion Linker (#1)
                                 → Facebook Pixel (base) (#2)
                                 → Google Analytics - GA4 (#7)
                                 → Google Tag AW-16740091756 (#9)
                                   (all 4 fire on initialization)

User submits demo form           → Fb form submit (#4)   ← FB top-of-funnel
                                 → Google form submit (#8) ← GA4 top-of-funnel

User completes OTP               → FB - Book demo (#3)   ← Meta conversion
                                 → GA4 - Book demo (#5)  ← GA4 + sGTM EC Path B
                                 → GAds - Book Demo (#6) ← Google Ads conversion
```

---

## Key Issues Still Open

| Issue | CR | Tag involved | Status |
|---|---|---|---|
| Remarketing pings failing (rmkt/collect) | CR-222 | Google Tag AW-16740091756 (#9) | ⚠️ INVESTIGATE — test in Incognito first |
| Duplicate gtag.js library download | CR-216 | Google Analytics - GA4 (#7) + Google Tag AW-16740091756 (#9) | ⚠️ VERIFY — open both tags and check if linked |

---

## GA4 Property-Level Settings (analytics.google.com)

**Location:** Google Analytics → MyGenie Website (G-KWHHFEZ5Q3) → Admin → Google Tag → Settings → "Allow user-provided data capabilities"
**Checked:** 2026-09-09

| Setting | State | Correct? |
|---|---|---|
| "Allow user-provided data capabilities" master toggle | ✅ ON (blue) | Required — correctly enabled |
| "Automatically detect user-provided data" | ✅ UNCHECKED | Correct — DOM scanning fails with React |
| "Specify CSS selectors or JS variables" | ✅ UNCHECKED | Correct — not needed |
| Method in use | "Add a code snippet" (GTM user_data event param) | Correct — our GTM setup IS this method |

**No additional changes needed in GA4 property settings.** Master toggle is ON. The GTM `user_data` event parameter approach is equivalent to the "code snippet" method Google refers to here.

---

## Notes for Future Agents

- **"Book demo" trigger** = dataLayer event `thankyou_conversion` / `book_demo` — fires when OTP is verified in `src/components/site/DemoBottomSheet.jsx` / `DemoForm.jsx`
- **"OTP - form_submitted" trigger** = dataLayer event `form_submitted` — fires when form is first submitted (before OTP)
- **"lead_verifided" trigger** = older trigger name for OTP verification — now superseded by "Book demo" trigger; only paused tags use it
- **"calendly Trigger"** = was a dataLayer event fired by `CalendlyInline.jsx` on appointment scheduled; currently unused by active tags
- **CR-220 Fix B** (user_data in dataLayer) is DONE in the build — `src/lib/gtm.js` `buildLeadPayload()` includes `user_data: { email_address, phone_number, address }`
- **CR-220 Fix A** (dlv - user_data variable + GA4 tag) — DONE in this GTM session (2026-09-08)
- **CR-220 Fix C** (GAds tag EC mode) — PENDING Step 5

---

*Created 2026-09-08. Source: Owner GTM screenshot + CR-220/216/221/222 analysis.*
