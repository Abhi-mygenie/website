import "@/App.css";
import { useEffect, useState, Suspense, lazy } from "react";
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
const NotFound            = lazy(() => import("@/pages/NotFound"));
const ThankYou            = lazy(() => import("@/pages/ThankYou"));
const RestaurantBillingSoftware  = lazy(() => import("@/pages/RestaurantBillingSoftware"));
const RestaurantPosSystem        = lazy(() => import("@/pages/RestaurantPosSystem"));
const RestaurantManagementSoftware = lazy(() => import("@/pages/RestaurantManagementSoftware"));
const QsrPosSystem               = lazy(() => import("@/pages/QsrPosSystem"));
const CloudKitchenPos            = lazy(() => import("@/pages/CloudKitchenPos"));
const RestaurantPosComparison    = lazy(() => import("@/pages/RestaurantPosComparison"));
const CmsAdminLayer = lazy(() => import("@/components/cms/CmsAdminLayer"));
import ConsentBanner from "@/components/site/ConsentBanner";
import WhatsAppFab from "@/components/site/WhatsAppFab";
import ScrollDepthTracker from "@/components/site/ScrollDepthTracker";
import { REDIRECTS } from "@/data/redirects";
import { initAttribution } from "@/lib/attribution";
import { setDefaultConsent, pushEvent } from "@/lib/gtm";

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
    setDefaultConsent(); // CR-199: restores stored localStorage consent choice; GTM now loaded from <head>
    initAttribution();
    pushEvent("page_view", { page_path: pathname + search, page_url: window.location.href });
  }, [pathname, search]);
  return null;
}

// CR-205: Lazy-page Suspense wrapper — placed INSIDE each matched route element,
// not at the app shell level. This prevents React #418 during hydrateRoot because:
//   - Puppeteer prerender doesn't emit <!--$?--> Suspense markers
//   - A shell-level Suspense triggers React's marker check on every page
//   - Per-route LP means Suspense only activates for the matching route
//   - On the homepage <Home> is NOT lazy → LP never renders → no Suspense → no #418
function LP({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-sand" aria-label="Loading..." />}>
      {children}
    </Suspense>
  );
}

function App() {
  // CR-205: defer CmsAdminLayer past hydration.
  // lazy() + <Suspense> requires ReactDOM.renderToString HTML markers (<!--$?-->) for
  // correct hydration. Puppeteer prerender doesn't emit these markers, so React fires
  // #418 on every page. Gating on `hydrated` means the Suspense boundary is absent
  // during the hydration pass (prerender also renders null for non-admins) → no mismatch.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <ScrollToTop />
        <AttributionTracker />
        <ScrollDepthTracker />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<LP><Pricing /></LP>} />
            <Route path="/solutions" element={<LP><SolutionsIndex /></LP>} />
            <Route path="/solutions/:slug" element={<LP><SectorPage /></LP>} />
            <Route path="/product" element={<LP><ProductIndex /></LP>} />
            <Route path="/product/:bucket" element={<LP><ProductPage /></LP>} />
            <Route path="/customers" element={<LP><SuccessStories /></LP>} />
            <Route path="/roi" element={<LP><RoiCalculator /></LP>} />
            <Route path="/resources" element={<LP><Resources /></LP>} />
            <Route path="/ai" element={<LP><AiPage /></LP>} />
            <Route path="/blog" element={<LP><Blog /></LP>} />
            <Route path="/blog/:slug" element={<LP><BlogPost /></LP>} />
            <Route path="/about" element={<LP><About /></LP>} />
            <Route path="/contact" element={<LP><Contact /></LP>} />
            <Route path="/terms" element={<LP><Legal doc="terms" path="/terms" /></LP>} />
            <Route path="/privacy" element={<LP><Legal doc="privacy" path="/privacy" /></LP>} />
            <Route path="/refund" element={<LP><Legal doc="refund" path="/refund" /></LP>} />

            {/* CR-7 — Internal Leads View (CMS-auth gated, dashboard ENV-gated — CR-153) */}
            {process.env.REACT_APP_LEADS_ENABLED !== "false" && (
              <Route path="/leads" element={<LP><LeadsView /></LP>} />
            )}

            {/* CR-20 — Petpooja comparison landing page (Google Ads, standalone) */}
            <Route path="/petpooja-alternative" element={<LP><PetpoojaAlternative /></LP>} />

            {/* CR-21-E — Demo landing page (cold/Meta ad traffic, standalone) */}
            <Route path="/demo" element={<LP><DemoLanding /></LP>} />

            {/* CR-85 — Restaurant Billing Software LP (Google Ads, standalone) */}
            <Route path="/restaurant-billing-software" element={<LP><RestaurantBillingSoftware /></LP>} />

            {/* CR-86 — Restaurant POS System LP (Google Ads — POS System ad group, standalone) */}
            <Route path="/restaurant-pos-system" element={<LP><RestaurantPosSystem /></LP>} />

            {/* CR-148 — Restaurant Management Software LP (Google Ads — Management ad group, standalone) */}
            <Route path="/restaurant-management-software" element={<LP><RestaurantManagementSoftware /></LP>} />

            {/* CR-149 — QSR POS System LP (Google Ads — QSR ad groups, standalone) */}
            <Route path="/qsr-pos-system" element={<LP><QsrPosSystem /></LP>} />

            {/* CR-152 — Cloud Kitchen POS LP (Google Ads — Cloud Kitchen ad group, standalone) */}
            <Route path="/cloud-kitchen-pos" element={<LP><CloudKitchenPos /></LP>} />

            {/* CR-150 — Restaurant POS Comparison LP (Google Ads — POS/Billing Competitors ad group, standalone) */}
            <Route path="/restaurant-pos-comparison" element={<LP><RestaurantPosComparison /></LP>} />

            <Route path="/payment-success" element={<LP><PaymentSuccess /></LP>} />

            {/* CR-176 — Thank-you page (post-Calendly booking) */}
            <Route path="/thank-you" element={<LP><ThankYou /></LP>} />

            {/* 301-equivalent redirects from old live-site URLs */}
            {Object.entries(REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}

            {/* Unknown -> NotFound (CR-79) */}
            <Route path="*" element={<LP><NotFound /></LP>} />
          </Routes>
      </BrowserRouter>
      {hydrated && <Suspense fallback={null}><CmsAdminLayer /></Suspense>}
      <ConsentBanner />
      {process.env.REACT_APP_WHATSAPP_ENABLED !== "false" && <WhatsAppFab />}
    </div>
  );
}

export default App;
