# CR-167 — Homepage H1: Add Primary Keywords

**Type:** SEO / On-Page
**Date Raised:** 2026-08-30
**Status:** OPEN
**Priority:** P1
**Source:** SEO audit — H1 contains zero primary keywords

---

## 1. Problem

Current H1 (Hero.jsx `home.hero.title_lead` + `home.hero.title_accent`):
> "Run a more profitable hospitality business — from your phone."

Zero of the top target keywords appear: POS, billing, restaurant, software, management.
H1 is the single strongest on-page SEO signal after `<title>`. The keyword-rich badge
(`India's Restaurant POS & Billing Software`) is a `<span>`, invisible to H1 ranking signals.

---

## 2. Fix

**File:** `frontend/src/components/home/Hero.jsx` L26–29

```jsx
// BEFORE — EditableText fallbacks:
// title_lead = "Run a more profitable hospitality business — "
// title_accent = "from your phone."

// AFTER — EditableText fallbacks:
// title_lead = "India's #1 Restaurant POS & Billing Software — "
// title_accent = "Run Your Business From Your Phone"
```

Single-line rendered H1:
> India's #1 Restaurant POS & Billing Software — Run Your Business From Your Phone

**Keywords hit:** restaurant, POS, billing, software — all P1 targets in one H1.

---

## 3. Files to Change

| File | Change | Lines |
|---|---|---|
| `frontend/src/components/home/Hero.jsx` | Update `fallback` on `home.hero.title_lead` and `home.hero.title_accent` | L26, L28 |

---

## 4. CMS note

The text is driven by `EditableText` with `id="home.hero.title_lead"` and `id="home.hero.title_accent"`. Changing the `fallback` prop is sufficient. No CMS database change needed (fallback renders when no CMS override exists).

---

## 5. Definition of Done

- [ ] H1 contains "Restaurant POS" or "Billing Software" (confirmed in prerendered HTML)
- [ ] H1 still contains a benefit hook ("run your business from your phone" or similar)
- [ ] No visual regression on hero layout (text wraps correctly on mobile/desktop)
- [ ] `data-testid="hero-h1"` or equivalent test ID preserved

*CR-167 registered 2026-08-30. Source: SEO audit.*
