import { ArrowRight, Check, RefreshCw, Building, Boxes, Bike } from "lucide-react";
import { Link } from "react-router-dom";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import FaqItem from "@/components/site/FaqItem";
import Logo from "@/components/site/Logo";
import TrustBand from "@/components/home/TrustBand";
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
import { COMPANY } from "@/data/company";

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Does it work with Swiggy, Zomato, and Magicpin?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Swiggy, Zomato, and Magicpin orders flow directly into MyGenie. No separate tablets per aggregator — all orders in one queue, one screen." } },
    { "@type": "Question", name: "Can I run multiple brands from one account?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie lets you run 2–5 dark kitchen brands from one backend. Each brand has its own menu and pricing. Shared inventory is managed centrally." } },
    { "@type": "Question", name: "Is the cloud kitchen billing software GST-compliant?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. GST is auto-calculated on every order. GSTIN on every bill. GSTR-1 compatible reports exportable in one click — for every brand separately." } },
    { "@type": "Question", name: "Do I need a billing machine or POS hardware?",
      acceptedAnswer: { "@type": "Answer", text: "No. MyGenie runs on any Android phone or tablet. Cloud kitchens run lean — a phone at the packing station is enough. No ₹30,000 POS machine required." } },
    { "@type": "Question", name: "How fast is setup for a new cloud kitchen?",
      acceptedAnswer: { "@type": "Answer", text: "Most cloud kitchens go live within 48 hours. Menu setup, aggregator integration, and staff training are handled by MyGenie's onboarding team." } },
  ],
};

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="ck-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <a href="#lp-demo" className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="ck-lp-navbar-cta">
          Book Free Demo
        </a>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="ck-lp-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="ck-lp-footer-phone">{COMPANY.phone}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="ck-lp-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}

const PLANS = [
  { name: "Starter", price: "₹799", billing: "per outlet/mo · billed annually", feats: ["Billing & POS", "KOT to kitchen", "Daily sales report", "Owner dashboard", "Offline mode"], pop: false },
  { name: "Growth",  price: "₹1,299", billing: "per outlet/mo · billed annually", feats: ["Everything in Starter", "Aggregator sync (Swiggy/Zomato)", "Multi-brand support", "KDS", "Central inventory"], pop: true },
  { name: "Pro",     price: "₹2,499", billing: "per outlet/mo · billed annually", feats: ["Everything in Growth", "Multi-outlet dashboard", "Loyalty + wallet", "WhatsApp automation", "All AI features"], pop: false },
];

function LpPricing() {
  return (
    <section id="lp-pricing" className="bg-brand-sand py-20 sm:py-28 scroll-mt-20" data-testid="ck-lp-pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Nothing to hide</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight">Simple pricing.</h2>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div className={`border rounded-3xl p-8 relative bg-white ${plan.pop ? "border-brand-green shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-brand-line"}`} data-testid={`ck-plan-${plan.name.toLowerCase()}`}>
                {plan.pop && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[9px] font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">Most Popular</span>}
                <div className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-2">{plan.name}</div>
                <div className="font-display text-5xl font-bold text-brand-ink leading-none mb-1">{plan.price}<span className="text-sm font-normal text-brand-muted font-sans">/outlet/mo</span></div>
                <div className="text-xs text-brand-muted mb-6">{plan.billing}</div>
                <ul className="space-y-2.5 mb-7">
                  {plan.feats.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-brand-ink">
                      <Check className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" strokeWidth={3} />{f}
                    </li>
                  ))}
                </ul>
                <a href="#lp-demo" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`ck-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </a>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-xs text-brand-muted text-center mt-8">No hidden fees · Cancel anytime · Annual billing</p>
      </div>
    </section>
  );
}

export default function CloudKitchenPos() {
  const features = [
    { icon: RefreshCw, title: "Aggregator sync", body: "Swiggy, Zomato, Magicpin — all orders in one queue.", testid: "ck-feature-aggregator" },
    { icon: Building, title: "Multi-brand billing", body: "2–5 brands from one backend. Separate menus, shared stock.", testid: "ck-feature-multibrand" },
    { icon: Boxes, title: "Central inventory", body: "Auto-deduct across all brands. Low-stock alerts.", testid: "ck-feature-inventory" },
    { icon: Bike, title: "Direct delivery", body: "Commission-free delivery link. Take orders without aggregators.", testid: "ck-feature-delivery" },
  ];

  const faqs = [
    { q: "Does it work with Swiggy, Zomato, and Magicpin?", a: "Yes. All aggregator orders flow into one screen. No separate tablets, no missed orders.", testid: "ck-faq-aggregators" },
    { q: "Can I run multiple brands from one account?", a: "Yes. Up to 5 dark kitchen brands from one backend. Own menu, shared inventory.", testid: "ck-faq-multibrand" },
    { q: "Is the cloud kitchen billing software GST-compliant?", a: "Yes. GST auto-calculated. GSTIN on every bill. GSTR-1 reports per brand in one click.", testid: "ck-faq-gst" },
    { q: "Do I need a billing machine or POS hardware?", a: "No. Any Android phone or tablet is the terminal. Cloud kitchens run lean — no hardware purchase needed.", testid: "ck-faq-hardware" },
    { q: "How fast is setup for a new cloud kitchen?", a: "Most go live within 48 hours. Onboarding covers menu setup, aggregator integration, and staff training.", testid: "ck-faq-setup" },
  ];

  return (
    <div className="bg-white" data-testid="cloud-kitchen-pos-page">
      <Seo
        title="Cloud Kitchen POS & Billing Software India | MyGenie"
        description="POS built for cloud kitchens — manage every brand, every aggregator, and all inventory from one screen. GST-ready. Book a free demo."
        path="/cloud-kitchen-pos"
        jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
      />
      <LandingNavbar />
      <main className="pt-[72px]">
        {/* ── Hero ── */}
        <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden" data-testid="ck-lp-hero">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-brand-green/10 text-brand-green text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest" data-testid="ck-lp-eyebrow">Cloud Kitchen POS & Billing Software</span>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-5" data-testid="ck-lp-h1">
                  Cloud kitchen POS & billing software — every brand, every aggregator, one screen.
                </h1>
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="ck-lp-sub">
                  Stop juggling Swiggy, Zomato and multiple brand tablets. MyGenie unifies ordering, billing, inventory and reports into one backend — built for cloud kitchen speed.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {[{ val: "₹0", label: "missed orders" }, { val: "1", label: "screen, all aggregators" }, { val: "40%", label: "lower fixed cost" }].map(({ val, label }) => (
                    <div key={val} className="flex-1 min-w-[80px] bg-white border border-brand-line rounded-2xl px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-brand-green">{val}</div>
                      <div className="text-[11px] text-brand-muted mt-1 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="#lp-demo" className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="ck-lp-cta-primary">
                    Book a Free Cloud Kitchen Demo <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="ck-lp-cta-secondary">
                    See Pricing ↓
                  </a>
                </div>
              </div>
              <img src="/brand/banner.webp" alt="MyGenie cloud kitchen POS and billing software dashboard" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="ck-lp-hero-image" />
            </div>
          </div>
        </section>

        <TrustBand />

        {/* ── Problem ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="ck-lp-problem">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-4">3 tablets for 3 aggregators. A printer that jams. A spreadsheet for stock.</h2>
              <p className="text-brand-muted leading-relaxed mb-6">You opened a cloud kitchen to stay lean. Then you ended up with more devices than a dine-in restaurant. MyGenie brings every aggregator and every brand onto one screen.</p>
              <div className="space-y-3">
                {["Swiggy tablet → replaced", "Zomato tablet → replaced", "Magicpin tablet → replaced", "Stock spreadsheet → replaced"].map(item => (
                  <div key={item} className="flex items-center gap-3 bg-brand-sand rounded-xl px-4 py-3">
                    <Check className="w-4 h-4 text-brand-green flex-shrink-0" strokeWidth={3} />
                    <span className="text-sm text-brand-ink">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-4">
                {features.map(f => (
                  <div key={f.title} className="border border-brand-line rounded-2xl p-5" data-testid={f.testid}>
                    <f.icon className="w-6 h-6 text-brand-green mb-3" />
                    <div className="font-display font-bold text-brand-ink text-sm mb-1">{f.title}</div>
                    <div className="text-xs text-brand-muted">{f.body}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Proof ── */}
        <section className="bg-brand-sand py-20 sm:py-24" data-testid="ck-lp-proof">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal><h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-10">What cloud kitchens say about MyGenie</h2></Reveal>
            <div className="grid sm:grid-cols-2 gap-6">
              <Reveal>
                <blockquote className="bg-white border border-brand-line rounded-3xl p-8" data-testid="ck-proof-lovebites">
                  <div className="font-display text-4xl font-bold text-brand-green mb-1">40%</div>
                  <div className="text-sm text-brand-muted mb-4">lower fixed cost</div>
                  <p className="text-brand-ink italic leading-relaxed mb-4">"We run lean on just a few mobile devices — no front desk, no printers. Monthly fixed cost dropped 40%."</p>
                  <cite className="text-sm font-semibold text-brand-green not-italic">— Love Bites</cite>
                </blockquote>
              </Reveal>
              <Reveal delay={0.08}>
                <blockquote className="bg-white border border-brand-line rounded-3xl p-8" data-testid="ck-proof-pavanpages">
                  <div className="font-display text-4xl font-bold text-brand-orange mb-1">2×</div>
                  <div className="text-sm text-brand-muted mb-4">outlets on one backend</div>
                  <p className="text-brand-ink italic leading-relaxed mb-4">"MyGenie let us launch a second kitchen on the same backend with real-time sync. Revenue doubled, infra cost stayed flat."</p>
                  <cite className="text-sm font-semibold text-brand-green not-italic">— Pavan Pages</cite>
                </blockquote>
              </Reveal>
            </div>
          </div>
        </section>

        <LpPricing />

        {/* ── FAQ ── */}
        <section className="bg-white py-16 sm:py-24" data-testid="ck-lp-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal><h2 className="font-display text-3xl font-bold text-brand-ink mb-10">Common questions</h2></Reveal>
            <div>{faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} testid={f.testid} />)}</div>
          </div>
        </section>

        {/* ── Demo CTA ── */}
        <section id="lp-demo" className="bg-brand-deep py-20 sm:py-28 scroll-mt-20" data-testid="ck-lp-demo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5 block">Free · 45 min · No commitment</span>
              <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">Book a Free Cloud Kitchen Demo</h2>
              <p className="text-lg text-[#a3b8ac]">A specialist walks you through aggregator sync, multi-brand billing and inventory for your kitchen setup.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="ck-lp-form-wrap">
                <DemoForm sector="cloud-kitchen" shortForm submitLabel="Book a Free Cloud Kitchen Demo →" />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
