import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrderSummary } from '@/features/cart/components/OrderSummary';
import { useCartStore, type CartItem } from '@/features/cart/cart-store';
import { calculatePriceSummary, type ShippingOption } from '@/utils/pricing';
import { formatCurrency } from '@/utils/format';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const shippingOption = useCartStore((state) => state.shippingOption);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const addItem = useCartStore((state) => state.addItem);
  const setPromoCode = useCartStore((state) => state.setPromoCode);
  const setShippingOption = useCartStore((state) => state.setShippingOption);
  const [promoInput, setPromoInput] = useState(promoCode ?? '');
  const summary = useMemo(
    () => calculatePriceSummary(items, promoCode, shippingOption),
    [items, promoCode, shippingOption],
  );

  function remove(item: CartItem) {
    removeItem(item.id);
    toast.success(`${item.title} removed`, {
      action: { label: 'Undo', onClick: () => addItem(item, item.quantity) },
    });
  }

  function applyPromo(event: FormEvent) {
    event.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!['WELCOME10', 'LUMA20'].includes(code)) {
      toast.error('That promo code is not recognized. Try WELCOME10.');
      return;
    }
    if (code === 'LUMA20' && summary.subtotal < 150) {
      toast.error('LUMA20 applies to orders of $150 or more.');
      return;
    }
    setPromoCode(code);
    toast.success(`${code} applied`);
  }

  if (items.length === 0) {
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
        title={`Shopping bag (${items.length})`}
        description="Review your pieces, choose delivery, and continue when everything looks right."
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
            {items.map((item) => (
              <article key={item.id} className="flex gap-4 py-6 sm:gap-6">
                <Link
                  to={`/products/${item.id}`}
                  className="focus-ring size-24 shrink-0 overflow-hidden rounded-2xl bg-ink-100 p-2 sm:size-32 dark:bg-ink-800"
                >
                  <img
                    className="h-full w-full object-contain"
                    src={item.thumbnail}
                    alt={item.title}
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-ink-400 uppercase">
                        {item.brand ?? item.category}
                      </p>
                      <h2 className="mt-1 font-semibold">
                        <Link
                          className="focus-ring rounded hover:text-moss-700"
                          to={`/products/${item.id}`}
                        >
                          {item.title}
                        </Link>
                      </h2>
                    </div>
                    <button
                      className="focus-ring rounded p-1 text-ink-400 hover:text-red-600"
                      onClick={() => remove(item)}
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{formatCurrency(item.price)}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                    <div className="surface flex h-10 items-center rounded-full border p-0.5">
                      <button
                        className="focus-ring grid size-8 place-items-center rounded-full hover:bg-ink-100 dark:hover:bg-white/8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.title}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <output className="w-7 text-center text-sm font-semibold">
                        {item.quantity}
                      </output>
                      <button
                        className="focus-ring grid size-8 place-items-center rounded-full hover:bg-ink-100 dark:hover:bg-white/8"
                        disabled={item.quantity >= item.stock}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <OrderSummary items={items} summary={summary} checkoutLink />
          <div className="surface rounded-3xl border p-5">
            <h2 className="text-sm font-semibold">Promo code</h2>
            <form className="mt-3 flex gap-2" onSubmit={applyPromo}>
              <label className="sr-only" htmlFor="promo-code">
                Promo code
              </label>
              <input
                id="promo-code"
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value)}
                placeholder="WELCOME10"
                className="focus-ring min-w-0 flex-1 rounded-full border border-ink-200 bg-transparent px-4 text-sm uppercase dark:border-white/15"
              />
              <Button size="sm" variant="secondary" type="submit">
                Apply
              </Button>
            </form>
            {promoCode ? (
              <button
                className="mt-2 text-xs font-semibold text-moss-700 dark:text-moss-300"
                onClick={() => {
                  setPromoCode(null);
                  setPromoInput('');
                }}
              >
                Remove {promoCode}
              </button>
            ) : null}
          </div>
          <div className="surface rounded-3xl border p-5">
            <label htmlFor="shipping-option" className="text-sm font-semibold">
              Shipping calculator
            </label>
            <select
              id="shipping-option"
              value={shippingOption}
              onChange={(event) => setShippingOption(event.target.value as ShippingOption)}
              className="focus-ring mt-3 h-11 w-full rounded-xl border border-ink-200 bg-transparent px-3 text-sm dark:border-white/15"
            >
              <option value="standard">Standard (3–5 days)</option>
              <option value="express">Express (1–2 days)</option>
              <option value="pickup">Store pickup</option>
            </select>
          </div>
        </aside>
      </div>
    </>
  );
}
