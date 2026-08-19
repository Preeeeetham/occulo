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
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Expose for scrollTo calls (e.g. nav anchor clicks)
    (window as any).__lenis = lenis;

    return () => {
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
