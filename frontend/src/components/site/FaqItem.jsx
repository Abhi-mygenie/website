import { useState } from "react";
import { Plus, Minus, ArrowRight, Images } from "lucide-react";
import { Link } from "react-router-dom";
import FeatureVideo from "@/components/site/FeatureVideo";

/**
 * Enriched FAQ accordion.
 * Props: q, a, details?[], media?{type:'image'|'video', src, poster, caption}, links?[{label, to|href}], testid
 * - media.src null => branded "visual coming soon" placeholder (so slots are visible pre-asset).
 */
export default function FaqItem({ q, a, details, media, links, testid }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-brand-line" data-testid={testid}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        data-testid={`${testid}-toggle`}
      >
        <span className="font-display text-lg font-semibold text-brand-ink">{q}</span>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${open ? "bg-brand-green text-white" : "bg-brand-sand text-brand-ink"}`}>
          {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="pb-6 -mt-1 pr-2 sm:pr-10" data-testid={`${testid}-answer`}>
          <p className="text-brand-muted leading-relaxed">{a}</p>

          {details?.map((d, i) => (
            <p key={i} className="text-brand-muted leading-relaxed mt-3">{d}</p>
          ))}

          {media && (
            <div className="mt-4 max-w-xl">
              {media.type === "video" ? (
                <FeatureVideo src={media.src} poster={media.poster} title={media.caption || q} />
              ) : media.src ? (
                <figure>
                  <img src={media.src} alt={media.caption || q} loading="lazy" className="rounded-2xl border border-brand-line w-full" />
                  {media.caption && <figcaption className="text-xs text-brand-muted mt-2">{media.caption}</figcaption>}
                </figure>
              ) : (
                <div className="rounded-2xl border border-dashed border-brand-line bg-brand-sand aspect-video flex flex-col items-center justify-center text-brand-muted">
                  <Images className="w-8 h-8" />
                  <span className="text-sm mt-2">{media.caption || "Visual coming soon"}</span>
                </div>
              )}
            </div>
          )}

          {links?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l, i) =>
                l.to ? (
                  <Link key={i} to={l.to} data-testid={`${testid}-link-${i}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green bg-brand-green/10 hover:bg-brand-green hover:text-white rounded-full px-4 py-2 transition-all">
                    {l.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <a key={i} href={l.href} data-testid={`${testid}-link-${i}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green bg-brand-green/10 hover:bg-brand-green hover:text-white rounded-full px-4 py-2 transition-all">
                    {l.label} <ArrowRight className="w-4 h-4" />
                  </a>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
