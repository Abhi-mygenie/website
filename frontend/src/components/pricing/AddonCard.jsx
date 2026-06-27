import * as Icons from "lucide-react";
import { Check, Plus } from "lucide-react";
import { FeatureDemoButton } from "@/components/pricing/FeatureDemoModal";

const inr = (n) => "₹" + n.toLocaleString("en-IN");

export default function AddonCard({ addon, state, onToggle, onDemo }) {
  const Icon = Icons[addon.icon] || Icons.Box;
  const included = state === "included";
  const on = state === "on";

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        included ? "border-brand-green/30 bg-brand-green/[0.04]" : on ? "border-brand-green bg-brand-green/[0.05]" : "border-brand-line bg-white"
      }`}
      data-testid={`addon-card-${addon.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on || included ? "bg-brand-green/15" : "bg-brand-orange/10"}`}>
          <Icon className={`w-5 h-5 ${on || included ? "text-brand-green" : "text-brand-orange"}`} />
        </div>
        {included ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-green" data-testid={`addon-included-${addon.id}`}>
            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Included
          </span>
        ) : (
          <button
            onClick={() => onToggle(addon.id)}
            data-testid={`addon-toggle-${addon.id}`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${on ? "bg-brand-green text-white" : "bg-brand-sand text-brand-ink hover:bg-brand-green/15"}`}
            aria-label={on ? "Remove" : "Add"}
          >
            {on ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <h4 className="font-display text-base font-semibold text-brand-ink">{addon.name}</h4>
        {onDemo && <FeatureDemoButton onClick={() => onDemo(addon)} />}
      </div>
      <p className="text-[13px] text-brand-muted mt-1 leading-relaxed">{addon.desc}</p>
      <p className={`mt-3 text-sm font-bold ${included ? "text-brand-muted line-through" : "text-brand-ink"}`}>
        {included ? "Free in plan" : `+ ${inr(addon.price)}/mo`}
      </p>
    </div>
  );
}
