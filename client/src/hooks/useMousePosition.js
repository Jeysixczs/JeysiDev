import { useEffect, useRef } from "react";

/**
 * Tracks pointer position normalized to [-1, 1] on both axes (0,0 = center).
 * Returns a ref (not state) so consumers can read it inside useFrame
 * without triggering React re-renders on every mouse move.
 */
export function useMousePosition() {
  const position = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handlePointerMove(event) {
      position.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      position.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return position;
}
