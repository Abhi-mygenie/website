import * as Icons from "lucide-react";
import { Check, Box } from "lucide-react";
import { EditableImage, EditableText } from "@/components/cms/Editable";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Dynamic showcase: shows the SELECTED plan's feature GIF + the features this
// tier ADDS over the previous one — so customers see why higher plans matter.
export default function PlanShowcase({ plan }) {
  const Icon = Icons[plan.icon] || Box;
  const includes = plan.includes || [];
  const prevLine = includes.find((f) => /^everything in/i.test(f));
  const deltaFeatures = includes.filter((f) => !/^everything in/i.test(f));

  return (
    <div className="rounded-3xl border-2 border-brand-line bg-brand-sand/60 overflow-hidden mb-6" data-testid="plan-showcase">
      <div key={plan.id} className="grid md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Feature GIF / screenshots — CMS-editable per plan */}
        <div className="p-4 sm:p-6 flex items-center justify-center bg-brand-deep/[0.03]">
          <EditableImage
            id={`plan.${plan.id}.demo_gif`}
            fallback="/brand/plan-demo-placeholder.svg"
            alt={`${plan.name} feature demo`}
            block
            className="w-full rounded-2xl border border-brand-line bg-white object-cover aspect-[4/3]"
            data-testid={`plan-showcase-gif-${plan.id}`}
          />
        </div>

        {/* What this plan gives / adds */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-green/12 text-brand-green shrink-0">
              <Icon className="w-6 h-6" strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="font-display text-2xl font-bold text-brand-ink leading-tight" data-testid="plan-showcase-name">{plan.name}</h3>
              <p className="text-sm text-brand-muted">{plan.tagline}</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-brand-muted" data-testid={`plan-showcase-caption-${plan.id}`}>
            <EditableText
              id={`plan.${plan.id}.demo_caption`}
              fallback={`See ${plan.name} in action — the everyday screens and features your team will use.`}
            />
          </p>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-brand-orange" data-testid="plan-showcase-delta-label">
            {prevLine ? `What ${plan.name} adds` : "What you get"}
          </p>
          <ul className="mt-2 space-y-1.5" data-testid="plan-showcase-delta">
            {deltaFeatures.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-brand-ink/90">
                <Check className="w-4 h-4 text-brand-green shrink-0 mt-0.5" strokeWidth={3} /> {f}
              </li>
            ))}
          </ul>

          {plan.price != null ? (
            <div className="mt-5 flex items-end gap-1">
              <span className="font-display text-3xl font-bold text-brand-green">{inr(plan.price)}</span>
              <span className="text-brand-muted mb-1 text-sm">/outlet/mo · billed annually</span>
            </div>
          ) : (
            <p className="mt-5 font-display text-xl font-bold text-brand-orange">Custom pricing</p>
          )}
        </div>
      </div>
    </div>
  );
}
