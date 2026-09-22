import { useAuthStore } from '@/features/auth/auth-store';
import {
  createLogoutUrl,
  refreshSession,
  type CustomerSession,
} from '@/services/customer-account/oauth';
import type { CartBuyerIdentityInput } from '@/services/storefront/types';
import { redirectTo } from '@/utils/navigation';

/** Refresh when less than a minute of validity is left. */
const REFRESH_MARGIN_MS = 60_000;

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.');
    this.name = 'SessionExpiredError';
  }
}

let pendingRefresh: Promise<CustomerSession> | null = null;

function isFresh(session: CustomerSession): boolean {
  return session.expiresAt - Date.now() > REFRESH_MARGIN_MS;
}

/**
 * Returns an access token that is valid for at least another minute,
 * refreshing it first when needed. Concurrent callers share one refresh.
 * Clears the session and throws when it cannot be renewed.
 */
export async function getValidAccessToken(): Promise<string> {
  const { session } = useAuthStore.getState();
  if (!session) throw new SessionExpiredError();
  if (isFresh(session)) return session.accessToken;
  if (!session.refreshToken) {
    useAuthStore.getState().clear();
    throw new SessionExpiredError();
  }

  pendingRefresh ??= refreshSession(session)
    .then((renewed) => {
      useAuthStore.getState().setSession(renewed);
      return renewed;
    })
    .catch((error: unknown) => {
      useAuthStore.getState().clear();
      throw error instanceof Error ? error : new SessionExpiredError();
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return (await pendingRefresh).accessToken;
}

/**
 * Buyer identity for a cart that is about to be created: the signed-in
 * customer's token, or nothing for a guest. A session that cannot be renewed
 * falls back to a guest cart rather than blocking the add-to-bag.
 */
export async function getCartBuyerIdentity(): Promise<CartBuyerIdentityInput | undefined> {
  if (!useAuthStore.getState().session) return undefined;
  try {
    return { customerAccessToken: await getValidAccessToken() };
  } catch {
    return undefined;
  }
}

/** Forgets the local session and ends it on Shopify's side (navigates away). */
export function signOut(): void {
  const { session } = useAuthStore.getState();
  useAuthStore.getState().clear();
  if (session) redirectTo(createLogoutUrl(session));
}
