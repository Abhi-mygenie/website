import { useState, useMemo } from "react";
import { TrendingUp, ArrowUpCircle, Plus } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import RecommendQuiz from "@/components/pricing/RecommendQuiz";
import PlanCard from "@/components/pricing/PlanCard";
import AddonCard from "@/components/pricing/AddonCard";
import CartSummary from "@/components/pricing/CartSummary";
import CheckoutModal from "@/components/pricing/CheckoutModal";
import Seo from "@/components/site/Seo";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { useContent } from "@/lib/cms/CmsProvider";
import { PAGE_SEO } from "@/lib/seo";
import { PLANS, ADDONS, MONTHS_PER_YEAR, alsoAdded } from "@/data/pricing";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Display-only projections used as the CMS fallback. Logic fields (id,
// includedAddons, icon) stay in code and are never exposed for editing.
const PLAN_DISPLAY = PLANS.map(({ id, name, price, tagline, popular, includes }) => ({ id, name, price, tagline, popular, includes }));
const ADDON_DISPLAY = ADDONS.map(({ id, name, price, desc }) => ({ id, name, price, desc }));

const PLAN_FIELDS = [
  { key: "name", label: "Plan name" },
  { key: "price", label: "Price (₹/mo — number only)" },
  { key: "tagline", label: "Tagline" },
  { key: "popular", label: "Most popular?", type: "bool", hint: "Show the 'Most popular' badge" },
  { key: "includes", label: "Included features (one per line)", type: "lines" },
];
const ADDON_FIELDS = [
  { key: "name", label: "Add-on name" },
  { key: "price", label: "Price (₹/mo — number only)" },
  { key: "desc", label: "Description", type: "textarea" },
];

function parseList(raw) {
  if (raw == null) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

// Merge CMS display overrides onto the static array, matched by id.
// Only display fields are copied; logic fields on the base are preserved.
function mergeById(base, overrides, numericKeys = []) {
  if (!Array.isArray(overrides)) return base;
  const map = new Map(overrides.map((o) => [o.id, o]));
  return base.map((b) => {
    const o = map.get(b.id);
    if (!o) return b;
    const merged = { ...b };
    for (const k of Object.keys(o)) {
      if (k === "id") continue;
      if (numericKeys.includes(k)) merged[k] = Number(o[k]);
      else if (k === "popular") merged[k] = o[k] === true || o[k] === "true";
      else merged[k] = o[k];
    }
    return merged;
  });
}

export default function Pricing() {
  const [selectedPlanId, setSelectedPlanId] = useState("pro");
  const [selectedAddons, setSelectedAddons] = useState(["loyalty_wallet"]);
  const [reason, setReason] = useState("");
  const [outletType, setOutletType] = useState("");
  const [wasRecommended, setWasRecommended] = useState(false);
  const [recPlanId, setRecPlanId] = useState("");
  const [checkout, setCheckout] = useState({ open: false, intent: "buy" });

  const plansOverride = parseList(useContent("pricing.plans", null));
  const addonsOverride = parseList(useContent("pricing.addons", null));
  const PLANS_M = useMemo(() => mergeById(PLANS, plansOverride, ["price"]), [plansOverride]);
  const ADDONS_M = useMemo(() => mergeById(ADDONS, addonsOverride, ["price"]), [addonsOverride]);
  const byId = (arr, id) => arr.find((x) => x.id === id);

  const plan = byId(PLANS_M, selectedPlanId) || PLANS_M[0];

  const onAddons = useMemo(
    () => selectedAddons.filter((id) => !plan.includedAddons.includes(id)).map((id) => byId(ADDONS_M, id)).filter(Boolean),
    [selectedAddons, plan, ADDONS_M]
  );

  // Add-ons that come free with the chosen plan — surfaced in the cart at ₹0.
  const includedAddons = useMemo(
    () => plan.includedAddons.map((id) => byId(ADDONS_M, id)).filter(Boolean),
    [plan, ADDONS_M]
  );

  const toggleAddon = (id) =>
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onRecommend = (res, ot) => {
    setSelectedPlanId(res.planId);
    setSelectedAddons(res.addons);
    setReason(res.reason);
    setOutletType(ot);
    setWasRecommended(true);
    setRecPlanId(res.planId);
    setTimeout(() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const addonState = (id) =>
    plan.includedAddons.includes(id) ? "included" : selectedAddons.includes(id) ? "on" : "off";

  // Upsell: suggest the next plan up if it would absorb selected add-ons cheaply
  const upsell = useMemo(() => {
    const idx = PLANS_M.findIndex((p) => p.id === selectedPlanId);
    const next = PLANS_M[idx + 1];
    if (!next) return null;
    const absorbed = onAddons.filter((a) => next.includedAddons.includes(a.id));
    if (absorbed.length < 2) return null;
    const addonCost = absorbed.reduce((s, a) => s + a.price, 0);
    const upgradeCost = next.price - plan.price;
    const saving = addonCost - upgradeCost;
    return { next, absorbed, saving };
  }, [selectedPlanId, onAddons, plan, PLANS_M]);

  const crossSell = useMemo(
    () => alsoAdded(outletType, selectedAddons, selectedPlanId).slice(0, 2).map((id) => byId(ADDONS_M, id)).filter(Boolean),
    [outletType, selectedAddons, selectedPlanId, ADDONS_M]
  );

  const monthly = plan.price + onAddons.reduce((s, a) => s + a.price, 0);
  const total = monthly * MONTHS_PER_YEAR;
  const config = { plan, addons: onAddons, billing: "annual", monthly, total, outletType, wasRecommended };

  return (
    <div className="bg-white" data-testid="pricing-page">
      <Seo title={PAGE_SEO["/pricing"].title} description={PAGE_SEO["/pricing"].description} path="/pricing" />
      <Navbar />
      <CheckoutModal open={checkout.open} intent={checkout.intent} config={config} onClose={() => setCheckout({ ...checkout, open: false })} />

      <main className="pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
              <EditableText id="pricing.hero.eyebrow" fallback="Transparent, build-your-own pricing" />
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              <EditableText id="pricing.hero.h1" fallback="Build your MyGenie plan." />
            </h1>
            <p className="mt-4 text-lg text-brand-muted">
              <EditableText id="pricing.hero.sub" fallback="Pick a base plan, add only what you need, and see your price update live — all plans are billed annually. Buy online or book a demo with your exact quote." />
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-8">
            {/* LEFT: builder */}
            <div className="lg:col-span-2 space-y-10">
              <RecommendQuiz onRecommend={onRecommend} reason={reason} />

              {/* Plans */}
              <div id="plans">
                <h2 className="font-display text-2xl font-bold text-brand-ink mb-5">1. Choose your base plan</h2>
                <EditableList
                  id="pricing.plans"
                  fallback={PLAN_DISPLAY}
                  fields={PLAN_FIELDS}
                  lockItems
                  render={() => (
                    <div className="grid sm:grid-cols-2 gap-5">
                      {PLANS_M.map((p) => (
                        <PlanCard key={p.id} plan={p} selected={selectedPlanId === p.id} recommended={recPlanId === p.id} onSelect={setSelectedPlanId} />
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Upsell nudge */}
              {upsell && (
                <div className="rounded-2xl border-2 border-brand-orange/40 bg-brand-orange/[0.06] p-5 flex items-start gap-4" data-testid="upsell-nudge">
                  <ArrowUpCircle className="w-7 h-7 text-brand-orange shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-brand-ink">
                      Upgrade to {upsell.next.name} — get {upsell.absorbed.map((a) => a.name).join(" & ")} included
                      {upsell.saving > 0 ? <span className="text-brand-orange"> and save {inr(upsell.saving)}/mo.</span> : "."}
                    </p>
                    <button onClick={() => setSelectedPlanId(upsell.next.id)} data-testid="upsell-accept" className="mt-2 text-sm font-semibold text-brand-green hover:underline">
                      Switch to {upsell.next.name} →
                    </button>
                  </div>
                </div>
              )}

              {/* Add-ons */}
              <div>
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="font-display text-2xl font-bold text-brand-ink">2. Add modules you need</h2>
                  <span className="text-sm text-brand-muted">Included in your plan stay free</span>
                </div>
                <EditableList
                  id="pricing.addons"
                  fallback={ADDON_DISPLAY}
                  fields={ADDON_FIELDS}
                  lockItems
                  render={() => (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ADDONS_M.map((a) => <AddonCard key={a.id} addon={a} state={addonState(a.id)} onToggle={toggleAddon} />)}
                    </div>
                  )}
                />

                {/* Cross-sell */}
                {crossSell.length > 0 && (
                  <div className="mt-6 rounded-2xl bg-brand-green/[0.05] border border-brand-green/25 p-5" data-testid="cross-sell">
                    <p className="flex items-center gap-2 font-semibold text-brand-ink"><TrendingUp className="w-5 h-5 text-brand-green" /> Owners like you also add:</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {crossSell.map((a) => (
                        <button key={a.id} onClick={() => toggleAddon(a.id)} data-testid={`cross-sell-${a.id}`} className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-green/30 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-green hover:text-white transition-all">
                          <Plus className="w-4 h-4" /> {a.name} · {inr(a.price)}/mo
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: sticky cart */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <CartSummary
                  plan={plan}
                  addons={onAddons}
                  includedAddons={includedAddons}
                  onBuy={() => setCheckout({ open: true, intent: "buy" })}
                  onDemo={() => setCheckout({ open: true, intent: "demo" })}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
