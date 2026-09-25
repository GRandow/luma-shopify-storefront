import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferralCodeForm } from '@/features/referral/components/ReferralCodeForm';
import { useReferralStore } from '@/features/referral/referral-store';

describe('ReferralCodeForm', () => {
  beforeEach(() => {
    useReferralStore.getState().clear();
  });

  it('remembers a typed code, uppercased, and then steps aside', async () => {
    const user = userEvent.setup();
    render(<ReferralCodeForm />);

    await user.type(screen.getByLabelText('Distributor code'), 'bruno77');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(useReferralStore.getState().code).toBe('BRUNO77');
    expect(screen.queryByLabelText('Distributor code')).not.toBeInTheDocument();
  });

  it('explains an unusable code instead of storing it', async () => {
    const user = userEvent.setup();
    render(<ReferralCodeForm />);

    await user.type(screen.getByLabelText('Distributor code'), 'not a code');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByRole('alert')).toHaveTextContent('2 to 32 letters or numbers');
    expect(screen.getByLabelText('Distributor code')).toHaveAttribute('aria-invalid', 'true');
    expect(useReferralStore.getState().code).toBeNull();

    // Typing again clears the message.
    await user.type(screen.getByLabelText('Distributor code'), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders nothing while a code is already remembered', () => {
    useReferralStore.getState().setCode('ANA123');
    const { container } = render(<ReferralCodeForm />);

    expect(container).toBeEmptyDOMElement();
  });
});
