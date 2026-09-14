import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "@/index.css";
import App from "@/App";
import { CmsProvider } from "@/lib/cms/CmsProvider";
import { preloadRoute } from "@/routes";

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
// CR-238: await the matching page chunk before the first render so createRoot commits
// the full page in one pass — prerendered HTML stays on screen, no Suspense fallback flash.
// 3 s race: a slow/failed chunk falls back to today's behaviour (render → lazy() retries).
const render = () => ReactDOM.createRoot(rootEl).render(app);
const timeout = new Promise((r) => setTimeout(r, 3000));
Promise.race([preloadRoute(window.location.pathname).catch(() => {}), timeout]).then(() => {
  window.__pageChunks = performance.getEntriesByType("resource")
    .map((e) => new URL(e.name).pathname)
    .filter((p) => /\/static\/js\/.+\.chunk\.js$/.test(p));
  render();
});
