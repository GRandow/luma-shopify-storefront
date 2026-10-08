import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/auth-store';
import { BackInStockForm } from '@/features/marketing/components/BackInStockForm';
import { renderWithProviders } from '@/test/render';

const fetchMock = vi.fn<typeof fetch>();
const variantId = 'gid://shopify/ProductVariant/100603';

describe('BackInStockForm', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
    useAuthStore.getState().clear();
    delete window.klaviyo;
    delete window._klOnsite;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('renders nothing without Klaviyo', () => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', '');
    const { container } = renderWithProviders(
      <BackInStockForm variantId={variantId} variantTitle="50 × 50 cm / Rust" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('names the sold-out variant and registers the request for it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BackInStockForm variantId={variantId} variantTitle="50 × 50 cm / Rust" />);

    expect(screen.getByText(/50 × 50 cm \/ Rust is sold out/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email address'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Notify me' }));

    expect(await screen.findByRole('status')).toHaveTextContent("We'll email you");
    const body = JSON.parse(fetchMock.mock.lastCall?.[1]?.body as string) as {
      data: { relationships: { variant: { data: { id: string } } } };
    };
    expect(fetchMock.mock.lastCall?.[0] as string).toContain('/client/back-in-stock-subscriptions');
    expect(body.data.relationships.variant.data.id).toBe('$shopify:::$default:::100603');
  });

  it("starts with a signed-in customer's email", () => {
    useAuthStore.getState().setCustomer({
      id: 'gid://shopify/Customer/1',
      firstName: 'Ana',
      lastName: 'Souza',
      displayName: 'Ana Souza',
      email: 'ana@example.com',
      phone: null,
      defaultAddress: null,
      addresses: [],
    });
    renderWithProviders(<BackInStockForm variantId={variantId} variantTitle={null} />);

    expect(screen.getByLabelText('Email address')).toHaveValue('ana@example.com');
    expect(screen.getByText(/This item is sold out/)).toBeInTheDocument();
  });

  it('rejects an invalid address', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BackInStockForm variantId={variantId} variantTitle={null} />);

    await user.click(screen.getByRole('button', { name: 'Notify me' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
