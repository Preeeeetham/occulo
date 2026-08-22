import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Initialises Lenis smooth scrolling globally.
 * Wraps the native scroll with lerp-based easing for a premium, buttery feel
 * while preserving keyboard/touch accessibility.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      infinite: false,
      autoResize: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Watch for dynamic DOM height changes (images loading, layout changes, animations)
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }
    if (document.documentElement) {
      resizeObserver.observe(document.documentElement);
    }

    // Also trigger resize on window resize and all media loads
    const handleResize = () => lenis.resize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("load", handleResize);

    // Expose for scrollTo calls (e.g. nav anchor clicks)
    (window as any).__lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);
}

/**
 * Smoothly scroll to element by ID, using Lenis if available.
 */
export function smoothScrollTo(id: string) {
  const lenis = (window as any).__lenis;
  if (lenis) {
    const el = document.getElementById(id);
    if (el) lenis.scrollTo(el, { offset: 0 });
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
}
