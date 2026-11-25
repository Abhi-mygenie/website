import { matchPath } from "react-router-dom";
import { lazyRoute } from "@/lib/lazyRoute";
import { REDIRECTS } from "@/data/redirects";

const Pricing             = lazyRoute(() => import("@/pages/Pricing"));
const SectorPage          = lazyRoute(() => import("@/pages/SectorPage"));
const ProductPage         = lazyRoute(() => import("@/pages/ProductPage"));
const SolutionsIndex      = lazyRoute(() => import("@/pages/SolutionsIndex"));
const ProductIndex        = lazyRoute(() => import("@/pages/ProductIndex"));
const SuccessStories      = lazyRoute(() => import("@/pages/SuccessStories"));
const RoiCalculator       = lazyRoute(() => import("@/pages/RoiCalculator"));
const Resources           = lazyRoute(() => import("@/pages/Resources"));
const AiPage              = lazyRoute(() => import("@/pages/AiPage"));
const Blog                = lazyRoute(() => import("@/pages/Blog"));
const BlogPost            = lazyRoute(() => import("@/pages/BlogPost"));
const About               = lazyRoute(() => import("@/pages/About"));
const Contact             = lazyRoute(() => import("@/pages/Contact"));
const Legal               = lazyRoute(() => import("@/pages/Legal"));
const LeadsView           = lazyRoute(() => import("@/pages/LeadsView"));
const PetpoojaAlternative = lazyRoute(() => import("@/pages/PetpoojaAlternative"));
const DemoLanding         = lazyRoute(() => import("@/pages/DemoLanding"));
const PaymentSuccess      = lazyRoute(() => import("@/pages/PaymentSuccess"));
const ThankYou            = lazyRoute(() => import("@/pages/ThankYou"));
const RestaurantBillingSoftware    = lazyRoute(() => import("@/pages/RestaurantBillingSoftware"));
const RestaurantPosSystem          = lazyRoute(() => import("@/pages/RestaurantPosSystem"));
const RestaurantManagementSoftware = lazyRoute(() => import("@/pages/RestaurantManagementSoftware"));
const QsrPosSystem                 = lazyRoute(() => import("@/pages/QsrPosSystem"));
const CloudKitchenPos              = lazyRoute(() => import("@/pages/CloudKitchenPos"));
const RestaurantPosComparison      = lazyRoute(() => import("@/pages/RestaurantPosComparison"));
export const NotFound     = lazyRoute(() => import("@/pages/NotFound"));

// Single route table used by App.js (<Route>) and index.js (preloadRoute). Home ("/") and "*" stay in App.js.
export const ROUTES = [
  { path: "/pricing",         Component: Pricing },
  { path: "/solutions",       Component: SolutionsIndex },
  { path: "/solutions/:slug", Component: SectorPage },
  { path: "/product",         Component: ProductIndex },
  { path: "/product/:bucket", Component: ProductPage },
  { path: "/customers",       Component: SuccessStories },
  { path: "/roi",             Component: RoiCalculator },
  { path: "/resources",       Component: Resources },
  { path: "/ai",              Component: AiPage },
  { path: "/blog",            Component: Blog },
  { path: "/blog/:slug",      Component: BlogPost },
  { path: "/about",           Component: About },
  { path: "/contact",         Component: Contact },
  { path: "/terms",           Component: Legal, props: { doc: "terms",   path: "/terms" } },
  { path: "/privacy",         Component: Legal, props: { doc: "privacy", path: "/privacy" } },
  { path: "/refund",          Component: Legal, props: { doc: "refund",  path: "/refund" } },
  // CR-7 — Internal Leads View (CMS-auth gated, dashboard ENV-gated — CR-153)
  { path: "/leads",           Component: LeadsView, enabled: process.env.REACT_APP_LEADS_ENABLED !== "false" },
  // CR-20 — Petpooja comparison landing page (Google Ads, standalone)
  { path: "/petpooja-alternative", Component: PetpoojaAlternative },
  // CR-21-E — Demo landing page (cold/Meta ad traffic, standalone)
  { path: "/demo",            Component: DemoLanding },
  // CR-85 / CR-86 / CR-148 / CR-149 / CR-152 / CR-150 — Google Ads LPs (standalone)
  { path: "/restaurant-billing-software",    Component: RestaurantBillingSoftware },
  { path: "/restaurant-pos-system",          Component: RestaurantPosSystem },
  { path: "/restaurant-management-software", Component: RestaurantManagementSoftware },
  { path: "/qsr-pos-system",                 Component: QsrPosSystem },
  { path: "/cloud-kitchen-pos",              Component: CloudKitchenPos },
  { path: "/restaurant-pos-comparison",      Component: RestaurantPosComparison },
  { path: "/payment-success", Component: PaymentSuccess },
  // CR-176 — Thank-you page (post-Calendly booking)
  { path: "/thank-you",       Component: ThankYou },
];

// CR-238: resolve the page chunk for a direct load before React's first render.
export function preloadRoute(pathname) {
  const target = REDIRECTS[pathname] || pathname;
  if (target === "/") return Promise.resolve();
  const hit = ROUTES.find((r) => r.enabled !== false && matchPath({ path: r.path, end: true }, target));
  return (hit ? hit.Component : NotFound).preload();
}
