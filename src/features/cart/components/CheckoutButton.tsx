import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** When true, checkout hands the cart to Shopify's hosted checkout (`cart.checkoutUrl`). */
const HOSTED_CHECKOUT = import.meta.env.VITE_HOSTED_CHECKOUT === 'true';

/**
 * Storefront password to surface next to the checkout button. Development stores
 * cannot drop their password page, and Shopify's checkout redirects to it until the
 * password has been entered once, so a demo store has to tell visitors what it is.
 */
const STORE_PASSWORD_HINT = import.meta.env.VITE_STORE_PASSWORD_HINT?.trim();

interface CheckoutButtonProps {
  checkoutUrl: string;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}

/**
 * Single place that decides where "checkout" goes: Shopify's hosted checkout
 * for a real store, or the in-app demo checkout while running on mock.shop.
 */
export function CheckoutButton({
  checkoutUrl,
  className,
  onClick,
  children = 'Secure checkout',
}: CheckoutButtonProps) {
  if (HOSTED_CHECKOUT) {
    return (
      <a className={className} href={checkoutUrl} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link className={className} to="/checkout" onClick={onClick}>
      {children}
    </Link>
  );
}

/** Renders only when hosted checkout is on and `VITE_STORE_PASSWORD_HINT` is set. */
export function CheckoutPasswordHint({ className }: { className?: string }) {
  if (!HOSTED_CHECKOUT || !STORE_PASSWORD_HINT) return null;
  return (
    <p className={className} role="note">
      Test store: if Shopify asks for a password, use{' '}
      <span className="font-semibold text-ink-700 dark:text-ink-200">{STORE_PASSWORD_HINT}</span>,
      then press Checkout again.
    </p>
  );
}
