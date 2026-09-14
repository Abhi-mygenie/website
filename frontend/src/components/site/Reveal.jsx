import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, className = "", y = 28 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);  // START VISIBLE — progressive enhancement
  useEffect(() => {
    // Respect reduced-motion preference — skip animation entirely
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Skip re-hide during Puppeteer prerender (navigator.webdriver = true)
    // so the static snapshot has opacity:1 on all elements
    if (navigator.webdriver) return;
    // CR-237: skip animation for elements already in the viewport at mount time.
    // Prevents above-fold Reveal elements from flashing opacity:0 during hydration.
    // Threshold mirrors rootMargin:"-80px" — element must be 80px inside viewport.
    const rect = ref.current?.getBoundingClientRect();
    const alreadyInView = rect && rect.top < (window.innerHeight - 80) && rect.bottom > 0;
    if (alreadyInView) return;
    // Re-hide for animation, then reveal on intersection
    setVisible(false);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "-80px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
