import { useState } from "react";
import { PlayCircle, Play } from "lucide-react";

/**
 * Renders a feature walkthrough video.
 * - .mp4/.webm/.mov src  -> poster + play button; click to play with controls.
 * - youtube/vimeo src    -> responsive <iframe>.
 * - no src               -> branded "coming soon" placeholder (uses poster if given).
 */
export default function FeatureVideo({ src, poster, title, className = "" }) {
  const [playing, setPlaying] = useState(false);
  const isFile = src && /\.(mp4|webm|mov)(\?.*)?$/i.test(src);
  const isEmbed = src && /(youtube\.com|youtu\.be|vimeo\.com)/i.test(src);

  return (
    <div
      className={`rounded-[2rem] overflow-hidden border border-brand-line bg-brand-deep aspect-video flex items-center justify-center relative ${className}`}
      data-testid="feature-video"
    >
      {isFile ? (
        playing ? (
          <video
            className="w-full h-full object-cover"
            src={src}
            poster={poster || undefined}
            autoPlay
            controls
            playsInline
            onEnded={() => setPlaying(false)}
            data-testid="feature-video-player"
          />
        ) : (
          <div
            className="absolute inset-0 cursor-pointer flex items-center justify-center"
            onClick={() => setPlaying(true)}
            data-testid="feature-video-play"
          >
            {poster && <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-brand-green fill-brand-green ml-1" />
            </div>
          </div>
        )
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
