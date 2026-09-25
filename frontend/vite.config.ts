import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Function to find the correct path for MediaPipe WASM files
function getMediaPipeWasmPath() {
  const possiblePaths = [
    path.resolve(__dirname, "node_modules/@mediapipe/tasks-vision/wasm"),
    path.resolve(__dirname, "../node_modules/@mediapipe/tasks-vision/wasm")
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p.replace(/\\/g, '/');
    }
  }
  return null;
}

const wasmPath = getMediaPipeWasmPath();
console.log("Resolved MediaPipe WASM path:", wasmPath);

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // ponytail: invisible split only, no visual change. Heavy libs load on demand.
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // ponytail: function form for Vite 8/rolldown compat
        manualChunks: (id: string) => {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("qrcode")) return "vendor-report";
            if (id.includes("@mediapipe")) return "vendor-vision";
            if (id.includes("@tanstack") || id.includes("@supabase")) return "vendor-query";
            if (id.includes("react-router") || id.includes("/react/") || id.includes("/react-dom/")) return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react() as any,
    wasmPath ? (viteStaticCopy({
      targets: [
        {
          src: `${wasmPath}/*`,
          dest: "wasm",
        },
      ],
    }) as any) : null,
  ],
  // Include MediaPipe tasks-vision for Vite's dependency pre-bundling
  optimizeDeps: {
    include: ["@mediapipe/tasks-vision"],
  },
  // Ensure MediaPipe is not externalized during SSR (Vercel)
  ssr: {
    noExternal: ["@mediapipe/tasks-vision"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
