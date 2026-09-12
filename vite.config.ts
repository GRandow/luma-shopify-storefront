import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  base: '/luma-shopify-storefront/',

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: { port: 5173 },
  preview: { port: 4173 },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
