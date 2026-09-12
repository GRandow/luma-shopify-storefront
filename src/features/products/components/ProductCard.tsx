import { memo } from 'react';
import { Eye, GitCompareArrows, Heart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCartDrawer } from '@/features/cart/cart-drawer-store';
import { useAddToCart } from '@/features/cart/cart-queries';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { getDiscountPercentage, type ProductSnapshot } from '@/types/product';
import { cn } from '@/utils/cn';
import { formatHandle } from '@/utils/format';

interface ProductCardProps {
  product: ProductSnapshot;
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const addToCart = useAddToCart();
  const openCartDrawer = useCartDrawer((state) => state.open);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) =>
    state.items.some((item) => item.id === product.id),
  );
  const openQuickView = useDiscoveryStore((state) => state.openQuickView);
  const compareItems = useDiscoveryStore((state) => state.compareItems);
  const toggleCompare = useDiscoveryStore((state) => state.toggleCompare);
  const isCompared = compareItems.some((item) => item.id === product.id);
  const discount = getDiscountPercentage(product.price, product.compareAtPrice);
  const productUrl = `/products/${product.handle}`;

  function addToBag() {
    // Products with options (size, colour…) need a choice first: open quick view.
    if (product.requiresVariantSelection || !product.defaultVariantId) {
      openQuickView(product.handle);
      return;
    }
    addToCart.mutate([{ merchandiseId: product.defaultVariantId, quantity: 1 }], {
      onSuccess: openCartDrawer,
      onError: (error) => toast.error(error.message),
    });
  }

  function compare() {
    const accepted = toggleCompare(product);
    if (!accepted) toast.error('You can compare up to three products at a time.');
  }

  return (
    <article className="group relative min-w-0">
      <div className="relative isolate aspect-square overflow-hidden rounded-[1.4rem] bg-ink-100 dark:bg-ink-800">
        <Link to={productUrl} className="focus-ring block h-full rounded-[1.4rem]">
          <ProductImage
            image={product.image}
            alt={product.title}
            priority={priority}
            className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        {!product.availableForSale ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-bold text-ink-900 shadow-sm backdrop-blur">
            Sold out
          </span>
        ) : discount >= 10 ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-bold text-ink-900 shadow-sm backdrop-blur">
            -{discount}%
          </span>
        ) : null}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            className={cn(
              'focus-ring grid size-9 place-items-center rounded-full bg-white/90 text-ink-800 shadow-sm backdrop-blur transition hover:bg-white',
              isWishlisted && 'text-coral',
            )}
            onClick={() => {
              toggleWishlist(product);
              toast.success(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('size-4', isWishlisted && 'fill-current')} aria-hidden="true" />
          </button>
          <button
            className={cn(
              'focus-ring grid size-9 place-items-center rounded-full bg-white/90 text-ink-800 opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 focus:opacity-100',
              isCompared && 'bg-moss-100 text-moss-800 opacity-100',
            )}
            onClick={compare}
            aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}
          >
            <GitCompareArrows className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="absolute right-3 bottom-3 left-3 flex translate-y-3 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
          <Button
            className="min-w-0 flex-1"
            size="sm"
            icon={<Plus className="size-4" />}
            loading={addToCart.isPending}
            disabled={!product.availableForSale}
            onClick={addToBag}
          >
            {product.availableForSale ? 'Add' : 'Sold out'}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="size-9"
            onClick={() => openQuickView(product.handle)}
            aria-label={`Quick view ${product.title}`}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="pt-4">
        <p className="truncate text-[0.68rem] font-bold tracking-wider text-ink-400 uppercase">
          {product.vendor || (product.collection ? formatHandle(product.collection) : 'Luma')}
        </p>
        <h3 className="mt-1 truncate font-medium text-ink-900 dark:text-ink-100">
          <Link
            className="focus-ring rounded hover:text-moss-700 dark:hover:text-moss-300"
            to={productUrl}
          >
            {product.title}
          </Link>
        </h3>
        <div className="mt-2">
          <ProductPrice
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            from={product.priceVaries}
          />
        </div>
      </div>
    </article>
  );
});
