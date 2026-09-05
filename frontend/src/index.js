import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "@/index.css";
import App from "@/App";
import { CmsProvider } from "@/lib/cms/CmsProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const rootEl = document.getElementById("root");
const app = (
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <CmsProvider>
          <App />
        </CmsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// CR-205: Use createRoot instead of hydrateRoot.
// hydrateRoot requires Suspense markers (<!--$?-->) that Puppeteer prerender doesn't emit.
// Multiple nested mismatches (CmsAdminLayer Suspense, Routes Suspense, NavDropdown Links)
// were found — each fix revealed the next. createRoot re-renders from scratch; the
// prerendered HTML is still served to browsers/Googlebot for LCP + SEO, React just
// doesn't attempt to reconcile it. Zero hydration errors, identical visual output.
ReactDOM.createRoot(rootEl).render(app);
