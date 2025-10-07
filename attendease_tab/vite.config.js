import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 53001,
    proxy: {
      '/api': {
        target: 'https://localhost:53000',
        changeOrigin: true,
        secure: false
      },
      '/static': {
        target: 'https://localhost:53000',
        changeOrigin: true,
        secure: false
      }
    },
    // Removed the 'https' configuration to force standard HTTP.
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});