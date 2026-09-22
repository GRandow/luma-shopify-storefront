import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCartBuyerIdentity } from '@/features/auth/session';
import { useCartSession } from '@/features/cart/cart-store';
import { cartService } from '@/services/cart-service';
import type { Cart, CartLineInput, CartLineUpdateInput } from '@/types/cart';

export const cartKeys = {
  all: ['cart'] as const,
  detail: (cartId: string | null) => [...cartKeys.all, cartId] as const,
};

/**
 * The shopper's cart, or `null` when there is none yet. Carts expire on
 * Shopify's side, so a stored id that no longer resolves is forgotten.
 */
export function useCart() {
  const cartId = useCartSession((state) => state.cartId);
  const setCartId = useCartSession((state) => state.setCartId);

  return useQuery({
    queryKey: cartKeys.detail(cartId),
    queryFn: async ({ signal }) => {
      if (!cartId) return null;
      const cart = await cartService.get(cartId, signal);
      if (!cart) setCartId(null);
      return cart;
    },
    enabled: cartId !== null,
    staleTime: 1000 * 60,
  });
}

export function useCartCount(): number {
  const { data } = useCart();
  return data?.totalQuantity ?? 0;
}

function useCartMutation<TVariables>(
  mutate: (cartId: string | null, variables: TVariables) => Promise<Cart>,
) {
  const queryClient = useQueryClient();
  const cartId = useCartSession((state) => state.cartId);
  const setCartId = useCartSession((state) => state.setCartId);

  return useMutation({
    mutationFn: (variables: TVariables) => mutate(cartId, variables),
    onSuccess: (cart) => {
      // Seed the cache before switching ids so the new cart never refetches.
      queryClient.setQueryData(cartKeys.detail(cart.id), cart);
      if (cart.id !== cartId) {
        queryClient.removeQueries({ queryKey: cartKeys.detail(cartId) });
        setCartId(cart.id);
      }
    },
  });
}

/**
 * Adds lines to the current cart, creating one when needed (or when the old
 * one expired). A cart created for a signed-in customer is tied to them.
 */
export function useAddToCart() {
  return useCartMutation<CartLineInput[]>(async (cartId, lines) => {
    if (cartId) {
      const cart = await cartService.addLines(cartId, lines);
      if (cart) return cart;
    }
    return cartService.create(lines, await getCartBuyerIdentity());
  });
}

async function requireCart<TResult>(
  cartId: string | null,
  operation: (cartId: string) => Promise<TResult | null>,
): Promise<TResult> {
  if (!cartId) throw new Error('There is no active cart.');
  const result = await operation(cartId);
  if (!result) throw new Error('Your cart has expired. Please add the items again.');
  return result;
}

export function useUpdateCartLines() {
  return useCartMutation<CartLineUpdateInput[]>((cartId, lines) =>
    requireCart(cartId, (id) => cartService.updateLines(id, lines)),
  );
}

export function useRemoveCartLines() {
  return useCartMutation<string[]>((cartId, lineIds) =>
    requireCart(cartId, (id) => cartService.removeLines(id, lineIds)),
  );
}

export function useUpdateDiscountCodes() {
  return useCartMutation<string[]>((cartId, codes) =>
    requireCart(cartId, (id) => cartService.updateDiscountCodes(id, codes)),
  );
}

/** Forgets the current cart, e.g. after an order is placed. Stable across renders. */
export function useClearCart() {
  const queryClient = useQueryClient();
  const setCartId = useCartSession((state) => state.setCartId);

  return useCallback(() => {
    setCartId(null);
    queryClient.removeQueries({ queryKey: cartKeys.all });
  }, [queryClient, setCartId]);
}
