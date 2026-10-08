/**
 * Where the E2E preview server mounts the fake Storefront API. It lives on
 * the same origin as the storefront, so the build only needs a relative URL.
 */
export const FAKE_STOREFRONT_PATH = '/__fake-storefront';

/** Value baked into `VITE_SHOPIFY_STOREFRONT_API_URL` for the E2E build. */
export const FAKE_STOREFRONT_API = `${FAKE_STOREFRONT_PATH}/api`;

/** Product photos are SVG placeholders served by the same middleware. */
export const FAKE_IMAGE_BASE = `${FAKE_STOREFRONT_PATH}/images`;
