import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@tanstack/react-router": path.resolve(__dirname, "src/lib/tanstack-router-shim.tsx"),
    },
  },
  build: {
    outDir: "dist",
  },
});
