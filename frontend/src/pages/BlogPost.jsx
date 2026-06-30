import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, User } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Markdown from "@/components/site/Markdown";
import Seo from "@/components/site/Seo";
import { SITE_URL } from "@/lib/seo";
import { useCms, useContent } from "@/lib/cms/CmsProvider";
import POSTS from "@/data/blogPosts.json";

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPost() {
  const { slug } = useParams();
  const cms = useCms();
  const raw = useContent("blog.posts", POSTS);
  let posts = POSTS;
  try {
    posts = typeof raw === "string" ? JSON.parse(raw) : raw || POSTS;
  } catch {
    posts = POSTS;
  }
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    // Wait for CMS published content before deciding a slug is missing —
    // avoids redirecting away from posts created via the inline CMS on deep-link.
    if (cms && !cms.publishedLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white" data-testid="blog-post-loading">
          <div className="w-8 h-8 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
        </div>
      );
    }
    return <Navigate to="/blog" replace />;
  }

  const related = posts.filter((p) => p.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.heading || post.title,
    description: post.description,
    image: post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/brand/banner.png`,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "MyGenie POS" },
    publisher: {
      "@type": "Organization",
      name: "MyGenie POS",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };

  return (
    <div className="bg-white" data-testid="blog-post-page">
      <Seo title={`${post.heading || post.title} | MyGenie Blog`} description={post.description} path={`/blog/${slug}`} image={post.image} type="article" jsonLd={jsonLd} />
      <Navbar />
      <main>
        <article className="pt-32 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-green" data-testid="blog-back"><ArrowLeft className="w-4 h-4" /> All articles</Link>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mt-5 leading-tight tracking-tight">{post.heading || post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
              <span className="inline-flex items-center gap-1.5"><User className="w-4 h-4" /> MyGenie</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {fmtDate(post.date)}</span>
            </div>
            {post.image && <img src={post.image} alt={post.heading || post.title} className="w-full rounded-[2rem] mt-8 border border-brand-line" />}
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <Markdown>{post.body}</Markdown>
          </div>

          {/* CTA */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <div className="rounded-[2rem] bg-brand-deep text-white p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute -top-16 -right-12 w-60 h-60 rounded-full bg-brand-green/20 blur-3xl" />
              <h2 className="relative font-display text-2xl sm:text-3xl font-bold tracking-tight">See MyGenie on your own data.</h2>
              <p className="relative mt-3 text-[#C7D2CB] max-w-lg mx-auto">Book a free, tailored walkthrough and see how MyGenie boosts profit and stops leakage for your business.</p>
              <a href="/#demo" data-testid="blog-cta-demo" className="relative mt-6 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5">Book a Free Demo <ArrowRight className="w-5 h-5" /></a>
            </div>
          </div>
        </article>

        {/* Related */}
        <section className="pb-24" data-testid="blog-related">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-brand-ink mb-6">Keep reading</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((p, i) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} data-testid={`blog-related-${i}`} className="group rounded-3xl border border-brand-line overflow-hidden hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] transition-all">
                  <div className="aspect-[16/10] overflow-hidden bg-brand-sand">
                    {p.image && <img src={p.image} alt={p.heading} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-base font-semibold text-brand-ink leading-snug group-hover:text-brand-green transition-colors line-clamp-2">{p.heading || p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
