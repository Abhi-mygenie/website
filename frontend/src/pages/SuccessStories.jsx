import { useState } from "react";
import React from "react";
import { Link } from "react-router-dom";
import { Quote, ArrowRight } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, SITE_URL } from "@/lib/seo";
import { STORIES, STORY_SECTORS, STORY_STATS } from "@/data/stories";

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",             item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Customer Stories", item: `${SITE_URL}/customers` },
  ],
};
import { EditableList } from "@/components/cms/Editable";

export default function SuccessStories() {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? STORIES : STORIES.filter((s) => s.sector === filter);

  return (
    <div className="bg-white" data-testid="stories-page">
      <Seo title={PAGE_SEO["/customers"].title} description={PAGE_SEO["/customers"].description} path="/customers" jsonLd={[BREADCRUMB_JSONLD]} />
      <Navbar />
      <main>
        {/* HERO + STATS */}
        <section className="pt-32 pb-16 lg:pt-40" data-testid="stories-hero">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">Customer stories</span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">Owners don&apos;t just like MyGenie. They count the difference.</h1>
              <p className="mt-4 text-lg text-brand-muted">Real results from real hospitality businesses — across restaurants, cafés, QSRs, resorts, canteens and chains.</p>
            </div>
            <div className="mt-12">
              <EditableList
                id="customers.stats"
                fallback={STORY_STATS}
                fields={[
                  { key: "value", label: "Value (e.g. 250+)" },
                  { key: "label", label: "Label" },
                ]}
                lockItems
                render={(items) => (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((s, i) => (
                      <div key={s.label} className="text-center" data-testid={`stories-stat-${i}`}>
                        <p className={`font-display text-3xl sm:text-4xl font-bold leading-none ${i % 2 === 1 ? "text-brand-orange" : "text-brand-green"}`}>{s.value}</p>
                        <p className="text-sm text-brand-muted mt-2">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>
            <p className="text-xs text-brand-muted mt-4">Since August 2024</p>
          </div>
        </section>

        {/* FILTER + GRID */}
        <section className="pb-24" data-testid="stories-grid">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 mb-10" data-testid="stories-filters">
              {STORY_SECTORS.map((sec) => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => setFilter(sec)}
                  data-testid={`stories-filter-${sec.toLowerCase().replace(/[^a-z]/g, "-")}`}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${filter === sec ? "bg-brand-green text-white shadow-[0_8px_20px_rgba(24,168,74,0.25)]" : "bg-brand-sand text-brand-ink hover:bg-brand-green/10"}`}
                >
                  {sec}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((t, i) => (
                <React.Fragment key={t.client}>
                  <Reveal delay={(i % 3) * 0.06}>
                    <div className="h-full bg-white rounded-3xl border border-brand-line p-8 flex flex-col hover:shadow-[0_18px_44px_rgba(0,0,0,0.07)] transition-all" data-testid={`story-card-${i}`}>
                      <span className={`font-display text-5xl font-bold leading-none ${i % 2 === 1 ? "text-brand-orange" : "text-brand-green"}`}>{t.metric}</span>
                      <p className="font-display text-lg font-semibold text-brand-ink mt-2">{t.headline}</p>
                      <Quote className="w-7 h-7 text-brand-green/20 mt-5" />
                      <p className="text-brand-muted leading-relaxed mt-2 flex-1">{t.quote}</p>
                      <div className="mt-6 pt-5 border-t border-brand-line flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          {t.img ? (
                            <img src={t.img} alt={t.client} width={40} height={40} loading="lazy" className="w-10 h-10 rounded-full object-cover border border-brand-line" />
                          ) : (
                            <span className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center font-display font-bold text-brand-green">{t.client[0]}</span>
                          )}
                          <span className="font-semibold text-brand-ink">{t.client}</span>
                        </span>
                        <span className="text-xs font-medium text-brand-green bg-brand-green/10 rounded-full px-3 py-1">{t.sector}</span>
                      </div>
                    </div>
                  </Reveal>
                  {(i + 1) % 6 === 0 && i < shown.length - 1 && (
                    <div
                      className="rounded-3xl bg-brand-green text-white p-8 flex flex-col justify-between"
                      data-testid="stories-mid-cta"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-3">Join them</p>
                        <h3 className="font-display text-2xl font-bold">Your story could be next.</h3>
                        <p className="text-white/80 mt-2 leading-relaxed text-sm">
                          Book a free walkthrough — tailored to your outlet type.
                        </p>
                      </div>
                      <a
                        href="/#demo"
                        data-testid="stories-mid-cta-btn"
                        className="mt-6 inline-flex items-center gap-2 bg-white text-brand-green rounded-full px-5 py-3 font-semibold text-sm hover:bg-brand-sand transition-all"
                      >
                        Book a Free Demo <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24" data-testid="stories-cta">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] bg-brand-deep text-white p-10 sm:p-14 text-center relative overflow-hidden">
              <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-green/20 blur-3xl" />
              <h2 className="relative font-display text-3xl sm:text-4xl font-bold tracking-tight">Your story could be next.</h2>
              <p className="relative mt-3 text-[#C7D2CB] text-lg max-w-xl mx-auto">See exactly how MyGenie would work for your business — book a free, tailored walkthrough.</p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-4">
                <a href="/#demo" className="bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5" data-testid="stories-demo-btn">Book a Free Demo</a>
                <Link to="/roi" className="inline-flex items-center gap-2 border-2 border-white/25 text-white hover:bg-white/10 rounded-full px-7 py-3.5 font-semibold transition-all" data-testid="stories-roi-btn">
                  Calculate Your Savings <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <StickyMobileCta />
      <Footer />
    </div>
  );
}
