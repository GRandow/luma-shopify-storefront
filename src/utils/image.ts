/**
 * Shopify's CDN resizes images on the fly through `width`/`height` query
 * parameters, so one source URL can feed a whole `srcset`.
 */

export const IMAGE_WIDTHS = [320, 640, 960, 1280] as const;

/** Width requested by the plain `src`, for browsers that ignore `srcset`. */
export const DEFAULT_IMAGE_WIDTH = 960;

const SHOPIFY_CDN_HOSTS = ['cdn.shopify.com', 'shopify.com'];

function parseShopifyCdnUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    const resizable = SHOPIFY_CDN_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
    return resizable ? parsed : null;
  } catch {
    return null;
  }
}

export function isResizableImage(url: string): boolean {
  return parseShopifyCdnUrl(url) !== null;
}

/** Returns the URL of a resized rendition, or the original URL for non-Shopify hosts. */
export function resizeImage(url: string, width: number): string {
  const parsed = parseShopifyCdnUrl(url);
  if (!parsed) return url;
  parsed.searchParams.set('width', String(width));
  return parsed.toString();
}

/** Commas and whitespace are separators inside `srcset`; escape them just in case. */
function toCandidate(url: string, width: number): string {
  return `${url.replace(/[\s,]/g, encodeURIComponent)} ${width}w`;
}

/** A `srcset` of CDN renditions, or `undefined` when the host cannot resize. */
export function buildSrcSet(
  url: string,
  widths: readonly number[] = IMAGE_WIDTHS,
): string | undefined {
  if (!isResizableImage(url)) return undefined;
  return widths.map((width) => toCandidate(resizeImage(url, width), width)).join(', ');
}
