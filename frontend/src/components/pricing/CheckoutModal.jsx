import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";
import { pushLead } from "@/lib/gtm";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutModal({ open, intent, config, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", business_name: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { hp, setHp, signals } = useAntiBot();

  if (!open) return null;
  const isBuy = intent === "buy";
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("Please enter your name and phone."); return; }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) { toast.error("Enter a valid 10-digit phone number."); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/quote`, {
        ...form,
        ...signals(),
        attribution: getAttribution(),
        intent,
        outlet_type: config.outletType || null,
        plan_id: config.plan.id,
        plan_name: config.plan.name,
        billing_cycle: config.billing,
        addon_ids: config.addons.map((a) => a.id),
        addon_names: config.addons.map((a) => a.name),
        total_amount: config.total,
        was_recommended: config.wasRecommended,
      });
      setDone(true);
      pushLead("form_submitted", form, config.outletType || null, undefined, {
        form_location: isBuy ? "pricing-buy" : "pricing-quote",
        plan_interest: config.plan?.name || null,
        lead_quality: leadQuality(signals()),
      });
      toast.success(isBuy ? "Order received!" : "Quote sent to our team!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const field = "w-full rounded-xl border border-brand-line bg-brand-sand/60 px-4 py-3 text-[15px] focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" data-testid="checkout-modal">
      <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-5 right-5 text-brand-muted hover:text-brand-ink" data-testid="checkout-close"><X /></button>

        {done ? (
          <div className="text-center py-4" data-testid="checkout-success">
            <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9 text-brand-green" /></div>
            <h3 className="font-display text-2xl font-bold mt-5 text-brand-ink">{isBuy ? "Order received!" : "Quote sent!"}</h3>
            <p className="mt-3 text-brand-muted leading-relaxed">
              {isBuy
                ? `Thanks ${form.name.split(" ")[0]}! Our team will reach out to activate your ${config.plan.name} plan and complete payment.`
                : `Thanks ${form.name.split(" ")[0]}! We'll call you with a walkthrough built around your ${config.plan.name} configuration.`}
            </p>
            <button onClick={onClose} className="mt-6 w-full bg-brand-green text-white rounded-full py-3 font-semibold">Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 className="font-display text-2xl font-bold text-brand-ink">{isBuy ? "Almost there — confirm your details" : "Get your custom quote"}</h3>
            <Honeypot value={hp} onChange={setHp} />
            <div className="mt-2 rounded-xl bg-brand-sand p-3 text-sm" data-testid="checkout-config">
              <span className="font-semibold text-brand-ink">{config.plan.name}</span>
              <span className="text-brand-muted"> · {config.addons.length} add-on{config.addons.length !== 1 ? "s" : ""} · </span>
              <span className="font-semibold text-brand-green">₹{config.total.toLocaleString("en-IN")}{config.billing === "annual" ? "/yr" : "/mo"}</span>
            </div>

            <div className="space-y-3 mt-4">
              <input className={field} placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} data-testid="checkout-name" />
              <input className={field} placeholder="Phone (10 digits)" value={form.phone} onChange={(e) => update("phone", e.target.value)} data-testid="checkout-phone" />
              <input className={field} placeholder="Email (optional)" value={form.email} onChange={(e) => update("email", e.target.value)} data-testid="checkout-email" />
              <div className="grid grid-cols-2 gap-3">
                <input className={field} placeholder="Business name" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} data-testid="checkout-business" />
                <input className={field} placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} data-testid="checkout-city" />
              </div>
            </div>

            <button type="submit" disabled={loading} data-testid="checkout-submit" className="mt-5 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : isBuy ? "Confirm Order" : "Send My Quote"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
