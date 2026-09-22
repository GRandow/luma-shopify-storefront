import { describe, expect, it } from 'vitest';
import {
  humanizeStatus,
  toCustomer,
  toOrder,
  toOrderPage,
} from '@/services/customer-account/adapters';
import type {
  CustomerAddressNode,
  CustomerNode,
  OrderNode,
} from '@/services/customer-account/types';

const homeAddress: CustomerAddressNode = {
  id: 'gid://shopify/CustomerAddress/1',
  firstName: 'Gabriel',
  lastName: 'Randow',
  company: null,
  address1: 'Rua das Flores 100',
  address2: 'Apto 12',
  city: 'Curitiba',
  province: 'Paraná',
  zip: '80000-000',
  country: 'Brazil',
  phoneNumber: '+55 41 99999-0000',
};

const officeAddress: CustomerAddressNode = {
  ...homeAddress,
  id: 'gid://shopify/CustomerAddress/2',
  company: 'Luma Studio',
  address2: null,
};

const customerNode: CustomerNode = {
  id: 'gid://shopify/Customer/7001',
  firstName: 'Gabriel',
  lastName: 'Randow',
  displayName: 'Gabriel Randow',
  emailAddress: { emailAddress: 'gabriel@example.com' },
  phoneNumber: null,
  defaultAddress: homeAddress,
  addresses: { nodes: [officeAddress, homeAddress] },
};

const orderNode: OrderNode = {
  id: 'gid://shopify/Order/9001',
  name: '#1001',
  processedAt: '2026-09-10T14:00:00Z',
  financialStatus: 'PAID',
  fulfillmentStatus: 'PARTIALLY_FULFILLED',
  statusPageUrl: 'https://luma.example/orders/abc/authenticate',
  totalPrice: { amount: '128.5', currencyCode: 'CAD' },
  shippingAddress: homeAddress,
  lineItems: {
    nodes: [
      {
        id: 'gid://shopify/LineItem/1',
        title: 'Considered Desk Lamp',
        variantTitle: 'Moss / Small',
        variantId: 'gid://shopify/ProductVariant/4202',
        quantity: 2,
        image: {
          url: 'https://cdn.shopify.com/lamp.jpg',
          altText: null,
          width: 2048,
          height: 2048,
        },
        price: { amount: '64.25', currencyCode: 'CAD' },
      },
    ],
  },
};

describe('customer account adapters', () => {
  it('humanizes Shopify status enums', () => {
    expect(humanizeStatus('PAID')).toBe('Paid');
    expect(humanizeStatus('PARTIALLY_REFUNDED')).toBe('Partially refunded');
    expect(humanizeStatus(null)).toBe('Pending');
    expect(humanizeStatus(undefined, 'Unfulfilled')).toBe('Unfulfilled');
  });

  it('maps the customer, flags the default address and labels addresses', () => {
    const customer = toCustomer(customerNode);

    expect(customer).toMatchObject({
      id: 'gid://shopify/Customer/7001',
      displayName: 'Gabriel Randow',
      email: 'gabriel@example.com',
      phone: null,
    });
    expect(customer.addresses.map((address) => [address.label, address.isDefault])).toEqual([
      ['Luma Studio', false],
      ['Default address', true],
    ]);
    expect(customer.defaultAddress).toMatchObject({
      address: 'Rua das Flores 100, Apto 12',
      city: 'Curitiba',
      state: 'Paraná',
      postalCode: '80000-000',
      country: 'Brazil',
      phone: '+55 41 99999-0000',
    });
  });

  it('adds the default address when the first page of addresses does not include it', () => {
    const customer = toCustomer({ ...customerNode, addresses: { nodes: [officeAddress] } });

    expect(customer.addresses.map((address) => address.id)).toEqual([
      homeAddress.id,
      officeAddress.id,
    ]);
  });

  it('maps an order with readable statuses and numeric money', () => {
    const order = toOrder(orderNode);

    expect(order).toMatchObject({
      name: '#1001',
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Partially fulfilled',
      total: { amount: 128.5, currencyCode: 'CAD' },
      statusPageUrl: 'https://luma.example/orders/abc/authenticate',
    });
    expect(order.items[0]).toMatchObject({
      title: 'Considered Desk Lamp',
      variantTitle: 'Moss / Small',
      quantity: 2,
      price: { amount: 64.25, currencyCode: 'CAD' },
    });
    expect(order.shippingAddress?.firstName).toBe('Gabriel');
  });

  it('maps a page of orders with its cursor', () => {
    const page = toOrderPage({
      customer: {
        orders: { pageInfo: { hasNextPage: true, endCursor: 'cursor-10' }, nodes: [orderNode] },
      },
    });

    expect(page.orders).toHaveLength(1);
    expect(page.hasNextPage).toBe(true);
    expect(page.endCursor).toBe('cursor-10');
  });
});
