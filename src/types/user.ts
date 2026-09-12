import type { Money, StorefrontImage } from '@/types/product';

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserDetails {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  phone: string;
  birthDate: string;
  address: {
    address: string;
    city: string;
    state: string;
    stateCode: string;
    postalCode: string;
    country: string;
  };
  company: {
    department: string;
    name: string;
    title: string;
  };
}

/** A purchased cart line, frozen at order time. */
export interface OrderItem {
  id: string;
  variantId: string;
  handle: string;
  title: string;
  variantTitle: string | null;
  image: StorefrontImage | null;
  price: Money;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  items: OrderItem[];
  total: Money;
  shippingAddress: Address;
}
