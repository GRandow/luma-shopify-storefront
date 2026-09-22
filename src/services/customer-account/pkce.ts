/**
 * PKCE (RFC 7636) helpers for a public OAuth client running in the browser.
 *
 * A public client cannot keep a secret, so it proves that the party
 * redeeming the authorization code is the one that started the flow: it
 * sends a hash of a random `code_verifier` when asking for the code, and the
 * verifier itself when exchanging the code for tokens.
 */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A high-entropy, URL-safe random string (43 characters for 32 bytes). */
export function generateRandomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function generateCodeVerifier(): string {
  return generateRandomString(32);
}

/** `BASE64URL(SHA256(verifier))`, the only challenge method Shopify supports (S256). */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

/** Reads the payload of a JWT without verifying it (used for the `nonce` replay check only). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
