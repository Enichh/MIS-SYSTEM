import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/types": path.resolve(__dirname, "./types"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/components": path.resolve(__dirname, "./app/components"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
