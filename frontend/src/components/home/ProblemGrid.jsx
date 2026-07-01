import * as Icons from "lucide-react";
import { PAINS } from "@/data/content";
import Reveal from "@/components/site/Reveal";

export default function ProblemGrid() {
  return (
    <section className="py-24 sm:py-28" data-testid="problem-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">Sound familiar?</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              Running hospitality shouldn&apos;t feel like firefighting.
            </h2>
            <p className="mt-4 text-lg text-brand-muted">
              Every day, small leaks and slow processes quietly eat your profit. Here&apos;s what owners tell us keeps them up at night.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PAINS.map((p, i) => {
            const Icon = Icons[p.icon] || Icons.AlertCircle;
            return (
              <Reveal key={p.title} delay={i * 0.05}>
                <div
                  className="h-full bg-white rounded-2xl border border-brand-line p-6 hover:border-brand-orange/40 hover:shadow-[0_14px_34px_rgba(242,104,34,0.08)] transition-all"
                  data-testid={`pain-${i}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-orange" strokeWidth={2} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mt-4 text-brand-ink">{p.title}</h3>
                  <p className="text-sm text-brand-muted mt-2 leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
