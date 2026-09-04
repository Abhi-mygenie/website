import { ArrowRight, Check, Zap, Monitor, QrCode, Boxes, ShieldCheck, BarChart3 } from "lucide-react";
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
    { "@type": "Question", name: "Does it work for fast food and burger chains?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie is built for quick service restaurants — counter billing, KDS, prepaid tokens, and multi-counter support. Works for fast food, burger chains, juice bars, and any outlet with high-volume counter service." } },
    { "@type": "Question", name: "Can I run multiple billing counters from one account?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie supports 3–5 billing counters per outlet on one account. Each counter runs independently — no conflicts, no duplicate orders." } },
    { "@type": "Question", name: "Does it include a Kitchen Display System (KDS)?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Counter takes the order → kitchen sees it on the KDS instantly → bill printed in seconds. No paper KOT, no shouting across the pass, no missed items." } },
    { "@type": "Question", name: "Is it GST-compliant for QSR?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. GST is auto-calculated on every bill. GSTIN on receipts. GSTR-1 compatible reports. Works for any QSR format: dine-in, takeaway, counter service." } },
  ],
};

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="qsr-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <a href="#lp-demo" className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="qsr-lp-navbar-cta">
          Book Free Demo
        </a>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="qsr-lp-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="qsr-lp-footer-phone">{COMPANY.phone}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="qsr-lp-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}

const PLANS = [
  { name: "Starter", price: "₹799", billing: "per outlet/mo · billed annually", feats: ["Billing & POS", "KOT to kitchen", "Daily sales report", "Owner dashboard", "Offline mode"], pop: false },
  { name: "Growth",  price: "₹1,299", billing: "per outlet/mo · billed annually", feats: ["Everything in Starter", "KDS included", "Multi-counter support", "Scan & Order (QR)", "CRM basics"], pop: true },
  { name: "Pro",     price: "₹2,499", billing: "per outlet/mo · billed annually", feats: ["Everything in Growth", "Multi-outlet dashboard", "Loyalty + wallet", "WhatsApp automation", "All AI features"], pop: false },
];

function LpPricing() {
  return (
    <section id="lp-pricing" className="bg-white py-20 sm:py-28 scroll-mt-20" data-testid="qsr-lp-pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Starting at ₹4,000/year</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight">Simple pricing.</h2>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div className={`border rounded-3xl p-8 relative ${plan.pop ? "border-brand-green shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-brand-line"}`} data-testid={`qsr-plan-${plan.name.toLowerCase()}`}>
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
                <a href="#lp-demo" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`qsr-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </a>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-xs text-brand-muted text-center mt-8">Starting at ₹4,000/year · No hardware required · Cancel anytime</p>
      </div>
    </section>
  );
}

export default function QsrPosSystem() {
  const features = [
    { icon: Zap, title: "Counter billing", body: "Bill in under 10 seconds. No errors, no rekeying.", testid: "qsr-feature-billing" },
    { icon: Monitor, title: "Kitchen Display", body: "Orders fire to KDS instantly — no paper KOT.", testid: "qsr-feature-kds" },
    { icon: QrCode, title: "Scan & Order", body: "Guests order from their phone. Fewer staff, faster flow.", testid: "qsr-feature-scan" },
    { icon: Boxes, title: "Inventory", body: "Auto-deduct per item sold. Low-stock alerts.", testid: "qsr-feature-inventory" },
    { icon: ShieldCheck, title: "Multi-counter", body: "3–5 counters per outlet on one account.", testid: "qsr-feature-counter" },
    { icon: BarChart3, title: "GST reports", body: "GSTR-1 compatible, auto-calculated.", testid: "qsr-feature-gst" },
  ];

  const faqs = [
    { q: "Does it work for fast food and burger chains?", a: "Yes. Counter billing, KDS, prepaid tokens, and multi-counter support. Works for any high-volume counter service format.", testid: "qsr-faq-fastfood" },
    { q: "Can I run multiple billing counters?", a: "Yes. 3–5 counters per outlet on one account. Each runs independently — no conflicts, no duplicate orders.", testid: "qsr-faq-counters" },
    { q: "Does it include KDS?", a: "Yes. Counter takes order → kitchen sees it on KDS instantly → bill printed in seconds. No paper KOT.", testid: "qsr-faq-kds" },
    { q: "Is it GST-compliant for QSR?", a: "Yes. GST auto-calculated on every bill. GSTIN on receipts. GSTR-1 reports in one click.", testid: "qsr-faq-gst" },
  ];

  return (
    <div className="bg-white" data-testid="qsr-pos-system-page">
      <Seo
        title="QSR POS System — Fast Billing for Quick Service Restaurants"
        description="Cloud POS built for QSR speed — counter billing, kitchen display, inventory, and reports on any device. GST-ready. Book a free demo."
        path="/qsr-pos-system"
        jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
      />
      <LandingNavbar />
      <main className="pt-[72px]">
        {/* ── Hero ── */}
        <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden" data-testid="qsr-lp-hero">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-brand-green/10 text-brand-green text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest" data-testid="qsr-lp-eyebrow">QSR POS System</span>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-5" data-testid="qsr-lp-h1">
                  QSR POS system built for quick service restaurants — fast, accurate, no hardware needed.
                </h1>
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="qsr-lp-sub">
                  Take counter orders, fire to kitchen display, print bills, and track inventory — all from one app. Built for QSR speed.
                </p>
                <div className="flex gap-3 mb-8">
                  {[{ val: "10s", label: "avg bill time" }, { val: "₹0", label: "hardware needed" }, { val: "100+", label: "QSR outlets" }].map(({ val, label }) => (
                    <div key={val} className="flex-1 bg-white border border-brand-line rounded-2xl px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-brand-green">{val}</div>
                      <div className="text-[11px] text-brand-muted mt-1 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="#lp-demo" className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="qsr-lp-cta-primary">
                    Book a Free QSR Demo <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#lp-pricing" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="qsr-lp-cta-secondary">
                    See Pricing ↓
                  </a>
                </div>
              </div>
              <img src="/brand/banner.webp" alt="MyGenie QSR POS system — counter billing on phone" width={776} height={637} className="w-full h-auto object-contain rounded-3xl" loading="eager" fetchPriority="high" srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w" sizes="(max-width: 1023px) 400px, 776px" data-testid="qsr-lp-hero-image" />
            </div>
          </div>
        </section>

        <TrustBand />

        {/* ── Feature strip ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="qsr-lp-feature-strip">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3 text-center">Everything a quick service restaurant needs — in one POS</h2>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
              {features.map(f => (
                <Reveal key={f.title}>
                  <div className="border border-brand-line rounded-2xl p-5 text-center" data-testid={f.testid}>
                    <f.icon className="w-7 h-7 text-brand-green mx-auto mb-3" />
                    <div className="font-display text-sm font-bold text-brand-ink mb-1">{f.title}</div>
                    <div className="text-xs text-brand-muted leading-snug">{f.body}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="bg-brand-sand py-20 sm:py-24" data-testid="qsr-lp-how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Simple. Fast. Accurate.</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-12">How the QSR POS works</h2>
            </Reveal>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { num: "1", title: "Take order at counter", desc: "Staff taps items on phone or tablet. Prepaid tokens issued for token-based QSRs.", testid: "qsr-step-1" },
                { num: "2", title: "Kitchen gets it instantly", desc: "Order fires to Kitchen Display System. No paper KOT, no shouting, no delays.", testid: "qsr-step-2" },
                { num: "3", title: "Bill printed in seconds", desc: "GST bill auto-generated. Print, WhatsApp, or email. UPI, card, or cash.", testid: "qsr-step-3" },
              ].map(step => (
                <Reveal key={step.num}>
                  <div className="bg-white border border-brand-line rounded-3xl p-8" data-testid={step.testid}>
                    <div className="w-10 h-10 rounded-full bg-brand-green text-white font-display font-bold text-lg flex items-center justify-center mb-4">{step.num}</div>
                    <h3 className="font-display text-lg font-bold text-brand-ink mb-2">{step.title}</h3>
                    <p className="text-sm text-brand-muted leading-relaxed">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Proof ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="qsr-lp-proof">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal><h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-10">QSR outlets on MyGenie</h2></Reveal>
            <div className="grid sm:grid-cols-2 gap-6">
              <Reveal>
                <blockquote className="border border-brand-line rounded-3xl p-8" data-testid="qsr-proof-terraria">
                  <div className="font-display text-4xl font-bold text-brand-green mb-1">22%</div>
                  <div className="text-sm text-brand-muted mb-4">more revenue per shift</div>
                  <p className="text-brand-ink italic leading-relaxed mb-4">"Our QSR model improved drastically with KDS and scan-based ordering. Prep time cut 30%, food waste down 15%, revenue up 22% per shift."</p>
                  <cite className="text-sm font-semibold text-brand-green not-italic">— Terraria Café</cite>
                </blockquote>
              </Reveal>
              <Reveal delay={0.08}>
                <blockquote className="border border-brand-line rounded-3xl p-8" data-testid="qsr-proof-rhino">
                  <div className="font-display text-4xl font-bold text-brand-orange mb-1">₹1 Lakh</div>
                  <div className="text-sm text-brand-muted mb-4">theft caught in 2 weeks</div>
                  <p className="text-brand-ink italic leading-relaxed mb-4">"A cashier was cancelling items after payment. MyGenie's audit logs exposed ₹1 lakh in theft in two weeks."</p>
                  <cite className="text-sm font-semibold text-brand-green not-italic">— Rhino</cite>
                </blockquote>
              </Reveal>
            </div>
          </div>
        </section>

        <LpPricing />

        {/* ── FAQ ── */}
        <section className="bg-brand-sand py-16 sm:py-24" data-testid="qsr-lp-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal><h2 className="font-display text-3xl font-bold text-brand-ink mb-10">Common questions</h2></Reveal>
            <div>{faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} testid={f.testid} />)}</div>
          </div>
        </section>

        {/* ── Demo CTA ── */}
        <section id="lp-demo" className="bg-brand-deep py-20 sm:py-28 scroll-mt-20" data-testid="qsr-lp-demo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5 block">Free · 45 min · No commitment</span>
              <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">See the QSR POS live — book a free demo for your outlet</h2>
              <p className="text-lg text-[#a3b8ac]">A specialist walks you through counter billing, KDS, and multi-counter setup for your QSR format.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="qsr-lp-form-wrap">
                <DemoForm sector="qsr" shortForm submitLabel="Book a Free QSR Demo →" />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
