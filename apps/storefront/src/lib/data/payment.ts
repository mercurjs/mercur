'use server';

import { mercur } from '../mercur';
import { getAuthHeaders, getCacheOptions } from './cookies';

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('payment_providers'))
  };

  return mercur.store.paymentProviders
    .query({
      region_id: regionId,
      fetchOptions: { headers, next, cache: 'force-cache' }
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
