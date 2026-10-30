import { useEffect, useRef, useState } from "react";

/**
 * Turns a smoothed mouse ref into a small [x, y] pixel offset for DOM
 * parallax — e.g. hero copy drifting slightly opposite the 3D scene to
 * sell depth. `strength` is the max offset in pixels. Pass `enabled:
 * false` (reduced motion, touch devices) to freeze at [0, 0].
 */
export function useParallax(smoothMouse, { strength = 12, enabled = true } = {}) {
  const [offset, setOffset] = useState([0, 0]);
  const frame = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setOffset([0, 0]);
      return undefined;
    }

    function tick() {
      const { x, y } = smoothMouse.current;
      setOffset([x * strength, -y * strength]);
      frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [smoothMouse, strength, enabled]);

  return offset;
}
