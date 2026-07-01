// Official MyGenie logo.
// light=true  → footer (dark background) — uses brand.logo_light_image / logo-light.svg
// light=false → navbar (light background) — uses brand.logo_image / logo.svg
import { EditableImage } from "@/components/cms/Editable";

export default function Logo({ light = false, className = "" }) {
  return (
    <span className={`inline-flex items-center ${className}`} data-testid="brand-logo">
      <EditableImage
        id={light ? "brand.logo_light_image" : "brand.logo_image"}
        fallback={light ? "/brand/logo-light.svg" : "/brand/logo.svg"}
        alt="MyGenie POS"
        className="h-8 w-auto"
      />
    </span>
  );
}
