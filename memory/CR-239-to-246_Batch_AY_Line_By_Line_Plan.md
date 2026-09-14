# Batch AY — Line-by-Line Implementation Plan (CR-239 → CR-246)

**Date:** 2026-09-08
**Status:** All decisions locked — ready to implement
**Source:** Impact analysis `CR-239-to-246_Batch_AY_ImpactAnalysis.md`

---

## Can the full batch be implemented at once?

**Yes. Recommended: single pass, one rebuild.**

All 8 CRs are fully independent. No CR depends on another. No file conflict — where two CRs touch the same file, they edit different sections (no line overlap).

**Recommended file order (data files first, then pages, JSX additions last):**

```
Pass 1 — Data files (pure string, no JSX risk):
  1. src/data/products.js        → CR-242
  2. src/data/vsp.js             → CR-245, CR-246 (row c3)
  3. src/data/sectors.js         → CR-241 (4 edits)
  4. src/data/stories.js         → CR-241 (1 edit)

Pass 2 — Page files (string replacements only):
  5. src/pages/About.jsx                          → CR-241 (1 edit)
  6. src/pages/Resources.jsx                      → CR-241 (1 edit)
  7. src/pages/CloudKitchenPos.jsx                → CR-241 (2 edits)
  8. src/pages/RestaurantPosSystem.jsx            → CR-241 (3 edits)
  9. src/pages/RestaurantManagementSoftware.jsx   → CR-240 (1 edit)
  10. src/pages/RestaurantPosComparison.jsx       → CR-240 (3 edits), CR-241 (10 edits)
  11. src/pages/QsrPosSystem.jsx                  → CR-239 (2 edits), CR-244 (1 string edit)

Pass 3 — JSX additions (new blocks, most care needed):
  12. src/pages/QsrPosSystem.jsx                  → CR-244 (trust strip JSX)
  13. src/pages/RestaurantManagementSoftware.jsx  → CR-243 (new section JSX)
  14. src/pages/PetpoojaAlternative.jsx           → CR-246 (footnote JSX)

Pass 4 — Build:
  cd /app/frontend && yarn build
  sudo supervisorctl restart frontend
```

**Total: 14 files · ~38 ops · 1 rebuild**

---

## Op 1 — `src/data/products.js` · CR-242

**Find (exact):**
```js
      { icon: "Smartphone", name: "Captain App & Table Management", outcome: "Table and order management in real time — multiple waiters, one table, no clashes.", caps: ["Real-time order sync", "Works on any phone", "Modifiers & special instructions"] },
```

**Replace with:**
```js
      { icon: "Smartphone", name: "Captain App & Table Management", outcome: "Waiters take orders on any phone using the ordering app — multiple staff, one table, zero clashes.", caps: ["Take orders from table on any phone", "Works on any device", "Modifiers & special instructions"] },
```

**What changed:** `outcome` rewritten with "take orders" + "ordering app" keywords. First cap updated to match. Third cap unchanged.

---

## Op 2 — `src/data/vsp.js` · CR-245

**Find (exact):**
```js
  variant_a_sub:
    "Billing software and a restaurant operating system are different things. Here's what changes when billing, inventory, expenses, customers and AI all run in one connected system.",
```

**Replace with:**
```js
  variant_a_sub:
    "Petpooja runs 1.5 lakh restaurants. It's earned that. But billing software and a restaurant operating system are different things — here's what changes when billing, inventory, customers and AI all run in one connected system.",
```

**What changed:** "Petpooja runs 1.5 lakh..." sentence prepended. "expenses, " removed (tightened). Dash connector added before "here's". "connected system" kept.

---

## Op 3 — `src/data/vsp.js` · CR-246 (row c3)

**Find (exact):**
```js
  { id: "c3", feature: "Runs on any device",         sub: "No terminal purchase needed",                mg: "✓  Any device",          pp: "⚠  Terminal ₹15–30k",   ppType: "warn"  },
```

**Replace with:**
```js
  { id: "c3", feature: "Runs on any device",         sub: "No terminal purchase needed",                mg: "✓  Any device",          pp: "⚠  Local POS terminal",  ppType: "warn"  },
```

**What changed:** `pp` value only: `"⚠  Terminal ₹15–30k"` → `"⚠  Local POS terminal"`. Removes outdated price figure; keeps accurate hardware-required concept.

---

## Op 4 — `src/data/sectors.js` · CR-241 — feature desc (cafes)

**Find (exact):**
```js
      { icon: "Smartphone", title: "Mobile-first billing", desc: "Run your cafe POS on a few phones — QR menu ordering, no expensive hardware. Go live in under 48 hours." },
```

**Replace with:**
```js
      { icon: "Smartphone", title: "Mobile-first billing", desc: "Run your cafe POS on a few phones — QR menu ordering, no expensive hardware. Go live in under 24 hours." },
```

---

## Op 5 — `src/data/sectors.js` · CR-241 — testimonial headline + quote (cafes, first instance)

**Find (exact):**
```js
      { metric: "₹50,000+", headline: "saved on setup, live in 48 hours", quote: "MyGenie's mobile-first solution saved us over ₹50,000 upfront and let us go live in under 48 hours.", client: "Matryyoshka Café" },
```
*(line ~54)*

**Replace with:**
```js
      { metric: "₹50,000+", headline: "saved on setup, live in 24 hours", quote: "MyGenie's mobile-first solution saved us over ₹50,000 upfront and let us go live in under 24 hours.", client: "Matryyoshka Café" },
```

---

## Op 6 — `src/data/sectors.js` · CR-241 — FAQ answer (cafes)

**Find (exact):**
```js
      { q: "Do I need special hardware?", a: "No — MyGenie runs on regular phones and tablets. Many cafés go live in under 48 hours.", media: { type: "video", src: null, caption: "MyGenie running on a normal phone" }, links: [{ label: "Build your plan", to: "/pricing" }] },
```

**Replace with:**
```js
      { q: "Do I need special hardware?", a: "No — MyGenie runs on regular phones and tablets. Many cafés go live in under 24 hours.", media: { type: "video", src: null, caption: "MyGenie running on a normal phone" }, links: [{ label: "Build your plan", to: "/pricing" }] },
```

---

## Op 7 — `src/data/sectors.js` · CR-241 — testimonial (bakeries, second instance)

**Find (exact):**
```js
      { metric: "₹50,000+", headline: "saved on setup, live in 48 hours", quote: "MyGenie's mobile-first solution saved us over ₹50,000 upfront and let us go live in under 48 hours.", client: "Matryyoshka Café" },
```
*(line ~316 — identical string, different sector. Use `replace_all: true` to catch both in one op if tool supports, otherwise two separate ops)*

**Already handled by Op 5 if `replace_all: true` is used. Otherwise this is a standalone op targeting L316.**

---

## Op 8 — `src/data/stories.js` · CR-241

**Find (exact):**
```js
  { client: "Matryyoshka Café", sector: "Cafés", img: "/brand/matroshka-logo.webp", metric: "₹50,000+", headline: "saved on setup, live in 48 hours", quote: "MyGenie's mobile-first solution saved us over ₹50,000 upfront and let us go live in under 48 hours." },
```

**Replace with:**
```js
  { client: "Matryyoshka Café", sector: "Cafés", img: "/brand/matroshka-logo.webp", metric: "₹50,000+", headline: "saved on setup, live in 24 hours", quote: "MyGenie's mobile-first solution saved us over ₹50,000 upfront and let us go live in under 24 hours." },
```

---

## Op 9 — `src/pages/About.jsx` · CR-241

**Find (exact):**
```js
                  {["Mobile-first — go live in under 48 hours", "Works offline, syncs automatically", "One OS for billing, kitchen, rooms and customers"].map((b) => (
```

**Replace with:**
```js
                  {["Mobile-first — go live in under 24 hours", "Works offline, syncs automatically", "One OS for billing, kitchen, rooms and customers"].map((b) => (
```

---

## Op 10 — `src/pages/Resources.jsx` · CR-241

**Find (exact):**
```js
    a: "No. MyGenie is mobile-first and runs on regular phones and tablets. Many outlets go live in under 48 hours, and one café cut fixed costs 40% running on just 3 devices.",
```

**Replace with:**
```js
    a: "No. MyGenie is mobile-first and runs on regular phones and tablets. Many outlets go live in under 24 hours, and one café cut fixed costs 40% running on just 3 devices.",
```

---

## Op 11 — `src/pages/CloudKitchenPos.jsx` · CR-241 (JSON-LD)

**Find (exact):**
```js
      acceptedAnswer: { "@type": "Answer", text: "Most cloud kitchens go live within 48 hours. Menu setup, aggregator integration, and staff training are handled by MyGenie's onboarding team." } },
```

**Replace with:**
```js
      acceptedAnswer: { "@type": "Answer", text: "Most cloud kitchens go live within 24 hours. Menu setup, aggregator integration, and staff training are handled by MyGenie's onboarding team." } },
```

---

## Op 12 — `src/pages/CloudKitchenPos.jsx` · CR-241 (FAQ)

**Find (exact):**
```js
    { q: "How fast is setup for a new cloud kitchen?", a: "Most go live within 48 hours. Onboarding covers menu setup, aggregator integration, and staff training.", testid: "ck-faq-setup" },
```

**Replace with:**
```js
    { q: "How fast is setup for a new cloud kitchen?", a: "Most go live within 24 hours. Onboarding covers menu setup, aggregator integration, and staff training.", testid: "ck-faq-setup" },
```

---

## Op 13 — `src/pages/RestaurantPosSystem.jsx` · CR-241 (JSON-LD)

**Find (exact):**
```js
      acceptedAnswer: { "@type": "Answer", text: "Most restaurants are live within 48 hours. MyGenie's onboarding team sets up your menu, tables, and integrations. No IT team or hardware installation required." } },
```

**Replace with:**
```js
      acceptedAnswer: { "@type": "Answer", text: "Most restaurants are live within 24 hours. MyGenie's onboarding team sets up your menu, tables, and integrations. No IT team or hardware installation required." } },
```

---

## Op 14 — `src/pages/RestaurantPosSystem.jsx` · CR-241 (FAQ)

**Find (exact):**
```js
    { q: "How fast is setup?", a: "Most restaurants are live within 48 hours. Onboarding covers menu setup, tables, and integrations.", testid: "pos-faq-setup" },
```

**Replace with:**
```js
    { q: "How fast is setup?", a: "Most restaurants are live within 24 hours. Onboarding covers menu setup, tables, and integrations.", testid: "pos-faq-setup" },
```

---

## Op 15 — `src/pages/RestaurantPosSystem.jsx` · CR-241 (stat card)

**Find (exact):**
```js
                  {[{ val: "48hr", label: "average setup" }, { val: "₹0", label: "hardware required" }, { val: "22%", label: "more revenue/shift" }].map(({ val, label }) => (
```

**Replace with:**
```js
                  {[{ val: "24hr", label: "average setup" }, { val: "₹0", label: "hardware required" }, { val: "22%", label: "more revenue/shift" }].map(({ val, label }) => (
```

---

## Op 16 — `src/pages/RestaurantManagementSoftware.jsx` · CR-240 (meta desc)

**Find (exact):**
```
        description="One platform to manage restaurant orders, staff, inventory and reporting. Used across 100+ Indian cities. Book a free demo — see it live for your outlet."
```

**Replace with:**
```
        description="One platform to manage restaurant orders, staff, inventory and reporting. Used across 75 Indian cities. Book a free demo — see it live for your outlet."
```

---

## Op 17 — `src/pages/RestaurantPosComparison.jsx` · CR-240 (trust strip)

**Find (exact):**
```js
                  {["No contracts, no lock-in", "Free migration support", "100+ cities across India", "GST compliant"].map(t => (
```

**Replace with:**
```js
                  {["No contracts, no lock-in", "Free migration support", "75 cities across India", "GST compliant"].map(t => (
```

---

## Op 18 — `src/pages/RestaurantPosComparison.jsx` · CR-240 (stat card val)

**Find (exact):**
```js
                  { val: "100+",    label: "cities across India",                  color: "text-brand-green" },
```

**Replace with:**
```js
                  { val: "75",      label: "cities across India",                  color: "text-brand-green" },
```

---

## Op 19 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (JSON-LD FAQ 1)

**Find (exact):**
```js
      acceptedAnswer: { "@type": "Answer", text: "MyGenie is a hospitality operating system that includes billing, inventory, CRM, AI insights, and loyalty in a single plan starting at ₹799/outlet/month. Posist (now Restroworks) is an enterprise POS targeted at large chains, with pricing typically starting higher and most advanced features available as paid add-ons. MyGenie also offers free data migration with go-live in 48 hours." } },
```

**Replace with:**
```js
      acceptedAnswer: { "@type": "Answer", text: "MyGenie is a hospitality operating system that includes billing, inventory, CRM, AI insights, and loyalty in a single plan starting at ₹799/outlet/month. Posist (now Restroworks) is an enterprise POS targeted at large chains, with pricing typically starting higher and most advanced features available as paid add-ons. MyGenie also offers free data migration with go-live in 24 hours." } },
```

---

## Op 20 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (JSON-LD FAQ 2)

**Find (exact):**
```js
      acceptedAnswer: { "@type": "Answer", text: "With MyGenie's migration support, most restaurants are fully live within 48 hours. The MyGenie onboarding team migrates your menu, inventory, and customer data — no manual re-entry required. Staff training is included and typically takes 2–3 hours." } },
```

**Replace with:**
```js
      acceptedAnswer: { "@type": "Answer", text: "With MyGenie's migration support, most restaurants are fully live within 24 hours. The MyGenie onboarding team migrates your menu, inventory, and customer data — no manual re-entry required. Staff training is included and typically takes 2–3 hours." } },
```

---

## Op 21 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (comparison table Switch Timeline)

**Find (exact):**
```js
  { feature: "Switch Timeline",     sub: null,                 mg: "48 hours",     posist: "[VERIFY]",   gofrugal: "[VERIFY]", billberry: "[VERIFY]" },
```

**Replace with:**
```js
  { feature: "Switch Timeline",     sub: null,                 mg: "24 hours",     posist: "[VERIFY]",   gofrugal: "[VERIFY]", billberry: "[VERIFY]" },
```

---

## Op 22 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (FAQ data — Posist diff)

**Find (exact):**
```js
  { q: "What is the difference between MyGenie and Posist?",       a: "MyGenie is a hospitality operating system starting at ₹799/outlet/month that includes billing, inventory, CRM, AI insights, and loyalty in one plan. Posist (now Restroworks) targets large chains with pricing starting higher — most advanced features are paid add-ons. MyGenie also includes free data migration with 48-hour go-live.", testid: "comparison-faq-posist" },
```

**Replace with:**
```js
  { q: "What is the difference between MyGenie and Posist?",       a: "MyGenie is a hospitality operating system starting at ₹799/outlet/month that includes billing, inventory, CRM, AI insights, and loyalty in one plan. Posist (now Restroworks) targets large chains with pricing starting higher — most advanced features are paid add-ons. MyGenie also includes free data migration with 24-hour go-live.", testid: "comparison-faq-posist" },
```

---

## Op 23 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (FAQ data — migration)

**Find (exact):**
```js
  { q: "How long does switching restaurant POS systems take?",      a: "With MyGenie's migration support, most restaurants are fully live within 48 hours. Our onboarding team migrates your menu, inventory, and customer data — no manual re-entry. Staff training is included and takes 2–3 hours.", testid: "comparison-faq-migration" },
```

**Replace with:**
```js
  { q: "How long does switching restaurant POS systems take?",      a: "With MyGenie's migration support, most restaurants are fully live within 24 hours. Our onboarding team migrates your menu, inventory, and customer data — no manual re-entry. Staff training is included and takes 2–3 hours.", testid: "comparison-faq-migration" },
```

---

## Op 24 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (meta desc)

**Find (exact):**
```
        description="Switch restaurant POS without downtime. Compare MyGenie vs Posist, GoFrugal, Billberry — features, price, migration. Free demo, go live in 48 hrs."
```

**Replace with:**
```
        description="Switch restaurant POS without downtime. Compare MyGenie vs Posist, GoFrugal, Billberry — features, price, migration. Free demo, go live in 24 hrs."
```

---

## Op 25 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (hero body copy)

**Find (exact):**
```
                  Outgrown your current POS? MyGenie gives you AI insights, inventory, CRM, and billing — starting at ₹799/month per outlet. Switch in under 48 hours with free data migration.
```

**Replace with:**
```
                  Outgrown your current POS? MyGenie gives you AI insights, inventory, CRM, and billing — starting at ₹799/month per outlet. Switch in under 24 hours with free data migration.
```

---

## Op 26 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (stat card)

**Find (exact):**
```js
                  { val: "48 hrs",  label: "from sign-up to first bill",          color: "text-brand-green" },
```

**Replace with:**
```js
                  { val: "24 hrs",  label: "from sign-up to first bill",          color: "text-brand-green" },
```

---

## Op 27 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (migration stat card)

**Find (exact):**
```js
                { val: "48 hrs", label: "Migration" },
```

**Replace with:**
```js
                { val: "24 hrs", label: "Migration" },
```

---

## Op 28 — `src/pages/RestaurantPosComparison.jsx` · CR-241 (feature list)

**Find (exact):**
```js
                  { title: "Go live in 48 hours",          sub: "Full migration included for all plans" },
```

**Replace with:**
```js
                  { title: "Go live in 24 hours",          sub: "Full migration included for all plans" },
```

---

## Op 29 — `src/pages/QsrPosSystem.jsx` · CR-239 (eyebrow)

**Find (exact):**
```jsx
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Starting at ₹4,000/year</span>
```

**Replace with:**
```jsx
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Starting at ₹799/outlet/month · billed annually</span>
```

---

## Op 30 — `src/pages/QsrPosSystem.jsx` · CR-239 (footer line)

**Find (exact):**
```jsx
        <p className="text-xs text-brand-muted text-center mt-8">Starting at ₹4,000/year · No hardware required · Cancel anytime</p>
```

**Replace with:**
```jsx
        <p className="text-xs text-brand-muted text-center mt-8">Starting at ₹799/outlet/month · billed annually · No hardware required · Cancel anytime</p>
```

---

## Op 31 — `src/pages/QsrPosSystem.jsx` · CR-244 (hero sub — add "fast food")

**Find (exact):**
```jsx
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="qsr-lp-sub">
                  Take counter orders, fire to kitchen display, print bills, and track inventory — all from one app. Built for QSR speed.
                </p>
```

**Replace with:**
```jsx
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="qsr-lp-sub">
                  Take counter orders, fire to kitchen display, print bills, and track inventory — all from one app. Built for fast food and quick service restaurant speed.
                </p>
```

---

## Op 32 — `src/pages/QsrPosSystem.jsx` · CR-244 (add Swiggy/Zomato "WORKS WITH" strip in hero)

**Find (exact):**
```jsx
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={openModal} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="qsr-lp-cta-primary">
                    Book a Free QSR Demo <ArrowRight className="w-5 h-5" />
                  </button>
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="qsr-lp-cta-secondary">
                    See Pricing ↓
                  </a>
                </div>
              </div>
              <img src="/brand/banner.webp"
```

**Replace with:**
```jsx
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={openModal} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="qsr-lp-cta-primary">
                    Book a Free QSR Demo <ArrowRight className="w-5 h-5" />
                  </button>
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="qsr-lp-cta-secondary">
                    See Pricing ↓
                  </a>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="qsr-lp-works-with">
                  <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide mr-1">Works with</span>
                  <span className="inline-flex items-center gap-1.5 bg-white border border-brand-line rounded-lg px-2.5 py-1.5 shadow-sm">
                    <img src="/brand/integrations/swiggy.svg" alt="Swiggy" width={14} height={14} />
                    <span className="text-xs font-bold" style={{ color: "#FC8019" }}>Swiggy</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white border border-brand-line rounded-lg px-2.5 py-1.5 shadow-sm">
                    <img src="/brand/integrations/zomato.svg" alt="Zomato" width={14} height={14} />
                    <span className="text-xs font-bold" style={{ color: "#E23744" }}>Zomato</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white border border-brand-line rounded-lg px-2.5 py-1.5 shadow-sm">
                    <img src="/brand/integrations/razorpay.svg" alt="Razorpay" width={14} height={14} />
                    <span className="text-xs font-bold" style={{ color: "#3395FF" }}>Razorpay</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-2.5 py-1.5">
                    <span className="text-xs font-bold text-[#15803d]">GST-ready</span>
                  </span>
                </div>
              </div>
              <img src="/brand/banner.webp"
```

**What changed:** "WORKS WITH" strip added after CTA buttons, identical pattern to `Hero.jsx` L80–99. Uses existing SVG assets. No new imports needed.

---

## Op 33 — `src/pages/RestaurantManagementSoftware.jsx` · CR-243 (new ordering section)

**Find (exact):**
```jsx
        {/* ── Built for India — critical section ── */}
        <section className="bg-brand-deep py-20 sm:py-24" data-testid="mgmt-lp-india">
```

**Replace with:**
```jsx
        {/* ── Take Orders — ordering app section ── */}
        <section className="bg-brand-sand py-20 sm:py-24" data-testid="mgmt-lp-ordering">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-5">Captain App & Ordering</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-5">Take orders on any phone — ordering app built in</h2>
              <p className="text-lg text-brand-muted leading-relaxed mb-8 max-w-2xl">Every waiter's phone becomes an order terminal. The Captain ordering app lets staff take orders tableside and fires them straight to the kitchen display — no paper KOTs, no shouting across the pass.</p>
              <div className="flex flex-wrap gap-3">
                {["Take orders from any table on any device", "Orders fire to KDS the moment they're placed", "Multiple waiters, one table — no double orders"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 bg-white border border-brand-line rounded-full px-4 py-2 text-sm font-medium text-brand-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Built for India — critical section ── */}
        <section className="bg-brand-deep py-20 sm:py-24" data-testid="mgmt-lp-india">
```

**What changed:** New section inserted between `mgmt-lp-problem` and `mgmt-lp-india`. Uses `bg-brand-sand` (same as hero) to visually break the dark `bg-brand-deep` section below. `Reveal` wrapper consistent with rest of page. 3 feature chips in green-dot style.

---

## Op 34 — `src/pages/PetpoojaAlternative.jsx` · CR-246 (footnote below comparison table)

**Find (exact):**
```jsx
        </Reveal>
      </div>
    </section>
  );
}

// ─── S3 — PROOF WALL ──────────────────────────────────────────────────────────
```

**Replace with:**
```jsx
        <p className="text-xs text-[#5B7A68] mt-4 text-center" data-testid="vsp-comparison-footnote">
          Pricing and features based on Petpooja's publicly listed information as of Sep 2026. Petpooja does not publicly display INR pricing — confirm current plans at petpooja.com.
        </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── S3 — PROOF WALL ──────────────────────────────────────────────────────────
```

**What changed:** `<p>` footnote inserted inside `VspPhilosophy`, after the Reveal block (table + expand button), before the section close. Styled `text-xs text-[#5B7A68]` — matches the `"Six features. One table..."` intro line above the table.

---

## Post-implementation verification checklist

```bash
# 1. No ₹4,000 remains on QSR page
grep '4,000' /app/frontend/src/pages/QsrPosSystem.jsx
# Expected: no output

# 2. No 48hr in any touched file (except Petpooja migration FAQ which was intentionally kept)
grep -rn '48 hour\|48hr\|48 hrs' \
  /app/frontend/src/pages/About.jsx \
  /app/frontend/src/pages/RestaurantPosComparison.jsx \
  /app/frontend/src/pages/RestaurantPosSystem.jsx \
  /app/frontend/src/pages/Resources.jsx \
  /app/frontend/src/pages/CloudKitchenPos.jsx \
  /app/frontend/src/data/sectors.js \
  /app/frontend/src/data/stories.js
# Expected: no output

# 3. No 100+ cities remains in RestaurantManagementSoftware or RestaurantPosComparison
grep '100+.*cit\|cit.*100+' \
  /app/frontend/src/pages/RestaurantManagementSoftware.jsx \
  /app/frontend/src/pages/RestaurantPosComparison.jsx
# Expected: no output

# 4. "take orders" appears on sell-serve page
grep 'take orders\|ordering app' /app/frontend/src/data/products.js
# Expected: 2 matches in sell-serve entry

# 5. "fast food" appears in QSR hero sub (not just FAQ/JSON-LD)
grep -n 'fast food' /app/frontend/src/pages/QsrPosSystem.jsx
# Expected: at least 1 hit on qsr-lp-sub paragraph

# 6. Petpooja "1.5 lakh" sentence in vsp.js
grep '1.5 lakh' /app/frontend/src/data/vsp.js
# Expected: 1 match in variant_a_sub

# 7. Terminal row no longer shows price
grep 'Terminal ₹' /app/frontend/src/data/vsp.js
# Expected: no output

# 8. Footnote in built HTML
grep 'Petpooja.*Sep 2026\|Sep 2026.*Petpooja' /app/frontend/build/petpooja-alternative/index.html
# Expected: 1 match (post-build only)
```

---

## Build + restart

```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

Build time: ~2 min (pre-renders 65 routes).

---

## Summary

| Pass | Ops | Files | CRs |
|---|---|---|---|
| Data files | Ops 1–8 | products.js, vsp.js, sectors.js, stories.js | CR-241, CR-242, CR-245, CR-246 (c3) |
| Page strings | Ops 9–28 | About, Resources, CloudKitchenPos, RestaurantPosSystem, RestaurantManagementSoftware, RestaurantPosComparison, QsrPosSystem | CR-239, CR-240, CR-241 |
| JSX additions | Ops 29–34 | QsrPosSystem, RestaurantManagementSoftware, PetpoojaAlternative | CR-243, CR-244, CR-246 |
| Build | 1 | — | all |

**34 ops · 12 files · 1 rebuild. Say "implement" to proceed.**
