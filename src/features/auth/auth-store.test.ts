import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  idToken: 'id-1',
  expiresAt: 1_800_000_000_000,
};

/** The store reads browser storage when its module loads, so each case imports it afresh. */
async function loadStore() {
  vi.resetModules();
  return (await import('@/features/auth/auth-store')).useAuthStore;
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the Shopify session under the current schema version', async () => {
    const useAuthStore = await loadStore();

    useAuthStore.getState().setSession(session);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(JSON.parse(localStorage.getItem('luma-session') ?? '{}') as unknown).toMatchObject({
      state: { session, customer: null, isAuthenticated: true },
      version: 3,
    });
  });

  it('clears everything on sign-out', async () => {
    const useAuthStore = await loadStore();
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().setCustomer({
      id: 'gid://shopify/Customer/1',
      firstName: 'Gabriel',
      lastName: 'Randow',
      displayName: 'Gabriel Randow',
      email: 'gabriel@example.com',
      phone: null,
      defaultAddress: null,
      addresses: [],
    });

    useAuthStore.getState().clear();

    expect(useAuthStore.getState()).toMatchObject({
      session: null,
      customer: null,
      isAuthenticated: false,
    });
  });

  it('drops a session persisted by the old demo login', async () => {
    localStorage.setItem(
      'luma-session',
      JSON.stringify({
        state: { user: { id: 1, username: 'emilys' }, orders: [], isAuthenticated: true },
        version: 2,
      }),
    );

    const useAuthStore = await loadStore();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().session).toBeNull();
  });
});
