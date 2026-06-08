# CR-3 — Analytics & Ads — G1 Discovery (GTM Audit)

> **Status:** G1 Discovery. Inputs gathered from owner + live-site scan + GTM container snapshot.
> **Last updated:** 2026-06-08. No code written yet (discovery only).

> ## 🚨🚨 CRITICAL — OWNER-SIDE GTM ACTION (DO NOT MISS) 🚨🚨
> **REPOINT the `GAds - Book Demo` tag to fire on the `lead_verified` trigger — NOT `form_submitted`.**
> Today it fires on `form_submitted` (any submit), so the Google Ads goal **"Submit lead form" is counting UNVERIFIED leads**. Per the locked decision, **"Book demo"/"Submit lead form" must count ONLY OTP-verified leads**.
> - `lead_verified` → **Book demo** / Submit lead form (PRIMARY, bid)
> - `form_submitted` → **Qualified leads** (secondary)
> If this repoint is skipped, ad bidding will optimize toward junk/unverified submits. **Verify in GTM before publishing.**


## 1. Owner-provided IDs
| Input | Value | For |
|-------|-------|-----|
| GA4 Measurement ID | `G-KWHHFEZ5Q3` | CR-3 A (client-side). **Same ID as existing live site** → migration continuity. |
| Meta Pixel / Dataset ID | `2862017797322752` (16-digit, valid) | CR-3 A |
| Google Ads Conversion ID | `AW-16740091756` (from GTM "Google Tag AW-16740091756") | CR-3 A / B |
| Google Ads Conversion **Label** | `NtqdClejmOgaEOyOpq4-` → full target `AW-16740091756/NtqdClejmOgaEOyOpq4-` (⚠️ confirm not truncated) | CR-3 A / B |
| Meta CAPI access token | ⏳ PENDING (Events Manager → Dataset → Settings → Conversions API) | CR-3 B |
| Consent banner | Owner: "note for later" (no banner for now) | CR-3 A |

## 2. Current live-site tracking architecture (scanned from www.mygenie.online)
- **Single GTM container: `GTM-K5D84Z3L`** drives EVERYTHING. No GA4/Ads/Pixel hardcoded.
- Microsoft **Clarity** tag `q52v3y8anu` (session recording/heatmaps).
- **reCAPTCHA v3** site key `6Lep0NAqAAAAAOUMtIZbMpCnXVC1VRSd8oYPAv0q`.
- Site is jQuery/Bootstrap (the OLD site). New build = React SPA.

### dataLayer contract the existing site pushes (THE key to mirror)
Two custom events on the lead flow:
1. **`form_submitted`** — on lead form submit.
2. **`lead_verified`** — on OTP verification.

Both payloads carry:
```
event, name, email, phone, outlet_type, years_in_business, message,
page_url, event_time (unix sec), event_id, fbp, currency:'INR',
conversion_value:'0', outlet_name, city_name, gclid, fbclid, source (utm_source)
```
> `event_id` + `fbp` + `gclid` + `fbclid` present ⇒ container was built for **Meta Pixel↔CAPI dedup** and **Google offline conversions**. Big head start for CR-3 B.

## 3. GTM container snapshot — Tags (GTM-K5D84Z3L)
**ACTIVE**
- Conversion Linker → All Pages
- Facebook Pixel (base) → All Pages
- FB - Book demo (FB Pixel) → trigger `Book demo`
- GA4 - Book demo (GA4 Event) → trigger `Book demo`
- GAds - Book Demo (Google Ads Conversion) → trigger `Book demo` (uses `AW-16740091756`)
- Google Analytics - GA4 (Google Tag config, `G-KWHHFEZ5Q3`) → Init - All Pages
- Google Tag `AW-16740091756` (Ads base) → Init - All Pages

**PAUSED**
- FB - OTP Verified → trigger `lead_verified` (correct) ⏸ PAUSED
- GA4 - OTP Verified → trigger `lead_verified` (correct) ⏸ PAUSED
- Google Lead data Tag (Data Tag) → "Google lead Data Trigger"  ⏸
- Meta Lead Data Tag (Data Tag) → "Meta Lead data Trigger"  ⏸
- otp Button data Tag (Data Tag) → "OTP - form_submitted" (status unconfirmed)

## 4. 🐞 Bugs / gaps found in current setup (flag to marketing/owner — GTM-side, not our code)
1. **CORRECTED 2026-06-08 (clearer GTM screenshot):** there is NO typo — the trigger is correctly spelled `lead_verified`. The real issue is only that `FB - OTP Verified` + `GA4 - OTP Verified` tags are **PAUSED** ⇒ OTP-verified conversions not firing today. Fix = UNPAUSE them (no rename needed).
2. **Conversion fires on `form_submitted`** (any submit), not verified/booked ⇒ junk/unverified counted as conversions. With CR-4B OTP + Calendly `demo_booked`, we can fire conversions on *verified*/*actually-booked* signals = cleaner ad optimization.
3. Several **"Data Tags"** (Google Lead / Meta Lead, enhanced-conversion/offline lead data) set up but **paused** — dormant groundwork for CR-3 B offline conversions.

## 5. Plan implication (lock in G2)
**CR-3 A — non-disruptive route (recommended):**
- New React site loads the **same container `GTM-K5D84Z3L`**.
- Push the **same events** (`form_submitted`, `lead_verified`) with the **same variable shape** to `dataLayer`. All variables already captured by CR-2 (gclid/fbclid/fbp/city/utm).
- Also fire on SPA route change for GA4 pageviews (GTM History Change trigger or pushed pageview).
- Optionally add Clarity (`q52v3y8anu`) + reCAPTCHA v3 if owner wants parity.
- Result: existing GA4/Ads/Pixel tags fire untouched; **owner edits nothing in GTM** (except the optional bug fixes below).

**Recommended GTM-side fixes for owner (optional, improves quality):**
- UNPAUSE OTP-Verified tags (trigger `lead_verified` is correct — no rename).
- Consider re-pointing the Ads "Book demo" conversion to fire on `lead_verified` (OTP-verified) or a `demo_booked` (Calendly) event instead of raw `form_submitted`.

**CR-3 B — offline conversions:** reuse captured `gclid`/`fbclid`/`fbp` + shared `event_id` to upload booked-demo signals. Existing "Data Tags" + Conversion Linker show the account is offline-ready. Needs Ads Conversion Label + Meta CAPI token. Decide: Zapier (Freshsales→Ads) vs. our backend API.

## 5c. ⚠️ CORRECTION — "Book appointment" conversion already exists (2026-06-08)
- Google Ads has a SECOND goal **"Book appointment"** (separate from "Submit lead form"/Book demo), 1 primary action, status **"Needs attention"** (likely not receiving conversions recently).
- This = the demo/appointment-booking conversion, **already tracked in BOTH Google + Meta**. So `demo_scheduled` is NOT net-new at the GTM level — there is an EXISTING event/trigger for it (fired from the old booking/thank-you page, not the homepage that was scanned).
- **Decision:** reuse the EXISTING "Book appointment" event — do NOT create a new one. New React site must push the SAME dataLayer event name + payload from `CalendlyInline.jsx` so existing GA4/Meta/GAds tags fire untouched.
- **PENDING from owner:** the exact existing dataLayer event NAME, its GTM trigger, the GA4/FB/GAds tags wired to it, and the payload variable shape. (Owner to send GTM tag+trigger screenshot + the booking page `dataLayer.push` code.)
- Note: new `CalendlyInline.jsx:86` catches `calendly.event_scheduled` and calls `POST /api/demo-booked` but pushes NOTHING to dataLayer → that's the gap to fill with the existing event name.

## 5h. 🧩 CLARIFICATION — GTM "Book demo" vs Google Ads "Submit lead form" (same conversion, different layers, 2026-06-08)
Owner asked how these relate. They are the SAME conversion at different layers:
- GTM TRIGGER "Book demo" (Custom Event) = the signal → fires
- GTM TAG "GAds - Book Demo" (Google Ads Conversion Tracking, Conv ID 16740091756 / Label NtqdClejmOgaEOyOpq4-) → sends to
- Google Ads CONVERSION ACTION (that ID+Label) → categorized under
- Google Ads GOAL "Submit lead form" → bundled in goal group "Group 2 goals" (with "Request quotes").
"Book demo" = GTM-side technical name; "Submit lead form" = Google Ads-side goal/reporting bucket. 61 results / value 61.00 = 61 conversions @ value 1 (no real ₹ value → fix via backlog #3 tiered values).
**IMPLICATION:** the "GAds - Book Demo" tag currently fires on the "Book demo" trigger (= `form_submitted` today). Per locked decision, owner must repoint it to fire on `lead_verified` so "Submit lead form" counts only VERIFIED leads (form_submitted → "Qualified leads" instead).

## 5g. 🎯 DECISION REFRAME — ONLINE vs OFFLINE (2026-06-08, FINAL)
**Core decision:** All conversion events fire from the WEBSITE BROWSER as ONLINE events. This is the exact reason NO Meta CAPI token, NO Google Ads API, and NO Zapier are needed.

**Definitions (locked):**
- ONLINE event = conversion moment happens IN the browser on our site → browser pixel + GTM tag fires it directly; `gclid` cookie (via Conversion Linker) attributes it. No token/API/Zapier.
- OFFLINE event = conversion moment happens with NO browser on our site (e.g., booking from a Calendly email/reschedule link, or a rep marking "qualified" in Freshsales days later) → can ONLY be sent server-side → REQUIRES CAPI / Google Ads API / Zapier.

**Why we need none of those tokens/integrations:** because every event below is fired as an ONLINE (browser) event:
- `form_submitted` (verified or not) → happens in browser ✅ online → "Qualified leads"
- `lead_verified` (OTP) → happens in browser ✅ online → "Book demo"
- `demo_booked` (inline Calendly widget) → happens in browser ✅ online → "Book appointments"

**ACCEPTED TRADE-OFF (the flip side):** Conversions that occur with NO browser present are NOT captured, by choice:
- Bookings made later from the Calendly email/reschedule link (off-site).
- True CRM-stage qualification done by a sales rep in Freshsales.
- Plus ~10-30% loss to ad-blockers / iOS ITP that server-side would have recovered.

**One-line summary:** We avoid CAPI/Google Ads API/Zapier because every event now fires in the browser as an online conversion; the only thing given up is conversions that occur with no browser present (email-link bookings / CRM-side qualification).

## 5f. 📊 FINAL EVENT→CONVERSION MAPPING (2026-06-08)
| Funnel stage | Website dataLayer event | Google Ads conversion action | Role |
|---|---|---|---|
| Form submit, NOT OTP-verified | `form_submitted` (unverified) | **Qualified leads** | secondary/observe (recommended) |
| Form submit + OTP verified | `lead_verified` | **Book demo** | PRIMARY (bid) — CONFIRM with owner |
| Calendly booking | `demo_booked` | **Book appointments** | conversion |
- All 3 fired from website via GTM `GTM-K5D84Z3L`. No Zapier.
- Recommend "Qualified leads"=secondary (observation), "Book demo"=primary (bid optimization toward verified).
- OPEN: confirm OTP-verified → "Book demo".

### How to repoint "Book appointment" (and Qualified leads) for browser firing — owner/marketing, Google Ads + GTM:
1. Google Ads source is IMMUTABLE — an "Import from clicks" action can't take a browser tag. Open Goals→Conversions→"Book appointments"→Tag setup. If it shows Conversion ID+Label → use it. If import-only → create NEW Website-source conversion action (+New→Website→Use GTM) → get Conversion ID (AW-16740091756)+new Label.
2. GTM: New Tag → Google Ads Conversion Tracking → enter ID+Label → trigger = custom event `demo_booked` → Submit/Publish.
3. Conversion Linker (All Pages) already exists → reads gclid cookie. Done.
4. Repeat: GTM tag for "Qualified leads" on `form_submitted`; confirm "Book demo" on `lead_verified`.

## 5e. 🔄 DIRECTION CHANGE — fire everything from website, drop Zapier (2026-06-08)
Owner wants to ELIMINATE Zapier and fire all events directly from the website (browser → GTM). Zapier deemed an unrequired integration at this stage.

**Can move to website (browser-fired via GTM, gclid present in cookie):**
- `form_submitted` (any submit, incl. OTP-unverified) — lead/remarketing
- `lead_verified` (OTP verified) — PRIMARY conversion
- `demo_booked` (Calendly inline widget `event_scheduled`) — "Book appointment" conversion
→ Removes need for Zapier, Meta CAPI token, and Google Ads API for these three. CR-2 supplies all payload vars.

**Required owner-side GTM/Ads config (NOT our code):**
- "Book appointment" Google Ads conversion source is currently **"Website (Import from clicks)"** (offline). To fire browser-side, repoint to a standard **"Website"** source (or new website-source conversion) + add a GTM Google Ads tag on `demo_booked`.
- UNPAUSE OTP-Verified tags (no typo — trigger `lead_verified` correct).
- Decommission Zapier booking zap after browser-side verified.

**Trade-offs flagged to owner (must accept):**
1. Off-site bookings (Calendly email/reschedule link, no browser session) won't fire browser-side — only a server-side webhook catches those. Need confirm: are ~all bookings done in the on-site inline widget?
2. Browser conversions lose ~10-30% to ad-blockers/iOS ITP vs server-side. Acceptable for simplicity?

**⚠️ Cannot move to website — "Qualified leads":**
- Fires when a sales rep marks a lead Qualified in Freshsales (no browser). MUST stay server-side (a small Zapier zap OR our backend uploads via existing Freshsales/Calendly webhook). OPEN DECISION: keep (needs server path) or drop.

## 5d. ✅ OFFLINE ARCHITECTURE (Zapier) — superseded by 5e above; kept for reference
Zapier screenshots confirm the offline layer is FULLY managed by Zapier, triggered from Freshsales:
- Zapier action = Google Ads "Create Click Conversion" (offline import), trigger = Freshworks CRM record (Created At / Updated At).
- Conversion Action "Book appointments" — Source "Website (Import from clicks)" = gclid-based offline upload, timestamp from Freshsales.
- Conversion Action "Qualified leads" — same gclid offline pattern.
- Tracked in BOTH Google + Meta via Zapier.

**Division of responsibility (FINAL):**
| Layer | Event | Fired by | Website's job |
|-------|-------|----------|---------------|
| Online | `form_submitted` (any submit) | Website → GTM | push dataLayer (reporting/remarketing) |
| Online | `lead_verified` (OTP verified) = OUR conversion | Website → GTM | push dataLayer |
| Offline | "Book appointments" (Calendly booked) | **Zapier ← Freshsales (gclid)** | NOTHING — just ensure gclid on Freshsales record |
| Offline | "Qualified leads" | **Zapier ← Freshsales (gclid)** | NOTHING — just ensure gclid on Freshsales record |

**Implications:**
- ❌ We do NOT build any backend offline uploader. ❌ We do NOT need Meta CAPI token. ❌ We do NOT fire "Book appointment"/demo_scheduled as a website conversion (withdraws the earlier ask for that dataLayer event — Zapier handles the booking conversion from Freshsales).
- ✅ The ONLY website dependency for offline = **gclid/fbclid must be captured & written to Freshsales for EVERY lead, including OTP-unverified ones** (so Zapier can upload). CR-2 already writes click IDs to Freshsales — VERIFY the exact field Zapier's trigger reads.
- ⚠️ OPEN: do they also want a browser-side GA4/Meta Pixel fire on Calendly booking (immediate, Pixel-dedup)? Optional — the booking *conversion* is already covered by Zapier offline. Confirm with owner.
- ⚠️ EEA consent note shown in Zapier (March 2024 consent mode) — relevant to the deferred consent-banner item.

## 5b. 🔑 OWNER DECISIONS LOCKED (2026-06-08)
- **Conversion definition:** ONLY a **verified** lead = a conversion. `form_submitted` alone (OTP **unverified**) is **NOT** a conversion for us. The conversion = OTP-**verified** form submit (`lead_verified`).
- **Unverified OTP leads:** still SAVED to Mongo + Freshsales, tagged `OTP-Unverified` (never lost) — but used only for volume/remarketing/reporting, **NOT** counted/optimized as conversions, and **NOT** uploaded as offline conversions.
- **Online conversion** = `lead_verified` (OTP verified). **First/primary offline conversion** = Calendly **`demo_scheduled`** (real booking). Optional deeper offline signal later = Freshsales qualified/customer.
- **Required GTM fixes (owner side, GTM-only — not our code):** UNPAUSE the GA4/FB "OTP Verified" tags (trigger `lead_verified` is correct — no rename), and (recommended) make the Google Ads "Book demo" conversion fire on `lead_verified` instead of raw `form_submitted`.
- **Offline upload route:** TBD — Zapier (owner-managed, recommended) vs. our backend. Needs Meta CAPI token either way.

## 6. Still needed from owner
- [ ] Google Ads Conversion **Label** (GTM "GAds - Book Demo" tag)
- [ ] Meta CAPI access token
- [ ] Confirm: reuse `GTM-K5D84Z3L` on new site? (recommended)
- [ ] Confirm: Freshsales→Ads offline via Zapier or our backend?
