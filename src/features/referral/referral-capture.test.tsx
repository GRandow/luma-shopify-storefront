import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartSession } from '@/features/cart/cart-store';
import {
  captureReferralFromUrl,
  useReferralCapture,
  useReferralCartSync,
} from '@/features/referral/referral-capture';
import { useReferralStore } from '@/features/referral/referral-store';
import { storefrontRequest } from '@/services/storefront/client';
import { rawCartFixture } from '@/test/fixtures';
import { createTestQueryClient } from '@/test/render';

vi.mock('@/services/storefront/client', () => ({
  storefrontRequest: vi.fn(),
  isMockShop: () => true,
}));

function createWrapper(route = '/') {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('referral capture', () => {
  beforeEach(() => {
    useReferralStore.getState().clear();
    useCartSession.setState({ cartId: null });
    vi.mocked(storefrontRequest).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads ?ref= from the page URL, stores it and cleans the address bar', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const location = {
      pathname: '/luma-shopify-storefront/',
      search: '?utm_source=whatsapp&ref=ana123',
      hash: '#/products',
    } as Location;

    expect(captureReferralFromUrl(location)).toBe('ANA123');

    expect(useReferralStore.getState().code).toBe('ANA123');
    expect(replaceState).toHaveBeenCalledWith(
      window.history.state as unknown,
      '',
      '/luma-shopify-storefront/?utm_source=whatsapp#/products',
    );
  });

  it('ignores URLs without a code and keeps an invalid one out of the store', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');

    expect(captureReferralFromUrl({ pathname: '/', search: '', hash: '' } as Location)).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();

    expect(
      captureReferralFromUrl({ pathname: '/', search: '?ref=%3Cscript%3E', hash: '' } as Location),
    ).toBeNull();
    expect(useReferralStore.getState().code).toBeNull();
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it('captures a code carried inside the hash route and drops it from the route', async () => {
    const { result } = renderHook(
      () => {
        useReferralCapture();
        return useLocation().search;
      },
      { wrapper: createWrapper('/products?ref=team_br-01&sort=newest') },
    );

    await waitFor(() => expect(result.current).toBe('?sort=newest'));
    expect(useReferralStore.getState().code).toBe('TEAM_BR-01');
  });

  it('writes the remembered code onto an existing cart, once', async () => {
    useReferralStore.getState().setCode('ANA123');
    useCartSession.setState({ cartId: rawCartFixture.id });
    vi.mocked(storefrontRequest)
      .mockResolvedValueOnce({ cart: rawCartFixture })
      .mockResolvedValueOnce({
        cartAttributesUpdate: {
          cart: { ...rawCartFixture, attributes: [{ key: 'ref', value: 'ANA123' }] },
          userErrors: [],
        },
      });

    renderHook(() => useReferralCartSync(), { wrapper: createWrapper() });

    await waitFor(() =>
      expect(vi.mocked(storefrontRequest)).toHaveBeenCalledWith(
        expect.stringContaining('mutation CartAttributesUpdate'),
        { cartId: rawCartFixture.id, attributes: [{ key: 'ref', value: 'ANA123' }] },
      ),
    );
    await waitFor(() => expect(vi.mocked(storefrontRequest)).toHaveBeenCalledTimes(2));
  });

  it('leaves a cart alone when it already carries the code', async () => {
    useReferralStore.getState().setCode('ANA123');
    useCartSession.setState({ cartId: rawCartFixture.id });
    vi.mocked(storefrontRequest).mockResolvedValueOnce({
      cart: { ...rawCartFixture, attributes: [{ key: 'ref', value: 'ANA123' }] },
    });

    renderHook(() => useReferralCartSync(), { wrapper: createWrapper() });

    await waitFor(() => expect(vi.mocked(storefrontRequest)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(storefrontRequest)).not.toHaveBeenCalledWith(
      expect.stringContaining('mutation CartAttributesUpdate'),
      expect.anything(),
    );
  });
});
