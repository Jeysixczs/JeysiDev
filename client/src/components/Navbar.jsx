import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { profile } from "../data/profile";
import { MenuIcon, CloseIcon } from "./ui/icons";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "certificates", label: "Certificates" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;

    // scrollIntoView({ behavior: "smooth" }) alone is unreliable in a few
    // mobile contexts (older Android WebViews, some in-app browsers like
    // Instagram/TikTok/Messenger), where it's ignored or ends up not
    // moving the page at all. Computing the target offset and driving
    // window.scrollTo ourselves works consistently everywhere, and still
    // falls back to an instant jump if smooth scrolling isn't supported.
    const headerOffset = 72; // matches the fixed header's h-[72px]
    const targetTop =
      target.getBoundingClientRect().top + window.scrollY - headerOffset + 1;

    if (typeof window.scrollTo === "function") {
      try {
        window.scrollTo({ top: targetTop, behavior: "smooth" });
      } catch {
        window.scrollTo(0, targetTop);
      }
    }
  }

  function handleNavClick(id) {
    if (open) {
      // The mobile menu panel is still expanded at the moment of the click.
      // Collapsing it (see the AnimatePresence block below) shifts the whole
      // page upward over ~250ms, which fights any scroll we start right now
      // and can make it look like the link does nothing. Close the menu
      // first and wait for its collapse animation to finish before
      // measuring the target's position and scrolling.
      setOpen(false);
      window.setTimeout(() => scrollToSection(id), 260);
    } else {
      scrollToSection(id);
    }
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/[0.06] bg-void/70 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="section-shell flex h-[72px] items-center justify-between">
        <button
          onClick={() => handleNavClick("home")}
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          {profile.name}
          <span className="text-cyan">.</span>
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => handleNavClick(link.id)}
                className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-200 ${
                  activeSection === link.id ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-white/[0.06]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleNavClick("contact")}
          className="hidden rounded-full border border-white/15 px-5 py-2 text-sm text-ink transition-colors hover:border-cyan/60 hover:text-cyan md:inline-flex"
        >
          Let's talk
        </button>

        <button
          className="text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/[0.06] bg-void/95 backdrop-blur-xl md:hidden"
          >
            <ul className="section-shell flex flex-col gap-1 py-4">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <button
                    onClick={() => handleNavClick(link.id)}
                    className={`w-full rounded-lg px-3 py-3 text-left text-base transition-transform active:scale-[0.97] [touch-action:manipulation] ${
                      activeSection === link.id ? "text-cyan" : "text-ink-muted"
                    }`}
                  >
                    {link.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
