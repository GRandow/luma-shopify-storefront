import { useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth-store';
import { SessionExpiredError } from '@/features/auth/session';
import { customerService } from '@/services/customer-service';
import type { Customer } from '@/types/user';

export const customerKeys = {
  all: ['customer'] as const,
  profile: () => [...customerKeys.all, 'profile'] as const,
  orders: () => [...customerKeys.all, 'orders'] as const,
};

/** An expired session is not worth retrying: the store is already cleared. */
function retryUnlessSignedOut(failureCount: number, error: Error): boolean {
  return !(error instanceof SessionExpiredError) && failureCount < 1;
}

/**
 * The signed-in customer's profile. The last known profile is kept in the
 * auth store (and in browser storage) so the account area renders at once
 * while a fresh copy is fetched.
 */
export function useCustomer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setCustomer = useAuthStore((state) => state.setCustomer);

  const query = useQuery<Customer>({
    queryKey: customerKeys.profile(),
    queryFn: ({ signal }) => customerService.getProfile(signal),
    enabled: isAuthenticated,
    placeholderData: () => useAuthStore.getState().customer ?? undefined,
    retry: retryUnlessSignedOut,
  });

  useEffect(() => {
    if (query.data && !query.isPlaceholderData) setCustomer(query.data);
  }, [query.data, query.isPlaceholderData, setCustomer]);

  return query;
}

/** The customer's orders, newest first, ten at a time (`fetchNextPage` loads more). */
export function useCustomerOrders(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useInfiniteQuery({
    queryKey: customerKeys.orders(),
    queryFn: ({ pageParam, signal }) => customerService.listOrders(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.endCursor : undefined),
    enabled: isAuthenticated && enabled,
    staleTime: 1000 * 60,
    retry: retryUnlessSignedOut,
  });
}
