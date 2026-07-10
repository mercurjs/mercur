'use server';

import { StoreCardShippingMethod } from '@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection';
import { sdk } from '@/lib/client';

import { getAuthHeaders, getCacheOptions } from './cookies';

export const listCartShippingMethods = async (cartId: string, is_return: boolean = false) => {
  const next = {
    ...(await getCacheOptions('fulfillment'))
  };

  return (sdk.store.shippingOptions
    .query({
      cart_id: cartId,
      fields: '+service_zone.fulfllment_set.type,*service_zone.fulfillment_set.location.address',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'no-cache'
      }
    } as never) as unknown as Promise<{ shipping_options: StoreCardShippingMethod[] | null }>)
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null;
    });
};

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const next = {
    ...(await getCacheOptions('fulfillment'))
  };

  return sdk.store.shippingOptions.$id.calculate
    .mutate({
      $id: optionId,
      cart_id: cartId,
      ...(data ? { data } : {}),
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next
      }
    })
    .then(({ shipping_option }) => shipping_option)
    .catch(() => {
      return null;
    });
};
