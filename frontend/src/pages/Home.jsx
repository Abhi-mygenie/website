import { useState, useCallback, lazy, Suspense } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Hero from "@/components/home/Hero";
import TrustBand from "@/components/home/TrustBand";
import Seo from "@/components/site/Seo";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import DemoBottomSheet from "@/components/site/DemoBottomSheet";
import { PAGE_SEO, ORG_JSONLD, SOFTWARE_APP_JSONLD, HOMEPAGE_QA_JSONLD } from "@/lib/seo";

const ProblemGrid    = lazy(() => import("@/components/home/ProblemGrid"));
const BeforeAfter    = lazy(() => import("@/components/home/BeforeAfter"));
const OutcomePillars = lazy(() => import("@/components/home/OutcomePillars"));
const SectorSelector = lazy(() => import("@/components/home/SectorSelector"));
const ModuleOverview = lazy(() => import("@/components/home/ModuleOverview"));
const AIBand         = lazy(() => import("@/components/home/AIBand"));
const ProofSection   = lazy(() => import("@/components/home/ProofSection"));
const CtaDemo        = lazy(() => import("@/components/home/CtaDemo"));
const HomeFaq        = lazy(() => import("@/components/home/HomeFaq"));

export default function Home() {
  const [sector, setSector] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = () => setSheetOpen(true);

  const handleSectorDemo = useCallback((name) => {
    setSector(name);
    setSheetOpen(true);
  }, []);

  return (
    <div className="bg-white" data-testid="home-page">
      <Seo title={PAGE_SEO["/"].title} description={PAGE_SEO["/"].description} path="/" jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD, HOMEPAGE_QA_JSONLD]} />
      <Navbar onDemo={openSheet} />
      <main>
        <Hero onDemo={openSheet} />
        <TrustBand />
        <Suspense fallback={null}>
          <ProblemGrid />
          <BeforeAfter />
        </Suspense>
        <Suspense fallback={null}>
          <OutcomePillars />
          <SectorSelector onSectorDemo={handleSectorDemo} />
          <ModuleOverview />
          <AIBand />
          <ProofSection />
          <HomeFaq />
          <CtaDemo sector={sector} />
        </Suspense>
      </main>
      <Footer onDemo={openSheet} />
      <StickyMobileCta onDemo={openSheet} />
      <DemoBottomSheet sector={sector || "homepage"} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
