# Batch N — Line-By-Line Implementation Plans
# CR-155 + CR-159 (Larger Page Changes)

**Date:** 2026-08-26  
**Group:** Page-level changes — new sections, additional components  
**Recommended:** Implement after Group 1 (CR-154/157/158/160/156/161)

---

## CR-155 — /pricing H1 Keyword + Standalone DemoForm

### File 1 — `frontend/src/pages/Pricing.jsx`

#### Change 1A — Eyebrow text (L171)

**Current L171:**
```jsx
              <EditableText id="pricing.hero.eyebrow" fallback="Transparent, build-your-own pricing" />
```
**Change to:**
```jsx
              <EditableText id="pricing.hero.eyebrow" fallback="Transparent restaurant POS pricing" />
```

#### Change 1B — H1 text (L174)

**Current L174:**
```jsx
              <EditableText id="pricing.hero.h1" fallback="Build your MyGenie plan." />
```
**Change to:**
```jsx
              <EditableText id="pricing.hero.h1" fallback="Restaurant POS pricing — build your exact plan." />
```

**CMS alternative:** Edit `pricing.hero.eyebrow` and `pricing.hero.h1` via CMS admin instead of code change.

#### Change 1C — Add hero anchor CTA (after L178, before `<div className="mt-10 grid...">`)

**Current L177-181:**
```jsx
            <p className="mt-4 text-lg text-brand-muted">
              <EditableText id="pricing.hero.sub" fallback="Pick a base plan..." />
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-8">
```

**Insert between L179 (end of `</p>`) and L181 (`<div className="mt-10 grid...">`):**
```jsx
            <p className="mt-4 text-lg text-brand-muted">
              <EditableText id="pricing.hero.sub" fallback="Pick a base plan, add only what you need, and see your price update live — all plans are billed annually. Buy online or book a demo with your exact quote." />
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#lp-demo"
                className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-3 font-semibold text-sm transition-all hover:-translate-y-0.5"
                data-testid="pricing-hero-demo-cta"
              >
                Book a Free Demo →
              </a>
              <span className="text-sm text-brand-muted">or build your plan below</span>
            </div>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-8">
```

**Insert location:** After closing `</p>` of sub-headline (L178) and before `</div>` that closes the `max-w-2xl` div (L179), then before the grid div.

Precise old_str for search_replace:
```
old_str:
            <p className="mt-4 text-lg text-brand-muted">
              <EditableText id="pricing.hero.sub" fallback="Pick a base plan, add only what you need, and see your price update live — all plans are billed annually. Buy online or book a demo with your exact quote." />
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-8">

new_str:
            <p className="mt-4 text-lg text-brand-muted">
              <EditableText id="pricing.hero.sub" fallback="Pick a base plan, add only what you need, and see your price update live — all plans are billed annually. Buy online or book a demo with your exact quote." />
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#lp-demo"
                className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-3 font-semibold text-sm transition-all hover:-translate-y-0.5"
                data-testid="pricing-hero-demo-cta"
              >
                Book a Free Demo →
              </a>
              <span className="text-sm text-brand-muted">or build your plan below</span>
            </div>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-8">
```

#### Change 1D — Add DemoForm import (L1–5 imports section)

**Current imports include:** `DemoForm` is NOT imported in Pricing.jsx.

**Add import after L19** (after last existing import):
```jsx
import DemoForm from "@/components/site/DemoForm";
```

Precise location: after `import { PLANS, ADDONS, MONTHS_PER_YEAR, GST_RATE, alsoAdded } from "@/data/pricing";` (L19).

#### Change 1E — Add DemoForm section (between L310 ComparisonTable and L326 closing `</main>`)

**Current L309-327:**
```jsx
          {/* Plan comparison table */}
          <ComparisonTable />

          {/* CR-142 — contextual link to /petpooja-alternative */}
          <div className="mt-8 text-center">
            ...
          </div>
        </div>
      </main>
      <Footer />
```

**Insert after `</div>` that closes the petpooja link block (before `</div>` that closes `max-w-7xl` and before `</main>`):**

Precise old_str:
```
        </div>
      </main>
      <Footer />
```

new_str:
```
        </div>

        {/* CR-155 — Demo form for talk-first visitors */}
        <section
          id="lp-demo"
          className="bg-brand-deep py-20 sm:py-28 scroll-mt-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-16"
          data-testid="pricing-lp-demo"
        >
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5 block">
                Free · 45 min · No commitment
              </span>
              <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">
                See the pricing live — book a free walkthrough
              </h2>
              <p className="text-lg text-[#a3b8ac]">
                A specialist builds your exact quote on the call — no configurator needed.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="pricing-demo-form-wrap">
              <DemoForm sector="pricing" shortForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
```

---

### Definition of Done — CR-155
- [ ] `/pricing` H1 contains "Restaurant POS pricing"
- [ ] "Book a Free Demo →" anchor CTA appears below sub-headline (scrolls to `#lp-demo`)
- [ ] `id="lp-demo"` DemoForm section present at bottom of `/pricing` page
- [ ] DemoForm uses `sector="pricing"` and `shortForm`
- [ ] Existing CartSummary / CheckoutModal flow unchanged
- [ ] Prerendered after build

---

## CR-159 — /customers: Sticky CTA + Mid-Page Card

### File 1 — `frontend/src/components/home/StickyMobileCta.jsx` (L38–42)

Add `'[data-testid="stories-hero"]'` to the sentinel lookup chain:

**Current L38–42:**
```jsx
    heroRef.current =
      document.querySelector('[data-testid="hero"]') ||
      document.querySelector('[data-testid="vsp-hero"]') ||
      document.querySelector('[data-testid="sector-hero"]') ||
      document.querySelector('[data-testid="product-hero"]');
```

**Change to:**
```jsx
    heroRef.current =
      document.querySelector('[data-testid="hero"]') ||
      document.querySelector('[data-testid="vsp-hero"]') ||
      document.querySelector('[data-testid="sector-hero"]') ||
      document.querySelector('[data-testid="product-hero"]') ||
      document.querySelector('[data-testid="stories-hero"]');
```

**stories-hero testid confirmed at:** `SuccessStories.jsx` L22: `data-testid="stories-hero"` ✅

---

### File 2 — `frontend/src/pages/SuccessStories.jsx`

#### Change 2A — Add imports (L1–11)

Add `ArrowRight` to the existing import from `lucide-react` (L3):

**Current L3:**
```jsx
import { Quote, ArrowRight } from "lucide-react";
```
`ArrowRight` is already imported ✅ — no change needed.

Add `StickyMobileCta` import after `Reveal` import:

**Current L7:**
```jsx
import Reveal from "@/components/site/Reveal";
```
**Insert after L7:**
```jsx
import StickyMobileCta from "@/components/home/StickyMobileCta";
```

#### Change 2B — Add mid-page CTA card in story grid (L70–93)

**Current story grid map (L70–93):**
```jsx
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((t, i) => (
                <Reveal key={t.client} delay={(i % 3) * 0.06}>
                  <div className="h-full bg-white rounded-3xl border border-brand-line p-8 flex flex-col hover:shadow-[0_18px_44px_rgba(0,0,0,0.07)] transition-all" data-testid={`story-card-${i}`}>
                    ...
                  </div>
                </Reveal>
              ))}
            </div>
```

**Change the `{shown.map(...)}` to insert CTA card every 6 stories:**

old_str:
```jsx
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((t, i) => (
                <Reveal key={t.client} delay={(i % 3) * 0.06}>
```

new_str:
```jsx
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((t, i) => (
                <React.Fragment key={t.client}>
                <Reveal delay={(i % 3) * 0.06}>
```

Also need to close the Fragment and add the CTA card after each story. Change the closing of `.map()`:

**Find and replace the closing of the map (after `</Reveal>`):**

old_str (closing the map):
```jsx
              ))}
            </div>
```

new_str:
```jsx
                </Reveal>
                {(i + 1) % 6 === 0 && i < shown.length - 1 && (
                  <div
                    className="rounded-3xl bg-brand-green text-white p-8 flex flex-col justify-between"
                    data-testid="stories-mid-cta"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-3">Join them</p>
                      <h3 className="font-display text-2xl font-bold">Your story could be next.</h3>
                      <p className="text-white/80 mt-2 leading-relaxed text-sm">
                        Book a free walkthrough — tailored to your outlet type.
                      </p>
                    </div>
                    <a
                      href="/#demo"
                      data-testid="stories-mid-cta-btn"
                      className="mt-6 inline-flex items-center gap-2 bg-white text-brand-green rounded-full px-5 py-3 font-semibold text-sm hover:bg-brand-sand transition-all"
                    >
                      Book a Free Demo <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
                </React.Fragment>
              ))}
            </div>
```

**Add React import** — `React.Fragment` requires React in scope. Check if React is imported:
```bash
grep -n 'import React\|from "react"' /app/frontend/src/pages/SuccessStories.jsx | head -3
```
If not imported, add: `import React from "react";` at L1.

#### Change 2C — Add `<StickyMobileCta />` before closing `</div>` of the page

**Current last lines:**
```jsx
      <Footer />
    </div>
  );
}
```

**Add before `<Footer />`:**
```jsx
      <StickyMobileCta />
      <Footer />
    </div>
  );
}
```

---

### Definition of Done — CR-159
- [ ] `/customers` sticky bottom bar appears on mobile after scrolling past hero section
- [ ] Mid-page CTA card appears after every 6th story in grid (only when ≥7 stories visible)
- [ ] Both CTAs link to `/#demo`
- [ ] `data-testid="stories-mid-cta"` present when 6+ stories shown
- [ ] `StickyMobileCta` sentinel correctly finds `data-testid="stories-hero"`
- [ ] Layout not broken on 2-col (tablet) or 3-col (desktop) grid
- [ ] H1 unchanged

---

*Plans written 2026-08-26. CR-155 and CR-159 are independent of each other but both benefit from CR-160 being done first (Reveal fix).*
