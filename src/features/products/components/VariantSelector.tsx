import { findVariant, hasOnlyDefaultVariant, type Product } from '@/types/product';
import { cn } from '@/utils/cn';

interface VariantSelectorProps {
  product: Product;
  selectedOptions: Record<string, string>;
  onSelect: (name: string, value: string) => void;
  size?: 'sm' | 'md';
}

/**
 * One radio group per product option (Size, Color…). Combinations that do not
 * exist as a variant are disabled; sold-out ones stay selectable but struck
 * through, mirroring Shopify's own theme behaviour.
 */
export function VariantSelector({
  product,
  selectedOptions,
  onSelect,
  size = 'md',
}: VariantSelectorProps) {
  if (hasOnlyDefaultVariant(product)) return null;

  return (
    <div className="space-y-5">
      {product.options.map((option) => (
        <fieldset key={option.name}>
          <legend className="text-sm font-semibold">
            {option.name}
            <span className="ml-2 font-normal text-ink-500 dark:text-ink-400">
              {selectedOptions[option.name]}
            </span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={option.name}>
            {option.values.map((value) => {
              const variant = findVariant(product, { ...selectedOptions, [option.name]: value });
              const isSelected = selectedOptions[option.name] === value;
              const isSoldOut = variant !== undefined && !variant.availableForSale;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={isSoldOut ? `${value} (sold out)` : value}
                  disabled={variant === undefined}
                  onClick={() => onSelect(option.name, value)}
                  className={cn(
                    'focus-ring rounded-full border font-medium transition disabled:cursor-not-allowed disabled:opacity-35',
                    size === 'md' ? 'min-w-11 px-4 py-2 text-sm' : 'min-w-9 px-3 py-1.5 text-xs',
                    isSelected
                      ? 'border-ink-950 bg-ink-950 text-white dark:border-white dark:bg-white dark:text-ink-950'
                      : 'surface border-ink-200 hover:border-ink-400 dark:border-white/15',
                    isSoldOut && 'line-through decoration-2',
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
