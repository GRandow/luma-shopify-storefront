import { getDiscountPercentage, type Money } from '@/types/product';
import { formatMoney } from '@/utils/format';

interface ProductPriceProps {
  price: Money;
  compareAtPrice?: Money | null;
  /** Prefix the amount with "From" when variants have different prices. */
  from?: boolean;
  size?: 'sm' | 'lg';
}

export function ProductPrice({
  price,
  compareAtPrice = null,
  from = false,
  size = 'sm',
}: ProductPriceProps) {
  const discount = getDiscountPercentage(price, compareAtPrice);

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={size === 'lg' ? 'text-3xl font-semibold' : 'text-sm font-semibold'}>
        {from ? <span className="font-normal text-ink-500">From </span> : null}
        {formatMoney(price)}
      </span>
      {discount > 0 && compareAtPrice ? (
        <>
          <span className={`${size === 'lg' ? 'text-base' : 'text-xs'} text-ink-400 line-through`}>
            {formatMoney(compareAtPrice)}
          </span>
          {size === 'lg' ? (
            <span className="rounded-full bg-moss-100 px-2 py-1 text-xs font-bold text-moss-800 dark:bg-moss-900 dark:text-moss-200">
              Save {discount}%
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
