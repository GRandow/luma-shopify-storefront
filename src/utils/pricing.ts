export const TAX_RATE = 0.0825;
export const FREE_SHIPPING_THRESHOLD = 100;

export interface PriceableItem {
  price: number;
  quantity: number;
}

export interface PriceSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export type ShippingOption = 'standard' | 'express' | 'pickup';

const shippingRates: Record<ShippingOption, number> = {
  standard: 8,
  express: 18,
  pickup: 0,
};

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSubtotal(items: PriceableItem[]): number {
  return roundCurrency(items.reduce((total, item) => total + item.price * item.quantity, 0));
}

export function calculateDiscount(subtotal: number, promoCode: string | null): number {
  if (promoCode?.toUpperCase() === 'WELCOME10') return roundCurrency(subtotal * 0.1);
  if (promoCode?.toUpperCase() === 'LUMA20' && subtotal >= 150) {
    return roundCurrency(subtotal * 0.2);
  }
  return 0;
}

export function calculateShipping(discountedSubtotal: number, option: ShippingOption): number {
  if (option === 'standard' && discountedSubtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return shippingRates[option];
}

export function calculatePriceSummary(
  items: PriceableItem[],
  promoCode: string | null,
  shippingOption: ShippingOption,
): PriceSummary {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal, promoCode);
  const discountedSubtotal = subtotal - discount;
  const shipping = calculateShipping(discountedSubtotal, shippingOption);
  const tax = roundCurrency(discountedSubtotal * TAX_RATE);
  const total = roundCurrency(discountedSubtotal + shipping + tax);

  return { subtotal, discount, shipping, tax, total };
}
