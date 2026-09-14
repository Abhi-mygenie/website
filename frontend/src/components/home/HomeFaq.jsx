import FaqItem from "@/components/site/FaqItem";
import Reveal from "@/components/site/Reveal";

const FAQS = [
  {
    q: "Does the POS support dynamic UPI QR codes per bill?",
    a: "Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly.",
  },
  {
    q: "Can it track inventory down to ingredient level?",
    a: "Yes. MyGenie tracks stock at recipe and ingredient level using Bill of Materials (BOM) costing. Every dish sold automatically deducts the right quantities from raw ingredient stock — so you always know what's left, what was wasted, and what the per-dish cost is.",
  },
  {
    q: "Does it support multi-outlet management?",
    a: "Yes. The owner dashboard shows live sales, inventory and KPIs across every outlet from one screen on your phone. You can manage stock transfers between outlets, set outlet-specific menus, and control staff access by location — all from a single login.",
  },
  {
    q: "What kind of reports can be generated?",
    a: "MyGenie generates daily sales, item-wise, payment-mode, staff performance, wastage, audit and GST/VAT reports — automatically. Reports arrive on WhatsApp at close of day without logging in. Owners also get recipe-level P&L showing the exact margin on every dish sold.",
  },
  {
    q: "What are the differences between a legacy and a cloud-based POS system?",
    a: "A legacy POS stores data on a local machine — if it crashes, data is lost, and you can only access reports on-site. A cloud POS like MyGenie stores everything securely online: you get live reports from your phone anywhere, automatic updates with no IT cost, and the system keeps working even if the internet drops (local-first billing). Cloud POS also integrates directly with Swiggy, Zomato and payment gateways — legacy systems typically cannot.",
  },
  {
    q: "Can the POS integrate with delivery platforms?",
    a: "Yes. MyGenie integrates directly with Swiggy and Zomato — orders from both platforms flow straight into the POS and kitchen screen without manual entry. You can also take direct commission-free delivery orders through your own ordering link.",
  },
  {
    q: "Can the POS measure end-to-end P&L?",
    a: "Yes. MyGenie tracks P&L at item level — every dish sold shows its revenue, ingredient cost and margin in real time. Combined with purchase costs, wastage data and inter-outlet transfers, owners get a complete picture of profitability across every outlet without assembling spreadsheets.",
  },
];

export default function HomeFaq() {
  return (
    <section className="py-20 sm:py-24" data-testid="home-faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight text-center">
            Frequently asked questions
          </h2>
        </Reveal>
        <div className="mt-8">
          {FAQS.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} testid={`home-faq-${i}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
