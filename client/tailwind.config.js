/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Theme-aware palette. Every colour reads an RGB-channel CSS variable
      // (defined in src/styles/globals.css for both themes) so opacity
      // modifiers like `bg-white/10` keep working.
      //   white -> foreground (white in dark mode, near-black in light mode)
      //   void  -> page background (near-black in dark mode, off-white in light)
      colors: {
        white: "rgb(var(--c-fg) / <alpha-value>)",
        void: {
          DEFAULT: "rgb(var(--c-bg) / <alpha-value>)",
          soft: "rgb(var(--c-bg-soft) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          raised: "rgb(var(--c-surface-raised) / <alpha-value>)",
          line: "rgb(var(--c-surface-line) / <alpha-value>)",
        },
        cyan: {
          DEFAULT: "rgb(var(--c-cyan) / <alpha-value>)",
          soft: "rgb(var(--c-cyan-soft) / <alpha-value>)",
        },
        violet: {
          DEFAULT: "#8B6BFF",
          soft: "#B3A0FF",
        },
        amber: {
          DEFAULT: "#FFB347",
        },
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
          faint: "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "signal-gradient": "linear-gradient(135deg, #3DDAD7 0%, #8B6BFF 100%)",
        "void-radial": "radial-gradient(ellipse at 50% -10%, rgb(var(--c-surface-raised)) 0%, rgb(var(--c-bg)) 60%)",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(61, 218, 215, 0.35)",
        "glow-violet": "0 0 40px -8px rgba(139, 107, 255, 0.35)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};
