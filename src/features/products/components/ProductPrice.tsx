import { formatCurrency } from '@/utils/format';

interface ProductPriceProps {
  price: number;
  discountPercentage?: number;
  size?: 'sm' | 'lg';
}

export function ProductPrice({ price, discountPercentage = 0, size = 'sm' }: ProductPriceProps) {
  const originalPrice = discountPercentage > 0 ? price / (1 - discountPercentage / 100) : price;

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={size === 'lg' ? 'text-3xl font-semibold' : 'text-sm font-semibold'}>
        {formatCurrency(price)}
      </span>
      {discountPercentage > 0 ? (
        <>
          <span className={`${size === 'lg' ? 'text-base' : 'text-xs'} text-ink-400 line-through`}>
            {formatCurrency(originalPrice)}
          </span>
          {size === 'lg' ? (
            <span className="rounded-full bg-moss-100 px-2 py-1 text-xs font-bold text-moss-800 dark:bg-moss-900 dark:text-moss-200">
              Save {Math.round(discountPercentage)}%
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
