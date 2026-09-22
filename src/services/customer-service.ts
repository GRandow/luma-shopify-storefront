import { toCustomer, toOrderPage } from '@/services/customer-account/adapters';
import { customerAccountRequest } from '@/services/customer-account/client';
import { CUSTOMER_ORDERS_QUERY, CUSTOMER_PROFILE_QUERY } from '@/services/customer-account/queries';
import type {
  CustomerOrdersQueryData,
  CustomerProfileQueryData,
} from '@/services/customer-account/types';
import type { Customer, OrderPage } from '@/types/user';

/** Orders per page in the account area. */
const ORDERS_PAGE_SIZE = 10;

/**
 * The signed-in customer's profile and order history, from Shopify's
 * Customer Account API. Catalog and cart data come from the Storefront API
 * instead (`product-service.ts`, `cart-service.ts`).
 */
export const customerService = {
  async getProfile(signal?: AbortSignal): Promise<Customer> {
    const data = await customerAccountRequest<CustomerProfileQueryData>(
      CUSTOMER_PROFILE_QUERY,
      undefined,
      signal,
    );
    return toCustomer(data.customer);
  },

  async listOrders(after: string | null = null, signal?: AbortSignal): Promise<OrderPage> {
    const data = await customerAccountRequest<
      CustomerOrdersQueryData,
      { first: number; after: string | null }
    >(CUSTOMER_ORDERS_QUERY, { first: ORDERS_PAGE_SIZE, after }, signal);
    return toOrderPage(data);
  },
};
