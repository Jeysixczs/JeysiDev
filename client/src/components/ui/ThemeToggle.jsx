import { motion, AnimatePresence } from "framer-motion";
import { SunIcon, MoonIcon } from "./icons";

/**
 * Round icon button that flips between light and dark. Shows the icon of
 * the theme you will switch *to* (sun while dark, moon while light).
 */
export default function ThemeToggle({ theme, onToggle, className = "" }) {
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 text-ink transition-colors duration-300 hover:border-white hover:bg-white hover:text-void [touch-action:manipulation] ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
