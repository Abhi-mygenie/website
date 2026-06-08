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

## 6. Still needed from owner
- [ ] Google Ads Conversion **Label** (GTM "GAds - Book Demo" tag)
- [ ] Meta CAPI access token
- [ ] Confirm: reuse `GTM-K5D84Z3L` on new site? (recommended)
- [ ] Confirm: Freshsales→Ads offline via Zapier or our backend?
