import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/auth-store';
import { AuthCallbackGate } from '@/features/auth/components/AuthCallbackGate';
import { attachCartToCustomer } from '@/features/cart/cart-buyer-identity';
import { completeLogin, hasAuthorizationResponse } from '@/services/customer-account/oauth';
import { createTestQueryClient } from '@/test/render';

vi.mock('@/services/customer-account/oauth', () => ({
  completeLogin: vi.fn(),
  hasAuthorizationResponse: vi.fn(),
}));

vi.mock('@/services/customer-account/config', () => ({
  getRedirectUri: () => 'http://localhost:3000/luma-shopify-storefront/',
}));

vi.mock('@/features/cart/cart-buyer-identity', () => ({
  attachCartToCustomer: vi.fn(() => Promise.resolve()),
}));

const session = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  idToken: 'id-1',
  expiresAt: Date.now() + 3_600_000,
};

function renderGate() {
  const onSignedIn = vi.fn();
  const onFailed = vi.fn();
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthCallbackGate onSignedIn={onSignedIn} onFailed={onFailed}>
        <p>Storefront</p>
      </AuthCallbackGate>
    </QueryClientProvider>,
  );
  return { onSignedIn, onFailed };
}

describe('AuthCallbackGate', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
    vi.mocked(completeLogin).mockReset();
    vi.mocked(attachCartToCustomer).mockClear();
    vi.mocked(hasAuthorizationResponse).mockReturnValue(false);
  });

  it('renders the app straight away on an ordinary page load', () => {
    const { onSignedIn } = renderGate();

    expect(screen.getByText('Storefront')).toBeInTheDocument();
    expect(completeLogin).not.toHaveBeenCalled();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('finishes the sign-in, cleans the address bar and continues to the requested page', async () => {
    vi.mocked(hasAuthorizationResponse).mockReturnValue(true);
    vi.mocked(completeLogin).mockResolvedValue({ session, returnTo: '/checkout' });
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { onSignedIn, onFailed } = renderGate();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Storefront')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Storefront')).toBeInTheDocument());
    expect(useAuthStore.getState().session).toEqual(session);
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      'http://localhost:3000/luma-shopify-storefront/',
    );
    expect(attachCartToCustomer).toHaveBeenCalledWith('access-1', expect.anything());
    expect(onSignedIn).toHaveBeenCalledWith('/checkout');
    expect(onFailed).not.toHaveBeenCalled();
    replaceState.mockRestore();
  });

  it('reports a failed exchange and still renders the app, signed out', async () => {
    vi.mocked(hasAuthorizationResponse).mockReturnValue(true);
    vi.mocked(completeLogin).mockRejectedValue(new Error('The sign-in response is incomplete.'));
    const { onSignedIn, onFailed } = renderGate();

    await waitFor(() => expect(screen.getByText('Storefront')).toBeInTheDocument());
    expect(onFailed).toHaveBeenCalledWith(new Error('The sign-in response is incomplete.'));
    expect(onSignedIn).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
