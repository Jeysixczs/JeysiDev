import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";


function devApi(env) {
  return {
    name: "dev-api-chat",
    configureServer(server) {
      server.middlewares.use("/api/chat", async (req, res) => {
        for (const [k, v] of Object.entries(env)) {
          if (process.env[k] === undefined) process.env[k] = v;
        }
        try {
          const mod = await server.ssrLoadModule("/api/chat.js");
          await mod.default(req, res);
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Dev API error: " + e.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), devApi(env)],
    server: { port: 5173 },
  };
});
