import { useEffect, useRef } from "react";

/**
 * Tracks how far a section has scrolled through the viewport, as a ref
 * (not state) so 3D components can read it inside useFrame without
 * triggering React re-renders on every scroll tick.
 *
 * progress.current.enter: 0 when the section's top is at the bottom of
 *   the viewport, 1 when the section's top reaches the viewport top.
 * progress.current.center: -1..1, where 0 means the section's center is
 *   aligned with the viewport's center (useful for "focus" style effects).
 */
export function useScrollProgress(sectionRef) {
  const progress = useRef({ enter: 0, center: 0 });

  useEffect(() => {
    let frame = null;

    function measure() {
      frame = null;
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;

      const enter = 1 - Math.min(Math.max(rect.top / viewportHeight, 0), 1);
      progress.current.enter = enter;

      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const center = (viewportCenter - sectionCenter) / viewportCenter;
      progress.current.center = Math.min(Math.max(center, -1), 1);
    }

    function onScroll() {
      if (frame === null) frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sectionRef]);

  return progress;
}
