import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/estoque': 'http://localhost:8000', 
    },
  },
  build: {
    outDir: 'dist',
  },
  preview: {
    port: 4173,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
