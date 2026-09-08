import { useEffect, useRef, useState } from "react";

/**
 * A tiny spring-physics value for DOM-side effects (outside the R3F
 * render loop, where components already lerp per-frame). Call setTarget
 * to move it; the value eases toward the target with velocity + damping
 * instead of jumping, so it reads as physical rather than robotic.
 */
export function useSpringValue(initial = 0, { stiffness = 170, damping = 22 } = {}) {
  const [value, setValue] = useState(initial);
  const state = useRef({ value: initial, velocity: 0, target: initial });
  const frame = useRef(null);

  useEffect(() => {
    let lastTime = performance.now();

    function tick(now) {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const s = state.current;
      const force = (s.target - s.value) * stiffness;
      const damper = -s.velocity * damping;
      const acceleration = force + damper;

      s.velocity += acceleration * delta;
      s.value += s.velocity * delta;

      setValue(s.value);
      frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [stiffness, damping]);

  function setTarget(next) {
    state.current.target = next;
  }

  return [value, setTarget];
}
