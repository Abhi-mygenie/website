import Logo from "@/components/site/Logo";
import DemoForm from "@/components/site/DemoForm";
import Seo from "@/components/site/Seo";
import Reveal from "@/components/site/Reveal";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc } from "@/lib/cms/CmsProvider";
import { PAGE_SEO } from "@/lib/seo";

// ─── Shared minimal Navbar ────────────────────────────────────────────────────
function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="demo-landing-navbar">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[72px] flex items-center">
        <Logo />
      </div>
    </header>
  );
}

// ─── Shared minimal Footer ────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="demo-landing-footer">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo light />
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd. All rights reserved.</span>
      </div>
    </footer>
  );
}

// ─── Micro-proof card ────────────────────────────────────────────────────────
function ProofCard({ value, label, accent = false }) {
  return (
    <div className={`flex-1 rounded-2xl border p-4 text-center ${accent ? "border-brand-orange bg-brand-orange/5" : "border-brand-line bg-white"}`}>
      <div className={`text-2xl font-extrabold ${accent ? "text-brand-orange" : "text-brand-deep"}`}>{value}</div>
      <div className="text-xs text-brand-muted mt-1 leading-snug">{label}</div>
    </div>
  );
}

// ─── Trust logo strip ────────────────────────────────────────────────────────
const TRUST_NAMES = ["Hyatt Centric", "Palm Forest Resort", "Love Bites", "The Mill Bakery", "Aanya's Kitchen"];

// ─── Fallback CMS content ────────────────────────────────────────────────────
const DEMO_DEFAULTS = {
  eyebrow: "Free · 45 min · No commitment",
  headline: "See MyGenie live — built for your restaurant",
  subline: "A specialist walks you through exactly how it works for your outlet type. No slides, no sales pitch.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DemoLanding() {
  const doc = useContentDoc("demo", DEMO_DEFAULTS);
  const seo = PAGE_SEO["/demo"] || {};

  return (
    <div className="min-h-screen bg-[#f6f8f5]" data-testid="demo-landing-page">
      <Seo
        title={seo.title}
        description={seo.description}
        canonical="/demo"
        noindex={true}
      />

      <LandingNavbar />

      <main className="pt-[72px]">
        {/* ── Hero + Form ──────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">

          {/* Left: copy */}
          <div className="mb-8 lg:mb-0 lg:sticky lg:top-24">
            {/* Eyebrow */}
            <span className="inline-block bg-brand-orange/10 text-brand-orange text-xs font-bold px-3 py-1 rounded-full mb-4" data-testid="demo-eyebrow">
              <EditableText id="demo.eyebrow" fallback={doc.eyebrow ?? DEMO_DEFAULTS.eyebrow} />
            </span>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-deep leading-tight mb-4" data-testid="demo-headline">
              <EditableText id="demo.headline" fallback={doc.headline ?? DEMO_DEFAULTS.headline} block />
            </h1>

            {/* Sub */}
            <p className="text-base text-brand-muted leading-relaxed mb-8" data-testid="demo-subline">
              <EditableText id="demo.subline" fallback={doc.subline ?? DEMO_DEFAULTS.subline} multiline />
            </p>

            {/* 3 micro-proofs */}
            <Reveal>
              <div className="flex gap-3 mb-8">
                <ProofCard value="₹1L+" label="leakage caught in 2 weeks" />
                <ProofCard value="48hr" label="from sign-up to first bill" />
                <ProofCard value="+18%" label="avg bill via AI upsell" accent />
              </div>
            </Reveal>

            {/* What you'll see */}
            <Reveal>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#5B7A68]">In your 45-min walkthrough</p>
                {[
                  ["Live billing demo", "We bill a real order on your outlet type — QSR, café, or full-service.", false],
                  ["Your leakage report", "We show you exactly where money is leaving your current setup.", true],
                  ["AI features live", "Smart upsell, audit assistant, and customer win-back — in action.", false],
                  ["Your pricing", "Transparent quote built for your outlet count and city. No surprises.", false],
                ].map(([title, desc, highlight]) => (
                  <div key={title} className="flex gap-3 items-start">
                    <span className="mt-1 w-5 h-5 rounded-full bg-brand-green/15 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <div>
                      <span className={`text-sm font-semibold ${highlight ? "text-brand-orange" : "text-brand-deep"}`}>{title} — </span>
                      <span className="text-sm text-brand-muted">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right: form — visible above fold on mobile, no entrance delay */}
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-6 sm:p-8" data-testid="demo-form-card">
            <DemoForm sector="meta-demo" />
          </div>
        </section>

        {/* ── Trust strip ──────────────────────────────────────────────── */}
        <Reveal>
          <section className="bg-brand-deep mt-4" data-testid="demo-trust-strip">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5B7A68] mb-4">Running on MyGenie</p>
              <div className="flex flex-wrap gap-2">
                {TRUST_NAMES.map((name) => (
                  <span key={name} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#9DB1A4] font-medium">
                    {name}
                  </span>
                ))}
                <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#9DB1A4] font-medium">
                  +500 outlets across 75 cities
                </span>
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      <LandingFooter />
    </div>
  );
}
