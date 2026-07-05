import { Link } from "react-router-dom";
import { Youtube, Facebook, Mail, Phone } from "lucide-react";
import Logo from "./Logo";
import { SECTORS, MODULE_BUCKETS } from "@/data/content";
import { COMPANY } from "@/data/company";

export default function Footer({ onDemo }) {
  return (
    <footer className="bg-brand-deep text-brand-sand" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Logo light />
            <p className="mt-4 text-sm font-semibold text-brand-yellow tracking-wide" data-testid="footer-tagline">
              {COMPANY.tagline}
            </p>
            <p className="mt-2 text-[15px] text-[#9DB1A4] max-w-xs leading-relaxed">
              The hospitality operating system. More profit. Less chaos. Total control — across every outlet.
            </p>
            <button
              onClick={() => (onDemo ? onDemo() : (window.location.href = "/#demo"))}
              data-testid="footer-demo-btn"
              className="mt-6 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-3 font-semibold transition-all hover:-translate-y-0.5"
            >
              Book a Free Demo
            </button>
            <div className="mt-6 space-y-2 text-[14px] text-[#9DB1A4]">
              <a href={`mailto:${COMPANY.supportEmail}`} className="flex items-center gap-2 hover:text-brand-yellow transition-colors" data-testid="footer-email"><Mail className="w-4 h-4" /> {COMPANY.supportEmail}</a>
              <a href={`tel:${COMPANY.phoneIntl}`} className="flex items-center gap-2 hover:text-brand-yellow transition-colors" data-testid="footer-phone"><Phone className="w-4 h-4" /> {COMPANY.phone}</a>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <a href={COMPANY.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" data-testid="footer-youtube" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors"><Youtube className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /></a>
              <a href={COMPANY.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" data-testid="footer-facebook" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors"><Facebook className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Solutions</h4>
            <ul className="space-y-2.5 text-[14px] text-[#9DB1A4]">
              {SECTORS.slice(0, 8).map((s) => (
                <li key={s.slug}><Link to={`/solutions/${s.slug}`} className="hover:text-brand-yellow transition-colors">{s.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2.5 text-[14px] text-[#9DB1A4]">
              {MODULE_BUCKETS.map((b) => (
                <li key={b.slug}><Link to={`/product/${b.slug}`} className="hover:text-brand-yellow transition-colors">{b.title}</Link></li>
              ))}
              <li><Link to="/product/central-inventory" className="hover:text-brand-yellow transition-colors">Central Inventory</Link></li>
              <li><Link to="/ai" className="hover:text-brand-yellow transition-colors">Practical AI</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5 text-[14px] text-[#9DB1A4]">
              <li><Link to="/about" className="hover:text-brand-yellow transition-colors">About Us</Link></li>
              <li><Link to="/customers" className="hover:text-brand-yellow transition-colors">Customer Stories</Link></li>
              <li><Link to="/pricing" className="hover:text-brand-yellow transition-colors">Pricing</Link></li>
              <li><Link to="/blog" className="hover:text-brand-yellow transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-brand-yellow transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2.5 text-[14px] text-[#9DB1A4]">
              <li><Link to="/roi" className="hover:text-brand-yellow transition-colors">ROI Calculator</Link></li>
              <li><Link to="/resources" className="hover:text-brand-yellow transition-colors">Help & FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-brand-yellow transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-yellow transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-brand-yellow transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#9DB1A4]">
          <p>© {new Date().getFullYear()} MyGenie POS. All rights reserved.</p>
          <p>*Profit results based on internal case studies. Individual results may vary.</p>
        </div>
      </div>
    </footer>
  );
}
