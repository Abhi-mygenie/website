# CR-73 — Add Phone, Email & Privacy Link to LandingFooter on /petpooja-alternative

**Type:** Trust Signal Fix / LP Transparency  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** CRITICAL  
**Plan ID:** C4  
**Effort:** 20 min  
**Improves:** QS LP Experience · Trust · Google Transparency Standard  
**Scope:** `frontend/src/pages/PetpoojaAlternative.jsx`  
**Related:** CR-78 (same fix for /demo), CR-74 (StickyMobileCta fix)

---

## 1. Problem Statement

The `/petpooja-alternative` page — the highest-spend Google Ads landing page — uses a minimal `LandingFooter` component that shows only a logo and copyright line. It has no phone number, no email address, and no privacy policy link.

Google's Landing Page Experience evaluation requires pages to be transparent and easy to navigate. A landing page that strips all contact and legal links fails this check, contributing to the "Below Average" LP Experience rating.

---

## 2. Root Cause

**`frontend/src/pages/PetpoojaAlternative.jsx` — `LandingFooter` function:**
```jsx
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Logo light />
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd. All rights reserved.</span>
      </div>
    </footer>
  );
}
```
No phone, no email, no privacy policy link.

---

## 3. Exact Changes Required

**`frontend/src/pages/PetpoojaAlternative.jsx` — update `LandingFooter`:**

Add import at top of file:
```js
import { COMPANY } from "@/data/company";
```

Update the `LandingFooter` function:
```jsx
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors">{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-brand-yellow transition-colors">{COMPANY.supportEmail}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">&copy; {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}
```

Verify `Link` is already imported from `react-router-dom` at the top of the file — confirmed (line 2).

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/PetpoojaAlternative.jsx` | Add COMPANY import; update LandingFooter to include phone, email, privacy link |

---

## 5. Definition of Done

- [ ] Footer on /petpooja-alternative shows phone number, support email, and "Privacy Policy" link
- [ ] Phone link works (tel: protocol)
- [ ] Privacy Policy navigates to /privacy correctly
- [ ] Layout not broken on mobile (flex-wrap handles wrapping)
- [ ] No exit links to non-conversion pages introduced (phone/email/privacy are acceptable)

---

*CR-73 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C4.*
