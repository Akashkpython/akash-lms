import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "spa-github-pages-fallback",
      closeBundle() {
        const index = resolve("dist/index.html");
        if (existsSync(index)) copyFileSync(index, resolve("dist/404.html"));
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
});
