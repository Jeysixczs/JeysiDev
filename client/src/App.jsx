import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Cursor from "./components/ui/Cursor";
import { useDeviceCapability } from "./hooks/useDeviceCapability";

function LoadScreen() {
  return (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-void"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="font-display text-2xl tracking-tight text-ink"
      >
        JeysiDev<span className="text-cyan">.</span>
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
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>{loading && <LoadScreen />}</AnimatePresence>

      {showCustomCursor && <Cursor />}

      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Services />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
