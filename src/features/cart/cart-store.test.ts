import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/features/cart/cart-store';
import { productFixture } from '@/test/fixtures';
import { toProductSnapshot } from '@/types/product';

const product = toProductSnapshot(productFixture);

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], promoCode: null, shippingOption: 'standard' });
  });

  it('adds a product and merges repeated additions', () => {
    useCartStore.getState().addItem(product, 2);
    useCartStore.getState().addItem(product, 3);

    expect(useCartStore.getState().items).toEqual([{ ...product, quantity: 5 }]);
  });

  it('never increases quantity beyond available stock', () => {
    useCartStore.getState().addItem(product, product.stock + 10);
    useCartStore.getState().updateQuantity(product.id, product.stock + 1);

    expect(useCartStore.getState().items[0]?.quantity).toBe(product.stock);
  });

  it('removes an item when quantity is set to zero', () => {
    useCartStore.getState().addItem(product);
    useCartStore.getState().updateQuantity(product.id, 0);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clears transactional cart state after checkout', () => {
    useCartStore.getState().addItem(product);
    useCartStore.getState().setPromoCode('WELCOME10');
    useCartStore.getState().setShippingOption('express');
    useCartStore.getState().clearCart();

    expect(useCartStore.getState()).toMatchObject({
      items: [],
      promoCode: null,
      shippingOption: 'standard',
    });
  });
});
