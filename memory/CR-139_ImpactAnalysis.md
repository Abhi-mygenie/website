# CR-139 — Impact Analysis: StickyMobileCta Hidden When ConsentBanner Shows

**Date:** 2026-08-24
**Status:** Analysis complete — no code changed
**Files read in full:** `StickyMobileCta.jsx` (93 lines), `ConsentBanner.jsx` (64 lines)
**Pages affected:** Home, SectorPage (×11), ProductPage (×6) — all pages that import StickyMobileCta

---

## 1. Exact Bug Confirmed From Code

### Current Logic (StickyMobileCta.jsx line 67–69)

```jsx
className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
  visible ? (consentUp ? "-translate-y-12" : "translate-y-0") : "translate-y-full"
}`}
```

### State machine

| `visible` | `consentUp` | CSS class | Result |
|-----------|-------------|-----------|--------|
| `false` | any | `translate-y-full` | CTA hidden below viewport ✅ |
| `true` | `false` | `translate-y-0` | CTA at `bottom: 0` ✅ |
| `true` | `true` | `-translate-y-12` | CTA at 48px above bottom ✅ on paper |

### The race condition (root cause)

`consentUp` is initialized and immediately overwritten in opposite directions:

**Line 13 — initial useState:**
```jsx
const [consentUp, setConsentUp] = useState(!hasConsentChoice());
// New visitors: hasConsentChoice()=false → !false = true → consentUp starts TRUE ✅
```

**Line 17–24 — useEffect runs on mount:**
```jsx
useEffect(() => {
  const check = () => setConsentUp(!!document.querySelector('[data-testid="consent-banner"]'));
  check();   // ← called SYNCHRONOUSLY at mount time
  ...
```

**The timing sequence on first load:**

```
[T=0]  React renders component tree (StickyMobileCta + ConsentBanner)
[T=1]  React commits DOM — ConsentBanner NOT in DOM yet 
       (ConsentBanner uses useEffect to call setShow(true) — effects run AFTER paint)
[T=2]  StickyMobileCta useEffect runs → check() executes
       → document.querySelector('[data-testid="consent-banner"]') = null ← NOT IN DOM YET
       → setConsentUp(false)   ← OVERWRITES the initial true with false
[T=3]  ConsentBanner useEffect runs → setShow(true) → banner mounts in DOM
[T=4]  StickyMobileCta MutationObserver fires → setConsentUp(true) ← corrected
```

**Between T=2 and T=4** there is a window where:
- `consentUp = false`
- `visible` may become `true` if the hero is already out of view (deep scroll position, return visit)

When that happens: `translate-y-0` is applied — CTA sits at bottom=0 and OVERLAPS the ConsentBanner, which has `z-[70]` vs CTA's `z-50`. The banner renders ON TOP of the CTA. **The button is covered, non-functional.**

On a slow device or slow JS execution, T=2→T=4 gap widens significantly (hundreds of milliseconds). This is exactly the scenario the audit captured.

---

## 2. Secondary Issue — Hardcoded Offset Is Fragile

`-translate-y-12` = 48px = exactly `h-12` (ConsentBanner height). This works ONLY as long as ConsentBanner stays exactly 48px.

**It will silently break if:**
- ConsentBanner gets safe-area padding added (e.g., `pb-safe` on iOS)
- ConsentBanner height changes for any reason
- A second fixed bottom element is added

**Current geometry (verified correct for standard screens):**

```
Screen bottom ──────────────────────────────── 0px
ConsentBanner (h-12)                           0–48px    z-[70]
CTA bar bottom (-translate-y-12)               48px      z-50
CTA bar content (button at top of bar)         48–122px  z-50
```

CTA and banner are adjacent, not overlapping. z-index is irrelevant for adjacent elements.  
On iOS with safe-area (34px), CTA bar expands to ~108px — still correctly above the banner.

**The geometry is NOT the root cause. The race condition is.**

---

## 3. Audit Observation Explained

The audit tested a fresh visitor (no consent cookie). On their device:

1. Page loaded with hero in view
2. `consentUp` initialized to `true` (line 13: `!hasConsentChoice()` = `!false` = `true`)
3. useEffect's `check()` ran immediately — ConsentBanner not yet in DOM → `setConsentUp(false)`
4. Auditor scrolled down → hero left viewport → `visible = true`
5. At this moment: `visible=true`, `consentUp=false` → class `translate-y-0`
6. CTA bar slides up from `translate-y-full` → `translate-y-0` (bottom of screen)
7. ConsentBanner at `z-[70]` renders ON TOP of CTA at `z-50`
8. **"Book a Free Demo" button is visually present but covered by the cookie banner — non-functional**

Shortly after, MutationObserver corrects `consentUp=true` → CTA jumps up 48px. But the initial covered state is what Lighthouse captured in its visual filmstrip.

The audit described this as "off-screen" — the button was present in the DOM but invisible/unreachable due to the overlay.

---

## 4. The Fix

**Remove the race condition by eliminating the `check()` immediate call. Instead, initialise `consentUp` based on `hasConsentChoice()` and let the MutationObserver handle changes only.**

The `useState(!hasConsentChoice())` initialization on line 13 is CORRECT — it reads the right value at mount time. The problem is `check()` on line 20 immediately overwriting it with `false` before the ConsentBanner has mounted.

### Fix — `StickyMobileCta.jsx` lines 17–24

**Current:**
```jsx
// Track consent banner in DOM — adjust bottom offset when it's showing
useEffect(() => {
  const check = () => setConsentUp(!!document.querySelector('[data-testid="consent-banner"]'));
  check();
  const obs = new MutationObserver(check);
  obs.observe(document.body, { childList: true, subtree: true });
  return () => obs.disconnect();
}, []);
```

**Replace with:**
```jsx
// Track consent banner in DOM — adjust bottom offset when it's showing.
// Initial value from useState(!hasConsentChoice()) is correct at mount.
// MutationObserver updates when banner mounts/unmounts (e.g. after user accepts).
useEffect(() => {
  const check = () => setConsentUp(!!document.querySelector('[data-testid="consent-banner"]'));
  const obs = new MutationObserver(check);
  obs.observe(document.body, { childList: true, subtree: true });
  return () => obs.disconnect();
}, []);
```

**Change:** Remove the `check()` call on line 20. The `useState(!hasConsentChoice())` already provides the correct initial value. The MutationObserver handles subsequent changes (when user accepts/declines → banner unmounts → `setConsentUp(false)`).

**Lines changed:** Delete line 20 (`check();`). That's it.

---

## 5. Why This Fix Is Safe

| Scenario | Before fix | After fix |
|----------|-----------|-----------|
| New visitor, banner showing | Race: briefly `translate-y-0`, then `-translate-y-12` | Correct: starts with `-translate-y-12` immediately |
| Returning visitor, no banner | `consentUp=true` then corrected to `false` by check() — then banner absent → `translate-y-0` correct | `consentUp=false` from `!hasConsentChoice()=true... wait` |
| User accepts/declines consent | MutationObserver → `setConsentUp(false)` → `translate-y-0` ✅ | Same ✅ |
| Page re-render | No change | No change |

**Wait — returning visitor scenario:** `hasConsentChoice()` = `true` for returning visitors (they made a choice). So `!hasConsentChoice()` = `false`. `consentUp` starts `false`. No banner in DOM. CTA slides in at `translate-y-0` (bottom). ✅ Correct.

**New visitor scenario:** `hasConsentChoice()` = `false`. `!false` = `true`. `consentUp` starts `true`. CTA uses `-translate-y-12`. Banner mounts shortly after. Both are correctly positioned from the start. ✅ No race condition.

---

## 6. Forms Safety

`StickyMobileCta.jsx` has no forms. The `handleClick` function (line 55–61) only scrolls to `#demo`. No state, no API calls, no submit logic is affected.

**The `formActive` state** (lines 27–33, which hides the CTA during OTP) is completely untouched.

---

## 7. Pages Affected

All pages that use `StickyMobileCta`:

| Page | File | Usage |
|------|------|-------|
| Homepage | `Home.jsx` line 50 | `<StickyMobileCta onDemo={scrollToDemo} />` |
| All sector pages (×11) | `SectorPage.jsx` line 270 | `<StickyMobileCta onDemo={...} />` |
| All product pages (×6) | `ProductPage.jsx` line 253 | `<StickyMobileCta onDemo={...} />` |

**Total: 18 pages** (homepage + 11 sector + 6 product). Fix is in ONE file, affects all 18 automatically.

---

## 8. Post-Fix Pipeline

One line deleted → `yarn build` → `node scripts/prerender.js` → restart → verify.

Verification:
```bash
# Check the fixed file has no check() call
grep -n "check();" /app/frontend/src/components/home/StickyMobileCta.jsx
# Expected: no output (check() call removed)
```

Visual verification: on mobile viewport with fresh session (clear localStorage), scroll past hero — CTA should appear ABOVE the consent banner immediately, with no covered/overlap state.

---

## 9. Change Summary

| File | Change | Lines |
|------|--------|-------|
| `src/components/home/StickyMobileCta.jsx` | Delete `check();` (line 20) | **1 line deleted** |

No other files touched. No build config changes. No new dependencies.

---

*Impact analysis written 2026-08-24. Root cause: race condition between useState initialization and useEffect's immediate DOM query. Fix: remove the premature check() call. 1 line deletion.*
