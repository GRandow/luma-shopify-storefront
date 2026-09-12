import { RotateCcw, Search } from 'lucide-react';
import type { Collection, ProductFiltersState, ProductSort } from '@/types/product';
import { formatCurrency } from '@/utils/format';

interface ProductFiltersProps {
  filters: ProductFiltersState;
  collections: Collection[];
  priceCeiling: number;
  currencyCode: string;
  onChange: (filters: ProductFiltersState) => void;
  onReset: () => void;
}

const sortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'title', label: 'Name: A to Z' },
];

export function ProductFilters({
  filters,
  collections,
  priceCeiling,
  currencyCode,
  onChange,
  onReset,
}: ProductFiltersProps) {
  const update = <K extends keyof ProductFiltersState>(key: K, value: ProductFiltersState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <aside className="space-y-7" aria-label="Product filters">
      <div>
        <label htmlFor="product-search" className="text-sm font-semibold">
          Search
        </label>
        <div className="relative mt-2">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="product-search"
            type="search"
            value={filters.query}
            onChange={(event) => update('query', event.target.value)}
            placeholder="Search products"
            className="focus-ring surface h-11 w-full rounded-xl border py-2 pr-3 pl-10 text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="collection-filter" className="text-sm font-semibold">
          Collection
        </label>
        <select
          id="collection-filter"
          value={filters.collection}
          onChange={(event) => update('collection', event.target.value)}
          className="focus-ring surface mt-2 h-11 w-full rounded-xl border px-3 text-sm"
        >
          <option value="">All collections</option>
          {collections.map((collection) => (
            <option key={collection.handle} value={collection.handle}>
              {collection.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="price-filter" className="text-sm font-semibold">
            Maximum price
          </label>
          <output
            htmlFor="price-filter"
            className="text-sm font-medium text-moss-700 dark:text-moss-300"
          >
            {formatCurrency(Math.min(filters.maxPrice, priceCeiling), currencyCode)}
          </output>
        </div>
        <input
          id="price-filter"
          type="range"
          min="0"
          max={priceCeiling}
          step={Math.max(10, Math.round(priceCeiling / 100))}
          value={Math.min(filters.maxPrice, priceCeiling)}
          onChange={(event) => update('maxPrice', Number(event.target.value))}
          className="mt-4 h-1.5 w-full cursor-pointer accent-moss-600"
        />
      </div>
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(event) => update('inStockOnly', event.target.checked)}
            className="accent-moss-600"
          />
          In stock only
        </label>
      </div>
      <div>
        <label htmlFor="sort-products" className="text-sm font-semibold">
          Sort by
        </label>
        <select
          id="sort-products"
          value={filters.sort}
          onChange={(event) => update('sort', event.target.value as ProductSort)}
          className="focus-ring surface mt-2 h-11 w-full rounded-xl border px-3 text-sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        className="focus-ring flex items-center gap-2 rounded-lg text-sm font-semibold text-ink-500 hover:text-ink-950 dark:hover:text-white"
        onClick={onReset}
      >
        <RotateCcw className="size-4" aria-hidden="true" /> Reset filters
      </button>
    </aside>
  );
}
