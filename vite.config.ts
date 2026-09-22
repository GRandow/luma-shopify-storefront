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
    // Tests run against the mock.shop defaults whatever the developer's .env
    // says: a store-specific .env (hosted checkout, customer accounts) must not
    // change what the components under test render.
    env: {
      VITE_SHOPIFY_STOREFRONT_API_URL: '',
      VITE_SHOPIFY_STOREFRONT_TOKEN: '',
      VITE_HOSTED_CHECKOUT: 'false',
      VITE_STORE_PASSWORD_HINT: '',
      VITE_SHOPIFY_SHOP_ID: '',
      VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID: '',
    },
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
