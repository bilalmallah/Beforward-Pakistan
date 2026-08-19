import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    // Production build lands directly in the backend's static-serve
    // folder (see backend/src/middleware/serveFrontend.ts) so a single
    // deployed backend process serves both the SPA and the API — no
    // separate static host needed. See DEPLOYMENT.md.
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});
