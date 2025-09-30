import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
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
    https: {
      cert: process.env.SSL_CRT_FILE ? fs.readFileSync(process.env.SSL_CRT_FILE) : undefined,
      key: process.env.SSL_KEY_FILE ? fs.readFileSync(process.env.SSL_KEY_FILE) : undefined,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
