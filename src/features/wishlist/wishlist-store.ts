import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSnapshot } from '@/types/product';

interface WishlistState {
  items: ProductSnapshot[];
  toggle: (product: ProductSnapshot) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

interface PersistedWishlist {
  items: ProductSnapshot[];
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) =>
        set((state) => ({
          items: state.items.some((item) => item.id === product.id)
            ? state.items.filter((item) => item.id !== product.id)
            : [product, ...state.items],
        })),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      has: (productId) => get().items.some((item) => item.id === productId),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'luma-wishlist',
      version: 2,
      partialize: ({ items }): PersistedWishlist => ({ items }),
      // Version 1 held DummyJSON products, which no longer exist in the catalog.
      migrate: (persisted, version): PersistedWishlist =>
        version < 2 ? { items: [] } : (persisted as PersistedWishlist),
    },
  ),
);
