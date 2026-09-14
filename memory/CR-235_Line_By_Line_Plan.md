# CR-235 — Line-by-Line Implementation Plan: Remove tel: Links

**Date:** 2026-09-08
**Priority:** P1 — UX
**Total ops:** 12 search-replace operations across 10 files
**Estimated time:** 10–15 minutes

---

## Summary Table

| Op | File | Line | Change |
|---|---|---|---|
| 1 | `Navbar.jsx` | 151–158 | `<a>` multi-line → `<span>`, remove hover classes |
| 2 | `Hero.jsx` | 71–77 | `<a>` multi-line → `<span>`, remove hover classes |
| 3 | `Footer.jsx` | 30 | `<a>` single-line → `<span>`, remove hover classes |
| 4 | `Contact.jsx` | 60 | `href: \`tel:…\`` → `href: null` in data array |
| 5–12 | 8 landing pages | various | `<a>` single-line → `<span>`, remove hover classes |

---

## Op 1 — `src/components/site/Navbar.jsx` lines 151–158

**Find (exact):**
```jsx
          <a
            href={`tel:${COMPANY.phoneIntl}`}
            data-testid="nav-phone-link"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-green transition-colors"
          >
            <ICONS.Phone className="w-3.5 h-3.5" />
            {COMPANY.phone}
          </a>
```

**Replace with:**
```jsx
          <span
            data-testid="nav-phone-link"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-muted"
          >
            <ICONS.Phone className="w-3.5 h-3.5" />
            {COMPANY.phone}
          </span>
```

**What changed:** `<a>` → `<span>`, removed `href`, removed `hover:text-brand-green transition-colors`.

---

## Op 2 — `src/components/home/Hero.jsx` lines 71–77

**Find (exact):**
```jsx
            <a
              href={`tel:${COMPANY.phoneIntl}`}
              data-testid="hero-phone-link"
              className="font-semibold text-brand-ink hover:text-brand-green transition-colors"
            >
              {COMPANY.phone}
            </a>
```

**Replace with:**
```jsx
            <span
              data-testid="hero-phone-link"
              className="font-semibold text-brand-ink"
            >
              {COMPANY.phone}
            </span>
```

**What changed:** `<a>` → `<span>`, removed `href`, removed `hover:text-brand-green transition-colors`.

---

## Op 3 — `src/components/site/Footer.jsx` line 30

**Find (exact):**
```jsx
              <a href={`tel:${COMPANY.phoneIntl}`} className="flex items-center gap-2 hover:text-brand-yellow transition-colors" data-testid="footer-phone"><Phone className="w-4 h-4" /> {COMPANY.phone}</a>
```

**Replace with:**
```jsx
              <span className="flex items-center gap-2 text-[#9DB1A4]" data-testid="footer-phone"><Phone className="w-4 h-4" /> {COMPANY.phone}</span>
```

**What changed:** `<a>` → `<span>`, removed `href`, removed `hover:text-brand-yellow transition-colors`, added `text-[#9DB1A4]` to keep color consistent with surrounding footer text (the `hover:text-brand-yellow` was the only colour rule — without it the element would inherit the parent's `text-[#9DB1A4]` anyway, but being explicit is safer).

---

## Op 4 — `src/pages/Contact.jsx` line 60

**Find (exact):**
```js
    { icon: Phone, label: "Call us", value: COMPANY.phone, href: `tel:${COMPANY.phoneIntl}`, testid: "contact-phone" },
```

**Replace with:**
```js
    { icon: Phone, label: "Call us", value: COMPANY.phone, href: null, testid: "contact-phone" },
```

**What changed:** `href: \`tel:…\`` → `href: null`.

**Why this works without touching the render loop:** The render loop at line 91 already handles `href: null` → renders a `<div>` wrapper instead of `<a>`. Proof: `contact-location` item at line 62 uses `href: null` today and renders correctly as an unlinked card.

**No change to lines 91–96 (render loop) required.**

---

## Ops 5–12 — Landing Page LandingFooters (8 files, identical pattern)

All 8 use exactly the same one-liner. Apply the same search-replace to each file.

**Find (exact — same in all 8 files, only data-testid differs):**
```jsx
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="[testid]">{COMPANY.phone}</a>
```

**Replace with (same in all 8, only data-testid differs):**
```jsx
          <span className="text-brand-muted" data-testid="[testid]">{COMPANY.phone}</span>
```

**What changed:** `<a>` → `<span>`, removed `href`, replaced `hover:text-brand-yellow transition-colors` with `text-brand-muted`.

| Op | File | Line | data-testid |
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

## Build & Deploy

```bash
# After all 12 ops:
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

### Optional production build (when deploying to www.mygenie.online):
```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
cd /app && zip -r mygenie-prod-build.zip frontend/build/
# Then: upload zip to production, CF Purge Everything
```

---

## Post-Deploy Verification Checklist

| Check | How to verify |
|---|---|
| Navbar phone — no dialog | Desktop: click `9104743156` in header → no dialog appears |
| Footer phone — no dialog | Desktop: click phone in footer → no dialog |
| Hero phone — no dialog | Desktop: click "Or call us: 9104743156" on homepage → no dialog |
| Contact page phone card | `/contact` → "Call us" card clicks through to card details page (no) — just a plain div card |
| Any landing page footer | `/restaurant-pos-system` → scroll to footer → click phone → no dialog |
| Numbers still visible | All pages show `9104743156` as plain text ✅ |
| Mobile — no tap-to-call | iPhone / Android: tap phone number → no dial prompt |

---

## Can Be Batched With

- **CR-233** (`prerender.js` selector fix) — same `yarn build` covers both, no conflicts
- **CR-234** (`prerender.js` homepage preload) — same file as CR-233, can do both in same pass

---

## Explicitly Out of Scope

| Item | Status |
|---|---|
| `mailto:` email links in Footer and Contact | Keep as-is — email links are expected |
| `wa.me` WhatsApp link in Contact page info card | Separate decision — not in this CR |
| Schema.org `telephone` field in JSON-LD | Metadata only, not a UI element |
| `COMPANY.phoneIntl` value in `company.js` | Retained — not removed |

---

*Plan written 2026-09-08. Ready for implementation on owner go-ahead.*
