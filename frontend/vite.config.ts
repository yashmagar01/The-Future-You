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
  plugins: [
    react(),
    wasmPath ? viteStaticCopy({
      targets: [
        {
          src: `${wasmPath}/*`,
          dest: "wasm",
        },
      ],
    }) : null,
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
