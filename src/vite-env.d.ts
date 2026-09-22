/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Storefront API GraphQL endpoint. Defaults to https://mock.shop/api. */
  readonly VITE_SHOPIFY_STOREFRONT_API_URL?: string;
  /** Public Storefront API access token (not needed for mock.shop). */
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN?: string;
  /** "true" sends shoppers to Shopify's hosted checkout instead of the demo checkout. */
  readonly VITE_HOSTED_CHECKOUT?: string;
  /** Storefront password shown next to the checkout button (development stores keep theirs). */
  readonly VITE_STORE_PASSWORD_HINT?: string;
  /** Demo authentication backend (DummyJSON). */
  readonly VITE_AUTH_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
