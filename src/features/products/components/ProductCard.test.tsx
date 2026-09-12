import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartDrawer } from '@/features/cart/cart-drawer-store';
import { useCartSession } from '@/features/cart/cart-store';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { ProductCard } from '@/features/products/components/ProductCard';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { storefrontRequest } from '@/services/storefront/client';
import { productFixture, rawCartFixture, simpleProductFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { toProductSnapshot } from '@/types/product';

vi.mock('@/services/storefront/client', () => ({
  storefrontRequest: vi.fn(),
  isMockShop: () => true,
}));

const simpleProduct = toProductSnapshot(simpleProductFixture);
const productWithOptions = toProductSnapshot(productFixture);

describe('ProductCard', () => {
  beforeEach(() => {
    vi.mocked(storefrontRequest).mockReset();
    useCartSession.setState({ cartId: null });
    useCartDrawer.setState({ isOpen: false });
    useWishlistStore.setState({ items: [] });
    useDiscoveryStore.setState({ quickViewHandle: null, compareItems: [] });
  });

  it('renders accessible product information and destination', () => {
    renderWithProviders(<ProductCard product={simpleProduct} />);

    expect(screen.getByRole('heading', { name: simpleProduct.title })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: simpleProduct.title })).toHaveAttribute(
      'loading',
      'lazy',
    );
    expect(screen.getAllByRole('link', { name: simpleProduct.title })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: simpleProduct.title })[0]).toHaveAttribute(
      'href',
      `/products/${simpleProduct.handle}`,
    );
  });

  it('creates a Shopify cart with the default variant, opens the bag and toggles the wishlist', async () => {
    vi.mocked(storefrontRequest).mockResolvedValueOnce({
      cartCreate: { cart: rawCartFixture, userErrors: [] },
    });
    renderWithProviders(<ProductCard product={simpleProduct} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));

    await waitFor(() => expect(useCartSession.getState().cartId).toBe(rawCartFixture.id));
    expect(vi.mocked(storefrontRequest)).toHaveBeenCalledWith(
      expect.stringContaining('mutation CartCreate'),
      { lines: [{ merchandiseId: simpleProduct.defaultVariantId, quantity: 1 }] },
    );
    await waitFor(() => expect(useCartDrawer.getState().isOpen).toBe(true));
    expect(useWishlistStore.getState().items[0]?.id).toBe(simpleProduct.id);
  });

  it('opens quick view instead of guessing a variant for products with options', () => {
    renderWithProviders(<ProductCard product={productWithOptions} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(useDiscoveryStore.getState().quickViewHandle).toBe(productWithOptions.handle);
    expect(vi.mocked(storefrontRequest)).not.toHaveBeenCalled();
  });
});
