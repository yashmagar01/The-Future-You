import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  // Exclude MediaPipe tasks-vision from Vite's dependency pre-bundling and treat it as external in production builds
  optimizeDeps: {
    exclude: ["@mediapipe/tasks-vision"]
  },
  build: {
    rollupOptions: {
      external: ["@mediapipe/tasks-vision"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
