import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, SITE_URL } from "@/lib/seo";
import { SECTORS } from "@/data/content";
import { EditableText } from "@/components/cms/Editable";

const STATS = [
  { value: "Up to 25%", label: "more profit" },
  { value: "₹1 Lakh", label: "leakage caught in 2 weeks" },
  { value: "30%", label: "faster service" },
];

export default function SolutionsIndex() {
  const seo = PAGE_SEO["/solutions"];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    url: `${SITE_URL}/solutions`,
    hasPart: SECTORS.map((s) => ({ "@type": "WebPage", name: s.name, url: `${SITE_URL}/solutions/${s.slug}` })),
  };

  return (
    <div className="bg-white" data-testid="solutions-index">
      <Seo title={seo.title} description={seo.description} path="/solutions" jsonLd={jsonLd} />
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden" data-testid="solutions-hero">
          <div className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-brand-green/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 text-brand-orange px-4 py-1.5 text-sm font-semibold">
                <Icons.Layers className="w-4 h-4" />
                <EditableText id="solutions.index.hero.eyebrow" fallback="The Hospitality Operating System" />
              </span>
              <h1 className="font-display mt-5 text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-brand-ink">
                <EditableText id="solutions.index.hero.h1" fallback="One POS for every kind of hospitality business." block />
              </h1>
              <p className="mt-5 text-lg text-brand-muted leading-relaxed max-w-xl">
                <EditableText id="solutions.index.hero.sub" fallback="Restaurants, cafés, cloud kitchens, hotels, food courts, bars and more — MyGenie runs billing, kitchen, inventory, customers and reporting tuned to your exact format. Pick yours below." multiline rich />
              </p>
              <a href="#solutions-demo" data-testid="solutions-hero-cta" className="group mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]">
                <EditableText id="solutions.index.hero.cta" fallback="Book a Free Demo" /> <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <Reveal>
              <div className="relative rounded-[2rem] overflow-hidden bg-brand-deep p-10 min-h-[420px] flex flex-col justify-between">
                <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-green/25 blur-3xl" />
                <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-brand-orange/15 blur-3xl" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-brand-green/20 flex items-center justify-center">
                    <Icons.Store className="w-10 h-10 text-brand-green" />
                  </div>
                  <p className="font-display text-2xl font-bold text-white mt-6 max-w-xs leading-snug">
                    {SECTORS.length}+ formats. One platform.
                  </p>
                </div>
                <div className="relative grid grid-cols-3 gap-3">
                  {STATS.map((st) => (
                    <div key={st.label} className="bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-4">
                      <p className="font-display text-2xl font-bold text-brand-yellow leading-none">{st.value}</p>
                      <p className="text-[12px] text-[#C7D2CB] mt-1.5 leading-snug">{st.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* SECTORS GRID */}
        <section className="py-20 sm:py-24 bg-brand-sand" data-testid="solutions-grid">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-green">Find your fit</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">Choose your kind of business.</h2>
              <p className="mt-3 text-lg text-brand-muted max-w-2xl">Each solution is built around how that format really runs — see the page made for you.</p>
            </Reveal>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SECTORS.map((s, i) => {
                const Icon = Icons[s.icon] || Icons.Store;
                const orange = i % 2 === 1;
                return (
                  <Reveal key={s.slug} delay={(i % 3) * 0.05}>
                    <Link to={`/solutions/${s.slug}`} data-testid={`solutions-card-${s.slug}`} className="group h-full flex flex-col bg-white rounded-2xl border border-brand-line p-6 hover:shadow-[0_14px_34px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all">
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${orange ? "bg-brand-orange/10" : "bg-brand-green/10"}`}>
                        <Icon className={`w-6 h-6 ${orange ? "text-brand-orange" : "text-brand-green"}`} />
                      </span>
                      <h3 className="font-display text-xl font-semibold mt-4 text-brand-ink">{s.name}</h3>
                      <p className="text-brand-muted mt-1.5 leading-relaxed text-[15px] flex-1">{s.line}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green">
                        Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="solutions-demo" className="py-20 sm:py-24" data-testid="solutions-demo-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">See it for your business</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">Get a walkthrough built for your format.</h2>
                <p className="mt-4 text-lg text-brand-muted leading-relaxed">Tell us your kind of business and we&apos;ll show you exactly how MyGenie works for you — not a generic demo.</p>
                <Link to="/product" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green" data-testid="solutions-to-product">
                  Or explore everything MyGenie does <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}><DemoForm /></Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
