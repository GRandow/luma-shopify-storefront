import { toast } from 'sonner';
import { useAddToCart, useRemoveCartLines, useUpdateCartLines } from '@/features/cart/cart-queries';
import type { CartLine } from '@/types/cart';

/** Quantity and removal handlers shared by the bag page and the slide-in bag. */
export function useCartLineActions() {
  const addToCart = useAddToCart();
  const updateLines = useUpdateCartLines();
  const removeLines = useRemoveCartLines();

  const remove = (line: CartLine) => {
    removeLines.mutate([line.id], {
      onSuccess: () =>
        toast.success(`${line.merchandise.product.title} removed`, {
          action: {
            label: 'Undo',
            onClick: () =>
              addToCart.mutate([{ merchandiseId: line.merchandise.id, quantity: line.quantity }]),
          },
        }),
      onError: (error) => toast.error(error.message),
    });
  };

  const changeQuantity = (line: CartLine, quantity: number) => {
    if (quantity <= 0) {
      remove(line);
      return;
    }
    updateLines.mutate([{ id: line.id, quantity }], {
      onError: (error) => toast.error(error.message),
    });
  };

  return {
    changeQuantity,
    remove,
    busy: updateLines.isPending || removeLines.isPending,
  };
}
