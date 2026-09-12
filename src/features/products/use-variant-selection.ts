import { useMemo, useState } from 'react';
import {
  findVariant,
  getDefaultVariant,
  toOptionMap,
  type Product,
  type ProductVariant,
} from '@/types/product';

export interface VariantSelection {
  /** Option name → chosen value, seeded from the default variant. */
  selectedOptions: Record<string, string>;
  /** Variant matching the current options, or `undefined` when that combination does not exist. */
  selectedVariant: ProductVariant | undefined;
  select: (name: string, value: string) => void;
}

/**
 * Tracks which options the shopper picked for a product. Mount the calling
 * component with `key={product.handle}` so the selection resets per product.
 */
export function useVariantSelection(product: Product): VariantSelection {
  const [choices, setChoices] = useState<Record<string, string>>({});

  const selectedOptions = useMemo(
    () => ({ ...toOptionMap(getDefaultVariant(product)?.selectedOptions), ...choices }),
    [choices, product],
  );
  const selectedVariant = useMemo(
    () => findVariant(product, selectedOptions),
    [product, selectedOptions],
  );

  return {
    selectedOptions,
    selectedVariant,
    select: (name, value) => setChoices((current) => ({ ...current, [name]: value })),
  };
}
