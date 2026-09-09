import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useDeviceCapability } from "../../hooks/useDeviceCapability";

/**
 * Wraps children in a card that tilts toward the cursor in 3D space,
 * lifts slightly on hover, and gives its inner <img> (if any) a small
 * parallax drift so the card reads as a stack of depth layers rather
 * than a flat tilting plane. Rotation is kept subtle (max ~8deg) so it
 * reads as tactile, not gimmicky.
 *
 * On touch devices there's no hover/mousemove, so instead of going
 * static the card tilts as a finger drags across it (touchmove) and
 * gives a springy tap bounce (touchstart/touchend) — the same physics,
 * driven by touch input instead of the pointer. Both are skipped when
 * reduced motion is requested.
 *
 * `spotlightColor` accepts an "r,g,b" triplet (no `rgb()` wrapper) so
 * callers can recolor the cursor-follow glow per instance — e.g. the
 * skills grid tints each card's glow to match its category. Defaults
 * to the site's cyan accent.
 */
export default function TiltCard({ children, className = "", spotlightColor = "61,218,215" }) {
  const ref = useRef(null);
  const imageRef = useRef(null);
  const rectRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const { hasFinePointer, isTouch, prefersReducedMotion } = useDeviceCapability();
  const interactive = (hasFinePointer || isTouch) && !prefersReducedMotion;

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 150, damping: 18 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-7, 7]), springConfig);
  const lift = useSpring(hovered && !prefersReducedMotion ? -8 : 0, {
    stiffness: 220,
    damping: 22,
  });
  const scale = useSpring(
    hovered && !prefersReducedMotion ? (isTouch ? 0.97 : 1.02) : 1,
    { stiffness: 260, damping: 20 }
  );
  const glowX = useTransform(mouseX, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(mouseY, [0, 1], ["0%", "100%"]);

  // Locate the card's image once mounted so it can drift slightly
  // opposite the tilt — a cheap way to fake layered depth without
  // requiring callers to restructure their markup.
  useEffect(() => {
    imageRef.current = ref.current?.querySelector("img") ?? null;
  }, [children]);

  function cacheRect() {
    // Measured once per hover/touch session instead of on every move —
    // getBoundingClientRect() forces a layout reflow, and calling it on
    // every mousemove (which can fire dozens of times a second per card)
    // was the main source of jank when hovering across the skills grid.
    if (ref.current) rectRef.current = ref.current.getBoundingClientRect();
  }

  function updateFromPoint(clientX, clientY) {
    const rect = rectRef.current;
    if (!rect) return;
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    mouseX.set(px);
    mouseY.set(py);

    if (imageRef.current) {
      const offsetX = (px - 0.5) * 14;
      const offsetY = (py - 0.5) * 14;
      imageRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(1.08)`;
    }
  }

  function resetTilt() {
    setHovered(false);
    rectRef.current = null;
    mouseX.set(0.5);
    mouseY.set(0.5);
    if (imageRef.current) {
      imageRef.current.style.transform = "translate3d(0, 0, 0) scale(1)";
    }
  }

  function handleMouseEnter() {
    if (isTouch) return;
    cacheRect();
    setHovered(true);
  }

  function handleMouseMove(e) {
    if (!interactive || isTouch) return;
    updateFromPoint(e.clientX, e.clientY);
  }

  function handleTouchStart(e) {
    if (!interactive) return;
    cacheRect();
    setHovered(true);
    const touch = e.touches[0];
    if (touch) updateFromPoint(touch.clientX, touch.clientY);
  }

  function handleTouchMove(e) {
    if (!interactive) return;
    const touch = e.touches[0];
    if (touch) updateFromPoint(touch.clientX, touch.clientY);
  }

  return (
    <motion.div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetTilt}
      onTouchCancel={resetTilt}
      style={
        interactive
          ? { rotateX, rotateY, y: lift, scale, transformPerspective: 900 }
          : { y: lift, scale }
      }
      className={`group relative ${className}`}
    >
      {interactive && (
        <motion.div
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 ${
            isTouch
              ? hovered
                ? "opacity-100"
                : "opacity-0"
              : "opacity-0 group-hover:opacity-100"
          }`}
          style={{
            background: `radial-gradient(280px circle at ${glowX} ${glowY}, rgba(${spotlightColor},0.18), transparent 65%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
