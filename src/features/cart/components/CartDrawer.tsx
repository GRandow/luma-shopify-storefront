import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCartDrawer } from '@/features/cart/cart-drawer-store';
import { useCart } from '@/features/cart/cart-queries';
import { CheckoutButton } from '@/features/cart/components/CheckoutButton';
import { QuantityStepper } from '@/features/cart/components/QuantityStepper';
import { useCartLineActions } from '@/features/cart/use-cart-line-actions';
import { getLineVariantTitle, type Cart } from '@/types/cart';
import { formatMoney } from '@/utils/format';

function CartDrawerLines({ cart, onNavigate }: { cart: Cart; onNavigate: () => void }) {
  const { changeQuantity, remove, busy } = useCartLineActions();

  return (
    <ul className="divide-y divide-black/5 dark:divide-white/8">
      {cart.lines.map((line) => {
        const { merchandise } = line;
        const variantTitle = getLineVariantTitle(line);
        const productUrl = `/products/${merchandise.product.handle}`;
        return (
          <li key={line.id} className="flex gap-4 py-5">
            <Link
              to={productUrl}
              onClick={onNavigate}
              className="focus-ring size-20 shrink-0 overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-800"
            >
              <ProductImage
                className="h-full w-full"
                image={merchandise.image}
                alt={merchandise.product.title}
                sizes="5rem"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    <Link
                      className="focus-ring rounded hover:text-moss-700 dark:hover:text-moss-300"
                      to={productUrl}
                      onClick={onNavigate}
                    >
                      {merchandise.product.title}
                    </Link>
                  </p>
                  {variantTitle ? (
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                      {variantTitle}
                    </p>
                  ) : null}
                </div>
                <button
                  className="focus-ring shrink-0 rounded p-1 text-ink-400 hover:text-red-600"
                  disabled={busy}
                  onClick={() => remove(line)}
                  aria-label={`Remove ${merchandise.product.title}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                <QuantityStepper
                  quantity={line.quantity}
                  label={merchandise.product.title}
                  max={merchandise.quantityAvailable ?? undefined}
                  disabled={busy}
                  onChange={(quantity) => changeQuantity(line, quantity)}
                />
                <p className="text-sm font-semibold">{formatMoney(line.cost.total)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Slide-in bag opened from the header and after every "add to bag". Keeps the
 * shopper on the page; the full bag page and checkout are one click away.
 */
export function CartDrawer() {
  const isOpen = useCartDrawer((state) => state.isOpen);
  const close = useCartDrawer((state) => state.close);
  const location = useLocation();
  const cartQuery = useCart();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathname = useRef(location.pathname);
  // `null` until the shopper adds something; an empty Shopify cart is treated the same way.
  const cart = cartQuery.data && cartQuery.data.lines.length > 0 ? cartQuery.data : null;

  // Navigating anywhere (product, bag, checkout) dismisses the drawer.
  useEffect(() => {
    if (previousPathname.current === location.pathname) return;
    previousPathname.current = location.pathname;
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="cart-drawer"
          className="fixed inset-0 z-50 flex justify-end bg-ink-950/45 backdrop-blur-sm"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <motion.aside
            className="surface flex h-full w-[min(28rem,100vw)] flex-col border-l shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          >
            <header className="flex items-center justify-between border-b border-black/5 px-6 py-5 dark:border-white/8">
              <h2 className="font-display text-xl font-semibold">
                Your bag{cart ? ` (${cart.totalQuantity})` : ''}
              </h2>
              <Button
                ref={closeButtonRef}
                size="icon"
                variant="ghost"
                onClick={close}
                aria-label="Close bag"
              >
                <X className="size-5" />
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto px-6">
              {cartQuery.isLoading ? (
                <div className="space-y-5 py-5" aria-busy="true">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : !cart ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <div className="mb-5 grid size-14 place-items-center rounded-full bg-ink-100 dark:bg-white/8">
                    <ShoppingBag
                      className="size-6 text-ink-600 dark:text-ink-300"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-display text-xl font-semibold">Your bag is empty</p>
                  <p className="mt-2 max-w-xs text-sm text-ink-500 dark:text-ink-400">
                    Add something worth keeping and it will show up here.
                  </p>
                  <Link
                    className="focus-ring mt-6 inline-flex h-11 items-center rounded-full bg-ink-950 px-5 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
                    to="/products"
                    onClick={close}
                  >
                    Explore products
                  </Link>
                </div>
              ) : (
                <CartDrawerLines cart={cart} onNavigate={close} />
              )}
            </div>
            {cart ? (
              <footer className="space-y-4 border-t border-black/5 px-6 py-5 dark:border-white/8">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-500 dark:text-ink-400">Subtotal</span>
                  <span className="text-lg font-semibold">{formatMoney(cart.cost.subtotal)}</span>
                </div>
                <p className="text-xs text-ink-400">
                  Shipping, taxes and discount codes are settled at checkout.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    className="focus-ring flex h-12 items-center justify-center rounded-full border border-ink-200 text-sm font-semibold transition hover:border-ink-400 dark:border-white/15 dark:hover:bg-white/8"
                    to="/cart"
                    onClick={close}
                  >
                    View bag
                  </Link>
                  <CheckoutButton
                    checkoutUrl={cart.checkoutUrl}
                    onClick={close}
                    className="focus-ring flex h-12 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white transition hover:bg-moss-700 dark:bg-white dark:text-ink-950 dark:hover:bg-moss-100"
                  >
                    Checkout
                  </CheckoutButton>
                </div>
              </footer>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
