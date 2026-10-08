import { isKlaviyoEnabled } from '@/services/klaviyo/config';
import {
  addedToCartProperties,
  viewedItem,
  viewedProductProperties,
} from '@/services/klaviyo/events';
import { trackEvent, trackViewedItem } from '@/services/klaviyo/onsite';
import type { Cart, CartLineInput } from '@/types/cart';
import type { Product, ProductVariant } from '@/types/product';

/** What the storefront reports to Klaviyo. Each call is a no-op without a key. */

export function trackViewedProduct(product: Product, variant: ProductVariant | undefined): void {
  if (!isKlaviyoEnabled()) return;
  trackEvent('Viewed Product', viewedProductProperties(product, variant));
  trackViewedItem(viewedItem(product, variant));
}

/** One "Added to Cart" per added line (the wishlist can add several at once). */
export function trackAddedToCart(cart: Cart, addedLines: CartLineInput[]): void {
  if (!isKlaviyoEnabled()) return;
  for (const added of addedLines) {
    const properties = addedToCartProperties(cart, added);
    if (properties) trackEvent('Added to Cart', properties);
  }
}
