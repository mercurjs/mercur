'use client';

import { useEffect, useState } from 'react';

import { HttpTypes } from '@medusajs/types';

import { Button } from '@/components/atoms';
import { HeartFilledIcon, HeartIcon } from '@/icons';
import { addWishlistItem, removeWishlistItem } from '@/lib/data/wishlist';
import { toast } from '@/lib/helpers/toast';
import { Wishlist } from '@/types/wishlist';

export const WishlistButton = ({
  productId,
  wishlist,
  user
}: {
  productId: string;
  wishlist?: Wishlist;
  user?: HttpTypes.StoreCustomer | null;
}) => {
  const [isWishlistAdding, setIsWishlistAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(
    wishlist?.products?.some(item => item.id === productId)
  );

  useEffect(() => {
    setIsWishlisted(wishlist?.products?.some(item => item.id === productId));
  }, [wishlist, productId]);

  if (!user) {
    return null;
  }

  const handleAddToWishlist = async () => {
    try {
      setIsWishlistAdding(true);
      await addWishlistItem({
        reference_id: productId,
        reference: 'product'
      });
    } catch (error) {
      toast.error({
        title: 'Failed to add item to wishlist',
        description: error instanceof Error ? error?.message : 'An error occurred'
      });
    } finally {
      setIsWishlistAdding(false);
    }
  };

  const handleRemoveFromWishlist = async () => {
    try {
      setIsWishlistAdding(true);

      await removeWishlistItem({
        product_id: productId
      });
    } catch (error) {
      toast.error({
        title: 'Failed to add item to wishlist',
        description: error instanceof Error ? error?.message : 'An error occurred'
      });
    } finally {
      setIsWishlistAdding(false);
    }
  };
  return (
    <Button
      onClick={isWishlisted ? () => handleRemoveFromWishlist() : () => handleAddToWishlist()}
      variant="tonal"
      className="flex h-10 w-10 items-center justify-center p-0"
      loading={isWishlistAdding}
      disabled={isWishlistAdding}
    >
      {isWishlisted ? <HeartFilledIcon size={20} /> : <HeartIcon size={20} />}
    </Button>
  );
};
