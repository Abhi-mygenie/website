import { METRICS, TRUST_LOGOS } from "@/data/content";
import { EditableList } from "@/components/cms/Editable";

const METRIC_FIELDS = [
  { key: "value", label: "Value (e.g. 40%)" },
  { key: "label", label: "Label" },
];

const LOGO_FIELDS = [
  { key: "name", label: "Name" },
  { key: "img", label: "Logo image", type: "image" },
];

export default function TrustBand() {
  return (
    <section className="bg-brand-sand border-y border-brand-line py-12" data-testid="trust-band">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EditableList
          id="home.metrics"
          fallback={METRICS}
          fields={METRIC_FIELDS}
          render={(items) => (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {items.map((m, i) => (
                <div key={m.testid || i} className="text-center" data-testid={m.testid}>
                  <p className={`font-display text-3xl sm:text-4xl font-bold leading-none ${i % 2 === 1 ? "text-brand-orange" : "text-brand-green"}`}>{m.value}</p>
                  <p className="text-sm text-brand-muted mt-2">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        />

        <p className="text-center text-xs font-semibold uppercase tracking-widest text-brand-muted mb-6">
          Trusted by restaurants, cafés, resorts & chains
        </p>

        <EditableList
          id="home.trust_logos"
          fallback={TRUST_LOGOS}
          fields={LOGO_FIELDS}
          render={(items) => {
            const loop = [...items, ...items];
            return (
              <div className="relative overflow-hidden">
                <div className="flex gap-12 w-max animate-marquee items-center">
                  {loop.map((logo, i) => (
                    <img
                      key={i}
                      src={logo.img}
                      alt={logo.name}
                      title={logo.name}
                      className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                    />
                  ))}
                </div>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}
