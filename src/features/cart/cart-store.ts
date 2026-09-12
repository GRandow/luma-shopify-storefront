import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * The cart itself lives in Shopify (Storefront Cart API) and is cached by
 * TanStack Query; the browser only remembers which cart belongs to this
 * shopper. See `cart-queries.ts` for reading and mutating the cart.
 */
interface CartSessionState {
  cartId: string | null;
  setCartId: (cartId: string | null) => void;
}

interface PersistedCartSession {
  cartId: string | null;
}

export const useCartSession = create<CartSessionState>()(
  persist(
    (set) => ({
      cartId: null,
      setCartId: (cartId) => set({ cartId }),
    }),
    {
      name: 'luma-cart',
      version: 2,
      partialize: ({ cartId }): PersistedCartSession => ({ cartId }),
      // Version 1 stored a local cart with DummyJSON products; it cannot be carried over.
      migrate: (persisted, version): PersistedCartSession =>
        version < 2 ? { cartId: null } : (persisted as PersistedCartSession),
    },
  ),
);
