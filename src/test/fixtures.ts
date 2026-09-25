import { toCart, toProduct } from '@/services/storefront/adapters';
import type { CartNode, ProductNode } from '@/services/storefront/types';

const money = (amount: string) => ({ amount, currencyCode: 'CAD' });

const image = (name: string) => ({
  url: `https://cdn.shopify.com/s/files/1/0000/0001/files/${name}.jpg`,
  altText: null,
  width: 2048,
  height: 2048,
});

/** A product with two options, as returned by the Storefront API. */
export const rawProductFixture: ProductNode = {
  id: 'gid://shopify/Product/42',
  handle: 'considered-desk-lamp',
  title: 'Considered Desk Lamp',
  description: 'A warm and adjustable task light.',
  descriptionHtml: '<p>A warm and adjustable task light.</p>',
  vendor: 'Luma Studio',
  productType: 'Lighting',
  tags: ['lighting', 'home'],
  createdAt: '2026-01-01T00:00:00Z',
  availableForSale: true,
  featuredImage: image('lamp-sand'),
  images: { nodes: [image('lamp-sand'), image('lamp-moss')] },
  priceRange: { minVariantPrice: money('80.0'), maxVariantPrice: money('95.0') },
  compareAtPriceRange: { minVariantPrice: money('0.0'), maxVariantPrice: money('120.0') },
  options: [
    { name: 'Color', optionValues: [{ name: 'Sand' }, { name: 'Moss' }] },
    { name: 'Size', optionValues: [{ name: 'Small' }, { name: 'Large' }] },
  ],
  variants: {
    nodes: [
      {
        id: 'gid://shopify/ProductVariant/4201',
        title: 'Sand / Small',
        sku: 'LUMA-LAMP-SAND-S',
        availableForSale: false,
        quantityAvailable: 0,
        price: money('80.0'),
        compareAtPrice: money('100.0'),
        selectedOptions: [
          { name: 'Color', value: 'Sand' },
          { name: 'Size', value: 'Small' },
        ],
        image: image('lamp-sand'),
      },
      {
        id: 'gid://shopify/ProductVariant/4202',
        title: 'Moss / Small',
        sku: 'LUMA-LAMP-MOSS-S',
        availableForSale: true,
        quantityAvailable: 8,
        price: money('80.0'),
        compareAtPrice: null,
        selectedOptions: [
          { name: 'Color', value: 'Moss' },
          { name: 'Size', value: 'Small' },
        ],
        image: image('lamp-moss'),
      },
      {
        id: 'gid://shopify/ProductVariant/4203',
        title: 'Moss / Large',
        sku: 'LUMA-LAMP-MOSS-L',
        availableForSale: true,
        quantityAvailable: null,
        price: money('95.0'),
        compareAtPrice: money('120.0'),
        selectedOptions: [
          { name: 'Color', value: 'Moss' },
          { name: 'Size', value: 'Large' },
        ],
        image: image('lamp-moss'),
      },
    ],
  },
  collections: {
    nodes: [{ id: 'gid://shopify/Collection/7', handle: 'lighting', title: 'Lighting' }],
  },
};

/** An option-less product: Shopify represents it with a single "Default Title" variant. */
export const rawSimpleProductFixture: ProductNode = {
  ...rawProductFixture,
  id: 'gid://shopify/Product/43',
  handle: 'linen-napkin-set',
  title: 'Linen Napkin Set',
  description: 'Four stonewashed napkins.',
  descriptionHtml: '<p>Four stonewashed napkins.</p>',
  vendor: 'Luma Studio',
  productType: 'Table',
  tags: ['table'],
  featuredImage: image('napkins'),
  images: { nodes: [image('napkins')] },
  priceRange: { minVariantPrice: money('30.0'), maxVariantPrice: money('30.0') },
  compareAtPriceRange: { minVariantPrice: money('0.0'), maxVariantPrice: money('0.0') },
  options: [{ name: 'Title', optionValues: [{ name: 'Default Title' }] }],
  variants: {
    nodes: [
      {
        id: 'gid://shopify/ProductVariant/4301',
        title: 'Default Title',
        sku: 'LUMA-NAPKIN',
        availableForSale: true,
        quantityAvailable: 25,
        price: money('30.0'),
        compareAtPrice: null,
        selectedOptions: [{ name: 'Title', value: 'Default Title' }],
        image: image('napkins'),
      },
    ],
  },
  collections: { nodes: [{ id: 'gid://shopify/Collection/8', handle: 'table', title: 'Table' }] },
};

export const productFixture = toProduct(rawProductFixture);
export const simpleProductFixture = toProduct(rawSimpleProductFixture);

export const rawCartFixture: CartNode = {
  id: 'gid://shopify/Cart/c1-test?key=abc',
  checkoutUrl: 'https://example.myshopify.com/cart/c/c1-test',
  totalQuantity: 3,
  attributes: [],
  discountCodes: [{ code: 'WELCOME10', applicable: true }],
  cost: {
    subtotalAmount: money('190.0'),
    totalAmount: money('171.0'),
    totalTaxAmount: null,
  },
  lines: {
    nodes: [
      {
        id: 'gid://shopify/CartLine/1',
        quantity: 2,
        cost: {
          totalAmount: money('160.0'),
          amountPerQuantity: money('80.0'),
          compareAtAmountPerQuantity: null,
        },
        merchandise: {
          ...rawProductFixture.variants.nodes[1]!,
          product: {
            id: rawProductFixture.id,
            handle: rawProductFixture.handle,
            title: rawProductFixture.title,
            vendor: rawProductFixture.vendor,
          },
        },
      },
      {
        id: 'gid://shopify/CartLine/2',
        quantity: 1,
        cost: {
          totalAmount: money('30.0'),
          amountPerQuantity: money('30.0'),
          compareAtAmountPerQuantity: null,
        },
        merchandise: {
          ...rawSimpleProductFixture.variants.nodes[0]!,
          product: {
            id: rawSimpleProductFixture.id,
            handle: rawSimpleProductFixture.handle,
            title: rawSimpleProductFixture.title,
            vendor: rawSimpleProductFixture.vendor,
          },
        },
      },
    ],
  },
};

export const cartFixture = toCart(rawCartFixture);
