import { useQuery } from '@tanstack/react-query';
import { productService, type ProductListRequest } from '@/services/product-service';

export const productKeys = {
  all: ['products'] as const,
  list: (request: ProductListRequest) => [...productKeys.all, 'list', request] as const,
  detail: (handle: string) => [...productKeys.all, 'detail', handle] as const,
  recommendations: (productId: string) =>
    [...productKeys.all, 'recommendations', productId] as const,
  collections: ['collections'] as const,
};

export function useProducts(request: ProductListRequest = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: productKeys.list(request),
    queryFn: ({ signal }) => productService.list(request, signal),
    enabled: options.enabled ?? true,
  });
}

export function useProduct(handle: string | null) {
  return useQuery({
    queryKey: productKeys.detail(handle ?? ''),
    queryFn: ({ signal }) => productService.getByHandle(handle ?? '', signal),
    enabled: handle !== null && handle.length > 0,
  });
}

export function useCollections() {
  return useQuery({
    queryKey: productKeys.collections,
    queryFn: ({ signal }) => productService.collections(signal),
    staleTime: 1000 * 60 * 60,
  });
}

export function useProductRecommendations(productId: string | null) {
  return useQuery({
    queryKey: productKeys.recommendations(productId ?? ''),
    queryFn: ({ signal }) => productService.recommendations(productId ?? '', signal),
    enabled: productId !== null,
  });
}
