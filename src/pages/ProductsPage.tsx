import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Grid2X2, ListFilter, Rows3, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { ProductFilters } from '@/features/products/components/ProductFilters';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import {
  DEFAULT_FILTERS,
  filterProducts,
  getCatalogPriceCeiling,
} from '@/features/products/filter-products';
import { useCollections, useProducts } from '@/features/products/product-queries';
import type { ProductFiltersState, ProductSort } from '@/types/product';

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<'pages' | 'infinite'>('pages');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFilters, setMobileFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const initialQuery = searchParams.get('q') ?? '';
  const initialCollection = searchParams.get('collection') ?? '';
  const [filters, setFilters] = useState<ProductFiltersState>({
    ...DEFAULT_FILTERS,
    query: initialQuery,
    collection: initialCollection,
    sort: (searchParams.get('sort') as ProductSort | null) ?? DEFAULT_FILTERS.sort,
  });
  // Search goes through Shopify's `search` query; a collection loads through
  // `collection(handle:)`. Everything else (price, stock, sort) is refined locally.
  const productsQuery = useProducts({
    search: initialQuery || undefined,
    collection: initialQuery ? undefined : initialCollection || undefined,
  });
  const collectionsQuery = useCollections();
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const priceCeiling = getCatalogPriceCeiling(products);
  const currencyCode = products[0]?.price.currencyCode ?? 'USD';
  const filtered = useMemo(() => filterProducts(products, filters), [filters, products]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shownProducts =
    mode === 'pages'
      ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : filtered.slice(0, visibleCount);

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.query) next.set('q', filters.query);
    if (filters.collection) next.set('collection', filters.collection);
    if (filters.sort !== DEFAULT_FILTERS.sort) next.set('sort', filters.sort);
    setSearchParams(next, { replace: true });
  }, [filters.query, filters.collection, filters.sort, setSearchParams]);

  const handleFiltersChange = useCallback((nextFilters: ProductFiltersState) => {
    setPage(1);
    setVisibleCount(PAGE_SIZE);
    setFilters(nextFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setPage(1);
    setVisibleCount(PAGE_SIZE);
    setFilters({ ...DEFAULT_FILTERS, maxPrice: priceCeiling });
  }, [priceCeiling]);

  useEffect(() => {
    if (mode !== 'infinite' || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting)
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length));
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filtered.length, mode]);

  const filterPanel = (
    <ProductFilters
      filters={filters}
      collections={collectionsQuery.data ?? []}
      priceCeiling={priceCeiling}
      currencyCode={currencyCode}
      onChange={handleFiltersChange}
      onReset={resetFilters}
    />
  );

  return (
    <>
      <PageHeader
        eyebrow="The full collection"
        title="Find your next everyday favorite"
        description="Filter the edit by collection, price, availability, or whatever you have in mind."
      />
      <div className="page-shell py-10 sm:py-14">
        <div className="mb-7 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            <strong className="text-ink-900 dark:text-white">{filtered.length}</strong> products
          </p>
          <div className="flex items-center gap-2">
            <Button
              className="lg:hidden"
              size="sm"
              variant="secondary"
              icon={<ListFilter className="size-4" />}
              onClick={() => setMobileFilters(true)}
            >
              Filters
            </Button>
            <div className="surface flex rounded-full border p-1" aria-label="Browse mode">
              <button
                className={`focus-ring rounded-full p-2 ${mode === 'pages' ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950' : ''}`}
                onClick={() => setMode('pages')}
                aria-label="Paginated view"
                aria-pressed={mode === 'pages'}
              >
                <Grid2X2 className="size-4" />
              </button>
              <button
                className={`focus-ring rounded-full p-2 ${mode === 'infinite' ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950' : ''}`}
                onClick={() => setMode('infinite')}
                aria-label="Infinite scroll view"
                aria-pressed={mode === 'infinite'}
              >
                <Rows3 className="size-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
          <div className="hidden lg:block">{filterPanel}</div>
          <div>
            {productsQuery.isLoading ? (
              <ProductGridSkeleton count={12} />
            ) : productsQuery.isError ? (
              <EmptyState
                icon={X}
                title="The collection is unavailable"
                description="We could not reach the catalog. Please check your connection and try again."
                action={<Button onClick={() => void productsQuery.refetch()}>Try again</Button>}
              />
            ) : shownProducts.length === 0 ? (
              <EmptyState
                icon={ListFilter}
                title="No products match"
                description="Try widening your price filter, or search for something else."
                action={<Button onClick={resetFilters}>Reset filters</Button>}
              />
            ) : (
              <ProductGrid products={shownProducts} priorityCount={4} />
            )}
            {mode === 'pages' && filtered.length > PAGE_SIZE ? (
              <nav
                className="mt-12 flex items-center justify-center gap-2"
                aria-label="Product pages"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => {
                  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
                  const number = start + index;
                  if (number > pageCount) return null;
                  return (
                    <button
                      key={number}
                      className={`focus-ring grid size-9 place-items-center rounded-full text-sm font-semibold ${page === number ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950' : 'hover:bg-ink-100 dark:hover:bg-white/8'}`}
                      onClick={() => setPage(number)}
                      aria-current={page === number ? 'page' : undefined}
                    >
                      {number}
                    </button>
                  );
                })}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page === pageCount}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </nav>
            ) : null}
            {mode === 'infinite' ? (
              <div ref={sentinelRef} className="mt-10 h-4" aria-hidden="true" />
            ) : null}
          </div>
        </div>
      </div>
      {mobileFilters ? (
        <div
          className="fixed inset-0 z-50 bg-ink-950/45"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setMobileFilters(false);
          }}
        >
          <aside
            className="surface ml-auto h-full w-[min(22rem,90vw)] overflow-auto border-l p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
          >
            <div className="mb-7 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Filters</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobileFilters(false)}
                aria-label="Close filters"
              >
                <X className="size-5" />
              </Button>
            </div>
            {filterPanel}
            <Button className="mt-8 w-full" onClick={() => setMobileFilters(false)}>
              Show {filtered.length} products
            </Button>
          </aside>
        </div>
      ) : null}
    </>
  );
}
