import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  filterProducts,
  getCatalogPriceCeiling,
} from '@/features/products/filter-products';
import { productFixture, simpleProductFixture } from '@/test/fixtures';
import type { Product } from '@/types/product';

const soldOut: Product = {
  ...simpleProductFixture,
  id: 'gid://shopify/Product/44',
  handle: 'sold-out-tray',
  title: 'Ash Tray',
  availableForSale: false,
  createdAt: '2026-03-01T00:00:00Z',
  price: { amount: 120, currencyCode: 'CAD' },
};

const catalog = [productFixture, simpleProductFixture, soldOut];

describe('filterProducts', () => {
  it('keeps the API order for the featured sort', () => {
    expect(filterProducts(catalog, DEFAULT_FILTERS).map((product) => product.handle)).toEqual([
      'considered-desk-lamp',
      'linen-napkin-set',
      'sold-out-tray',
    ]);
  });

  it('matches the query against title, vendor, type, tags and collections', () => {
    const search = (query: string) =>
      filterProducts(catalog, { ...DEFAULT_FILTERS, query }).map((product) => product.handle);

    expect(search('lamp')).toEqual(['considered-desk-lamp']);
    expect(search('TABLE')).toEqual(['linen-napkin-set', 'sold-out-tray']);
    expect(search('luma studio')).toHaveLength(3);
  });

  it('narrows by collection, price ceiling and availability', () => {
    expect(
      filterProducts(catalog, { ...DEFAULT_FILTERS, collection: 'lighting' }).map((p) => p.handle),
    ).toEqual(['considered-desk-lamp']);
    expect(filterProducts(catalog, { ...DEFAULT_FILTERS, maxPrice: 50 })).toHaveLength(1);
    expect(
      filterProducts(catalog, { ...DEFAULT_FILTERS, inStockOnly: true }).map((p) => p.handle),
    ).toEqual(['considered-desk-lamp', 'linen-napkin-set']);
  });

  it('sorts by price, recency and title', () => {
    const handles = (sort: typeof DEFAULT_FILTERS.sort) =>
      filterProducts(catalog, { ...DEFAULT_FILTERS, sort }).map((product) => product.handle);

    expect(handles('price-asc')).toEqual([
      'linen-napkin-set',
      'considered-desk-lamp',
      'sold-out-tray',
    ]);
    expect(handles('price-desc')).toEqual([
      'sold-out-tray',
      'considered-desk-lamp',
      'linen-napkin-set',
    ]);
    expect(handles('newest')[0]).toBe('sold-out-tray');
    expect(handles('title')).toEqual(['sold-out-tray', 'considered-desk-lamp', 'linen-napkin-set']);
  });

  it('rounds the price ceiling up to the next hundred', () => {
    expect(getCatalogPriceCeiling(catalog)).toBe(200);
    expect(getCatalogPriceCeiling([])).toBe(1000);
  });
});
