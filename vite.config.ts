import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: true },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  // Pre-bundle heavy libs so dev + first-paint don't pay per-icon cost
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "axios",
      "lucide-react",
      "date-fns",
      "recharts",
      "framer-motion",
    ],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Group big libs into stable vendor chunks instead of fragmenting
        // into hundreds of tiny per-icon / per-component files.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-editor";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("date-fns")) return "vendor-date";
          if (id.includes("react-dom") || id.includes("/react/")) return "vendor-react";
          return "vendor";
        },
      },
    },
  },
}));
