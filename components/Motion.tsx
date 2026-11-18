'use client';
// One observer for the whole site: reveals [data-reveal] blocks and draws .orn arcs on scroll.
// Content stays visible by default: only blocks still below the fold get hidden (armed) before
// they reveal, so nothing disappears without JS, before hydration, or with reduced motion.
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function Motion() {
  const pathname = usePathname();
  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Automated browsers (screenshots, axe) get the finished page.
    const skip = still || !('IntersectionObserver' in window) || navigator.webdriver;
    // Re-runs (soft navigation, StrictMode) pick up anything not finished yet.
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)'));
    const arcs = Array.from(document.querySelectorAll<SVGElement>('.orn:not(.drawn)'));
    if (skip) return;
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('orn') ? 'drawn' : 'in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '100000px 0px -8% 0px' }); // anything scrolled past counts as seen
    const fold = window.innerHeight * 0.92;
    reveals.forEach(el => {
      if (!el.classList.contains('rv-armed')) {
        if (el.getBoundingClientRect().top < fold) return; // already on screen: leave it alone
        el.classList.add('rv-armed');
      }
      io.observe(el);
    });
    arcs.forEach(el => { el.classList.add('armed'); io.observe(el); });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
