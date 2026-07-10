'use server';

import { HttpTypes } from '@medusajs/types';

import { sdk } from '../client';
import { getAuthHeaders, getCacheOptions } from './cookies';

export const listCartPaymentMethods = async (regionId: string) => {
  const next = {
    ...(await getCacheOptions('payment_providers'))
  };

  return (sdk.store.paymentProviders
    .query({
      region_id: regionId,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'force-cache'
      }
    } as never) as unknown as Promise<HttpTypes.StorePaymentProviderListResponse>)
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      })
    )
    .catch(() => {
      return null;
    });
};
