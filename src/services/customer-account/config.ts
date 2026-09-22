/**
 * Customer Account API configuration.
 *
 * Shopify's customer accounts are an OAuth 2.0 / OpenID Connect provider. A
 * headless storefront registers a *public* client (no secret, PKCE required)
 * in the Headless channel and gets a client id; every endpoint is derived
 * from the shop id, exactly as published at
 * `https://shopify.com/authentication/{shopId}/.well-known/openid-configuration`.
 *
 * Without a shop id and a client id the account area is disabled, which is
 * the case when the app runs against mock.shop.
 */

export const CUSTOMER_ACCOUNT_API_VERSION = '2026-07';

/** Scopes a storefront needs: OpenID identity plus full Customer Account API access. */
export const CUSTOMER_ACCOUNT_SCOPES = 'openid email customer-account-api:full';

export interface CustomerAccountConfig {
  shopId: string;
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  logoutEndpoint: string;
  graphqlEndpoint: string;
  /** Where Shopify sends the browser back after sign-in and sign-out. */
  redirectUri: string;
}

const shopId = import.meta.env.VITE_SHOPIFY_SHOP_ID?.trim() ?? '';
const clientId = import.meta.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() ?? '';

/**
 * The app's own URL, e.g. `https://grandow.github.io/luma-shopify-storefront/`.
 * It must be registered as callback and logout URI on the Headless channel.
 */
export function getRedirectUri(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

export function isCustomerAccountsEnabled(): boolean {
  return shopId.length > 0 && clientId.length > 0;
}

export function getCustomerAccountConfig(): CustomerAccountConfig {
  if (!isCustomerAccountsEnabled()) {
    throw new Error(
      'Customer accounts are not configured. Set VITE_SHOPIFY_SHOP_ID and VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID.',
    );
  }
  const issuer = `https://shopify.com/authentication/${shopId}`;
  return {
    shopId,
    clientId,
    authorizationEndpoint: `${issuer}/oauth/authorize`,
    tokenEndpoint: `${issuer}/oauth/token`,
    logoutEndpoint: `${issuer}/logout`,
    graphqlEndpoint: `https://shopify.com/${shopId}/account/customer/api/${CUSTOMER_ACCOUNT_API_VERSION}/graphql`,
    redirectUri: getRedirectUri(),
  };
}
