import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { FAKE_KLAVIYO_PATH, FAKE_KLAVIYO_PUBLIC_KEY } from './constants';
import { checkBackInStock, checkSubscription } from './requests';

/**
 * A stand-in for Klaviyo on Vite's preview (and dev) server, next to the fake
 * Storefront API, so the end-to-end build and Lighthouse never reach the
 * network:
 *
 *   GET  /__fake-klaviyo/onsite/js/<key>/klaviyo.js        onsite script
 *   POST /__fake-klaviyo/client/subscriptions              newsletter
 *   POST /__fake-klaviyo/client/back-in-stock-subscriptions
 *
 * The script deliberately leaves the call queue alone, so tests can read what
 * the storefront tracked from `window._klOnsite`. The client endpoints check
 * the key, headers and body shape the way Klaviyo does, then answer 202.
 */

const FAKE_SCRIPT = `/* Stand-in for klaviyo.js (end-to-end build). Tracked calls stay queued in window._klOnsite. */
window.__fakeKlaviyoLoaded = true;
`;

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function reply(response: ServerResponse, status: number, detail?: string): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  if (!detail) {
    response.end();
    return;
  }
  response.setHeader('Content-Type', 'application/vnd.api+json');
  response.end(
    JSON.stringify({ errors: [{ status, code: 'invalid', title: 'Invalid input.', detail }] }),
  );
}

const CLIENT_ENDPOINTS: Record<string, (body: unknown) => string | null> = {
  '/client/subscriptions': checkSubscription,
  '/client/back-in-stock-subscriptions': checkBackInStock,
};

const middleware: Connect.NextHandleFunction = (request, response, next) => {
  const url = new URL(request.url ?? '/', 'http://fake.local');

  if (request.method === 'GET' && /^\/onsite\/js\/[^/]+\/klaviyo\.js$/.test(url.pathname)) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(FAKE_SCRIPT);
    return;
  }

  const check = CLIENT_ENDPOINTS[url.pathname];
  if (!check || request.method !== 'POST') {
    next();
    return;
  }

  if (url.searchParams.get('company_id') !== FAKE_KLAVIYO_PUBLIC_KEY) {
    reply(response, 400, 'company_id must be the public API key');
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(request.headers.revision ?? ''))) {
    reply(response, 400, 'The revision header is required');
    return;
  }
  if (!String(request.headers['content-type'] ?? '').includes('application/vnd.api+json')) {
    reply(response, 415, 'Content-Type must be application/vnd.api+json');
    return;
  }

  readBody(request)
    .then((raw) => {
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        reply(response, 400, 'The body is not valid JSON');
        return;
      }
      const problem = check(body);
      if (problem) reply(response, 400, problem);
      else reply(response, 202);
    })
    .catch(() => reply(response, 500, 'The request could not be read'));
};

export function fakeKlaviyo(): Plugin {
  return {
    name: 'luma:fake-klaviyo',
    configureServer(server) {
      server.middlewares.use(FAKE_KLAVIYO_PATH, middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(FAKE_KLAVIYO_PATH, middleware);
    },
  };
}
