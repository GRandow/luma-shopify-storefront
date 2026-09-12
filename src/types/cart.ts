import type { Money, ProductSnapshot, SelectedOption, StorefrontImage } from '@/types/product';

/** The product variant a cart line refers to (Storefront API "merchandise"). */
export interface CartLineMerchandise {
  /** Variant id (`gid://shopify/ProductVariant/…`). */
  id: string;
  /** Variant title, e.g. "Medium / Ocean" or "Default Title". */
  title: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
  image: StorefrontImage | null;
  product: {
    id: string;
    handle: string;
    title: string;
    vendor: string;
  };
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: CartLineMerchandise;
  cost: {
    total: Money;
    perQuantity: Money;
    compareAtPerQuantity: Money | null;
  };
}

export interface CartDiscountCode {
  code: string;
  applicable: boolean;
}

export interface Cart {
  id: string;
  /** Shopify-hosted checkout for this cart. */
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  discountCodes: CartDiscountCode[];
  cost: {
    subtotal: Money;
    total: Money;
    /** `null` until the cart has enough context (address) for Shopify to estimate tax. */
    tax: Money | null;
  };
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

export interface CartLineUpdateInput {
  id: string;
  quantity: number;
}

const DEFAULT_VARIANT_TITLE = 'Default Title';

/** Human-readable variant title, hiding Shopify's placeholder for option-less products. */
export function getLineVariantTitle(line: Pick<CartLine, 'merchandise'>): string | null {
  return line.merchandise.title === DEFAULT_VARIANT_TITLE ? null : line.merchandise.title;
}

/** Total discount applied to the cart (difference between subtotal and total, never negative). */
export function getCartDiscount(cart: Pick<Cart, 'cost'>): Money {
  return {
    amount: Math.max(0, cart.cost.subtotal.amount - cart.cost.total.amount),
    currencyCode: cart.cost.total.currencyCode,
  };
}

/** Builds a product snapshot from a cart line, e.g. for "recently purchased" lists. */
export function cartLineToProductSnapshot(line: CartLine): ProductSnapshot {
  return {
    id: line.merchandise.product.id,
    handle: line.merchandise.product.handle,
    title: line.merchandise.product.title,
    vendor: line.merchandise.product.vendor,
    price: line.merchandise.price,
    compareAtPrice: line.merchandise.compareAtPrice,
    // A line points at one variant, so there is no price range to summarise.
    priceVaries: false,
    image: line.merchandise.image,
    availableForSale: line.merchandise.availableForSale,
    defaultVariantId: line.merchandise.id,
    requiresVariantSelection: false,
    collection: null,
  };
}
