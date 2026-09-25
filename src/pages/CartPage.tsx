import { useState, type FormEvent } from 'react';
import { ArrowLeft, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { OrderSummary } from '@/features/cart/components/OrderSummary';
import { QuantityStepper } from '@/features/cart/components/QuantityStepper';
import { useCart, useUpdateDiscountCodes } from '@/features/cart/cart-queries';
import { useCartLineActions } from '@/features/cart/use-cart-line-actions';
import { ReferralNotice } from '@/features/referral/components/ReferralNotice';
import { isMockShop } from '@/services/storefront/client';
import { getLineVariantTitle } from '@/types/cart';
import { formatMoney } from '@/utils/format';

function CartSkeleton() {
  return (
    <div className="page-shell grid gap-10 py-12 lg:grid-cols-[1fr_23rem]" aria-busy="true">
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

export default function CartPage() {
  const cartQuery = useCart();
  const updateDiscountCodes = useUpdateDiscountCodes();
  const { changeQuantity, remove, busy } = useCartLineActions();
  const [promoInput, setPromoInput] = useState('');
  const cart = cartQuery.data ?? null;

  function applyPromo(event: FormEvent) {
    event.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    updateDiscountCodes.mutate([code], {
      onSuccess: (updated) => {
        const applied = updated.discountCodes.find((entry) => entry.code === code);
        if (applied?.applicable) {
          toast.success(`${code} applied`);
          setPromoInput('');
        } else {
          toast.error(`${code} is not valid for this cart.`);
        }
      },
      onError: (error) => toast.error(error.message),
    });
  }

  function removePromo() {
    updateDiscountCodes.mutate([], { onError: (error) => toast.error(error.message) });
  }

  if (cartQuery.isLoading) {
    return (
      <>
        <PageHeader eyebrow="Your selection" title="Shopping bag" />
        <CartSkeleton />
      </>
    );
  }

  if (cartQuery.isError) {
    return (
      <>
        <PageHeader eyebrow="Your selection" title="Shopping bag" />
        <div className="page-shell py-14">
          <EmptyState
            icon={X}
            title="Your bag is unavailable"
            description="We could not reach the cart service. Please check your connection and try again."
            action={<Button onClick={() => void cartQuery.refetch()}>Try again</Button>}
          />
        </div>
      </>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Your selection" title="Shopping bag" />
        <div className="page-shell py-14">
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is beautifully empty"
            description="Browse the collection and add something worth keeping."
            action={
              <Link
                className="focus-ring inline-flex h-11 items-center rounded-full bg-ink-950 px-5 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
                to="/products"
              >
                Explore products
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Your selection"
        title={`Shopping bag (${cart.totalQuantity})`}
        description="Review your pieces and continue when everything looks right."
      />
      <div className="page-shell grid gap-10 py-12 lg:grid-cols-[1fr_23rem]">
        <div>
          <Link
            className="focus-ring mb-6 inline-flex items-center gap-2 rounded text-sm font-semibold text-ink-500 hover:text-ink-950 dark:hover:text-white"
            to="/products"
          >
            <ArrowLeft className="size-4" />
            Continue shopping
          </Link>
          <div className="divide-y divide-black/5 dark:divide-white/8">
            {cart.lines.map((line) => {
              const { merchandise } = line;
              const variantTitle = getLineVariantTitle(line);
              const productUrl = `/products/${merchandise.product.handle}`;
              return (
                <article key={line.id} className="flex gap-4 py-6 sm:gap-6">
                  <Link
                    to={productUrl}
                    className="focus-ring size-24 shrink-0 overflow-hidden rounded-2xl bg-ink-100 sm:size-32 dark:bg-ink-800"
                  >
                    <ProductImage
                      className="h-full w-full"
                      image={merchandise.image}
                      alt={merchandise.product.title}
                      sizes="(min-width: 640px) 8rem, 6rem"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold tracking-wider text-ink-400 uppercase">
                          {merchandise.product.vendor}
                        </p>
                        <h2 className="mt-1 font-semibold">
                          <Link className="focus-ring rounded hover:text-moss-700" to={productUrl}>
                            {merchandise.product.title}
                          </Link>
                        </h2>
                        {variantTitle ? (
                          <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
                            {variantTitle}
                          </p>
                        ) : null}
                      </div>
                      <button
                        className="focus-ring rounded p-1 text-ink-400 hover:text-red-600"
                        disabled={busy}
                        onClick={() => remove(line)}
                        aria-label={`Remove ${merchandise.product.title}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-semibold">
                      {formatMoney(line.cost.perQuantity)}
                    </p>
                    {!merchandise.availableForSale ? (
                      <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        This item is no longer available.
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <QuantityStepper
                        quantity={line.quantity}
                        label={merchandise.product.title}
                        max={merchandise.quantityAvailable ?? undefined}
                        disabled={busy}
                        onChange={(quantity) => changeQuantity(line, quantity)}
                      />
                      <p className="font-semibold">{formatMoney(line.cost.total)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <OrderSummary cart={cart} checkoutLink />
          <ReferralNotice />
          <div className="surface rounded-3xl border p-5">
            <h2 className="text-sm font-semibold">Discount code</h2>
            <form className="mt-3 flex gap-2" onSubmit={applyPromo}>
              <label className="sr-only" htmlFor="promo-code">
                Discount code
              </label>
              <input
                id="promo-code"
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value)}
                placeholder="Enter code"
                className="focus-ring min-w-0 flex-1 rounded-full border border-ink-200 bg-transparent px-4 text-sm uppercase dark:border-white/15"
              />
              <Button
                size="sm"
                variant="secondary"
                type="submit"
                loading={updateDiscountCodes.isPending}
              >
                Apply
              </Button>
            </form>
            {cart.discountCodes.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs">
                {cart.discountCodes.map((entry) => (
                  <li key={entry.code} className="flex items-center justify-between gap-2">
                    <span>
                      <strong>{entry.code}</strong>{' '}
                      <span className="text-ink-400">
                        {entry.applicable ? 'applied' : 'not applicable'}
                      </span>
                    </span>
                    <button
                      className="font-semibold text-moss-700 dark:text-moss-300"
                      onClick={removePromo}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {isMockShop() ? (
              <p className="mt-3 text-xs leading-5 text-ink-400">
                The mock.shop sandbox accepts codes but never applies a discount. Point the app at a
                development store to test real promotions.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
