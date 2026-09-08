import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Split three.js / fiber into their own chunk so the initial
    // JS payload for text content stays small.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          fiber: ["@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
});
