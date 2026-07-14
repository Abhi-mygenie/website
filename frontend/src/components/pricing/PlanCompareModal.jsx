import { X } from "lucide-react";
import ComparisonTable from "./ComparisonTable";

export default function PlanCompareModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
      data-testid="compare-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-deep/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-line shrink-0">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-ink">
              Compare all plans
            </h2>
            <p className="text-sm text-brand-muted mt-0.5">
              See exactly what's in each plan at a glance.
            </p>
          </div>
          <button
            onClick={onClose}
            data-testid="compare-modal-close"
            className="w-10 h-10 rounded-full bg-brand-sand hover:bg-brand-line flex items-center justify-center text-brand-ink transition-all hover:scale-110 shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable table body */}
        <div className="overflow-y-auto px-3 sm:px-6 pb-8">
          <ComparisonTable hideHeading />
        </div>
      </div>
    </div>
  );
}
