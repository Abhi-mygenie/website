import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { SECTORS, MODULE_BUCKETS } from "@/data/content";

const SOLUTIONS = SECTORS.map((s) => ({ to: `/solutions/${s.slug}`, name: s.name, icon: s.icon, line: s.line }));
const PRODUCTS = MODULE_BUCKETS.map((b) => ({ to: `/product/${b.slug}`, name: b.title, icon: b.icon, line: b.line }));

const RESOURCES = [
  { to: "/blog", name: "Blog", icon: "BookOpen", line: "Guides on POS, profit, inventory and customer experience." },
  { to: "/roi", name: "ROI Calculator", icon: "Calculator", line: "See how much profit MyGenie could add for you." },
  { to: "/resources", name: "Help & FAQ", icon: "HelpCircle", line: "Answers to common questions about MyGenie." },
];

function NavDropdown({ label, items, cols = 2, to }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const suppressUntil = useRef(0);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  };
  // The navbar remounts on every route change. When fresh DOM appears under a
  // stationary cursor, the browser fires a synthetic mouseenter that would
  // re-open the menu. Ignore hover-open briefly so the menu stays closed until
  // the user actually moves the mouse.
  useEffect(() => {
    suppressUntil.current = Date.now() + 600;
    return cancelClose;
  }, []);

  const handleEnter = () => {
    if (Date.now() < suppressUntil.current) return;
    cancelClose();
    setOpen(true);
  };

  const triggerCls = "flex items-center gap-1 text-[15px] font-medium text-brand-ink/80 hover:text-brand-green transition-colors";

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
    >
      {to ? (
        <Link to={to} className={triggerCls} data-testid={`nav-dd-${label.toLowerCase()}`} aria-expanded={open} onClick={() => setOpen(false)}>
          {label} <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </Link>
      ) : (
        <button className={triggerCls} data-testid={`nav-dd-${label.toLowerCase()}`} aria-expanded={open} onClick={() => setOpen(true)}>
          {label} <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className={`bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-brand-line p-3 grid gap-1 w-[${cols === 2 ? "640px" : "340px"}]`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, width: cols === 2 ? 640 : 340 }}>
            {items.map((it, i) => {
              const Icon = Icons[it.icon] || Icons.Box;
              const orange = i % 2 === 1;
              return (
                <Link key={it.to} to={it.to} onClick={() => setOpen(false)} className="flex gap-3 rounded-xl p-3 hover:bg-brand-sand transition-colors" data-testid={`nav-dd-item-${it.to.replace(/\//g, "-")}`}>
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${orange ? "bg-brand-orange/10" : "bg-brand-green/10"}`}>
                    <Icon className={`w-4.5 h-4.5 ${orange ? "text-brand-orange" : "text-brand-green"}`} style={{ width: 18, height: 18 }} />
                  </span>
                  <span>
                    <span className="block font-semibold text-brand-ink text-[14px]">{it.name}</span>
                    <span className="block text-[12px] text-brand-muted leading-snug mt-0.5 line-clamp-1">{it.line}</span>
                  </span>
                </Link>
              );
            })}
            {to && (
              <Link to={to} onClick={() => setOpen(false)} className="col-span-full flex items-center justify-center gap-1.5 rounded-xl p-2.5 mt-1 text-sm font-semibold text-brand-green hover:bg-brand-green/5 transition-colors" data-testid={`nav-dd-viewall-${label.toLowerCase()}`}>
                View all {label.toLowerCase()} <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ onDemo }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileSec, setMobileSec] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-testid="navbar" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" : "bg-white/80 backdrop-blur-sm"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Link to="/" data-testid="nav-logo-link"><Logo /></Link>

        <nav className="hidden lg:flex items-center gap-8">
          <NavDropdown label="Solutions" items={SOLUTIONS} cols={2} to="/solutions" />
          <NavDropdown label="Product" items={PRODUCTS} cols={1} to="/product" />
          <Link to="/ai" className="flex items-center gap-1 text-[15px] font-medium text-brand-ink/80 hover:text-brand-green transition-colors" data-testid="nav-link-ai">Practical AI</Link>
          <Link to="/pricing" className="text-[15px] font-medium text-brand-ink/80 hover:text-brand-green transition-colors" data-testid="nav-link-pricing">Pricing</Link>
          <Link to="/customers" className="text-[15px] font-medium text-brand-ink/80 hover:text-brand-green transition-colors" data-testid="nav-link-customers">Customers</Link>
          <NavDropdown label="Resources" items={RESOURCES} cols={1} />
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {onDemo ? (
            <button onClick={() => onDemo()} data-testid="nav-demo-btn" className="bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-2.5 font-semibold text-[15px] transition-all hover:-translate-y-0.5 shadow-[0_6px_18px_rgba(24,168,74,0.3)]">Book a Free Demo</button>
          ) : (
            <a href="/#demo" data-testid="nav-demo-btn" className="bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-2.5 font-semibold text-[15px] transition-all hover:-translate-y-0.5 shadow-[0_6px_18px_rgba(24,168,74,0.3)]">Book a Free Demo</a>
          )}
        </div>

        <button className="lg:hidden p-2 text-brand-ink" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle" aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-brand-line px-6 py-4 max-h-[80vh] overflow-auto" data-testid="nav-mobile-menu">
          {[{ key: "sol", label: "Solutions", items: SOLUTIONS, to: "/solutions" }, { key: "prod", label: "Product", items: PRODUCTS, to: "/product" }].map((grp) => (
            <div key={grp.key} className="border-b border-brand-line/60">
              <button onClick={() => setMobileSec(mobileSec === grp.key ? null : grp.key)} className="w-full flex items-center justify-between py-3 text-brand-ink font-semibold" data-testid={`nav-mobile-${grp.key}`}>
                {grp.label} <ChevronDown className={`w-4 h-4 transition-transform ${mobileSec === grp.key ? "rotate-180" : ""}`} />
              </button>
              {mobileSec === grp.key && (
                <div className="pb-3 space-y-1">
                  <Link to={grp.to} onClick={() => setOpen(false)} className="block py-2 pl-3 text-[14px] font-semibold text-brand-green" data-testid={`nav-mobile-viewall-${grp.key}`}>View all {grp.label.toLowerCase()} →</Link>
                  {grp.items.map((it) => (
                    <Link key={it.to} to={it.to} onClick={() => setOpen(false)} className="block py-2 pl-3 text-[14px] text-brand-muted hover:text-brand-green">{it.name}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link to="/pricing" onClick={() => setOpen(false)} className="flex items-center justify-between py-3 text-brand-ink font-semibold border-b border-brand-line/60">Pricing <ChevronRight className="w-4 h-4 text-brand-muted" /></Link>
          <Link to="/ai" onClick={() => setOpen(false)} className="flex items-center justify-between py-3 text-brand-ink font-semibold border-b border-brand-line/60">Practical AI <ChevronRight className="w-4 h-4 text-brand-muted" /></Link>
          <Link to="/customers" onClick={() => setOpen(false)} className="flex items-center justify-between py-3 text-brand-ink font-semibold border-b border-brand-line/60">Customers <ChevronRight className="w-4 h-4 text-brand-muted" /></Link>
          <Link to="/blog" onClick={() => setOpen(false)} className="flex items-center justify-between py-3 text-brand-ink font-semibold border-b border-brand-line/60">Blog <ChevronRight className="w-4 h-4 text-brand-muted" /></Link>
          <Link to="/roi" onClick={() => setOpen(false)} className="flex items-center justify-between py-3 text-brand-ink font-semibold border-b border-brand-line/60">ROI Calculator <ChevronRight className="w-4 h-4 text-brand-muted" /></Link>
          <Link to="/resources" onClick={() => setOpen(false)} className="flex items-center justify-between py-3 text-brand-ink font-semibold border-b border-brand-line/60">Help & FAQ <ChevronRight className="w-4 h-4 text-brand-muted" /></Link>
          <a href="/#demo" onClick={() => setOpen(false)} className="mt-4 block text-center w-full bg-brand-green text-white rounded-full py-3 font-semibold">Book a Free Demo</a>
        </div>
      )}
    </header>
  );
}
