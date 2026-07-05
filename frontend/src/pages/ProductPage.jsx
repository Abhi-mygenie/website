import { useParams, Navigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, Check, Quote } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import FaqItem from "@/components/site/FaqItem";
import FeatureVideo from "@/components/site/FeatureVideo";
import Seo from "@/components/site/Seo";
import { SITE_URL } from "@/lib/seo";
import { PRODUCT_PAGES, PRODUCT_ORDER } from "@/data/products";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { EditableFaqList } from "@/components/cms/FaqEditor";
import { useContent, useContentDoc } from "@/lib/cms/CmsProvider";
import { mergeByIndex } from "@/lib/cms/mergeUtils";

const productDisplay = (p) => ({
  hero: { eyebrow: p.eyebrow, h1: p.h1, sub: p.sub },
  metric: { value: p.metric.value, label: p.metric.label },
  video: { videoUrl: p.videoUrl || "", poster: p.poster || "" },
  modules: p.modules.map(({ name, outcome, caps }) => ({ name, outcome, caps })), // icon NOT editable
  proof: p.proof.map(({ metric, headline, quote, client }) => ({ metric, headline, quote, client })),
});

const MODULE_FIELDS = [
  { key: "name", label: "Module name" },
  { key: "outcome", label: "Outcome (one-liner)", type: "textarea" },
  { key: "caps", label: "Capabilities (one per line)", type: "lines" },
];
const PROOF_FIELDS = [
  { key: "metric", label: "Metric (e.g. '22%')" },
  { key: "headline", label: "Headline" },
  { key: "quote", label: "Quote", type: "textarea" },
  { key: "client", label: "Client name" },
];

export default function ProductPage() {
  const { bucket } = useParams();
  const p = PRODUCT_PAGES[bucket];

  const docKey = bucket ? `product.${bucket}` : "product.__missing";
  const fallback = p ? productDisplay(p) : { hero: {}, metric: {}, video: {}, modules: [], proof: [] };
  const doc = useContentDoc(docKey, fallback);
  const modulesRaw = useContent(`${docKey}.modules`, null);
  const proofRaw = useContent(`${docKey}.proof`, null);

  if (!p) return <Navigate to="/" replace />;

  const HeroIcon = Icons[p.icon] || Icons.Box;
  const others = PRODUCT_ORDER.filter((x) => x !== bucket);
  const MODULES_M = mergeByIndex(p.modules, modulesRaw, ["icon"]);
  const PROOF_M = mergeByIndex(p.proof, proofRaw);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: p.title, item: `${SITE_URL}/product/${bucket}` },
    ],
  };

  return (
    <div className="bg-white" data-testid="product-page">
      <Seo title={`${p.title} | MyGenie POS Features`} description={p.sub} path={`/product/${bucket}`} jsonLd={[faqJsonLd, breadcrumbJsonLd]} />
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden" data-testid="product-hero">
          <div className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-brand-green/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Link to="/#modules" className="text-sm font-semibold text-brand-muted hover:text-brand-green">← All products</Link>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-green/10 text-brand-greenDark px-4 py-1.5 text-sm font-semibold">
                <HeroIcon className="w-4 h-4" />
                <EditableText id={`${docKey}.hero.eyebrow`} fallback={doc.hero.eyebrow} />
              </span>
              <h1 className="font-display mt-5 text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-brand-ink">
                <EditableText id={`${docKey}.hero.h1`} fallback={doc.hero.h1} block />
              </h1>
              <p className="mt-5 text-lg text-brand-muted leading-relaxed max-w-xl">
                <EditableText id={`${docKey}.hero.sub`} fallback={doc.hero.sub} multiline />
              </p>
              <a href="#product-demo" data-testid="product-hero-cta" className="group mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]">
                Book a Free Demo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <Reveal>
              <div className="relative rounded-[2rem] overflow-hidden bg-brand-deep p-10 min-h-[420px] flex flex-col justify-between">
                <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-green/25 blur-3xl" />
                <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-brand-orange/15 blur-3xl" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-brand-green/20 flex items-center justify-center">
                    <HeroIcon className="w-10 h-10 text-brand-green" />
                  </div>
                  <p className="font-display text-2xl font-bold text-white mt-6 max-w-xs leading-snug">{p.title}, built in.</p>
                </div>
                <div className="relative bg-white rounded-2xl px-6 py-5 inline-block w-fit">
                  <p className="font-display text-4xl font-bold text-brand-green leading-none">
                    <EditableText id={`${docKey}.metric.value`} fallback={doc.metric.value} />
                  </p>
                  <p className="text-sm text-brand-muted mt-1 max-w-[200px]">
                    <EditableText id={`${docKey}.metric.label`} fallback={doc.metric.label} multiline />
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* VIDEO SLOT — videoUrl/poster editable through the CMS */}
        <section className="pb-4" data-testid="product-video">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <EditableList
                id={`${docKey}.video`}
                fallback={[{ videoUrl: doc.video.videoUrl || "", poster: doc.video.poster || "" }]}
                fields={[
                  { key: "videoUrl", label: "Video URL or upload (mp4/webm or YouTube/Vimeo)", type: "image" },
                  { key: "poster", label: "Poster image", type: "image" },
                ]}
                lockItems
                render={(items) => {
                  const it = items[0] || {};
                  return <FeatureVideo src={it.videoUrl || null} poster={it.poster || null} title={`See ${p.title} in action`} />;
                }}
              />
            </Reveal>
          </div>
        </section>

        {/* MODULES */}
        <section className="py-20 sm:py-24" data-testid="product-modules">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">What&apos;s inside</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">{p.title} — every tool, a business outcome.</h2>
            </Reveal>
            <EditableList
              id={`${docKey}.modules`}
              fallback={doc.modules}
              fields={MODULE_FIELDS}
              lockItems
              render={() => (
                <div className="mt-10 grid md:grid-cols-2 gap-5">
                  {MODULES_M.map((m, i) => {
                    const Icon = Icons[m.icon] || Icons.Check;
                    const orange = i % 2 === 1;
                    return (
                      <Reveal key={i} delay={i * 0.04}>
                        <div className="h-full bg-white rounded-2xl border border-brand-line p-7 hover:shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all" data-testid={`product-module-${i}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${orange ? "bg-brand-orange/10" : "bg-brand-green/10"}`}>
                              <Icon className={`w-6 h-6 ${orange ? "text-brand-orange" : "text-brand-green"}`} />
                            </div>
                            <h3 className="font-display text-xl font-semibold text-brand-ink">{m.name}</h3>
                          </div>
                          <p className="mt-3 text-brand-ink font-medium">{m.outcome}</p>
                          <ul className="mt-4 space-y-2">
                            {(m.caps || []).map((c, ci) => (
                              <li key={ci} className="flex gap-2 text-sm text-brand-muted">
                                <Check className={`w-4 h-4 shrink-0 mt-0.5 ${orange ? "text-brand-orange" : "text-brand-green"}`} strokeWidth={3} /> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </section>

        {/* PROOF */}
        <section className="py-20 bg-brand-deep text-brand-sand" data-testid="product-proof">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal><h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">Real results.</h2></Reveal>
            <EditableList
              id={`${docKey}.proof`}
              fallback={doc.proof}
              fields={PROOF_FIELDS}
              lockItems
              render={() => (
                <div className="mt-10 grid md:grid-cols-2 gap-6">
                  {PROOF_M.map((t, i) => (
                    <Reveal key={i} delay={i * 0.08}>
                      <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-8" data-testid={`product-proof-${i}`}>
                        <span className="font-display text-5xl font-bold text-brand-yellow leading-none">{t.metric}</span>
                        <p className="font-display text-lg font-semibold text-white mt-2">{t.headline}</p>
                        <Quote className="w-7 h-7 text-white/15 mt-4" />
                        <p className="text-[#C7D2CB] leading-relaxed mt-2">{t.quote}</p>
                        <p className="mt-5 pt-4 border-t border-white/10 font-semibold text-white">{t.client}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24" data-testid="product-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal><h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight text-center">{p.title} — your questions, answered.</h2></Reveal>
            <div className="mt-8">
              <EditableFaqList
                id={`${docKey}.faqs`}
                fallback={p.faqs}
                render={(items) => (
                  <div>
                    {items.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} details={f.details} media={f.media} links={f.links} testid={`product-faq-${i}`} />)}
                  </div>
                )}
              />
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="product-demo" className="py-20 sm:py-24 bg-brand-sand" data-testid="product-demo-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">See {p.title} on your own data.</h2>
                <p className="mt-4 text-lg text-brand-muted leading-relaxed">Book a walkthrough and we&apos;ll show you exactly how it works for your business.</p>
                <div className="mt-8">
                  <p className="text-sm font-semibold uppercase tracking-widest text-brand-muted mb-4">Explore more products</p>
                  <div className="flex flex-wrap gap-2">
                    {others.map((o) => (
                      <Link key={o} to={`/product/${o}`} className="rounded-full bg-white border border-brand-line px-4 py-2 text-sm font-medium text-brand-ink hover:border-brand-green hover:text-brand-green transition-all" data-testid={`product-related-${o}`}>
                        {PRODUCT_PAGES[o].title}
                      </Link>
                    ))}
                  </div>
                </div>
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
