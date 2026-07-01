import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import SectorPage from "@/pages/SectorPage";
import ProductPage from "@/pages/ProductPage";
import SolutionsIndex from "@/pages/SolutionsIndex";
import ProductIndex from "@/pages/ProductIndex";
import SuccessStories from "@/pages/SuccessStories";
import RoiCalculator from "@/pages/RoiCalculator";
import Resources from "@/pages/Resources";
import AiPage from "@/pages/AiPage";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Legal from "@/pages/Legal";
import LeadsView from "@/pages/LeadsView";
import PetpoojaAlternative from "@/pages/PetpoojaAlternative";
import DemoLanding from "@/pages/DemoLanding";
import PaymentSuccess from "@/pages/PaymentSuccess";
import CmsAdminLayer from "@/components/cms/CmsAdminLayer";
import ConsentBanner from "@/components/site/ConsentBanner";
import WhatsAppFab from "@/components/site/WhatsAppFab";
import ScrollDepthTracker from "@/components/site/ScrollDepthTracker";
import { REDIRECTS } from "@/data/redirects";
import { initAttribution } from "@/lib/attribution";
import { initGtm, pushEvent } from "@/lib/gtm";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function AttributionTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    initGtm();
    initAttribution();
    pushEvent("page_view", { page_path: pathname + search, page_url: window.location.href });
  }, [pathname, search]);
  return null;
}

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <ScrollToTop />
        <AttributionTracker />
        <ScrollDepthTracker />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/solutions" element={<SolutionsIndex />} />
          <Route path="/solutions/:slug" element={<SectorPage />} />
          <Route path="/product" element={<ProductIndex />} />
          <Route path="/product/:bucket" element={<ProductPage />} />
          <Route path="/customers" element={<SuccessStories />} />
          <Route path="/roi" element={<RoiCalculator />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Legal doc="terms" path="/terms" />} />
          <Route path="/privacy" element={<Legal doc="privacy" path="/privacy" />} />
          <Route path="/refund" element={<Legal doc="refund" path="/refund" />} />

          {/* CR-7 — Internal Leads View (CMS-auth gated) */}
          <Route path="/leads" element={<LeadsView />} />

          {/* CR-20 — Petpooja comparison landing page (Google Ads, standalone) */}
          <Route path="/petpooja-alternative" element={<PetpoojaAlternative />} />

          {/* CR-21-E — Demo landing page (cold/Meta ad traffic, standalone) */}
          <Route path="/demo" element={<DemoLanding />} />

          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* 301-equivalent redirects from old live-site URLs */}
          {Object.entries(REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}

          {/* Unknown -> home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <CmsAdminLayer />
      <ConsentBanner />
      {process.env.REACT_APP_WHATSAPP_ENABLED !== "false" && <WhatsAppFab />}
    </div>
  );
}

export default App;
