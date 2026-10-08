import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewsletterSignup } from '@/features/marketing/components/NewsletterSignup';
import { useReferralStore } from '@/features/referral/referral-store';
import { renderWithProviders } from '@/test/render';

const fetchMock = vi.fn<typeof fetch>();

function sentBody() {
  return JSON.parse(fetchMock.mock.lastCall?.[1]?.body as string) as {
    data: { attributes: { profile: { data: { attributes: Record<string, unknown> } } } };
  };
}

describe('NewsletterSignup', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KLAVIYO_PUBLIC_KEY', 'LUMA01');
    vi.stubEnv('VITE_KLAVIYO_LIST_ID', 'NEWS01');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
    useReferralStore.getState().clear();
    delete window.klaviyo;
    delete window._klOnsite;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('is hidden until Klaviyo and a list are configured', () => {
    vi.stubEnv('VITE_KLAVIYO_LIST_ID', '');
    renderWithProviders(<NewsletterSignup />);
    expect(screen.queryByRole('heading', { name: 'Join the Luma list' })).not.toBeInTheDocument();
  });

  it('checks the address before sending anything', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewsletterSignup />);

    await user.type(screen.getByLabelText('Email address'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('subscribes, carries the distributor code and identifies the browser', async () => {
    useReferralStore.getState().setCode('ANA123');
    const user = userEvent.setup();
    renderWithProviders(<NewsletterSignup />);

    await user.type(screen.getByLabelText('Email address'), '  ana@example.com ');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Thanks for subscribing');
    expect(sentBody().data.attributes.profile.data.attributes).toMatchObject({
      email: 'ana@example.com',
      properties: { referral_code: 'ANA123' },
    });
    expect(window._klOnsite).toContainEqual(['identify', { email: 'ana@example.com' }]);
  });

  it('keeps the form and says so when Klaviyo cannot be reached', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const user = userEvent.setup();
    renderWithProviders(<NewsletterSignup />);

    await user.type(screen.getByLabelText('Email address'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent("We couldn't sign you up just now."),
    );
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeEnabled();
    expect(window._klOnsite ?? []).not.toContainEqual(['identify', { email: 'ana@example.com' }]);
  });
});
