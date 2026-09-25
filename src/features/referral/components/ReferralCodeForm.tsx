import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { normalizeReferralCode, useReferralStore } from '@/features/referral/referral-store';
import { cn } from '@/utils/cn';

/**
 * For shoppers who have a distributor's code but not their link. Only the
 * format is checked here; whether the code belongs to an active distributor
 * is decided when the order is processed, so nothing about distributors is
 * exposed on the storefront. Once a code is remembered the cart sync writes
 * it on the cart and `ReferralNotice` takes over, so this renders nothing.
 */
export function ReferralCodeForm({ className }: { className?: string }) {
  const code = useReferralStore((state) => state.code);
  const setCode = useReferralStore((state) => state.setCode);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (code) return null;

  function apply(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeReferralCode(input);
    if (!normalized) {
      setError('Codes have 2 to 32 letters or numbers (dashes and underscores are fine).');
      return;
    }
    setCode(normalized);
    setInput('');
    setError(null);
    toast.success(`Code ${normalized} applied`);
  }

  return (
    <div className={cn('surface rounded-3xl border p-5', className)}>
      <h2 className="text-sm font-semibold">Distributor code</h2>
      <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
        Shopping with a distributor? Enter their code and this order is credited to them.
      </p>
      <form className="mt-3 flex gap-2" onSubmit={apply} noValidate>
        <label className="sr-only" htmlFor="referral-code">
          Distributor code
        </label>
        <input
          id="referral-code"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. ANA123"
          maxLength={32}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'referral-code-error' : undefined}
          className="focus-ring min-w-0 flex-1 rounded-full border border-ink-200 bg-transparent px-4 text-sm uppercase dark:border-white/15"
        />
        <Button size="sm" variant="secondary" type="submit">
          Apply
        </Button>
      </form>
      {error ? (
        <p
          id="referral-code-error"
          role="alert"
          className="mt-2 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
