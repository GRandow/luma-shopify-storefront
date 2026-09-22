import {
  CUSTOMER_ACCOUNT_SCOPES,
  getCustomerAccountConfig,
  type CustomerAccountConfig,
} from '@/services/customer-account/config';
import {
  decodeJwtPayload,
  generateCodeChallenge,
  generateCodeVerifier,
  generateRandomString,
} from '@/services/customer-account/pkce';
import { redirectTo } from '@/utils/navigation';

/**
 * Authorization-code flow with PKCE against Shopify's customer accounts.
 *
 *   1. `beginLogin()` stores the PKCE verifier, a `state` and a `nonce` for
 *      this attempt, then sends the browser to Shopify's hosted sign-in
 *      (one-time code by email, no password).
 *   2. Shopify redirects back to the registered callback URI with
 *      `?code=…&state=…` in the query string.
 *   3. `completeLogin()` checks the state, exchanges the code for tokens and
 *      checks the nonce inside the id token.
 *
 * Tokens are returned as a `CustomerSession`; storing them is the caller's job.
 */

const ATTEMPT_STORAGE_KEY = 'luma-auth-attempt';

export interface CustomerSession {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  /** Unix epoch milliseconds after which `accessToken` is no longer valid. */
  expiresAt: number;
}

interface LoginAttempt {
  verifier: string;
  state: string;
  nonce: string;
  /** In-app route to return to after signing in, e.g. `/profile`. */
  returnTo: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
}

export class CustomerAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomerAuthError';
  }
}

function saveAttempt(attempt: LoginAttempt) {
  sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
}

function takeAttempt(): LoginAttempt | null {
  const raw = sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
  sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginAttempt;
  } catch {
    return null;
  }
}

/** Builds the authorization URL and records the attempt; does not navigate. */
export async function createAuthorizationUrl(
  returnTo = '/profile',
  config: CustomerAccountConfig = getCustomerAccountConfig(),
): Promise<string> {
  const verifier = generateCodeVerifier();
  const state = generateRandomString(16);
  const nonce = generateRandomString(16);
  saveAttempt({ verifier, state, nonce, returnTo });

  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set('scope', CUSTOMER_ACCOUNT_SCOPES);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', await generateCodeChallenge(verifier));
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

/** Sends the browser to Shopify's sign-in page. */
export async function beginLogin(returnTo = '/profile'): Promise<void> {
  redirectTo(await createAuthorizationUrl(returnTo));
}

/** True when the current URL is Shopify's redirect back from sign-in. */
export function hasAuthorizationResponse(search = window.location.search): boolean {
  const params = new URLSearchParams(search);
  return params.has('code') || params.has('error');
}

function sessionFromTokens(tokens: TokenResponse, previous?: CustomerSession): CustomerSession {
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? previous?.refreshToken ?? null,
    idToken: tokens.id_token ?? previous?.idToken ?? null,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
}

async function requestTokens(
  body: Record<string, string>,
  config: CustomerAccountConfig,
): Promise<TokenResponse> {
  // The token endpoint checks the browser's Origin header against the
  // JavaScript origins registered for the public client, so this request has
  // to come from the storefront itself, not from a proxy.
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new CustomerAuthError(
      `Shopify rejected the token request (${response.status})${detail ? `: ${detail}` : ''}`,
    );
  }
  return (await response.json()) as TokenResponse;
}

/**
 * Handles the redirect back from Shopify. Resolves with the session and the
 * route to continue to; rejects when the response is missing, tampered with,
 * or the exchange fails.
 */
export async function completeLogin(
  search = window.location.search,
  config: CustomerAccountConfig = getCustomerAccountConfig(),
): Promise<{ session: CustomerSession; returnTo: string }> {
  const params = new URLSearchParams(search);
  const attempt = takeAttempt();

  const error = params.get('error');
  if (error) {
    throw new CustomerAuthError(params.get('error_description') ?? `Sign-in failed: ${error}`);
  }
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) throw new CustomerAuthError('The sign-in response is incomplete.');
  if (!attempt || attempt.state !== state) {
    throw new CustomerAuthError('The sign-in response does not match this browser session.');
  }

  const tokens = await requestTokens(
    {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      code,
      code_verifier: attempt.verifier,
    },
    config,
  );

  if (tokens.id_token) {
    const claims = decodeJwtPayload(tokens.id_token);
    if (claims?.nonce !== attempt.nonce) {
      throw new CustomerAuthError('The identity token could not be verified.');
    }
  }

  // Only in-app routes are followed after sign-in.
  const returnTo = attempt.returnTo.startsWith('/') ? attempt.returnTo : '/profile';
  return { session: sessionFromTokens(tokens), returnTo };
}

/** Exchanges the refresh token for a new access token. */
export async function refreshSession(
  session: CustomerSession,
  config: CustomerAccountConfig = getCustomerAccountConfig(),
): Promise<CustomerSession> {
  if (!session.refreshToken) throw new CustomerAuthError('There is no refresh token.');
  const tokens = await requestTokens(
    {
      grant_type: 'refresh_token',
      client_id: config.clientId,
      refresh_token: session.refreshToken,
    },
    config,
  );
  return sessionFromTokens(tokens, session);
}

/** Shopify's end-session URL; it clears the Shopify-side session and comes back to the app. */
export function createLogoutUrl(
  session: CustomerSession | null,
  config: CustomerAccountConfig = getCustomerAccountConfig(),
): string {
  const url = new URL(config.logoutEndpoint);
  if (session?.idToken) url.searchParams.set('id_token_hint', session.idToken);
  url.searchParams.set('post_logout_redirect_uri', config.redirectUri);
  return url.toString();
}
