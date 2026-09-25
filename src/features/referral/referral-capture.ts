import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart, useUpdateCartAttributes } from '@/features/cart/cart-queries';
import {
  normalizeReferralCode,
  REFERRAL_ATTRIBUTE_KEY,
  REFERRAL_QUERY_PARAM,
  useReferralStore,
} from '@/features/referral/referral-store';
import { getCartAttribute } from '@/types/cart';

/**
 * Reads `?ref=CODE` from the page URL (the part before the hash route), stores
 * it and removes it from the address bar so it does not follow every in-app
 * navigation. Runs once at startup, before the router takes over.
 */
export function captureReferralFromUrl(location: Location = window.location): string | null {
  const params = new URLSearchParams(location.search);
  if (!params.has(REFERRAL_QUERY_PARAM)) return null;

  const code = normalizeReferralCode(params.get(REFERRAL_QUERY_PARAM));
  if (code) useReferralStore.getState().setCode(code);

  params.delete(REFERRAL_QUERY_PARAM);
  const search = params.toString();
  const cleanUrl = `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
  window.history.replaceState(window.history.state, '', cleanUrl);
  return code;
}

/**
 * Same as above for links that carry the code inside the hash route, e.g.
 * `#/products?ref=CODE`. Those are only visible to the router.
 */
export function useReferralCapture(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const setCode = useReferralStore((state) => state.setCode);
  const raw = searchParams.get(REFERRAL_QUERY_PARAM);

  useEffect(() => {
    if (raw === null) return;
    const code = normalizeReferralCode(raw);
    if (code) setCode(code);
    const next = new URLSearchParams(searchParams);
    next.delete(REFERRAL_QUERY_PARAM);
    setSearchParams(next, { replace: true });
  }, [raw, searchParams, setSearchParams, setCode]);
}

/**
 * Keeps the cart's `ref` attribute equal to the remembered referral code, so
 * a code captured after the cart was created still reaches the order. Each
 * cart/code pair is attempted once; a failure (e.g. an expired cart) does not
 * loop.
 */
export function useReferralCartSync(): void {
  const code = useReferralStore((state) => state.code);
  const cart = useCart().data ?? null;
  const { mutate, isPending } = useUpdateCartAttributes();
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!code || !cart || isPending) return;
    if (getCartAttribute(cart, REFERRAL_ATTRIBUTE_KEY) === code) return;
    const attemptKey = `${cart.id}|${code}`;
    if (attempted.current === attemptKey) return;
    attempted.current = attemptKey;

    const others = cart.attributes.filter((attribute) => attribute.key !== REFERRAL_ATTRIBUTE_KEY);
    mutate([...others, { key: REFERRAL_ATTRIBUTE_KEY, value: code }]);
  }, [code, cart, isPending, mutate]);
}
