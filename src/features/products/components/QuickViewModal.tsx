import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { useCartStore } from '@/features/cart/cart-store';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { useProduct } from '@/features/products/product-queries';
import { toProductSnapshot } from '@/types/product';

export function QuickViewModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const productId = useDiscoveryStore((state) => state.quickViewProductId);
  const close = useDiscoveryStore((state) => state.closeQuickView);
  const addItem = useCartStore((state) => state.addItem);
  const productQuery = useProduct(productId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (productId !== null && !dialog.open) dialog.showModal();
    if (productId === null && dialog.open) dialog.close();
  }, [productId]);

  const product = productQuery.data;

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(56rem,calc(100%-2rem))] rounded-3xl bg-transparent p-0 text-inherit backdrop:bg-ink-950/55 backdrop:backdrop-blur-sm"
      onClose={close}
      onCancel={close}
      aria-label="Product quick view"
    >
      <div className="surface relative overflow-hidden rounded-3xl border shadow-soft">
        <Button
          className="absolute top-4 right-4 z-10"
          size="icon"
          variant="secondary"
          onClick={close}
          aria-label="Close quick view"
        >
          <X className="size-5" />
        </Button>
        {productQuery.isLoading ? (
          <div className="grid gap-7 p-6 md:grid-cols-2">
            <Skeleton className="aspect-square" />
            <div className="space-y-4 py-8">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : product ? (
          <div className="grid md:grid-cols-2">
            <div className="grid min-h-80 place-items-center bg-ink-100 p-8 dark:bg-ink-800">
              <img
                className="max-h-96 w-full object-contain"
                src={product.thumbnail}
                alt={product.title}
              />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <p className="text-xs font-bold tracking-wider text-moss-700 uppercase dark:text-moss-300">
                {product.brand ?? product.category}
              </p>
              <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
                {product.title}
              </h2>
              <div className="mt-3">
                <StarRating rating={product.rating} count={product.reviews.length} />
              </div>
              <p className="mt-5 line-clamp-3 leading-7 text-ink-500 dark:text-ink-400">
                {product.description}
              </p>
              <div className="mt-6">
                <ProductPrice
                  price={product.price}
                  discountPercentage={product.discountPercentage}
                  size="lg"
                />
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  onClick={() => {
                    addItem(toProductSnapshot(product));
                    toast.success('Added to your bag');
                  }}
                >
                  Add to bag
                </Button>
                <Link
                  onClick={close}
                  className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-ink-200 px-5 text-sm font-semibold dark:border-white/15"
                  to={`/products/${product.id}`}
                >
                  Full details
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <p className="p-12 text-center">This product could not be loaded.</p>
        )}
      </div>
    </dialog>
  );
}
