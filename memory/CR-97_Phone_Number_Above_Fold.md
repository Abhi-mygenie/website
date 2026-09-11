# CR-97 — Add Phone Number Above Fold on Homepage

**Type:** Trust Signal / Conv Optimisation  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** MEDIUM  
**Plan ID:** M9  
**Effort:** 30 min  
**Improves:** Trust · Conv  
**Scope:** `frontend/src/components/home/Hero.jsx` or `frontend/src/components/site/Navbar.jsx`  
**Related:** CR-96 (India trust signals), CR-73 (footer trust)

---

## 1. Problem Statement

The phone number (`9104743156`) is available only in the Footer (below 8 scroll sections). India visitors — especially those arriving from PPC ads — often look for a phone number near the primary CTA to validate legitimacy before booking a demo. No phone is visible above the fold on the homepage.

---

## 2. Exact Changes Required

### Option A (Recommended) — Add to Navbar right side (desktop)
In `frontend/src/components/site/Navbar.jsx`, add phone number next to the “Book a Free Demo” button on desktop:
```jsx
import { Phone } from "lucide-react";
import { COMPANY } from "@/data/company";

// In the desktop nav right section:
<a
  href={`tel:${COMPANY.phoneIntl}`}
  className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-green transition-colors"
>
  <Phone className="w-3.5 h-3.5" />
  {COMPANY.phone}
</a>
```

### Option B — Add below hero CTAs
In `frontend/src/components/home/Hero.jsx`, below the disclaimer line:
```jsx
<p className="mt-3 text-xs text-brand-muted">
  Or call us: <a href={`tel:${COMPANY.phoneIntl}`} className="font-semibold text-brand-ink hover:text-brand-green transition-colors">{COMPANY.phone}</a>
</p>
```

Implement Option A for desktop (persistent in sticky Navbar) and Option B for mobile (visible in hero section).

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/site/Navbar.jsx` | Add phone number to desktop nav right section |
| `frontend/src/components/home/Hero.jsx` | Add phone link below hero disclaimer for mobile |

---

## 4. Definition of Done

- [ ] Phone number visible in Navbar on desktop (lg:+) without scrolling
- [ ] Phone number visible in hero section on mobile without scrolling
- [ ] Clicking/tapping the number initiates a phone call (tel: protocol)
- [ ] No visual clutter — number is small and secondary to the main CTA

---

*CR-97 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M9.*
