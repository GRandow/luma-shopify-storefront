import { beforeEach, describe, expect, it } from 'vitest';
import { useCartSession } from '@/features/cart/cart-store';

describe('cart session store', () => {
  beforeEach(() => {
    useCartSession.setState({ cartId: null });
  });

  it('remembers only the Shopify cart id', () => {
    useCartSession.getState().setCartId('gid://shopify/Cart/c1-test?key=abc');

    expect(useCartSession.getState().cartId).toBe('gid://shopify/Cart/c1-test?key=abc');
    expect(JSON.parse(localStorage.getItem('luma-cart') ?? '{}') as unknown).toMatchObject({
      state: { cartId: 'gid://shopify/Cart/c1-test?key=abc' },
      version: 2,
    });
  });

  it('forgets the cart id', () => {
    useCartSession.getState().setCartId('gid://shopify/Cart/c1-test?key=abc');
    useCartSession.getState().setCartId(null);

    expect(useCartSession.getState().cartId).toBeNull();
  });
});
