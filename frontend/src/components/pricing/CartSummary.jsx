import { ShoppingCart, ArrowRight, CalendarClock } from "lucide-react";
import { ANNUAL_MONTHS } from "@/data/pricing";
import { EditableText } from "@/components/cms/Editable";

const inr = (n) => "₹" + n.toLocaleString("en-IN");

export default function CartSummary({ plan, addons, billing, setBilling, onBuy, onDemo }) {
  const monthly = plan.price + addons.reduce((s, a) => s + a.price, 0);
  const annualYear = monthly * ANNUAL_MONTHS;
  const isAnnual = billing === "annual";

  return (
    <div className="rounded-3xl border border-brand-line bg-white shadow-[0_18px_44px_rgba(0,0,0,0.08)] overflow-hidden" data-testid="cart-summary">
      <div className="bg-brand-deep text-white p-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-brand-yellow" />
          <h3 className="font-display text-lg font-bold">Your MyGenie plan</h3>
        </div>

        {/* billing toggle */}
        <div className="mt-4 flex rounded-full bg-white/10 p-1 text-sm font-semibold" data-testid="billing-toggle">
          <button onClick={() => setBilling("monthly")} data-testid="billing-monthly" className={`flex-1 rounded-full py-1.5 transition-all ${!isAnnual ? "bg-white text-brand-deep" : "text-white/80"}`}>
            <EditableText id="pricing.billing.monthly_label" fallback="Monthly" />
          </button>
          <button onClick={() => setBilling("annual")} data-testid="billing-annual" className={`flex-1 rounded-full py-1.5 transition-all ${isAnnual ? "bg-brand-yellow text-brand-deep" : "text-white/80"}`}>
            <EditableText id="pricing.billing.annual_label" fallback="Annual · save 17%" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between text-[15px]" data-testid="cart-plan-line">
          <span className="font-semibold text-brand-ink">{plan.name} plan</span>
          <span className="text-brand-ink">{inr(plan.price)}/mo</span>
        </div>

        <div className="mt-3 space-y-2 max-h-52 overflow-auto">
          {addons.length === 0 && <p className="text-sm text-brand-muted">No add-ons yet — everything in your plan is included.</p>}
          {addons.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm" data-testid={`cart-addon-${a.id}`}>
              <span className="text-brand-muted">+ {a.name}</span>
              <span className="text-brand-ink">{inr(a.price)}/mo</span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-brand-line">
          <div className="flex items-end justify-between">
            <span className="text-sm text-brand-muted">
              {isAnnual
                ? <EditableText id="pricing.cart.total_annual_label" fallback="Total billed yearly" />
                : <EditableText id="pricing.cart.total_monthly_label" fallback="Total per month" />}
            </span>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-brand-green leading-none" data-testid="cart-total">
                {inr(isAnnual ? annualYear : monthly)}
              </p>
              <p className="text-xs text-brand-muted mt-1">
                {isAnnual ? `≈ ${inr(Math.round(annualYear / 12))}/mo · per outlet` : "per outlet"}
              </p>
            </div>
          </div>
        </div>

        <button onClick={onBuy} data-testid="cart-buy-btn" className="group mt-5 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.3)] flex items-center justify-center gap-2">
          Buy Online <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <button onClick={onDemo} data-testid="cart-demo-btn" className="mt-3 w-full bg-white border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white rounded-full py-3 font-semibold transition-all flex items-center justify-center gap-2">
          <CalendarClock className="w-5 h-5" /> Book a Demo with this quote
        </button>
        <p className="text-xs text-brand-muted text-center mt-3">Prices are indicative. Final quote confirmed on your demo call.</p>
      </div>
    </div>
  );
}
