import { useId, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/auth-store';
import { subscribeToBackInStock } from '@/services/klaviyo/client-api';
import { isKlaviyoEnabled } from '@/services/klaviyo/config';
import { identifyShopper } from '@/services/klaviyo/onsite';
import { cn } from '@/utils/cn';
import { isEmailAddress } from '@/utils/email';

interface BackInStockFormProps {
  /** Shopify variant id (`gid://shopify/ProductVariant/…`) of the sold-out variant. */
  variantId: string;
  /** e.g. "50 × 50 cm / Rust"; `null` for products without options. */
  variantTitle: string | null;
  className?: string;
}

/**
 * "Email me when it's back" for a sold-out variant. Klaviyo registers the
 * request against the variant in its Shopify catalog and its Back in Stock
 * flow sends the email once Shopify reports stock again. Key the component by
 * variant so switching options starts a fresh request.
 */
export function BackInStockForm({ variantId, variantTitle, className }: BackInStockFormProps) {
  const id = useId();
  const signedInEmail = useAuthStore((state) => state.customer?.email ?? '');
  const [email, setEmail] = useState(signedInEmail);
  const [invalid, setInvalid] = useState(false);

  const request = useMutation({
    mutationFn: (address: string) => subscribeToBackInStock(address, variantId),
    onSuccess: (_result, address) => identifyShopper({ email: address }),
  });

  if (!isKlaviyoEnabled()) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!isEmailAddress(address)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    request.mutate(address);
  }

  const message = invalid
    ? 'Enter a valid email address.'
    : request.isError
      ? "We couldn't save your request just now. Please try again."
      : null;

  return (
    <section
      className={cn('surface rounded-3xl border p-5', className)}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="text-sm font-semibold">
        Get an email when it&apos;s back
      </h2>
      {request.isSuccess ? (
        <p role="status" className="mt-2 text-sm">
          Done. We&apos;ll email you as soon as it&apos;s back in stock.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-ink-muted">
            {variantTitle ? `${variantTitle} is sold out.` : 'This item is sold out.'} We&apos;ll
            write once, when it&apos;s restocked.
          </p>
          <form className="mt-3 flex gap-2" onSubmit={submit} noValidate>
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
              className="focus-ring h-9 min-w-0 flex-1 rounded-full border border-ink-muted bg-transparent px-4 text-sm"
            />
            <Button type="submit" size="sm" variant="secondary" loading={request.isPending}>
              Notify me
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
        </>
      )}
    </section>
  );
}
