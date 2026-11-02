import { SellerDTO } from '@mercurjs/types';

import { cacheLife, cacheTag } from 'next/cache';

import { sdk } from '../client';
import { CACHE_TAGS, cacheFailedRead } from './cache-tags';

const SELLER_FIELDS =
  'id,name,handle,description,logo,banner,is_premium,metadata,created_at,email,phone';

export const getSellerByHandle = async (
  handle: string
): Promise<SellerDTO | null> => {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.sellers, CACHE_TAGS.seller(handle));

  return (
    sdk.store.sellers.query({
      handle,
      fields: SELLER_FIELDS,
      fetchOptions: { cache: 'no-store' },
    } as never) as unknown as Promise<{ sellers: SellerDTO[] }>
  )
    .then(({ sellers }) => sellers.find((s) => s.handle === handle) ?? null)
    .catch(() => {
      cacheFailedRead();
      return null;
    });
};
