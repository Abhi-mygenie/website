import { Quote } from "lucide-react";
import { TESTIMONIALS } from "@/data/content";
import Reveal from "@/components/site/Reveal";
import { EditableList } from "@/components/cms/Editable";

const TESTIMONIAL_FIELDS = [
  { key: "metric", label: "Metric (e.g. 30%)" },
  { key: "headline", label: "Headline" },
  { key: "quote", label: "Quote", type: "textarea" },
  { key: "client", label: "Client name" },
  { key: "sector", label: "Sector" },
  { key: "img", label: "Photo", type: "image" },
];

export default function ProofSection() {
  return (
    <section id="proof" className="py-24 sm:py-28" data-testid="proof-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">Real results</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              Owners don&apos;t just like MyGenie. They count the difference.
            </h2>
          </div>
        </Reveal>

        <EditableList
          id="home.testimonials"
          fallback={TESTIMONIALS}
          fields={TESTIMONIAL_FIELDS}
          render={(items) => (
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {items.map((t, i) => (
                <Reveal key={t.client || i} delay={i * 0.08}>
                  <div className="h-full bg-white rounded-3xl border border-brand-line p-8 flex flex-col hover:shadow-[0_18px_44px_rgba(0,0,0,0.07)] transition-all" data-testid={`testimonial-${i}`}>
                    <div className="flex items-end gap-2">
                      <span className="font-display text-5xl font-bold text-brand-green leading-none">{t.metric}</span>
                    </div>
                    <p className="font-display text-lg font-semibold text-brand-ink mt-2">{t.headline}</p>
                    <Quote className="w-7 h-7 text-brand-green/20 mt-5" />
                    <p className="text-brand-muted leading-relaxed mt-2 flex-1">{t.quote}</p>
                    <div className="mt-6 pt-5 border-t border-brand-line flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        {t.img ? (
                          <img src={t.img} alt={t.client} className="w-10 h-10 rounded-full object-cover border border-brand-line" />
                        ) : (
                          <span className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center font-display font-bold text-brand-green">{(t.client || "?")[0]}</span>
                        )}
                        <span className="font-semibold text-brand-ink">{t.client}</span>
                      </span>
                      <span className="text-xs font-medium text-brand-green bg-brand-green/10 rounded-full px-3 py-1">{t.sector}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        />
      </div>
    </section>
  );
}
