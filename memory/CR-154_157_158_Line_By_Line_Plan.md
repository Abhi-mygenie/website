# Batch N — Line-By-Line Implementation Plans
# CR-154, CR-157, CR-158 (Small Text + Anchor Fixes)

**Date:** 2026-08-26  
**Group:** Smallest changes — 1–2 lines each  
**Recommended:** Implement together in one PR

---

## CR-154 — Homepage Badge Keyword Fix

### File 1A — `frontend/src/components/home/Hero.jsx` (1 line)

**Current L20:**
```jsx
<EditableText id="home.hero.badge" fallback="The Hospitality Operating System" />
```

**Change L20 to:**
```jsx
<EditableText id="home.hero.badge" fallback="India's Restaurant POS & Billing Software" />
```

**Context block (L15–21) for search-replace precision:**
```jsx
          <span
            className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 text-brand-orange px-4 py-1.5 text-sm font-semibold"
            data-testid="hero-badge"
          >
            <span className="w-2 h-2 rounded-full bg-brand-orange" />{" "}
            <EditableText id="home.hero.badge" fallback="The Hospitality Operating System" />
          </span>
```

**old_str for search_replace:**
```
fallback="The Hospitality Operating System"
```
**new_str:**
```
fallback="India's Restaurant POS & Billing Software"
```

### File 1B — CMS Admin (preferred path, zero deploy)

1. Go to `[preview URL]/leads` → login (admin / admin123)
2. Find field `home.hero.badge`
3. Set value to: `India's Restaurant POS & Billing Software`
4. Publish

If CMS edit done: skip File 1A (live value overrides code fallback).
If code change done: CMS value stays as override if previously set — update CMS too.

### Ads console actions (no dev)

| Ad Group | Current Final URL | Update to |
|---|---|---|
| Billing Software (199781695618) | `mygenie.online/` | `/restaurant-billing-software` |
| POS System (200309564562) | `/product/sell-serve` | `/restaurant-pos-system` |
| Management (202501557247) | `/product/see-everything` | `/restaurant-management-software` |
| QSR (180565370134 etc.) | homepage | `/qsr-pos-system` |
| Cloud Kitchen (202501556327) | `/solutions/cloud-kitchens` | `/cloud-kitchen-pos` |

### Definition of Done — CR-154
- [ ] Badge reads "India's Restaurant POS & Billing Software" above H1 on homepage
- [ ] H1 unchanged: `"Run a more profitable hospitality business — from your phone."`
- [ ] Prerendered HTML: "Restaurant POS" appears above the H1 in `build/index.html`
- [ ] Google Ads Final URLs updated (Ads console)

---

## CR-157 — Hero.jsx Primary CTA: Button → Anchor with href

### File — `frontend/src/components/home/Hero.jsx` (L45–52)

**Current L45–52:**
```jsx
            <button
              onClick={() => onDemo()}
              data-testid="hero-demo-btn"
              className="group bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)] flex items-center gap-2"
            >
              <EditableText id="home.hero.cta_primary" fallback="Book a Free Demo" />
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
```

**Change to (L45–52):**
```jsx
            <a
              href="#demo"
              onClick={(e) => { e.preventDefault(); onDemo(); }}
              data-testid="hero-demo-btn"
              className="group bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)] flex items-center gap-2"
            >
              <EditableText id="home.hero.cta_primary" fallback="Book a Free Demo" />
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
```

**Changes:** `<button>` → `<a>`, `onClick={() => onDemo()}` → `href="#demo" onClick={(e) => { e.preventDefault(); onDemo(); }}`  
**Unchanged:** all className, data-testid, children

**Note:** `id="demo"` exists at `CtaDemo.jsx` L54. The homepage lazy-loads `CtaDemo` — if it hasn't loaded when the link is clicked, `href="#demo"` scroll does nothing (same as today). JS path unchanged.

### Definition of Done — CR-157
- [ ] Hero primary CTA is `<a>` element with `href="#demo"`
- [ ] Clicking still scrolls to demo section (JS path)
- [ ] `data-testid="hero-demo-btn"` preserved
- [ ] No visual difference in browser
- [ ] `<button>` completely replaced (no button element remains for this CTA)

---

## CR-158 — /product H1 Keyword

### Option A — CMS Admin (zero deploy, preferred)

1. Go to `[preview URL]/leads` → login
2. Edit field `product.index.hero.eyebrow` → `"Restaurant POS features"`
3. Edit field `product.index.hero.h1` → `"One restaurant operating system — every tool included."`
4. Publish

### Option B — Code fallback update (batched with other changes)

**File:** `frontend/src/pages/ProductIndex.jsx`

**Current L35:**
```jsx
                <EditableText id="product.index.hero.eyebrow" fallback="Everything in one app" />
```
**Change L35 to:**
```jsx
                <EditableText id="product.index.hero.eyebrow" fallback="Restaurant POS features" />
```

**Current L38:**
```jsx
                <EditableText id="product.index.hero.h1" fallback="Every tool your business needs — in one operating system." block />
```
**Change L38 to:**
```jsx
                <EditableText id="product.index.hero.h1" fallback="One restaurant operating system — every tool included." block />
```

### Definition of Done — CR-158
- [ ] `/product` H1 contains "restaurant operating system" or "restaurant"
- [ ] Eyebrow contains "Restaurant POS"
- [ ] Prerendered HTML (if code change): run `yarn build && node scripts/prerender.js`
- [ ] H1 change visible at `mygenie.online/product`

---

*Plans written 2026-08-26. CR-154 + CR-157 both touch Hero.jsx — implement in same edit.*
