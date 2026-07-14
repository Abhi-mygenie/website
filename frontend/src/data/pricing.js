// Pricing builder data + rule-based recommendation engine.
// NOTE: ₹ figures are PLACEHOLDERS — swap with real prices anytime.

export const ADDONS = [
  { id: "branded_ordering", name: "Branded Website — Ordering Across Channels", price: 399, icon: "Globe", desc: "QR ordering, direct delivery & takeaway — zero aggregator commission, all from your branded link." },
  { id: "whatsapp", name: "WhatsApp Automation", price: 499, icon: "MessageCircle", desc: "Automated follow-ups, offers & daily reports on WhatsApp." },
  { id: "loyalty_wallet", name: "Loyalty + Wallet", price: 399, icon: "Gift", desc: "Points, prepaid wallets & repeat-visit rewards." },
  { id: "central_inventory", name: "Central Inventory", price: 599, icon: "Boxes", desc: "One stock source of truth across all your outlets." },
  { id: "hotel_billing", name: "Hotel / Room Billing", price: 699, icon: "BedDouble", desc: "Rooms + F&B + spa on one consolidated checkout bill." },
  { id: "ai_insights", name: "AI Insights & Upsell", price: 499, icon: "Sparkles", desc: "Customer insights + smart upsell suggestions that lift every bill." },
  { id: "priority_support", name: "Priority 24×7 Support", price: 299, icon: "Headset", desc: "Dedicated line + fastest response, any time." },
  { id: "aggregator", name: "Aggregator Integration", price: 199, icon: "UtensilsCrossed", desc: "Swiggy, Zomato, Magicpin — orders flow straight into your POS." },
  { id: "kiosk", name: "Kiosk", price: 499, icon: "Monitor", desc: "Self-ordering kiosk for faster queues and higher ticket sizes." },
  { id: "token_management", name: "Token Management", price: 199, icon: "Ticket", desc: "Automated token display and queue management for counters." },
  { id: "payment_gateway", name: "Payment Gateway Integration", price: 199, icon: "CreditCard", desc: "Accept online payments seamlessly through your POS." },
  { id: "edc", name: "EDC Integration", price: 199, icon: "Wifi", desc: "Connect your card machine directly to the POS for auto-reconciliation." },
  { id: "housekeeping", name: "Housekeeping Module", price: 299, icon: "SprayCan", desc: "Room status tracking, task assignment & housekeeping dashboard." },
  { id: "channel_manager", name: "Channel Manager Integration", price: 499, icon: "Network", desc: "Sync room availability & rates across OTAs from one dashboard." },
  { id: "whatsapp_marketing", name: "WhatsApp Marketing", price: 799, icon: "Megaphone", desc: "Bulk campaigns, promotional offers & targeted marketing on WhatsApp." },
];

export const PLANS = [
  { id: "starter", name: "Starter", price: 799, tagline: "New & single small outlets", popular: false, icon: "Store",
    includes: ["POS & Billing", "KOT", "Owner Dashboard (basic)", "Daily sales reports", "1 billing device"],
    includedAddons: [] },
  { id: "growth", name: "Growth", price: 1499, tagline: "Cafés & growing restaurants", popular: false, icon: "TrendingUp",
    includes: ["Everything in Starter", "Captain App", "KDS", "Online Ordering", "CRM (basic)", "GST / VAT reports", "Token Management", "Aggregator Integration"],
    includedAddons: ["token_management", "aggregator"] },
  { id: "pro", name: "Pro", price: 2499, tagline: "Full-service, QSR & high volume", popular: true, icon: "Rocket",
    includes: ["Everything in Growth", "Branded Website", "Loyalty + Wallet", "WhatsApp Automation", "WhatsApp Marketing", "Inventory", "Audit reports", "AI Insights & Upsell"],
    includedAddons: ["branded_ordering", "token_management", "loyalty_wallet", "whatsapp", "ai_insights", "aggregator", "payment_gateway", "edc", "whatsapp_marketing"] },
  { id: "custom", name: "Custom", price: null, tagline: "Tailored for your workflow", popular: false, icon: "Settings2",
    includes: ["Fully customized feature set", "Dedicated account manager", "Custom integrations", "Bespoke reporting", "SLA-backed support"],
    includedAddons: [], contactOnly: true },
];

export const QUIZ = {
  outletType: ["Café", "Restaurant / Fine Dine", "QSR / Fast Food", "Cloud Kitchen", "Hotel / Resort", "Food Court", "Canteen / Mess", "Bar & Brewery", "Chain / Franchise"],
  outlets: ["1", "2–5", "6+"],
  volume: ["Under 1,000", "1,000–5,000", "5,000+"],
  priority: ["Stop leakage & theft", "Serve faster", "Bring customers back", "Control multiple outlets", "Go online / delivery"],
};

export const MONTHS_PER_YEAR = 12; // annual-only billing: per-month price × 12 = yearly total
export const GST_RATE = 0.18; // 18% GST added on top of the annual subtotal (tax rule — code-controlled)

export const planById = (id) => PLANS.find((p) => p.id === id);
export const addonById = (id) => ADDONS.find((a) => a.id === id);

// Rule-based recommendation engine
// `priorities` is now an array (up to 3 selections); single string still accepted for compat.
export function recommend({ outletType, outlets, volume, priorities, priority }) {
  const ps = Array.isArray(priorities) ? priorities : (priority ? [priority] : []);
  const has = (p) => ps.includes(p);

  let planId = "growth";
  if (outlets === "6+" || outletType === "Chain / Franchise") planId = "pro";
  else if (outletType === "Hotel / Resort") planId = "pro";
  else if (outlets === "2–5") planId = "pro";
  else if (volume === "5,000+") planId = "pro";
  else if (volume === "Under 1,000" && outlets === "1") planId = "starter";
  else if (outletType === "QSR / Fast Food" || outletType === "Cloud Kitchen") planId = "growth";
  else planId = "growth";

  const wanted = new Set();
  if (has("Stop leakage & theft")) { wanted.add("central_inventory"); wanted.add("ai_insights"); }
  if (has("Serve faster")) { wanted.add("branded_ordering"); wanted.add("kiosk"); }
  if (has("Bring customers back")) { wanted.add("loyalty_wallet"); wanted.add("whatsapp"); }
  if (has("Control multiple outlets")) { wanted.add("central_inventory"); wanted.add("priority_support"); }
  if (has("Go online / delivery")) { wanted.add("branded_ordering"); wanted.add("aggregator"); }
  if (outletType === "Hotel / Resort") { wanted.add("hotel_billing"); wanted.add("channel_manager"); }
  if (outletType === "Cloud Kitchen") { wanted.add("branded_ordering"); wanted.add("aggregator"); }

  const plan = planById(planId);
  const addons = [...wanted].filter((a) => !plan.includedAddons.includes(a));

  const priorityText = ps.length === 0
    ? "your goals"
    : ps.length === 1
    ? `"${ps[0].toLowerCase()}"`
    : ps.slice(0, -1).map((p) => `"${p.toLowerCase()}"`).join(", ") + ` and "${ps[ps.length - 1].toLowerCase()}"`;

  const reason = `Based on a ${outlets === "1" ? "single" : outlets + "-outlet"} ${outletType.toLowerCase()} doing ${volume.toLowerCase()} orders/month, focused on ${priorityText}, we recommend the ${plan.name} plan` +
    (addons.length ? ` plus ${addons.map((a) => addonById(a)?.name || a).join(", ")}.` : ".");

  return { planId, addons, reason };
}

// "Owners like you also added" cross-sell by outlet type
export function alsoAdded(outletType, selected, planId) {
  const map = {
    "Café": ["loyalty_wallet", "whatsapp"],
    "Restaurant / Fine Dine": ["loyalty_wallet", "ai_insights"],
    "QSR / Fast Food": ["branded_ordering", "aggregator"],
    "Cloud Kitchen": ["branded_ordering", "aggregator"],
    "Hotel / Resort": ["hotel_billing", "channel_manager"],
    "Food Court": ["central_inventory", "loyalty_wallet"],
    "Canteen / Mess": ["loyalty_wallet", "token_management"],
    "Bar & Brewery": ["loyalty_wallet", "ai_insights"],
    "Chain / Franchise": ["central_inventory", "priority_support"],
  };
  const plan = planById(planId);
  const list = map[outletType] || ["loyalty_wallet", "ai_insights"];
  return list.filter((a) => !selected.includes(a) && !plan.includedAddons.includes(a));
}
