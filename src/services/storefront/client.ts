/**
 * Minimal GraphQL client for the Shopify Storefront API.
 *
 * It defaults to Shopify's public mock.shop endpoint, which speaks the same
 * schema as a real store without needing a shop or an access token. Point
 * `VITE_SHOPIFY_STOREFRONT_API_URL` at
 * `https://<shop>.myshopify.com/api/<version>/graphql.json` and provide
 * `VITE_SHOPIFY_STOREFRONT_TOKEN` to talk to a real (development) store.
 */

export const MOCK_SHOP_ENDPOINT = 'https://mock.shop/api';

const endpoint = import.meta.env.VITE_SHOPIFY_STOREFRONT_API_URL || MOCK_SHOP_ENDPOINT;
const accessToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || undefined;

export interface GraphQLError {
  message: string;
  extensions?: Record<string, unknown>;
}

interface GraphQLResponse<TData> {
  data?: TData | null;
  errors?: GraphQLError[];
}

export class StorefrontApiError extends Error {
  readonly status: number | undefined;
  readonly errors: readonly GraphQLError[];

  constructor(message: string, status?: number, errors: readonly GraphQLError[] = []) {
    super(message);
    this.name = 'StorefrontApiError';
    this.status = status;
    this.errors = errors;
  }
}

export function isMockShop(): boolean {
  return endpoint === MOCK_SHOP_ENDPOINT;
}

export async function storefrontRequest<TData, TVariables extends object = Record<string, never>>(
  query: string,
  variables?: TVariables,
  signal?: AbortSignal,
): Promise<TData> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) headers['X-Shopify-Storefront-Access-Token'] = accessToken;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (!response.ok) {
    throw new StorefrontApiError(
      `Storefront API request failed with status ${response.status}`,
      response.status,
    );
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors && payload.errors.length > 0) {
    throw new StorefrontApiError(
      payload.errors.map((error) => error.message).join('\n'),
      response.status,
      payload.errors,
    );
  }

  if (!payload.data) {
    throw new StorefrontApiError('Storefront API returned an empty response', response.status);
  }

  return payload.data;
}
