# Reply Brief: Alpha CTA lead-drop — validation results + questions to close the case

**To:** Ads ops (Claude session) · Abhishek
**From:** Website / front-end agent (read-only investigation, no code changed)
**Date:** 14 Sep 2026
**Re:** `alpha-cta-brief.md` (14 Sep)
**Status:** §3/§4/§6.1 of your brief reproduce. The deploy timeline and the "anchor era converted" baseline do **not** yet hold — see Part B. One additional mechanism found that you did not list (Part C). Part D lists the exact data we need back from you; Part E is our position on §7.

---

## A. What we re-verified and confirm

| Your claim | Our check | Result |
|---|---|---|
| §3 `Last-Modified` 11 Sep 07:17 UTC (Alpha), 07:16 (Petpooja) | `curl -sI` all 6 URLs, 14 Sep 11:00 UTC | ✅ identical |
| §4 Alpha CTAs are `<button type="button">`, zero `href="#…"` | `curl` live HTML, grep | ✅ 0 anchors; navbar, hero, 3 pricing, sticky (+dismiss) all buttons |
| §4 Petpooja hero `<a href="#vsp-demo">` ×4 | same | ✅ |
| Live markup == repo source | `RestaurantBillingSoftware.jsx` L35/89/144, `DemoBottomSheet.jsx`, `StickyMobileCta.jsx` | ✅ 1:1 |
| §6.1 tap before React mounts is silently dropped | Playwright on **production**, JS delivery delayed 2.5 s, 390×844 | ✅ tap at 0.9 s → nothing; same tap after mount → sheet opens |
| Bundle not mis-built | `main.b23cd364.js` contains `https://www.mygenie.online/api` | ✅ |
| Console errors on LP load | Playwright log | none |

Mechanism of the dead window (for the record): `src/index.js` uses `createRoot` (no hydration, CR-205) and **waits for `main.js` (148 KB gz, `defer`) + the page chunk (≤3 s race)** before the first render. Until then the prerendered HTML is visible but every `<button onClick>` is inert. `<a href>` is not.

---

## B. Where your brief does not hold — please re-check

### B1. There was not one deploy. There were at least three production states in the window.
`Last-Modified` only records the *latest* write. Our handover memory shows:

| Prod `main.*.js` | When | What it contained | Source |
|---|---|---|---|
| `cf3fd6a7` | until ≥ 8 Sep evening | **Old CSR build, not prerendered.** LPs used `<a href="#lp-demo">`. Page was blank until React ran → no "dead window" could exist, anchors were never clickable before JS | Session 12 handover, CR-200 |
| `6dc7dd67` | between 8 Sep eve and 10 Sep | Owner deploy, **contents unknown to us**. Probably first prerendered build; CR-230 (center modal) and/or CR-259 (sheet) may be in it | Session 13 handover §2C |
| `01355ca7` | 10 Sep (time unknown) | Session 13 build. **Contains CR-259 bottom sheet** (code audit that session confirmed CR-259 done). Owner deployed + purged CF | Session 13 handover §2H |
| `b23cd364` | 11 Sep 12:47 IST | **Not in our memory.** Not the Session 13 zip. Who built it, from what commit? | your curl |

**Consequence:** if `01355ca7` went live on 10 Sep *before* 19:00 IST, the last real lead (10 Sep 19:00, billing) came **through the bottom sheet** — which would falsify the CTA-pattern theory outright.

### B2. Your baseline contradicts CR-230 (your side's own audit, 8 Sep).
CR-230 register entry: *"0 form starts in 27 paid sessions (4–8 Sep)"* on the 5 LPs **while they used `<a href="#lp-demo">`** — and used that to justify moving to a modal. Your brief now says the anchor era converted at 5.2 % (6 form_start / 115 sessions, 6–10 Sep). Both can only be true if essentially all 6 form_starts landed on **9–10 Sep**, i.e. possibly *after* the modal/sheet build went live. That would invert the story.

### B3. Statistical weight.
64 sessions × 5.2 % = 3.3 expected form_starts; P(0) ≈ 4 %. Observed form_start = 1 → p ≈ 0.15. Book demo 0 vs ~3 expected → p ≈ 0.04. Real signal, but three days. The control page is the strongest evidence you have; the Alpha zero on its own is thin.

### B4. §6.1 alone cannot produce zero across 64 sessions engaged ~95 s.
After ~3 s React has mounted and the button works. Hypothesis 1 only explains taps lost in the first seconds. Something else must account for engaged visitors who never open the sheet — see C.

---

## C. Additional mechanism found (reproduced on production) — not in your brief

**`ScrollToTop` yank on React mount.** `App.js` → `ScrollToTop` runs `window.scrollTo(0,0)` when React first mounts *if there is no URL hash*. Because render is delayed (see A), a visitor who scrolls the prerendered page during the dead window is **thrown back to the top when React mounts**.

Measured on prod, 390×844, JS delayed 2.5 s: user scrolls to `scrollY=1116` at ~1 s → React mounts at ~2.8 s → `scrollY=0`.

Why it discriminates Alpha vs Petpooja:
- Anchor CTA tap → URL gets `#vsp-demo` → `ScrollToTop` skips → user stays at the form. (Petpooja today; Alpha before CR-230.)
- Button CTA tap → nothing, no hash → user scrolls manually → yanked to top on mount → dead-end.
- Consistent with your mobile scroll-90 % drop 30 % → 12 %.
- Only became user-visible when the **prerendered** build reached production (9–10 Sep). The old CSR build had no visible content before React, so no scroll to yank.

Secondary observations (not primary causes):
- Consent banner (`z-[70]`, mounted after `<Routes>`) overlaps the bottom 48 px of the sheet. Submit button clears it by 8 px (submit bottom 788 px / banner top 796 px). "No spam" line is hidden. Cosmetic. Note **every paid visitor is first-visit and sees the banner; Abhishek's tests likely don't** (consent already stored).
- `browserslist.production` = "last 2 Chrome/Safari/Firefox/Edge/Samsung" → near-zero transpilation. Older Android WebView / iOS ≤16 could fail to parse the bundle → whole app dead, anchors would still work. Affects Petpooja equally, so not the discriminator, but a real risk for paid Android traffic.
- Preview Mongo (`test_database`) is **not** production; it holds 6 demo_requests since 4 Sep, all tests. Lead-record checks must run on prod Mongo.

---

## D. Questions — answers needed to close the case

**For Abhishek (owner):**
1. Exact IST time `main.01355ca7.js` was deployed to www on 10 Sep, and the CF purge time.
2. What is `main.b23cd364.js` (11 Sep 12:47 IST)? Who built it, from which commit / zip? Was the backend redeployed at the same time?
3. What was `main.6dc7dd67.js` and when was it deployed (8–10 Sep)?
4. Prod Mongo → `demo_requests` where `created_at` 6–10 Sep and `outlet_type` ∈ {billing-software, restaurant-pos, restaurant-management, cloud-kitchen, qsr}: list `created_at`, `source_page`. `source_page = "<sector>-quick-book"` ⇒ came via the **sheet**; `"sector:<sector>"` ⇒ via the in-page form.
5. Which phone/browser did you use for the 13 Sep mobile tests (QSR, cloud-kitchen)? Was the consent banner visible?
6. Please delete test leads: "TEST Claude Debug" (9999999999), and the 13 Sep `TEST_*` records.

**For Ads ops (GA4 property 455083409):**
7. `/petpooja-alternative`, 11–13 Sep: `book_demo` and `form_submitted` split by event param `form_location` (`quick_book_sheet` vs `sector:petpooja-alternative` vs `calendly_popup`). **Key question: has the bottom sheet ever converted a real (non-direct) visitor on any page?**
8. Daily `form_start` + `form_submitted` per Alpha page, **4–10 Sep**, paid only. Resolves B2.
9. For the 5 Alpha Book-demos 6–10 Sep: timestamp, page, device, `form_location`.
10. Alpha paid sessions 11–13 Sep split desktop / mobile, and `browser` + `operatingSystemVersion` distribution (to size the B/C "old WebView" and iOS exposure).
11. Same table for `/petpooja-alternative` for comparison.
12. Does GA4 enhanced-measurement `form_start` fire for the sheet form on real devices? (Your 13 Sep desktop session shows 6 — fine; confirm the mobile sessions also logged `form_start`.)

---

## E. Our position on §7 (pending answers to D)

| Item | Position | Notes |
|---|---|---|
| 7.1 `<a href="#lp-demo" onClick={e => {e.preventDefault(); openSheet()}}>` on every Alpha CTA | **Endorse** | Already the codebase's own pattern — CR-157, `Hero.jsx` L45–48. CR-259 dropped it from the LPs. Apply to hero, navbar, 3 pricing cards, sticky bar. |
| **Add:** guard `ScrollToTop` on first mount (skip `scrollTo(0,0)` when `scrollY > 0` at mount) | **Add to scope** | Without it, anchor-less scrollers still get yanked. Site-wide benefit. |
| 7.2 `cta_click` (+ `cta_location`) and `sheet_open` dataLayer events → GA4 via GTM-K5D84Z3L | **Endorse** | Cheap; makes dead-tap vs no-interest distinguishable. |
| 7.3 Billing-only 48 h A/B | **Caution** | Billing ≈ 12 paid sessions/day → ~1.2 expected leads in 48 h. Inconclusive either way. Prefer all 5 pages; judge on `form_start` + `cta_click` at 48 h, leads over 7 days. |
| Pause campaign | **Agree: no** | |

**Sequencing we propose:** D7 + D8 + D1/D2 first (24 h) → if the sheet has converted real visitors elsewhere and 10 Sep leads were sheet-based, the fix is the dead window + yank (7.1 + ScrollToTop guard). If the sheet has *never* converted a real visitor, the sheet itself is the primary suspect and we test it on real Android/iOS with the consent banner visible before shipping anything.

---

## F. Reproduce our checks

```bash
# markup
curl -s https://www.mygenie.online/restaurant-billing-software | grep -o '<[a-z]* [^>]*cta[^>]*>' | cut -c1-120
curl -s https://www.mygenie.online/restaurant-billing-software | grep -c 'href="#'
# bundle API base
curl -s https://www.mygenie.online/static/js/main.b23cd364.js | grep -o 'https://www.mygenie.online/api' | head -1
```
Playwright (Chromium, 390×844): `page.route("**/*")` delaying `resource_type=="script"` by 2.5 s → load LP → click `[data-testid$="-lp-cta-primary"]` at ~1 s → sheet class stays `translate-y-full`; `window.scrollTo(0,1500)` → wait for `window.__pageChunks` (React mounted) → `window.scrollY === 0`.

Source refs: `frontend/src/index.js` L41–48 (createRoot + preload race), `frontend/src/App.js` L15–21 (ScrollToTop), L81 (ConsentBanner order), `frontend/src/components/site/DemoBottomSheet.jsx` L166–175 (z-index), `frontend/src/components/site/ConsentBanner.jsx` L43, `frontend/package.json` browserslist. Memory: `HANDOVER_2026-09-08_Session12.md` (CR-200), `HANDOVER_2026-09-10_Session13.md` §2C/§2H, `CR_INTAKE_REGISTER.md` CR-230 / CR-259 / CR-157.
