import { getKlaviyoConfig, KLAVIYO_API_REVISION } from '@/services/klaviyo/config';
import { shopifyNumericId } from '@/services/klaviyo/events';

/**
 * Klaviyo's client API: the endpoints built to be called from a browser with
 * the public key (`company_id`). They answer 202 once the request is accepted;
 * consent records, list membership and back-in-stock registrations are then
 * processed on Klaviyo's side.
 */

interface KlaviyoErrorObject {
  id?: string;
  status?: number | string;
  code?: string;
  title?: string;
  detail?: string;
}

export class KlaviyoApiError extends Error {
  readonly status: number;
  readonly errors: readonly KlaviyoErrorObject[];

  constructor(message: string, status: number, errors: readonly KlaviyoErrorObject[] = []) {
    super(message);
    this.name = 'KlaviyoApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function readErrors(response: Response): Promise<KlaviyoErrorObject[]> {
  try {
    const payload = (await response.json()) as { errors?: unknown };
    return Array.isArray(payload.errors) ? (payload.errors as KlaviyoErrorObject[]) : [];
  } catch {
    return [];
  }
}

async function postToClientApi(path: string, body: unknown): Promise<void> {
  const { apiBase, publicKey } = getKlaviyoConfig();
  if (!publicKey) throw new KlaviyoApiError('Klaviyo is not configured.', 0);

  const response = await fetch(`${apiBase}${path}?company_id=${encodeURIComponent(publicKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      revision: KLAVIYO_API_REVISION,
    },
    body: JSON.stringify(body),
  });
  if (response.ok) return;

  const errors = await readErrors(response);
  const first = errors[0];
  throw new KlaviyoApiError(
    first?.detail ?? first?.title ?? `Klaviyo request failed with status ${response.status}`,
    response.status,
    errors,
  );
}

// --- Newsletter ------------------------------------------------------------------------

export interface NewsletterSignup {
  email: string;
  /** Where the form lives; Klaviyo shows it on the profile, e.g. "Luma storefront footer". */
  source: string;
  /** Custom profile properties, such as the distributor code. */
  properties?: Record<string, string>;
}

/** Body for `POST /client/subscriptions`: email marketing consent plus list membership. */
export function buildSubscriptionRequest(
  { email, source, properties }: NewsletterSignup,
  listId: string,
) {
  return {
    data: {
      type: 'subscription',
      attributes: {
        custom_source: source,
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email,
              ...(properties && Object.keys(properties).length > 0 ? { properties } : {}),
              subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
            },
          },
        },
      },
      relationships: { list: { data: { type: 'list', id: listId } } },
    },
  };
}

/**
 * Subscribes an address to the newsletter list. The list decides between
 * single and double opt-in; with double opt-in Klaviyo emails a confirmation
 * link first.
 */
export async function subscribeToNewsletter(signup: NewsletterSignup): Promise<void> {
  const { listId } = getKlaviyoConfig();
  if (!listId) throw new KlaviyoApiError('The newsletter list is not configured.', 0);
  await postToClientApi('/client/subscriptions', buildSubscriptionRequest(signup, listId));
}

// --- Back in stock -----------------------------------------------------------------------

/** The variant's id in Klaviyo's Shopify catalog: `$shopify:::$default:::<numeric id>`. */
export function toKlaviyoVariantId(shopifyVariantId: string): string {
  return `$shopify:::$default:::${shopifyNumericId(shopifyVariantId)}`;
}

/** Body for `POST /client/back-in-stock-subscriptions`. */
export function buildBackInStockRequest(email: string, shopifyVariantId: string) {
  return {
    data: {
      type: 'back-in-stock-subscription',
      attributes: {
        channels: ['EMAIL'],
        profile: { data: { type: 'profile', attributes: { email } } },
      },
      relationships: {
        variant: {
          data: { type: 'catalog-variant', id: toKlaviyoVariantId(shopifyVariantId) },
        },
      },
    },
  };
}

/**
 * Asks Klaviyo to email this address when the variant is restocked. The email
 * itself comes from a "Back in Stock" flow in the Klaviyo account.
 */
export async function subscribeToBackInStock(
  email: string,
  shopifyVariantId: string,
): Promise<void> {
  await postToClientApi(
    '/client/back-in-stock-subscriptions',
    buildBackInStockRequest(email, shopifyVariantId),
  );
}
