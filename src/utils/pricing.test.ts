import { describe, expect, it } from 'vitest';
import { calculatePriceSummary, calculateShipping, roundCurrency } from '@/utils/pricing';

const cost = (subtotal: number, total: number) => ({
  cost: {
    subtotal: { amount: subtotal, currencyCode: 'CAD' },
    total: { amount: total, currencyCode: 'CAD' },
    tax: null,
  },
});

describe('price calculations', () => {
  it('rounds to cents without floating point drift', () => {
    expect(roundCurrency(19.99 * 3)).toBe(59.97);
    expect(roundCurrency(1.005)).toBe(1.01);
  });

  it('waives standard shipping after the threshold but not express shipping', () => {
    expect(calculateShipping(100, 'standard')).toBe(0);
    expect(calculateShipping(99.99, 'standard')).toBe(8);
    expect(calculateShipping(100, 'express')).toBe(18);
  });

  it('derives the discount from Shopify totals and adds the shipping estimate', () => {
    expect(calculatePriceSummary(cost(200, 160), 'express')).toEqual({
      subtotal: { amount: 200, currencyCode: 'CAD' },
      discount: { amount: 40, currencyCode: 'CAD' },
      shipping: { amount: 18, currencyCode: 'CAD' },
      total: { amount: 178, currencyCode: 'CAD' },
    });
  });

  it('never reports a negative discount', () => {
    expect(calculatePriceSummary(cost(50, 50), 'standard').discount.amount).toBe(0);
  });
});
