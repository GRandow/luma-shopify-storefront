import { describe, expect, it } from 'vitest';
import {
  decodeJwtPayload,
  generateCodeChallenge,
  generateCodeVerifier,
  generateRandomString,
} from '@/services/customer-account/pkce';

describe('PKCE helpers', () => {
  it('derives the S256 challenge from the RFC 7636 example verifier', async () => {
    // Appendix B of RFC 7636.
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

    await expect(generateCodeChallenge(verifier)).resolves.toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('generates URL-safe verifiers of 43 characters that differ each time', () => {
    const first = generateCodeVerifier();
    const second = generateCodeVerifier();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
    expect(generateRandomString(16)).toHaveLength(22);
  });

  it('decodes a JWT payload without verifying it', () => {
    const payload = btoa(JSON.stringify({ nonce: 'abc', sub: 'customer-1' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(decodeJwtPayload(`header.${payload}.signature`)).toEqual({
      nonce: 'abc',
      sub: 'customer-1',
    });
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });
});
