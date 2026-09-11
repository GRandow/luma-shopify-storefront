export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  thumbnail: string;
  images: string[];
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductCategory {
  slug: string;
  name: string;
  url: string;
}

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popularity';

export interface ProductFiltersState {
  query: string;
  category: string;
  maxPrice: number;
  minRating: number;
  sort: ProductSort;
}

export interface ProductSnapshot {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  /** 300×300 preview from the API. */
  thumbnail: string;
  /**
   * 1000×1000 primary photo. Optional because snapshots persisted before this
   * field existed (cart, wishlist, recently viewed) only carry the thumbnail.
   */
  image?: string;
  category: string;
  rating: number;
  stock: number;
  brand?: string;
}

/** The full-resolution primary photo of a product, falling back to its thumbnail. */
export function getProductImage(product: Pick<Product, 'images' | 'thumbnail'>): string {
  return product.images[0] ?? product.thumbnail;
}

export function toProductSnapshot(product: Product): ProductSnapshot {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    discountPercentage: product.discountPercentage,
    thumbnail: product.thumbnail,
    image: getProductImage(product),
    category: product.category,
    rating: product.rating,
    stock: product.stock,
    brand: product.brand,
  };
}
