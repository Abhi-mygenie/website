# CR-235 — Impact Analysis: Remove tel: Links from All Phone Numbers

**Date:** 2026-09-08
**Priority:** P1 — UX
**Reported by:** Owner — desktop browser "Open Phone?" / "Open FaceTime?" dialog on click

---

## Problem Statement

Every `<a href="tel:+919104743156">` on the site triggers a native OS permission dialog on desktop browsers:

| Browser | OS | Dialog shown |
|---|---|---|
| Chrome / Edge | Windows | "Open Phone?" → Windows Phone Link app |
| Chrome | macOS | "Open Phone?" → FaceTime |
| Safari | macOS | "Open FaceTime?" → FaceTime |
| Firefox | Any | Silently tries to open tel: handler |

Owner confirmed: **the phone number is for visual reference only — no tap-to-call behaviour is wanted on the website.**

---

## Root Cause

`COMPANY.phoneIntl = "+919104743156"` is defined in `src/data/company.js:9` and is referenced as `href={`tel:${COMPANY.phoneIntl}`}` in 12 places across 10 files. The `tel:` URI scheme is an RFC 3966 standard; any browser will intercept it and prompt the OS dial handler.

---

## Full Scope — 12 Instances

### Group A — Global (affects every page)

| # | File | Line | data-testid | Current code |
|---|---|---|---|---|
| 1 | `src/components/site/Navbar.jsx` | 151–158 | `nav-phone-link` | `<a href={…tel…} className="…hover:text-brand-green…">` multi-line |
| 2 | `src/components/site/Footer.jsx` | 30 | `footer-phone` | `<a href={…tel…} className="…hover:text-brand-yellow…">` single-line |

### Group B — Homepage

| # | File | Line | data-testid | Context |
|---|---|---|---|---|
| 3 | `src/components/home/Hero.jsx` | 71–77 | `hero-phone-link` | Inside "Or call us:" `<p>` tag |

### Group C — Contact Page

| # | File | Line | data-testid | Context |
|---|---|---|---|---|
| 4 | `src/pages/Contact.jsx` | 60 | `contact-phone` | Data array entry `{ href: \`tel:…\` }` — rendered via loop at line 91 |

### Group D — Landing Page LandingFooters (identical single-line pattern)

| # | File | Line | data-testid |
|---|---|---|---|
| 5 | `src/pages/RestaurantPosSystem.jsx` | 48 | `pos-lp-footer-phone` |
| 6 | `src/pages/RestaurantBillingSoftware.jsx` | 48 | `billing-lp-footer-phone` |
| 7 | `src/pages/RestaurantManagementSoftware.jsx` | 48 | `mgmt-lp-footer-phone` |
| 8 | `src/pages/CloudKitchenPos.jsx` | 50 | `ck-lp-footer-phone` |
| 9 | `src/pages/QsrPosSystem.jsx` | 48 | `qsr-lp-footer-phone` |
| 10 | `src/pages/RestaurantPosComparison.jsx` | 98 | `comparison-lp-footer-phone` |
| 11 | `src/pages/DemoLanding.jsx` | 30 | `demo-footer-phone` |
| 12 | `src/pages/PetpoojaAlternative.jsx` | 370 | `landing-footer-phone` |

---

## Fix Strategy

### Groups A, B, D — Direct JSX swap
Replace `<a href={…tel…}>` with `<span>`. Remove `hover:` Tailwind classes (hover has no meaning on non-interactive elements). Keep all other classNames, data-testid, and child content unchanged.

### Group C — Data array approach (Contact.jsx)
The `items` array drives the render loop at line 91:
```js
return it.href ? (
  <a key={it.label} href={it.href} ...>{inner}</a>
) : (
  <div key={it.label} data-testid={it.testid}>{inner}</div>
);
```
Setting `href: null` on the phone entry is sufficient — the existing ternary already renders a `<div>` when `href` is null (see `contact-location` item at line 62 which already uses `href: null`). **No render loop change needed.**

---

## What Does NOT Change

| Item | Reason |
|---|---|
| `COMPANY.phone` display value (`9104743156`) | Still rendered as text — visually identical |
| `COMPANY.phoneIntl` in `company.js` | Value retained for future use if needed |
| Schema.org `telephone` in `seo.js:22` | JSON-LD metadata field — not a UI element |
| Schema.org `telephone` in `Contact.jsx:53` | Same — JSON-LD only |
| Email `mailto:` link in Footer and Contact | Out of scope — email link is expected behaviour |
| WhatsApp `wa.me` link in Contact | Out of scope — separate decision |
| `WhatsAppFab.jsx` | Already disabled via CR-231 |
| All data-testid values | Preserved on every instance |

---

## Visual Impact

None. The phone number string `9104743156` continues to display in exactly the same position and styling. The only difference: it is no longer an underlined/clickable hyperlink (most browsers do not underline `tel:` links by default anyway — appearance is already like plain text).

---

## Risk Assessment

**Very low.**
- No logic changes
- No state changes
- No API calls
- No routing changes
- Existing `href: null` pattern for non-linked items already used and working in Contact.jsx

---

## Effort

| Item | Count |
|---|---|
| search-replace ops | 12 |
| Files touched | 10 |
| yarn build required | 1 |
| supervisorctl restart | 1 |
| New dependencies | 0 |

**Estimated dev time: 10–15 minutes.**

---

*Written 2026-09-08.*
