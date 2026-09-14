# Investigation — Validation of "Alpha landing pages stopped producing leads" brief (14 Sep 2026)

**Role:** read-only investigation. No code edited. Brief source: `alpha-cta-brief.md` (Ads ops, 14 Sep).

## What reproduces (verified today against www.mygenie.online + repo)
| Claim | Result |
|---|---|
| §3 Last-Modified 11 Sep 07:17 UTC on 5 Alpha pages, 07:16 on Petpooja | ✅ identical headers reproduced |
| §4 Alpha CTAs are `<button type="button">`, zero `href="#…"` on page | ✅ 0 anchors on billing; 8 buttons incl. sticky |
| §4 Petpooja hero = `<a href="#vsp-demo">` (4 occurrences) | ✅ |
| §4 live markup == repo source (`RestaurantBillingSoftware.jsx` L35/89/144, `DemoBottomSheet.jsx`) | ✅ |
| §6.1 tap before React render is silently dropped | ✅ reproduced on prod (Playwright, JS delayed 2.5s): tap at 0.9s → no sheet; tap after render → sheet opens |
| Production bundle API base | ✅ `https://www.mygenie.online/api` (not mis-built against preview) |

## Where the brief is weak / wrong
1. **Deploy timeline (§3) is incomplete.** `Last-Modified` only shows the *latest* write. Memory shows ≥3 prod states in the window:
   `main.cf3fd6a7.js` (old CSR, non-prerendered, anchors) → `main.6dc7dd67.js` (owner deploy between 8 Sep eve and 10 Sep, content unknown) → `main.01355ca7.js` (Session 13, 10 Sep, contains CR-259 sheet) → `main.b23cd364.js` (11 Sep 12:47 IST, provenance unknown to memory).
   Owner must state: when was 01355ca7 deployed on 10 Sep, and what is b23cd364.
2. **Baseline contradiction.** CR-230 (registered 8 Sep, same author side) recorded **0 form_starts in 27 paid sessions 4–8 Sep on the anchor markup**. The brief now says anchor-era converted at 5.2%. Both hold only if all 6 form_starts landed on 9–10 Sep — i.e. possibly *after* the modal/sheet went live. Need GA4 daily form_start per Alpha page 4–10 Sep before accepting "anchor worked, button doesn't".
3. **Sample size.** 64 sessions × 5.2% = 3.3 expected; P(0)≈4%. Real but thin. form_start 1 vs 3.3 expected ≈ p 0.15. Control page adds confidence, but don't over-read 3 days.
4. **Hypothesis 1 alone cannot explain zero among 64 recorded, 95s-engaged sessions** — after ~3s React has rendered and the button works. It explains lost taps in the first seconds only.

## New finding — compounding mechanism the brief missed (reproduced on prod)
`App.js` `ScrollToTop`: `if (!hash) window.scrollTo(0,0)` runs on React's first render. Because `index.js` uses `createRoot` (no hydration, CR-205) and waits for main.js + page chunk (≤3s race), a visitor who scrolls the prerendered page during the dead window is **yanked back to the top when React mounts** (measured: scrollY 1116 → 0 at ~2.8s).
- Anchor CTAs set a hash → yank skipped, user is at the form (Petpooja today; Alpha pre-CR-230).
- Button CTAs never set a hash → dead tap + yank. Consistent with mobile scroll-90% falling 30% → 12%.
- This only became user-visible when the *prerendered* build reached production (CR-200, 9–10 Sep); the old CSR build showed nothing before React, so no dead window existed.

## Other checks
- Consent banner (`z-[70]`, rendered after `<Routes>`) overlaps the bottom 48px of the sheet (same z). Submit button clears it by 8px (submit bottom 788 / banner top 796 at 390×844). Cosmetic ("No spam" line hidden), not blocking. Every paid visitor is first-visit → sees banner; owner's own tests likely don't (consent stored).
- `browserslist.production` = "last 2 Chrome/Safari/Firefox/Edge/Samsung" — near-zero transpilation. Older Android WebView / iOS ≤16 could fail to parse → whole app dead, anchors would still work. Affects Petpooja equally, so not primary; still a risk for paid Android traffic.
- Preview DB (`test_database`) is not production — 6 demo_requests since 4 Sep, all tests. Production lead check must be done on prod Mongo: `demo_requests.source_page` = `<sector>-quick-book` (sheet) vs `sector:<sector>` (in-page form).
- No JS console errors on prod LP load.

## Decisive data still needed (owner / GA4, no code)
1. GA4: Petpooja 11–13 Sep `book_demo` split by `form_location` (`quick_book_sheet` vs `sector:petpooja-alternative`). If the sheet has never converted a real visitor anywhere → sheet itself is the suspect, not just the dead window.
2. GA4: daily `form_start` per Alpha page 4–10 Sep (resolves CR-230 vs brief contradiction).
3. Owner: exact deploy times + contents of 6dc7dd67 / 01355ca7 / b23cd364.
4. Prod Mongo: `source_page` of every Alpha lead 6–10 Sep.

## Recommendation on §7
- §7.1 `<a href="#lp-demo" onClick={e=>{e.preventDefault(); openSheet()}}>` — **endorse**; it is already the codebase's own pattern (CR-157, `Hero.jsx` L45-48) and CR-259 removed it from the LPs. Apply to hero + navbar + pricing + sticky (sticky needs `<a>` too or keep button but add hash).
- **Add:** guard `ScrollToTop` on initial mount (skip `scrollTo(0,0)` when `window.scrollY > 0` on first render) — otherwise anchor-less scrollers still get yanked.
- §7.2 `cta_click` / `sheet_open` dataLayer events — **endorse**, cheap, closes the observability gap.
- §7.3 billing-only 48h A/B — **caution**: ~12 billing paid sessions/day → ~1.2 expected leads in 48h; inconclusive either way. Prefer all 5 pages, judge on `form_start` + new `cta_click` within 48h, then leads over 7 days.
- Do not pause the campaign (agree).
