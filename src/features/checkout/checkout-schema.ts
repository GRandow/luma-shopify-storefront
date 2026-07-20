import { z } from 'zod';

export const customerSchema = z.object({
  email: z.email('Enter a valid email address'),
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{8,20}$/, 'Enter a valid phone number'),
});

export const shippingSchema = z.object({
  address: z.string().trim().min(5, 'Enter a complete street address'),
  apartment: z.string().trim().max(40, 'Apartment details are too long').optional(),
  city: z.string().trim().min(2, 'Enter a city'),
  state: z.string().trim().min(2, 'Enter a state or region'),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{4,10}$/, 'Enter a valid postal code'),
  country: z.string().trim().min(2, 'Select a country'),
  shippingMethod: z.enum(['standard', 'express']),
});

export const paymentSchema = z.object({
  cardholderName: z.string().trim().min(3, 'Enter the name shown on the card'),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{16}$/, 'Enter a 16-digit test card number')),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
  cvv: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, 'Enter a valid security code'),
});

export const checkoutSchema = z.object({
  customer: customerSchema,
  shipping: shippingSchema,
  payment: paymentSchema,
});

export type CheckoutFormValues = z.input<typeof checkoutSchema>;
