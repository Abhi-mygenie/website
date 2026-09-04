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
    { "@type": "Question", name: "Can I manage multiple restaurant outlets from one account?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie's restaurant management software gives you a single dashboard for all outlets — centralised menu, per-outlet P&L, and role-based access for managers and staff." } },
    { "@type": "Question", name: "Does it handle Swiggy and Zomato orders?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Swiggy, Zomato, and Magicpin orders flow directly into MyGenie. No separate tablets, no missed orders — all aggregators in one screen." } },
    { "@type": "Question", name: "Is MyGenie the best restaurant management software in India?",
      acceptedAnswer: { "@type": "Answer", text: "MyGenie is used by 200+ outlets across 75+ Indian cities. It's built specifically for Indian regulations — GST, UPI, Indian aggregators — making it one of the most complete restaurant management software options in India." } },
    { "@type": "Question", name: "How is it different from a basic billing app?",
      acceptedAnswer: { "@type": "Answer", text: "A billing app only handles billing. Restaurant management software covers the full operation: billing, ordering, staff management, inventory, CRM, and real-time reporting — all in one platform." } },
  ],
};

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="mgmt-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <a href="#lp-demo" className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="mgmt-lp-navbar-cta">
          Book Free Demo
        </a>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="mgmt-lp-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="mgmt-lp-footer-phone">{COMPANY.phone}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="mgmt-lp-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}

const PLANS = [
  { name: "Starter", price: "₹799", billing: "per outlet/mo · billed annually", feats: ["Billing & POS", "KOT to kitchen", "Daily sales report", "Owner dashboard", "Offline mode"], pop: false },
  { name: "Growth",  price: "₹1,299", billing: "per outlet/mo · billed annually", feats: ["Everything in Starter", "Captain App", "KDS", "Aggregator sync", "CRM basics"], pop: true },
  { name: "Pro",     price: "₹2,499", billing: "per outlet/mo · billed annually", feats: ["Everything in Growth", "Multi-outlet dashboard", "Loyalty + wallet", "WhatsApp automation", "All AI features"], pop: false },
];

function LpPricing() {
  return (
    <section id="lp-pricing" className="bg-white py-20 sm:py-28 scroll-mt-20" data-testid="mgmt-lp-pricing">
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
              <div className={`border rounded-3xl p-8 relative ${plan.pop ? "border-brand-green shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-brand-line"}`} data-testid={`mgmt-plan-${plan.name.toLowerCase()}`}>
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
                <a href="#lp-demo" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`mgmt-plan-cta-${plan.name.toLowerCase()}`}>
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

export default function RestaurantManagementSoftware() {
  const faqs = [
    { q: "Can I manage multiple restaurant outlets from one account?", a: "Yes. A single dashboard for all outlets — centralised menu, per-outlet P&L, and role-based access for managers and staff.", testid: "mgmt-faq-multioutlet" },
    { q: "Does it handle Swiggy and Zomato orders?", a: "Yes. Swiggy, Zomato, and Magicpin orders flow directly into MyGenie. All aggregators in one screen, no missed orders.", testid: "mgmt-faq-aggregators" },
    { q: "Is MyGenie the best restaurant management software in India?", a: "Used by 200+ outlets across 75+ Indian cities, built for Indian regulations: GST, UPI, Indian aggregators.", testid: "mgmt-faq-best-india" },
    { q: "How is it different from a basic billing app?", a: "Billing apps only handle billing. MyGenie covers the full operation: billing, ordering, staff, inventory, CRM, and reporting.", testid: "mgmt-faq-vs-billing" },
  ];

  return (
    <div className="bg-white" data-testid="restaurant-management-software-page">
      <Seo
        title="Restaurant Management Software India | MyGenie POS"
        description="One platform to manage restaurant orders, staff, inventory and reporting. Used across 100+ Indian cities. Book a free demo — see it live for your outlet."
        path="/restaurant-management-software"
        jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
      />
      <LandingNavbar />
      <main className="pt-[72px]">
        {/* ── Hero ── */}
        <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden" data-testid="mgmt-lp-hero">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-brand-green/10 text-brand-green text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest" data-testid="mgmt-lp-eyebrow">Restaurant Management Software</span>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-5" data-testid="mgmt-lp-h1">
                  Restaurant management software — orders, staff, and every outlet in one view.
                </h1>
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="mgmt-lp-sub">
                  Stop switching between apps. MyGenie brings your entire restaurant operation onto one screen — billing, ordering, inventory, and reports.
                </p>
                <div className="flex gap-3 mb-8">
                  {[{ val: "200+", label: "outlets across India" }, { val: "1", label: "screen for everything" }, { val: "4", label: "apps replaced" }].map(({ val, label }) => (
                    <div key={val} className="flex-1 bg-white border border-brand-line rounded-2xl px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-brand-green">{val}</div>
                      <div className="text-[11px] text-brand-muted mt-1 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="#lp-demo" className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="mgmt-lp-cta-primary">
                    Book a Free Management Demo <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="mgmt-lp-cta-secondary">
                    See Pricing ↓
                  </a>
                </div>
              </div>
              {/* Dashboard screenshot — not a stock waiter photo */}
              <img src="/brand/banner.webp" alt="MyGenie restaurant management software dashboard" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="mgmt-lp-hero-image" />
            </div>
          </div>
        </section>

        <TrustBand />

        {/* ── Problem: Too many apps ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="mgmt-lp-problem">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-4">You're running your restaurant across 4 different apps. Here's one.</h2>
              <p className="text-brand-muted leading-relaxed mb-6">A billing app. A stock spreadsheet. A WhatsApp group for attendance. A separate app for Swiggy. And a printed P&L at month end. MyGenie replaces all of it.</p>
              <div className="space-y-3">
                {["Billing app → replaced", "Stock spreadsheet → replaced", "Staff attendance sheet → replaced", "Swiggy dashboard → replaced"].map(item => (
                  <div key={item} className="flex items-center gap-3 bg-brand-sand rounded-xl px-4 py-3">
                    <Check className="w-4 h-4 text-brand-green flex-shrink-0" strokeWidth={3} />
                    <span className="text-sm text-brand-ink">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "Order management", body: "Dine-in, takeaway, Swiggy, Zomato — one screen." },
                  { title: "Staff management", body: "Shifts, attendance, role-based access." },
                  { title: "Real-time reports", body: "Daily P&L from your phone, anywhere." },
                  { title: "Inventory control", body: "Auto-deduct per order. Low-stock alerts." },
                ].map(card => (
                  <div key={card.title} className="border border-brand-line rounded-2xl p-5">
                    <div className="font-display font-bold text-brand-ink text-sm mb-1">{card.title}</div>
                    <div className="text-xs text-brand-muted">{card.body}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Built for India — critical section ── */}
        <section className="bg-brand-deep py-20 sm:py-24" data-testid="mgmt-lp-india">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-4">Built for India</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                The best restaurant management software in India — built for GST, UPI, and Indian aggregators
              </h2>
              <p className="text-[#a3b8ac] leading-relaxed mb-4 max-w-2xl">
                Finding the best restaurant management software in India means finding one that understands Indian operations — GST billing, UPI and Razorpay payments, Swiggy and Zomato integration, and Indian cuisine menu templates.
              </p>
              <p className="text-[#a3b8ac] leading-relaxed mb-8 max-w-2xl">
                MyGenie is used by 200+ outlets across 75 Indian cities. It's not a global product adapted for India — it's built for Indian restaurants from day one.
              </p>
              <div className="flex flex-wrap gap-3">
                {["GST-compliant billing", "UPI + Razorpay payments", "Swiggy / Zomato sync", "Indian menu templates", "GSTR-1 reports"].map(pill => (
                  <span key={pill} className="bg-brand-green/20 text-brand-yellow text-sm font-semibold px-4 py-2 rounded-full">{pill}</span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <LpPricing />

        {/* ── FAQ ── */}
        <section className="bg-brand-sand py-16 sm:py-24" data-testid="mgmt-lp-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal><h2 className="font-display text-3xl font-bold text-brand-ink mb-10">Common questions</h2></Reveal>
            <div>{faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} testid={f.testid} />)}</div>
          </div>
        </section>

        {/* ── Demo CTA ── */}
        <section id="lp-demo" className="bg-brand-deep py-20 sm:py-28 scroll-mt-20" data-testid="mgmt-lp-demo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5 block">Free · 45 min · No commitment</span>
              <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">Book a Free Management Demo</h2>
              <p className="text-lg text-[#a3b8ac]">A specialist walks you through order management, staff controls and reports for your outlet type.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="mgmt-lp-form-wrap">
                <DemoForm sector="restaurant-management" shortForm />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
