import * as Icons from "lucide-react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, SITE_URL } from "@/lib/seo";
import { MODULE_BUCKETS } from "@/data/content";
import { EditableText } from "@/components/cms/Editable";

export default function ProductIndex() {
  const seo = PAGE_SEO["/product"];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    url: `${SITE_URL}/product`,
    hasPart: MODULE_BUCKETS.map((b) => ({ "@type": "WebPage", name: b.title, url: `${SITE_URL}/product/${b.slug}` })),
  };

  return (
    <div className="bg-white" data-testid="product-index">
      <Seo title={seo.title} description={seo.description} path="/product" jsonLd={jsonLd} />
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden" data-testid="product-index-hero">
          <div className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-brand-green/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 text-brand-greenDark px-4 py-1.5 text-sm font-semibold">
                <Icons.LayoutGrid className="w-4 h-4" />
                <EditableText id="product.index.hero.eyebrow" fallback="Everything in one app" />
              </span>
              <h1 className="font-display mt-5 text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-brand-ink">
                <EditableText id="product.index.hero.h1" fallback="Every tool your business needs — in one operating system." block />
              </h1>
              <p className="mt-5 text-lg text-brand-muted leading-relaxed max-w-xl">
                <EditableText id="product.index.hero.sub" fallback="From billing and the kitchen screen to inventory, loyalty and the owner dashboard — explore everything MyGenie does, grouped by the outcome it drives for you." multiline rich />
              </p>
              <a href="#product-index-demo" data-testid="product-index-hero-cta" className="group mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]">
                <EditableText id="product.index.hero.cta" fallback="Book a Free Demo" /> <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <Reveal>
              <div className="relative rounded-[2rem] overflow-hidden bg-brand-deep p-10 min-h-[420px] flex flex-col justify-between">
                <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-green/25 blur-3xl" />
                <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-brand-orange/15 blur-3xl" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-brand-green/20 flex items-center justify-center">
                    <Icons.Smartphone className="w-10 h-10 text-brand-green" />
                  </div>
                  <p className="font-display text-2xl font-bold text-white mt-6 max-w-xs leading-snug">
                    Billing, kitchen, inventory, customers — one login.
                  </p>
                </div>
                <div className="relative bg-white rounded-2xl px-6 py-5 inline-block w-fit">
                  <p className="font-display text-4xl font-bold text-brand-green leading-none">No feature upsells</p>
                  <p className="text-sm text-brand-muted mt-1 max-w-[220px]">core tools included on every plan</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* MODULE BUCKETS GRID */}
        <section className="py-20 sm:py-24 bg-brand-sand" data-testid="product-index-grid">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">What&apos;s inside</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">Built around outcomes, not feature lists.</h2>
              <p className="mt-3 text-lg text-brand-muted max-w-2xl">Five capability areas that run your whole operation. Open any one to go deeper.</p>
            </Reveal>
            <div className="mt-10 grid md:grid-cols-2 gap-5">
              {MODULE_BUCKETS.map((b, i) => {
                const Icon = Icons[b.icon] || Icons.Box;
                const orange = i % 2 === 1;
                return (
                  <Reveal key={b.slug} delay={(i % 2) * 0.05}>
                    <Link to={`/product/${b.slug}`} data-testid={`product-card-${b.slug}`} className="group h-full flex flex-col bg-white rounded-2xl border border-brand-line p-7 hover:shadow-[0_14px_34px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${orange ? "bg-brand-orange/10" : "bg-brand-green/10"}`}>
                          <Icon className={`w-6 h-6 ${orange ? "text-brand-orange" : "text-brand-green"}`} />
                        </div>
                        <h3 className="font-display text-xl font-semibold text-brand-ink">{b.title}</h3>
                      </div>
                      <p className="mt-3 text-brand-muted leading-relaxed">{b.line}</p>
                      <div className="mt-4 flex flex-wrap gap-2 flex-1 content-start">
                        {b.items.map((it) => (
                          <span key={it} className="inline-flex items-center gap-1 rounded-full bg-brand-sand border border-brand-line px-3 py-1 text-[12px] font-medium text-brand-ink">
                            <Check className={`w-3 h-3 ${orange ? "text-brand-orange" : "text-brand-green"}`} strokeWidth={3} /> {it}
                          </span>
                        ))}
                      </div>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green">
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
        <section id="product-index-demo" className="py-20 sm:py-24" data-testid="product-index-demo-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">See it on your data</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">Book a walkthrough of the full platform.</h2>
                <p className="mt-4 text-lg text-brand-muted leading-relaxed">We&apos;ll show you exactly how MyGenie works end to end — billing, kitchen, inventory, customers and reporting.</p>
                <Link to="/solutions" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green" data-testid="product-to-solutions">
                  Or find the solution for your business <ArrowRight className="w-4 h-4" />
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
