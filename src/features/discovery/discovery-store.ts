import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSnapshot } from '@/types/product';

interface DiscoveryState {
  recentlyViewed: ProductSnapshot[];
  recentSearches: string[];
  /** Collection handles, most recent first. */
  recentCollections: string[];
  compareItems: ProductSnapshot[];
  recentlyPurchased: ProductSnapshot[];
  /** Handle of the product open in the quick-view dialog. */
  quickViewHandle: string | null;
  recordView: (product: ProductSnapshot) => void;
  recordSearch: (query: string) => void;
  recordCollection: (handle: string) => void;
  toggleCompare: (product: ProductSnapshot) => boolean;
  clearCompare: () => void;
  recordPurchase: (products: ProductSnapshot[]) => void;
  openQuickView: (handle: string) => void;
  closeQuickView: () => void;
}

type PersistedDiscovery = Pick<
  DiscoveryState,
  'recentlyViewed' | 'recentSearches' | 'recentCollections' | 'compareItems' | 'recentlyPurchased'
>;

const emptyPersistedDiscovery: PersistedDiscovery = {
  recentlyViewed: [],
  recentSearches: [],
  recentCollections: [],
  compareItems: [],
  recentlyPurchased: [],
};

function prependUnique<T>(items: T[], value: T, key: (item: T) => string, limit: number) {
  return [value, ...items.filter((item) => key(item) !== key(value))].slice(0, limit);
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      ...emptyPersistedDiscovery,
      quickViewHandle: null,
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
      recordCollection: (handle) =>
        set((state) => ({
          recentCollections: prependUnique(state.recentCollections, handle, (item) => item, 6),
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
      openQuickView: (quickViewHandle) => set({ quickViewHandle }),
      closeQuickView: () => set({ quickViewHandle: null }),
    }),
    {
      name: 'luma-discovery',
      version: 2,
      partialize: ({
        recentlyViewed,
        recentSearches,
        recentCollections,
        compareItems,
        recentlyPurchased,
      }): PersistedDiscovery => ({
        recentlyViewed,
        recentSearches,
        recentCollections,
        compareItems,
        recentlyPurchased,
      }),
      // Version 1 stored DummyJSON snapshots keyed by numeric ids.
      migrate: (persisted, version): PersistedDiscovery =>
        version < 2 ? emptyPersistedDiscovery : (persisted as PersistedDiscovery),
    },
  ),
);
