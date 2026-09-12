import { toCart } from '@/services/storefront/adapters';
import { storefrontRequest } from '@/services/storefront/client';
import {
  CART_CREATE_MUTATION,
  CART_DISCOUNT_CODES_UPDATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from '@/services/storefront/queries';
import type {
  CartCreateData,
  CartDiscountCodesUpdateData,
  CartLinesAddData,
  CartLinesRemoveData,
  CartLinesUpdateData,
  CartMutationPayload,
  CartQueryData,
} from '@/services/storefront/types';
import type { Cart, CartLineInput, CartLineUpdateInput } from '@/types/cart';

/** Raised when Shopify rejects a cart change (e.g. quantity above stock). */
export class CartUserError extends Error {
  constructor(messages: string[]) {
    super(messages.join(' '));
    this.name = 'CartUserError';
  }
}

/**
 * Normalizes a cart mutation payload. Returns `null` when the cart no longer
 * exists (carts expire after ten days of inactivity), so callers can start a
 * fresh one; throws for every other user error.
 */
function unwrapCartPayload(payload: CartMutationPayload): Cart | null {
  if (payload.cart) return toCart(payload.cart);
  const cartMissing = payload.userErrors.some((error) => error.field?.includes('cartId'));
  if (cartMissing) return null;
  throw new CartUserError(
    payload.userErrors.length > 0
      ? payload.userErrors.map((error) => error.message)
      : ['The cart could not be updated.'],
  );
}

export const cartService = {
  async get(cartId: string, signal?: AbortSignal): Promise<Cart | null> {
    const data = await storefrontRequest<CartQueryData, { cartId: string }>(
      CART_QUERY,
      { cartId },
      signal,
    );
    return data.cart ? toCart(data.cart) : null;
  },

  async create(lines: CartLineInput[] = []): Promise<Cart> {
    const data = await storefrontRequest<CartCreateData, { lines: CartLineInput[] }>(
      CART_CREATE_MUTATION,
      { lines },
    );
    const cart = unwrapCartPayload(data.cartCreate);
    if (!cart) throw new CartUserError(['The cart could not be created.']);
    return cart;
  },

  async addLines(cartId: string, lines: CartLineInput[]): Promise<Cart | null> {
    const data = await storefrontRequest<
      CartLinesAddData,
      { cartId: string; lines: CartLineInput[] }
    >(CART_LINES_ADD_MUTATION, { cartId, lines });
    return unwrapCartPayload(data.cartLinesAdd);
  },

  async updateLines(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart | null> {
    const data = await storefrontRequest<
      CartLinesUpdateData,
      { cartId: string; lines: CartLineUpdateInput[] }
    >(CART_LINES_UPDATE_MUTATION, { cartId, lines });
    return unwrapCartPayload(data.cartLinesUpdate);
  },

  async removeLines(cartId: string, lineIds: string[]): Promise<Cart | null> {
    const data = await storefrontRequest<
      CartLinesRemoveData,
      { cartId: string; lineIds: string[] }
    >(CART_LINES_REMOVE_MUTATION, { cartId, lineIds });
    return unwrapCartPayload(data.cartLinesRemove);
  },

  async updateDiscountCodes(cartId: string, discountCodes: string[]): Promise<Cart | null> {
    const data = await storefrontRequest<
      CartDiscountCodesUpdateData,
      { cartId: string; discountCodes: string[] }
    >(CART_DISCOUNT_CODES_UPDATE_MUTATION, { cartId, discountCodes });
    return unwrapCartPayload(data.cartDiscountCodesUpdate);
  },
};
