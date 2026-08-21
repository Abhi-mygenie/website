import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Seo from "@/components/site/Seo";

export default function NotFound() {
  return (
    <div className="bg-white" data-testid="not-found-page">
      <Seo
        title="Page Not Found | MyGenie POS"
        description="The page you're looking for doesn't exist."
        noindex={true}
      />
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center py-24 px-4">
        <div className="text-center max-w-md">
          <p
            className="font-display text-8xl font-bold text-brand-green leading-none"
            data-testid="not-found-code"
          >
            404
          </p>
          <h1
            className="font-display text-2xl sm:text-3xl font-bold text-brand-ink mt-6"
            data-testid="not-found-heading"
          >
            Page not found
          </h1>
          <p className="text-brand-muted mt-3 leading-relaxed">
            The page you're looking for doesn't exist or may have moved.
          </p>
          <Link
            to="/"
            data-testid="not-found-home-btn"
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
