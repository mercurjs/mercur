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
      fields: '+service_zone.fulfillment_set.type,*service_zone.fulfillment_set.location.address',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'no-cache'
      }
    } as never) as unknown as Promise<{
      // Core returns the options already grouped by seller
      // (`Record<sellerId, ShippingOption[]>`), not a flat array.
      shipping_options:
        | Record<string, StoreCardShippingMethod[]>
        | StoreCardShippingMethod[]
        | null;
    }>)
    .then(({ shipping_options }) => flattenSellerShippingOptions(shipping_options))
    .catch(() => {
      return null;
    });
};

/**
 * The seller-scoped shipping-options endpoint groups its result by seller id.
 * The delivery section expects a flat list where each option carries
 * `seller_id` / `seller_name`, so lift those off the nested `seller` and
 * flatten. Falls back gracefully if the endpoint ever returns a bare array.
 */
function flattenSellerShippingOptions(
  shipping_options:
    | Record<string, StoreCardShippingMethod[]>
    | StoreCardShippingMethod[]
    | null
): StoreCardShippingMethod[] | null {
  if (!shipping_options) {
    return null;
  }

  const groups = Array.isArray(shipping_options)
    ? [shipping_options]
    : Object.values(shipping_options);

  return groups.flat().map(option => {
    const seller = (option as { seller?: { id?: string; name?: string } }).seller;
    return {
      ...option,
      seller_id: (option as { seller_id?: string }).seller_id ?? seller?.id,
      seller_name:
        (option as { seller_name?: string }).seller_name ?? seller?.name
    } as StoreCardShippingMethod;
  });
}

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
