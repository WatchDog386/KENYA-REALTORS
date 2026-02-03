import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // Listen on all IPv6 and IPv4 addresses
    port: 8081,
    strictPort: false, // Try other ports if 8081 is taken
    cors: {
      origin: "*", // Allow all origins during development
      credentials: true, // Allow cookies/auth headers
    },
    headers: {
      // CORS headers for all responses
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Authorization, Accept",
      "Access-Control-Allow-Credentials": "true",
    },
    // Enable HMR (Hot Module Replacement)
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
    // Proxy configuration for Supabase to avoid CORS
    proxy: {
      "/supabase-auth": {
        target: "https://rcxmrtqgppayncelonls.supabase.co", // Your Supabase URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-auth/, "/auth/v1"),
        secure: false, // Allow self-signed certs
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Proxying request:", req.method, req.url);
          });
        },
      },
      "/supabase-rest": {
        target: "https://rcxmrtqgppayncelonls.supabase.co", // Your Supabase URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-rest/, "/rest/v1"),
        secure: false,
      },
      "/supabase-realtime": {
        target: "wss://rcxmrtqgppayncelonls.supabase.co", // WebSocket for realtime
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 8080,
    host: true,
    cors: {
      origin: "*",
      credentials: true,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Authorization, Accept",
    },
  },
  plugins: [react()].filter(Boolean),
  build: {
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
    sourcemap: mode === "development", // Enable sourcemaps in dev
    outDir: "dist",
    assetsDir: "assets",
  },
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Clear console on restart
  clearScreen: true,
  // Environment variables
  define: {
    "process.env": {},
    __DEV__: mode === "development",
  },
}));