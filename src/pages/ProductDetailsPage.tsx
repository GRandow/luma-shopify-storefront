import { useEffect, useMemo, useState } from 'react';
import { Check, Heart, Minus, Plus, Share2, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useCartDrawer } from '@/features/cart/cart-drawer-store';
import { useAddToCart } from '@/features/cart/cart-queries';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { ImageGallery } from '@/features/products/components/ImageGallery';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { VariantSelector } from '@/features/products/components/VariantSelector';
import {
  useProduct,
  useProductRecommendations,
  useProducts,
} from '@/features/products/product-queries';
import { useVariantSelection } from '@/features/products/use-variant-selection';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import {
  getProductImage,
  toProductSnapshot,
  type Product,
  type ProductVariant,
  type StorefrontImage,
} from '@/types/product';
import { formatHandle } from '@/utils/format';

const LOW_STOCK_THRESHOLD = 5;
const UNTRACKED_STOCK_LIMIT = 99;

function ProductDetailsSkeleton() {
  return (
    <div className="page-shell grid gap-10 py-14 lg:grid-cols-2" aria-busy="true">
      <Skeleton className="aspect-square" />
      <div className="space-y-5 py-6">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

function getAvailability(variant: ProductVariant | undefined) {
  if (!variant || !variant.availableForSale) return { label: 'Sold out', tone: 'warning' } as const;
  if (variant.quantityAvailable !== null && variant.quantityAvailable <= LOW_STOCK_THRESHOLD) {
    return { label: `Only ${variant.quantityAvailable} left`, tone: 'warning' } as const;
  }
  return { label: 'In stock', tone: 'success' } as const;
}

/** Related products: Shopify's recommendations, or siblings from the first collection. */
function useRelatedProducts(product: Product) {
  const recommendationsQuery = useProductRecommendations(product.id);
  const collectionHandle = product.collections[0]?.handle;
  const needsFallback =
    recommendationsQuery.isSuccess &&
    recommendationsQuery.data.length === 0 &&
    collectionHandle !== undefined;
  const fallbackQuery = useProducts({ collection: collectionHandle }, { enabled: needsFallback });

  const related = useMemo(() => {
    const source = needsFallback ? (fallbackQuery.data ?? []) : (recommendationsQuery.data ?? []);
    return source.filter((item) => item.id !== product.id).slice(0, 4);
  }, [fallbackQuery.data, needsFallback, product.id, recommendationsQuery.data]);

  return {
    related,
    isLoading: recommendationsQuery.isLoading || (needsFallback && fallbackQuery.isLoading),
  };
}

export default function ProductDetailsPage() {
  const handle = useParams().handle ?? '';
  const productQuery = useProduct(handle || null);

  if (productQuery.isLoading) return <ProductDetailsSkeleton />;

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

  // Keyed by handle so option choices and gallery state reset between products.
  return <ProductDetails key={product.handle} product={product} />;
}

function ProductDetails({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [pickedImage, setPickedImage] = useState<StorefrontImage | null>(null);
  const addToCart = useAddToCart();
  const openCartDrawer = useCartDrawer((state) => state.open);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) =>
    state.items.some((item) => item.id === product.id),
  );
  const recordView = useDiscoveryStore((state) => state.recordView);
  const recordCollection = useDiscoveryStore((state) => state.recordCollection);
  const { selectedOptions, selectedVariant, select } = useVariantSelection(product);
  const { related, isLoading: relatedLoading } = useRelatedProducts(product);

  const snapshot = toProductSnapshot(product);
  const availability = getAvailability(selectedVariant);
  const canAdd = selectedVariant !== undefined && selectedVariant.availableForSale;
  const maxQuantity = Math.max(1, selectedVariant?.quantityAvailable ?? UNTRACKED_STOCK_LIMIT);
  const galleryImages =
    product.images.length > 0
      ? product.images
      : product.featuredImage
        ? [product.featuredImage]
        : [];
  // A thumbnail the shopper picked wins; otherwise follow the selected variant's photo.
  const activeImage = pickedImage ?? selectedVariant?.image ?? getProductImage(product);
  const primaryCollection = product.collections[0];

  useEffect(() => {
    recordView(toProductSnapshot(product));
    const collection = product.collections[0];
    if (collection) recordCollection(collection.handle);
  }, [product, recordCollection, recordView]);

  function selectOption(name: string, value: string) {
    select(name, value);
    setPickedImage(null);
  }

  function addToBag() {
    if (!selectedVariant) return;
    addToCart.mutate([{ merchandiseId: selectedVariant.id, quantity }], {
      onSuccess: openCartDrawer,
      onError: (error) => toast.error(error.message),
    });
  }

  async function shareProduct() {
    const shareData = {
      title: product.title,
      text: product.description,
      url: window.location.href,
    };
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
        {primaryCollection ? (
          <>
            <span className="mx-2">/</span>
            <Link
              className="hover:text-ink-900 dark:hover:text-white"
              to={`/products?collection=${primaryCollection.handle}`}
            >
              {primaryCollection.title}
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="text-ink-600 dark:text-ink-300">{product.title}</span>
      </div>
      <section className="page-shell grid gap-10 pb-18 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <ImageGallery
          images={galleryImages}
          title={product.title}
          selected={activeImage}
          onSelect={setPickedImage}
        />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold tracking-[0.16em] text-moss-700 uppercase dark:text-moss-300">
              {product.vendor || primaryCollection?.title || 'Luma'}
            </p>
            <Badge tone={availability.tone}>{availability.label}</Badge>
          </div>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {product.title}
          </h1>
          {selectedVariant?.sku ? (
            <p className="mt-3 text-sm text-ink-500">SKU {selectedVariant.sku}</p>
          ) : null}
          <div className="mt-6">
            <ProductPrice
              price={selectedVariant?.price ?? product.price}
              compareAtPrice={selectedVariant?.compareAtPrice ?? product.compareAtPrice}
              size="lg"
            />
          </div>
          <p className="mt-6 leading-7 text-ink-600 dark:text-ink-300">{product.description}</p>
          <div className="mt-8">
            <VariantSelector
              product={product}
              selectedOptions={selectedOptions}
              onSelect={selectOption}
            />
          </div>
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
                onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              icon={<ShoppingBag className="size-5" />}
              loading={addToCart.isPending}
              disabled={!canAdd}
              onClick={addToBag}
            >
              {canAdd ? 'Add to bag' : 'Sold out'}
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
              onClick={() => void shareProduct()}
              aria-label="Share product"
            >
              <Share2 className="size-5" />
            </Button>
          </div>
          <div className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/5 px-5 dark:divide-white/8 dark:border-white/8">
            <div className="flex items-center gap-3 py-4 text-sm">
              <Truck className="size-5 text-moss-700 dark:text-moss-300" />
              <span>Free standard shipping on orders over $100</span>
            </div>
            <div className="flex items-center gap-3 py-4 text-sm">
              <ShieldCheck className="size-5 text-moss-700 dark:text-moss-300" />
              <span>Secure payment through Shopify checkout</span>
            </div>
            <div className="flex items-center gap-3 py-4 text-sm">
              <Check className="size-5 text-moss-700 dark:text-moss-300" />
              <span>30-day returns on unworn pieces</span>
            </div>
          </div>
          {product.tags.length > 0 || product.collections.length > 0 ? (
            <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
              {product.collections.length > 0 ? (
                <div>
                  <dt className="text-ink-400">Collections</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {product.collections.map((collection) => (
                      <Link
                        key={collection.handle}
                        className="focus-ring rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium hover:bg-ink-200 dark:bg-white/8 dark:hover:bg-white/12"
                        to={`/products?collection=${collection.handle}`}
                      >
                        {collection.title}
                      </Link>
                    ))}
                  </dd>
                </div>
              ) : null}
              {product.tags.length > 0 ? (
                <div>
                  <dt className="text-ink-400">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-ink-200 px-2.5 py-1 text-xs dark:border-white/15"
                      >
                        {formatHandle(tag)}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </section>

      <section className="page-shell py-18">
        <SectionHeading eyebrow="You may also like" title="More from this collection" />
        {relatedLoading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={related} />}
      </section>
    </>
  );
}
