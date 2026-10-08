import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the production build served by
 * `vite preview --config vite.e2e.config.ts`, which also serves the fake
 * Storefront API (see `e2e/fake-storefront`). Build first with
 * `npm run build:e2e`, or run everything with `npm run test:e2e`.
 */
const BASE_URL = 'http://127.0.0.1:4173/luma-shopify-storefront/';
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    locale: 'en-US',
    timezoneId: 'America/Toronto',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview:e2e',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
