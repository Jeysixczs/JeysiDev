import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const META_COLORS = { dark: "#06080F", light: "#F6F7FB" };

function readTheme() {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

function applyTheme(theme, animate) {
  const root = document.documentElement;

  if (animate) {
    // Cross-fade colours for a moment (see .theme-transition in globals.css).
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  }

  root.setAttribute("data-theme", theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", META_COLORS[theme]);
}

/**
 * Light / dark theme state. The initial value is resolved by the inline
 * script in index.html (saved choice, else the OS preference), so this hook
 * just mirrors it and handles toggling + persistence. If the visitor has
 * never picked a theme, it keeps following the OS setting live.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);

  const setTheme = useCallback((next) => {
    applyTheme(next, true);
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage can be blocked (private mode); the choice just won't persist */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e) => {
      let saved = null;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (saved === "light" || saved === "dark") return; // explicit choice wins
      const next = e.matches ? "light" : "dark";
      applyTheme(next, true);
      setThemeState(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return { theme, setTheme, toggleTheme };
}
