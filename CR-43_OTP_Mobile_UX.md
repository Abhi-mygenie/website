# CR-43 — OTP Mobile UX: Auto-focus, SMS Autofill & Distraction Removal

**Registered:** 2026-07-03  
**Status:** G2 — Planning Complete  
**Priority:** P1 — Conversion Impact  
**Files in scope:** `OtpVerifyBlock.jsx`, `StickyMobileCta.jsx`, `DemoForm.jsx`  

---

## 1. Problem Statement

After a user submits the demo form on mobile, they are transitioned to the OTP verification stage. Two screenshots revealed the following UX breakdown:

**Screenshot 1 — Before keyboard opens:**
- OTP card renders at the top of the page but the entire page background (footer, hero, sticky CTA bar) is visible and scrollable below it
- No keyboard appears automatically — user must tap the OTP box themselves to trigger it
- Sticky "Book a Free Demo →" bar is still visible at the bottom — contradicts the current task (verifying a code, not booking a demo)
- Experience feels broken / half-loaded

**Screenshot 2 — After keyboard opens (tapped manually):**
- OTP block is fully in view and keyboard shows iOS SMS suggestion "From Messages" ✅
- Experience is actually clean once the keyboard is open
- **The problem is getting here requires an unnecessary extra tap**

---

## 2. Impact Analysis — UX Expert View

### 2A. Funnel Drop-off Risk

The OTP stage is the **highest drop-off point** in the entire form funnel. The user has already invested effort: filled their name, business, phone, outlet type. They are 80% converted. Any friction at this stage results in an **irreversible lead loss** — the lead is in MongoDB as OTP-Unverified (like Chetan, Lead 2 in our investigation) and can never be recovered retroactively.

**Each unnecessary tap, visual confusion, or missed SMS autofill = real leads lost.**

India's mobile mix is:
- ~65% Android (Chrome on Android)
- ~25% iOS Safari
- ~10% other

The critical issue — `autocomplete="one-time-code"` missing — means **Android Chrome never shows the SMS OTP suggestion**. Android users must manually switch to their Messages app, read the 4-digit code, come back, and type it. This is 4–6 extra steps vs iOS where it appears in the keyboard bar. This is the difference between a 1-tap experience and a 30-second context-switch.

### 2B. Current State vs Ideal State

| Moment | Current Experience | Ideal Experience |
|---|---|---|
| Form submit → OTP stage loads | Page shows OTP card + all background content visible. No keyboard. User stares at static page. | Keyboard opens instantly. OTP box focused. User sees only the task at hand. |
| iOS user | Taps box → keyboard opens → SMS suggestion shows. 1 extra tap. | Keyboard opens automatically → SMS suggestion shows. Zero extra tap. |
| Android user | Taps box → keyboard opens → NO SMS suggestion. Must switch to Messages manually. | Keyboard opens automatically → Android OTP suggestion appears above keyboard. 1-tap fill. |
| Sticky CTA bar | "Book a Free Demo →" shows during OTP entry | Hidden during OTP — user is mid-conversion, not at the awareness stage |
| Keyboard opens on Android | Viewport compresses — OTP block may shift out of visual center | OTP block scrolled into view and anchored |

### 2C. Severity by Issue

| Issue | Platform | Severity | Current workaround |
|---|---|---|---|
| No auto-focus (extra tap required) | iOS + Android | **Medium** — extra tap, adds friction | User taps manually |
| `autocomplete="one-time-code"` missing | **Android primarily** | **High** — no SMS suggestion, 30s context switch | Manual copy-paste from Messages |
| Sticky CTA visible during OTP | iOS + Android | **Medium** — visual confusion, wrong message | User ignores it |
| Viewport scroll on Android keyboard | Android | **Medium** — OTP block may drift | User scrolls manually |
| Auto-focus delay (100ms) too short | Android low-end devices | **Low-Medium** — focus call fires before DOM ready on slow devices | User taps manually |

### 2D. Business Impact

Assuming 50 OTP verifications/day:
- If Android accounts for 65% = ~32 Android sessions/day at OTP stage
- If 10% drop off due to SMS autofill friction = **3 leads/day lost at OTP stage**
- ~90 leads/month × ₹500 avg conversion value = **₹45,000/month in lost lead value** at OTP stage alone

The `autocomplete="one-time-code"` fix is a **5-line code change with direct revenue impact.**

---

## 3. Root Cause Analysis

### Finding 1: Auto-focus exists but is fragile
`OtpVerifyBlock.jsx` line 35–37 already has auto-focus:
```javascript
useEffect(() => {
  setTimeout(() => refs[0].current?.focus(), 100);
}, []);
```
**Problem:** 100ms is insufficient on mid/low-end Android devices where the component renders in 150–300ms. The focus fires into the void before the DOM is ready. Needs a longer delay OR a `ref` existence check.

### Finding 2: `autocomplete="one-time-code"` missing from all 4 OTP inputs
```jsx
// Current — line 137-138 of OtpVerifyBlock.jsx
type="text"
inputMode="numeric"
// Missing:
autocomplete="one-time-code"
```
Without this, Android's Autofill framework cannot identify the field as an OTP receiver. iOS Safari detects it heuristically (which is why iOS showed "From Messages"), but Android strictly requires the attribute.

### Finding 3: StickyMobileCta has no awareness of form stage
`StickyMobileCta.jsx` shows whenever the hero scrolls out of view. It has no mechanism to suppress itself during form interaction. The DemoForm renders inside the page at `#demo` — the hero is scrolled past → bar appears and stays through OTP stage.

### Finding 4: No scroll-into-view on stage transition
When `stage` changes to `"otp"` in `DemoForm.jsx`, the OTP card renders but no scroll or focus action is triggered from the parent. The auto-focus in `OtpVerifyBlock` only handles focus, not scroll position. On Android, keyboard opening compresses the viewport, and the OTP card can shift unpredictably.

---

## 4. Implementation Plan

### Task 1 — `OtpVerifyBlock.jsx`: Fix auto-focus + add `autocomplete`
**Effort:** 15 min | **Risk:** Zero

**Change 1a** — Add `autocomplete="one-time-code"` to all 4 inputs:
```jsx
// Before (line 137–138)
type="text"
inputMode="numeric"

// After
type="text"
inputMode="numeric"
autoComplete="one-time-code"
```
Only the first input needs `autoComplete="one-time-code"` per spec — the browser fills all 4 boxes. But add it to all 4 for maximum compatibility.

**Change 1b** — Fix auto-focus delay (100ms → 300ms with ref check):
```javascript
// Before (line 35–37)
useEffect(() => {
  setTimeout(() => refs[0].current?.focus(), 100);
}, []);

// After
useEffect(() => {
  const t = setTimeout(() => {
    if (refs[0].current) refs[0].current.focus();
  }, 300);
  return () => clearTimeout(t);
}, []);
```

---

### Task 2 — `DemoForm.jsx`: Scroll OTP block into view on stage change
**Effort:** 10 min | **Risk:** Zero

Add a `useRef` on the OTP card wrapper and call `scrollIntoView` when `stage === "otp"`:

```javascript
// Add ref
const otpCardRef = useRef(null);

// Add useEffect
useEffect(() => {
  if (stage === "otp" && otpCardRef.current) {
    setTimeout(() => {
      otpCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }
}, [stage]);

// Add ref to OTP card div
<div ref={otpCardRef} className={cardCls} data-testid="demo-otp">
```

`block: "nearest"` avoids over-scrolling on iOS where the card is already in view — only scrolls if needed.

---

### Task 3 — `StickyMobileCta.jsx`: Hide during form interaction
**Effort:** 10 min | **Risk:** Low

**Option A (recommended) — DOM sentinel approach (no prop drilling):**
The OTP card already has `data-testid="demo-otp"`. Add a `MutationObserver` in `StickyMobileCta` (same pattern as consent banner check already in the component) to detect when the OTP or form stage is active:

```javascript
// Inside StickyMobileCta useEffect
const checkFormActive = () => {
  const formActive = !!document.querySelector('[data-testid="demo-otp"], [data-testid="demo-form"][data-stage="active"]');
  setFormActive(formActive);
};
```

Then in the render:
```jsx
if (dismissed || formActive) return null;
```

**Option B — Pass `formActive` prop from parent:**
Requires threading stage state up to wherever `StickyMobileCta` is rendered (likely `HomePage`). More invasive.

**Recommended: Option A** — self-contained, zero prop drilling, consistent with existing pattern in the same component.

---

### Task 4 (Optional) — WebOTP API for Android auto-fill
**Effort:** 45 min | **Risk:** Low (graceful fallback if not supported)

The WebOTP API (`navigator.credentials.get({ otp: { transport: ['sms'] } })`) allows Android Chrome to read the SMS and fill the OTP automatically — zero user action. Requires:
1. `autocomplete="one-time-code"` on input (covered in Task 1)
2. SMS message format must end with: `\n\nhttps://mygenie.online #XXXXCODE`
3. Implement in `OtpVerifyBlock.jsx` with try/catch fallback

**Dependency:** SMS template change in OTP backend. If the SMS template doesn't include the domain hash line, WebOTP won't fire. Confirm SMS template before implementing.

---

## 5. Implementation Order

| Order | Task | File | Time | Impact |
|---|---|---|---|---|
| 1 | `autocomplete="one-time-code"` on inputs | `OtpVerifyBlock.jsx` | 5 min | **Highest — unblocks Android autofill** |
| 2 | Fix auto-focus delay 100ms → 300ms | `OtpVerifyBlock.jsx` | 5 min | High |
| 3 | Scroll-into-view on stage change | `DemoForm.jsx` | 10 min | Medium |
| 4 | Hide StickyMobileCta during OTP | `StickyMobileCta.jsx` | 10 min | Medium |
| 5 | WebOTP API | `OtpVerifyBlock.jsx` | 45 min | Medium (Android only) |

Tasks 1–4 are a single deploy. Task 5 is optional second phase pending SMS template change.

---

## 6. Definition of Done

- [ ] Android Chrome: Tapping Submit on demo form → OTP box auto-focused → keyboard opens automatically → SMS suggestion appears above keyboard
- [ ] iOS Safari: Same → keyboard opens automatically → "From Messages" suggestion appears
- [ ] Sticky "Book a Free Demo →" bar not visible during OTP entry on either platform
- [ ] OTP card always in center of viewport after keyboard opens on both platforms
- [ ] No regression on desktop OTP flow
- [ ] Tested on: Chrome Android, Safari iOS, Chrome Desktop

---

## 7. Out of Scope

- Changing OTP backend send logic
- Changing OTP digit count (4)
- Changing resend timer
- Any Calendly-stage changes
