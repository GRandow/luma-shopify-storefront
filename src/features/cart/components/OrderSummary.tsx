import { Link } from 'react-router-dom';
import type { CartItem } from '@/features/cart/cart-store';
import type { PriceSummary } from '@/utils/pricing';
import { formatCurrency } from '@/utils/format';

interface OrderSummaryProps {
  items: CartItem[];
  summary: PriceSummary;
  checkoutLink?: boolean;
}

export function OrderSummary({ items, summary, checkoutLink = false }: OrderSummaryProps) {
  return (
    <section
      className="surface rounded-3xl border p-6 shadow-card"
      aria-labelledby="order-summary-title"
    >
      <h2 id="order-summary-title" className="font-display text-xl font-semibold">
        Order summary
      </h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 rounded-xl bg-ink-100 p-1 dark:bg-ink-800">
              <img className="h-full w-full object-contain" src={item.thumbnail} alt="" />
              <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink-700 text-[0.65rem] font-bold text-white">
                {item.quantity}
              </span>
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</p>
            <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>
      <dl className="mt-6 space-y-3 border-t border-black/5 pt-5 text-sm dark:border-white/8">
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-ink-400">Subtotal</dt>
          <dd>{formatCurrency(summary.subtotal)}</dd>
        </div>
        {summary.discount > 0 ? (
          <div className="flex justify-between text-moss-700 dark:text-moss-300">
            <dt>Discount</dt>
            <dd>-{formatCurrency(summary.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-ink-400">Shipping</dt>
          <dd>{summary.shipping === 0 ? 'Complimentary' : formatCurrency(summary.shipping)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-ink-400">Estimated tax</dt>
          <dd>{formatCurrency(summary.tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-black/5 pt-4 text-base font-semibold dark:border-white/8">
          <dt>Total</dt>
          <dd>{formatCurrency(summary.total)} USD</dd>
        </div>
      </dl>
      {checkoutLink ? (
        <Link
          className="focus-ring mt-6 flex h-12 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white transition hover:bg-moss-700 dark:bg-white dark:text-ink-950 dark:hover:bg-moss-100"
          to="/checkout"
        >
          Secure checkout
        </Link>
      ) : null}
    </section>
  );
}
