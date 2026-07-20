export interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ShippingDetails {
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: 'standard' | 'express';
}

export interface PaymentDetails {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface CheckoutData {
  customer: CustomerDetails;
  shipping: ShippingDetails;
  payment: PaymentDetails;
}
