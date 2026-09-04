import { ArrowRight, Check, CreditCard, ClipboardList, Flame, BarChart3 } from "lucide-react";
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
    { "@type": "Question", name: "Do I need to buy a POS machine for this restaurant POS system?",
      acceptedAnswer: { "@type": "Answer", text: "No. MyGenie is a software POS — it runs on any Android phone, tablet, or browser. No POS machine purchase required. That's what makes it the best restaurant POS system for outlets that want to stay lean." } },
    { "@type": "Question", name: "What's the difference between a POS and a billing machine?",
      acceptedAnswer: { "@type": "Answer", text: "A billing machine is hardware that prints bills. A restaurant POS system like MyGenie is software — it handles orders, billing, inventory, reports, and staff management from one app on any device." } },
    { "@type": "Question", name: "Does the restaurant POS system work offline?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Billing, KOT, and order management work offline. Data syncs automatically when connection is restored." } },
    { "@type": "Question", name: "How fast is setup?",
      acceptedAnswer: { "@type": "Answer", text: "Most restaurants are live within 48 hours. MyGenie's onboarding team sets up your menu, tables, and integrations. No IT team or hardware installation required." } },
  ],
};

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="pos-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <a href="#lp-demo" className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="pos-lp-navbar-cta">
          Book Free Demo
        </a>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="pos-lp-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="pos-lp-footer-phone">{COMPANY.phone}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="pos-lp-footer-privacy">Privacy Policy</Link>
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
    <section id="lp-pricing" className="bg-brand-sand py-20 sm:py-28 scroll-mt-20" data-testid="pos-lp-pricing">
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
              <div className={`border rounded-3xl p-8 relative ${plan.pop ? "border-brand-green bg-white shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-brand-line bg-white"}`} data-testid={`pos-plan-${plan.name.toLowerCase()}`}>
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
                <a href="#lp-demo" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`pos-plan-cta-${plan.name.toLowerCase()}`}>
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

export default function RestaurantPosSystem() {
  const features = [
    { icon: CreditCard, title: "POS & Billing", body: "Take orders, print bills, split payments — GST auto-calculated on every transaction.", testid: "pos-feature-billing" },
    { icon: ClipboardList, title: "Inventory management", body: "Real-time stock deduction per order. Low-stock alerts. Waste tracking across outlets.", testid: "pos-feature-inventory" },
    { icon: Flame, title: "KDS & Kitchen orders", body: "Orders fire to kitchen display instantly. No paper KOT, no missed tickets.", testid: "pos-feature-kds" },
    { icon: BarChart3, title: "Real-time reports", body: "Daily P&L, per-item margins, hourly sales — from your phone, anywhere.", testid: "pos-feature-reports" },
  ];

  const faqs = [
    { q: "Do I need to buy a POS machine?", a: "No. MyGenie runs on any Android phone, tablet, or browser. No POS machine purchase required.", testid: "pos-faq-machine" },
    { q: "What's the difference between a POS and a billing machine?", a: "A billing machine only prints bills. A restaurant POS system handles orders, billing, inventory, reports, and staff management in one app.", testid: "pos-faq-vs-billing" },
    { q: "Does the restaurant POS system work offline?", a: "Yes. Billing, KOT, and order management work offline. Data syncs when connection restores.", testid: "pos-faq-offline" },
    { q: "How fast is setup?", a: "Most restaurants are live within 48 hours. Onboarding covers menu setup, tables, and integrations.", testid: "pos-faq-setup" },
  ];

  return (
    <div className="bg-white" data-testid="restaurant-pos-system-page">
      <Seo
        title="Restaurant POS System — India's Best | MyGenie"
        description="Complete restaurant POS system — billing, inventory, KOT, and real-time reports in one app. No hardware lock-in. Works on any device. Book a free demo."
        path="/restaurant-pos-system"
        jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
      />
      <LandingNavbar />
      <main className="pt-[72px]">
        {/* ── Hero ── */}
        <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden" data-testid="pos-lp-hero">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-brand-green/10 text-brand-green text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest" data-testid="pos-lp-eyebrow">Restaurant POS System</span>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-5" data-testid="pos-lp-h1">
                  Best restaurant POS system — orders, billing, and reports in one place, on any device.
                </h1>
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="pos-lp-sub">
                  India's restaurant POS built for the floor — no bulky machines, no per-device fees, no downtime.
                </p>
                <div className="flex gap-3 mb-8">
                  {[{ val: "48hr", label: "average setup" }, { val: "₹0", label: "hardware required" }, { val: "22%", label: "more revenue/shift" }].map(({ val, label }) => (
                    <div key={val} className="flex-1 bg-white border border-brand-line rounded-2xl px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-brand-green">{val}</div>
                      <div className="text-[11px] text-brand-muted mt-1 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="#lp-demo" className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="pos-lp-cta-primary">
                    Book a Free POS Demo <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="pos-lp-cta-secondary">
                    See Pricing ↓
                  </a>
                </div>
              </div>
              <img src="/brand/banner.webp" alt="MyGenie restaurant POS system on phone" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="pos-lp-hero-image" />
            </div>
          </div>
        </section>

        <TrustBand />

        {/* ── 4-feature grid ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="pos-lp-features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3 text-center">Everything in one restaurant POS system</h2>
              <p className="text-brand-muted text-center mb-14">No switching between apps — billing, kitchen, stock and reports all run from MyGenie.</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(f => (
                <Reveal key={f.title}>
                  <div className="border border-brand-line rounded-3xl p-7" data-testid={f.testid}>
                    <f.icon className="w-8 h-8 text-brand-green mb-4" />
                    <h3 className="font-display text-lg font-bold text-brand-ink mb-2">{f.title}</h3>
                    <p className="text-sm text-brand-muted leading-relaxed">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Multi-outlet ── */}
        <section className="bg-brand-sand py-20 sm:py-24" data-testid="pos-lp-multioutlet">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Built for scale</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-4">The best restaurant POS system grows with you — single outlet to chain</h2>
              <p className="text-brand-muted leading-relaxed mb-6">Run every outlet from one dashboard. Centralised menu. Per-outlet P&L. Role-based access for managers and staff. One login, all locations.</p>
              <div className="flex gap-4">
                <div className="bg-white border border-brand-line rounded-2xl px-6 py-4 text-center">
                  <div className="font-display text-3xl font-bold text-brand-green">200+</div>
                  <div className="text-xs text-brand-muted mt-1">outlets on MyGenie</div>
                </div>
                <div className="bg-white border border-brand-line rounded-2xl px-6 py-4 text-center">
                  <div className="font-display text-3xl font-bold text-brand-green">1</div>
                  <div className="text-xs text-brand-muted mt-1">dashboard for all</div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <img src="/brand/banner.webp" alt="Multi-outlet POS dashboard" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="lazy" />
            </Reveal>
          </div>
        </section>

        {/* ── India section ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="pos-lp-india">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Built for India</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-4">Restaurant POS system designed for Indian restaurants — GST, UPI, Swiggy, Zomato</h2>
              <p className="text-brand-muted leading-relaxed mb-8 max-w-2xl">India's restaurant industry has specific needs: GST compliance, UPI payments, Swiggy/Zomato aggregator integration. MyGenie is the restaurant POS system India's restaurateurs trust — built from the ground up for Indian regulations and workflows.</p>
            </Reveal>
            <div className="flex flex-wrap gap-3">
              {["GST-compliant billing", "UPI & Razorpay payments", "Swiggy + Zomato sync", "Indian menu templates", "GSTR-1 reports"].map(pill => (
                <span key={pill} className="bg-brand-green/10 text-brand-green text-sm font-semibold px-4 py-2 rounded-full">{pill}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Proof ── */}
        <section className="bg-brand-sand py-20 sm:py-24" data-testid="pos-lp-proof">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-10">Terraria Café: 22% more revenue per shift with MyGenie POS</h2>
            </Reveal>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {[{ val: "22%", label: "more revenue per shift" }, { val: "30%", label: "less prep time" }, { val: "15%", label: "less food waste" }].map(({ val, label }) => (
                <Reveal key={val}>
                  <div className="bg-white border border-brand-line rounded-3xl p-8 text-center">
                    <div className="font-display text-5xl font-bold text-brand-green mb-2">{val}</div>
                    <div className="text-sm text-brand-muted">{label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <blockquote className="bg-white border border-brand-line rounded-3xl p-8 max-w-2xl">
                <p className="text-brand-ink italic leading-relaxed mb-4">"Our QSR model improved drastically with KDS and scan-based ordering. Prep time cut 30%, food waste down 15%, revenue up 22% per shift."</p>
                <cite className="text-sm font-semibold text-brand-green not-italic">— Terraria Café</cite>
              </blockquote>
            </Reveal>
          </div>
        </section>

        <LpPricing />

        {/* ── FAQ ── */}
        <section className="bg-white py-16 sm:py-24" data-testid="pos-lp-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal><h2 className="font-display text-3xl font-bold text-brand-ink mb-10">Common questions</h2></Reveal>
            <div>{faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} testid={f.testid} />)}</div>
          </div>
        </section>

        {/* ── Demo CTA ── */}
        <section id="lp-demo" className="bg-brand-deep py-20 sm:py-28 scroll-mt-20" data-testid="pos-lp-demo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5 block">Free · 45 min · No commitment</span>
              <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">See the restaurant POS system live — book a free 45-min demo</h2>
              <p className="text-lg text-[#a3b8ac]">A specialist walks you through orders, billing, reports and India-specific features on your outlet type.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="pos-lp-form-wrap">
                <DemoForm sector="restaurant-pos" shortForm />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
