import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/features/cart/cart-store';
import { ProductCard } from '@/features/products/components/ProductCard';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { productFixture } from '@/test/fixtures';
import { toProductSnapshot } from '@/types/product';

const product = toProductSnapshot(productFixture);

describe('ProductCard', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ items: [] });
  });

  it('renders accessible product information and destination', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: product.title })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: product.title })).toHaveAttribute('loading', 'lazy');
    expect(screen.getAllByRole('link', { name: product.title })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: product.title })[0]).toHaveAttribute(
      'href',
      `/products/${product.id}`,
    );
  });

  it('adds the product to cart and toggles wishlist', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));

    expect(useCartStore.getState().items[0]).toMatchObject({ id: product.id, quantity: 1 });
    expect(useWishlistStore.getState().items[0]?.id).toBe(product.id);
  });
});
