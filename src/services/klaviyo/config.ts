/**
 * Klaviyo (email marketing) configuration.
 *
 * The storefront only ever uses Klaviyo's *public* API key, the six-character
 * site id, plus the id of the list the newsletter adds people to. Both are
 * meant to be visible in a browser. The private key belongs to servers and
 * must never be part of this bundle.
 *
 * Orders, checkouts and customers reach Klaviyo through its Shopify
 * integration, server side. What a headless storefront has to add is the
 * browsing side: onsite tracking (klaviyo.js), sign-up forms and back-in-stock
 * requests. Without a public key all of that stays off and the storefront
 * renders exactly as before, which is the case with mock.shop.
 *
 * Settings are read when used rather than at import time, so tests can switch
 * the integration on and off.
 */

/** Revision of Klaviyo's client API this app was written against. */
export const KLAVIYO_API_REVISION = '2026-07-15';

const KLAVIYO_API_ORIGIN = 'https://a.klaviyo.com';
const KLAVIYO_SCRIPT_ORIGIN = 'https://static.klaviyo.com';

export interface KlaviyoConfig {
  publicKey: string;
  listId: string;
  /** Base URL of the client API (`/client/...` endpoints). */
  apiBase: string;
  /** Base URL klaviyo.js is loaded from. */
  scriptBase: string;
}

export function getKlaviyoConfig(): KlaviyoConfig {
  return {
    publicKey: import.meta.env.VITE_KLAVIYO_PUBLIC_KEY?.trim() ?? '',
    listId: import.meta.env.VITE_KLAVIYO_LIST_ID?.trim() ?? '',
    // Both bases are overridden only by the end-to-end build, which serves
    // stand-ins for Klaviyo from the preview server.
    apiBase: import.meta.env.VITE_KLAVIYO_API_BASE?.trim() || KLAVIYO_API_ORIGIN,
    scriptBase: import.meta.env.VITE_KLAVIYO_SCRIPT_BASE?.trim() || KLAVIYO_SCRIPT_ORIGIN,
  };
}

/** Onsite tracking and back-in-stock alerts need only the public key. */
export function isKlaviyoEnabled(): boolean {
  return getKlaviyoConfig().publicKey.length > 0;
}

/** The newsletter also needs to know which list to subscribe people to. */
export function isNewsletterEnabled(): boolean {
  const { publicKey, listId } = getKlaviyoConfig();
  return publicKey.length > 0 && listId.length > 0;
}

/** klaviyo.js for this account, e.g. `https://static.klaviyo.com/onsite/js/AbC123/klaviyo.js?company_id=AbC123`. */
export function getKlaviyoScriptUrl(): string {
  const { publicKey, scriptBase } = getKlaviyoConfig();
  const key = encodeURIComponent(publicKey);
  return `${scriptBase}/onsite/js/${key}/klaviyo.js?company_id=${key}`;
}
