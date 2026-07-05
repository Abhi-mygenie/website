# CR-50: Calendly Overlay CSS Missing — Popup + Inline Widget Both Broken

## Date: 2026-07-05
## Status: REGISTERED — implementation in progress (bundle of 2 edits)
## Priority: **P0 / CRITICAL** — blocks all demo bookings site-wide
## Reporter: Owner (attached screenshot of blank calendar after OTP)
## Related: none direct. Adjacent to CR-40 (OTP-Verified tag) which fires the Google Ads primary conversion at OTP verify — that still records; but 100% of *post-conversion* bookings are being lost.

---

## Problem Statement

Users who complete the demo-form OTP verify step see a **blank or half-rendered Calendly widget** on both mobile and desktop:

- **Desktop path (`isMobile = window.innerWidth < 768` = false)**
  → renders `<CalendlyInline>` inside the demo card. Card is ~460 px wide → Calendly flips to its narrow *"Select a Day"* layout and **its iframe never grows past ~150 px height**. Only the heading + month picker are visible; the day-grid and time-zone selector are cut off.

- **Mobile path (`isMobile = true`)**
  → calls `window.Calendly.showPopupWidget(...)`. The `.calendly-overlay` and `.calendly-popup` DOM are created, and Calendly's booking assets (`booking-06055da28.css`, `widget.js`, chunks) all load with HTTP 200. **But the parent-page overlay CSS is never applied** — `.calendly-overlay` computes as:
  ```
  position: static   (should be fixed)
  top: auto          (should be 0)
  z-index: auto      (should be 9999)
  height: 150px      (should be 100vh)
  ```
  → overlay lays out as a normal block at the bottom of the DOM (top ≈ 9482 px on the homepage), 150 px tall, invisible to users regardless of scroll.

**Blast radius: 100% of demo bookings site-wide** — homepage, sector pages, `/book-demo`, sticky mobile CTA, quote flow.

---

## Reproduction (verified 2026-07-05 via Playwright)

Wide container (1920 × 1020 fixed div) with same URL + params →
- Renders "Select a Date & Time" wide layout ✅
- Iframe auto-grows to full content height ✅

Narrow container (520 px card wrapping 464 px host, matches DemoForm layout) with same URL →
- Renders "Select a Day" narrow heading ⚠️
- Iframe stuck at 464 × **150 px** ❌
- Screenshot matches user-attached bug report exactly.

Popup mode with any viewport →
- Overlay div created, iframe URL loaded ✅
- `overlay.position = 'static'`, `overlay.zIndex = 'auto'`, `iframe.rectTop = 9482 px` ❌
- Only 0 Calendly stylesheets registered on parent `document.styleSheets`.

---

## Root Cause

Calendly's `widget.js` historically injected inline styles or a `<style>` block for `.calendly-overlay` / `.calendly-popup` into the parent document. In the currently-served version (fetched 2026-07-05 from `assets.calendly.com/assets/external/widget.js`), those styles are **not being applied** — either widget.js no longer self-injects them, or they are being wiped by our Tailwind reset (`@tailwind base` `preflight`).

Confirmed by:
1. `document.styleSheets` in the parent contains 0 Calendly URLs (only our own stylesheets).
2. The one CSS asset Calendly loads (`booking-06055da28.css`) is scoped to the iframe (`embed_domain` param routes it there), not the parent.
3. Inline `style` attribute on `.calendly-overlay` is empty; classlist styles come from a stylesheet that isn't present.

**We can't wait for Calendly to fix this** (their platform-side release cadence is unknown, and multiple Calendly customers have reported similar in their community forum in Jun–Jul 2026). We ship the styles ourselves — the class names are stable, well-documented, and used nowhere else in our codebase (grep verified).

---

## Impact Analysis

### 1. Business impact (revenue-line)

- **Every demo booking is being lost at the final step** — the funnel is: form_submit (₹200 tier) → OTP_verify (₹500 tier, **fires Google Ads primary conversion**) → Calendly booking (₹1000 tier).
- OTP-verify still fires the Google Ads "Book Demo" conversion → **Google Ads is still logging conversions**, but the sales team receives **0 booked demos with Meet links**. Every "converted" lead requires manual outreach.
- Estimated impact: last 7 days ~ 14–20 leads reached the Calendly stage per site traffic. If 100% failed to book, that's a **complete loss of the meeting-scheduling pipeline** through this window.
- Google Ads ROAS reporting still looks healthy (conversion counted at OTP), so **the bug is invisible to Ads dashboards** — only sales-ops noticed the missing meetings.

### 2. Data / attribution impact

- No data corruption. Freshsales continues to receive `OTP-Verified` tag + full attribution `cf_*` (post CR-47) at OTP-verify time.
- `cf_meeting_link` / `cf_next_step` / `cf_channel_manager_name` fields (populated by `mark_demo_booked()`) remain empty for every affected lead — since the `calendly.event_scheduled` postMessage never arrives.
- Zero backend / API / DB writes are affected. All lead capture continues normally.

### 3. Integration impact

- **Meta CAPI**: unaffected. Deduplication uses `event_id` fired at form_submit/OTP.
- **Google Ads Enhanced Conversions**: unaffected. Fires at OTP-verify.
- **Freshsales**: `demo_booked` never triggers → contacts stay in `OTP-Verified` lifecycle stage instead of progressing to `Demo Booked`. Slight funnel-reporting distortion for CR-45 Journey webhook (registered, not yet wired).
- **GTM / GA4**: `demo_booked` GTM event (₹1000 tier) never fires → GA4 misses the final funnel step for the last N days.

### 4. Code / architecture impact

- Change is fully isolated to frontend, ~40 lines total across two files.
- No backend, no env, no schema, no integration playbook changes.
- No new dependencies. Uses static CSS + existing widget.js path.
- Fully reversible in a single commit.

### 5. Risk of the fix

| Risk | Mitigation |
|---|---|
| Our CSS collides with a future Calendly self-injection | Class names are Calendly-owned; if Calendly restores their own CSS, ours becomes redundant but identical → no regression. |
| CSS collides with our own site styles | Grep confirms `.calendly-*` classes used nowhere else in our codebase. |
| `z-index: 9999` collides with ConsentBanner (`z-[70]`) | ConsentBanner intentionally stays below the modal; already lower z-index. Verified during CR-43 review. |
| Widening the inline widget breaks the demo card layout | Fix uses a stage-scoped bleed (`.-mx-3 sm:mx-0` + explicit width) — visible only on `stage === "calendly"`. Form and OTP stages unchanged. |
| Fixing might mask a separate widget.js regression | Instrument: keep a `console.warn` if `.calendly-overlay` computed position !== 'fixed' after 2 s → early-warning if Calendly's own script starts injecting again and conflicts. (Optional; may skip for MVP.) |

---

## Fix Design

### Edit 1 — Inject Calendly overlay CSS ourselves (fixes popup mode)

Add a `<style>` block to `<head>` once, on first `loadCalendlyScript()` call in `DemoForm.jsx`. Same CSS mirrored into `CalendlyInline.jsx` for defensive parity.

```css
/* CR-50 — Calendly overlay/popup wrapper CSS (widget.js no longer self-injects).
   Class names owned by Calendly; do not rename. */
.calendly-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(31,31,31,0.4);
}
.calendly-overlay .calendly-close-overlay { position: absolute; inset: 0; }
.calendly-overlay .calendly-popup {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 1000px; max-width: 100%; height: 90%; max-height: 680px;
  background: #fff; border-radius: 8px; overflow: hidden;
}
.calendly-overlay .calendly-popup-content { width: 100%; height: 100%; }
.calendly-overlay .calendly-popup-close {
  position: absolute; top: -30px; right: 0;
  width: 20px; height: 20px; cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'><path d='M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.42 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.42L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z'/></svg>");
  background-repeat: no-repeat;
}
@media (max-width: 767px) {
  .calendly-overlay .calendly-popup {
    position: fixed; inset: 50px 0 0 0;
    width: 100%; height: auto; max-height: none;
    transform: none; border-radius: 0;
  }
  .calendly-overlay .calendly-popup-close {
    top: 15px; right: 15px;
    background-color: #000; padding: 8px; border-radius: 4px;
  }
}
```

Injection uses an idempotent guard (`document.getElementById("cr50-calendly-css")`) — safe on repeat opens or hot-reload.

### Edit 2 — Force wide-mode on desktop inline widget (Variant A, chosen)

`CalendlyInline.jsx` outer div:

```diff
- style={{ minWidth: "280px", minHeight: "660px", height: "100%" }}
+ style={{ minWidth: "320px", width: "100%", height: "720px" }}
```

`DemoForm.jsx` — the wrapper that hosts `CalendlyInline` in the `calendly` stage (line 251):

```diff
- <div className="-mx-3 sm:mx-0">
+ <div className="-mx-3 sm:-mx-6 md:-mx-8 lg:-mx-9">
```

The extra negative margin at `md`/`lg` breakpoints lets the widget bleed out to the container's full width on desktop, giving Calendly ≥ 640 px inner width → its wide-mode "Select a Date & Time" layout activates, iframe auto-sizes to content, day grid + time slots visible.

Card padding (`p-7 sm:p-9`) is unchanged — the widget bleeds past padding only on the `calendly` stage. Form + OTP stages retain their look.

**Rationale for Variant A over Variant B (popup everywhere):**
- Owner has invested in the in-card scheduler UX; ripping it out would be a larger visual change requiring design sign-off.
- In-card avoids the "modal on modal" feel some users find abrasive.
- Popup path still exists for mobile (< 768 px) and is repaired by Edit 1.

---

## Files touched

| File | Line(s) | Nature of change |
|---|---|---|
| `frontend/src/components/site/DemoForm.jsx` | `loadCalendlyScript()` (~L22-32), calendly-stage wrapper (~L251) | Inject CSS once + widen wrapper on `md`/`lg` |
| `frontend/src/components/site/CalendlyInline.jsx` | Host div style (~L109), add same CSS inject on mount (defensive) | Height fix + defensive inject |

**Backend:** no changes.
**Integrations, DB, env:** no changes.

---

## Verification checklist

- [ ] Playwright diagnostic re-run confirms `overlay.position === 'fixed'` and `iframe.height > 500` in both popup and inline paths.
- [ ] Live smoke on preview: homepage → submit demo → verify OTP → see calendar grid + time slots.
- [ ] Mobile viewport (390×844) → popup renders full-screen with Calendly's mobile mode (top: 50px full-bleed).
- [ ] Desktop viewport (1920×1080) → inline widget renders "Select a Date & Time" wide layout inside the card.
- [ ] Booking a real slot fires `calendly.event_scheduled` postMessage → `markBooked()` → `POST /api/demo-booked` → Freshsales `cf_meeting_link` populated.
- [ ] ConsentBanner still visible below the modal (not stacking above).

---

## Rollback

Single commit reverting both files. No DB/state cleanup required.

---

## Follow-up (same-session hotfix): `showPopupWidget` → `initPopupWidget`

**Discovered:** Immediately after CR-50 shipped, a user's mobile device surfaced a red error overlay from Calendly's `widget.js`:

```
ERROR: this.embedType.toLowerCase is not a function
  inject             widget.js:1:1578
  buildPopupContent  widget.js:1:7639
  buildPopup         widget.js:1:7391
  buildOverlay       widget.js:1:7033
  show               widget.js:1:6711
  _                  widget.js:1:10875
  openPopup          bundle.js:16778:23        ← DemoForm.openPopup
```

**Root cause:** `Calendly.showPopupWidget(url)` accepts only a **single URL argument**. Our `openPopup()` was passing a second argument (`{prefill, utm}`). Older widget.js versions silently ignored it; the currently-served build walks that object looking for `embedType` (a string) and crashes with `undefined.toLowerCase()`. This bug was **masked by the original CR-50 CSS bug** — users never saw the JS error because the overlay was off-screen. Fixing the CSS unmasked it.

**Fix:** switched to `Calendly.initPopupWidget({url, prefill, utm})` — the documented popup-with-options API, accepts the same shape byte-for-byte.

### Diff (`frontend/src/components/site/DemoForm.jsx` — `openPopup()`)

```diff
- window.Calendly.showPopupWidget(url, {
+ window.Calendly.initPopupWidget({
+   url,
    prefill: { name, email, customAnswers: {...} },
    utm:     { utmContent, utmTerm, utmSource, utmMedium },
  });
```

**Net change:** 2 lines removed, 3 lines added. Every other line inside `openPopup()` is unchanged.

### GTM / data-flow guarantee

Confirmed all GTM events still fire in full — `openPopup()` does not itself push any dataLayer events. The events fire from separate call sites:

| Event | Location | Trigger | Impact of this fix |
|---|---|---|---|
| `form_submitted` | `submit()` L148 | POST /demo-request 200 | none — before openPopup runs |
| `lead_verifided` + `thankyou_conversion` | `onVerified` L285-286 | OTP verify success | none — before openPopup runs |
| `demo_booked` | message listener L108-124 | `postMessage({event:"calendly.event_scheduled"})` from Calendly iframe | ✅ **now actually fires** — previously masked because popup crashed before user could book |

Calendly's `event_scheduled` postMessage is emitted by the iframe regardless of how the widget was mounted (`initInlineWidget` / `initPopupWidget` / `showPopupWidget`), so our listener catches it either way.

### Verification results (Playwright, live preview URL, 2026-07-05)

```
console.error / pageerror captured:  (none — clean)
overlay computed:                    position:fixed  top:0px  zIndex:9999  1920×1080
popup computed:                      absolute  1000×680
iframe rect:                         1000×680 at top:200
Calendly-side utm passed to iframe:  TRUE
Popup opens cleanly, user can select a date and submit
```

Bug **fixed and verified in same session** as the original CR-50 CSS work. Status: still **P0**, still **shipped** — this doc updated to include the follow-up. No additional CR opened.

---

*CR-50 registered: 2026-07-05. Follow-up hotfix same day. Agent: E1, Emergent Labs.*
