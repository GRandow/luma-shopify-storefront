import { getKlaviyoScriptUrl, isKlaviyoEnabled } from '@/services/klaviyo/config';

/**
 * Klaviyo's onsite JavaScript (klaviyo.js): "Active on Site", browsing events,
 * identification and Klaviyo-hosted sign-up forms.
 *
 * Calls go through the same stand-in that Klaviyo's install snippet creates: a
 * `window.klaviyo` object whose calls wait in `window._klOnsite` until
 * klaviyo.js loads and replays them. The app can therefore track from its
 * first render while the script itself is only requested once the page has
 * loaded and the browser is idle, off the critical rendering path.
 */

export type KlaviyoCommand = [method: string, ...args: unknown[]];

interface KlaviyoObject {
  push: (...commands: KlaviyoCommand[]) => void;
}

declare global {
  interface Window {
    klaviyo?: KlaviyoObject;
    _klOnsite?: unknown[];
  }
}

const SCRIPT_ID = 'klaviyo-onsite-js';

/** klaviyo.js may swap the queue for its own; always use whatever is current. */
const queue = (): unknown[] => (window._klOnsite ??= []);

/**
 * TypeScript version of Klaviyo's install snippet: `push` appends commands to
 * the queue; any other method queues `[method, ...args, callback]` and returns
 * a promise that settles once klaviyo.js has run it.
 */
function installKlaviyoStub(): KlaviyoObject {
  if (window.klaviyo) return window.klaviyo;
  queue();
  window.klaviyo = new Proxy({} as KlaviyoObject, {
    get(_target, method) {
      // Not part of the API; returning functions here would make the object a thenable.
      if (typeof method !== 'string' || method === 'then') return undefined;
      if (method === 'push') {
        return (...commands: KlaviyoCommand[]) => {
          queue().push(...commands);
        };
      }
      return (...args: unknown[]) => {
        const callback =
          typeof args.at(-1) === 'function' ? (args.pop() as (result: unknown) => void) : undefined;
        return new Promise((resolve) => {
          queue().push([
            method,
            ...args,
            (result: unknown) => {
              callback?.(result);
              resolve(result);
            },
          ]);
        });
      };
    },
  });
  return window.klaviyo;
}

/** Adds klaviyo.js to the page, once. */
export function loadKlaviyoScript(): void {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = getKlaviyoScriptUrl();
  document.head.append(script);
}

/**
 * klaviyo.js picks the protocol of its API calls from the page. Over http,
 * a.klaviyo.com answers with a redirect to https, which browsers refuse for
 * these cross-origin (preflighted) requests, so identify and every event fail.
 */
export const HTTP_PAGE_WARNING =
  'Klaviyo onsite tracking needs HTTPS. On an http page klaviyo.js calls http://a.klaviyo.com, ' +
  'the browser blocks the redirect to https, and identify and events never reach Klaviyo. ' +
  'Run `npm run dev:https` to test it locally.';

/**
 * Starts onsite tracking: the queue right away, klaviyo.js after the page has
 * loaded and the browser has a quiet moment. Does nothing without a key.
 */
export function startKlaviyo(): void {
  if (!isKlaviyoEnabled()) return;
  if (import.meta.env.DEV && window.location.protocol === 'http:') {
    console.warn(HTTP_PAGE_WARNING);
  }
  installKlaviyoStub();

  const loadWhenIdle = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadKlaviyoScript, { timeout: 4000 });
    } else {
      setTimeout(loadKlaviyoScript, 0);
    }
  };
  if (document.readyState === 'complete') loadWhenIdle();
  else window.addEventListener('load', loadWhenIdle, { once: true });
}

function push(command: KlaviyoCommand): void {
  if (!isKlaviyoEnabled()) return;
  installKlaviyoStub().push(command);
}

export interface KlaviyoIdentity {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Ties this browser to a Klaviyo profile (klaviyo.js keeps it in a cookie), so
 * later events such as "Added to Cart" reach the right person.
 */
export function identifyShopper({ email, firstName, lastName }: KlaviyoIdentity): void {
  push([
    'identify',
    {
      email,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
    },
  ]);
}

export function trackEvent(event: string, properties: Record<string, unknown>): void {
  push(['track', event, properties]);
}

/** Feeds the profile's "recently viewed items", used by browse-abandonment emails. */
export function trackViewedItem(item: Record<string, unknown>): void {
  push(['trackViewedItem', item]);
}
