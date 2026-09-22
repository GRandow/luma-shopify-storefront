import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuthStore } from '@/features/auth/auth-store';
import { attachCartToCustomer } from '@/features/cart/cart-buyer-identity';
import { getRedirectUri } from '@/services/customer-account/config';
import { completeLogin, hasAuthorizationResponse } from '@/services/customer-account/oauth';

interface AuthCallbackGateProps {
  children: ReactNode;
  /** Called once the tokens are stored, with the in-app route to continue to. */
  onSignedIn: (returnTo: string) => void;
  /** Called when Shopify's response could not be turned into a session. */
  onFailed: (error: Error) => void;
}

/**
 * Finishes a sign-in when the page loads on Shopify's redirect back
 * (`/?code=…&state=…`). The rest of the app is held back until the code has
 * been exchanged, so the first screen the customer sees is already signed
 * in. The query string is then dropped from the address bar; the app's own
 * routing lives in the hash and is untouched by it.
 */
export function AuthCallbackGate({ children, onSignedIn, onFailed }: AuthCallbackGateProps) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(() => hasAuthorizationResponse());
  const started = useRef(false);

  useEffect(() => {
    if (!pending || started.current) return;
    // An authorization code can be redeemed once; StrictMode runs effects twice.
    started.current = true;

    void (async () => {
      try {
        const { session, returnTo } = await completeLogin();
        useAuthStore.getState().setSession(session);
        window.history.replaceState(null, '', getRedirectUri());
        // Best effort: the account area works even when the cart cannot be attached.
        attachCartToCustomer(session.accessToken, queryClient).catch((error: unknown) => {
          console.warn('The cart could not be attached to the customer.', error);
        });
        onSignedIn(returnTo);
      } catch (error) {
        window.history.replaceState(null, '', getRedirectUri());
        onFailed(error instanceof Error ? error : new Error('Sign-in failed.'));
      } finally {
        setPending(false);
      }
    })();
  }, [pending, queryClient, onSignedIn, onFailed]);

  if (pending) return <PageLoader />;
  return children;
}
