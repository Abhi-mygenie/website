import * as Icons from "lucide-react";
import { PILLARS } from "@/data/content";
import Reveal from "@/components/site/Reveal";

export default function OutcomePillars() {
  return (
    <section className="py-24 sm:py-28" data-testid="outcome-pillars">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">Outcomes, not features</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              How MyGenie makes you money.
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p, i) => {
            const Icon = Icons[p.icon] || Icons.Circle;
            const wide = i === 0 ? "lg:col-span-2" : "";
            const dark = i === 0;
            const orange = !dark && i % 2 === 1;
            const accent = orange ? "text-brand-orange" : "text-brand-green";
            const accentBg = orange ? "bg-brand-orange/10" : "bg-brand-green/10";
            return (
              <Reveal key={p.title} delay={i * 0.06} className={wide}>
                <div
                  className={`h-full rounded-3xl p-8 border transition-all hover:-translate-y-1 ${
                    dark
                      ? "bg-brand-deep border-brand-deep text-white"
                      : "bg-white border-brand-line hover:shadow-[0_18px_40px_rgba(0,0,0,0.07)]"
                  }`}
                  data-testid={`pillar-${i}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dark ? "bg-brand-green/20" : accentBg}`}>
                      <Icon className={`w-6 h-6 ${dark ? "text-brand-green" : accent}`} />
                    </div>
                    <span className={`font-display text-4xl font-bold ${dark ? "text-brand-yellow" : accent}`}>{p.stat}</span>
                  </div>
                  <h3 className={`font-display text-xl font-semibold mt-5 ${dark ? "text-white" : "text-brand-ink"}`}>{p.title}</h3>
                  <p className={`mt-2 leading-relaxed ${dark ? "text-[#C7D2CB]" : "text-brand-muted"}`}>{p.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
