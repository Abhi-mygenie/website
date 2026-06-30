import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, SITE_URL } from "@/lib/seo";
import { EditableText, EditableList } from "@/components/cms/Editable";
import { useContent } from "@/lib/cms/CmsProvider";
import POSTS from "@/data/blogPosts.json";

const BLOG_FIELDS = [
  { key: "title", label: "SEO title" },
  { key: "heading", label: "Heading (displayed)" },
  { key: "slug", label: "URL slug (e.g. my-post)" },
  { key: "date", label: "Date (YYYY-MM-DD)" },
  { key: "description", label: "Excerpt", type: "textarea" },
  { key: "image", label: "Cover image", type: "image" },
  { key: "body", label: "Body (markdown)", type: "textarea" },
];

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Blog() {
  const seo = PAGE_SEO["/blog"];

  const raw = useContent("blog.posts", POSTS);
  let posts = POSTS;
  try {
    posts = typeof raw === "string" ? JSON.parse(raw) : raw || POSTS;
  } catch {
    posts = POSTS;
  }
  const sorted = [...posts].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "MyGenie Blog",
    url: `${SITE_URL}/blog`,
    blogPost: sorted.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.heading || p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      image: p.image ? `${SITE_URL}${p.image}` : undefined,
    })),
  };

  const [feature, ...rest] = sorted;

  return (
    <div className="bg-white" data-testid="blog-page">
      <Seo title={seo.title} description={seo.description} path="/blog" jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">MyGenie Blog</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              <EditableText id="blog.index.title" fallback="Run a smarter, more profitable hospitality business." />
            </h1>
            <p className="mt-4 text-lg text-brand-muted">
              <EditableText id="blog.index.intro" fallback="Practical guides on POS, inventory, customer experience and profitability — owner to owner." />
            </p>
          </div>

          <EditableList
            id="blog.posts"
            fallback={POSTS}
            fields={BLOG_FIELDS}
            render={() => (
              <>
                {/* Featured */}
                {feature && (
                  <Reveal>
                    <Link to={`/blog/${feature.slug}`} data-testid="blog-feature" className="group mt-10 grid lg:grid-cols-2 gap-8 items-center rounded-[2rem] border border-brand-line overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all">
                      <div className="aspect-[16/10] overflow-hidden bg-brand-sand">
                        {feature.image && <img src={feature.image} alt={feature.heading} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />}
                      </div>
                      <div className="p-8 lg:pr-12">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted"><CalendarDays className="w-4 h-4" /> {fmtDate(feature.date)}</span>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink mt-3 leading-snug group-hover:text-brand-green transition-colors">{feature.heading || feature.title}</h2>
                        <p className="mt-3 text-brand-muted leading-relaxed line-clamp-3">{feature.description}</p>
                        <span className="mt-5 inline-flex items-center gap-2 font-semibold text-brand-green">Read article <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                      </div>
                    </Link>
                  </Reveal>
                )}

                {/* Grid */}
                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {rest.map((p, i) => (
                    <Reveal key={p.slug || i} delay={(i % 3) * 0.05}>
                      <Link to={`/blog/${p.slug}`} data-testid={`blog-card-${i}`} className="group h-full flex flex-col rounded-3xl border border-brand-line overflow-hidden hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] transition-all">
                        <div className="aspect-[16/10] overflow-hidden bg-brand-sand">
                          {p.image && <img src={p.image} alt={p.heading} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />}
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted"><CalendarDays className="w-3.5 h-3.5" /> {fmtDate(p.date)}</span>
                          <h3 className="font-display text-lg font-semibold text-brand-ink mt-2 leading-snug group-hover:text-brand-green transition-colors line-clamp-2">{p.heading || p.title}</h3>
                          <p className="mt-2 text-sm text-brand-muted leading-relaxed line-clamp-3 flex-1">{p.description}</p>
                          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green">Read more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
