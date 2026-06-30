import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo";

/**
 * Per-page SEO: title, description, canonical, Open Graph, Twitter + optional JSON-LD.
 * Usage: <Seo title="..." description="..." path="/pricing" image="/brand/x.png" jsonLd={...} />
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title || `${SITE_NAME} — The Hospitality Operating System`;
  const url = `${SITE_URL}${path || ""}`;
  const img = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : DEFAULT_OG_IMAGE;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      {jsonLd &&
        (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((obj, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
        ))}
    </Helmet>
  );
}
