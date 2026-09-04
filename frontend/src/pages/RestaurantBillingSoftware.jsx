import { ArrowRight, Check } from "lucide-react";
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
    { "@type": "Question", name: "Is the restaurant billing software GST-compliant?",
      acceptedAnswer: { "@type": "Answer", text: "Yes — MyGenie auto-calculates GST, prints GSTIN on every bill, and generates GSTR-1 compatible reports. No manual GST calculation required." } },
    { "@type": "Question", name: "Does it work offline?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie works offline for billing, KOT, and order management. Data syncs automatically when connection is restored." } },
    { "@type": "Question", name: "Can I use the same billing software for my cafe AND restaurant?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie supports dine-in, takeaway, delivery, QSR, cafe and full-service formats — all from one account." } },
    { "@type": "Question", name: "How fast is billing?",
      acceptedAnswer: { "@type": "Answer", text: "A full table bill takes under 8 seconds on MyGenie. Counter billing is faster. No rekeying, no manual GST, no calculator needed." } },
  ],
};

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="billing-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <a href="#lp-demo" className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="billing-lp-navbar-cta">
          Book Free Demo
        </a>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="billing-lp-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="billing-lp-footer-phone">{COMPANY.phone}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="billing-lp-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}

const PLANS = [
  { name: "Starter", price: "₹799", billing: "per outlet/mo · billed annually", feats: ["Billing & POS", "KOT to kitchen", "Daily sales report", "Owner dashboard", "Offline mode"], pop: false },
  { name: "Growth",  price: "₹1,299", billing: "per outlet/mo · billed annually", feats: ["Everything in Starter", "Captain App", "KDS", "Online ordering", "CRM basics"], pop: true },
  { name: "Pro",     price: "₹2,499", billing: "per outlet/mo · billed annually", feats: ["Everything in Growth", "Multi-outlet dashboard", "Loyalty + wallet", "WhatsApp automation", "All AI features"], pop: false },
];

function LpPricing() {
  return (
    <section id="lp-pricing" className="bg-white py-20 sm:py-28 scroll-mt-20" data-testid="billing-lp-pricing">
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
              <div className={`border rounded-3xl p-8 relative ${plan.pop ? "border-brand-green shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-brand-line"}`} data-testid={`billing-plan-${plan.name.toLowerCase()}`}>
                {plan.pop && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">Most Popular</span>}
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
                <a href="#lp-demo" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`billing-plan-cta-${plan.name.toLowerCase()}`}>
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

export default function RestaurantBillingSoftware() {
  const faqs = [
    { q: "Is the restaurant billing software GST-compliant?", a: "Yes — MyGenie auto-calculates GST, prints GSTIN on every bill, and generates GSTR-1 compatible reports.", testid: "billing-faq-gst" },
    { q: "Does it work offline?", a: "Yes. Billing, KOT, and order management work offline. Data syncs when connection restores.", testid: "billing-faq-offline" },
    { q: "Can I use it for my cafe AND restaurant?", a: "Yes. Same software handles dine-in, takeaway, delivery, QSR and cafe formats from one account.", testid: "billing-faq-formats" },
    { q: "How fast is billing?", a: "A full table bill takes under 8 seconds. Counter billing is faster. No manual GST.", testid: "billing-faq-speed" },
  ];

  return (
    <div className="bg-white" data-testid="billing-software-page">
      <Seo
        title="Restaurant Billing Software — GST-Ready | MyGenie POS"
        description="Fast, accurate billing for restaurants & cafes. GST-compliant, cloud-based, runs on any device. Bill in seconds — book a free demo."
        path="/restaurant-billing-software"
        jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
      />
      <LandingNavbar />
      <main className="pt-[72px]">
        {/* ── Hero ── */}
        <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden" data-testid="billing-lp-hero">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-brand-green/10 text-brand-green text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest" data-testid="billing-lp-eyebrow">Restaurant Billing Software</span>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-5" data-testid="billing-lp-h1">
                  Restaurant billing software — bill in seconds, no errors, fully GST-ready.
                </h1>
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="billing-lp-sub">
                  Built for restaurants, cafes, and bars. Takes orders, prints bills, files GST — on any phone or tablet.
                </p>
                <div className="flex gap-3 mb-8">
                  {[{ val: "8 sec", label: "avg bill time" }, { val: "GST", label: "auto-calculated" }, { val: "₹0", label: "hardware needed" }].map(({ val, label }) => (
                    <div key={val} className="flex-1 bg-white border border-brand-line rounded-2xl px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-brand-green">{val}</div>
                      <div className="text-xs text-brand-muted mt-1 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="#lp-demo" className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="billing-lp-cta-primary">
                    Book a Free Demo <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="billing-lp-cta-secondary">
                    See Pricing ↓
                  </a>
                </div>
              </div>
              <img src="/brand/banner.webp" alt="MyGenie restaurant billing software interface" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="billing-lp-hero-image" />
            </div>
          </div>
        </section>

        <TrustBand />

        {/* ── Features ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="billing-lp-features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-14 text-center">Everything built into the billing software</h2>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🧾", title: "GST-compliant billing", body: "Auto GST on every bill. GSTIN on receipts. GSTR-1 reports in one click.", testid: "billing-feature-gst" },
                { icon: "☕", title: "Restaurants AND cafes", body: "Dine-in, takeaway, delivery, QSR, cafe — same software, any format.", testid: "billing-feature-cafe" },
                { icon: "🍳", title: "KOT to kitchen", body: "Order fires to kitchen instantly. No paper tickets, no shouting across the pass.", testid: "billing-feature-kot" },
                { icon: "📱", title: "No billing machine", body: "Your existing Android phone or tablet becomes the billing terminal.", testid: "billing-feature-device" },
              ].map(f => (
                <Reveal key={f.title}>
                  <div className="border border-brand-line rounded-3xl p-7" data-testid={f.testid}>
                    <div className="text-3xl mb-4">{f.icon}</div>
                    <h3 className="font-display text-lg font-bold text-brand-ink mb-2">{f.title}</h3>
                    <p className="text-sm text-brand-muted leading-relaxed">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <LpPricing />

        {/* ── FAQ ── */}
        <section className="bg-brand-sand py-16 sm:py-24" data-testid="billing-lp-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal><h2 className="font-display text-3xl font-bold text-brand-ink mb-10">Common questions</h2></Reveal>
            <div>{faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} testid={f.testid} />)}</div>
          </div>
        </section>

        {/* ── Demo CTA ── */}
        <section id="lp-demo" className="bg-brand-deep py-20 sm:py-28 scroll-mt-20" data-testid="billing-lp-demo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5 block">Free · 45 min · No commitment</span>
              <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">Book a free 45-min billing software demo</h2>
              <p className="text-lg text-[#a3b8ac]">A specialist bills a live order on your outlet type — QSR, café, or full-service. No slides, no commitment.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="billing-lp-form-wrap">
                <DemoForm sector="billing-software" shortForm />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
