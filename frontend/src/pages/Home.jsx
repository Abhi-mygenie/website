import { useState, useCallback } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Hero from "@/components/home/Hero";
import TrustBand from "@/components/home/TrustBand";
import ProblemGrid from "@/components/home/ProblemGrid";
import BeforeAfter from "@/components/home/BeforeAfter";
import OutcomePillars from "@/components/home/OutcomePillars";
import SectorSelector from "@/components/home/SectorSelector";
import ModuleOverview from "@/components/home/ModuleOverview";
import AIBand from "@/components/home/AIBand";
import ProofSection from "@/components/home/ProofSection";
import CtaDemo from "@/components/home/CtaDemo";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import Seo from "@/components/site/Seo";
import { PAGE_SEO, ORG_JSONLD } from "@/lib/seo";

export default function Home() {
  const [sector, setSector] = useState("");

  const scrollToDemo = useCallback(() => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSectorDemo = useCallback((name) => {
    setSector(name);
    setTimeout(scrollToDemo, 60);
  }, [scrollToDemo]);

  return (
    <div className="bg-white" data-testid="home-page">
      <Seo title={PAGE_SEO["/"].title} description={PAGE_SEO["/"].description} path="/" jsonLd={ORG_JSONLD} />
      <Navbar onDemo={scrollToDemo} />
      <main>
        <Hero onDemo={scrollToDemo} />
        <TrustBand />
        <ProblemGrid />
        <BeforeAfter />
        <OutcomePillars />
        <SectorSelector onSectorDemo={handleSectorDemo} />
        <ModuleOverview />
        <AIBand />
        <ProofSection />
        <CtaDemo sector={sector} />
      </main>
      <Footer onDemo={scrollToDemo} />
      <StickyMobileCta onDemo={scrollToDemo} />
    </div>
  );
}
