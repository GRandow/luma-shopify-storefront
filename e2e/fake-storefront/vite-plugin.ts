import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { FAKE_STOREFRONT_PATH } from './constants';
import { renderPlaceholder } from './images';
import { executeOperation, parseRequestBody } from './storefront';

/**
 * Mounts the fake Storefront API on Vite's preview (and dev) server, so the
 * E2E build, its API and its images come from one process on one origin:
 *
 *   POST /__fake-storefront/api            GraphQL operations
 *   GET  /__fake-storefront/images/x.svg   product placeholders
 *   GET  /__fake-storefront/health         readiness probe
 *
 * Only `vite.e2e.config.ts` uses this plugin; the production build never
 * contains it.
 */

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function send(
  response: ServerResponse,
  status: number,
  contentType: string,
  body: string,
  extraHeaders: Record<string, string> = {},
): void {
  response.statusCode = status;
  response.setHeader('Content-Type', contentType);
  response.setHeader('Cache-Control', 'no-store');
  for (const [name, value] of Object.entries(extraHeaders)) response.setHeader(name, value);
  response.end(body);
}

const middleware: Connect.NextHandleFunction = (request, response, next) => {
  const url = new URL(request.url ?? '/', 'http://fake.local');

  if (url.pathname === '/health') {
    send(response, 200, 'text/plain; charset=utf-8', 'ok');
    return;
  }

  const imageMatch = /^\/images\/([^/]+)\.svg$/.exec(url.pathname);
  if (imageMatch && request.method === 'GET') {
    const svg = renderPlaceholder(imageMatch[1] ?? '');
    if (svg) {
      // Placeholders never change, so they cache like CDN images would.
      send(response, 200, 'image/svg+xml', svg, {
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
    } else {
      send(response, 404, 'text/plain; charset=utf-8', 'Not found');
    }
    return;
  }

  if (url.pathname === '/api' && request.method === 'POST') {
    readBody(request)
      .then((raw) => {
        const body = parseRequestBody(raw);
        if (!body) {
          send(
            response,
            400,
            'application/json',
            JSON.stringify({ errors: [{ message: 'Bad request' }] }),
          );
          return;
        }
        send(response, 200, 'application/json', JSON.stringify(executeOperation(body)));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        send(response, 500, 'application/json', JSON.stringify({ errors: [{ message }] }));
      });
    return;
  }

  next();
};

export function fakeStorefront(): Plugin {
  return {
    name: 'luma:fake-storefront',
    configureServer(server) {
      server.middlewares.use(FAKE_STOREFRONT_PATH, middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(FAKE_STOREFRONT_PATH, middleware);
    },
  };
}
