import type { Product, ProductFiltersState } from '@/types/product';

export const DEFAULT_FILTERS: ProductFiltersState = {
  query: '',
  collection: '',
  maxPrice: 50_000,
  inStockOnly: false,
  sort: 'featured',
};

function matchesQuery(product: Product, query: string): boolean {
  if (!query) return true;
  const haystack = [
    product.title,
    product.vendor,
    product.productType,
    ...product.tags,
    ...product.collections.map((collection) => collection.title),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function compareProducts(left: Product, right: Product, sort: ProductFiltersState['sort']) {
  switch (sort) {
    case 'featured':
      return 0;
    case 'newest':
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
        left.title.localeCompare(right.title)
      );
    case 'price-asc':
      return left.price.amount - right.price.amount || left.title.localeCompare(right.title);
    case 'price-desc':
      return right.price.amount - left.price.amount || left.title.localeCompare(right.title);
    case 'title':
      return left.title.localeCompare(right.title);
  }
}

/**
 * Narrows and orders an already loaded catalog. The Storefront API delivers
 * products in "best selling" order, which is what `featured` preserves.
 */
export function filterProducts(products: Product[], filters: ProductFiltersState): Product[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return products
    .filter(
      (product) =>
        matchesQuery(product, query) &&
        (!filters.collection ||
          product.collections.some((collection) => collection.handle === filters.collection)) &&
        product.price.amount <= filters.maxPrice &&
        (!filters.inStockOnly || product.availableForSale),
    )
    .sort((left, right) => compareProducts(left, right, filters.sort));
}

export function getCatalogPriceCeiling(products: Product[]): number {
  if (products.length === 0) return 1000;
  const maximum = Math.max(...products.map((product) => product.price.amount));
  return Math.ceil(maximum / 100) * 100;
}
