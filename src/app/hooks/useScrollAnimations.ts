import { useRef } from "react";
import { useScroll, useTransform, useSpring, MotionValue } from "motion/react";

/**
 * Parallax: element moves at a different speed than scroll.
 * offset = how much the element shifts in px over its viewport crossing.
 */
export function useParallax(offset: number = 100) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return { ref, y: smoothY };
}

/**
 * Scroll-linked opacity: fades in as element enters viewport, fades out as it exits.
 */
export function useScrollFade() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // 0→0.3: fade in, 0.3→0.7: full, 0.7→1: fade out
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return { ref, opacity };
}

/**
 * Scroll-linked scale: element grows from 0.9 to 1 as it enters viewport.
 */
export function useScrollScale(from: number = 0.92, to: number = 1) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 0.4], [from, to]);
  const scale = useSpring(raw, { stiffness: 100, damping: 30 });

  return { ref, scale };
}

/**
 * Horizontal scroll progress bar (e.g. page progress indicator)
 */
export function usePageProgress(): MotionValue<string> {
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return width;
}

/**
 * Counter animation: animates a number from 0 to target as element scrolls into view
 */
export function useScrollCounter(target: number) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [0, target]);
  const smoothValue = useSpring(raw, { stiffness: 50, damping: 20 });

  return { ref, value: smoothValue };
}
