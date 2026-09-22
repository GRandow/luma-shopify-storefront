import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CustomerAccountConfig } from '@/services/customer-account/config';
import {
  completeLogin,
  createAuthorizationUrl,
  createLogoutUrl,
  hasAuthorizationResponse,
  refreshSession,
} from '@/services/customer-account/oauth';
import { generateCodeChallenge } from '@/services/customer-account/pkce';

const config: CustomerAccountConfig = {
  shopId: '83614040281',
  clientId: 'client-123',
  authorizationEndpoint: 'https://shopify.com/authentication/83614040281/oauth/authorize',
  tokenEndpoint: 'https://shopify.com/authentication/83614040281/oauth/token',
  logoutEndpoint: 'https://shopify.com/authentication/83614040281/logout',
  graphqlEndpoint: 'https://shopify.com/83614040281/account/customer/api/2026-07/graphql',
  redirectUri: 'https://grandow.github.io/luma-shopify-storefront/',
};

interface StoredAttempt {
  verifier: string;
  state: string;
  nonce: string;
  returnTo: string;
}

function readAttempt(): StoredAttempt {
  return JSON.parse(sessionStorage.getItem('luma-auth-attempt') ?? 'null') as StoredAttempt;
}

function fakeIdToken(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `eyJhbGciOiJSUzI1NiJ9.${payload}.signature`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn<typeof fetch>();

describe('customer account OAuth flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds the authorization URL with PKCE and remembers the attempt', async () => {
    const url = new URL(await createAuthorizationUrl('/checkout', config));
    const attempt = readAttempt();

    expect(url.origin + url.pathname).toBe(config.authorizationEndpoint);
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri);
    expect(url.searchParams.get('scope')).toBe('openid email customer-account-api:full');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe(attempt.state);
    expect(url.searchParams.get('nonce')).toBe(attempt.nonce);
    expect(url.searchParams.get('code_challenge')).toBe(
      await generateCodeChallenge(attempt.verifier),
    );
    expect(attempt.returnTo).toBe('/checkout');
  });

  it('recognises Shopify’s redirect back', () => {
    expect(hasAuthorizationResponse('?code=abc&state=xyz')).toBe(true);
    expect(hasAuthorizationResponse('?error=access_denied')).toBe(true);
    expect(hasAuthorizationResponse('?utm_source=newsletter')).toBe(false);
    expect(hasAuthorizationResponse('')).toBe(false);
  });

  it('exchanges the code for tokens with the stored verifier', async () => {
    await createAuthorizationUrl('/checkout', config);
    const attempt = readAttempt();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        id_token: fakeIdToken({ nonce: attempt.nonce, sub: 'customer-1' }),
        expires_in: 3600,
        token_type: 'bearer',
      }),
    );
    const before = Date.now();

    const result = await completeLogin(`?code=code-1&state=${attempt.state}`, config);

    expect(result.returnTo).toBe('/checkout');
    expect(result.session.accessToken).toBe('access-1');
    expect(result.session.refreshToken).toBe('refresh-1');
    expect(result.session.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(sessionStorage.getItem('luma-auth-attempt')).toBeNull();

    const [endpoint, init] = fetchMock.mock.calls[0] ?? [];
    expect(endpoint).toBe(config.tokenEndpoint);
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Content-Type')).toBe(
      'application/x-www-form-urlencoded',
    );
    const body = new URLSearchParams(init?.body as URLSearchParams);
    expect(Object.fromEntries(body)).toEqual({
      grant_type: 'authorization_code',
      client_id: 'client-123',
      redirect_uri: config.redirectUri,
      code: 'code-1',
      code_verifier: attempt.verifier,
    });
  });

  it('rejects a response whose state does not match the attempt', async () => {
    await createAuthorizationUrl('/profile', config);

    await expect(completeLogin('?code=code-1&state=forged', config)).rejects.toThrow(
      'does not match this browser session',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an identity token carrying a different nonce', async () => {
    await createAuthorizationUrl('/profile', config);
    const attempt = readAttempt();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        access_token: 'access-1',
        id_token: fakeIdToken({ nonce: 'replayed' }),
        expires_in: 3600,
      }),
    );

    await expect(completeLogin(`?code=code-1&state=${attempt.state}`, config)).rejects.toThrow(
      'could not be verified',
    );
  });

  it('surfaces the error Shopify sends when sign-in is cancelled', async () => {
    await createAuthorizationUrl('/profile', config);

    await expect(
      completeLogin('?error=access_denied&error_description=The+customer+cancelled', config),
    ).rejects.toThrow('The customer cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a rejected token request', async () => {
    await createAuthorizationUrl('/profile', config);
    const attempt = readAttempt();
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid_grant' }, 400));

    await expect(completeLogin(`?code=code-1&state=${attempt.state}`, config)).rejects.toThrow(
      'rejected the token request (400)',
    );
  });

  it('refreshes the access token and keeps the identity token', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 3600 }),
    );

    const renewed = await refreshSession(
      { accessToken: 'access-1', refreshToken: 'refresh-1', idToken: 'id-1', expiresAt: 0 },
      config,
    );

    expect(renewed).toMatchObject({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      idToken: 'id-1',
    });
    const body = new URLSearchParams(fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams);
    expect(Object.fromEntries(body)).toEqual({
      grant_type: 'refresh_token',
      client_id: 'client-123',
      refresh_token: 'refresh-1',
    });
  });

  it('builds the end-session URL that returns to the storefront', () => {
    const url = new URL(
      createLogoutUrl(
        { accessToken: 'a', refreshToken: null, idToken: 'id-1', expiresAt: 0 },
        config,
      ),
    );

    expect(url.origin + url.pathname).toBe(config.logoutEndpoint);
    expect(url.searchParams.get('id_token_hint')).toBe('id-1');
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(config.redirectUri);
  });
});
