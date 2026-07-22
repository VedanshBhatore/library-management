import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api to the Express server in dev so cookies work under one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
