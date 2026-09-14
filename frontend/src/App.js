import "@/App.css";
import { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import { ROUTES, NotFound } from "@/routes";
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
// CR-238: on direct load index.js preloads the page chunk before render(), so this
// fallback only paints on client-side navigation (legitimate loading state).
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
            {/* CR-238: lazy page routes come from the shared table in src/routes.js */}
            {ROUTES.filter((r) => r.enabled !== false).map(({ path, Component, props }) => (
              <Route key={path} path={path} element={<LP><Component {...props} /></LP>} />
            ))}

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
