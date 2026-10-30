import { useEffect, useState } from "react";

/**
 * Detects low-power / touch contexts so 3D scenes and cursor effects can
 * scale down or disable themselves:
 * - narrow viewport (phones/tablets)
 * - prefers-reduced-motion
 * - low logical CPU core count, when reported
 * - absence of a fine pointer (mouse/trackpad) — used to gate the custom
 *   cursor and drag interactions, since a coarse/touch pointer can't
 *   hover anyway
 */
export function useDeviceCapability() {
  const [state, setState] = useState({
    isMobile: false,
    prefersReducedMotion: false,
    isLowPower: false,
    hasFinePointer: true,
    isTouch: false,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const touchQuery = window.matchMedia("(pointer: coarse)");
    const cores = navigator.hardwareConcurrency || 8;

    function update() {
      setState({
        isMobile: mediaQuery.matches,
        prefersReducedMotion: motionQuery.matches,
        isLowPower: mediaQuery.matches || cores <= 4,
        hasFinePointer: pointerQuery.matches,
        isTouch: touchQuery.matches,
      });
    }

    update();
    mediaQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    pointerQuery.addEventListener("change", update);
    touchQuery.addEventListener("change", update);
    return () => {
      mediaQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
      pointerQuery.removeEventListener("change", update);
      touchQuery.removeEventListener("change", update);
    };
  }, []);

  return state;
}
