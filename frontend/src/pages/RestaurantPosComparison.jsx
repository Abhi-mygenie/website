import { useSearchParams, Link } from "react-router-dom";
import { ArrowRight, Check, Shield, Clock, Star, Sparkles, Users, Package } from "lucide-react";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import FaqItem from "@/components/site/FaqItem";
import Logo from "@/components/site/Logo";
import TrustBand from "@/components/home/TrustBand";
import { SOFTWARE_APP_JSONLD, SITE_URL } from "@/lib/seo";
import { COMPANY } from "@/data/company";

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is the difference between MyGenie and Posist?",
      acceptedAnswer: { "@type": "Answer", text: "MyGenie is a hospitality operating system that includes billing, inventory, CRM, AI insights, and loyalty in a single plan starting at ₹799/outlet/month. Posist (now Restroworks) is an enterprise POS targeted at large chains, with pricing typically starting higher and most advanced features available as paid add-ons. MyGenie also offers free data migration with go-live in 48 hours." } },
    { "@type": "Question", name: "How long does switching restaurant POS systems take?",
      acceptedAnswer: { "@type": "Answer", text: "With MyGenie's migration support, most restaurants are fully live within 48 hours. The MyGenie onboarding team migrates your menu, inventory, and customer data — no manual re-entry required. Staff training is included and typically takes 2–3 hours." } },
    { "@type": "Question", name: "Will I lose data when I switch from my current POS to MyGenie?",
      acceptedAnswer: { "@type": "Answer", text: "No. MyGenie migrates your full data set — menu items, recipes, inventory levels, customer records, and supplier contacts — before you go live. Your current POS continues running until the moment you switch, with zero downtime." } },
    { "@type": "Question", name: "Does MyGenie work offline?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Billing, KOT, and order management all work without an internet connection. Data syncs automatically when connectivity is restored." } },
    { "@type": "Question", name: "Is there a contract or lock-in period with MyGenie?",
      acceptedAnswer: { "@type": "Answer", text: "No. MyGenie operates on a monthly or annual subscription with no lock-in contracts. You can cancel anytime. Your data is fully exportable at no charge — we do not hold your data after cancellation." } },
  ],
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Restaurant POS Comparison", item: `${SITE_URL}/restaurant-pos-comparison` },
  ],
};

const COMPARISON_ROWS = [
  { feature: "Starting Price",      sub: "per outlet / month", mg: "₹799/mo",      posist: "[VERIFY]",   gofrugal: "[VERIFY]",  billberry: "[VERIFY]",  posistType: null, gofrugalType: null, billType: null },
  { feature: "AI Insights",         sub: null,                 mg: "✓ Built-in",   posist: "Add-on",     gofrugal: "✗",        billberry: "✗",         posistType: "addon", gofrugalType: "bad", billType: "bad" },
  { feature: "Recipe-Level P&L",    sub: null,                 mg: "✓",            posist: "✗",          gofrugal: "Limited",   billberry: "✗",         posistType: "bad", billType: "bad" },
  { feature: "CRM Built-in",        sub: null,                 mg: "✓ Included",   posist: "Add-on",     gofrugal: "✗",        billberry: "✗",         posistType: "addon", gofrugalType: "bad", billType: "bad" },
  { feature: "Multi-Location",      sub: null,                 mg: "✓",            posist: "✓",          gofrugal: "✓",        billberry: "✗",         billType: "bad" },
  { feature: "Migration Support",   sub: null,                 mg: "✓ Free",       posist: "Paid",       gofrugal: "Paid",     billberry: "✗",         billType: "bad" },
  { feature: "Switch Timeline",     sub: null,                 mg: "48 hours",     posist: "[VERIFY]",   gofrugal: "[VERIFY]", billberry: "[VERIFY]" },
  { feature: "Indian 24/7 Support", sub: null,                 mg: "✓",            posist: "✓",          gofrugal: "✓",        billberry: "Limited" },
  { feature: "No Lock-in",          sub: null,                 mg: "✓",            posist: "✗",          gofrugal: "✗",        billberry: "✓",         posistType: "bad", gofrugalType: "bad" },
  { feature: "Offline Mode",        sub: null,                 mg: "✓",            posist: "✓",          gofrugal: "✓",        billberry: "✓" },
  { feature: "GST Compliant",       sub: null,                 mg: "✓",            posist: "✓",          gofrugal: "✓",        billberry: "✓" },
];

const TESTIMONIALS = [
  { badge: "Switched from Posist", quote: "We were on Posist for 2 years. The migration took one day — they moved our entire menu, customer data, and integrations. We went live on a Tuesday and didn't lose a single order.", name: "[CS Team — Posist switcher]", outlet: "Restaurant Name, City", initial: "R" },
  { badge: "MyGenie Customer", quote: "Recipe-level control gave us full P&L visibility. Wastage down 12%, order profitability up 18%.", name: "Ubuntu Café", outlet: "Café, India", initial: "U" },
  { badge: "Switched from GoFrugal", quote: "GoFrugal worked, but every feature we needed was a separate module with a separate cost. MyGenie has everything — CRM, loyalty, WhatsApp, AI — in one plan at ₹1,499 a month. The math was obvious.", name: "[CS Team — GoFrugal switcher]", outlet: "Restaurant Name, City", initial: "M" },
];

const MIGRATION_STEPS = [
  { num: "01", title: "Book a free demo", body: "We assess your current setup, outlet count, and integrations in a 20-min call. No commitment." },
  { num: "02", title: "We migrate your data", body: "Menu, inventory, customer records, and supplier data — migrated by our onboarding team. Zero manual re-entry." },
  { num: "03", title: "Staff training included", body: "Your team is trained on billing, KDS, and reporting before go-live. Takes 2–3 hours, not days." },
  { num: "04", title: "Go live. We stay.", body: "24/7 support for the first 30 days. Your dedicated account manager handles any issues same day." },
];

const FEATURES = [
  { icon: Sparkles, color: "green",  metric: "+18%", title: "AI that audits every rupee",         body: "Recipe-level P&L, waste tracking, demand forecasting, and fraud detection — built in, not bolted on. No separate AI license. Available in the Pro plan.",                                  testid: "comparison-feature-ai" },
  { icon: Users,    color: "orange", metric: "+15%", title: "Know your regulars. Keep them back.", body: "Built-in CRM tracks every customer — spend, visit frequency, preferences. Automated WhatsApp and loyalty rewards, included. No third-party tool required.",                            testid: "comparison-feature-crm" },
  { icon: Package,  color: "green",  metric: "−12%", title: "Recipe-level inventory — auto-depleted", body: "Every dish sold auto-depletes ingredients by recipe. Low-stock alerts, supplier management, and waste reports tell you exactly where margin is leaking.", testid: "comparison-feature-inventory" },
];

const FAQS = [
  { q: "What is the difference between MyGenie and Posist?",       a: "MyGenie is a hospitality operating system starting at ₹799/outlet/month that includes billing, inventory, CRM, AI insights, and loyalty in one plan. Posist (now Restroworks) targets large chains with pricing starting higher — most advanced features are paid add-ons. MyGenie also includes free data migration with 48-hour go-live.", testid: "comparison-faq-posist" },
  { q: "How long does switching restaurant POS systems take?",      a: "With MyGenie's migration support, most restaurants are fully live within 48 hours. Our onboarding team migrates your menu, inventory, and customer data — no manual re-entry. Staff training is included and takes 2–3 hours.", testid: "comparison-faq-migration" },
  { q: "Will I lose data when I switch POS systems?",               a: "No. MyGenie migrates your full data set before you go live. Your current POS keeps running until you're ready to switch — zero downtime.", testid: "comparison-faq-data" },
  { q: "Does MyGenie work offline?",                                 a: "Yes. Billing, KOT, and order management work without an internet connection. Data syncs automatically when connectivity is restored.", testid: "comparison-faq-offline" },
  { q: "Is there a contract or lock-in with MyGenie?",              a: "No. Monthly or annual subscription, cancel anytime, no exit fees. Your data is fully exportable at no charge.", testid: "comparison-faq-contract" },
];

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="comparison-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <a href="#lp-demo" className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="comparison-lp-navbar-cta">
          Book Free Demo
        </a>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="comparison-lp-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="comparison-lp-footer-phone">{COMPANY.phone}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="comparison-lp-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}

export default function RestaurantPosComparison() {
  const [searchParams] = useSearchParams();
  const vs = searchParams.get("vs");
  const h1 = vs
    ? `Looking for a ${vs} Alternative? Compare MyGenie vs ${vs}`
    : "Compare Restaurant POS Systems — Switch Without the Downtime";
  const titleTag = vs
    ? `MyGenie vs ${vs} — Best Restaurant POS Alternative in India`
    : "Compare Restaurant POS in India — MyGenie vs Posist, GoFrugal & More";

  return (
    <div className="bg-white" data-testid="restaurant-pos-comparison-page">
      <Seo
        title={titleTag}
        description="Switch restaurant POS without downtime. Compare MyGenie vs Posist, GoFrugal, Billberry — features, price, migration. Free demo, go live in 48 hrs."
        path="/restaurant-pos-comparison"
        jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA, BREADCRUMB_JSONLD]}
      />
      <LandingNavbar />
      <main className="pt-[72px]">

        {/* ── S1: HERO ── */}
        <section className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden" data-testid="comparison-lp-hero">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-widest" data-testid="comparison-lp-eyebrow">
                  POS Comparison — India
                </span>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-5" data-testid="comparison-lp-h1">
                  {h1}
                </h1>
                <p className="text-lg text-brand-muted leading-relaxed mb-8" data-testid="comparison-lp-sub">
                  Outgrown your current POS? MyGenie gives you AI insights, inventory, CRM, and billing — starting at ₹799/month per outlet. Switch in under 48 hours with free data migration.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <a href="#lp-demo" className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="comparison-lp-cta-primary">
                    Book a Free Demo <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#comparison-table" className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all" data-testid="comparison-lp-cta-secondary">
                    Compare Features ↓
                  </a>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {["No contracts, no lock-in", "Free migration support", "100+ cities across India", "GST compliant"].map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-sm text-brand-muted">
                      <Check className="w-3.5 h-3.5 text-brand-green flex-shrink-0" strokeWidth={3} />{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: "48 hrs",  label: "from sign-up to first bill",          color: "text-brand-green" },
                  { val: "₹1 Lakh", label: "leakage caught in 2 weeks (avg)",     color: "text-brand-orange" },
                  { val: "100+",    label: "cities across India",                  color: "text-brand-green" },
                  { val: "₹799",    label: "starting price per outlet/month",      color: "text-brand-orange" },
                ].map(({ val, label, color }, i) => (
                  <div key={val} className="bg-white border border-brand-line rounded-3xl p-6" data-testid={`comparison-stat-${i}`}>
                    <div className={`font-display text-4xl font-bold leading-none mb-2 ${color}`}>{val}</div>
                    <div className="text-sm text-brand-muted leading-snug">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <TrustBand />

        {/* ── S2: COMPARISON TABLE ── */}
        <section className="bg-brand-deep py-20 sm:py-24" id="comparison-table" data-testid="comparison-lp-table-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-4">Side-by-Side</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">Compare Before You Decide</h2>
              <p className="text-[#a3b8ac] mb-10 max-w-2xl">MyGenie vs the most-searched restaurant POS systems in India. Based on publicly available information.</p>
            </Reveal>
            <div className="bg-[#0c2a1a] border border-[#1e4a2e] rounded-3xl overflow-hidden" data-testid="comparison-lp-table">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[#1e4a2e]">
                      <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] bg-[#0c2a1a] w-[34%]">Feature</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-brand-green text-center bg-[#0d3318] w-[16.5%]">MyGenie</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] text-center bg-[#111f17] w-[16.5%]">Posist</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] text-center bg-[#111f17] w-[16.5%]">GoFrugal</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] text-center bg-[#111f17] w-[16.5%]">Billberry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={row.feature} className={i < COMPARISON_ROWS.length - 1 ? "border-b border-[#0e2518]" : ""}>
                        <td className="px-5 py-3.5 bg-[#0c2a1a]">
                          <span className="text-sm font-semibold text-[#d4e8dc]">{row.feature}</span>
                          {row.sub && <span className="block text-xs text-[#5B7A68] mt-0.5">{row.sub}</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center bg-[#0a2210] text-sm font-semibold text-[#86efac]">{row.mg}</td>
                        {[
                          { val: row.posist,    type: row.posistType },
                          { val: row.gofrugal,  type: row.gofrugalType },
                          { val: row.billberry, type: row.billType },
                        ].map(({ val, type }, ci) => (
                          <td key={ci} className="px-5 py-3.5 text-center bg-[#0e1e14]">
                            {type === "bad"   && <span className="text-sm font-semibold text-red-400">{val}</span>}
                            {type === "addon" && <span className="inline-block bg-orange-950 border border-orange-800/50 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">Add-on</span>}
                            {!type           && <span className="text-sm text-[#5B7A68] font-medium">{val}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#1e4a2e] px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-[#3d5e4a] italic">Based on publicly available information as of 2026. [VERIFY] = to be confirmed with product team before launch.</p>
                <a href="#lp-demo" className="inline-flex items-center gap-2 text-sm font-bold text-brand-green bg-brand-green/10 border border-brand-green/25 hover:bg-brand-green/20 px-5 py-2.5 rounded-full transition-all whitespace-nowrap" data-testid="comparison-table-cta">
                  See MyGenie in Action →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── S3: SOCIAL PROOF ── */}
        <section className="bg-white py-20 sm:py-24" data-testid="comparison-lp-proof">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Verified Results</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-10">Why Restaurants Are Switching to MyGenie</h2>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-brand-line border border-brand-line rounded-2xl overflow-hidden mb-12" data-testid="comparison-stat-bar">
              {[
                { val: "100+", label: "Cities" },
                { val: "48 hrs", label: "Migration" },
                { val: "+25%", label: "Profit Boost" },
                { val: "₹799", label: "Starting Price / mo" },
              ].map(({ val, label }) => (
                <div key={val} className="bg-white px-6 py-5 text-center">
                  <div className="font-display text-2xl font-bold text-brand-green">{val}</div>
                  <div className="text-xs text-brand-muted mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="border border-brand-line border-l-4 border-l-brand-green rounded-3xl p-7" data-testid={`comparison-testimonial-${i}`}>
                    <span className="inline-block bg-brand-green/8 border border-brand-green/20 text-brand-greenDark text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4">{t.badge}</span>
                    <blockquote className="text-sm text-brand-muted leading-relaxed italic mb-5">"{t.quote}"</blockquote>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-sand border border-brand-line flex items-center justify-center text-sm font-bold text-brand-greenDark flex-shrink-0">{t.initial}</div>
                      <div>
                        <div className="text-sm font-bold text-brand-ink">{t.name}</div>
                        <div className="text-xs text-brand-muted">{t.outlet}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── S4: MIGRATION ── */}
        <section className="bg-brand-deep py-20 sm:py-24" id="migration" data-testid="comparison-lp-migration">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-4">Zero Downtime</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">Switch in Under 48 Hours — We Handle Everything</h2>
              <p className="text-[#a3b8ac] mb-12 max-w-2xl">The #1 reason restaurants don't switch POS is fear of downtime and data loss. Here's exactly how the migration works.</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {MIGRATION_STEPS.map((step, i) => (
                <Reveal key={step.num} delay={i * 0.08}>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-7" data-testid={`comparison-migration-step-${i}`}>
                    <div className="font-display text-5xl font-bold text-brand-green/30 leading-none mb-4">{step.num}</div>
                    <h3 className="font-display text-base font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-[#a3b8ac] leading-relaxed">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: Shield, title: "Your data is fully portable", body: "Export everything, anytime. No exit fees, no data hostage." },
                { icon: Clock,  title: "Zero downtime",               body: "Migration happens before you flip the switch. Your current POS keeps running until you're ready." },
                { icon: Star,   title: "Free for all plans",           body: "Migration support is included in every MyGenie plan — Starter, Growth, and Pro." },
              ].map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6" data-testid={`comparison-migration-proof-${i}`}>
                  <Icon className="w-6 h-6 text-brand-green mb-3" />
                  <h3 className="font-display text-sm font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-[#a3b8ac] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── S5: FEATURES ── */}
        <section className="bg-brand-sand py-20 sm:py-24" data-testid="comparison-lp-features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4">What Makes It Different</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">POS + CRM + AI in One System — Not Three Separate Tools</h2>
              <p className="text-brand-muted mb-12 max-w-2xl">Most restaurant POS systems record what happened. MyGenie prevents what shouldn't — before it costs you.</p>
            </Reveal>
            <div className="grid sm:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, color, metric, title, body, testid }, i) => (
                <Reveal key={testid} delay={i * 0.08}>
                  <div className={`bg-white border border-brand-line rounded-3xl p-8 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] ${color === "green" ? "before:bg-brand-green" : "before:bg-brand-orange"}`} data-testid={testid}>
                    <div className={`font-display text-5xl font-bold leading-none mb-3 ${color === "green" ? "text-brand-green" : "text-brand-orange"}`}>{metric}</div>
                    <h3 className="font-display text-lg font-bold text-brand-ink mb-2">{title}</h3>
                    <p className="text-sm text-brand-muted leading-relaxed">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── S6: DEMO FORM ── */}
        <section id="lp-demo" className="bg-brand-deep py-20 sm:py-28 scroll-mt-20" data-testid="comparison-lp-demo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-start">
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5">The switch is easier than you think</span>
              <h2 className="font-display text-4xl font-bold text-white leading-[1.1] mb-4">Compare MyGenie With Your Current POS — Free Demo</h2>
              <p className="text-lg text-[#a3b8ac] mb-10">A specialist will show you exactly how MyGenie works for your outlet.</p>
              <div className="space-y-3">
                {[
                  { title: "Go live in 48 hours",          sub: "Full migration included for all plans" },
                  { title: "Live comparison walkthrough",  sub: "We show you MyGenie vs your current POS side by side" },
                  { title: "No contracts, no pressure",    sub: "Cancel anytime. Your data is always yours." },
                ].map(({ title, sub }, i) => (
                  <div key={title} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4" data-testid={`comparison-switch-badge-${i}`}>
                    <div className="w-9 h-9 bg-brand-green/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-brand-green" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{title}</div>
                      <div className="text-xs text-[#a3b8ac] mt-0.5">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="comparison-lp-form-wrap">
                <DemoForm sector="pos-comparison" shortForm />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── S7: FAQ ── */}
        <section className="bg-white py-16 sm:py-24" data-testid="comparison-lp-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-brand-ink mb-10 text-center">Your questions, answered.</h2>
            </Reveal>
            <div>{FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} testid={f.testid} />)}</div>
          </div>
        </section>

        {/* ── S8: RISK REVERSAL BAND ── */}
        <div className="bg-brand-sand border-y border-brand-line py-10" data-testid="comparison-lp-risk-band">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="font-display text-2xl font-bold text-brand-ink mb-6">No Contracts. No Hidden Costs. No Lock-In.</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { title: "No annual contracts", body: "Cancel anytime. No questions, no exit fees." },
                { title: "Transparent pricing",  body: "₹799/outlet/month, all inclusive. No add-on surprises." },
                { title: "Your data is yours",   body: "Export everything at any time. We don't hold your data hostage." },
              ].map(({ title, body }, i) => (
                <div key={title} className="bg-white border border-brand-line rounded-2xl px-6 py-5 flex-1 min-w-[200px] max-w-[280px]" data-testid={`comparison-risk-item-${i}`}>
                  <div className="text-sm font-bold text-brand-ink mb-1">{title}</div>
                  <div className="text-sm text-brand-muted">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
      <LandingFooter />
    </div>
  );
}
