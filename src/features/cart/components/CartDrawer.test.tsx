import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartDrawer } from '@/features/cart/cart-drawer-store';
import { useCartSession } from '@/features/cart/cart-store';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { storefrontRequest } from '@/services/storefront/client';
import { rawCartFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

vi.mock('@/services/storefront/client', () => ({
  storefrontRequest: vi.fn(),
  isMockShop: () => true,
}));

describe('CartDrawer', () => {
  beforeEach(() => {
    vi.mocked(storefrontRequest).mockReset();
    useCartSession.setState({ cartId: rawCartFixture.id });
    useCartDrawer.setState({ isOpen: false });
  });

  it('lists the Shopify cart lines with links to the bag and the checkout', async () => {
    vi.mocked(storefrontRequest).mockResolvedValueOnce({ cart: rawCartFixture });
    renderWithProviders(<CartDrawer />);

    act(() => useCartDrawer.getState().open());

    expect(await screen.findByRole('dialog', { name: 'Shopping bag' })).toBeInTheDocument();
    expect(await screen.findByText('Considered Desk Lamp')).toBeInTheDocument();
    expect(screen.getByText('Moss / Small')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View bag' })).toHaveAttribute('href', '/cart');
    expect(screen.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout');
  });

  it('closes with the Escape key', async () => {
    vi.mocked(storefrontRequest).mockResolvedValueOnce({ cart: rawCartFixture });
    renderWithProviders(<CartDrawer />);

    act(() => useCartDrawer.getState().open());
    await screen.findByRole('dialog', { name: 'Shopping bag' });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(useCartDrawer.getState().isOpen).toBe(false);
  });
});
