import { beforeEach, describe, expect, it } from 'vitest';
import {
  getReferralAttributes,
  normalizeReferralCode,
  useReferralStore,
} from '@/features/referral/referral-store';

describe('referral store', () => {
  beforeEach(() => {
    useReferralStore.getState().clear();
  });

  it('normalizes codes and rejects unusable ones', () => {
    expect(normalizeReferralCode(' ana123 ')).toBe('ANA123');
    expect(normalizeReferralCode('team_br-01')).toBe('TEAM_BR-01');
    expect(normalizeReferralCode('a')).toBeNull();
    expect(normalizeReferralCode('has space')).toBeNull();
    expect(normalizeReferralCode('<script>')).toBeNull();
    expect(normalizeReferralCode(null)).toBeNull();
  });

  it('remembers the code in browser storage', () => {
    useReferralStore.getState().setCode('ANA123');

    expect(useReferralStore.getState().code).toBe('ANA123');
    expect(useReferralStore.getState().capturedAt).toEqual(expect.any(String));
    expect(JSON.parse(localStorage.getItem('luma-referral') ?? '{}') as unknown).toMatchObject({
      state: { code: 'ANA123' },
      version: 1,
    });
  });

  it('turns the code into the cart attribute new carts carry', () => {
    expect(getReferralAttributes()).toBeUndefined();

    useReferralStore.getState().setCode('ANA123');

    expect(getReferralAttributes()).toEqual([{ key: 'ref', value: 'ANA123' }]);
  });
});
