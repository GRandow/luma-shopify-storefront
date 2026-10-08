import { FAKE_KLAVIYO_LIST_ID } from './constants';

/**
 * The checks Klaviyo's client API applies to the two requests the storefront
 * makes, reduced to what matters for this app. Each returns `null` for a valid
 * body or the reason it would be rejected, so a payload that drifts from
 * Klaviyo's schema fails the end-to-end run instead of failing in production.
 */

const SHOPIFY_CATALOG_VARIANT = /^\$shopify:::\$default:::\d+$/;

function at(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function checkProfileEmail(profile: unknown): string | null {
  if (at(profile, ['type']) !== 'profile') return 'profile.data.type must be "profile"';
  const email = at(profile, ['attributes', 'email']);
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'profile.data.attributes.email must be an email address';
  }
  return null;
}

/** `POST /client/subscriptions` */
export function checkSubscription(body: unknown): string | null {
  if (at(body, ['data', 'type']) !== 'subscription') return 'data.type must be "subscription"';
  const profile = at(body, ['data', 'attributes', 'profile', 'data']);
  const profileError = checkProfileEmail(profile);
  if (profileError) return profileError;
  const consent = at(profile, ['attributes', 'subscriptions', 'email', 'marketing', 'consent']);
  if (consent !== 'SUBSCRIBED') return 'email marketing consent must be "SUBSCRIBED"';
  const list = at(body, ['data', 'relationships', 'list', 'data']);
  if (at(list, ['type']) !== 'list') return 'relationships.list.data.type must be "list"';
  if (at(list, ['id']) !== FAKE_KLAVIYO_LIST_ID) return 'unknown list';
  return null;
}

/** `POST /client/back-in-stock-subscriptions` */
export function checkBackInStock(body: unknown): string | null {
  if (at(body, ['data', 'type']) !== 'back-in-stock-subscription') {
    return 'data.type must be "back-in-stock-subscription"';
  }
  const channels = at(body, ['data', 'attributes', 'channels']);
  if (!Array.isArray(channels) || !channels.includes('EMAIL')) return 'channels must include EMAIL';
  const profileError = checkProfileEmail(at(body, ['data', 'attributes', 'profile', 'data']));
  if (profileError) return profileError;
  const variant = at(body, ['data', 'relationships', 'variant', 'data']);
  if (at(variant, ['type']) !== 'catalog-variant') {
    return 'relationships.variant.data.type must be "catalog-variant"';
  }
  const id = at(variant, ['id']);
  if (typeof id !== 'string' || !SHOPIFY_CATALOG_VARIANT.test(id)) {
    return 'variant id must look like $shopify:::$default:::<variant id>';
  }
  return null;
}
