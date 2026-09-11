# CR-163 — Fix 5-Field Forms: Hide outlet_type in shortForm

**Type:** Conversion Rate / Form UX
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P1
**Source:** Audit finding — screenshot confirmed 5 fields on pages without sector prop

---

## 1. Problem Statement

The audit tool flags "All demo forms still have 5–7 fields. Target is 4." The screenshot confirms the 5-field form.

### Root cause (confirmed by code investigation)

`DemoForm.jsx` L347:
```jsx
{!sector && (
  <select ...>Outlet type (optional)</select>
)}
```

This condition shows `outlet_type` when **no `sector` prop is passed**, regardless of `shortForm`. So on 6 pages that use `<DemoForm shortForm />` without a `sector` prop, the form renders **5 fields**:

1. Your name *
2. Phone number *
3. Email address *
4. Business name (optional)
5. **Outlet type (optional)** ← 5th field — should be hidden

### Affected pages (6)

| Page | Current fields | Expected after fix |
|---|---|---|
| `About.jsx` | 5 | 4 |
| `ProductIndex.jsx` | 5 | 4 |
| `AiPage.jsx` | 5 | 4 |
| `SolutionsIndex.jsx` | 5 | 4 |
| `ProductPage.jsx` | 5 | 4 |
| `Contact.jsx` (demo tab) | 5 | 4 |

### Pages already at 4 fields (no change needed)
- All 5 LPs (sector prop passed) ✅
- SectorPage (sector={s.name}) ✅
- CtaDemo/homepage (sector={sector}) ✅
- DemoLanding (sector="meta-demo") ✅
- PetpoojaAlternative (sector="petpooja-alternative") ✅

---

## 2. Fix — Add `!shortForm` to outlet_type condition

**File:** `frontend/src/components/site/DemoForm.jsx` L347

```jsx
// BEFORE (L347):
{!sector && (
  <select className={fieldCls("outlet_type")} ...>
    <option value="">Outlet type (optional)</option>
    ...
  </select>
)}

// AFTER:
{!sector && !shortForm && (
  <select className={fieldCls("outlet_type")} ...>
    <option value="">Outlet type (optional)</option>
    ...
  </select>
)}
```

**One word change: `&& !shortForm`** added to the condition.

**Effect:**
- `shortForm=false` (full form, no sector): outlet_type still shown — no change to full form behaviour
- `shortForm=true` (any page): outlet_type hidden regardless of sector — consistent 4-field form

---

## 3. Impact on CRM / Lead Data

`outlet_type` on these 6 pages was already optional (placeholder: "Outlet type (optional)"). Most visitors leave it blank. Hiding it:
- Does NOT affect required fields or form submission
- `outlet_type` in Freshsales will be blank for these pages (already common)
- Sector context is available from `source_page` tag (`"src:about"`, etc.)

---

## 4. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/components/site/DemoForm.jsx` | ADD `&& !shortForm` to outlet_type condition at L347 | 1 word |

---

## 5. Field Summary After Fix

All `shortForm` instances site-wide will show exactly **4 fields**:

| Field | Required | Visible |
|---|---|---|
| Name | ✅ | ✅ |
| Phone | ✅ | ✅ |
| Email | ✅ | ✅ |
| Business name | ❌ optional | ✅ |

Hidden in all shortForm:
- years_in_business (select) — hidden by `!shortForm` ✅
- **outlet_type (select) — hidden by `!sector && !shortForm` ← this fix** 
- city (input) — hidden by `!shortForm && sector !== "meta-demo"` ✅

---

## 6. Definition of Done

- [ ] All 6 affected pages show exactly 4 fields (name, phone, email, business name)
- [ ] Outlet type dropdown hidden on About, ProductIndex, AiPage, SolutionsIndex, ProductPage, Contact
- [ ] Full form (shortForm=false) still shows outlet_type — no regression
- [ ] Pages with sector prop still show 4 fields (no change)
- [ ] Form submission still works correctly

*CR-163 registered 2026-08-26. Source: audit screenshot + code investigation.*
