import { ArrowUpRight, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { useCategories, useProducts } from '@/features/products/product-queries';
import { formatCategory } from '@/utils/format';

export default function CategoriesPage() {
  const categoriesQuery = useCategories();
  const productsQuery = useProducts({ limit: 0 });
  const recentCategories = useDiscoveryStore((state) => state.recentCategories);

  return (
    <>
      <PageHeader
        eyebrow="Browse the edit"
        title="Collections for every part of the day"
        description="From the kitchen counter to what you carry, each collection is tightly considered."
      />
      <div className="page-shell py-14">
        {recentCategories.length > 0 ? (
          <div className="mb-10 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold">Recently visited</span>
            {recentCategories.map((category) => (
              <Link
                key={category}
                to={`/products?category=${category}`}
                className="focus-ring rounded-full bg-moss-100 px-3 py-1.5 text-sm text-moss-800 dark:bg-moss-900 dark:text-moss-200"
              >
                {formatCategory(category)}
              </Link>
            ))}
          </div>
        ) : null}
        {categoriesQuery.isLoading || productsQuery.isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : categoriesQuery.isError ? (
          <EmptyState
            icon={Layers3}
            title="Collections are unavailable"
            description="We could not load the category index right now."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesQuery.data?.map((category, index) => {
              const products =
                productsQuery.data?.products.filter(
                  (product) => product.category === category.slug,
                ) ?? [];
              const image = products[0]?.thumbnail;
              return (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className={`focus-ring group relative min-h-72 overflow-hidden rounded-[1.7rem] bg-ink-100 p-7 dark:bg-ink-800 ${index % 7 === 0 ? 'sm:col-span-2' : ''}`}
                >
                  <div className="relative z-10">
                    <p className="text-xs font-bold tracking-wider text-moss-700 uppercase dark:text-moss-300">
                      Collection {String(index + 1).padStart(2, '0')}
                    </p>
                    <h2 className="font-display mt-2 max-w-xs text-3xl font-semibold tracking-tight">
                      {category.name}
                    </h2>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                      {products.length} curated pieces
                    </p>
                  </div>
                  {image ? (
                    <img
                      className="absolute right-[-5%] bottom-[-8%] h-[78%] w-[58%] object-contain transition duration-500 group-hover:scale-110 group-hover:rotate-2"
                      src={image}
                      alt=""
                      loading="lazy"
                    />
                  ) : null}
                  <span className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white/70 opacity-0 transition group-hover:opacity-100 dark:bg-white/10">
                    <ArrowUpRight className="size-5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
