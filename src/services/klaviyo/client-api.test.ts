import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  KlaviyoApiError,
  subscribeToBackInStock,
  subscribeToNewsletter,
  toKlaviyoVariantId,
} from '@/services/klaviyo/client-api';
import { KLAVIYO_API_REVISION } from '@/services/klaviyo/config';

const fetchMock = vi.fn<typeof fetch>();

function lastRequest() {
  const [url, init] = fetchMock.mock.lastCall ?? [];
  return {
    url: url as string,
    headers: init?.headers as Record<string, string>,
    body: JSON.parse(init?.body as string) as unknown,
  };
}

describe('Klaviyo client API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    vi.stubEnv('VITE_KLAVIYO_LIST_ID', 'NEWS01');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('subscribes an address to the newsletter list with email marketing consent', async () => {
    await subscribeToNewsletter({
      email: 'ana@example.com',
      source: 'Luma storefront footer',
      properties: { referral_code: 'ANA123' },
    });

    const request = lastRequest();
    expect(request.url).toBe('https://a.klaviyo.com/client/subscriptions?company_id=LUMA01');
    expect(request.headers).toMatchObject({
      'Content-Type': 'application/vnd.api+json',
      revision: KLAVIYO_API_REVISION,
    });
    expect(request.body).toEqual({
      data: {
        type: 'subscription',
        attributes: {
          custom_source: 'Luma storefront footer',
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: 'ana@example.com',
                properties: { referral_code: 'ANA123' },
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
              },
            },
          },
        },
        relationships: { list: { data: { type: 'list', id: 'NEWS01' } } },
      },
    });
  });

  it('leaves custom properties out when there are none', async () => {
    await subscribeToNewsletter({ email: 'bo@example.com', source: 'Footer' });
    const attributes = (
      lastRequest().body as {
        data: { attributes: { profile: { data: { attributes: Record<string, unknown> } } } };
      }
    ).data.attributes.profile.data.attributes;
    expect(attributes).not.toHaveProperty('properties');
  });

  it("surfaces Klaviyo's error detail", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          errors: [{ status: 400, code: 'invalid', title: 'Invalid input.', detail: 'Bad email' }],
        },
        { status: 400 },
      ),
    );

    const error = await subscribeToNewsletter({ email: 'x@example.com', source: 'Footer' }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(KlaviyoApiError);
    expect(error).toMatchObject({ status: 400, message: 'Bad email' });
  });

  it('falls back to the status when the error body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Service unavailable', { status: 503 }));
    await expect(
      subscribeToNewsletter({ email: 'x@example.com', source: 'Footer' }),
    ).rejects.toThrow('Klaviyo request failed with status 503');
  });

  it('refuses to subscribe without a list, and without a key', async () => {
    vi.stubEnv('VITE_KLAVIYO_LIST_ID', '');
    await expect(subscribeToNewsletter({ email: 'x@example.com', source: 'F' })).rejects.toThrow(
      'The newsletter list is not configured.',
    );
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', '');
    await expect(
      subscribeToBackInStock('x@example.com', 'gid://shopify/ProductVariant/1'),
    ).rejects.toThrow('Klaviyo is not configured.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers a back-in-stock request against the Shopify catalog variant', async () => {
    await subscribeToBackInStock('ana@example.com', 'gid://shopify/ProductVariant/100603');

    const request = lastRequest();
    expect(request.url).toBe(
      'https://a.klaviyo.com/client/back-in-stock-subscriptions?company_id=LUMA01',
    );
    expect(request.body).toEqual({
      data: {
        type: 'back-in-stock-subscription',
        attributes: {
          channels: ['EMAIL'],
          profile: { data: { type: 'profile', attributes: { email: 'ana@example.com' } } },
        },
        relationships: {
          variant: { data: { type: 'catalog-variant', id: '$shopify:::$default:::100603' } },
        },
      },
    });
  });

  it("maps Shopify variant ids to Klaviyo's catalog ids", () => {
    expect(toKlaviyoVariantId('gid://shopify/ProductVariant/4201')).toBe(
      '$shopify:::$default:::4201',
    );
  });

  it('can be pointed at another base URL (the end-to-end stand-in)', async () => {
    vi.stubEnv('VITE_KLAVIYO_API_BASE', '/__fake-klaviyo');
    await subscribeToBackInStock('ana@example.com', 'gid://shopify/ProductVariant/7');
    expect(lastRequest().url).toBe(
      '/__fake-klaviyo/client/back-in-stock-subscriptions?company_id=LUMA01',
    );
  });
});
