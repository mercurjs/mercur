'use client';

import { useCartContext } from '@/components/providers';
import { MinusThinIcon, PlusIcon } from '@/icons';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/helpers/toast';

const MAX_QUANTITY = 99;

export const UpdateCartItemButton = ({
  quantity,
  lineItemId,
  compact = false
}: {
  quantity: number;
  lineItemId: string;
  compact?: boolean;
}) => {
  const { updateCartItem } = useCartContext();
  const isOptimisticLine = !lineItemId || lineItemId.startsWith('optimistic:');

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > MAX_QUANTITY) return;

    try {
      await updateCartItem(lineItemId, newQuantity);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message.replace('Error setting up the request: ', '')
          : 'Failed to update quantity';
      toast.error({
        title: 'Error updating cart',
        description: errorMessage
      });
    }
  };

  const buttonClassName = cn(
    'flex cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40',
    compact ? 'h-7 w-7' : 'h-8 w-8'
  );

  return (
    <div
      aria-label="Item quantity"
      role="group"
      className={cn('inline-flex items-center rounded-sm border', !compact && 'mt-2')}
      data-testid="cart-item-quantity"
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className={buttonClassName}
        disabled={isOptimisticLine || quantity <= 1}
        onClick={() => handleQuantityChange(quantity - 1)}
        data-testid="cart-item-quantity-decrease"
      >
        <MinusThinIcon size={compact ? 14 : 16} />
      </button>
      <span
        aria-live="polite"
        role="status"
        className={cn('label-md text-center tabular-nums text-primary', compact ? 'w-6' : 'w-8')}
        data-testid="cart-item-quantity-value"
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={buttonClassName}
        disabled={isOptimisticLine || quantity >= MAX_QUANTITY}
        onClick={() => handleQuantityChange(quantity + 1)}
        data-testid="cart-item-quantity-increase"
      >
        <PlusIcon size={compact ? 14 : 16} />
      </button>
    </div>
  );
};
