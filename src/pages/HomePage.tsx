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
import { useCategories, useProducts } from '@/features/products/product-queries';
import { getProductImage } from '@/types/product';

const benefits: Array<{ icon: LucideIcon; title: string; detail: string }> = [
  { icon: PackageCheck, title: 'Free delivery', detail: 'Orders over $100' },
  { icon: RotateCcw, title: 'Easy returns', detail: 'Within 30 days' },
  { icon: ShieldCheck, title: 'Secure payment', detail: 'Protected checkout' },
  { icon: Check, title: 'Curated quality', detail: 'Considered goods' },
];

export default function HomePage() {
  const productQuery = useProducts({ limit: 0 });
  const categoriesQuery = useCategories();
  const recentlyViewed = useDiscoveryStore((state) => state.recentlyViewed);

  const featured = useMemo(
    () => [...(productQuery.data?.products ?? [])].sort((a, b) => b.rating - a.rating).slice(0, 8),
    [productQuery.data],
  );
  const newArrivals = useMemo(
    () => [...(productQuery.data?.products ?? [])].sort((a, b) => b.id - a.id).slice(0, 8),
    [productQuery.data],
  );
  const popularCategories = categoriesQuery.data?.slice(0, 6) ?? [];
  const heroProduct = featured[0];

  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    toast.success('Welcome to the Luma list. Check your inbox soon.');
  }

  return (
    <>
      <section className="page-shell pt-4 sm:pt-7">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#dce9d7] px-6 py-14 sm:px-12 sm:py-20 lg:min-h-[38rem] lg:px-16 dark:bg-moss-900">
          <div className="relative z-10 max-w-xl">
            <Badge className="mb-6 bg-white/70" tone="success">
              Spring collection · 2026
            </Badge>
            <h1 className="font-display text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.06em] text-ink-950 sm:text-6xl lg:text-7xl dark:text-white">
              Fewer things. Better chosen.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-ink-700 sm:text-lg dark:text-moss-100">
              Thoughtful essentials with lasting form, honest materials, and a quiet point of view.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="focus-ring inline-flex h-13 items-center gap-2 rounded-full bg-ink-950 px-6 font-semibold text-white transition hover:bg-moss-700 dark:bg-white dark:text-ink-950"
              >
                Explore the collection <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/categories"
                className="focus-ring inline-flex h-13 items-center rounded-full border border-ink-950/15 bg-white/25 px-6 font-semibold backdrop-blur transition hover:bg-white/50 dark:border-white/20"
              >
                Browse categories
              </Link>
            </div>
          </div>
          {heroProduct ? (
            <div className="pointer-events-none absolute top-[7%] right-[4%] hidden aspect-square h-[86%] lg:block">
              <div className="absolute inset-12 rounded-full bg-white/40 blur-3xl" />
              <ProductImage
                className="relative h-full w-full rotate-[-5deg] drop-shadow-2xl"
                src={getProductImage(heroProduct)}
                thumbnail={heroProduct.thumbnail}
                sizes="(min-width: 1024px) 32rem, 1px"
                priority
              />
            </div>
          ) : null}
          <div className="absolute top-8 right-8 size-24 rounded-full border border-ink-950/10" />
          <div className="absolute right-32 bottom-12 size-3 rounded-full bg-coral" />
        </div>
      </section>

      <section
        className="page-shell grid grid-cols-2 gap-4 border-b border-black/5 py-8 sm:grid-cols-4 dark:border-white/8"
        aria-label="Store benefits"
      >
        {benefits.map(({ icon: Icon, title, detail }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="size-5 text-moss-700 dark:text-moss-300" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink-400">{detail}</p>
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
        {productQuery.isLoading ? (
          <ProductGridSkeleton />
        ) : (
          <ProductGrid products={featured} priorityCount={4} />
        )}
      </section>

      <section className="bg-sand py-18 dark:bg-ink-900">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Shop by room and ritual"
            title="Popular categories"
            description="A useful way into the collection, organized around the things you actually do."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {popularCategories.map((category, index) => {
              const cover = productQuery.data?.products.find(
                (product) => product.category === category.slug,
              );
              return (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className="focus-ring group overflow-hidden rounded-3xl bg-white p-3 shadow-card transition hover:-translate-y-1 dark:bg-ink-800"
                >
                  <div className="isolate aspect-square overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-700">
                    {cover ? (
                      <ProductImage
                        className="h-full w-full p-3 transition-transform duration-500 ease-out group-hover:scale-110"
                        src={getProductImage(cover)}
                        thumbnail={cover.thumbnail}
                        sizes="(min-width: 1024px) 13rem, (min-width: 640px) 33vw, 50vw"
                      />
                    ) : null}
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold">{category.name}</p>
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
        {productQuery.isLoading ? <ProductGridSkeleton /> : <ProductGrid products={newArrivals} />}
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
              Use code <strong className="text-white">LUMA20</strong> on orders over $150. Ends when
              the good pieces are gone.
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
            New arrivals, design stories, and the occasional genuinely good offer. No inbox clutter.
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
