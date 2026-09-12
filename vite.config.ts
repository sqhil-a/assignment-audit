import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { groqDevProxy } from "./dev/groqProxy";
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY || "";
  return {
    plugins: [react(), ...(command === "serve" ? [groqDevProxy(apiKey)] : [])],
    base: process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || "./",
    define: {
      "import.meta.env.VITE_DEV_AUDIT_ENABLED": JSON.stringify(
        command === "serve" && !!apiKey ? "true" : "false",
      ),
    },
    build: { chunkSizeWarningLimit: 650 },
  };
});
