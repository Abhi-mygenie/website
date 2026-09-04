import { Check, X } from "lucide-react";
import * as Icons from "lucide-react";
import { PLANS, ADDONS } from "@/data/pricing";

// Collect all unique features + add-ons across plans for comparison rows.
const pricedPlans = PLANS.filter((p) => !p.contactOnly);

// Deduplicate features: skip "Everything in ..." lines, collect unique.
const allFeatures = (() => {
  const seen = new Set();
  const list = [];
  for (const p of pricedPlans) {
    for (const f of p.includes) {
      if (/^everything in/i.test(f)) continue;
      if (!seen.has(f)) { seen.add(f); list.push(f); }
    }
  }
  return list;
})();

// All add-ons for the add-on comparison section
const allAddons = ADDONS.map((a) => a);

function hasFeature(plan, feature) {
  // Direct include
  if (plan.includes.includes(feature)) return true;
  // Inherited via "Everything in X"
  const idx = pricedPlans.indexOf(plan);
  for (let i = idx - 1; i >= 0; i--) {
    if (pricedPlans[i].includes.includes(feature)) return true;
  }
  return false;
}

function addonStatus(plan, addonId) {
  return plan.includedAddons.includes(addonId) ? "included" : "paid";
}

export default function ComparisonTable({ hideHeading = false }) {
  return (
    <div className={hideHeading ? "mt-2" : "mt-16"} id="comparison-table" data-testid="comparison-table">
      {!hideHeading && (
        <>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink text-center mb-2">
            Compare all plans
          </h2>
          <p className="text-brand-muted text-center text-sm mb-8">
            See exactly what's in each plan at a glance.
          </p>
        </>
      )}

      {/* Outer div: handles border-radius + clips sticky column at corners.
          Inner div: handles horizontal scroll + tells iOS this is a pan-x zone. */}
      <div className="rounded-2xl border border-brand-line overflow-hidden">
        <div className="overflow-x-auto" style={{ touchAction: "pan-x", overscrollBehaviorX: "contain" }}>
        <table className="w-full text-sm min-w-[580px]">
          {/* Header — plan names */}
          <thead>
            <tr className="bg-brand-sand/80">
              <th className="text-left py-4 px-5 font-semibold text-brand-muted sticky left-0 z-20 bg-[#F6F8F5] border-r border-brand-line min-w-[130px] w-[35%]">Features</th>
              {pricedPlans.map((p) => {
                const Icon = Icons[p.icon] || Icons.Box;
                return (
                  <th key={p.id} className="py-4 px-3 text-center" data-testid={`compare-header-${p.id}`}>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green">
                        <Icon className="w-4 h-4" strokeWidth={2.2} />
                      </span>
                      <span className="font-display font-bold text-brand-ink text-base">{p.name}</span>
                      <span className="text-xs text-brand-muted">₹{p.price?.toLocaleString("en-IN")}/mo</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Core features section */}
            <tr>
              <td colSpan={pricedPlans.length + 1} className="bg-brand-deep/[0.03] px-5 py-2.5 font-bold text-xs uppercase tracking-widest text-brand-muted">
                Core Features
              </td>
            </tr>
            {allFeatures.map((feature, i) => (
              <tr key={feature} className={i % 2 === 0 ? "bg-white" : "bg-brand-sand/30"}>
                <td className={`py-3 px-5 text-brand-ink/80 sticky left-0 z-10 border-r border-brand-line ${i % 2 === 0 ? "bg-white" : "bg-[#F6F8F5]"}`}>{feature}</td>
                {pricedPlans.map((p) => (
                  <td key={p.id} className="py-3 px-3 text-center">
                    {hasFeature(p, feature) ? (
                      <Check className="w-5 h-5 text-brand-green mx-auto" strokeWidth={2.5} />
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 mx-auto">
                        <X className="w-3 h-3 text-red-400" strokeWidth={2.5} />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Add-ons section */}
            <tr>
              <td colSpan={pricedPlans.length + 1} className="bg-brand-deep/[0.03] px-5 py-2.5 font-bold text-xs uppercase tracking-widest text-brand-muted">
                Add-on Modules
              </td>
            </tr>
            {allAddons.map((addon, i) => (
              <tr key={addon.id} className={i % 2 === 0 ? "bg-white" : "bg-brand-sand/30"}>
                <td className={`py-3 px-5 text-brand-ink/80 sticky left-0 z-10 border-r border-brand-line ${i % 2 === 0 ? "bg-white" : "bg-[#F6F8F5]"}`}>{addon.name}</td>
                {pricedPlans.map((p) => {
                  const status = addonStatus(p, addon.id);
                  return (
                    <td key={p.id} className="py-3 px-3 text-center">
                      {status === "included" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green">
                          <Check className="w-4 h-4" strokeWidth={2.5} /> Free
                        </span>
                      ) : (
                        <span className="text-xs text-brand-muted">+₹{addon.price}/mo</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>{/* end overflow-x-auto */}
      </div>{/* end rounded border clip */}
    </div>
  );
}
