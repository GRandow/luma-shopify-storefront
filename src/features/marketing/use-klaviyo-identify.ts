import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { decodeJwtPayload } from '@/services/customer-account/pkce';
import { isKlaviyoEnabled } from '@/services/klaviyo/config';
import { identifyShopper } from '@/services/klaviyo/onsite';

/**
 * Identifies signed-in customers to Klaviyo, so their browsing and cart
 * events land on their profile. The email comes from the customer profile
 * when the account area has loaded it, otherwise from the ID token Shopify
 * issued at sign-in (the `email` scope puts it there): no extra request.
 */
export function useKlaviyoIdentify(): void {
  const idToken = useAuthStore((state) => state.session?.idToken ?? null);
  const customer = useAuthStore((state) => state.customer);
  const lastIdentity = useRef<string | null>(null);

  useEffect(() => {
    if (!isKlaviyoEnabled()) return;
    const claims = idToken ? decodeJwtPayload(idToken) : null;
    const email = customer?.email ?? (typeof claims?.email === 'string' ? claims.email : null);
    if (!email) return;

    const identity = {
      email,
      firstName: customer?.firstName ?? null,
      lastName: customer?.lastName ?? null,
    };
    const key = JSON.stringify(identity);
    if (lastIdentity.current === key) return;
    lastIdentity.current = key;
    identifyShopper(identity);
  }, [customer, idToken]);
}
