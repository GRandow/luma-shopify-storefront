import axios from 'axios';

/**
 * REST client for the demo authentication backend (DummyJSON). Catalog and
 * cart data come from the Shopify Storefront API instead — see
 * `services/storefront`. Customer accounts are the next piece to move over,
 * to Shopify's Customer Account API.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'https://dummyjson.com',
  timeout: 12_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error instanceof Error ? error : new Error('Request failed')),
);
