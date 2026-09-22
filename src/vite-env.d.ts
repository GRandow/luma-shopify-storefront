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
  /** Numeric shop id, the `{shopId}` in Customer Account API endpoints. Enables sign-in. */
  readonly VITE_SHOPIFY_SHOP_ID?: string;
  /** Client id of the public Customer Account API client (Headless channel). */
  readonly VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
