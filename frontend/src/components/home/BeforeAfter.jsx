import { X, Check } from "lucide-react";
import { BEFORE_AFTER } from "@/data/content";
import Reveal from "@/components/site/Reveal";

export default function BeforeAfter() {
  return (
    <section className="bg-brand-deep text-brand-sand py-24 sm:py-28" data-testid="before-after">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-yellow">The MyGenie difference</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 tracking-tight">
              From daily chaos to calm, profitable control.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          <Reveal>
            <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10" data-testid="before-card">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#9DB1A4]">Before MyGenie</p>
              <ul className="mt-6 space-y-4">
                {BEFORE_AFTER.before.map((t) => (
                  <li key={t} className="flex gap-3 text-[#C7D2CB]">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-white/8 flex items-center justify-center shrink-0">
                      <X className="w-3.5 h-3.5 text-[#9DB1A4]" />
                    </span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl border border-brand-green/40 bg-brand-green/[0.08] p-8 sm:p-10 relative overflow-hidden" data-testid="after-card">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand-green/20 blur-2xl" />
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-yellow">After MyGenie</p>
              <ul className="mt-6 space-y-4">
                {BEFORE_AFTER.after.map((t) => (
                  <li key={t} className="flex gap-3 text-white">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-brand-green flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
