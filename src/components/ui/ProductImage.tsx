import type { ImgHTMLAttributes } from 'react';
import type { StorefrontImage } from '@/types/product';
import { cn } from '@/utils/cn';
import { buildSrcSet, DEFAULT_IMAGE_WIDTH, resizeImage } from '@/utils/image';

/** Approximate rendered width of a product-grid card (2 → 3 → 4 columns). */
export const PRODUCT_CARD_SIZES = '(min-width: 1280px) 20rem, (min-width: 1024px) 33vw, 50vw';

interface ProductImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'width' | 'height' | 'alt'
> {
  image: StorefrontImage | null;
  /** Overrides the CDN alt text; defaults to it (or an empty string for decorative uses). */
  alt?: string;
  /**
   * How wide the image renders, in `sizes` attribute syntax. Keep it close to
   * reality: the browser multiplies it by the device pixel ratio to choose a
   * rendition from the `srcset` built out of Shopify CDN resizes.
   */
  sizes?: string;
  /** Above-the-fold image: load eagerly with high priority. */
  priority?: boolean;
  /** How the picture fills its box. Product photos are cropped; zoomed views are not. */
  fit?: 'cover' | 'contain';
}

/**
 * Renders a Storefront API image with a responsive `srcset`. Shopify's CDN
 * resizes on request, so the original (often 2000px+) file is never shipped
 * to a 300px card.
 */
export function ProductImage({
  image,
  alt,
  sizes = PRODUCT_CARD_SIZES,
  priority = false,
  fit = 'cover',
  className,
  loading,
  decoding = 'async',
  ...props
}: ProductImageProps) {
  if (!image) {
    return (
      <div
        className={cn('bg-ink-100 dark:bg-ink-800', className)}
        role="img"
        aria-label={alt ?? 'No image available'}
      />
    );
  }

  return (
    <img
      src={resizeImage(image.url, DEFAULT_IMAGE_WIDTH)}
      srcSet={buildSrcSet(image.url)}
      sizes={sizes}
      width={image.width ?? undefined}
      height={image.height ?? undefined}
      alt={alt ?? image.altText ?? ''}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : undefined}
      decoding={decoding}
      className={cn(fit === 'cover' ? 'object-cover' : 'object-contain', className)}
      {...props}
    />
  );
}
