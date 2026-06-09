import { ShoppingCart, ArrowRight, CalendarClock, CalendarCheck } from "lucide-react";
import { MONTHS_PER_YEAR } from "@/data/pricing";
import { EditableText } from "@/components/cms/Editable";

const inr = (n) => "₹" + n.toLocaleString("en-IN");

export default function CartSummary({ plan, addons, onBuy, onDemo }) {
  const monthly = plan.price + addons.reduce((s, a) => s + a.price, 0);
  const annualYear = monthly * MONTHS_PER_YEAR;

  return (
    <div className="rounded-3xl border border-brand-line bg-white shadow-[0_18px_44px_rgba(0,0,0,0.08)] overflow-hidden" data-testid="cart-summary">
      <div className="bg-brand-deep text-white p-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-brand-yellow" />
          <h3 className="font-display text-lg font-bold">Your MyGenie plan</h3>
        </div>

        {/* annual-only badge (no monthly plan) */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-yellow/20 text-brand-yellow px-3.5 py-1.5 text-sm font-semibold" data-testid="billing-annual-badge">
          <CalendarCheck className="w-4 h-4" />
          <EditableText id="pricing.billing.annual_label" fallback="Billed annually" />
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
              <EditableText id="pricing.cart.total_annual_label" fallback="Your price" />
            </span>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-brand-green leading-none" data-testid="cart-total">
                {inr(monthly)}<span className="text-base font-semibold">/mo</span>
              </p>
              <p className="text-xs text-brand-muted mt-1" data-testid="cart-annual-total">
                billed annually · {inr(annualYear)}/yr · per outlet
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
        <p className="text-xs text-brand-muted text-center mt-3">All plans are billed annually. Final quote confirmed on your demo call.</p>
      </div>
    </div>
  );
}
