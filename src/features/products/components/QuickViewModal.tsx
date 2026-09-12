import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCartDrawer } from '@/features/cart/cart-drawer-store';
import { useAddToCart } from '@/features/cart/cart-queries';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { VariantSelector } from '@/features/products/components/VariantSelector';
import { useProduct } from '@/features/products/product-queries';
import { useVariantSelection } from '@/features/products/use-variant-selection';
import { getProductImage, type Product } from '@/types/product';

interface QuickViewContentProps {
  product: Product;
  onClose: () => void;
}

function QuickViewContent({ product, onClose }: QuickViewContentProps) {
  const addToCart = useAddToCart();
  const openCartDrawer = useCartDrawer((state) => state.open);
  const { selectedOptions, selectedVariant, select } = useVariantSelection(product);
  const image = selectedVariant?.image ?? getProductImage(product);
  const canAdd = selectedVariant !== undefined && selectedVariant.availableForSale;

  function addToBag() {
    if (!selectedVariant) return;
    addToCart.mutate([{ merchandiseId: selectedVariant.id, quantity: 1 }], {
      onSuccess: () => {
        onClose();
        openCartDrawer();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="grid md:grid-cols-2">
      <div className="grid place-items-center bg-ink-100 dark:bg-ink-800">
        <ProductImage
          className="aspect-square w-full"
          image={image}
          alt={product.title}
          sizes="(min-width: 768px) 28rem, 90vw"
          priority
        />
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="text-xs font-bold tracking-wider text-moss-700 uppercase dark:text-moss-300">
          {product.vendor}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">{product.title}</h2>
        <p className="mt-4 line-clamp-3 leading-7 text-ink-500 dark:text-ink-400">
          {product.description}
        </p>
        <div className="mt-5">
          <ProductPrice
            price={selectedVariant?.price ?? product.price}
            compareAtPrice={selectedVariant?.compareAtPrice ?? product.compareAtPrice}
            size="lg"
          />
        </div>
        <div className="mt-6">
          <VariantSelector
            product={product}
            selectedOptions={selectedOptions}
            onSelect={select}
            size="sm"
          />
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            loading={addToCart.isPending}
            disabled={!canAdd}
            onClick={addToBag}
          >
            {canAdd ? 'Add to bag' : 'Sold out'}
          </Button>
          <Link
            onClick={onClose}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-ink-200 px-5 text-sm font-semibold dark:border-white/15"
            to={`/products/${product.handle}`}
          >
            Full details
          </Link>
        </div>
      </div>
    </div>
  );
}

export function QuickViewModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handle = useDiscoveryStore((state) => state.quickViewHandle);
  const close = useDiscoveryStore((state) => state.closeQuickView);
  const productQuery = useProduct(handle);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (handle !== null && !dialog.open) dialog.showModal();
    if (handle === null && dialog.open) dialog.close();
  }, [handle]);

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
          <QuickViewContent key={product.handle} product={product} onClose={close} />
        ) : (
          <p className="p-12 text-center">This product could not be loaded.</p>
        )}
      </div>
    </dialog>
  );
}
