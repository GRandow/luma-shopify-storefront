import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** The component reads `import.meta.env` at module load, so each case re-imports it. */
async function loadWithEnv(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('@/features/cart/components/CheckoutButton');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('CheckoutButton', () => {
  it('links to the in-app demo checkout when hosted checkout is off', async () => {
    const { CheckoutButton, CheckoutPasswordHint } = await loadWithEnv({
      VITE_HOSTED_CHECKOUT: 'false',
      VITE_STORE_PASSWORD_HINT: 'luma',
    });
    render(
      <MemoryRouter>
        <CheckoutButton checkoutUrl="https://shop.example/cart/c/abc" />
        <CheckoutPasswordHint />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Secure checkout' })).toHaveAttribute(
      'href',
      '/checkout',
    );
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('hands the cart to Shopify checkout and shows the store password hint', async () => {
    const { CheckoutButton, CheckoutPasswordHint } = await loadWithEnv({
      VITE_HOSTED_CHECKOUT: 'true',
      VITE_STORE_PASSWORD_HINT: 'luma',
    });
    render(
      <MemoryRouter>
        <CheckoutButton checkoutUrl="https://shop.example/cart/c/abc" />
        <CheckoutPasswordHint />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Secure checkout' })).toHaveAttribute(
      'href',
      'https://shop.example/cart/c/abc',
    );
    expect(screen.getByRole('note')).toHaveTextContent(
      'if Shopify asks for a password, use luma, then press Checkout again.',
    );
  });

  it('renders no hint when no password is configured', async () => {
    const { CheckoutPasswordHint } = await loadWithEnv({
      VITE_HOSTED_CHECKOUT: 'true',
      VITE_STORE_PASSWORD_HINT: '',
    });
    render(<CheckoutPasswordHint />);

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
