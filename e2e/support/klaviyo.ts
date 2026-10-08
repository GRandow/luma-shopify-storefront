import type { Page } from '@playwright/test';
import { FAKE_KLAVIYO_PATH } from '../fake-klaviyo/constants';

/**
 * Helpers for asserting what the storefront sends to Klaviyo in the
 * end-to-end build. Onsite calls are read from klaviyo.js's queue
 * (`window._klOnsite`), which the stand-in script leaves untouched; client
 * API calls are read from the requests themselves.
 */

/** Every queued klaviyo.js call, e.g. `['track', 'Viewed Product', {...}]`. */
export function klaviyoCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => {
    const queue = (window as unknown as { _klOnsite?: unknown[] })._klOnsite ?? [];
    return (
      queue
        .filter((entry): entry is unknown[] => Array.isArray(entry))
        // Callbacks cannot leave the page; the data around them can.
        .map((entry) => entry.filter((part) => typeof part !== 'function'))
    );
  });
}

/** Properties of the first `track` call for `event`, or `undefined` if there is none yet. */
export async function trackedEvent(page: Page, event: string): Promise<unknown> {
  const calls = await klaviyoCalls(page);
  return calls.find((call) => call[0] === 'track' && call[1] === event)?.[2];
}

/**
 * Resolves with the next client API call to `path` (e.g. `/client/subscriptions`)
 * and the stand-in's answer: 202 when Klaviyo would accept the body. Start it
 * before the action that sends the request.
 */
export async function waitForKlaviyoCall(page: Page, path: string) {
  const response = await page.waitForResponse(
    (candidate) =>
      candidate.request().method() === 'POST' &&
      new URL(candidate.url()).pathname === `${FAKE_KLAVIYO_PATH}${path}`,
  );
  return {
    status: response.status(),
    body: response.request().postDataJSON() as unknown,
    detail: response.status() === 202 ? null : await response.text(),
  };
}
