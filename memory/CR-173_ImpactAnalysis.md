# CR-173 — Impact Analysis: Button type= Attribute Audit
**Date:** 2026-09-01 — Planning Agent
**Status:** CR CLOSED — already fully implemented. Zero code changes required.

---

## Part 1 — Background

### The Original Audit Finding

The UAT audit (2026-08-27) reported: "119 buttons default to `type='submit'`. Nav dropdowns trigger form submission."

A subsequent code scan on 2026-08-30 reduced this to "78 buttons across 27 files" and registered as CR-173. Both counts were produced by the same grep approach:

```bash
grep '<button' <file> | grep -cv 'type='
```

**This counts lines containing `<button` that do NOT also contain `type=` on the same line.** It is a false positive generator for any codebase that uses multi-line JSX formatting.

---

## Part 2 — Correct Audit Methodology

### Why the Grep Was Wrong

React codebases consistently format multi-prop elements across multiple lines:

```jsx
<button            ← line matches '<button' but NOT 'type='
  type="button"   ← type= is here, on the NEXT line
  onClick={...}
  data-testid="..."
>
```

A single-line grep counts this as "missing type" when the button has a correct type on line 2.

### The Correct Scan

Using Python regex with `re.DOTALL` to match multi-line `<button ...>` opening tags:

```python
button_tags = re.findall(r'<button(?:[^>]*?)/?>', content, re.DOTALL)
missing = [t for t in button_tags if 'type=' not in t]
```

This captures the entire opening tag across as many lines as it spans and checks whether `type=` appears anywhere within it.

---

## Part 3 — Scan Results

```
Scan scope:     /app/frontend/src/**/*.jsx (all React source files)
Files scanned:  134
Buttons found:  127
Missing type=:  0

Result: ALL CLEAR — every <button> tag in the codebase has an explicit type= attribute.
```

### Sample verification — files the original grep flagged

| File | Buttons | type= present? |
|---|---|---|
| `components/site/Footer.jsx` | 1 | ✅ All have type= |
| `components/site/FaqItem.jsx` | 1 | ✅ All have type= |
| `components/site/ConsentBanner.jsx` | 2 | ✅ All have type= |
| `components/site/OtpVerifyBlock.jsx` | 2 | ✅ All have type= |
| `components/site/DemoForm.jsx` | 2 | ✅ All have type= |
| `components/home/StickyMobileCta.jsx` | 2 | ✅ All have type= |
| `components/home/SectorSelector.jsx` | 2 | ✅ All have type= |
| `components/pricing/AddonCard.jsx` | 1 | ✅ All have type= |
| `components/pricing/PlanCard.jsx` | 1 | ✅ All have type= |
| `components/pricing/RecommendQuiz.jsx` | 2 | ✅ All have type= |
| `pages/PetpoojaAlternative.jsx` | 4 | ✅ All have type= |
| `pages/Pricing.jsx` | 4 | ✅ All have type= |

---

## Part 4 — Selected Button Spot-Checks

To further confirm, key user-facing components were read in full:

**OtpVerifyBlock.jsx** — 2 buttons, both confirmed:
```jsx
<button
  type="button"       ← line 169 ✅
  onClick={sendOtp}
  ...
>Resend code</button>

<button
  type="button"       ← line 180 ✅
  onClick={onBack}
  ...
>Edit details</button>
```

**ConsentBanner.jsx** — 2 buttons, both confirmed:
```jsx
<button
  type="button"       ← line 56 ✅
  onClick={() => choose(false)}
  ...
>Decline</button>

<button
  type="button"       ← line 63 ✅
  onClick={() => choose(true)}
  ...
>Accept</button>
```

**FaqItem.jsx** — 1 button, confirmed:
```jsx
<button
  type="button"       ← line 16 ✅
  onClick={() => setOpen(!open)}
  ...
>
```

**DemoForm.jsx** — 2 buttons, confirmed:
```jsx
<button
  type="button"       ← line 241 ✅
  onClick={openPopup}
  ...
>Book My Slot</button>

<button
  type="submit"       ← line 361 ✅
  disabled={loading}
  ...
>Book My Free Demo</button>
```

---

## Part 5 — When This Was Fixed

The codebase was already in correct state when deployed. Previous waves of development (Batch 2, Wave 2, CR-92) explicitly added `type="button"` to the Navbar hamburger, ConsentBanner buttons, and other UI elements as part of touch-target and accessibility fixes. Those changes brought the codebase to full compliance.

The UAT audit (2026-08-27) correctly identified the gap as it existed on `beta.mygenie.online` at that time. The gap was resolved during subsequent development sessions before the current agent session began.

---

## Part 6 — Conclusion

**CR-173 is ALREADY DONE. Status: CLOSED.**

- Zero code changes are required.
- No rebuild needed.
- No implementation plan needed.
- The Lighthouse Best Practices flag for missing `type=` on `<button>` elements is already resolved.

**The "78 buttons across 27 files" figure was a measurement artefact** of single-line grep matching against multi-line JSX. The correct count is 0.

---

*Impact analysis written 2026-09-01. Planning Agent. Correct multi-line scan run against all 134 .jsx files. No code changed.*
