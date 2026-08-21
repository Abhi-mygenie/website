import "@/App.css";
import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
const Pricing             = lazy(() => import("@/pages/Pricing"));
const SectorPage          = lazy(() => import("@/pages/SectorPage"));
const ProductPage         = lazy(() => import("@/pages/ProductPage"));
const SolutionsIndex      = lazy(() => import("@/pages/SolutionsIndex"));
const ProductIndex        = lazy(() => import("@/pages/ProductIndex"));
const SuccessStories      = lazy(() => import("@/pages/SuccessStories"));
const RoiCalculator       = lazy(() => import("@/pages/RoiCalculator"));
const Resources           = lazy(() => import("@/pages/Resources"));
const AiPage              = lazy(() => import("@/pages/AiPage"));
const Blog                = lazy(() => import("@/pages/Blog"));
const BlogPost            = lazy(() => import("@/pages/BlogPost"));
const About               = lazy(() => import("@/pages/About"));
const Contact             = lazy(() => import("@/pages/Contact"));
const Legal               = lazy(() => import("@/pages/Legal"));
const LeadsView           = lazy(() => import("@/pages/LeadsView"));
const PetpoojaAlternative = lazy(() => import("@/pages/PetpoojaAlternative"));
const DemoLanding         = lazy(() => import("@/pages/DemoLanding"));
const PaymentSuccess      = lazy(() => import("@/pages/PaymentSuccess"));
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
        <Suspense fallback={<div className="min-h-screen bg-brand-sand" aria-label="Loading..." />}>
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
        </Suspense>
      </BrowserRouter>
      <CmsAdminLayer />
      <ConsentBanner />
      {process.env.REACT_APP_WHATSAPP_ENABLED !== "false" && <WhatsAppFab />}
    </div>
  );
}

export default App;
