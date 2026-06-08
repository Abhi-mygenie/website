# CR-3 — Analytics & Ads — G1 Discovery (GTM Audit)

> **Status:** G1 Discovery. Inputs gathered from owner + live-site scan + GTM container snapshot.
> **Last updated:** 2026-06-08. No code written yet (discovery only).

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
- FB - OTP Verified → trigger `lead_verifided`  ⏸
- GA4 - OTP Verified → trigger `lead_verifided`  ⏸
- Google Lead data Tag (Data Tag) → "Google lead Data Trigger"  ⏸
- Meta Lead Data Tag (Data Tag) → "Meta Lead data Trigger"  ⏸
- otp Button data Tag (Data Tag) → "OTP - form_submitted" (status unconfirmed)

## 4. 🐞 Bugs / gaps found in current setup (flag to marketing/owner — GTM-side, not our code)
1. **Trigger typo:** site fires `lead_verified`, but GTM OTP-Verified triggers listen for **`lead_verifided`** (misspelled). Mismatch = never matches. Both those tags also PAUSED ⇒ **OTP-verified conversions are NOT tracked today.**
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
- Fix `lead_verifided` → `lead_verified` and unpause OTP-Verified tags (track verified leads).
- Consider re-pointing the Ads "Book demo" conversion to fire on `lead_verified` (OTP-verified) or a `demo_booked` (Calendly) event instead of raw `form_submitted`.

**CR-3 B — offline conversions:** reuse captured `gclid`/`fbclid`/`fbp` + shared `event_id` to upload booked-demo signals. Existing "Data Tags" + Conversion Linker show the account is offline-ready. Needs Ads Conversion Label + Meta CAPI token. Decide: Zapier (Freshsales→Ads) vs. our backend API.

## 5c. ⚠️ CORRECTION — "Book appointment" conversion already exists (2026-06-08)
- Google Ads has a SECOND goal **"Book appointment"** (separate from "Submit lead form"/Book demo), 1 primary action, status **"Needs attention"** (likely not receiving conversions recently).
- This = the demo/appointment-booking conversion, **already tracked in BOTH Google + Meta**. So `demo_scheduled` is NOT net-new at the GTM level — there is an EXISTING event/trigger for it (fired from the old booking/thank-you page, not the homepage that was scanned).
- **Decision:** reuse the EXISTING "Book appointment" event — do NOT create a new one. New React site must push the SAME dataLayer event name + payload from `CalendlyInline.jsx` so existing GA4/Meta/GAds tags fire untouched.
- **PENDING from owner:** the exact existing dataLayer event NAME, its GTM trigger, the GA4/FB/GAds tags wired to it, and the payload variable shape. (Owner to send GTM tag+trigger screenshot + the booking page `dataLayer.push` code.)
- Note: new `CalendlyInline.jsx:86` catches `calendly.event_scheduled` and calls `POST /api/demo-booked` but pushes NOTHING to dataLayer → that's the gap to fill with the existing event name.

## 5d. ✅ OFFLINE ARCHITECTURE CONFIRMED — Zapier owns it (2026-06-08)
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
- **Required GTM fixes (owner side, GTM-only — not our code):** fix trigger typo `lead_verifided` → `lead_verified`, UNPAUSE the GA4/FB "OTP Verified" tags, and (recommended) make the Google Ads "Book demo" conversion fire on `lead_verified` instead of raw `form_submitted`.
- **Offline upload route:** TBD — Zapier (owner-managed, recommended) vs. our backend. Needs Meta CAPI token either way.

## 6. Still needed from owner
- [ ] Google Ads Conversion **Label** (GTM "GAds - Book Demo" tag)
- [ ] Meta CAPI access token
- [ ] Confirm: reuse `GTM-K5D84Z3L` on new site? (recommended)
- [ ] Confirm: Freshsales→Ads offline via Zapier or our backend?
