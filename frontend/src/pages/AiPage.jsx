import * as Icons from "lucide-react";
import { ArrowRight, Sparkles, Check, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import FaqItem from "@/components/site/FaqItem";
import FeatureVideo from "@/components/site/FeatureVideo";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, SITE_URL } from "@/lib/seo";
import { AI_FEATURES, AI_FAQS } from "@/data/ai";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { EditableFaqList } from "@/components/cms/FaqEditor";
import { useContentDoc } from "@/lib/cms/CmsProvider";

// Display projections — only fields that are editable through the CMS.
// Code-controlled fields (id, icon) are preserved by mergeById below.
const AI_FEATURE_DISPLAY = AI_FEATURES.map(({ id, title, pain, solution, outcome, videoSrc, poster }) => ({
  id,
  title,
  pain,
  solution,
  outcome: { value: outcome?.value || "", label: outcome?.label || "" },
  videoSrc: videoSrc || "",
  poster: poster || "",
}));

const FEATURE_FIELDS = [
  { key: "title", label: "Title" },
  { key: "pain", label: "The problem", type: "textarea" },
  { key: "solution", label: "What the AI does", type: "textarea" },
  { key: "outcome.value", label: "Outcome metric (e.g. '+18%')" },
  { key: "outcome.label", label: "Outcome label" },
  { key: "videoSrc", label: "Walkthrough video (upload mp4/webm or paste YouTube/Vimeo URL)", type: "image" },
  { key: "poster", label: "Video poster image", type: "image" },
];

const DEMO_BULLETS_FALLBACK = [
  "All AI features live in production today",
  "Works across single outlets and multi-outlet chains",
  "Practical outcomes — time, errors, money, customers",
];

// Match published overrides onto the static array by id; code-controlled
// fields (icon) and id itself are preserved regardless of CMS contents.
function mergeFeatures(base, overrides) {
  if (!Array.isArray(overrides)) return base;
  const map = new Map(overrides.map((o) => [o.id, o]));
  return base.map((b) => {
    const o = map.get(b.id);
    if (!o) return b;
    return {
      ...b,
      title: o.title ?? b.title,
      pain: o.pain ?? b.pain,
      solution: o.solution ?? b.solution,
      outcome: { ...b.outcome, value: o.outcome?.value ?? b.outcome?.value, label: o.outcome?.label ?? b.outcome?.label },
      videoSrc: o.videoSrc || b.videoSrc || null,
      poster: o.poster || b.poster || null,
    };
  });
}

export default function AiPage() {
  const seo = PAGE_SEO["/ai"];

  // Per-page JSON doc: hero + section copy live under one "ai" key so a
  // single publish takes the whole page live (Phase 2 framework addition #3).
  const aiDoc = useContentDoc("ai", {
    hero: {
      eyebrow: "Practical AI",
      h1: "AI that works on the floor — not in a pitch deck.",
      sub: "MyGenie uses practical AI to save you time, cut errors, understand your customers and protect your profit. No hype, no buzzwords — just outcomes you can see in your reports. Every feature below is live in production today.",
      cta: "Book a Free Demo",
    },
    crosslink: {
      title: "Running multiple outlets or a franchise?",
      body: "Central Inventory adds AI-driven reordering, inter-outlet transfers and cross-outlet variance detection — one stock brain for every location.",
      cta: "Explore Central Inventory",
    },
    faq_heading: "Practical AI — your questions, answered.",
    demo: {
      heading: "See MyGenie's AI on your own data.",
      sub: "Book a walkthrough and we'll show you exactly how each AI feature works for your business — live, not a slide deck.",
    },
  });

  // Helper: write under a stable per-field key so EditableText keeps using
  // the existing per-key save flow. The doc above provides the read-side
  // merge so a single per-page doc is the eventual canonical store.
  const heroId = (k) => `ai.hero.${k}`;
  const linkId = (k) => `ai.crosslink.${k}`;
  const demoId = (k) => `ai.demo.${k}`;

  const featuresOverride = useContentDoc("ai.features", null);
  const FEATURES_M = mergeFeatures(AI_FEATURES, featuresOverride);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: AI_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Practical AI", item: `${SITE_URL}/ai` },
    ],
  };

  return (
    <div className="bg-white" data-testid="ai-page">
      <Seo title={seo.title} description={seo.description} path="/ai" jsonLd={[faqJsonLd, breadcrumbJsonLd]} />
      <Navbar />
      <main>
        {/* HERO */}
        <section className="bg-brand-deep text-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden" data-testid="ai-hero">
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-brand-green/20 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-[360px] h-[360px] rounded-full bg-brand-orange/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-yellow">
              <Sparkles className="w-4 h-4" />
              <EditableText id={heroId("eyebrow")} fallback={aiDoc.hero.eyebrow} />
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 tracking-tight max-w-4xl leading-[1.08]">
              <EditableText id={heroId("h1")} fallback={aiDoc.hero.h1} block />
            </h1>
            <p className="mt-5 text-lg text-[#C7D2CB] leading-relaxed max-w-2xl">
              <EditableText id={heroId("sub")} fallback={aiDoc.hero.sub} multiline rich />
            </p>
            <a href="#ai-demo" data-testid="ai-hero-cta" className="group mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5">
              <EditableText id={heroId("cta")} fallback={aiDoc.hero.cta} />
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>

        {/* FEATURE BLOCKS */}
        <section className="py-20 sm:py-24" data-testid="ai-features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 lg:space-y-28">
            <EditableList
              id="ai.features"
              fallback={AI_FEATURE_DISPLAY}
              fields={FEATURE_FIELDS}
              lockItems
              render={() => (
                <div className="space-y-20 lg:space-y-28">
                  {FEATURES_M.map((f, i) => {
                    const Icon = Icons[f.icon] || Sparkles;
                    const flip = i % 2 === 1;
                    return (
                      <Reveal key={f.id}>
                        <div id={f.id} className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center scroll-mt-28" data-testid={`ai-feature-${f.id}`}>
                          {/* Video */}
                          <div className={flip ? "lg:order-2" : ""}>
                            <FeatureVideo src={f.videoSrc} poster={f.poster} title={`${f.title} in action`} />
                          </div>
                          {/* Copy */}
                          <div className={flip ? "lg:order-1" : ""}>
                            <span className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-brand-green" />
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-4 text-brand-ink tracking-tight">{f.title}</h2>
                            <p className="mt-4 text-brand-muted leading-relaxed">
                              <span className="font-semibold text-brand-orange">The problem: </span>{f.pain}
                            </p>
                            <p className="mt-3 text-brand-ink leading-relaxed">
                              <span className="font-semibold text-brand-green">What the AI does: </span>{f.solution}
                            </p>
                            <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-brand-sand px-5 py-3">
                              <span className="font-display text-3xl font-bold text-brand-green leading-none">{f.outcome?.value}</span>
                              <span className="text-sm text-brand-muted">{f.outcome?.label}</span>
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </section>

        {/* CENTRAL INVENTORY CROSS-LINK (franchise) */}
        <section className="pb-20" data-testid="ai-central-inventory-link">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] bg-brand-sand border border-brand-line p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0"><Warehouse className="w-6 h-6 text-brand-orange" /></span>
                <div>
                  <h3 className="font-display text-xl font-bold text-brand-ink">
                    <EditableText id={linkId("title")} fallback={aiDoc.crosslink.title} />
                  </h3>
                  <p className="text-brand-muted mt-1 max-w-xl">
                    <EditableText id={linkId("body")} fallback={aiDoc.crosslink.body} multiline />
                  </p>
                </div>
              </div>
              <Link to="/product/central-inventory" data-testid="ai-to-central-inventory" className="shrink-0 inline-flex items-center gap-2 font-semibold text-brand-green hover:underline">
                <EditableText id={linkId("cta")} fallback={aiDoc.crosslink.cta} />
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24 bg-brand-sand" data-testid="ai-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight text-center">
                <EditableText id="ai.faq_heading" fallback={aiDoc.faq_heading} />
              </h2>
            </Reveal>
            <div className="mt-8">
              <EditableFaqList
                id="ai.faqs"
                fallback={AI_FAQS}
                render={(items) => (
                  <div>
                    {items.map((f, i) => (
                      <FaqItem
                        key={i}
                        q={f.q}
                        a={f.a}
                        details={f.details}
                        media={f.media}
                        links={f.links}
                        testid={`ai-faq-${i}`}
                      />
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="ai-demo" className="py-20 sm:py-24" data-testid="ai-demo-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">
                  <EditableText id={demoId("heading")} fallback={aiDoc.demo.heading} block />
                </h2>
                <p className="mt-4 text-lg text-brand-muted leading-relaxed">
                  <EditableText id={demoId("sub")} fallback={aiDoc.demo.sub} multiline />
                </p>
                <EditableList
                  id="ai.demo.bullets"
                  fallback={DEMO_BULLETS_FALLBACK.map((b) => ({ text: b }))}
                  fields={[{ key: "text", label: "Bullet text" }]}
                  render={(items) => (
                    <ul className="mt-6 space-y-3">
                      {items.map((b, i) => (
                        <li key={i} className="flex gap-2 text-brand-ink"><Check className="w-5 h-5 text-brand-green shrink-0" strokeWidth={3} /> {b.text}</li>
                      ))}
                    </ul>
                  )}
                />
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
