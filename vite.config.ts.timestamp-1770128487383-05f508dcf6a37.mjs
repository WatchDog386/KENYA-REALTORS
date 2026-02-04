// vite.config.ts
import { defineConfig } from "file:///C:/Users/korri/OneDrive/Desktop/REALTORS-LEASERS/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/korri/OneDrive/Desktop/REALTORS-LEASERS/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\korri\\OneDrive\\Desktop\\REALTORS-LEASERS";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // Listen on all IPv6 and IPv4 addresses
    port: 8081,
    strictPort: false,
    // Try other ports if 8081 is taken
    cors: {
      origin: "*",
      // Allow all origins during development
      credentials: true
      // Allow cookies/auth headers
    },
    headers: {
      // CORS headers for all responses
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Authorization, Accept",
      "Access-Control-Allow-Credentials": "true"
    },
    // Enable HMR (Hot Module Replacement)
    hmr: {
      protocol: "ws",
      host: "localhost"
    },
    // Proxy configuration for Supabase to avoid CORS
    proxy: {
      "/supabase-auth": {
        target: "https://rcxmrtqgppayncelonls.supabase.co",
        // Your Supabase URL
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/supabase-auth/, "/auth/v1"),
        secure: false,
        // Allow self-signed certs
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Proxying request:", req.method, req.url);
          });
        }
      },
      "/supabase-rest": {
        target: "https://rcxmrtqgppayncelonls.supabase.co",
        // Your Supabase URL
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/supabase-rest/, "/rest/v1"),
        secure: false
      },
      "/supabase-realtime": {
        target: "wss://rcxmrtqgppayncelonls.supabase.co",
        // WebSocket for realtime
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 8080,
    host: true,
    cors: {
      origin: "*",
      credentials: true
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Authorization, Accept"
    }
  },
  plugins: [react()].filter(Boolean),
  build: {
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"]
        }
      }
    },
    sourcemap: mode === "development",
    // Enable sourcemaps in dev
    outDir: "dist",
    assetsDir: "assets"
  },
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Clear console on restart
  clearScreen: true,
  // Environment variables
  define: {
    "process.env": {},
    __DEV__: mode === "development"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxrb3JyaVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFJFQUxUT1JTLUxFQVNFUlNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGtvcnJpXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcUkVBTFRPUlMtTEVBU0VSU1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMva29ycmkvT25lRHJpdmUvRGVza3RvcC9SRUFMVE9SUy1MRUFTRVJTL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsIC8vIExpc3RlbiBvbiBhbGwgSVB2NiBhbmQgSVB2NCBhZGRyZXNzZXNcbiAgICBwb3J0OiA4MDgxLFxuICAgIHN0cmljdFBvcnQ6IGZhbHNlLCAvLyBUcnkgb3RoZXIgcG9ydHMgaWYgODA4MSBpcyB0YWtlblxuICAgIGNvcnM6IHtcbiAgICAgIG9yaWdpbjogXCIqXCIsIC8vIEFsbG93IGFsbCBvcmlnaW5zIGR1cmluZyBkZXZlbG9wbWVudFxuICAgICAgY3JlZGVudGlhbHM6IHRydWUsIC8vIEFsbG93IGNvb2tpZXMvYXV0aCBoZWFkZXJzXG4gICAgfSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAvLyBDT1JTIGhlYWRlcnMgZm9yIGFsbCByZXNwb25zZXNcbiAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLFxuICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCI6IFwiR0VULCBQT1NULCBQVVQsIERFTEVURSwgUEFUQ0gsIE9QVElPTlNcIixcbiAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIlgtUmVxdWVzdGVkLVdpdGgsIENvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbiwgQWNjZXB0XCIsXG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCI6IFwidHJ1ZVwiLFxuICAgIH0sXG4gICAgLy8gRW5hYmxlIEhNUiAoSG90IE1vZHVsZSBSZXBsYWNlbWVudClcbiAgICBobXI6IHtcbiAgICAgIHByb3RvY29sOiBcIndzXCIsXG4gICAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxuICAgIH0sXG4gICAgLy8gUHJveHkgY29uZmlndXJhdGlvbiBmb3IgU3VwYWJhc2UgdG8gYXZvaWQgQ09SU1xuICAgIHByb3h5OiB7XG4gICAgICBcIi9zdXBhYmFzZS1hdXRoXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHBzOi8vcmN4bXJ0cWdwcGF5bmNlbG9ubHMuc3VwYWJhc2UuY29cIiwgLy8gWW91ciBTdXBhYmFzZSBVUkxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvc3VwYWJhc2UtYXV0aC8sIFwiL2F1dGgvdjFcIiksXG4gICAgICAgIHNlY3VyZTogZmFsc2UsIC8vIEFsbG93IHNlbGYtc2lnbmVkIGNlcnRzXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKFwicHJveHlSZXFcIiwgKHByb3h5UmVxLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUHJveHlpbmcgcmVxdWVzdDpcIiwgcmVxLm1ldGhvZCwgcmVxLnVybCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgXCIvc3VwYWJhc2UtcmVzdFwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwczovL3JjeG1ydHFncHBheW5jZWxvbmxzLnN1cGFiYXNlLmNvXCIsIC8vIFlvdXIgU3VwYWJhc2UgVVJMXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3N1cGFiYXNlLXJlc3QvLCBcIi9yZXN0L3YxXCIpLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIFwiL3N1cGFiYXNlLXJlYWx0aW1lXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcIndzczovL3JjeG1ydHFncHBheW5jZWxvbmxzLnN1cGFiYXNlLmNvXCIsIC8vIFdlYlNvY2tldCBmb3IgcmVhbHRpbWVcbiAgICAgICAgd3M6IHRydWUsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDgwODAsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBjb3JzOiB7XG4gICAgICBvcmlnaW46IFwiKlwiLFxuICAgICAgY3JlZGVudGlhbHM6IHRydWUsXG4gICAgfSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIixcbiAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiOiBcIkdFVCwgUE9TVCwgUFVULCBERUxFVEUsIFBBVENILCBPUFRJT05TXCIsXG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIjogXCJYLVJlcXVlc3RlZC1XaXRoLCBDb250ZW50LVR5cGUsIEF1dGhvcml6YXRpb24sIEFjY2VwdFwiLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtyZWFjdCgpXS5maWx0ZXIoQm9vbGVhbiksXG4gIGJ1aWxkOiB7XG4gICAgbWluaWZ5OiBcImVzYnVpbGRcIixcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0LXJvdXRlci1kb21cIl0sXG4gICAgICAgICAgc3VwYWJhc2U6IFtcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBzb3VyY2VtYXA6IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiwgLy8gRW5hYmxlIHNvdXJjZW1hcHMgaW4gZGV2XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBhc3NldHNEaXI6IFwiYXNzZXRzXCIsXG4gIH0sXG4gIGJhc2U6IFwiLi9cIixcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICAvLyBDbGVhciBjb25zb2xlIG9uIHJlc3RhcnRcbiAgY2xlYXJTY3JlZW46IHRydWUsXG4gIC8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuICBkZWZpbmU6IHtcbiAgICBcInByb2Nlc3MuZW52XCI6IHt9LFxuICAgIF9fREVWX186IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIixcbiAgfSxcbn0pKTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQThVLFNBQVMsb0JBQW9CO0FBQzNXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FB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
