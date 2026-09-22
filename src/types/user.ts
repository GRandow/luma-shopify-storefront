import type { Money, StorefrontImage } from '@/types/product';

/** A postal address as the UI shows it; mapped from Customer Account API addresses. */
export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

/** The signed-in Shopify customer (Customer Account API). */
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  defaultAddress: Address | null;
  addresses: Address[];
}

/** A purchased line, frozen at order time. */
export interface OrderItem {
  id: string;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  image: StorefrontImage | null;
  price: Money | null;
  quantity: number;
}

export interface Order {
  id: string;
  /** Human-readable order number, e.g. `#1001`. */
  name: string;
  processedAt: string;
  /** e.g. `Paid`, `Refunded`. */
  paymentStatus: string;
  /** e.g. `Unfulfilled`, `Fulfilled`. */
  fulfillmentStatus: string;
  items: OrderItem[];
  total: Money;
  shippingAddress: Address | null;
  /** Shopify's order status page; `null` for the in-app demo checkout. */
  statusPageUrl: string | null;
}

export interface OrderPage {
  orders: Order[];
  hasNextPage: boolean;
  endCursor: string | null;
}
