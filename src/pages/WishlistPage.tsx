import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCartStore } from '@/features/cart/cart-store';
import { ProductCard } from '@/features/products/components/ProductCard';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const clear = useWishlistStore((state) => state.clear);
  const addItem = useCartStore((state) => state.addItem);

  function addAll() {
    items.forEach((item) => addItem(item));
    toast.success(`${items.length} item${items.length === 1 ? '' : 's'} added to your bag`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Saved for later"
        title={`Wishlist${items.length > 0 ? ` (${items.length})` : ''}`}
        description="A quiet corner for the pieces you are still thinking about."
      />
      <div className="page-shell py-14">
        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any product to keep it close for later."
            action={
              <Link
                className="focus-ring inline-flex h-11 items-center rounded-full bg-ink-950 px-5 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
                to="/products"
              >
                Discover products
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-8 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={clear}>
                Clear wishlist
              </Button>
              <Button icon={<ShoppingBag className="size-4" />} onClick={addAll}>
                Add all to bag
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
