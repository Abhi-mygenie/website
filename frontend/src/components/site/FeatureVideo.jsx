import { PlayCircle } from "lucide-react";

/**
 * Renders a feature walkthrough video.
 * - .mp4/.webm/.mov src  -> self-hosted <video> (autoplay, muted, loop) — ideal for web loops.
 * - youtube/vimeo src    -> responsive <iframe>.
 * - no src               -> branded "coming soon" placeholder (uses poster if given).
 */
export default function FeatureVideo({ src, poster, title, className = "" }) {
  const isFile = src && /\.(mp4|webm|mov)(\?.*)?$/i.test(src);
  const isEmbed = src && /(youtube\.com|youtu\.be|vimeo\.com)/i.test(src);

  return (
    <div
      className={`rounded-[2rem] overflow-hidden border border-brand-line bg-brand-deep aspect-video flex items-center justify-center relative ${className}`}
      data-testid="feature-video"
    >
      {isFile ? (
        <video
          className="w-full h-full object-cover"
          src={src}
          poster={poster || undefined}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : isEmbed ? (
        <iframe
          className="w-full h-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          {poster && <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-brand-deep/85" />
          <div className="relative text-center text-brand-sand p-6">
            <span className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto">
              <PlayCircle className="w-9 h-9 text-brand-yellow" />
            </span>
            <p className="font-display text-lg font-bold mt-3 text-white">{title}</p>
            <p className="text-[#9DB1A4] mt-1 text-sm">Walkthrough video coming soon.</p>
          </div>
        </>
      )}
    </div>
  );
}
