// Pricing builder data + rule-based recommendation engine.
// NOTE: ₹ figures are PLACEHOLDERS — swap with real prices anytime.

export const ADDONS = [
  { id: "captain_device", name: "Extra Captain Device", price: 199, icon: "Smartphone", desc: "Add another waiter/captain device for faster tableside ordering." },
  { id: "whatsapp", name: "WhatsApp Automation", price: 499, icon: "MessageCircle", desc: "Automated follow-ups, offers & daily reports on WhatsApp." },
  { id: "loyalty_wallet", name: "Loyalty + Wallet", price: 399, icon: "Gift", desc: "Points, prepaid wallets & repeat-visit rewards." },
  { id: "scan_order", name: "Scan & Order (QR)", price: 299, icon: "QrCode", desc: "Contactless QR ordering & payments from the guest's phone." },
  { id: "online_delivery", name: "Online Ordering & Delivery", price: 399, icon: "Bike", desc: "Direct delivery/takeaway link — zero aggregator commission." },
  { id: "central_inventory", name: "Central Inventory", price: 599, icon: "Boxes", desc: "One stock source of truth across all your outlets." },
  { id: "hotel_billing", name: "Hotel / Room Billing", price: 699, icon: "BedDouble", desc: "Rooms + F&B + spa on one consolidated checkout bill." },
  { id: "ai_insights", name: "AI Insights & Upsell", price: 499, icon: "Sparkles", desc: "Customer insights + smart upsell suggestions that lift every bill." },
  { id: "priority_support", name: "Priority 24×7 Support", price: 299, icon: "Headset", desc: "Dedicated line + fastest response, any time." },
];

export const PLANS = [
  { id: "starter", name: "Starter", price: 799, tagline: "New & single small outlets", popular: false,
    includes: ["POS & Billing", "KOT", "Owner Dashboard (basic)", "Daily sales reports", "1 billing device"],
    includedAddons: [] },
  { id: "growth", name: "Growth", price: 1499, tagline: "Cafés & growing restaurants", popular: false,
    includes: ["Everything in Starter", "Captain App", "KDS", "Scan & Order", "CRM (basic)", "GST / VAT reports"],
    includedAddons: ["scan_order"] },
  { id: "pro", name: "Pro", price: 2499, tagline: "Full-service, QSR & high volume", popular: true,
    includes: ["Everything in Growth", "Loyalty + Wallet", "WhatsApp Automation", "Inventory", "Audit reports", "AI Insights & Upsell"],
    includedAddons: ["scan_order", "loyalty_wallet", "whatsapp", "ai_insights"] },
  { id: "chain", name: "Chain / Enterprise", price: 3999, tagline: "Multi-outlet, hotels & franchises", popular: false,
    includes: ["Everything in Pro", "Central Inventory", "Multi-outlet dashboard", "Role-based access", "Hotel / Room billing", "Priority 24×7 support"],
    includedAddons: ["scan_order", "loyalty_wallet", "whatsapp", "ai_insights", "central_inventory", "hotel_billing", "priority_support"] },
];

export const QUIZ = {
  outletType: ["Café", "Restaurant / Fine Dine", "QSR / Fast Food", "Cloud Kitchen", "Hotel / Resort", "Food Court", "Canteen / Mess", "Bar & Brewery", "Chain / Franchise"],
  outlets: ["1", "2–5", "6+"],
  volume: ["Under 1,000", "1,000–5,000", "5,000+"],
  priority: ["Stop leakage & theft", "Serve faster", "Bring customers back", "Control multiple outlets", "Go online / delivery"],
};

export const MONTHS_PER_YEAR = 12; // annual-only billing: per-month price × 12 = yearly total

export const planById = (id) => PLANS.find((p) => p.id === id);
export const addonById = (id) => ADDONS.find((a) => a.id === id);

// Rule-based recommendation engine
export function recommend({ outletType, outlets, volume, priority }) {
  let planId = "growth";
  if (outlets === "6+" || outletType === "Chain / Franchise") planId = "chain";
  else if (outletType === "Hotel / Resort") planId = outlets === "1" ? "pro" : "chain";
  else if (outlets === "2–5") planId = "pro";
  else if (volume === "5,000+") planId = "pro";
  else if (volume === "Under 1,000" && outlets === "1") planId = "starter";
  else if (outletType === "QSR / Fast Food" || outletType === "Cloud Kitchen") planId = "growth";
  else planId = "growth";

  const wanted = new Set();
  if (priority === "Stop leakage & theft") { wanted.add("central_inventory"); wanted.add("ai_insights"); }
  if (priority === "Serve faster") { wanted.add("scan_order"); wanted.add("captain_device"); }
  if (priority === "Bring customers back") { wanted.add("loyalty_wallet"); wanted.add("whatsapp"); }
  if (priority === "Control multiple outlets") { wanted.add("central_inventory"); wanted.add("priority_support"); }
  if (priority === "Go online / delivery") { wanted.add("online_delivery"); wanted.add("scan_order"); }
  if (outletType === "Hotel / Resort") wanted.add("hotel_billing");
  if (outletType === "Cloud Kitchen") wanted.add("online_delivery");

  const plan = planById(planId);
  const addons = [...wanted].filter((a) => !plan.includedAddons.includes(a));

  const reason = `Based on a ${outlets === "1" ? "single" : outlets + "-outlet"} ${outletType.toLowerCase()} doing ${volume.toLowerCase()} orders/month, with a focus on "${priority.toLowerCase()}", we recommend the ${plan.name} plan` +
    (addons.length ? ` plus ${addons.map((a) => addonById(a).name).join(", ")}.` : ".");

  return { planId, addons, reason };
}

// "Owners like you also added" cross-sell by outlet type
export function alsoAdded(outletType, selected, planId) {
  const map = {
    "Café": ["loyalty_wallet", "whatsapp"],
    "Restaurant / Fine Dine": ["loyalty_wallet", "ai_insights"],
    "QSR / Fast Food": ["scan_order", "online_delivery"],
    "Cloud Kitchen": ["online_delivery", "central_inventory"],
    "Hotel / Resort": ["hotel_billing", "priority_support"],
    "Food Court": ["central_inventory", "loyalty_wallet"],
    "Canteen / Mess": ["loyalty_wallet", "central_inventory"],
    "Bar & Brewery": ["loyalty_wallet", "ai_insights"],
    "Chain / Franchise": ["central_inventory", "priority_support"],
  };
  const plan = planById(planId);
  const list = map[outletType] || ["loyalty_wallet", "ai_insights"];
  return list.filter((a) => !selected.includes(a) && !plan.includedAddons.includes(a));
}
