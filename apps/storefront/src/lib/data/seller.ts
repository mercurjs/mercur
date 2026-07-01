import { SellerProps } from '@/types/seller';

import { mercur } from '../mercur';

export const getSellerByHandle = async (handle: string) => {
  return mercur.store.sellers
    .query({
      handle,
      fields:
        '+created_at,+email,+reviews.seller.name,+reviews.rating,+reviews.customer_note,+reviews.seller_note,+reviews.created_at,+reviews.updated_at,+reviews.customer.first_name,+reviews.customer.last_name',
      fetchOptions: { cache: 'no-cache' }
    })
    .then(({ sellers }) => {
      const seller = sellers[0] as unknown as SellerProps;

      const response = {
        ...seller,
        reviews:
          seller.reviews
            ?.filter(item => item !== null)
            .sort((a, b) => b.created_at.localeCompare(a.created_at)) ?? []
      };

      return response as SellerProps;
    })
    .catch(() => []);
};
