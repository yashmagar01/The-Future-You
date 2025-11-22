import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  // Include MediaPipe tasks-vision for Vite's dependency pre-bundling
  optimizeDeps: {
    include: ["@mediapipe/tasks-vision"]
  },
  // Ensure MediaPipe is not externalized during SSR (Vercel)
  ssr: {
    noExternal: ["@mediapipe/tasks-vision"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
