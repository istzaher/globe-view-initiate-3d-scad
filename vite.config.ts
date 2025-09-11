import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: 3000,
    host: "::",
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 10000,
    host: "0.0.0.0",
    // Handle client-side routing - fallback to index.html for SPA
    // This ensures React Router works properly in production
    open: false,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure proper asset references
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
