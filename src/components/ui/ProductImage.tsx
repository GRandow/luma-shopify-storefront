import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

/**
 * DummyJSON serves two fixed sizes per product: `thumbnail.webp` (300×300)
 * and `images[n]` (1000×1000). Rendering the thumbnail anywhere larger than
 * ~150 CSS px (300 device px on a 2× screen) is what made the store look
 * blurry, so every product picture goes through this component and lets the
 * browser choose the right file from a `srcset`.
 */
export const THUMBNAIL_WIDTH = 300;
export const IMAGE_WIDTH = 1000;

/** Approximate rendered width of a product-grid card (2 → 3 → 4 columns). */
export const PRODUCT_CARD_SIZES = '(min-width: 1280px) 20rem, (min-width: 1024px) 33vw, 50vw';

interface ProductImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height'> {
  /** Best available source — the 1000px photo when we have it. */
  src: string;
  /** Optional 300px variant; lets the browser pick the lighter file for small renders. */
  thumbnail?: string | undefined;
  /**
   * How wide the image renders, in `sizes` attribute syntax. Keep it close to
   * reality: the browser multiplies it by the device pixel ratio to choose
   * between the 300px and 1000px files.
   */
  sizes?: string;
  /** Above-the-fold image: load eagerly with high priority. */
  priority?: boolean;
}

/** Commas and whitespace are separators inside `srcset`; escape them just in case. */
function toCandidate(url: string, width: number) {
  return `${url.replace(/[\s,]/g, encodeURIComponent)} ${width}w`;
}

export function ProductImage({
  src,
  thumbnail,
  sizes = PRODUCT_CARD_SIZES,
  priority = false,
  alt = '',
  className,
  loading,
  decoding = 'async',
  ...props
}: ProductImageProps) {
  const small = thumbnail && thumbnail !== src ? thumbnail : undefined;
  const srcSet = small
    ? `${toCandidate(small, THUMBNAIL_WIDTH)}, ${toCandidate(src, IMAGE_WIDTH)}`
    : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={IMAGE_WIDTH}
      height={IMAGE_WIDTH}
      alt={alt}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : undefined}
      decoding={decoding}
      className={cn('object-contain', className)}
      {...props}
    />
  );
}
