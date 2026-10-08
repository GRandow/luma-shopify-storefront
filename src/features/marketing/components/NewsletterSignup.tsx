import { useId, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useReferralStore } from '@/features/referral/referral-store';
import { subscribeToNewsletter } from '@/services/klaviyo/client-api';
import { isNewsletterEnabled } from '@/services/klaviyo/config';
import { identifyShopper } from '@/services/klaviyo/onsite';
import { cn } from '@/utils/cn';
import { isEmailAddress } from '@/utils/email';

/** Klaviyo profile property with the distributor code, to segment subscribers by distributor. */
export const REFERRAL_PROFILE_PROPERTY = 'referral_code';

/** Shown on the profile in Klaviyo as the signup source. */
export const NEWSLETTER_SOURCE = 'Luma storefront footer';

/**
 * Footer newsletter. Subscribes through Klaviyo's client API (email marketing
 * consent plus list membership), carries the distributor code that brought
 * the shopper, if any, and identifies the browser so later events reach the
 * new profile. Renders nothing until Klaviyo and a list are configured.
 */
export function NewsletterSignup({ className }: { className?: string }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const referralCode = useReferralStore((state) => state.code);

  const signup = useMutation({
    mutationFn: (address: string) =>
      subscribeToNewsletter({
        email: address,
        source: NEWSLETTER_SOURCE,
        properties: referralCode ? { [REFERRAL_PROFILE_PROPERTY]: referralCode } : undefined,
      }),
    onSuccess: (_result, address) => identifyShopper({ email: address }),
  });

  if (!isNewsletterEnabled()) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!isEmailAddress(address)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    signup.mutate(address);
  }

  const message = invalid
    ? 'Enter a valid email address.'
    : signup.isError
      ? "We couldn't sign you up just now. Please try again."
      : null;

  return (
    <section className={cn('max-w-sm', className)} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-sm font-bold">
        Join the Luma list
      </h2>
      {signup.isSuccess ? (
        <p role="status" className="mt-3 text-sm">
          Thanks for subscribing. Check your inbox.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-muted">
            New arrivals and the occasional quiet sale, twice a month at most.
          </p>
          <form className="mt-4 flex gap-2" onSubmit={submit} noValidate>
            <label className="sr-only" htmlFor={`${id}-email`}>
              Email address
            </label>
            <input
              id={`${id}-email`}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (invalid) setInvalid(false);
              }}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={message ? `${id}-message` : undefined}
              className="focus-ring h-11 min-w-0 flex-1 rounded-full border border-ink-muted bg-white px-4 text-sm dark:bg-ink-950"
            />
            <Button type="submit" loading={signup.isPending}>
              Subscribe
            </Button>
          </form>
          {message ? (
            <p
              id={`${id}-message`}
              role="alert"
              className="mt-2 text-xs text-red-700 dark:text-red-400"
            >
              {message}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-ink-muted">
            By subscribing you agree to receive marketing emails from Luma. Unsubscribe anytime.
          </p>
        </>
      )}
    </section>
  );
}
