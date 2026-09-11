# CR-85 — Line-By-Line Implementation Plan
# `/restaurant-billing-software` — Dedicated Billing Software LP

**Date:** 2026-08-25  
**Estimated total lines:** ~520  
**Pattern source:** `PetpoojaAlternative.jsx` (LandingNavbar/Footer, Pricing, DemoForm), `DemoLanding.jsx` (hero layout)

---

## FILES TO CHANGE — ORDERED

| # | File | Operation | Lines changed |
|---|------|-----------|--------------|
| 1 | `frontend/src/pages/RestaurantBillingSoftware.jsx` | **CREATE** (new file) | ~520 |
| 2 | `frontend/src/App.js` | **EDIT** — lazy import + route | +2 lines |
| 3 | `frontend/public/sitemap.xml` | **EDIT** — add URL entry | +4 lines |
| 4 | `frontend/src/lib/seo.js` | **EDIT** — add PAGE_SEO entry | +5 lines |

---

## FILE 1 — `frontend/src/pages/RestaurantBillingSoftware.jsx`

### Block 1 — Imports (Lines 1–18)

```
L1   import { useState } from "react";
L2   import { ArrowRight, Check, ChevronDown, ChevronUp } from "lucide-react";
L3   import { Link } from "react-router-dom";
L4   import DemoForm from "@/components/site/DemoForm";
L5   import Reveal from "@/components/site/Reveal";
L6   import Seo from "@/components/site/Seo";
L7   import FaqItem from "@/components/site/FaqItem";
L8   import Logo from "@/components/site/Logo";
L9   import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
L10  import { COMPANY } from "@/data/company";
L11  (blank)
L12  // ─── FAQ JSON-LD ─────────────────────────────────────────────────────────
```

### Block 2 — FAQ_SCHEMA constant (Lines 12–35)

Schema type: `FAQPage`. 4 Q&A pairs.  
Copy pattern exactly from `SectorPage.jsx` FAQ JSON-LD.

```
L13  const FAQ_SCHEMA = {
L14    "@context": "https://schema.org",
L15    "@type": "FAQPage",
L16    mainEntity: [
L17      {
L18        "@type": "Question",
L19        name: "Is the restaurant billing software GST-compliant?",
L20        acceptedAnswer: { "@type": "Answer",
L21          text: "Yes — MyGenie auto-calculates GST, prints GSTIN on every bill, and generates GSTR-1 compatible reports. No manual GST calculation required."
L22        }
L23      },
L24      {
L25        "@type": "Question",
L26        name: "Does it work offline?",
L27        acceptedAnswer: { "@type": "Answer",
L28          text: "Yes. MyGenie works offline for billing, KOT, and order management. Data syncs automatically when connection is restored."
L29        }
L30      },
L31      {
L32        "@type": "Question",
L33        name: "Can I use the same billing software for my cafe AND restaurant?",
L34        acceptedAnswer: { "@type": "Answer",
L35          text: "Yes. MyGenie supports dine-in, takeaway, delivery, QSR, cafe and full-service formats — all from one account."
L36        }
L37      },
L38      {
L39        "@type": "Question",
L40        name: "How fast is billing?",
L41        acceptedAnswer: { "@type": "Answer",
L42          text: "A full table bill takes under 8 seconds on MyGenie. Counter billing is faster. No rekeying, no manual GST, no calculator needed."
L43        }
L44      },
L45    ],
L46  };
```

### Block 3 — LandingNavbar component (Lines 48–63)

Copy structure exactly from `PetpoojaAlternative.jsx` lines 323–338.  
No QuickBook button (simpler version — logo only, same as `DemoLanding.jsx` lines 13–21).

```
L48  // ─── LandingNavbar ───────────────────────────────────────────────────────
L49  function LandingNavbar() {
L50    return (
L51      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md
L52                         shadow-[0_2px_20px_rgba(0,0,0,0.05)]"
L53               data-testid="billing-lp-navbar">
L54        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px]
L55                         flex items-center justify-between">
L56          <Logo />
L57          <a href="#lp-demo"
L58             className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold
L59                        rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5
L60                        shadow-[0_4px_14px_rgba(16,184,129,0.3)]"
L61             data-testid="billing-lp-navbar-cta">
L62            Book Free Demo
L63          </a>
L64        </div>
L65      </header>
L66    );
L67  }
```

### Block 4 — LandingFooter component (Lines 69–83)

Copy exactly from `PetpoojaAlternative.jsx` lines 341–355.  
Change `data-testid` prefix to `"billing-lp-footer"`.

```
L69  // ─── LandingFooter ───────────────────────────────────────────────────────
L70  function LandingFooter() {
L71    return (
L72      <footer className="bg-brand-deep border-t border-[#1e4a2e]"
L73               data-testid="billing-lp-footer">
L74        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4
L75                        flex flex-col sm:flex-row items-center justify-between gap-3">
L76          <Logo light />
L77          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
L78            <a href={`tel:${COMPANY.phoneIntl}`} ... data-testid="billing-lp-footer-phone">{COMPANY.phone}</a>
L79            <Link to="/privacy" ... data-testid="billing-lp-footer-privacy">Privacy Policy</Link>
L80          </div>
L81          <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
L82        </div>
L83      </footer>
L84    );
L85  }
```

### Block 5 — Hero section (Lines 87–165)

Layout: 2-column grid on lg (left: copy + CTAs, right: product image).  
Pattern: `DemoLanding.jsx` L84 hero grid / `PetpoojaAlternative.jsx` VspHero pattern.

```
L87   // ─── S1 — Hero ──────────────────────────────────────────────────────────
L88   function LpHero() {
L89     return (
L90       <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden"
L91                data-testid="billing-lp-hero">
L92         {/* Background blur circle */}
L93         <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full
L94                          bg-brand-green/10 blur-3xl pointer-events-none" />
L95
L96         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
L97           <div className="grid lg:grid-cols-2 gap-12 items-center">
L98
L99             {/* ── Left: copy ── */}
L100            <div>
L101              {/* Eyebrow */}
L102              <span className="inline-block bg-brand-green/10 text-brand-green text-xs font-bold
L103                               px-3 py-1 rounded-full mb-5 uppercase tracking-widest"
L104                    data-testid="billing-lp-eyebrow">
L105                Restaurant Billing Software
L106              </span>
L107
L108              {/* H1 — exact copy */}
L109              <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-ink
L110                             leading-[1.1] tracking-tight mb-5"
L111                  data-testid="billing-lp-h1">
L112                Restaurant billing software — bill in seconds, no errors, fully GST-ready.
L113              </h1>
L114
L115              {/* Sub-headline */}
L116              <p className="text-lg text-brand-muted leading-relaxed mb-8"
L117                 data-testid="billing-lp-sub">
L118                Built for restaurants, cafes, and bars. Takes orders, prints bills, files GST — on any phone or tablet.
L119              </p>
L120
L121              {/* Stat chips */}
L122              <div className="flex gap-3 mb-8">
L123                {[
L124                  { val: "8 sec", label: "avg bill time" },
L125                  { val: "GST", label: "auto-calculated" },
L126                  { val: "0", label: "billing machines needed" },
L127                ].map(({ val, label }) => (
L128                  <div key={val} className="flex-1 bg-white border border-brand-line
L129                                            rounded-2xl px-3 py-3 text-center">
L130                    <div className="font-display text-xl font-bold text-brand-green">{val}</div>
L131                    <div className="text-[11px] text-brand-muted mt-1 leading-tight">{label}</div>
L132                  </div>
L133                ))}
L134              </div>
L135
L136              {/* CTA row */}
L137              <div className="flex flex-wrap gap-3">
L138                <a href="#lp-demo"
L139                   className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark
L140                              text-white rounded-full px-7 py-4 font-semibold transition-all
L141                              hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]"
L142                   data-testid="billing-lp-cta-primary">
L143                  Book a Free Demo <ArrowRight className="w-5 h-5" />
L144                </a>
L145                <a href="#lp-pricing"
L146                   className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold
L147                              border-2 border-brand-orange/40 text-brand-orange
L148                              hover:bg-brand-orange hover:text-white hover:border-brand-orange
L149                              transition-all"
L150                   data-testid="billing-lp-cta-secondary">
L151                  See Pricing ↓
L152                </a>
L153              </div>
L154            </div>
L155
L156            {/* ── Right: product image ── */}
L157            <Reveal>
L158              <img
L159                src="/brand/banner.webp"
L160                alt="MyGenie restaurant billing software interface"
L161                width={776} height={637}
L162                className="w-full h-auto object-contain rounded-3xl"
L163                loading="eager"
L164                data-testid="billing-lp-hero-image"
L165              />
L166            </Reveal>
L167          </div>
L168        </div>
L169      </section>
L170    );
L171  }
```

### Block 6 — TrustBand / Social proof strip (Lines 173–205)

Import `TrustBand` from `@/components/home/TrustBand`.  
Use the existing TrustBand component — just render `<TrustBand />`.

```
L173  // ─── S2 — Trust strip ────────────────────────────────────────────────────
L174  // Reuse the existing TrustBand component directly — no custom code needed.
```

*Note: Import `TrustBand` in Block 1 if not already there.*

### Block 7 — Features: GST Billing (Lines 207–270)

Feature card section. 2-column on lg (icon left, copy right).

```
L207  // ─── S3 — Feature: GST Billing ───────────────────────────────────────────
L208  function LpFeatureGst() { ... }
```

Key copy:
- Section eyebrow: `"GST-Ready Billing"`
- H2: `"Restaurant billing software that handles GST automatically"`
- Body: "Auto GST calculation on every bill. GSTIN on receipts. GSTR-1 compatible reports — export in one click."
- Stats row: `"GSTR-1 compatible"` · `"Auto GST calc"` · `"Offline mode"`
- `data-testid="billing-lp-gst-section"`

### Block 8 — Feature: Cafes + Restaurants (Lines 272–320)

- H2: `"Works for restaurants AND cafes — same software, any format"`
- Body: "Dine-in table billing. Takeaway counter. Swiggy/Zomato delivery. QSR prepaid tokens. All from one app."
- Icon grid: `Dine-in` · `Takeaway` · `Delivery` · `QSR`
- `data-testid="billing-lp-cafe-section"`

### Block 9 — Feature: KOT (Lines 322–365)

- H2: `"KOT software built in — no extra hardware"`
- Body: "Take the order on the floor, fire it to the kitchen instantly. No paper tickets, no shouting across the pass."
- `data-testid="billing-lp-kot-section"`

### Block 10 — Feature: No billing machine (Lines 367–410)

- H2: `"No billing machine needed — use your phone or tablet"`
- Body: "Your existing Android phone or tablet becomes the billing terminal. No ₹30,000 POS machine, no per-device licensing, no downtime if hardware breaks."
- Emphasis box: `"Works on Android phone, tablet, or any browser — no hardware purchase required."`
- `data-testid="billing-lp-no-hardware-section"`

### Block 11 — Inline Pricing section (Lines 412–495)

Copy the plan array + card render pattern EXACTLY from `PetpoojaAlternative.jsx` lines 820–908.

Key differences from VSP version:
- Section `id="lp-pricing"` (not `data-testid="vsp-pricing"` alone — both)
- H2: `"Simple pricing — nothing to hide"`
- Plan CTA buttons: `href="#lp-demo"` (not `#vsp-demo`)
- `data-testid="billing-lp-pricing"`
- Each card: `data-testid="billing-plan-{starter|growth|pro}"`

```
L412  // ─── S7 — Inline Pricing ─────────────────────────────────────────────────
L413  function LpPricing() {
L414    const plans = [
L415      {
L416        name: "Starter", price: "₹799",
L417        billing: "per outlet/mo · billed annually",
L418        feats: ["Billing & POS", "KOT to kitchen", "Daily sales report", "Owner dashboard", "Offline mode"],
L419        pop: false,
L420      },
L421      {
L422        name: "Growth", price: "₹1,499",
L423        billing: "per outlet/mo · billed annually",
L424        feats: ["Everything in Starter", "Captain App", "KDS", "Online ordering", "CRM + loyalty basics"],
L425        pop: true,
L426      },
L427      {
L428        name: "Pro", price: "₹2,499",
L429        billing: "per outlet/mo · billed annually",
L430        feats: ["Everything in Growth", "Multi-outlet dashboard", "Loyalty + wallet", "WhatsApp automation", "All AI features"],
L431        pop: false,
L432      },
L433    ];
L434
L435    return (
L436      <section id="lp-pricing" className="bg-white py-20 sm:py-28 scroll-mt-20"
L437               data-testid="billing-lp-pricing">
L438        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
L439          <Reveal>
L440            <div className="mb-12">
L441              <span className="inline-block text-xs font-semibold uppercase tracking-widest
L442                               text-brand-green mb-4">Nothing to hide</span>
L443              <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-ink
L444                             leading-[1.1] tracking-tight">Simple pricing.</h2>
L445            </div>
L446          </Reveal>
L447
L448          <div className="grid sm:grid-cols-3 gap-6">
L449            {plans.map((plan, i) => (
L450              <Reveal key={plan.name} delay={i * 0.08}>
L451                <div className={`border rounded-3xl p-8 relative
L452                                  ${plan.pop ? "border-brand-green shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
L453                                            : "border-brand-line"}`}
L454                     data-testid={`billing-plan-${plan.name.toLowerCase()}`}>
L455                  {plan.pop && (
L456                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white
L457                                     text-[9px] font-bold px-4 py-1 rounded-full tracking-widest
L458                                     uppercase whitespace-nowrap">
L459                      Most Popular
L460                    </span>
L461                  )}
L462                  <div className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-2">{plan.name}</div>
L463                  <div className="font-display text-5xl font-bold text-brand-ink leading-none mb-1">
L464                    {plan.price}<span className="text-sm font-normal text-brand-muted font-sans">/outlet/mo</span>
L465                  </div>
L466                  <div className="text-xs text-brand-muted mb-6">{plan.billing}</div>
L467                  <ul className="space-y-2.5 mb-7">
L468                    {plan.feats.map(f => (
L469                      <li key={f} className="flex items-start gap-2 text-sm text-brand-ink">
L470                        <Check className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" strokeWidth={3} />
L471                        {f}
L472                      </li>
L473                    ))}
L474                  </ul>
L475                  <a href="#lp-demo"
L476                     className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all
L477                                  ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white"
L478                                            : "border border-brand-green text-brand-green hover:bg-brand-green/8"}`}
L479                     data-testid={`billing-plan-cta-${plan.name.toLowerCase()}`}>
L480                    Get Started
L481                  </a>
L482                </div>
L483              </Reveal>
L484            ))}
L485          </div>
L486
L487          <p className="text-xs text-brand-muted text-center mt-8">
L488            No hidden fees · Cancel anytime · Annual billing
L489          </p>
L490        </div>
L491      </section>
L492    );
L493  }
```

### Block 12 — FAQ section (Lines 495–540)

Use `FaqItem` component. 4 questions from FAQ_SCHEMA.  
Section carries `FAQPage JSON-LD` via `<Seo jsonLd>` (pass into top-level Seo component).

```
L495  // ─── S8 — FAQ ────────────────────────────────────────────────────────────
L496  function LpFaq() {
L497    const faqs = [
L498      { q: "Is the restaurant billing software GST-compliant?",
L499        a: "Yes — MyGenie auto-calculates GST, prints GSTIN on every bill, and generates GSTR-1 compatible reports.",
L500        testid: "billing-faq-gst" },
L501      { q: "Does it work offline?",
L502        a: "Yes. Billing, KOT, and order management work offline. Data syncs when connection restores.",
L503        testid: "billing-faq-offline" },
L504      { q: "Can I use it for my cafe AND restaurant?",
L505        a: "Yes. Same software handles dine-in, takeaway, delivery, QSR and cafe formats from one account.",
L506        testid: "billing-faq-formats" },
L507      { q: "How fast is billing?",
L508        a: "A full table bill takes under 8 seconds. Counter billing is faster.",
L509        testid: "billing-faq-speed" },
L510    ];
L511
L512    return (
L513      <section className="bg-brand-sand py-16 sm:py-24" data-testid="billing-lp-faq">
L514        <div className="max-w-3xl mx-auto px-4 sm:px-6">
L515          <Reveal>
L516            <h2 className="font-display text-3xl font-bold text-brand-ink mb-10">
L517              Common questions
L518            </h2>
L519          </Reveal>
L520          <div className="divide-y divide-brand-line">
L521            {faqs.map(faq => (
L522              <FaqItem key={faq.q} q={faq.q} a={faq.a} testid={faq.testid} />
L523            ))}
L524          </div>
L525        </div>
L526      </section>
L527    );
L528  }
```

### Block 13 — Demo CTA section (Lines 530–510)

```
L530  // ─── S9 — Bottom Demo CTA ────────────────────────────────────────────────
L531  function LpDemoSection() {
L532    return (
L533      <section id="lp-demo" className="bg-brand-deep py-20 sm:py-28 scroll-mt-20"
L534               data-testid="billing-lp-demo">
L535        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
L536                         grid lg:grid-cols-2 gap-12 items-start">
L537          {/* Left: copy */}
L538          <div>
L539            <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5 block">
L540              Free · 45 min · No commitment
L541            </span>
L542            <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">
L543              Book a free 45-min billing software demo
L544            </h2>
L545            <p className="text-lg text-[#a3b8ac]">
L546              A specialist bills a live order on your outlet type — QSR, café, or full-service. No slides.
L547            </p>
L548          </div>
L549          {/* Right: DemoForm */}
L550          <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="billing-lp-form-wrap">
L551            <DemoForm sector="billing-software" shortForm />
L552          </div>
L553        </div>
L554      </section>
L555    );
L556  }
```

### Block 14 — Page shell + export (Lines 558–520)

```
L558  // ─── PAGE SHELL ──────────────────────────────────────────────────────────
L559  export default function RestaurantBillingSoftware() {
L560    return (
L561      <div className="bg-white" data-testid="billing-software-page">
L562        <Seo
L563          title="Restaurant Billing Software — GST-Ready | MyGenie POS"
L564          description="Fast, accurate billing for restaurants & cafes. GST-compliant, cloud-based, runs on any device. Bill in seconds — book a free demo."
L565          path="/restaurant-billing-software"
L566          jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
L567        />
L568        <LandingNavbar />
L569        <main className="pt-[72px]">
L570          <LpHero />
L571          <TrustBand />
L572          <LpFeatureGst />
L573          <LpFeatureCafe />
L574          <LpFeatureKot />
L575          <LpFeatureNoHardware />
L576          <LpPricing />
L577          <LpFaq />
L578          <LpDemoSection />
L579        </main>
L580        <LandingFooter />
L581      </div>
L582    );
L583  }
```

---

## FILE 2 — `frontend/src/App.js`

**Insert after line 22** (after `DemoLanding` import):

```js
// Line to add at L23 (shift existing L23 down):
const RestaurantBillingSoftware = lazy(() => import("@/pages/RestaurantBillingSoftware"));
```

**Insert after line 86** (after `/demo` route, before `/payment-success`):

```jsx
{/* CR-85 — Restaurant Billing Software LP (Google Ads, standalone) */}
<Route path="/restaurant-billing-software" element={<RestaurantBillingSoftware />} />
```

---

## FILE 3 — `frontend/public/sitemap.xml`

**Insert after the last `<url>` block** (before `</urlset>`):

```xml
  <url>
    <loc>https://www.mygenie.online/restaurant-billing-software</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
```

Prerender picks this up automatically (prerender.js reads sitemap.xml).

---

## FILE 4 — `frontend/src/lib/seo.js`

Add inside `PAGE_SEO` object (after last existing entry):

```js
"/restaurant-billing-software": {
  title: "Restaurant Billing Software — GST-Ready | MyGenie POS",
  description: "Fast, accurate billing for restaurants & cafes. GST-compliant, cloud-based, runs on any device. Bill in seconds — book a free demo.",
},
```

---

## Definition of Done checklist

- [ ] Page renders at `/restaurant-billing-software`
- [ ] H1 text is exactly "Restaurant billing software — bill in seconds, no errors, fully GST-ready."
- [ ] "GST" appears in H1 text
- [ ] `id="lp-pricing"` pricing section visible with 3 tiers
- [ ] Secondary CTA `href="#lp-pricing"` (NOT `to="/pricing"`)
- [ ] `id="lp-demo"` DemoForm section present — `sector="billing-software"`
- [ ] LandingNavbar visible (logo + "Book Free Demo" nav CTA only — no global Navbar)
- [ ] FAQPage JSON-LD present in `<head>`
- [ ] Route in `App.js`
- [ ] URL in `sitemap.xml`
- [ ] After `yarn build` + `node scripts/prerender.js` → `build/restaurant-billing-software/index.html` exists
- [ ] Structural gate check: title ≠ shell title, canonical = `/restaurant-billing-software`

*Plan written 2026-08-25.*
