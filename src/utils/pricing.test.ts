import { describe, expect, it } from 'vitest';
import {
  calculateDiscount,
  calculatePriceSummary,
  calculateShipping,
  calculateSubtotal,
} from '@/utils/pricing';

describe('price calculations', () => {
  it('calculates and rounds a multi-line subtotal', () => {
    expect(
      calculateSubtotal([
        { price: 19.99, quantity: 2 },
        { price: 4.5, quantity: 3 },
      ]),
    ).toBe(53.48);
  });

  it('applies each promo according to its policy', () => {
    expect(calculateDiscount(100, 'welcome10')).toBe(10);
    expect(calculateDiscount(149.99, 'LUMA20')).toBe(0);
    expect(calculateDiscount(200, 'LUMA20')).toBe(40);
  });

  it('waives standard shipping after the threshold but not express shipping', () => {
    expect(calculateShipping(100, 'standard')).toBe(0);
    expect(calculateShipping(100, 'express')).toBe(18);
  });

  it('returns a deterministic order summary', () => {
    expect(calculatePriceSummary([{ price: 100, quantity: 2 }], 'LUMA20', 'standard')).toEqual({
      subtotal: 200,
      discount: 40,
      shipping: 0,
      tax: 13.2,
      total: 173.2,
    });
  });
});
