import type { Page, Request } from '@playwright/test';
import { FAKE_STOREFRONT_API } from '../fake-storefront/constants';
import { operationName, parseRequestBody } from '../fake-storefront/storefront';

/**
 * Helpers to observe and break the traffic between the storefront and the
 * (fake) Storefront API from inside a test. They work at the browser level,
 * so each test only affects its own page.
 */

export interface StorefrontCall {
  operation: string;
  variables: Record<string, unknown>;
}

export function readStorefrontCall(request: Request): StorefrontCall | null {
  if (request.method() !== 'POST' || new URL(request.url()).pathname !== FAKE_STOREFRONT_API) {
    return null;
  }
  const body = parseRequestBody(request.postData() ?? '');
  const operation = body ? operationName(body.query) : null;
  return body && operation ? { operation, variables: body.variables } : null;
}

/**
 * Resolves with the next call to `operation` whose variables pass `matches`.
 * Start waiting before the action that sends it.
 */
export async function waitForStorefrontCall(
  page: Page,
  operation: string,
  matches: (variables: Record<string, unknown>) => boolean = () => true,
): Promise<StorefrontCall> {
  const request = await page.waitForRequest((candidate) => {
    const call = readStorefrontCall(candidate);
    return call?.operation === operation && matches(call.variables);
  });
  const call = readStorefrontCall(request);
  if (!call) throw new Error(`Unreadable ${operation} request`);
  return call;
}

/** The first `times` calls to `operation` answer with HTTP `status`; later calls go through. */
export async function failStorefrontCalls(
  page: Page,
  operation: string,
  { status = 503, times = 1 }: { status?: number; times?: number } = {},
): Promise<void> {
  let remaining = times;
  await page.route(`**${FAKE_STOREFRONT_API}`, async (route) => {
    if (readStorefrontCall(route.request())?.operation === operation && remaining > 0) {
      remaining -= 1;
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Service unavailable' }] }),
      });
      return;
    }
    await route.fallback();
  });
}

/** The `ref` cart attribute in a cart mutation's variables, if any. */
export function referralAttribute(variables: Record<string, unknown>): string | null {
  const attributes = variables.attributes;
  if (!Array.isArray(attributes)) return null;
  for (const attribute of attributes as unknown[]) {
    if (
      typeof attribute === 'object' &&
      attribute !== null &&
      'key' in attribute &&
      'value' in attribute &&
      attribute.key === 'ref' &&
      typeof attribute.value === 'string'
    ) {
      return attribute.value;
    }
  }
  return null;
}
