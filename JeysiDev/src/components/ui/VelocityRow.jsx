import { motion, useAnimationFrame, useMotionValue, useTransform, wrap } from "framer-motion";

// How many copies of the row's content sit side by side in the scroller.
// The loop only reads as seamless if `wrap()` cycles through exactly
// 100 / COPIES percent before resetting, so this constant drives both
// the JSX (how many copies render) and the wrap range below.
const COPIES = 4;
const WRAP_RANGE = 100 / COPIES;

/**
 * One row of an infinite horizontal marquee. Drifts on its own at a
 * constant `baseVelocity` (sign sets direction: negative drifts left,
 * positive drifts right) — steady regardless of whether or how fast
 * the page is being scrolled. Purely decorative and non-interactive:
 * pointer events are disabled on the content so it can't be hovered,
 * dragged, or focused.
 */
export default function VelocityRow({ children, baseVelocity = 2, paused = false }) {
  const baseX = useMotionValue(0);
  const x = useTransform(baseX, (v) => `${wrap(-WRAP_RANGE, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (paused) return;
    baseX.set(baseX.get() + baseVelocity * (delta / 1000));
  });

  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="pointer-events-none flex flex-none select-none items-center will-change-transform"
        style={{ x }}
      >
        {Array.from({ length: COPIES }).map((_, i) => (
          <div key={i} className="flex flex-none items-center" aria-hidden={i > 0}>
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
