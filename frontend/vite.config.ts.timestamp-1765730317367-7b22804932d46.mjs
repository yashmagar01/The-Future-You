// vite.config.ts
import { defineConfig } from "file:///C:/Users/Yash/OneDrive/Desktop/The-Future-You/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Yash/OneDrive/Desktop/The-Future-You/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import fs from "fs";
import { viteStaticCopy } from "file:///C:/Users/Yash/OneDrive/Desktop/The-Future-You/frontend/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Yash\\OneDrive\\Desktop\\The-Future-You\\frontend";
function getMediaPipeWasmPath() {
  const possiblePaths = [
    path.resolve(__vite_injected_original_dirname, "node_modules/@mediapipe/tasks-vision/wasm"),
    path.resolve(__vite_injected_original_dirname, "../node_modules/@mediapipe/tasks-vision/wasm")
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p.replace(/\\/g, "/");
    }
  }
  return null;
}
var wasmPath = getMediaPipeWasmPath();
console.log("Resolved MediaPipe WASM path:", wasmPath);
var vite_config_default = defineConfig({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    wasmPath ? viteStaticCopy({
      targets: [
        {
          src: `${wasmPath}/*`,
          dest: "wasm"
        }
      ]
    }) : null
  ],
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
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxZYXNoXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcVGhlLUZ1dHVyZS1Zb3VcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFlhc2hcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxUaGUtRnV0dXJlLVlvdVxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvWWFzaC9PbmVEcml2ZS9EZXNrdG9wL1RoZS1GdXR1cmUtWW91L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdGF0aWMtY29weVwiO1xyXG5cclxuLy8gRnVuY3Rpb24gdG8gZmluZCB0aGUgY29ycmVjdCBwYXRoIGZvciBNZWRpYVBpcGUgV0FTTSBmaWxlc1xyXG5mdW5jdGlvbiBnZXRNZWRpYVBpcGVXYXNtUGF0aCgpIHtcclxuICBjb25zdCBwb3NzaWJsZVBhdGhzID0gW1xyXG4gICAgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJub2RlX21vZHVsZXMvQG1lZGlhcGlwZS90YXNrcy12aXNpb24vd2FzbVwiKSxcclxuICAgIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vbm9kZV9tb2R1bGVzL0BtZWRpYXBpcGUvdGFza3MtdmlzaW9uL3dhc21cIilcclxuICBdO1xyXG5cclxuICBmb3IgKGNvbnN0IHAgb2YgcG9zc2libGVQYXRocykge1xyXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocCkpIHtcclxuICAgICAgcmV0dXJuIHAucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuY29uc3Qgd2FzbVBhdGggPSBnZXRNZWRpYVBpcGVXYXNtUGF0aCgpO1xyXG5jb25zb2xlLmxvZyhcIlJlc29sdmVkIE1lZGlhUGlwZSBXQVNNIHBhdGg6XCIsIHdhc21QYXRoKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSBhcyBhbnksXHJcbiAgICB3YXNtUGF0aCA/ICh2aXRlU3RhdGljQ29weSh7XHJcbiAgICAgIHRhcmdldHM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBzcmM6IGAke3dhc21QYXRofS8qYCxcclxuICAgICAgICAgIGRlc3Q6IFwid2FzbVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KSBhcyBhbnkpIDogbnVsbCxcclxuICBdLFxyXG4gIC8vIEluY2x1ZGUgTWVkaWFQaXBlIHRhc2tzLXZpc2lvbiBmb3IgVml0ZSdzIGRlcGVuZGVuY3kgcHJlLWJ1bmRsaW5nXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXCJAbWVkaWFwaXBlL3Rhc2tzLXZpc2lvblwiXSxcclxuICB9LFxyXG4gIC8vIEVuc3VyZSBNZWRpYVBpcGUgaXMgbm90IGV4dGVybmFsaXplZCBkdXJpbmcgU1NSIChWZXJjZWwpXHJcbiAgc3NyOiB7XHJcbiAgICBub0V4dGVybmFsOiBbXCJAbWVkaWFwaXBlL3Rhc2tzLXZpc2lvblwiXSxcclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVyxTQUFTLG9CQUFvQjtBQUMvWCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUNmLFNBQVMsc0JBQXNCO0FBSi9CLElBQU0sbUNBQW1DO0FBT3pDLFNBQVMsdUJBQXVCO0FBQzlCLFFBQU0sZ0JBQWdCO0FBQUEsSUFDcEIsS0FBSyxRQUFRLGtDQUFXLDJDQUEyQztBQUFBLElBQ25FLEtBQUssUUFBUSxrQ0FBVyw4Q0FBOEM7QUFBQSxFQUN4RTtBQUVBLGFBQVcsS0FBSyxlQUFlO0FBQzdCLFFBQUksR0FBRyxXQUFXLENBQUMsR0FBRztBQUNwQixhQUFPLEVBQUUsUUFBUSxPQUFPLEdBQUc7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxJQUFNLFdBQVcscUJBQXFCO0FBQ3RDLFFBQVEsSUFBSSxpQ0FBaUMsUUFBUTtBQUVyRCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sV0FBWSxlQUFlO0FBQUEsTUFDekIsU0FBUztBQUFBLFFBQ1A7QUFBQSxVQUNFLEtBQUssR0FBRyxRQUFRO0FBQUEsVUFDaEIsTUFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDLElBQVk7QUFBQSxFQUNmO0FBQUE7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyx5QkFBeUI7QUFBQSxFQUNyQztBQUFBO0FBQUEsRUFFQSxLQUFLO0FBQUEsSUFDSCxZQUFZLENBQUMseUJBQXlCO0FBQUEsRUFDeEM7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
