import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, CheckCircle2, Loader2, Lock } from "lucide-react";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";
import { pushLead } from "@/lib/gtm";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutModal({ open, intent, config, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", business_name: "", city: "", gstin: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { hp, setHp, signals } = useAntiBot();
  const navigate = useNavigate();

  // reset state when modal re-opens
  useEffect(() => { if (open) { setDone(false); setLoading(false); } }, [open]);

  if (!open) return null;
  const isBuy = intent === "buy";
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitDemo = async (e) => {
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
        gst_amount: config.gst,
        total_with_gst: config.totalWithGst,
        was_recommended: config.wasRecommended,
      });
      setDone(true);
      pushLead("form_submitted", form, config.outletType || null, undefined, {
        form_location: "pricing-quote",
        plan_interest: config.plan?.name || null,
        lead_quality: leadQuality(signals()),
      });
      toast.success("Quote sent to our team!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const submitBuy = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("Please enter your name and phone."); return; }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) { toast.error("Enter a valid 10-digit phone number."); return; }
    setLoading(true);

    const ok = await loadRazorpayScript();
    if (!ok) { toast.error("Could not load payment gateway. Please try again."); setLoading(false); return; }

    try {
      const { data: order } = await axios.post(`${API}/payments/razorpay/order`, {
        plan_id: config.plan.id,
        plan_name: config.plan.name,
        plan_price: config.plan.price,
        addon_ids: config.addons.map((a) => a.id),
        addon_names: config.addons.map((a) => a.name),
        addon_prices: config.addons.map((a) => a.price),
        name: form.name, phone: form.phone, email: form.email,
        business_name: form.business_name, city: form.city, gstin: form.gstin || null,
        attribution: getAttribution(),
        outlet_type: config.outletType || null,
        was_recommended: config.wasRecommended,
      });

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpay_order_id,
        name: "MyGenie POS",
        description: `${config.plan.name} Plan — Annual`,
        image: "/brand/logo.svg",
        prefill: {
          name: order.customer.name,
          email: order.customer.email,
          contact: order.customer.phone,
        },
        theme: { color: "#10B981" },
        handler: async (response) => {
          try {
            await axios.post(`${API}/payments/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.order_id,
            });
            pushLead("form_submitted", form, config.outletType || null, undefined, {
              form_location: "pricing-buy",
              plan_interest: config.plan?.name || null,
              lead_quality: leadQuality(signals()),
            });
            onClose();
            navigate(`/payment-success?order_id=${order.order_id}`);
          } catch {
            toast.error("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not initiate payment. Please try again.");
      setLoading(false);
    }
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
            <h3 className="font-display text-2xl font-bold mt-5 text-brand-ink">Quote sent!</h3>
            <p className="mt-3 text-brand-muted leading-relaxed">
              Thanks {form.name.split(" ")[0]}! We'll call you with a walkthrough built around your {config.plan.name} configuration.
            </p>
            <button onClick={onClose} className="mt-6 w-full bg-brand-green text-white rounded-full py-3 font-semibold">Done</button>
          </div>
        ) : (
          <form onSubmit={isBuy ? submitBuy : submitDemo}>
            <h3 className="font-display text-2xl font-bold text-brand-ink">
              {isBuy ? "Complete your purchase" : "Get your custom quote"}
            </h3>
            <Honeypot value={hp} onChange={setHp} />

            {/* Order summary */}
            <div className="mt-3 rounded-xl bg-brand-sand p-3 text-sm" data-testid="checkout-config">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-brand-ink">{config.plan.name}</span>
                {!config.plan.contactOnly && (
                  <span className="font-bold text-brand-green">₹{config.totalWithGst?.toLocaleString("en-IN")}/yr</span>
                )}
              </div>
              {!config.plan.contactOnly && config.addons.length > 0 && (
                <p className="text-brand-muted text-xs mt-0.5">{config.addons.length} add-on{config.addons.length !== 1 ? "s" : ""} · annual · incl. 18% GST</p>
              )}
            </div>

            <div className="space-y-3 mt-4">
              <input className={field} placeholder="Your name *" value={form.name} onChange={(e) => update("name", e.target.value)} data-testid="checkout-name" />
              <input className={field} placeholder="Phone (10 digits) *" value={form.phone} onChange={(e) => update("phone", e.target.value)} data-testid="checkout-phone" />
              <input className={field} placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} data-testid="checkout-email" />
              <div className="grid grid-cols-2 gap-3">
                <input className={field} placeholder="Business name" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} data-testid="checkout-business" />
                <input className={field} placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} data-testid="checkout-city" />
              </div>
              {isBuy && (
                <div>
                  <input className={field} placeholder="GSTIN (optional)" value={form.gstin} onChange={(e) => update("gstin", e.target.value)} data-testid="checkout-gstin" />
                  <p className="text-xs text-brand-muted mt-1">Your GSTIN will appear on the tax invoice</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} data-testid="checkout-submit"
              className="mt-5 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {isBuy ? "Opening payment…" : "Sending…"}</>
                : isBuy
                  ? <><Lock className="w-4 h-4" /> Pay ₹{config.totalWithGst?.toLocaleString("en-IN")} securely</>
                  : "Send My Quote"
              }
            </button>

            {isBuy && (
              <p className="text-center text-xs text-brand-muted mt-3">
                Secured by Razorpay · UPI / Card / Net Banking / Wallet
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
