import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSnapshot } from '@/types/product';
import type { ShippingOption } from '@/utils/pricing';

export interface CartItem extends ProductSnapshot {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  shippingOption: ShippingOption;
  addItem: (product: ProductSnapshot, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setPromoCode: (code: string | null) => void;
  setShippingOption: (option: ShippingOption) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promoCode: null,
      shippingOption: 'standard',
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
                  : item,
              ),
            };
          }
          return {
            items: [...state.items, { ...product, quantity: Math.min(quantity, product.stock) }],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.id !== productId)
              : state.items.map((item) =>
                  item.id === productId
                    ? { ...item, quantity: Math.min(quantity, item.stock) }
                    : item,
                ),
        })),
      setPromoCode: (promoCode) => set({ promoCode }),
      setShippingOption: (shippingOption) => set({ shippingOption }),
      clearCart: () => set({ items: [], promoCode: null, shippingOption: 'standard' }),
    }),
    { name: 'luma-cart', version: 1 },
  ),
);

export const selectCartCount = (state: CartState) =>
  state.items.reduce((count, item) => count + item.quantity, 0);
