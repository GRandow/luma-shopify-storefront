import { describe, expect, it } from 'vitest';
import {
  checkoutSchema,
  customerSchema,
  paymentSchema,
  shippingSchema,
} from '@/features/checkout/checkout-schema';

const validCheckout = {
  customer: {
    email: 'customer@example.com',
    firstName: 'Alex',
    lastName: 'Morgan',
    phone: '+1 555 123 4567',
  },
  shipping: {
    address: '123 Market Street',
    apartment: '',
    city: 'Portland',
    state: 'Oregon',
    postalCode: '97205',
    country: 'United States',
    shippingMethod: 'standard' as const,
  },
  payment: {
    cardholderName: 'Alex Morgan',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/30',
    cvv: '123',
  },
};

describe('checkout validation', () => {
  it('accepts a complete checkout and normalizes the card number', () => {
    const result = checkoutSchema.parse(validCheckout);
    expect(result.payment.cardNumber).toBe('4242424242424242');
  });

  it('rejects malformed customer contact details', () => {
    expect(customerSchema.safeParse({ ...validCheckout.customer, email: 'invalid' }).success).toBe(
      false,
    );
    expect(customerSchema.safeParse({ ...validCheckout.customer, phone: '123' }).success).toBe(
      false,
    );
  });

  it('requires a complete shipping destination', () => {
    expect(shippingSchema.safeParse({ ...validCheckout.shipping, postalCode: '?' }).success).toBe(
      false,
    );
  });

  it('rejects invalid payment details', () => {
    expect(paymentSchema.safeParse({ ...validCheckout.payment, cardNumber: '1234' }).success).toBe(
      false,
    );
    expect(paymentSchema.safeParse({ ...validCheckout.payment, expiry: '13/20' }).success).toBe(
      false,
    );
  });
});
