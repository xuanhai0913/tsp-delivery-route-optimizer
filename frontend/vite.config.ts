import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: "dist",
    target: "es2022",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
