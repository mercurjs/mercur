'use server';

import { StoreCardShippingMethod } from '@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection';

import { mercur } from '../mercur';
import { getAuthHeaders, getCacheOptions } from './cookies';

export const listCartShippingMethods = async (cartId: string, is_return: boolean = false) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('fulfillment'))
  };

  return mercur.store.shippingOptions
    .query({
      cart_id: cartId,
      fields: '+service_zone.fulfllment_set.type,*service_zone.fulfillment_set.location.address',
      fetchOptions: { headers, next, cache: 'no-cache' }
    })
    .then(
      ({ shipping_options }) =>
        shipping_options as unknown as StoreCardShippingMethod[] | null
    )
    .catch(() => {
      return null;
    });
};

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('fulfillment'))
  };

  return mercur.store.shippingOptions.$id.calculate
    .mutate({
      $id: optionId,
      cart_id: cartId,
      data,
      fetchOptions: { headers, next }
    } as Parameters<
      typeof mercur.store.shippingOptions.$id.calculate.mutate
    >[0])
    .then(({ shipping_option }) => shipping_option)
    .catch(e => {
      return null;
    });
};
