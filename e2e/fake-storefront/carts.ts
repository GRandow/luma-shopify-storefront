import { randomUUID } from 'node:crypto';
import type {
  CartAttributeInput,
  CartMutationPayload,
  CartNode,
  CartUserErrorNode,
} from '../../src/services/storefront/types';
import { findVariant } from './catalog';

/**
 * In-memory carts that behave like the Storefront Cart API in the ways the
 * storefront depends on: lines for the same variant merge, a quantity of 0
 * removes a line, attributes are replaced as a whole, and an unknown cart id
 * answers with a `cartId` user error (how Shopify reports an expired cart).
 */

interface LineState {
  id: string;
  merchandiseId: string;
  quantity: number;
}

interface CartState {
  id: string;
  token: string;
  lines: LineState[];
  attributes: CartAttributeInput[];
  discountCodes: string[];
}

export interface LineInput {
  merchandiseId: string;
  quantity: number;
}

export interface LineUpdateInput {
  id: string;
  quantity: number;
}

/** The storefront's promotion: 20% off orders of $150 or more. */
const PROMOTION = { code: 'LUMA20', minimumSubtotal: 150, rate: 0.2 };

const carts = new Map<string, CartState>();

function cents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

function amount(valueInCents: number) {
  return { amount: (valueInCents / 100).toFixed(2), currencyCode: 'USD' };
}

function missingCart(): CartMutationPayload {
  return {
    cart: null,
    userErrors: [
      { field: ['cartId'], message: 'The specified cart does not exist.', code: 'INVALID' },
    ],
  };
}

function lineErrors(lines: LineInput[]): CartUserErrorNode[] {
  return lines.flatMap((line, index): CartUserErrorNode[] => {
    const match = findVariant(line.merchandiseId);
    if (!match) {
      return [
        {
          field: ['lines', String(index), 'merchandiseId'],
          message: 'The merchandise with id does not exist.',
          code: 'INVALID',
        },
      ];
    }
    if (!match.variant.availableForSale) {
      return [
        {
          field: ['lines', String(index), 'merchandiseId'],
          message: `${match.product.title} is sold out.`,
          code: 'MERCHANDISE_OUT_OF_STOCK',
        },
      ];
    }
    return [];
  });
}

/** Stock is enforced the way a "deny" inventory policy does: quantities are capped. */
function capToStock(merchandiseId: string, quantity: number): number {
  const stock = findVariant(merchandiseId)?.variant.quantityAvailable;
  return stock === null || stock === undefined ? quantity : Math.min(quantity, stock);
}

function addToState(cart: CartState, lines: LineInput[]): void {
  for (const line of lines) {
    const existing = cart.lines.find((entry) => entry.merchandiseId === line.merchandiseId);
    if (existing) {
      existing.quantity = capToStock(line.merchandiseId, existing.quantity + line.quantity);
    } else {
      cart.lines.push({
        id: `gid://shopify/CartLine/${randomUUID()}?cart=${cart.token}`,
        merchandiseId: line.merchandiseId,
        quantity: capToStock(line.merchandiseId, line.quantity),
      });
    }
  }
}

export function toCartNode(cart: CartState): CartNode {
  const lines = cart.lines.flatMap((line) => {
    const match = findVariant(line.merchandiseId);
    if (!match) return [];
    const { product, variant } = match;
    const unit = cents(variant.price.amount);
    return [
      {
        id: line.id,
        quantity: line.quantity,
        cost: {
          totalAmount: amount(unit * line.quantity),
          amountPerQuantity: amount(unit),
          compareAtAmountPerQuantity: variant.compareAtPrice
            ? amount(cents(variant.compareAtPrice.amount))
            : null,
        },
        merchandise: {
          ...variant,
          product: {
            id: product.id,
            handle: product.handle,
            title: product.title,
            vendor: product.vendor,
          },
        },
      },
    ];
  });

  const subtotal = lines.reduce((sum, line) => sum + cents(line.cost.totalAmount.amount), 0);
  const promotionApplies =
    cart.discountCodes.includes(PROMOTION.code) && subtotal >= PROMOTION.minimumSubtotal * 100;
  const total = promotionApplies ? Math.round(subtotal * (1 - PROMOTION.rate)) : subtotal;

  return {
    id: cart.id,
    checkoutUrl: `https://luma-e2e.myshopify.com/cart/c/${cart.token}`,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    attributes: cart.attributes.map(({ key, value }) => ({ key, value })),
    discountCodes: cart.discountCodes.map((code) => ({
      code,
      applicable: code === PROMOTION.code && promotionApplies,
    })),
    cost: { subtotalAmount: amount(subtotal), totalAmount: amount(total), totalTaxAmount: null },
    lines: { nodes: lines },
  };
}

function payload(cart: CartState): CartMutationPayload {
  return { cart: toCartNode(cart), userErrors: [] };
}

export function getCart(cartId: string): CartNode | null {
  const cart = carts.get(cartId);
  return cart ? toCartNode(cart) : null;
}

export function createCart(
  lines: LineInput[],
  attributes: CartAttributeInput[],
): CartMutationPayload {
  const userErrors = lineErrors(lines);
  if (userErrors.length > 0) return { cart: null, userErrors };

  const token = randomUUID().replace(/-/g, '');
  const cart: CartState = {
    id: `gid://shopify/Cart/${token}?key=${randomUUID().slice(0, 8)}`,
    token,
    lines: [],
    attributes: [...attributes],
    discountCodes: [],
  };
  addToState(cart, lines);
  carts.set(cart.id, cart);
  return payload(cart);
}

export function addLines(cartId: string, lines: LineInput[]): CartMutationPayload {
  const cart = carts.get(cartId);
  if (!cart) return missingCart();
  const userErrors = lineErrors(lines);
  if (userErrors.length > 0) return { cart: null, userErrors };
  addToState(cart, lines);
  return payload(cart);
}

export function updateLines(cartId: string, updates: LineUpdateInput[]): CartMutationPayload {
  const cart = carts.get(cartId);
  if (!cart) return missingCart();
  for (const update of updates) {
    const line = cart.lines.find((entry) => entry.id === update.id);
    if (!line) continue;
    line.quantity = capToStock(line.merchandiseId, update.quantity);
  }
  cart.lines = cart.lines.filter((line) => line.quantity > 0);
  return payload(cart);
}

export function removeLines(cartId: string, lineIds: string[]): CartMutationPayload {
  const cart = carts.get(cartId);
  if (!cart) return missingCart();
  cart.lines = cart.lines.filter((line) => !lineIds.includes(line.id));
  return payload(cart);
}

export function updateAttributes(
  cartId: string,
  attributes: CartAttributeInput[],
): CartMutationPayload {
  const cart = carts.get(cartId);
  if (!cart) return missingCart();
  cart.attributes = [...attributes];
  return payload(cart);
}

export function updateDiscountCodes(cartId: string, codes: string[]): CartMutationPayload {
  const cart = carts.get(cartId);
  if (!cart) return missingCart();
  cart.discountCodes = codes.map((code) => code.trim().toUpperCase()).filter(Boolean);
  return payload(cart);
}

/** Buyer identity has no visible effect on a fake cart; the cart is returned as is. */
export function touchCart(cartId: string): CartMutationPayload {
  const cart = carts.get(cartId);
  return cart ? payload(cart) : missingCart();
}
