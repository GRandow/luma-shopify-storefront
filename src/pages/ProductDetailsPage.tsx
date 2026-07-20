import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StarRating } from '@/components/ui/StarRating';
import { useCartStore } from '@/features/cart/cart-store';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { ImageGallery } from '@/features/products/components/ImageGallery';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { useProduct, useProducts } from '@/features/products/product-queries';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { toProductSnapshot } from '@/types/product';
import { formatCategory, formatDate } from '@/utils/format';

export default function ProductDetailsPage() {
  const productId = Number(useParams().productId);
  const productQuery = useProduct(Number.isFinite(productId) ? productId : null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) =>
    state.items.some((item) => item.id === productId),
  );
  const recordView = useDiscoveryStore((state) => state.recordView);
  const recordCategory = useDiscoveryStore((state) => state.recordCategory);
  const relatedQuery = useProducts({ category: productQuery.data?.category, limit: 8 });
  const related = useMemo(
    () => relatedQuery.data?.products.filter((item) => item.id !== productId).slice(0, 4) ?? [],
    [productId, relatedQuery.data],
  );

  useEffect(() => {
    if (!productQuery.data) return;
    recordView(toProductSnapshot(productQuery.data));
    recordCategory(productQuery.data.category);
  }, [productQuery.data, recordCategory, recordView]);

  if (productQuery.isLoading) {
    return (
      <div className="page-shell grid gap-10 py-14 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-5 py-6">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  const product = productQuery.data;
  if (!product) {
    return (
      <div className="page-shell py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Product not found"
          description="This item may have moved or is no longer part of the collection."
          action={
            <Link
              className="focus-ring inline-flex h-11 items-center rounded-full bg-ink-950 px-5 text-sm font-semibold text-white"
              to="/products"
            >
              Browse the collection
            </Link>
          }
        />
      </div>
    );
  }

  const snapshot = toProductSnapshot(product);

  async function shareProduct(title: string, description: string) {
    const shareData = { title, text: description, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied');
    }
  }

  return (
    <>
      <div className="page-shell py-5 text-sm text-ink-400">
        <Link className="hover:text-ink-900 dark:hover:text-white" to="/products">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link
          className="hover:text-ink-900 dark:hover:text-white"
          to={`/products?category=${product.category}`}
        >
          {formatCategory(product.category)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-600 dark:text-ink-300">{product.title}</span>
      </div>
      <section className="page-shell grid gap-10 pb-18 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <ImageGallery
          images={product.images.length > 0 ? product.images : [product.thumbnail]}
          title={product.title}
        />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold tracking-[0.16em] text-moss-700 uppercase dark:text-moss-300">
              {product.brand ?? formatCategory(product.category)}
            </p>
            <Badge tone={product.stock > 10 ? 'success' : 'warning'}>
              {product.availabilityStatus}
            </Badge>
          </div>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {product.title}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <StarRating rating={product.rating} count={product.reviews.length} />
            <span className="h-4 w-px bg-ink-200 dark:bg-white/15" />
            <span className="text-sm text-ink-500">SKU {product.sku}</span>
          </div>
          <div className="mt-7">
            <ProductPrice
              price={product.price}
              discountPercentage={product.discountPercentage}
              size="lg"
            />
          </div>
          <p className="mt-6 leading-7 text-ink-600 dark:text-ink-300">{product.description}</p>
          <div className="mt-8 flex items-center gap-3">
            <div
              className="surface flex h-12 items-center rounded-full border p-1"
              aria-label="Quantity selector"
            >
              <button
                className="focus-ring grid size-9 place-items-center rounded-full hover:bg-ink-100 dark:hover:bg-white/8"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <output
                className="w-8 text-center text-sm font-semibold"
                aria-label={`Quantity ${quantity}`}
              >
                {quantity}
              </output>
              <button
                className="focus-ring grid size-9 place-items-center rounded-full hover:bg-ink-100 dark:hover:bg-white/8"
                onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              icon={<ShoppingBag className="size-5" />}
              onClick={() => {
                addItem(snapshot, quantity);
                toast.success(`${quantity} × ${product.title} added to your bag`);
              }}
            >
              Add to bag
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="size-12"
              onClick={() => {
                toggleWishlist(snapshot);
                toast.success(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
              }}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`size-5 ${isWishlisted ? 'fill-coral text-coral' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-12"
              onClick={() => void shareProduct(product.title, product.description)}
              aria-label="Share product"
            >
              <Share2 className="size-5" />
            </Button>
          </div>
          <div className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/5 px-5 dark:divide-white/8 dark:border-white/8">
            {(
              [
                { icon: Truck, text: product.shippingInformation },
                { icon: ShieldCheck, text: product.warrantyInformation },
                { icon: Check, text: product.returnPolicy },
              ] satisfies Array<{ icon: LucideIcon; text: string }>
            ).map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 py-4 text-sm">
                <Icon className="size-5 text-moss-700 dark:text-moss-300" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand py-18 dark:bg-ink-900">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Verified feedback"
            title={`What people are saying (${product.reviews.length})`}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {product.reviews.map((review) => (
              <article
                key={`${review.reviewerEmail}-${review.date}`}
                className="rounded-3xl bg-white p-6 shadow-card dark:bg-ink-800"
              >
                <StarRating rating={review.rating} />
                <blockquote className="mt-4 leading-7">“{review.comment}”</blockquote>
                <div className="mt-6 border-t border-black/5 pt-4 text-sm dark:border-white/8">
                  <p className="font-semibold">{review.reviewerName}</p>
                  <time className="text-xs text-ink-400" dateTime={review.date}>
                    {formatDate(review.date)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-18">
        <SectionHeading eyebrow="You may also like" title="More from this collection" />
        {relatedQuery.isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <ProductGrid products={related} />
        )}
      </section>
    </>
  );
}
