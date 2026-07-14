import { X, Play } from "lucide-react";
import { EditableImage, EditableText } from "@/components/cms/Editable";

// Full-screen modal for plan OR add-on feature demo (GIF or video).
// Plan CMS key: plan.<id>.demo_gif  |  Add-on CMS key: addon.<id>.demo_gif
export default function FeatureDemoModal({ plan, addon, open, onClose }) {
  const item = plan || addon;
  const prefix = plan ? "plan" : "addon";
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" data-testid="feature-demo-modal">
      <div className="absolute inset-0 bg-brand-deep/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          data-testid="feature-demo-close"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-brand-ink transition-all hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-ink" data-testid="feature-demo-title">
            {item.name} — Quick Overview
          </h3>
          <p className="text-sm text-brand-muted mt-1" data-testid={`feature-demo-caption-${item.id}`}>
            <EditableText
              id={`${prefix}.${item.id}.demo_caption`}
              fallback={`See ${item.name} in action — how it works inside your POS.`}
            />
          </p>

          <div className="mt-5 rounded-2xl overflow-hidden bg-brand-sand/60 border border-brand-line flex items-center justify-center">
            <EditableImage
              id={`${prefix}.${item.id}.demo_gif`}
              fallback="/brand/plan-demo-placeholder.svg"
              alt={`${item.name} demo`}
              block
              className="w-full h-auto max-h-[70vh] object-contain"
              data-testid={`feature-demo-media-${item.id}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Small orange pill button — used on PlanCard and AddonCard.
export function FeatureDemoButton({ onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      data-testid="feature-demo-btn"
      className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 hover:bg-brand-orange hover:text-white text-brand-orange px-3 py-1.5 text-xs font-bold transition-all shrink-0"
    >
      <Play className="w-3.5 h-3.5" fill="currentColor" /> Overview
    </button>
  );
}
