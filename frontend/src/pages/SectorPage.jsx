import { useParams, Navigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, Check, X, Quote } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import FaqItem from "@/components/site/FaqItem";
import Seo from "@/components/site/Seo";
import { SECTOR_PAGES, SECTOR_ORDER } from "@/data/sectors";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { EditableFaqList } from "@/components/cms/FaqEditor";
import { useContent, useContentDoc } from "@/lib/cms/CmsProvider";
import { mergeByIndex } from "@/lib/cms/mergeUtils";

// Display projections (only the fields admins can edit per the locked plan).
const sectorDisplay = (s) => ({
  hero: { eyebrow: s.eyebrow, h1: s.h1, sub: s.sub },
  metric: { value: s.metric.value, label: s.metric.label },
  pains: s.pains.map(({ title, desc }) => ({ title, desc })),
  solutions: s.solutions.map(({ title, desc }) => ({ title, desc })), // icon NOT editable
  proof: s.proof.map(({ metric, headline, quote, client }) => ({ metric, headline, quote, client })),
});

const PAIN_FIELDS = [
  { key: "title", label: "Title" },
  { key: "desc", label: "Description", type: "textarea" },
];
const SOLUTION_FIELDS = [
  { key: "title", label: "Title" },
  { key: "desc", label: "Description", type: "textarea" },
];
const PROOF_FIELDS = [
  { key: "metric", label: "Metric (e.g. '40%')" },
  { key: "headline", label: "Headline" },
  { key: "quote", label: "Quote", type: "textarea" },
  { key: "client", label: "Client name" },
];

export default function SectorPage() {
  const { slug } = useParams();
  const s = SECTOR_PAGES[slug];

  // Hooks must be unconditional — use a stable empty key when slug is invalid.
  const docKey = slug ? `sector.${slug}` : "sector.__missing";
  const fallback = s ? sectorDisplay(s) : { hero: {}, metric: {}, pains: [], solutions: [], proof: [] };
  const doc = useContentDoc(docKey, fallback);
  const painsRaw = useContent(`${docKey}.pains`, null);
  const solsRaw = useContent(`${docKey}.solutions`, null);
  const proofRaw = useContent(`${docKey}.proof`, null);

  if (!s) return <Navigate to="/" replace />;

  const HeroIcon = Icons[s.icon] || Icons.Store;
  const others = SECTOR_ORDER.filter((x) => x !== slug).slice(0, 4);
  const PAINS_M = mergeByIndex(s.pains, painsRaw);
  const SOLS_M = mergeByIndex(s.solutions, solsRaw, ["icon"]);
  const PROOF_M = mergeByIndex(s.proof, proofRaw);

  const seoTitle = `${s.name} POS System & Billing Software | MyGenie`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="bg-white" data-testid="sector-page">
      <Seo title={seoTitle} description={s.sub} path={`/solutions/${slug}`} jsonLd={faqJsonLd} />
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden" data-testid="sector-hero">
          <div className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-brand-green/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Link to="/#sectors" className="text-sm font-semibold text-brand-muted hover:text-brand-green">← All solutions</Link>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-orange/10 text-brand-orange px-4 py-1.5 text-sm font-semibold">
                <HeroIcon className="w-4 h-4" />
                <EditableText id={`${docKey}.hero.eyebrow`} fallback={doc.hero.eyebrow} />
              </span>
              <h1 className="font-display mt-5 text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-brand-ink">
                <EditableText id={`${docKey}.hero.h1`} fallback={doc.hero.h1} block />
              </h1>
              <p className="mt-5 text-lg text-brand-muted leading-relaxed max-w-xl">
                <EditableText id={`${docKey}.hero.sub`} fallback={doc.hero.sub} multiline />
              </p>
              <a href="#sector-demo" data-testid="sector-hero-cta" className="group mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]">
                Book a {s.name} Demo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                  <p className="font-display text-2xl font-bold text-white mt-6 max-w-xs leading-snug">{s.name} run better on MyGenie.</p>
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

        {/* PAINS */}
        <section className="py-20 bg-brand-sand" data-testid="sector-pains">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">We know {s.name.toLowerCase()} run on tight margins and split-second timing.</h2>
              <p className="mt-3 text-lg text-brand-muted">Here&apos;s what gets in the way — and what MyGenie fixes.</p>
            </Reveal>
            <EditableList
              id={`${docKey}.pains`}
              fallback={doc.pains}
              fields={PAIN_FIELDS}
              lockItems
              render={() => (
                <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {PAINS_M.map((p, i) => (
                    <Reveal key={i} delay={i * 0.05}>
                      <div className="h-full bg-white rounded-2xl border border-brand-line p-6" data-testid={`sector-pain-${i}`}>
                        <span className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center"><X className="w-5 h-5 text-brand-orange" /></span>
                        <h3 className="font-display text-lg font-semibold mt-3 text-brand-ink">{p.title}</h3>
                        <p className="text-sm text-brand-muted mt-1.5 leading-relaxed">{p.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            />
          </div>
        </section>

        {/* SOLUTIONS */}
        <section className="py-20 sm:py-24" data-testid="sector-solutions">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-green">How MyGenie solves it</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">Built for the way {s.name.toLowerCase()} actually work.</h2>
            </Reveal>
            <EditableList
              id={`${docKey}.solutions`}
              fallback={doc.solutions}
              fields={SOLUTION_FIELDS}
              lockItems
              render={() => (
                <div className="mt-10 grid sm:grid-cols-2 gap-5">
                  {SOLS_M.map((sol, i) => {
                    const Icon = Icons[sol.icon] || Icons.Check;
                    const orange = i % 2 === 1;
                    return (
                      <Reveal key={i} delay={i * 0.05}>
                        <div className="h-full flex gap-4 bg-white rounded-2xl border border-brand-line p-6 hover:shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all" data-testid={`sector-solution-${i}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${orange ? "bg-brand-orange/10" : "bg-brand-green/10"}`}>
                            <Icon className={`w-6 h-6 ${orange ? "text-brand-orange" : "text-brand-green"}`} />
                          </div>
                          <div>
                            <h3 className="font-display text-lg font-semibold text-brand-ink">{sol.title}</h3>
                            <p className="text-brand-muted mt-1 leading-relaxed">{sol.desc}</p>
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

        {/* PROOF */}
        <section className="py-20 bg-brand-deep text-brand-sand" data-testid="sector-proof">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">Real {s.name.toLowerCase()} results.</h2>
            </Reveal>
            <EditableList
              id={`${docKey}.proof`}
              fallback={doc.proof}
              fields={PROOF_FIELDS}
              lockItems
              render={() => (
                <div className="mt-10 grid md:grid-cols-2 gap-6">
                  {PROOF_M.map((t, i) => (
                    <Reveal key={i} delay={i * 0.08}>
                      <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-8" data-testid={`sector-proof-${i}`}>
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
        <section className="py-20 sm:py-24" data-testid="sector-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight text-center">{s.name} — your questions, answered.</h2>
            </Reveal>
            <div className="mt-8">
              <EditableFaqList
                id={`${docKey}.faqs`}
                fallback={s.faqs}
                render={(items) => (
                  <div>
                    {items.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} details={f.details} media={f.media} links={f.links} testid={`sector-faq-${i}`} />)}
                  </div>
                )}
              />
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="sector-demo" className="py-20 sm:py-24 bg-brand-sand" data-testid="sector-demo-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">See MyGenie built for your {s.name.toLowerCase()}.</h2>
                <p className="mt-4 text-lg text-brand-muted leading-relaxed">Tell us about your business and we&apos;ll show you a walkthrough tailored to {s.name.toLowerCase()} — not a generic demo.</p>
                <div className="mt-8">
                  <p className="text-sm font-semibold uppercase tracking-widest text-brand-muted mb-4">Explore other solutions</p>
                  <div className="flex flex-wrap gap-2">
                    {others.map((o) => (
                      <Link key={o} to={`/solutions/${o}`} className="rounded-full bg-white border border-brand-line px-4 py-2 text-sm font-medium text-brand-ink hover:border-brand-green hover:text-brand-green transition-all" data-testid={`sector-related-${o}`}>
                        {SECTOR_PAGES[o].name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <DemoForm sector={s.name} />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
