import type { Product, ProductFiltersState } from '@/types/product';

export const DEFAULT_FILTERS: ProductFiltersState = {
  query: '',
  category: '',
  maxPrice: 50_000,
  minRating: 0,
  sort: 'popularity',
};

export function filterProducts(products: Product[], filters: ProductFiltersState): Product[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return products
    .filter((product) => {
      const searchContent =
        `${product.title} ${product.brand ?? ''} ${product.category}`.toLowerCase();
      return (
        (!query || searchContent.includes(query)) &&
        (!filters.category || product.category === filters.category) &&
        product.price <= filters.maxPrice &&
        product.rating >= filters.minRating
      );
    })
    .sort((left, right) => {
      switch (filters.sort) {
        case 'newest':
          return (
            new Date(right.meta.createdAt).getTime() - new Date(left.meta.createdAt).getTime() ||
            right.id - left.id
          );
        case 'price-asc':
          return left.price - right.price;
        case 'price-desc':
          return right.price - left.price;
        case 'rating':
          return right.rating - left.rating;
        case 'popularity':
          return (
            right.rating * (right.reviews.length + 1) - left.rating * (left.reviews.length + 1) ||
            right.discountPercentage - left.discountPercentage
          );
      }
    });
}

export function getCatalogPriceCeiling(products: Product[]): number {
  if (products.length === 0) return 1000;
  const maximum = Math.max(...products.map((product) => product.price));
  return Math.ceil(maximum / 100) * 100;
}
