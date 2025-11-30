import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  build: {
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ["buffer", "Buffer"],
          process: ["process", "process"],
        }),
      ],
    },
  },
});