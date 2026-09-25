import { UserRoundCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useCart, useUpdateCartAttributes } from '@/features/cart/cart-queries';
import { REFERRAL_ATTRIBUTE_KEY, useReferralStore } from '@/features/referral/referral-store';
import { cn } from '@/utils/cn';

/**
 * Tells the shopper which distributor their order will be credited to, with
 * a way to opt out. Renders nothing when no referral code is remembered.
 */
export function ReferralNotice({ className }: { className?: string }) {
  const code = useReferralStore((state) => state.code);
  const clear = useReferralStore((state) => state.clear);
  const cart = useCart().data ?? null;
  const updateAttributes = useUpdateCartAttributes();

  if (!code) return null;

  function remove() {
    clear();
    if (cart?.attributes.some((attribute) => attribute.key === REFERRAL_ATTRIBUTE_KEY)) {
      updateAttributes.mutate(
        cart.attributes.filter((attribute) => attribute.key !== REFERRAL_ATTRIBUTE_KEY),
        { onError: (error) => toast.error(error.message) },
      );
    }
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl bg-moss-50 p-4 text-sm text-moss-900 dark:bg-moss-900 dark:text-moss-100',
        className,
      )}
      role="note"
    >
      <div className="flex gap-2">
        <UserRoundCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Referred by <strong>{code}</strong>. This order will be credited to them.
        </p>
      </div>
      <button
        type="button"
        className="focus-ring shrink-0 rounded text-xs font-semibold underline-offset-2 hover:underline"
        onClick={remove}
        disabled={updateAttributes.isPending}
      >
        Remove
      </button>
    </div>
  );
}
