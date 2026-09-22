import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/auth-store';
import { useAddToCart, useCart, useUpdateCartLines } from '@/features/cart/cart-queries';
import { useCartSession } from '@/features/cart/cart-store';
import { storefrontRequest } from '@/services/storefront/client';
import { rawCartFixture } from '@/test/fixtures';
import { createTestQueryClient } from '@/test/render';

vi.mock('@/services/storefront/client', () => ({
  storefrontRequest: vi.fn(),
  isMockShop: () => true,
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const line = { merchandiseId: 'gid://shopify/ProductVariant/4301', quantity: 1 };

describe('cart queries', () => {
  beforeEach(() => {
    vi.mocked(storefrontRequest).mockReset();
    useCartSession.setState({ cartId: null });
    useAuthStore.getState().clear();
  });

  it('creates a cart on the first add, stores its id and seeds the cache', async () => {
    vi.mocked(storefrontRequest).mockResolvedValueOnce({
      cartCreate: { cart: rawCartFixture, userErrors: [] },
    });
    const { result } = renderHook(() => ({ add: useAddToCart(), cart: useCart() }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.add.mutateAsync([line]);
    });

    expect(useCartSession.getState().cartId).toBe(rawCartFixture.id);
    await waitFor(() => expect(result.current.cart.data?.totalQuantity).toBe(3));
    expect(vi.mocked(storefrontRequest)).toHaveBeenCalledTimes(1);
  });

  it('creates the cart for the signed-in customer', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'customer-token',
      refreshToken: null,
      idToken: null,
      expiresAt: Date.now() + 3_600_000,
    });
    vi.mocked(storefrontRequest).mockResolvedValueOnce({
      cartCreate: { cart: rawCartFixture, userErrors: [] },
    });
    const { result } = renderHook(() => useAddToCart(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync([line]);
    });

    expect(vi.mocked(storefrontRequest)).toHaveBeenCalledWith(
      expect.stringContaining('mutation CartCreate'),
      { lines: [line], buyerIdentity: { customerAccessToken: 'customer-token' } },
    );
  });

  it('starts a new cart when Shopify reports the stored one no longer exists', async () => {
    useCartSession.setState({ cartId: 'gid://shopify/Cart/expired' });
    vi.mocked(storefrontRequest)
      .mockResolvedValueOnce({
        cartLinesAdd: {
          cart: null,
          userErrors: [
            { field: ['cartId'], message: 'The specified cart does not exist.', code: 'INVALID' },
          ],
        },
      })
      .mockResolvedValueOnce({ cartCreate: { cart: rawCartFixture, userErrors: [] } });
    const { result } = renderHook(() => useAddToCart(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync([line]);
    });

    expect(useCartSession.getState().cartId).toBe(rawCartFixture.id);
    expect(vi.mocked(storefrontRequest)).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('mutation CartCreate'),
      { lines: [line] },
    );
  });

  it('surfaces Shopify user errors as readable messages', async () => {
    useCartSession.setState({ cartId: rawCartFixture.id });
    vi.mocked(storefrontRequest).mockResolvedValueOnce({
      cartLinesUpdate: {
        cart: null,
        userErrors: [{ field: ['lines'], message: 'Quantity exceeds stock.', code: 'INVALID' }],
      },
    });
    const { result } = renderHook(() => useUpdateCartLines(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(
        result.current.mutateAsync([{ id: 'gid://shopify/CartLine/1', quantity: 99 }]),
      ).rejects.toThrow('Quantity exceeds stock.');
    });
  });

  it('forgets a stored cart id that no longer resolves', async () => {
    useCartSession.setState({ cartId: 'gid://shopify/Cart/gone' });
    vi.mocked(storefrontRequest).mockResolvedValueOnce({ cart: null });
    renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => expect(useCartSession.getState().cartId).toBeNull());
    expect(vi.mocked(storefrontRequest)).toHaveBeenCalledWith(
      expect.stringContaining('query Cart'),
      { cartId: 'gid://shopify/Cart/gone' },
      expect.anything(),
    );
  });
});
