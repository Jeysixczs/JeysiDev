import { useScroll, useSpring, useTransform, useVelocity, useMotionTemplate } from "framer-motion";

/**
 * Turns raw scroll speed into a few motion values a section can apply to
 * itself: a skew that leans into the scroll direction, a slight scale
 * compression, and a blur — all proportional to how fast the page is
 * moving, and all settling back to neutral the moment scrolling slows
 * or stops. Framer's useVelocity already gives px/sec from useScroll's
 * scrollY, so this just smooths it (useSpring) and remaps it into a
 * few sane visual ranges (useTransform).
 *
 * Pass `enabled: false` (reduced motion / touch) to pin everything at
 * its resting value instead of unsubscribing — keeps the hook's return
 * shape stable for the caller.
 */
export function useScrollVelocityTilt({ enabled = true, intensity = 1 } = {}) {
  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(rawVelocity, { damping: 50, stiffness: 400 });

  const clampedVelocity = useTransform(smoothVelocity, (v) => (enabled ? v : 0));

  const maxSkew = 6 * intensity;
  const skewY = useTransform(clampedVelocity, [-2500, 0, 2500], [-maxSkew, 0, maxSkew], {
    clamp: true,
  });
  const scale = useTransform(clampedVelocity, [-2500, 0, 2500], [0.985, 1, 0.985], {
    clamp: true,
  });
  const blurPx = useTransform(clampedVelocity, (v) => Math.min(Math.abs(v) / 900, 3) * intensity);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return { skewY, scale, filter };
}
