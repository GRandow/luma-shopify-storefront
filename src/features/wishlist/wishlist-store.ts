import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSnapshot } from '@/types/product';

interface WishlistState {
  items: ProductSnapshot[];
  toggle: (product: ProductSnapshot) => void;
  remove: (productId: number) => void;
  has: (productId: number) => boolean;
  clear: () => void;
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
    { name: 'luma-wishlist', version: 1 },
  ),
);
