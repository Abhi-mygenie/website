import { useLocation, Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";

export default function ThankYou() {
  const location = useLocation();
  const name = location?.state?.name?.split(" ")[0] || "there";
  const seo = PAGE_SEO["/thank-you"];
  return (
    <div className="bg-white" data-testid="thank-you-page">
      <Seo title={seo.title} description={seo.description} path="/thank-you" noindex={true} />
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center py-24 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-11 h-11 text-brand-green" data-testid="thank-you-icon" />
          </div>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mt-6"
            data-testid="thank-you-heading"
          >
            You&apos;re booked, {name}!
          </h1>
          <p className="text-brand-muted mt-3 leading-relaxed">
            Your Google Meet invite is on its way to your inbox, and we&apos;ve sent the details on WhatsApp too.
          </p>
          <p className="text-brand-muted mt-2 leading-relaxed">
            Our specialist will walk you through MyGenie at your booked time.
          </p>
          <Link
            to="/"
            data-testid="thank-you-home-btn"
            className="mt-8 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.3)]"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
