import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Address, AuthUser, Order } from '@/types/user';

interface AuthState {
  user: AuthUser | null;
  orders: Order[];
  addresses: Address[];
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  addOrder: (order: Order) => void;
  addAddress: (address: Address) => void;
}

type PersistedAuth = Pick<AuthState, 'user' | 'orders' | 'addresses' | 'isAuthenticated'>;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      orders: [],
      addresses: [],
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      addAddress: (address) =>
        set((state) => ({
          addresses: address.isDefault
            ? [address, ...state.addresses.map((item) => ({ ...item, isDefault: false }))]
            : [address, ...state.addresses],
        })),
    }),
    {
      name: 'luma-session',
      version: 2,
      partialize: ({ user, orders, addresses, isAuthenticated }): PersistedAuth => ({
        user,
        orders,
        addresses,
        isAuthenticated,
      }),
      // Version 1 orders referenced DummyJSON products; keep the session, drop the orders.
      migrate: (persisted, version): PersistedAuth => {
        const state = persisted as PersistedAuth;
        return version < 2 ? { ...state, orders: [] } : state;
      },
    },
  ),
);
