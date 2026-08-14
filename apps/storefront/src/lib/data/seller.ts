import { SellerDTO } from '@mercurjs/types';

import { sdk } from '../client';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';

const SELLER_FIELDS =
  'id,name,handle,description,logo,banner,is_premium,metadata,created_at,email,phone';

export const getSellerByHandle = async (
  handle: string
): Promise<SellerDTO | null> => {
  return (
    sdk.store.sellers.query({
      handle,
      fields: SELLER_FIELDS,
      fetchOptions: { cache: 'no-cache' },
    } as never) as unknown as Promise<{ sellers: SellerDTO[] }>
  )
    .then(({ sellers }) => sellers.find((s) => s.handle === handle) ?? null)
    .catch(() => null);
};

export const listSellers = async ({
  limit = 100,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}): Promise<{ sellers: Pick<SellerDTO, 'id' | 'name' | 'handle'>[]; count: number }> => {
  return (
    sdk.store.sellers.query({
      fields: 'id,name,handle',
      limit,
      offset,
      fetchOptions: {
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.sellers),
      },
    } as never) as unknown as Promise<{
      sellers: Pick<SellerDTO, 'id' | 'name' | 'handle'>[];
      count: number;
    }>
  )
    .then(({ sellers, count }) => ({ sellers, count: count ?? sellers.length }))
    .catch(() => ({ sellers: [], count: 0 }));
};

