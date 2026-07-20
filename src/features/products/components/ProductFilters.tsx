import { RotateCcw, Search } from 'lucide-react';
import type { ProductCategory, ProductFiltersState, ProductSort } from '@/types/product';
import { formatCurrency } from '@/utils/format';

interface ProductFiltersProps {
  filters: ProductFiltersState;
  categories: ProductCategory[];
  priceCeiling: number;
  onChange: (filters: ProductFiltersState) => void;
  onReset: () => void;
}

const sortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
];

export function ProductFilters({
  filters,
  categories,
  priceCeiling,
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
        <label htmlFor="category-filter" className="text-sm font-semibold">
          Category
        </label>
        <select
          id="category-filter"
          value={filters.category}
          onChange={(event) => update('category', event.target.value)}
          className="focus-ring surface mt-2 h-11 w-full rounded-xl border px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
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
            {formatCurrency(filters.maxPrice)}
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
      <fieldset>
        <legend className="text-sm font-semibold">Minimum rating</legend>
        <div className="mt-3 space-y-2">
          {[0, 3, 4, 4.5].map((rating) => (
            <label
              key={rating}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
            >
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={filters.minRating === rating}
                onChange={() => update('minRating', rating)}
                className="accent-moss-600"
              />
              {rating === 0 ? 'All ratings' : `${rating}+ stars`}
            </label>
          ))}
        </div>
      </fieldset>
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
