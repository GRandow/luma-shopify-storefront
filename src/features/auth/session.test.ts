import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/auth-store';
import {
  getCartBuyerIdentity,
  getValidAccessToken,
  SessionExpiredError,
  signOut,
} from '@/features/auth/session';
import { createLogoutUrl, refreshSession } from '@/services/customer-account/oauth';
import { redirectTo } from '@/utils/navigation';

vi.mock('@/services/customer-account/oauth', () => ({
  refreshSession: vi.fn(),
  createLogoutUrl: vi.fn(() => 'https://shopify.com/authentication/1/logout?x=1'),
}));

vi.mock('@/utils/navigation', () => ({
  redirectTo: vi.fn(),
}));

const HOUR = 60 * 60 * 1000;

function signIn(expiresInMs: number, refreshToken: string | null = 'refresh-1') {
  useAuthStore.getState().setSession({
    accessToken: 'access-1',
    refreshToken,
    idToken: 'id-1',
    expiresAt: Date.now() + expiresInMs,
  });
}

describe('customer session', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
    vi.mocked(refreshSession).mockReset();
    vi.mocked(redirectTo).mockReset();
  });

  it('returns the current token while it is fresh', async () => {
    signIn(HOUR);

    await expect(getValidAccessToken()).resolves.toBe('access-1');
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('refreshes a token that is about to expire, once for concurrent callers', async () => {
    signIn(30_000);
    vi.mocked(refreshSession).mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      idToken: 'id-1',
      expiresAt: Date.now() + HOUR,
    });

    const tokens = await Promise.all([getValidAccessToken(), getValidAccessToken()]);

    expect(tokens).toEqual(['access-2', 'access-2']);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session?.refreshToken).toBe('refresh-2');
  });

  it('signs the customer out locally when the refresh fails', async () => {
    signIn(0);
    vi.mocked(refreshSession).mockRejectedValue(new Error('invalid_grant'));

    await expect(getValidAccessToken()).rejects.toThrow('invalid_grant');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('cannot renew a session without a refresh token', async () => {
    signIn(0, null);

    await expect(getValidAccessToken()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('gives carts the customer token, or nothing for guests', async () => {
    await expect(getCartBuyerIdentity()).resolves.toBeUndefined();

    signIn(HOUR);
    await expect(getCartBuyerIdentity()).resolves.toEqual({ customerAccessToken: 'access-1' });
  });

  it('forgets the session and leaves through Shopify’s logout endpoint', () => {
    signIn(HOUR);

    signOut();

    expect(useAuthStore.getState().session).toBeNull();
    expect(createLogoutUrl).toHaveBeenCalledWith(
      expect.objectContaining({ idToken: 'id-1' }) as unknown,
    );
    expect(redirectTo).toHaveBeenCalledWith('https://shopify.com/authentication/1/logout?x=1');
  });
});
