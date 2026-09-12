import { getCartDiscount, type Cart } from '@/types/cart';
import type { Money } from '@/types/product';

/**
 * Pricing for the demo checkout page. Line prices, discounts and the cart
 * total come from Shopify; only the shipping estimate is local, because a
 * real store computes shipping and taxes inside Shopify's checkout.
 */

export const FREE_SHIPPING_THRESHOLD = 100;

export type ShippingOption = 'standard' | 'express';

const shippingRates: Record<ShippingOption, number> = {
  standard: 8,
  express: 18,
};

export interface PriceSummary {
  subtotal: Money;
  discount: Money;
  shipping: Money;
  total: Money;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateShipping(discountedSubtotal: number, option: ShippingOption): number {
  if (option === 'standard' && discountedSubtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return shippingRates[option];
}

export function calculatePriceSummary(
  cart: Pick<Cart, 'cost'>,
  shippingOption: ShippingOption,
): PriceSummary {
  const { currencyCode } = cart.cost.total;
  const discount = getCartDiscount(cart);
  const shipping = calculateShipping(cart.cost.total.amount, shippingOption);

  return {
    subtotal: cart.cost.subtotal,
    discount,
    shipping: { amount: shipping, currencyCode },
    total: { amount: roundCurrency(cart.cost.total.amount + shipping), currencyCode },
  };
}
