/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#06080F",
          soft: "#0A0D18",
        },
        surface: {
          DEFAULT: "#0D1220",
          raised: "#131A2C",
          line: "#1E2740",
        },
        cyan: {
          DEFAULT: "#3DDAD7",
          soft: "#7FF0EC",
        },
        violet: {
          DEFAULT: "#8B6BFF",
          soft: "#B3A0FF",
        },
        amber: {
          DEFAULT: "#FFB347",
        },
        ink: {
          DEFAULT: "#E8ECF4",
          muted: "#8891A7",
          faint: "#525C75",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "signal-gradient": "linear-gradient(135deg, #3DDAD7 0%, #8B6BFF 100%)",
        "void-radial": "radial-gradient(ellipse at 50% -10%, #131A2C 0%, #06080F 60%)",
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
