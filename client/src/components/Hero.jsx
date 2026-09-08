import { useRef } from "react";
import { motion } from "framer-motion";
import AnimatedText from "./ui/AnimatedText";
import Aurora from "./backgrounds/Aurora";
import { profile } from "../data/profile";
import { useMousePosition } from "../hooks/useMousePosition";
import { useSmoothMouse } from "../hooks/useSmoothMouse";
import { useParallax } from "../hooks/useParallax";
import { useDeviceCapability } from "../hooks/useDeviceCapability";

export default function Hero() {
  const sectionRef = useRef(null);
  const mouse = useMousePosition();
  const smoothMouse = useSmoothMouse(mouse, 0.08);
  const { isTouch, hasFinePointer, prefersReducedMotion } = useDeviceCapability();
  // Pointer type, not viewport width — width-based checks flip when the
  // page is zoomed, which would toggle mouse-parallax on/off just from
  // zooming rather than from the actual input device changing.
  const coarsePointer = isTouch || !hasFinePointer;
  // A very small parallax drift on the copy so the content reads as
  // part of the same space as the aurora background, not text pasted
  // on top of it.
  const [parallaxX, parallaxY] = useParallax(smoothMouse, {
    strength: 6,
    enabled: !coarsePointer && !prefersReducedMotion,
  });

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden bg-void-radial"
    >
      <div className="absolute inset-0">
        <Aurora
          colorStops={["#3DDAD7", "#8B6BFF", "#3DDAD7"]}
          amplitude={coarsePointer ? 1.15 : 1.0}
          blend={coarsePointer ? 0.7 : 0.6}
          speed={coarsePointer ? 1.05 : 0.8}
          paused={prefersReducedMotion}
        />
      </div>

      {/* Readability scrim so text stays legible over the aurora */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/10 to-transparent" />

      <motion.div
        className="section-shell relative z-10 pt-24"
        style={{ transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)` }}
        animate={
          coarsePointer && !prefersReducedMotion
            ? { y: [0, -6, 0] }
            : undefined
        }
        transition={
          coarsePointer && !prefersReducedMotion
            ? { duration: 5, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-5 font-mono text-sm text-cyan"
        >
          {profile.location}
        </motion.p>

        <AnimatedText
          text={profile.name}
          as="h1"
          className="font-display text-5xl font-medium leading-[1.05] text-ink sm:text-7xl lg:text-8xl"
        />

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-4 font-display text-xl text-ink-muted sm:text-2xl"
        >
          {profile.role}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-6 max-w-md text-base text-ink-muted sm:text-lg"
        >
          {profile.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a
            href="#projects"
            className="btn-primary"
            data-cursor="view"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            View my work
          </a>
          <a
            href="#contact"
            className="btn-ghost"
            data-cursor="view"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Contact me
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center"
      >
        <div className="mx-auto h-9 w-[22px] rounded-full border border-white/20">
          <motion.div
            animate={{ y: [2, 12, 2], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan"
          />
        </div>
      </motion.div>
    </section>
  );
}
