/**
 * Domain model for the storefront. These shapes are what the UI consumes; they
 * are produced from Storefront API responses by `services/storefront/adapters`.
 */

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface StorefrontImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  /** `null` when the merchant does not track inventory for the variant. */
  quantityAvailable: number | null;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
  image: StorefrontImage | null;
}

export interface CollectionSummary {
  id: string;
  handle: string;
  title: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  createdAt: string;
  availableForSale: boolean;
  featuredImage: StorefrontImage | null;
  images: StorefrontImage[];
  /** Lowest variant price ("from" price on listings). */
  price: Money;
  /** Compare-at price of the cheapest variant when it is higher than `price`. */
  compareAtPrice: Money | null;
  /** True when variants are priced differently, so listings should say "From …". */
  priceVaries: boolean;
  options: ProductOption[];
  variants: ProductVariant[];
  collections: CollectionSummary[];
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: StorefrontImage | null;
}

export type ProductSort = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'title';

export interface ProductFiltersState {
  query: string;
  collection: string;
  maxPrice: number;
  inStockOnly: boolean;
  sort: ProductSort;
}

/**
 * Lightweight, serializable view of a product used by cards and by the lists
 * we persist in the browser (wishlist, recently viewed, comparison).
 */
export interface ProductSnapshot {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  price: Money;
  compareAtPrice: Money | null;
  priceVaries: boolean;
  image: StorefrontImage | null;
  availableForSale: boolean;
  /** Variant used for one-click "add to bag" from a card. */
  defaultVariantId: string | null;
  /** True when the shopper should pick options (size, color…) before buying. */
  requiresVariantSelection: boolean;
  /** Handle of the first collection the product belongs to. */
  collection: string | null;
}

const DEFAULT_OPTION_VALUE = 'Default Title';

/** Products without options come back from Shopify with a single "Default Title" variant. */
export function hasOnlyDefaultVariant(product: Pick<Product, 'options' | 'variants'>): boolean {
  return (
    product.variants.length <= 1 &&
    product.options.every(
      (option) => option.values.length === 1 && option.values[0] === DEFAULT_OPTION_VALUE,
    )
  );
}

/** The variant preselected on product pages: the first one still available for sale. */
export function getDefaultVariant(product: Pick<Product, 'variants'>): ProductVariant | undefined {
  return product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
}

export function toOptionMap(options: SelectedOption[] = []): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.name, option.value]));
}

/** Finds the variant whose options match every entry of `selectedOptions`. */
export function findVariant(
  product: Pick<Product, 'variants'>,
  selectedOptions: Record<string, string>,
): ProductVariant | undefined {
  return product.variants.find((variant) =>
    variant.selectedOptions.every((option) => selectedOptions[option.name] === option.value),
  );
}

export function getDiscountPercentage(price: Money, compareAtPrice: Money | null): number {
  if (!compareAtPrice || compareAtPrice.amount <= price.amount || compareAtPrice.amount === 0) {
    return 0;
  }
  return Math.round((1 - price.amount / compareAtPrice.amount) * 100);
}

export function getProductImage(
  product: Pick<Product, 'featuredImage' | 'images'>,
): StorefrontImage | null {
  return product.featuredImage ?? product.images[0] ?? null;
}

export function toProductSnapshot(product: Product): ProductSnapshot {
  const defaultVariant = getDefaultVariant(product);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    priceVaries: product.priceVaries,
    image: getProductImage(product),
    availableForSale: product.availableForSale,
    defaultVariantId: defaultVariant?.id ?? null,
    requiresVariantSelection: !hasOnlyDefaultVariant(product),
    collection: product.collections[0]?.handle ?? null,
  };
}
