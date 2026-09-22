import type { QueryClient } from '@tanstack/react-query';
import { cartKeys } from '@/features/cart/cart-queries';
import { useCartSession } from '@/features/cart/cart-store';
import { cartService } from '@/services/cart-service';

/**
 * Ties the shopper's existing cart to the customer who just signed in, so
 * Shopify's checkout opens already authenticated and the order is filed
 * under their account. A cart that expired meanwhile is simply forgotten.
 * Carts created after sign-in are attached at creation (`useAddToCart`).
 */
export async function attachCartToCustomer(
  customerAccessToken: string,
  queryClient: QueryClient,
): Promise<void> {
  const { cartId, setCartId } = useCartSession.getState();
  if (!cartId) return;

  const cart = await cartService.updateBuyerIdentity(cartId, { customerAccessToken });
  if (cart) {
    queryClient.setQueryData(cartKeys.detail(cart.id), cart);
  } else {
    setCartId(null);
    queryClient.removeQueries({ queryKey: cartKeys.detail(cartId) });
  }
}
