# CR-191 → CR-195 — Line-by-Line Implementation Plan
**Source:** Beta Site Audit — Dev Team Brief (Sep 2 2026)
**Prepared:** 2026-09-02 Session 3
**Status:** Ready to implement — no owner approval needed
**Build required:** One `yarn build` after all 5 CRs are done

---

## Pre-flight checklist

```bash
# Confirm clean working state before starting
sudo supervisorctl status           # both frontend + backend RUNNING
find /app/frontend/build -name "index.html" | wc -l   # should be 63
```

---

## CR-191 — `/demo` noindex Bug

**File:** `/app/frontend/src/pages/DemoLanding.jsx`
**Lines touched:** 77 (1 line removed)
**Risk:** Zero

### Change

**Line 77 — REMOVE:**
```jsx
        noindex={true}
```

**Before (lines 73–78):**
```jsx
      <Seo
        title={seo.title}
        description={seo.description}
        path="/demo"
        noindex={true}
      />
```

**After (lines 73–77):**
```jsx
      <Seo
        title={seo.title}
        description={seo.description}
        path="/demo"
      />
```

### What this does
Removes `<meta name="robots" content="noindex,nofollow">` from the prerendered `/demo/index.html`.
`Seo` component defaults `noindex=false` — no other change needed.

### Validation (post-build)
```bash
grep "noindex" /app/frontend/build/demo/index.html
# Expected: no output (tag gone)
```

---

## CR-192 + CR-193 — fetchPriority + Remove Reveal from Hero Images

> These two CRs are implemented together — same file, same line, one edit per page.
> Pattern applied identically to all 6 files.

**The fix pattern (applies to every landing page hero image):**

```jsx
// BEFORE — image hidden by Reveal after hydration, no fetchPriority hint
<Reveal>
  <img src="/brand/banner.webp" alt="..." width={776} height={637}
       className="..." loading="eager" data-testid="..." />
</Reveal>

// AFTER — image renders immediately, browser pre-fetches at high priority
<img src="/brand/banner.webp" alt="..." width={776} height={637}
     className="..." loading="eager" fetchPriority="high"
     srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
     sizes="(max-width: 1023px) 400px, 776px"
     data-testid="..." />
```

Three changes per image:
1. Remove `<Reveal>` opening tag
2. Add `fetchPriority="high"` to `<img>`
3. Add `srcSet` + `sizes` to `<img>`
4. Remove `</Reveal>` closing tag

---

### CR-192+193 — File 1: `RestaurantBillingSoftware.jsx`

**Lines touched:** 147–149 (3 lines → 1 line)

**Before:**
```jsx
// Line 147
              <Reveal>
// Line 148
                <img src="/brand/banner.webp" alt="MyGenie restaurant billing software interface" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" data-testid="billing-lp-hero-image" />
// Line 149
              </Reveal>
```

**After:**
```jsx
              <img src="/brand/banner.webp" alt="MyGenie restaurant billing software interface" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="billing-lp-hero-image" />
```

**Validation (post-build):**
```bash
grep -i "fetchpriority\|srcset" /app/frontend/build/restaurant-billing-software/index.html | head -2
# Expected: fetchpriority="high" and srcset present on banner img
```

---

### CR-192+193 — File 2: `RestaurantPosSystem.jsx`

**Lines touched:** 154–156 (3 lines → 1 line)

**Before:**
```jsx
// Line 154
              <Reveal>
// Line 155
                <img src="/brand/banner.webp" alt="MyGenie restaurant POS system on phone" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" data-testid="pos-lp-hero-image" />
// Line 156
              </Reveal>
```

**After:**
```jsx
              <img src="/brand/banner.webp" alt="MyGenie restaurant POS system on phone" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="pos-lp-hero-image" />
```

---

### CR-192+193 — File 3: `QsrPosSystem.jsx`

**Lines touched:** 156–158 (3 lines → 1 line)

**Before:**
```jsx
// Line 156
              <Reveal>
// Line 157
                <img src="/brand/banner.webp" alt="MyGenie QSR POS system — counter billing on phone" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" data-testid="qsr-lp-hero-image" />
// Line 158
              </Reveal>
```

**After:**
```jsx
              <img src="/brand/banner.webp" alt="MyGenie QSR POS system — counter billing on phone" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="qsr-lp-hero-image" />
```

---

### CR-192+193 — File 4: `CloudKitchenPos.jsx`

**Lines touched:** 157–159 (3 lines → 1 line)

**Before:**
```jsx
// Line 157
              <Reveal>
// Line 158
                <img src="/brand/banner.webp" alt="MyGenie cloud kitchen POS and billing software dashboard" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" data-testid="ck-lp-hero-image" />
// Line 159
              </Reveal>
```

**After:**
```jsx
              <img src="/brand/banner.webp" alt="MyGenie cloud kitchen POS and billing software dashboard" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="ck-lp-hero-image" />
```

---

### CR-192+193 — File 5: `RestaurantManagementSoftware.jsx`

**Lines touched:** 147–150 (4 lines → 1 line)
> Note: line 148 is a comment `{/* Dashboard screenshot — not a stock waiter photo */}` — also removed with the Reveal wrapper.

**Before:**
```jsx
// Line 147
              <Reveal>
// Line 148
                {/* Dashboard screenshot — not a stock waiter photo */}
// Line 149
                <img src="/brand/banner.webp" alt="MyGenie restaurant management software dashboard" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" data-testid="mgmt-lp-hero-image" />
// Line 150
              </Reveal>
```

**After:**
```jsx
              {/* Dashboard screenshot — not a stock waiter photo */}
              <img src="/brand/banner.webp" alt="MyGenie restaurant management software dashboard" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="mgmt-lp-hero-image" />
```

> Comment is preserved, just moved outside the (removed) Reveal wrapper.

---

### CR-192+193 — File 6: `ProductPage.jsx`

**Lines touched:** 95–106 (12 lines restructured)
> ProductPage is a template used by ALL 6 product pages (`/product/sell-serve`, `/product/run-property`, etc.).
> The hero right column has two branches: `p.image` (if product has an image) and a dark card fallback (if not).
> Only the `p.image` branch has an `<img>` with `loading="eager"`. The fallback branch has no img — no change needed there.
> The `<Reveal>` wrapper wraps both branches — remove it from both, keeping inner content intact.

**Before (lines 95–128):**
```jsx
            <Reveal>
              {p.image ? (
                <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-sand to-brand-green/10 p-4">
                  <img
                    src={p.image}
                    alt={`${p.title} — MyGenie POS`}
                    width={480}
                    height={480}
                    className="w-full h-[400px] object-contain"
                    loading="eager"
                  />
                </div>
              ) : (
              <div className="relative rounded-[2rem] overflow-hidden bg-brand-deep p-10 min-h-[420px] flex flex-col justify-between">
                ...dark card content...
              </div>
              )}
            </Reveal>
```

**After:**
```jsx
            {p.image ? (
              <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-sand to-brand-green/10 p-4">
                <img
                  src={p.image}
                  alt={`${p.title} — MyGenie POS`}
                  width={480}
                  height={480}
                  className="w-full h-[400px] object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            ) : (
            <div className="relative rounded-[2rem] overflow-hidden bg-brand-deep p-10 min-h-[420px] flex flex-col justify-between">
              ...dark card content unchanged...
            </div>
            )}
```

> `srcSet`/`sizes` NOT added here — `p.image` is a product-specific image (not `banner.webp`), different dimensions per product. Only `fetchPriority="high"` added.
> No `<Reveal>` opening/closing tags around the entire block.

---

## CR-194 — `/petpooja-alternative` CLS Fix

**File:** `/app/frontend/src/pages/PetpoojaAlternative.jsx`
**Lines touched:** 466 (1 attribute change)
**Risk:** Minimal

### Change

**Line 466 — CHANGE:**
```jsx
// BEFORE
                  loading="lazy"
// AFTER
                  loading="eager"
```

**Before (lines 459–470):**
```jsx
              {VSP_TRUST_LOGOS.slice(0, 4).map((logo) => (
                <img
                  key={logo.name}
                  src={logo.img}
                  alt={logo.name}
                  title={logo.name}
                  className="h-8 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
                  loading="lazy"
                  width={120}
                  height={32}
                />
              ))}
```

**After (lines 459–470):**
```jsx
              {VSP_TRUST_LOGOS.slice(0, 4).map((logo) => (
                <img
                  key={logo.name}
                  src={logo.img}
                  alt={logo.name}
                  title={logo.name}
                  className="h-8 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
                  loading="eager"
                  width={120}
                  height={32}
                />
              ))}
```

### What this does
Loads the 4 above-fold trust logos (Hyatt Centric, Palm Forest Resort, Love Bites, Mill Bakery) immediately with the page instead of deferring them. `width={120}` and `height={32}` are already set — browser has reserved the space. Switching to `eager` stops the deferred-load layout repaint that causes CLS 0.029.

### Validation (post-build)
```bash
python3 -c "
import re
html = open('/app/frontend/build/petpooja-alternative/index.html').read()
# Check trust logo images are not lazy
lazy = html.count('loading=\"lazy\"')
print(f'lazy imgs remaining: {lazy}')
"
# Trust logos should no longer be lazy in above-fold section
```

---

## CR-195 — `/restaurant-pos-comparison` Remove Reveal from Stat Cards

**File:** `/app/frontend/src/pages/RestaurantPosComparison.jsx`
**Lines touched:** 166–172 (remove `<Reveal>` and `</Reveal>` tags from the `.map()`)
**Risk:** Low — only removes entrance animation on 4 above-fold cards

### Change

The 4 stat cards are rendered by a `.map()` — the `<Reveal>` and `</Reveal>` are inside the map callback.

**Before (lines 165–172):**
```jsx
                ].map(({ val, label, color }, i) => (
                  <Reveal key={val} delay={i * 0.08}>
                    <div className="bg-white border border-brand-line rounded-3xl p-6" data-testid={`comparison-stat-${i}`}>
                      <div className={`font-display text-4xl font-bold leading-none mb-2 ${color}`}>{val}</div>
                      <div className="text-sm text-brand-muted leading-snug">{label}</div>
                    </div>
                  </Reveal>
                ))}
```

**After (lines 165–172):**
```jsx
                ].map(({ val, label, color }, i) => (
                  <div key={val} className="bg-white border border-brand-line rounded-3xl p-6" data-testid={`comparison-stat-${i}`}>
                    <div className={`font-display text-4xl font-bold leading-none mb-2 ${color}`}>{val}</div>
                    <div className="text-sm text-brand-muted leading-snug">{label}</div>
                  </div>
                ))}
```

Three changes:
1. Remove `<Reveal key={val} delay={i * 0.08}>` — opening tag gone
2. Move `key={val}` from Reveal → outer `<div>` (React requires key on the outermost element returned by `.map()`)
3. Remove `</Reveal>` — closing tag gone

> All other `<Reveal>` uses on this page (comparison table, testimonials, switch steps) are BELOW the fold — leave them untouched.

### Validation (post-build)
```bash
python3 -c "
html = open('/app/frontend/build/restaurant-pos-comparison/index.html').read()
# Stat values should be present in body immediately (not gated by JS visibility)
for val in ['48 hrs', '₹1 Lakh', '100+', '₹799']:
    print(f'{val}: {\"found\" if val in html else \"MISSING\"}')"
```

---

## Build + Restart (after all 5 CRs)

```bash
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr191-195.log 2>&1
sudo supervisorctl restart frontend
```

Build time: ~3 minutes. Monitor with:
```bash
tail -f /app/memory/build-cr191-195.log
```

---

## Post-Build Verification Checklist

```bash
# 1. CR-191: noindex gone from /demo
grep "noindex" /app/frontend/build/demo/index.html
# Expected: no output

# 2. CR-192: fetchPriority present on all 6 pages
for slug in restaurant-billing-software restaurant-pos-system qsr-pos-system cloud-kitchen-pos restaurant-management-software; do
  COUNT=$(grep -c "fetchpriority" /app/frontend/build/${slug}/index.html 2>/dev/null || echo 0)
  echo "$slug → fetchpriority:$COUNT"
done
# Expected: each = 1

# 3. CR-192: srcSet present (mobile image serving)
grep -o "banner-mobile.webp" /app/frontend/build/restaurant-billing-software/index.html | wc -l
# Expected: 1

# 4. CR-194: no lazy trust logos above fold on petpooja
grep -c 'loading="lazy"' /app/frontend/build/petpooja-alternative/index.html
# Remaining lazy should only be for below-fold images

# 5. CR-195: comparison stat values visible immediately
python3 -c "
html = open('/app/frontend/build/restaurant-pos-comparison/index.html').read()
for v in ['48 hrs','₹1 Lakh','100+','₹799']:
    print(v, '✅' if v in html else '❌')"
# Expected: all ✅

# 6. Route count unchanged
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63
```

---

## Summary Table

| CR | File | Line(s) | Change | Edits |
|---|---|---|---|---|
| CR-191 | `DemoLanding.jsx` | 77 | Remove `noindex={true}` | 1 line deleted |
| CR-192+193 | `RestaurantBillingSoftware.jsx` | 147–149 | Remove Reveal, add fetchPriority+srcSet | 3→1 lines |
| CR-192+193 | `RestaurantPosSystem.jsx` | 154–156 | Remove Reveal, add fetchPriority+srcSet | 3→1 lines |
| CR-192+193 | `QsrPosSystem.jsx` | 156–158 | Remove Reveal, add fetchPriority+srcSet | 3→1 lines |
| CR-192+193 | `CloudKitchenPos.jsx` | 157–159 | Remove Reveal, add fetchPriority+srcSet | 3→1 lines |
| CR-192+193 | `RestaurantManagementSoftware.jsx` | 147–150 | Remove Reveal, add fetchPriority+srcSet | 4→2 lines |
| CR-192+193 | `ProductPage.jsx` | 95–128 | Remove Reveal wrapper, add fetchPriority | Remove 2 tags |
| CR-194 | `PetpoojaAlternative.jsx` | 466 | `loading="lazy"` → `loading="eager"` | 1 attr changed |
| CR-195 | `RestaurantPosComparison.jsx` | 166–172 | Remove Reveal from 4 stat cards, move key | 2 tags removed |
| — | — | **Total** | **7 files, ~15 edits** | **1 rebuild** |

*Plan prepared 2026-09-02 Session 3. Ready to implement on agent instruction.*
