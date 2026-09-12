import { ArrowUpRight, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { useCollections, useProducts } from '@/features/products/product-queries';
import { getProductImage } from '@/types/product';
import { formatHandle } from '@/utils/format';

export default function CollectionsPage() {
  const collectionsQuery = useCollections();
  const productsQuery = useProducts();
  const recentCollections = useDiscoveryStore((state) => state.recentCollections);
  const collections = collectionsQuery.data ?? [];
  const products = productsQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Browse the edit"
        title="Collections for every part of the day"
        description="From the kitchen counter to what you carry, each collection is tightly considered."
      />
      <div className="page-shell py-14">
        {recentCollections.length > 0 ? (
          <div className="mb-10 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold">Recently visited</span>
            {recentCollections.map((handle) => (
              <Link
                key={handle}
                to={`/products?collection=${handle}`}
                className="focus-ring rounded-full bg-moss-100 px-3 py-1.5 text-sm text-moss-800 dark:bg-moss-900 dark:text-moss-200"
              >
                {collections.find((collection) => collection.handle === handle)?.title ??
                  formatHandle(handle)}
              </Link>
            ))}
          </div>
        ) : null}
        {collectionsQuery.isLoading || productsQuery.isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : collectionsQuery.isError ? (
          <EmptyState
            icon={Layers3}
            title="Collections are unavailable"
            description="We could not load the collection index right now."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, index) => {
              const members = products.filter((product) =>
                product.collections.some((entry) => entry.handle === collection.handle),
              );
              const cover = collection.image ?? (members[0] ? getProductImage(members[0]) : null);
              const wide = index % 7 === 0;
              return (
                <Link
                  key={collection.handle}
                  to={`/products?collection=${collection.handle}`}
                  className={`focus-ring group relative flex flex-col gap-5 overflow-hidden rounded-[1.7rem] bg-ink-100 p-6 sm:flex-row sm:items-center sm:gap-6 dark:bg-ink-800 ${wide ? 'sm:col-span-2' : ''}`}
                >
                  {/* Text and photo sit side by side in normal flow, so long
                      descriptions wrap instead of running underneath the picture. */}
                  <div className="min-w-0 flex-1 pr-10 sm:pr-4">
                    <p className="text-xs font-bold tracking-wider text-moss-700 uppercase dark:text-moss-300">
                      Collection {String(index + 1).padStart(2, '0')}
                    </p>
                    <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
                      {collection.title}
                    </h2>
                    {collection.description ? (
                      <p className="mt-2 line-clamp-3 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
                        {collection.description}
                      </p>
                    ) : null}
                    <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-ink-600 transition group-hover:text-moss-700 dark:text-ink-300 dark:group-hover:text-moss-300">
                      {members.length} curated piece{members.length === 1 ? '' : 's'}
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </p>
                  </div>
                  {cover ? (
                    <div
                      className={`aspect-square shrink-0 overflow-hidden rounded-2xl transition-transform duration-500 ease-out group-hover:scale-105 group-hover:rotate-2 ${wide ? 'w-40 sm:w-48' : 'w-36 sm:w-40'}`}
                    >
                      <ProductImage className="h-full w-full" image={cover} alt="" sizes="13rem" />
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
