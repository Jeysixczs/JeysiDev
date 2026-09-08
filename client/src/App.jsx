import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Certificates from "./components/Certificates";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Cursor from "./components/ui/Cursor";
import { useDeviceCapability } from "./hooks/useDeviceCapability";

const LOAD_DURATION = 1700;
const LOAD_STATUS = [
  "booting interface",
  "compiling scene",
  "calibrating light",
  "ready",
];

function LoadScreen({ prefersReducedMotion }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const pct = Math.min((now - start) / LOAD_DURATION, 1);
      // ease-out cubic so the last stretch settles instead of ticking evenly
      setProgress(Math.round((1 - Math.pow(1 - pct, 3)) * 100));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const statusIndex = Math.min(
    LOAD_STATUS.length - 1,
    Math.floor((progress / 100) * LOAD_STATUS.length)
  );

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-void"
    >
      {/* Ambient glow so the panel doesn't sit on flat black */}
      <div className="pointer-events-none absolute inset-0 bg-void-radial" />
      <motion.div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-signal-gradient opacity-[0.12] blur-[100px]"
        animate={
          prefersReducedMotion
            ? undefined
            : { scale: [1, 1.15, 1], opacity: [0.1, 0.16, 0.1] }
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, transition: { duration: 0.3 } }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        {/* Monogram mark */}
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
          <motion.div
            className="absolute inset-[-30%] bg-signal-gradient"
            animate={prefersReducedMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-[1px] rounded-2xl bg-void" />
          <span className="relative font-display text-xl text-ink">JD</span>
        </div>

        <div className="font-display text-2xl tracking-tight text-ink">
          JeysiDev<span className="text-cyan">.</span>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-px w-40 overflow-hidden rounded-full bg-surface-line">
          <motion.div
            className="h-full bg-signal-gradient"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>

        <div className="mt-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          <span className="text-cyan">{LOAD_STATUS[statusIndex]}</span>
          <span className="tabular-nums text-ink-muted">{progress}%</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const { isTouch, hasFinePointer, prefersReducedMotion } = useDeviceCapability();
  // Gate on pointer type, not viewport width — width-based checks flip with
  // browser zoom, which would show/hide the cursor just because the page
  // was zoomed rather than because the input device actually changed.
  const showCustomCursor = hasFinePointer && !isTouch && !prefersReducedMotion;

  useEffect(() => {
    const timer = setTimeout(
      () => setLoading(false),
      prefersReducedMotion ? 400 : LOAD_DURATION + 150
    );
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <>
      <AnimatePresence>
        {loading && <LoadScreen prefersReducedMotion={prefersReducedMotion} />}
      </AnimatePresence>

      {showCustomCursor && <Cursor />}

      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Certificates />
        <Services />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
