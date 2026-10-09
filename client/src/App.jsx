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
import { useDeviceCapability } from "./hooks/useDeviceCapability";

const LOAD_DURATION = 2000;
const LOAD_STATUS = ["booting interface", "loading assets", "polishing pixels", "ready"];
const WORD = "JEYSIDEV";

function LoadScreen({ prefersReducedMotion }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const pct = Math.min((now - start) / LOAD_DURATION, 1);
      // ease-in-out so the fill accelerates, then settles at 100
      const eased = pct < 0.5 ? 2 * pct * pct : 1 - Math.pow(-2 * pct + 2, 2) / 2;
      setProgress(Math.round(eased * 100));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const statusIndex = Math.min(
    LOAD_STATUS.length - 1,
    Math.floor((progress / 100) * LOAD_STATUS.length)
  );

  const wordClass =
    "absolute inset-0 flex items-center justify-center whitespace-nowrap font-display text-[19vw] font-bold leading-none tracking-tighter";

  return (
    <motion.div
      key="loader"
      initial={{ y: 0 }}
      exit={{
        y: "-100%",
        transition: { duration: prefersReducedMotion ? 0.2 : 0.9, ease: [0.76, 0, 0.24, 1] },
      }}
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[100] overflow-hidden bg-void"
    >
      <div className="hero-grid pointer-events-none absolute inset-0" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-6 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 sm:px-10">
        <span>
          JeysiDev<span className="text-cyan">.</span>
        </span>
        <span>Portfolio &mdash; {new Date().getFullYear()}</span>
      </div>

      {/* Wordmark: outline underneath, solid white revealed from the bottom up */}
      <div className="absolute inset-x-0 top-1/2 h-[24vw] -translate-y-1/2" aria-hidden="true">
        <div
          className={`${wordClass} text-transparent`}
          style={{ WebkitTextStroke: "1.5px rgb(var(--c-fg) / 0.35)" }}
        >
          {WORD}
        </div>
        <div
          className={`${wordClass} text-white`}
          style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
        >
          {WORD}
        </div>
      </div>

      {/* Bottom bar: status + counter */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-6 sm:px-10 sm:pb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em]">
          <p className="text-cyan">{LOAD_STATUS[statusIndex]}</p>
          <div className="mt-3 h-px w-28 bg-white/15 sm:w-48">
            <div className="h-full bg-white" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <p className="font-display text-6xl font-medium leading-none tabular-nums text-white sm:text-8xl">
          {String(progress).padStart(3, "0")}
        </p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const { prefersReducedMotion } = useDeviceCapability();

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

      <Navbar />
      <main>
        <Hero ready={!loading} />
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
