import { useEffect, useRef } from "react";

/**
 * Wraps a raw mouse-position ref (as returned by useMousePosition) and
 * produces a second ref that eases toward it over time. Runs its own
 * requestAnimationFrame loop so it works outside the R3F render loop too
 * (custom cursor, DOM parallax) — components already inside useFrame can
 * keep lerping directly and don't need this.
 *
 * @param {{current:{x:number,y:number}}} rawMouse - source ref, values in [-1, 1]
 * @param {number} smoothing - 0..1, higher = snappier, lower = floatier
 */
export function useSmoothMouse(rawMouse, smoothing = 0.12) {
  const smoothed = useRef({ x: 0, y: 0 });
  const frame = useRef(null);

  useEffect(() => {
    function tick() {
      const raw = rawMouse.current;
      smoothed.current.x += (raw.x - smoothed.current.x) * smoothing;
      smoothed.current.y += (raw.y - smoothed.current.y) * smoothing;
      frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [rawMouse, smoothing]);

  return smoothed;
}
