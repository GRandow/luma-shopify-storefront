import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import {
  HTTP_PAGE_WARNING,
  identifyShopper,
  loadKlaviyoScript,
  startKlaviyo,
  trackEvent,
} from '@/services/klaviyo/onsite';

const scriptTags = () => document.querySelectorAll<HTMLScriptElement>('script[src*="klaviyo.js"]');

function resetKlaviyo() {
  delete window.klaviyo;
  delete window._klOnsite;
  scriptTags().forEach((script) => script.remove());
}

describe('Klaviyo onsite JavaScript', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    resetKlaviyo();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetKlaviyo();
  });

  it('does nothing at all without a public key', () => {
    startKlaviyo();
    trackEvent('Viewed Product', { ProductName: 'Mug' });
    identifyShopper({ email: 'ana@example.com' });

    expect(window.klaviyo).toBeUndefined();
    expect(window._klOnsite).toBeUndefined();
    expect(scriptTags()).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns during development that onsite tracking needs an https page', () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    startKlaviyo(); // the test page is http://localhost

    expect(warn).toHaveBeenCalledExactlyOnceWith(HTTP_PAGE_WARNING);
    expect(HTTP_PAGE_WARNING).toContain('npm run dev:https');
  });

  it('queues calls until klaviyo.js loads, the way its install snippet does', () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');

    identifyShopper({ email: 'ana@example.com', firstName: 'Ana', lastName: null });
    trackEvent('Added to Cart', { $value: 28 });

    expect(window._klOnsite).toEqual([
      ['identify', { email: 'ana@example.com', first_name: 'Ana' }],
      ['track', 'Added to Cart', { $value: 28 }],
    ]);
  });

  it('gives other methods a promise that settles when klaviyo.js answers', async () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    startKlaviyo();

    const stub = window.klaviyo as unknown as { isIdentified: () => Promise<boolean> };
    const answer = stub.isIdentified();
    const queued = window._klOnsite?.at(-1) as [string, (result: boolean) => void];
    expect(queued[0]).toBe('isIdentified');
    queued[1](true); // what klaviyo.js does when it replays the call
    await expect(answer).resolves.toBe(true);
    // Never a thenable, so it can be passed around safely.
    expect((window.klaviyo as unknown as { then?: unknown }).then).toBeUndefined();
  });

  it('loads klaviyo.js once, for the configured account', () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    loadKlaviyoScript();
    loadKlaviyoScript();

    const scripts = scriptTags();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.async).toBe(true);
    expect(scripts[0]?.src).toBe(
      'https://static.klaviyo.com/onsite/js/LUMA01/klaviyo.js?company_id=LUMA01',
    );
  });

  it('waits for the page to be idle before requesting the script', () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    vi.useFakeTimers();
    const idle = vi.fn<(callback: IdleRequestCallback) => number>(() => 1);
    vi.stubGlobal('requestIdleCallback', idle);

    startKlaviyo(); // jsdom reports the document as already loaded

    expect(scriptTags()).toHaveLength(0);
    expect(idle).toHaveBeenCalledOnce();
    idle.mock.calls[0]?.[0]({ didTimeout: false, timeRemaining: () => 50 });
    expect(scriptTags()).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});
