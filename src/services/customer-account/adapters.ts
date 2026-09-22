import { toImage, toMoney } from '@/services/storefront/adapters';
import type {
  CustomerAddressNode,
  CustomerNode,
  CustomerOrdersQueryData,
  OrderLineItemNode,
  OrderNode,
} from '@/services/customer-account/types';
import type { Address, Customer, Order, OrderItem, OrderPage } from '@/types/user';

/** `PARTIALLY_FULFILLED` → `Partially fulfilled`. */
export function humanizeStatus(status: string | null | undefined, fallback = 'Pending'): string {
  if (!status) return fallback;
  const words = status.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function toAddress(node: CustomerAddressNode, isDefault = false): Address {
  return {
    id: node.id,
    label: node.company?.trim() || (isDefault ? 'Default address' : 'Address'),
    firstName: node.firstName ?? '',
    lastName: node.lastName ?? '',
    address: [node.address1, node.address2].filter((part) => part?.trim()).join(', '),
    city: node.city ?? '',
    state: node.province ?? '',
    postalCode: node.zip ?? '',
    country: node.country ?? '',
    phone: node.phoneNumber ?? '',
    isDefault,
  };
}

export function toCustomer(node: CustomerNode): Customer {
  const defaultId = node.defaultAddress?.id ?? null;
  const addresses = node.addresses.nodes.map((address) =>
    toAddress(address, address.id === defaultId),
  );
  // The default address is not always part of the first page of addresses.
  if (node.defaultAddress && !addresses.some((address) => address.id === defaultId)) {
    addresses.unshift(toAddress(node.defaultAddress, true));
  }
  return {
    id: node.id,
    firstName: node.firstName ?? '',
    lastName: node.lastName ?? '',
    displayName: node.displayName,
    email: node.emailAddress?.emailAddress ?? null,
    phone: node.phoneNumber?.phoneNumber ?? null,
    defaultAddress: node.defaultAddress ? toAddress(node.defaultAddress, true) : null,
    addresses,
  };
}

export function toOrderItem(node: OrderLineItemNode): OrderItem {
  return {
    id: node.id,
    variantId: node.variantId,
    title: node.title,
    variantTitle: node.variantTitle,
    image: toImage(node.image),
    price: node.price ? toMoney(node.price) : null,
    quantity: node.quantity,
  };
}

export function toOrder(node: OrderNode): Order {
  return {
    id: node.id,
    name: node.name,
    processedAt: node.processedAt,
    paymentStatus: humanizeStatus(node.financialStatus),
    fulfillmentStatus: humanizeStatus(node.fulfillmentStatus, 'Unfulfilled'),
    items: node.lineItems.nodes.map(toOrderItem),
    total: toMoney(node.totalPrice),
    shippingAddress: node.shippingAddress ? toAddress(node.shippingAddress) : null,
    statusPageUrl: node.statusPageUrl,
  };
}

export function toOrderPage(data: CustomerOrdersQueryData): OrderPage {
  const { nodes, pageInfo } = data.customer.orders;
  return {
    orders: nodes.map(toOrder),
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor,
  };
}
