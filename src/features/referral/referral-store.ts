import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartAttributeInput } from '@/services/storefront/types';

/**
 * Referral attribution for direct-sales storefronts.
 *
 * A distributor shares links such as `/?ref=ANA123`. The code is remembered
 * in the browser and written on the cart as the `ref` attribute, which
 * Shopify copies onto the order as a note attribute. Back-office systems
 * (a commission engine, or this project's companion app) read it from the
 * order to attribute the sale.
 */

/** Cart attribute key carried through checkout onto the order. */
export const REFERRAL_ATTRIBUTE_KEY = 'ref';

/** Query-string parameter distributors put in their links. */
export const REFERRAL_QUERY_PARAM = 'ref';

const REFERRAL_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

/** Uppercases and validates a raw code; `null` when it is not usable. */
export function normalizeReferralCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase() ?? '';
  return REFERRAL_CODE_PATTERN.test(code) ? code : null;
}

interface ReferralState {
  code: string | null;
  capturedAt: string | null;
  setCode: (code: string) => void;
  clear: () => void;
}

type PersistedReferral = Pick<ReferralState, 'code' | 'capturedAt'>;

export const useReferralStore = create<ReferralState>()(
  persist(
    (set) => ({
      code: null,
      capturedAt: null,
      setCode: (code) => set({ code, capturedAt: new Date().toISOString() }),
      clear: () => set({ code: null, capturedAt: null }),
    }),
    {
      name: 'luma-referral',
      version: 1,
      partialize: ({ code, capturedAt }): PersistedReferral => ({ code, capturedAt }),
    },
  ),
);

/** The attributes a new cart should carry, or `undefined` when nobody referred the shopper. */
export function getReferralAttributes(): CartAttributeInput[] | undefined {
  const { code } = useReferralStore.getState();
  return code ? [{ key: REFERRAL_ATTRIBUTE_KEY, value: code }] : undefined;
}
