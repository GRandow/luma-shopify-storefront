import { useQuery } from '@tanstack/react-query';
import { productService, type ProductRequest } from '@/services/product-service';

export const productKeys = {
  all: ['products'] as const,
  list: (request: ProductRequest) => [...productKeys.all, 'list', request] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
  categories: ['product-categories'] as const,
};

export function useProducts(request: ProductRequest = {}) {
  return useQuery({
    queryKey: productKeys.list(request),
    queryFn: () => productService.list(request),
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: productKeys.detail(id ?? 0),
    queryFn: () => productService.getById(id ?? 0),
    enabled: id !== null && id > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: () => productService.categories(),
    staleTime: 1000 * 60 * 60,
  });
}
