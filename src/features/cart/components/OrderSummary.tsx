import { ProductImage } from '@/components/ui/ProductImage';
import { CheckoutButton, CheckoutPasswordHint } from '@/features/cart/components/CheckoutButton';
import { getCartDiscount, getLineVariantTitle, type Cart } from '@/types/cart';
import type { PriceSummary } from '@/utils/pricing';
import { formatMoney } from '@/utils/format';

interface OrderSummaryProps {
  cart: Cart;
  /** Demo-checkout breakdown with the local shipping estimate; omitted on the cart page. */
  summary?: PriceSummary;
  checkoutLink?: boolean;
}

export function OrderSummary({ cart, summary, checkoutLink = false }: OrderSummaryProps) {
  const discount = summary?.discount ?? getCartDiscount(cart);
  const total = summary?.total ?? cart.cost.total;

  return (
    <section
      className="surface rounded-3xl border p-6 shadow-card"
      aria-labelledby="order-summary-title"
    >
      <h2 id="order-summary-title" className="font-display text-xl font-semibold">
        Order summary
      </h2>
      <div className="mt-5 space-y-4">
        {cart.lines.map((line) => {
          const variantTitle = getLineVariantTitle(line);
          return (
            <div key={line.id} className="flex items-center gap-3">
              {/* The badge hangs outside the thumbnail, so clipping happens on the inner frame only. */}
              <div className="relative size-14 shrink-0">
                <div className="h-full w-full overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800">
                  <ProductImage
                    className="h-full w-full"
                    image={line.merchandise.image}
                    alt=""
                    sizes="3.5rem"
                  />
                </div>
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink-700 text-[0.65rem] font-bold text-white">
                  {line.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.merchandise.product.title}</p>
                {variantTitle ? (
                  <p className="truncate text-xs text-ink-400">{variantTitle}</p>
                ) : null}
              </div>
              <p className="text-sm font-semibold">{formatMoney(line.cost.total)}</p>
            </div>
          );
        })}
      </div>
      <dl className="mt-6 space-y-3 border-t border-black/5 pt-5 text-sm dark:border-white/8">
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-ink-400">Subtotal</dt>
          <dd>{formatMoney(cart.cost.subtotal)}</dd>
        </div>
        {discount.amount > 0 ? (
          <div className="flex justify-between text-moss-700 dark:text-moss-300">
            <dt>Discount</dt>
            <dd>-{formatMoney(discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-ink-400">Shipping</dt>
          <dd>
            {summary
              ? summary.shipping.amount === 0
                ? 'Complimentary'
                : formatMoney(summary.shipping)
              : 'Calculated at checkout'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-ink-400">Tax</dt>
          <dd>{cart.cost.tax ? formatMoney(cart.cost.tax) : 'Calculated at checkout'}</dd>
        </div>
        <div className="flex justify-between border-t border-black/5 pt-4 text-base font-semibold dark:border-white/8">
          <dt>Total</dt>
          <dd>
            {formatMoney(total)} {total.currencyCode}
          </dd>
        </div>
      </dl>
      {checkoutLink ? (
        <>
          <CheckoutButton
            checkoutUrl={cart.checkoutUrl}
            className="focus-ring mt-6 flex h-12 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white transition hover:bg-moss-700 dark:bg-white dark:text-ink-950 dark:hover:bg-moss-100"
          />
          <CheckoutPasswordHint className="mt-3 text-center text-xs text-ink-400" />
        </>
      ) : null}
    </section>
  );
}
