import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Applies a plugin only when Vite runs in the given mode (`vite --mode <mode>`). */
const onlyInMode = (mode: string, plugin: Plugin): Plugin => ({
  ...plugin,
  apply: (_config, env) => env.mode === mode,
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // `npm run dev:https`: the dev server on https://localhost with a self-signed
    // certificate. klaviyo.js calls Klaviyo's API with the page's own protocol,
    // and over http the browser blocks those calls (README → Email marketing).
    onlyInMode('https', basicSsl()),
  ],

  base: '/luma-shopify-storefront/',

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: { port: 5173 },
  preview: { port: 4173 },

  test: {
    // Unit and component tests only; the Playwright specs in e2e/ run with `npm run test:e2e`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
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
      VITE_KLAVIYO_PUBLIC_KEY: '',
      VITE_KLAVIYO_LIST_ID: '',
      VITE_KLAVIYO_API_BASE: '',
      VITE_KLAVIYO_SCRIPT_BASE: '',
    },
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
