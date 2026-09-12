import { describe, expect, it } from 'vitest';
import { toCart, toProduct } from '@/services/storefront/adapters';
import { rawCartFixture, rawProductFixture, rawSimpleProductFixture } from '@/test/fixtures';
import { getLineVariantTitle } from '@/types/cart';
import {
  findVariant,
  getDefaultVariant,
  hasOnlyDefaultVariant,
  toProductSnapshot,
} from '@/types/product';

describe('toProduct', () => {
  const product = toProduct(rawProductFixture);

  it('parses money into numbers and keeps the currency', () => {
    expect(product.price).toEqual({ amount: 80, currencyCode: 'CAD' });
    expect(product.priceVaries).toBe(true);
    expect(product.variants[2]?.price).toEqual({ amount: 95, currencyCode: 'CAD' });
  });

  it('exposes the cheapest variant markdown as the compare-at price', () => {
    expect(product.compareAtPrice).toEqual({ amount: 100, currencyCode: 'CAD' });
    expect(toProduct(rawSimpleProductFixture).compareAtPrice).toBeNull();
  });

  it('flattens option values and collections', () => {
    expect(product.options).toEqual([
      { name: 'Color', values: ['Sand', 'Moss'] },
      { name: 'Size', values: ['Small', 'Large'] },
    ]);
    expect(product.collections.map((collection) => collection.handle)).toEqual(['lighting']);
  });

  it('selects the first purchasable variant by default and resolves option combinations', () => {
    expect(getDefaultVariant(product)?.id).toBe('gid://shopify/ProductVariant/4202');
    expect(findVariant(product, { Color: 'Moss', Size: 'Large' })?.sku).toBe('LUMA-LAMP-MOSS-L');
    expect(findVariant(product, { Color: 'Sand', Size: 'Large' })).toBeUndefined();
  });

  it('recognises option-less products', () => {
    expect(hasOnlyDefaultVariant(product)).toBe(false);
    expect(hasOnlyDefaultVariant(toProduct(rawSimpleProductFixture))).toBe(true);
  });

  it('builds a snapshot that cards and persisted lists can use', () => {
    expect(toProductSnapshot(product)).toMatchObject({
      id: 'gid://shopify/Product/42',
      handle: 'considered-desk-lamp',
      defaultVariantId: 'gid://shopify/ProductVariant/4202',
      requiresVariantSelection: true,
      collection: 'lighting',
    });
    expect(toProductSnapshot(toProduct(rawSimpleProductFixture)).requiresVariantSelection).toBe(
      false,
    );
  });
});

describe('toCart', () => {
  const cart = toCart(rawCartFixture);

  it('maps lines, merchandise and totals', () => {
    expect(cart.totalQuantity).toBe(3);
    expect(cart.cost.subtotal.amount).toBe(190);
    expect(cart.cost.total.amount).toBe(171);
    expect(cart.cost.tax).toBeNull();
    expect(cart.lines[0]?.merchandise.product.handle).toBe('considered-desk-lamp');
    expect(cart.lines[0]?.cost.perQuantity.amount).toBe(80);
    expect(cart.discountCodes).toEqual([{ code: 'WELCOME10', applicable: true }]);
  });

  it('hides the placeholder variant title of option-less products', () => {
    expect(getLineVariantTitle(cart.lines[0]!)).toBe('Moss / Small');
    expect(getLineVariantTitle(cart.lines[1]!)).toBeNull();
  });
});
