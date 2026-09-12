import type { Money } from '@/types/product';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(value: number, currencyCode = 'USD'): string {
  let formatter = currencyFormatters.get(currencyCode);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode });
    currencyFormatters.set(currencyCode, formatter);
  }
  return formatter.format(value);
}

export function formatMoney(money: Money): string {
  return formatCurrency(money.amount, money.currencyCode);
}

/** Turns a Shopify handle or tag such as `home-decoration` into `Home Decoration`. */
export function formatHandle(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
