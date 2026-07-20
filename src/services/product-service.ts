import { apiClient } from '@/services/api-client';
import type { Product, ProductCategory, ProductListResponse } from '@/types/product';

export interface ProductRequest {
  limit?: number;
  skip?: number;
  search?: string;
  category?: string;
  sortBy?: 'price' | 'rating' | 'id';
  order?: 'asc' | 'desc';
}

export const productService = {
  async list(request: ProductRequest = {}): Promise<ProductListResponse> {
    const { search, category, ...params } = request;
    const path = search
      ? '/products/search'
      : category
        ? `/products/category/${encodeURIComponent(category)}`
        : '/products';
    const response = await apiClient.get<ProductListResponse>(path, {
      params: { ...params, q: search || undefined },
    });
    return response.data;
  },

  async getById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  async categories(): Promise<ProductCategory[]> {
    const response = await apiClient.get<ProductCategory[]>('/products/categories');
    return response.data;
  },
};
