import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSnapshot } from '@/types/product';

interface DiscoveryState {
  recentlyViewed: ProductSnapshot[];
  recentSearches: string[];
  recentCategories: string[];
  compareItems: ProductSnapshot[];
  recentlyPurchased: ProductSnapshot[];
  quickViewProductId: number | null;
  recordView: (product: ProductSnapshot) => void;
  recordSearch: (query: string) => void;
  recordCategory: (category: string) => void;
  toggleCompare: (product: ProductSnapshot) => boolean;
  clearCompare: () => void;
  recordPurchase: (products: ProductSnapshot[]) => void;
  openQuickView: (productId: number) => void;
  closeQuickView: () => void;
}

function prependUnique<T>(items: T[], value: T, key: (item: T) => string | number, limit: number) {
  return [value, ...items.filter((item) => key(item) !== key(value))].slice(0, limit);
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      recentlyViewed: [],
      recentSearches: [],
      recentCategories: [],
      compareItems: [],
      recentlyPurchased: [],
      quickViewProductId: null,
      recordView: (product) =>
        set((state) => ({
          recentlyViewed: prependUnique(state.recentlyViewed, product, (item) => item.id, 8),
        })),
      recordSearch: (query) => {
        const normalized = query.trim();
        if (!normalized) return;
        set((state) => ({
          recentSearches: prependUnique(state.recentSearches, normalized, (item) => item, 6),
        }));
      },
      recordCategory: (category) =>
        set((state) => ({
          recentCategories: prependUnique(state.recentCategories, category, (item) => item, 6),
        })),
      toggleCompare: (product) => {
        const exists = get().compareItems.some((item) => item.id === product.id);
        if (!exists && get().compareItems.length >= 3) return false;
        set((state) => ({
          compareItems: exists
            ? state.compareItems.filter((item) => item.id !== product.id)
            : [...state.compareItems, product],
        }));
        return true;
      },
      clearCompare: () => set({ compareItems: [] }),
      recordPurchase: (products) =>
        set((state) => ({
          recentlyPurchased: products
            .reduce(
              (items, product) => prependUnique(items, product, (item) => item.id, 8),
              state.recentlyPurchased,
            )
            .slice(0, 8),
        })),
      openQuickView: (quickViewProductId) => set({ quickViewProductId }),
      closeQuickView: () => set({ quickViewProductId: null }),
    }),
    {
      name: 'luma-discovery',
      version: 1,
      partialize: ({
        recentlyViewed,
        recentSearches,
        recentCategories,
        compareItems,
        recentlyPurchased,
      }) => ({
        recentlyViewed,
        recentSearches,
        recentCategories,
        compareItems,
        recentlyPurchased,
      }),
    },
  ),
);
