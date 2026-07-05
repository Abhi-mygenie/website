import { Check, Star, Box } from "lucide-react";
import * as Icons from "lucide-react";
import { EditableText } from "@/components/cms/Editable";
import { FeatureDemoButton } from "@/components/pricing/FeatureDemoModal";

const inr = (n) => "₹" + n.toLocaleString("en-IN");

export default function PlanCard({ plan, selected, recommended, onSelect, onFeatureDemo }) {
  const Icon = Icons[plan.icon] || Box;
  const isCustom = plan.contactOnly;
  return (
    <button
      onClick={() => onSelect(plan.id)}
      data-testid={`plan-card-${plan.id}`}
      className={`relative text-left rounded-3xl p-7 border-2 transition-all hover:-translate-y-1 ${
        selected ? "border-brand-green bg-brand-green/[0.05] shadow-[0_18px_40px_rgba(24,168,74,0.15)]" : "border-brand-line bg-white hover:border-brand-green/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-1 h-6">
        {recommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange text-white px-2.5 py-0.5 text-[11px] font-bold" data-testid={`plan-recommended-${plan.id}`}>
            <Star className="w-3 h-3" /> RECOMMENDED
          </span>
        )}
        {plan.popular && !recommended && (
          <span className="inline-flex items-center rounded-full bg-brand-green/15 text-brand-greenDark px-2.5 py-0.5 text-[11px] font-bold">MOST POPULAR</span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2.5">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${selected ? "bg-brand-green text-white" : "bg-brand-green/10 text-brand-green"}`}>
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </span>
        <h3 className="font-display text-2xl font-bold text-brand-ink">{plan.name}</h3>
        {onFeatureDemo && !isCustom && (
          <FeatureDemoButton onClick={() => onFeatureDemo(plan)} />
        )}
      </div>
      <p className="text-sm text-brand-muted mt-1">{plan.tagline}</p>

      {isCustom ? (
        <div className="mt-4">
          <span className="font-display text-2xl font-bold text-brand-ink">Let's talk</span>
          <p className="text-xs text-brand-muted mt-1">Custom pricing for your needs</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-1">
            <span className="font-display text-4xl font-bold text-brand-green">{inr(plan.price)}</span>
            <span className="text-brand-muted mb-1 text-sm">/outlet/mo</span>
          </div>
          <p className="text-xs text-brand-orange font-semibold mt-1">
            <EditableText id="pricing.plan.annual_note" fallback="Billed annually" />
          </p>
        </>
      )}

      <div className={`mt-5 inline-flex items-center justify-center w-full rounded-full py-2.5 font-semibold text-sm transition-all ${
        isCustom
          ? selected ? "bg-brand-orange text-white" : "bg-brand-orange/10 text-brand-orange"
          : selected ? "bg-brand-green text-white" : "bg-brand-sand text-brand-ink"
      }`}>
        {isCustom ? "Talk to Us" : selected ? "Selected" : "Select plan"}
      </div>

      <ul className="mt-5 space-y-2">
        {plan.includes.map((f) => (
          <li key={f} className="flex gap-2 text-[13.5px] text-brand-ink/90">
            <Check className="w-4 h-4 text-brand-green shrink-0 mt-0.5" strokeWidth={3} /> {f}
          </li>
        ))}
      </ul>
    </button>
  );
}
