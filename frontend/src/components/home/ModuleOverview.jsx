import * as Icons from "lucide-react";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MODULE_BUCKETS } from "@/data/content";
import Reveal from "@/components/site/Reveal";

export default function ModuleOverview() {
  return (
    <section id="modules" className="py-24 sm:py-28" data-testid="module-overview">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-green">Everything in one OS</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              Not just billing. Your entire operation.
            </h2>
            <p className="mt-4 text-lg text-brand-muted">Every module is built to do one thing: protect and grow your profit.</p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-5 gap-5">
          {MODULE_BUCKETS.map((b, i) => {
            const Icon = Icons[b.icon] || Icons.Box;
            const orange = i % 2 === 1;
            const accent = orange ? "text-brand-orange" : "text-brand-green";
            const accentBg = orange ? "bg-brand-orange/10" : "bg-brand-green/10";
            return (
              <Reveal key={b.title} delay={i * 0.05} className={b.span}>
                <Link to={`/product/${b.slug}`} className="group block h-full bg-white rounded-3xl border border-brand-line p-8 hover:shadow-[0_18px_44px_rgba(0,0,0,0.07)] hover:border-brand-green/40 transition-all" data-testid={`module-bucket-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${accentBg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${accent}`} />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-brand-ink">{b.title}</h3>
                  </div>
                  <p className="mt-3 text-brand-muted leading-relaxed">{b.line}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {b.items.map((it) => (
                      <span key={it} className="inline-flex items-center gap-1.5 rounded-full bg-brand-sand border border-brand-line px-3 py-1.5 text-[13px] font-medium text-brand-ink">
                        <Check className={`w-3.5 h-3.5 ${accent}`} strokeWidth={3} /> {it}
                      </span>
                    ))}
                  </div>
                  <span className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all group-hover:-translate-y-0.5 ${orange ? "bg-brand-orange" : "bg-brand-green"}`}>
                    Explore {b.title} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
