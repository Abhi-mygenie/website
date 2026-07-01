import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Youtube, Facebook } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import MessageForm from "@/components/site/MessageForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, SITE_URL } from "@/lib/seo";
import { COMPANY } from "@/data/company";

function ContactTabs() {
  const [tab, setTab] = useState("message");
  const tabCls = (active) =>
    `flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
      active ? "bg-brand-green text-white shadow-[0_8px_22px_rgba(24,168,74,0.28)]" : "text-brand-muted hover:text-brand-ink"
    }`;
  return (
    <div data-testid="contact-tabs">
      <div className="flex gap-1 p-1 rounded-full bg-brand-sand border border-brand-line mb-4">
        <button type="button" onClick={() => setTab("message")} className={tabCls(tab === "message")} data-testid="contact-tab-message">
          Send a message
        </button>
        <button type="button" onClick={() => setTab("demo")} className={tabCls(tab === "demo")} data-testid="contact-tab-demo">
          Book a demo
        </button>
      </div>
      {tab === "message" ? <MessageForm /> : <DemoForm />}
    </div>
  );
}

export default function Contact() {
  const seo = PAGE_SEO["/contact"];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: seo.title,
    url: `${SITE_URL}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "MyGenie POS",
      email: COMPANY.email,
      telephone: COMPANY.phoneIntl,
      address: { "@type": "PostalAddress", addressLocality: "Agra", addressRegion: "Uttar Pradesh", addressCountry: "IN" },
    },
  };

  const items = [
    { icon: Mail, label: "Email us", value: COMPANY.supportEmail, href: `mailto:${COMPANY.supportEmail}`, testid: "contact-email" },
    { icon: Phone, label: "Call us", value: COMPANY.phone, href: `tel:${COMPANY.phoneIntl}`, testid: "contact-phone" },
    { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: `https://wa.me/${COMPANY.whatsapp}`, testid: "contact-whatsapp" },
    { icon: MapPin, label: "Location", value: COMPANY.location, href: null, testid: "contact-location" },
  ];

  return (
    <div className="bg-white" data-testid="contact-page">
      <Seo title={seo.title} description={seo.description} path="/contact" jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">Contact us</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">Want to know more? Reach out to us.</h1>
            <p className="mt-4 text-lg text-brand-muted">Questions about features, pricing or your specific business? Our team is here to help — and happy to show you a tailored demo.</p>
          </div>

          <div className="mt-12 grid lg:grid-cols-2 gap-12 items-start">
            <div className="grid sm:grid-cols-2 gap-5">
              {items.map((it, i) => {
                const Icon = it.icon;
                const orange = i % 2 === 1;
                const inner = (
                  <div className="h-full bg-white rounded-2xl border border-brand-line p-6 hover:shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all">
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${orange ? "bg-brand-orange/10" : "bg-brand-green/10"}`}>
                      <Icon className={`w-6 h-6 ${orange ? "text-brand-orange" : "text-brand-green"}`} />
                    </span>
                    <p className="text-sm text-brand-muted mt-4">{it.label}</p>
                    <p className="font-display text-lg font-semibold text-brand-ink mt-0.5 break-words">{it.value}</p>
                  </div>
                );
                return it.href ? (
                  <a key={it.label} href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" data-testid={it.testid}>{inner}</a>
                ) : (
                  <div key={it.label} data-testid={it.testid}>{inner}</div>
                );
              })}
              <div className="sm:col-span-2 flex items-center gap-3">
                <a href={COMPANY.social.youtube} target="_blank" rel="noreferrer" data-testid="contact-youtube" className="w-11 h-11 rounded-xl bg-brand-sand flex items-center justify-center text-brand-ink hover:text-brand-green transition-colors"><Youtube className="w-5 h-5" /></a>
                <a href={COMPANY.social.facebook} target="_blank" rel="noreferrer" data-testid="contact-facebook" className="w-11 h-11 rounded-xl bg-brand-sand flex items-center justify-center text-brand-ink hover:text-brand-green transition-colors"><Facebook className="w-5 h-5" /></a>
              </div>
            </div>

            <Reveal delay={0.05}><ContactTabs /></Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
