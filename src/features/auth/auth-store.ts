import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerSession } from '@/services/customer-account/oauth';
import type { Customer } from '@/types/user';

/**
 * The customer's session with Shopify's Customer Account API.
 *
 * Tokens are kept in browser storage because this is a public client with no
 * server of its own (Hydrogen would keep them in a server-side session). The
 * access token is short-lived and refreshed by `features/auth/session.ts`;
 * signing out also ends the session on Shopify's side.
 */
interface AuthState {
  session: CustomerSession | null;
  customer: Customer | null;
  isAuthenticated: boolean;
  setSession: (session: CustomerSession) => void;
  setCustomer: (customer: Customer | null) => void;
  clear: () => void;
}

type PersistedAuth = Pick<AuthState, 'session' | 'customer' | 'isAuthenticated'>;

const signedOut: PersistedAuth = { session: null, customer: null, isAuthenticated: false };

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...signedOut,
      setSession: (session) => set({ session, isAuthenticated: true }),
      setCustomer: (customer) => set({ customer }),
      clear: () => set({ ...signedOut }),
    }),
    {
      name: 'luma-session',
      version: 3,
      partialize: ({ session, customer, isAuthenticated }): PersistedAuth => ({
        session,
        customer,
        isAuthenticated,
      }),
      // Versions 1 and 2 held a demo (DummyJSON) login; nothing to carry over.
      migrate: (persisted, version): PersistedAuth =>
        version < 3 ? { ...signedOut } : (persisted as PersistedAuth),
    },
  ),
);
