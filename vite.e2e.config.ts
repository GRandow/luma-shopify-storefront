import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';
import {
  FAKE_KLAVIYO_LIST_ID,
  FAKE_KLAVIYO_PATH,
  FAKE_KLAVIYO_PUBLIC_KEY,
} from './e2e/fake-klaviyo/constants';
import { fakeKlaviyo } from './e2e/fake-klaviyo/vite-plugin';
import { FAKE_STOREFRONT_API } from './e2e/fake-storefront/constants';
import { fakeStorefront } from './e2e/fake-storefront/vite-plugin';

/**
 * Build and preview used by the Playwright suite and Lighthouse CI: the
 * production build, talking to the fake Storefront API and the Klaviyo
 * stand-in that the preview server mounts. Every store setting is pinned
 * here, so whatever a developer's `.env` says (a real store, hosted checkout,
 * customer accounts, a Klaviyo account) the tests always run against the same
 * storefront, without network access.
 */
const pinnedEnv = {
  VITE_SHOPIFY_STOREFRONT_API_URL: FAKE_STOREFRONT_API,
  VITE_SHOPIFY_STOREFRONT_TOKEN: '',
  VITE_HOSTED_CHECKOUT: 'false',
  VITE_STORE_PASSWORD_HINT: '',
  VITE_SHOPIFY_SHOP_ID: '',
  VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID: '',
  VITE_KLAVIYO_PUBLIC_KEY: FAKE_KLAVIYO_PUBLIC_KEY,
  VITE_KLAVIYO_LIST_ID: FAKE_KLAVIYO_LIST_ID,
  VITE_KLAVIYO_API_BASE: FAKE_KLAVIYO_PATH,
  VITE_KLAVIYO_SCRIPT_BASE: FAKE_KLAVIYO_PATH,
};

export const E2E_PORT = 4173;

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [fakeStorefront(), fakeKlaviyo()],
    define: Object.fromEntries(
      Object.entries(pinnedEnv).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ]),
    ),
    build: { outDir: 'dist-e2e', emptyOutDir: true },
    preview: { host: '127.0.0.1', port: E2E_PORT, strictPort: true },
    server: { host: '127.0.0.1', port: E2E_PORT, strictPort: true },
  }),
);
