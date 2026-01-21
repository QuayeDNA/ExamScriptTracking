import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  resolve: {
    alias: {
      "@/ui": path.resolve(__dirname, "./src/components/ui"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    proxy: {
      "/api": {
        target: "http://192.168.43.153:5000",
        changeOrigin: true,
        rewrite: (path) => path, // Keep the /api prefix
      },
      "/socket.io": {
        target: "http://192.168.43.153:5000",
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
      '/uploads': {
        target: 'http://192.168.43.153:5000',  // Proxy uploads for images
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      // Allow serving files from the mobile directory
      allow: ["../"],
    },
  },
});
