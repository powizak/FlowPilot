/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'vendor-react';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-router')
          )
            return 'vendor-react';
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-')
          )
            return 'vendor-charts';
          if (id.includes('node_modules/@radix-ui')) return 'vendor-ui';
        },
      },
    },
  },
});
