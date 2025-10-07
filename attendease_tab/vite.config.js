import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Plugin to copy static scripts to build output
function copyStaticScripts() {
  return {
    name: 'copy-static-scripts',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'src/static/scripts');
      const destDir = path.resolve(__dirname, 'dist/static/scripts');
      
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        files.forEach(file => {
          fs.copyFileSync(
            path.join(srcDir, file),
            path.join(destDir, file)
          );
        });
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyStaticScripts()],
  define: {
    global: 'globalThis',
  },
  server: {
    // Default Vite port for HTTP development
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false
      },
      '/static': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false
      }
    },
    // HTTPS configuration (optional, for production/Teams deployment)
    https: process.env.SSL_CRT_FILE && process.env.SSL_KEY_FILE ? {
      cert: fs.readFileSync(process.env.SSL_CRT_FILE),
      key: fs.readFileSync(process.env.SSL_KEY_FILE),
    } : false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
