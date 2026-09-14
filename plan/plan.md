# Plan — Batch BE: Get the five Alpha ad pages producing leads again

Four small changes, shipped together in one release. All were approved by the owner on 14 Sep. Nothing has been built yet; this is the plain-English version to confirm before work starts.

---

## The problem in one paragraph

Since 11 Sep the five Google-Ads landing pages (billing, POS, management, cloud kitchen, QSR) have taken ~85 clicks and ~₹8,000 of spend and produced zero demo bookings. The Petpooja page and the homepage, on the same site and same release, keep converting. The one structural difference: on those two pages the main "Book a Free Demo" button is a real link that works the instant the page appears; on the five ad pages every button only works after the site's JavaScript has finished loading — 1 to 5 seconds on a real phone. A visitor who taps in that window gets nothing, scrolls down to read instead, and is then snapped back to the top of the page when the JavaScript finally arrives. Both faults were reproduced on the live site.

---

## CR-265 — Make every "Book a Demo" button work before the page's JavaScript loads

**Plain English:** Turn each button on the five ad pages back into a proper link. When the site is fully loaded it behaves exactly as today (the bottom-sheet form slides up). If someone taps in the first seconds, before the site is ready, the browser simply scrolls them down to the demo form that already exists at the bottom of the page. Either way, the tap does something.

**Which buttons:** on each of the five pages — the top-bar button, the big hero button, and the three "Get Started" buttons on the pricing cards. Five buttons × five pages.

**Not changing:** the sticky bar that appears at the bottom on mobile (it only shows after someone scrolls, by which time the site is loaded), the bottom-sheet form itself, the in-page form, anything on the Petpooja page or homepage (they already work this way).

**What "done" looks like:** tapping a button early scrolls to the form; tapping it after load opens the sheet; the pages look identical to today.

---

## CR-266 — Stop the page jumping back to the top when it finishes loading

**Plain English:** Today, when the site's JavaScript finishes loading, it resets the page to the very top — even if the visitor has already scrolled halfway down reading. On a phone this feels like the page glitched. This change keeps the visitor exactly where they are on first load. Moving between pages still starts each new page at the top, as it should.

**Applies to:** the whole site (it is one shared piece of behaviour), but it mainly bites on the five ad pages because links with `#` in the address escape the reset and the ad pages currently have none.

---

## CR-267 — Record when someone taps a demo button and when the form actually opens

**Plain English:** Right now analytics can't tell the difference between "nobody wanted a demo" and "the button was dead." This adds two invisible signals: one when any demo button is tapped (and which one — hero, top bar, pricing card, sticky bar), one when the bottom-sheet form actually opens. If taps are high and opens are low, the button is broken; if both are low, the page isn't persuading people. Next time this happens the answer is visible in a day instead of a week.

**Owner's part:** two small additions in Google Tag Manager and two custom fields in GA4 so the signals show up in reports. Not counted as conversions.

---

## CR-268 — Remove the cookie consent strip (Option A)

**Plain English:** The dark "We use cookies…" bar at the bottom of the screen goes away.

**Why it is safe:** The site already tells Google, region by region, what tracking is allowed — EU/UK visitors are set to "denied" by default, everyone else (India) to "granted" — before any bar is shown. That signal is what Google requires, and it stays. For an Indian visitor the bar's Accept button changes nothing and its Decline button only switches off your own tracking for that person. India's data law doesn't require a strip like this; the Privacy Policy link stays in the footer. Ads run 100% in India.

**Why it helps:** every paid visitor is a first-time visitor and sees it; it eats 48 px of a phone screen, overlaps the bottom edge of the demo form, pushes the sticky "Book a Demo" bar upward, and gives people a reflex "Decline" tap that kills conversion tracking. The owner's own tests never show it (choice already saved), so it is one of the real differences between test conditions and real visitors.

**If EU advertising ever starts:** a bar shown only to EU/UK visitors can be added then, as a separate change.

---

## How success will be judged

- Immediately after release: on the live site, early taps scroll to the form, late taps open the sheet, no page-top jump, no cookie strip, tap/open signals appear in analytics.
- After 48 hours: the Google Ads conversions column, plus the new tap → open ratio (target: 95%+ of taps open the sheet on mobile paid traffic).
- After 7 days: lead volume.

**One caution on record:** it is not yet certain that the 8–10 Sep leads (the only converting days since 4 Sep) were genuine prospects rather than the team testing the pages via the live ad. If leads don't return after this release, that question (owner's 10-minute database check, "D4") must be answered before anyone concludes the form itself is broken.

---

## Assumptions made

- The bottom-sheet form is the intended experience once loaded; the in-page form is a fallback only, and is not being redesigned in this batch.
- The sticky mobile bar stays a plain button in this batch.
- No change to Petpooja, homepage, backend, CRM, GTM container structure, or ad campaigns.
- Campaign stays live throughout.
- Production deploy and Cloudflare cache purge are done by the owner; the release hash and time get written down.
