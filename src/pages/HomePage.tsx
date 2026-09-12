import { useMemo, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { useCollections, useProducts } from '@/features/products/product-queries';
import { getProductImage, type Collection, type Product } from '@/types/product';

const benefits: Array<{ icon: LucideIcon; title: string; detail: string }> = [
  { icon: PackageCheck, title: 'Free delivery', detail: 'Orders over $100' },
  { icon: RotateCcw, title: 'Easy returns', detail: 'Within 30 days' },
  { icon: ShieldCheck, title: 'Secure payment', detail: 'Shopify checkout' },
  { icon: Check, title: 'Curated quality', detail: 'Considered goods' },
];

/** A collection's own image, or the first product photo from it. */
function getCollectionCover(collection: Collection, products: Product[]) {
  if (collection.image) return collection.image;
  const product = products.find((item) =>
    item.collections.some((entry) => entry.handle === collection.handle),
  );
  return product ? getProductImage(product) : null;
}

export default function HomePage() {
  const productsQuery = useProducts();
  const collectionsQuery = useCollections();
  const recentlyViewed = useDiscoveryStore((state) => state.recentlyViewed);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  // The catalog arrives in best-selling order, which is exactly the "featured" edit.
  const featured = useMemo(
    () => products.filter((product) => product.availableForSale).slice(0, 8),
    [products],
  );
  const newArrivals = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
    [products],
  );
  const popularCollections = collectionsQuery.data?.slice(0, 6) ?? [];

  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    toast.success('Welcome to the Luma list. Check your inbox soon.');
  }

  return (
    <>
      <section className="page-shell pt-4 sm:pt-7">
        <div className="flex flex-col justify-center overflow-hidden rounded-[2rem] bg-[#dce9d7] px-6 py-14 sm:px-12 sm:py-20 lg:min-h-[34rem] lg:px-16 dark:bg-moss-900">
          <Badge className="w-fit bg-white/70" tone="success">
            Autumn collection · 2026
          </Badge>
          <h1 className="font-display mt-6 text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.06em] text-ink-950 sm:text-6xl dark:text-white">
            Fewer things. Better chosen.
          </h1>
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <p className="max-w-xl text-base leading-7 text-ink-700 sm:text-lg dark:text-moss-100">
              Thoughtful essentials with lasting form, honest materials, and a quiet point of view.
            </p>
            {/* Two equal columns, so the buttons always share one width. */}
            <div className="grid shrink-0 gap-3 sm:grid-cols-2">
              <Link
                to="/products"
                className="focus-ring inline-flex h-13 items-center justify-center gap-2 rounded-full bg-ink-950 px-6 font-semibold whitespace-nowrap text-white transition hover:bg-moss-700 dark:bg-white dark:text-ink-950"
              >
                Explore the collection <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/collections"
                className="focus-ring inline-flex h-13 items-center justify-center rounded-full border border-ink-950/15 bg-white/25 px-6 font-semibold whitespace-nowrap backdrop-blur transition hover:bg-white/50 dark:border-white/20"
              >
                Browse collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Four equal cards spanning the same width as the hero: one column on
          phones, two on tablets, four on desktop. */}
      <section
        className="page-shell mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
        aria-label="Store benefits"
      >
        {benefits.map(({ icon: Icon, title, detail }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl border border-ink-950/10 px-5 py-4 lg:gap-5 lg:px-6 lg:py-6 dark:border-white/12"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-moss-100 text-moss-800 lg:size-14 dark:bg-moss-900 dark:text-moss-200">
              <Icon className="size-6 lg:size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold lg:text-lg">{title}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">{detail}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="page-shell py-18">
        <SectionHeading
          eyebrow="Curated edit"
          title="Objects people keep reaching for"
          action={
            <Link
              className="focus-ring hidden items-center gap-1 rounded text-sm font-semibold sm:flex"
              to="/products"
            >
              Shop all <ArrowRight className="size-4" />
            </Link>
          }
        />
        {productsQuery.isLoading ? (
          <ProductGridSkeleton />
        ) : (
          <ProductGrid products={featured} priorityCount={4} />
        )}
      </section>

      <section className="bg-sand py-18 dark:bg-ink-900">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Shop by room and ritual"
            title="Popular collections"
            description="A useful way into the collection, organized around the things you actually do."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {popularCollections.map((collection, index) => {
              const cover = getCollectionCover(collection, products);
              return (
                <Link
                  key={collection.handle}
                  to={`/products?collection=${collection.handle}`}
                  className="focus-ring group overflow-hidden rounded-3xl bg-white p-3 shadow-card transition hover:-translate-y-1 dark:bg-ink-800"
                >
                  <div className="isolate aspect-square overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-700">
                    <ProductImage
                      className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-110"
                      image={cover}
                      alt=""
                      sizes="(min-width: 1024px) 13rem, (min-width: 640px) 33vw, 50vw"
                    />
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold">{collection.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">Collection {index + 1}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-shell py-18">
        <SectionHeading
          eyebrow="Just landed"
          title="New arrivals"
          description="Fresh additions selected for usefulness, material honesty, and good company."
        />
        {productsQuery.isLoading ? <ProductGridSkeleton /> : <ProductGrid products={newArrivals} />}
      </section>

      <section className="page-shell">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink-950 px-7 py-14 text-white sm:px-14 sm:py-18">
          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-bold tracking-[0.18em] text-moss-300 uppercase">
              The considered home event
            </p>
            <h2 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Up to 20% off the edit.
            </h2>
            <p className="mt-4 leading-7 text-ink-300">
              Use code <strong className="text-white">LUMA20</strong> at checkout on orders over
              $150. Ends when the good pieces are gone.
            </p>
            <Link
              className="focus-ring mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink-950"
              to="/products"
            >
              Shop the event <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="absolute -top-28 -right-20 size-96 rounded-full border-[4rem] border-moss-700/30" />
          <div className="absolute right-40 -bottom-20 size-60 rounded-full bg-coral/20 blur-3xl" />
        </div>
      </section>

      {recentlyViewed.length > 0 ? (
        <section className="page-shell py-18">
          <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
            {recentlyViewed.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="page-shell py-18">
        <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-14 text-center shadow-card sm:px-12 dark:border-white/8 dark:bg-ink-900">
          <p className="text-xs font-bold tracking-[0.18em] text-moss-700 uppercase dark:text-moss-300">
            Notes from Luma
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Useful things, thoughtfully delivered.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-500 dark:text-ink-400">
            New arrivals, design stories, and the occasional good offer. No inbox clutter.
          </p>
          <form
            className="mx-auto mt-7 flex max-w-lg flex-col gap-2 sm:flex-row"
            onSubmit={subscribe}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              required
              type="email"
              placeholder="you@example.com"
              className="focus-ring h-12 min-w-0 flex-1 rounded-full border border-ink-200 bg-transparent px-5 dark:border-white/15"
            />
            <Button type="submit" size="lg">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
