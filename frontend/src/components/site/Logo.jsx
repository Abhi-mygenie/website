// Official MyGenie logo. On dark backgrounds it sits on a white chip for contrast.
import { EditableImage } from "@/components/cms/Editable";

export default function Logo({ light = false, className = "" }) {
  return (
    <span className={`inline-flex items-center ${light ? "bg-white rounded-lg px-3 py-1.5" : ""} ${className}`} data-testid="brand-logo">
      <EditableImage id="brand.logo_image" fallback="/brand/logo.svg" alt="MyGenie POS" className="h-8 w-auto" />
    </span>
  );
}
