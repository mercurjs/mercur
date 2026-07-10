import { SellerProps } from '@/types/seller';

import { sdk } from '../client';

export const getSellerByHandle = async (handle: string) => {
  return (
    sdk.store.sellers.query({
      handle,
      fetchOptions: { cache: 'no-cache' },
    }) as unknown as Promise<{ sellers: SellerProps[] }>
  )
    .then(({ sellers }) => sellers.find(seller => seller.handle === handle) ?? null)
    .catch(() => null);
};
