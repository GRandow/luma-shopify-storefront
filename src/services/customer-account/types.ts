/**
 * Raw response shapes for the Customer Account API documents in `./queries.ts`.
 * Mirrors the schema for exactly the fields requested; `./adapters.ts` maps
 * them to the app's domain model in `@/types/user`.
 */

import type { ImageNode, MoneyV2Node } from '@/services/storefront/types';

export interface CustomerAddressNode {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phoneNumber: string | null;
}

export interface CustomerNode {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: { emailAddress: string | null } | null;
  phoneNumber: { phoneNumber: string | null } | null;
  defaultAddress: CustomerAddressNode | null;
  addresses: { nodes: CustomerAddressNode[] };
}

export interface OrderLineItemNode {
  id: string;
  title: string;
  variantTitle: string | null;
  variantId: string | null;
  quantity: number;
  image: ImageNode | null;
  price: MoneyV2Node | null;
}

export interface OrderNode {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  statusPageUrl: string;
  totalPrice: MoneyV2Node;
  shippingAddress: CustomerAddressNode | null;
  lineItems: { nodes: OrderLineItemNode[] };
}

export interface PageInfoNode {
  hasNextPage: boolean;
  endCursor: string | null;
}

/* Operation results */

export interface CustomerProfileQueryData {
  customer: CustomerNode;
}

export interface CustomerOrdersQueryData {
  customer: {
    orders: { pageInfo: PageInfoNode; nodes: OrderNode[] };
  };
}
