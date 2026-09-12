import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** When true, checkout hands the cart to Shopify's hosted checkout (`cart.checkoutUrl`). */
const HOSTED_CHECKOUT = import.meta.env.VITE_HOSTED_CHECKOUT === 'true';

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
