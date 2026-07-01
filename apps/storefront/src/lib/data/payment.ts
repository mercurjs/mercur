'use cache';

import { HttpTypes } from '@mercurjs/types';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS } from '../cache/cache-tags';
import { EXPIRE, REVALIDATE } from '../cache/constants';
import { sdk } from '../config';

export const listCartPaymentMethods = async (regionId: string) => {
  cacheTag(CACHE_TAGS.paymentProviders);
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(`/store/payment-providers`, {
      method: 'GET',
      query: { region_id: regionId }
    })
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      })
    )
    .catch(() => {
      return null;
    });
};
