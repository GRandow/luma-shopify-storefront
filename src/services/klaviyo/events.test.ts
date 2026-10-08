import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addedToCartProperties,
  shopifyNumericId,
  viewedItem,
  viewedProductProperties,
} from '@/services/klaviyo/events';
import { trackAddedToCart, trackViewedProduct } from '@/services/klaviyo/tracking';
import { cartFixture, productFixture } from '@/test/fixtures';

const origin = window.location.origin;

describe('Klaviyo event payloads', () => {
  it('reads the numeric id out of Shopify global ids', () => {
    expect(shopifyNumericId('gid://shopify/Product/42')).toBe('42');
    expect(shopifyNumericId('gid://shopify/ProductVariant/4201?key=x')).toBe('4201');
  });

  it('describes a viewed product with the variant on screen', () => {
    const variant = productFixture.variants[1];
    expect(viewedProductProperties(productFixture, variant)).toEqual({
      ProductName: 'Considered Desk Lamp',
      Name: 'Considered Desk Lamp',
      ProductID: '42',
      SKU: 'LUMA-LAMP-MOSS-S',
      Categories: productFixture.collections.map((collection) => collection.title),
      ImageURL: variant?.image?.url,
      URL: `${origin}/#/products/considered-desk-lamp`,
      Brand: 'Luma Studio',
      Price: 80,
      CompareAtPrice: null,
    });
  });

  it("falls back to the product's price and image without a variant", () => {
    const properties = viewedProductProperties(productFixture, undefined);
    expect(properties).toMatchObject({
      SKU: null,
      Price: productFixture.price.amount,
      ImageURL: productFixture.featuredImage?.url,
    });
  });

  it('builds the recently viewed item from the same data', () => {
    expect(viewedItem(productFixture, productFixture.variants[1])).toMatchObject({
      Title: 'Considered Desk Lamp',
      ItemId: '42',
      Url: `${origin}/#/products/considered-desk-lamp`,
      Metadata: { Brand: 'Luma Studio', Price: 80 },
    });
  });

  it('describes an add to cart with the added line and the whole cart', () => {
    const added = { merchandiseId: 'gid://shopify/ProductVariant/4202', quantity: 2 };
    const properties = addedToCartProperties(cartFixture, added);

    expect(properties).toMatchObject({
      $value: 171,
      AddedItemProductName: 'Considered Desk Lamp',
      AddedItemProductID: '42',
      AddedItemSKU: 'LUMA-LAMP-MOSS-S',
      AddedItemPrice: 80,
      AddedItemQuantity: 2,
      AddedItemURL: `${origin}/#/products/considered-desk-lamp`,
      CheckoutURL: cartFixture.checkoutUrl,
      ItemNames: cartFixture.lines.map((line) => line.merchandise.product.title),
    });
    expect(properties?.Items).toHaveLength(cartFixture.lines.length);
    expect(properties?.Items[0]).toMatchObject({
      ProductName: 'Considered Desk Lamp',
      Quantity: 2,
      ItemPrice: 80,
      RowTotal: 160,
    });
  });

  it('skips a line that is not in the cart', () => {
    expect(
      addedToCartProperties(cartFixture, {
        merchandiseId: 'gid://shopify/ProductVariant/1',
        quantity: 1,
      }),
    ).toBeNull();
  });
});

describe('Klaviyo tracking', () => {
  beforeEach(() => {
    delete window.klaviyo;
    delete window._klOnsite;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is silent without a public key', () => {
    trackViewedProduct(productFixture, productFixture.variants[0]);
    trackAddedToCart(cartFixture, [
      { merchandiseId: 'gid://shopify/ProductVariant/4202', quantity: 1 },
    ]);
    expect(window._klOnsite).toBeUndefined();
  });

  it('reports a product view as Viewed Product plus a recently viewed item', () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    trackViewedProduct(productFixture, productFixture.variants[1]);
    expect(window._klOnsite?.map((command) => (command as unknown[]).slice(0, 2))).toEqual([
      ['track', 'Viewed Product'],
      ['trackViewedItem', expect.objectContaining({ Title: 'Considered Desk Lamp' })],
    ]);
  });

  it('reports one Added to Cart per added line', () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    trackAddedToCart(cartFixture, [
      { merchandiseId: 'gid://shopify/ProductVariant/4202', quantity: 1 },
      { merchandiseId: cartFixture.lines[1]!.merchandise.id, quantity: 1 },
    ]);
    expect(window._klOnsite).toHaveLength(2);
    expect(window._klOnsite?.[1]).toEqual([
      'track',
      'Added to Cart',
      expect.objectContaining({
        AddedItemProductName: cartFixture.lines[1]!.merchandise.product.title,
      }),
    ]);
  });
});
