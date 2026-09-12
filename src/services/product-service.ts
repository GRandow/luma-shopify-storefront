import { toCollection, toProduct } from '@/services/storefront/adapters';
import { storefrontRequest } from '@/services/storefront/client';
import {
  COLLECTIONS_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_RECOMMENDATIONS_QUERY,
  SEARCH_PRODUCTS_QUERY,
} from '@/services/storefront/queries';
import type {
  CollectionProductsQueryData,
  CollectionsQueryData,
  ProductByHandleQueryData,
  ProductRecommendationsQueryData,
  ProductsQueryData,
  SearchProductsQueryData,
} from '@/services/storefront/types';
import type { Collection, Product } from '@/types/product';

/** Storefront API connections return at most 250 nodes per page. */
const PAGE_SIZE = 250;

export interface ProductListRequest {
  /** Full-text search through the Storefront `search` query. Takes precedence over `collection`. */
  search?: string;
  /** Collection handle. */
  collection?: string;
}

export const productService = {
  async list(request: ProductListRequest = {}, signal?: AbortSignal): Promise<Product[]> {
    if (request.search) {
      const data = await storefrontRequest<
        SearchProductsQueryData,
        { query: string; first: number }
      >(SEARCH_PRODUCTS_QUERY, { query: request.search, first: PAGE_SIZE }, signal);
      return data.search.nodes.map(toProduct);
    }

    if (request.collection) {
      const data = await storefrontRequest<
        CollectionProductsQueryData,
        { handle: string; first: number }
      >(COLLECTION_PRODUCTS_QUERY, { handle: request.collection, first: PAGE_SIZE }, signal);
      return data.collection?.products.nodes.map(toProduct) ?? [];
    }

    const data = await storefrontRequest<ProductsQueryData, { first: number }>(
      PRODUCTS_QUERY,
      { first: PAGE_SIZE },
      signal,
    );
    return data.products.nodes.map(toProduct);
  },

  async getByHandle(handle: string, signal?: AbortSignal): Promise<Product | null> {
    const data = await storefrontRequest<ProductByHandleQueryData, { handle: string }>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle },
      signal,
    );
    return data.product ? toProduct(data.product) : null;
  },

  async collections(signal?: AbortSignal): Promise<Collection[]> {
    const data = await storefrontRequest<CollectionsQueryData, { first: number }>(
      COLLECTIONS_QUERY,
      { first: PAGE_SIZE },
      signal,
    );
    return data.collections.nodes.map(toCollection);
  },

  async recommendations(productId: string, signal?: AbortSignal): Promise<Product[]> {
    const data = await storefrontRequest<ProductRecommendationsQueryData, { productId: string }>(
      PRODUCT_RECOMMENDATIONS_QUERY,
      { productId },
      signal,
    );
    return data.productRecommendations?.map(toProduct) ?? [];
  },
};
