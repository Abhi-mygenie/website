import { Navigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Markdown from "@/components/site/Markdown";
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";
import { LEGAL } from "@/data/legal";

// Renders Terms / Privacy / Refund from ported live-site content.
export default function Legal({ doc, path }) {
  const data = LEGAL[doc];
  if (!data) return <Navigate to="/" replace />;
  const seo = PAGE_SEO[path] || {};

  return (
    <div className="bg-white" data-testid={`legal-page-${doc}`}>
      <Seo title={seo.title} description={seo.description} path={path} />
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-brand-ink tracking-tight">{data.title}</h1>
          <div className="mt-6 border-t border-brand-line pt-2">
            <Markdown>{data.body}</Markdown>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
