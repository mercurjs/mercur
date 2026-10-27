import { SellerDTO } from '@mercurjs/types';

import { sdk } from '../client';
import { CACHE_TAGS } from './cache-tags';

const SELLER_FIELDS =
  'id,name,handle,description,logo,banner,is_premium,metadata,created_at,email,phone';

export const getSellerByHandle = async (
  handle: string
): Promise<SellerDTO | null> => {
  return (
    sdk.store.sellers.query({
      handle,
      fields: SELLER_FIELDS,
      fetchOptions: {
        next: {
          revalidate: 300,
          tags: [CACHE_TAGS.sellers, CACHE_TAGS.seller(handle)],
        },
      },
    } as never) as unknown as Promise<{ sellers: SellerDTO[] }>
  )
    .then(({ sellers }) => sellers.find((s) => s.handle === handle) ?? null)
    .catch(() => null);
};
