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
  // Ensure MediaPipe tasks-vision is bundled correctly for production builds
  optimizeDeps: {
    // Pre-bundle the package for faster dev and include it for production
    include: ["@mediapipe/tasks-vision"]
  },
  build: {
    // Allow CommonJS handling for the package
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@mediapipe/tasks-vision": path.resolve(__dirname, "node_modules/@mediapipe/tasks-vision"),
    },
  },
}));
