'use server';

import { HttpTypes } from '@medusajs/types';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import medusaError from '@/lib/helpers/medusa-error';
import { parseVariantIdsFromError } from '@/lib/helpers/parse-variant-error';

import { sdk } from '../client';
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId
} from './cookies';
import { getRegion } from './regions';

export async function retrieveCart(cartId?: string) {
  const id = cartId || (await getCartId());

  if (!id) {
    return null;
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  return await sdk.store.carts.$id
    .query({
      $id: id,
      fields:
        '*items,*region, *items.product, *items.variant, *items.variant.options, items.variant.options.option.title,' +
        '*items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *items.offer, *items.offer.seller' +
        '',
      fetchOptions: { headers, cache: 'no-cache' }
    })
    .then(({ cart }) => cart)
    .catch(() => null);
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  let cart = await retrieveCart();

  const headers = {
    ...(await getAuthHeaders())
  };

  if (!cart) {
    const cartResp = await sdk.store.carts.mutate({
      region_id: region.id,
      fetchOptions: { headers }
    });
    cart = cartResp.cart;

    await setCartId(cart.id);

    const cartCacheTag = await getCacheTag('carts');
    revalidateTag(cartCacheTag);
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.carts.$id.mutate({
      $id: cart.id,
      region_id: region.id,
      fetchOptions: { headers }
    });
    const cartCacheTag = await getCacheTag('carts');
    revalidateTag(cartCacheTag);
  }

  return cart;
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId();

  if (!cartId) {
    throw new Error('No existing cart found, please create one before updating');
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  return await sdk.store.carts.$id
    .mutate({ $id: cartId, ...data, fetchOptions: { headers } })
    .then(async ({ cart }) => {
      const cartCacheTag = await getCacheTag('carts');
      await revalidateTag(cartCacheTag);
      return cart;
    })
    .catch(medusaError);
}

export async function addToCart({
  offerId,
  quantity,
  countryCode
}: {
  offerId: string;
  quantity: number;
  countryCode: string;
}) {
  if (!offerId) {
    throw new Error('Missing offer ID when adding to cart');
  }

  const cart = await getOrSetCart(countryCode);

  if (!cart) {
    throw new Error('Error retrieving or creating cart');
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  // Line items are offer-scoped: the same variant sold by two sellers are two
  // distinct offers and two distinct lines. Dedup by the offer stamped on
  // `metadata.offer_id` (requested by `retrieveCart`).
  const currentItem = cart.items?.find(
    item => item.metadata?.offer_id === offerId
  );

  if (currentItem) {
    await sdk.store.carts.$id.lineItems.$lineId
      .mutate({
        $id: cart.id,
        $lineId: currentItem.id,
        quantity: currentItem.quantity + quantity,
        fetchOptions: { headers }
      })
      .catch(medusaError)
      .finally(async () => {
        const cartCacheTag = await getCacheTag('carts');
        revalidateTag(cartCacheTag);
      });
  } else {
    await (sdk.store.carts.$id.lineItems
      .mutate({
        $id: cart.id,
        offer_id: offerId,
        quantity,
        fetchOptions: { headers }
      } as never) as unknown as Promise<{ cart: HttpTypes.StoreCart }>)
      .then(async () => {
        const cartCacheTag = await getCacheTag('carts');
        revalidateTag(cartCacheTag);
      })
      .catch(medusaError)
      .finally(async () => {
        const cartCacheTag = await getCacheTag('carts');
        revalidateTag(cartCacheTag);
      });
  }
}

export async function updateLineItem({ lineId, quantity }: { lineId: string; quantity: number }) {
  if (!lineId) {
    throw new Error('Missing lineItem ID when updating line item');
  }

  const cartId = await getCartId();

  if (!cartId) {
    throw new Error('Missing cart ID when updating line item');
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  const res = await sdk.store.carts.$id.lineItems.$lineId.mutate({
    $id: cartId,
    $lineId: lineId,
    quantity,
    fetchOptions: { headers }
  });

  const cartCacheTag = await getCacheTag('carts');
  await revalidateTag(cartCacheTag);

  return res;
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error('Missing lineItem ID when deleting line item');
  }

  const cartId = await getCartId();

  if (!cartId) {
    throw new Error('Missing cart ID when deleting line item');
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  await sdk.store.carts.$id.lineItems.$lineId
    .delete({ $id: cartId, $lineId: lineId, fetchOptions: { headers } })
    .then(async () => {
      const cartCacheTag = await getCacheTag('carts');
      await revalidateTag(cartCacheTag);
    })
    .catch(medusaError);
}

export async function setShippingMethod({
  cartId,
  shippingMethodId
}: {
  cartId: string;
  shippingMethodId: string;
}) {
  const headers = {
    ...(await getAuthHeaders())
  };

  const res = await sdk.store.carts.$id.shippingMethods
    .mutate({ $id: cartId, option_id: shippingMethodId, fetchOptions: { headers } })
    .then(data => ({ ok: true, error: null, data }))
    .catch(error => ({ ok: false, error, data: null }));

  const cartCacheTag = await getCacheTag('carts');
  revalidateTag(cartCacheTag);

  return res;
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: {
    provider_id: string;
    context?: Record<string, unknown>;
  }
) {
  const headers = {
    ...(await getAuthHeaders())
  };

  try {
    let paymentCollection = cart.payment_collection;

    if (!paymentCollection) {
      const { payment_collection } = await sdk.store.paymentCollections.mutate({
        cart_id: cart.id,
        fetchOptions: { headers }
      });
      paymentCollection = payment_collection;
    }

    const resp = await sdk.store.paymentCollections.$id.paymentSessions.mutate({
      $id: paymentCollection.id,
      provider_id: data.provider_id,
      ...(data.context ? { context: data.context } : {}),
      fetchOptions: { headers }
    });

    const cartCacheTag = await getCacheTag('carts');
    revalidateTag(cartCacheTag);

    return resp;
  } catch (error) {
    return medusaError(error);
  }
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId();

  if (!cartId) {
    return { success: false, error: "No existing cart found" }
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  try {
    const { cart } = await sdk.store.carts.$id.mutate({
      $id: cartId,
      promo_codes: codes,
      fetchOptions: { headers }
    })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    // @ts-ignore
    const applied = cart.promotions?.some((promotion: any) =>
      codes.includes(promotion.code)
    )
    return { success: true, applied }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to apply promotion code"
    return { success: false, error: errorMessage }
  }
}

export async function removeShippingMethod(shippingMethodId: string) {
  const cartId = await getCartId();

  if (!cartId) {
    throw new Error('No existing cart found');
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  return ((sdk.store.carts.$id.shippingMethods as unknown as { delete: (i: never) => unknown })
    .delete({
      $id: cartId,
      shipping_method_ids: [shippingMethodId],
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ cart: HttpTypes.StoreCart }>)
    .then(async () => {
      const cartCacheTag = await getCacheTag('carts');
      revalidateTag(cartCacheTag);
    })
    .catch(medusaError);
}

export async function deletePromotionCode(promoId: string) {
  const cartId = await getCartId();

  if (!cartId) {
    throw new Error('No existing cart found');
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  return ((sdk.store.carts.$id.promotions as unknown as { delete: (i: never) => unknown })
    .delete({
      $id: cartId,
      promo_codes: [promoId],
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ cart: HttpTypes.StoreCart }>)
    .then(async () => {
      const cartCacheTag = await getCacheTag('carts');
      revalidateTag(cartCacheTag);
    })
    .catch(medusaError);
}

export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error('No form data found when setting addresses');
    }
    const cartId = getCartId();
    if (!cartId) {
      throw new Error('No existing cart found when setting addresses');
    }

    const data = {
      shipping_address: {
        first_name: formData.get('shipping_address.first_name'),
        last_name: formData.get('shipping_address.last_name'),
        address_1: formData.get('shipping_address.address_1'),
        address_2: '',
        company: formData.get('shipping_address.company'),
        postal_code: formData.get('shipping_address.postal_code'),
        city: formData.get('shipping_address.city'),
        country_code: formData.get('shipping_address.country_code'),
        province: formData.get('shipping_address.province'),
        phone: formData.get('shipping_address.phone')
      },
      email: formData.get('email')
    } as any;

    data.billing_address = data.shipping_address;

    await updateCart(data);
    await revalidatePath('/cart');
  } catch (e: any) {
    return e.message;
  }
}

export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId());

  if (!id) {
    throw new Error('No existing cart found when placing an order');
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  const res = await sdk.store.carts.$id.complete
    .mutate({ $id: id, fetchOptions: { headers } })
    .then(data => ({ ok: true, error: null, data: data as any }))
    .catch(error => ({ ok: false, error, data: null as any }));

  const cartCacheTag = await getCacheTag('carts');
  revalidateTag(cartCacheTag);

  if (res.data?.order_group) {
    revalidatePath('/user/reviews');
    revalidatePath('/user/orders');
    removeCartId();
    // The completed cart splits into one order group (many per-seller orders).
    // Send the shopper to the order-group detail page, which renders every
    // child order + aggregated totals. `order_group.id` is always present;
    // `orders[0].id` is not (the complete route omits `orders` from its fields).
    redirect(`/user/orders/${res.data.order_group.id}`);
  }

  return res;
}

export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId();
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  if (cartId) {
    await updateCart({ region_id: region.id });
    const cartCacheTag = await getCacheTag('carts');
    revalidateTag(cartCacheTag);
  }

  const regionCacheTag = await getCacheTag('regions');
  revalidateTag(regionCacheTag);

  const productsCacheTag = await getCacheTag('products');
  revalidateTag(productsCacheTag);

  redirect(`/${countryCode}${currentPath}`);
}

export async function updateRegionWithValidation(
  countryCode: string,
  currentPath: string
): Promise<{ removedItems: string[]; newPath: string }> {
  const cartId = await getCartId();
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  let removedItems: string[] = [];

  if (cartId) {
    const headers = {
      ...(await getAuthHeaders())
    };

    try {
      await updateCart({ region_id: region.id });
    } catch (error: any) {
      if (!error?.message?.includes('do not have a price')) {
        throw error;
      }

      const problematicVariantIds = parseVariantIdsFromError(error.message);

      if (!problematicVariantIds.length) {
        throw new Error('Failed to parse variant IDs from error');
      }

      try {
        const { cart } = await sdk.store.carts.$id.query({
          $id: cartId,
          fields: '*items',
          fetchOptions: { headers, cache: 'no-cache' }
        });

        for (const variantId of problematicVariantIds) {
          const item = cart?.items?.find(item => item.variant_id === variantId);
          if (item) {
            try {
              await sdk.store.carts.$id.lineItems.$lineId.delete({
                $id: cart.id,
                $lineId: item.id,
                fetchOptions: { headers }
              });
              removedItems.push(item.product_title || 'Unknown product');
            } catch (deleteError) {
              // ignore individual delete failures and continue removing the rest
            }
          }
        }

        if (removedItems.length > 0) {
          await updateCart({ region_id: region.id });
        }
      } catch (fetchError) {
        throw new Error('Failed to handle incompatible cart items');
      }
    }

    const cartCacheTag = await getCacheTag('carts');
    revalidateTag(cartCacheTag);
  }

  const regionCacheTag = await getCacheTag('regions');
  revalidateTag(regionCacheTag);

  const productsCacheTag = await getCacheTag('products');
  revalidateTag(productsCacheTag);

  return {
    removedItems,
    newPath: `/${countryCode}${currentPath}`
  };
}

export async function listCartOptions() {
  const cartId = await getCartId();
  const headers = {
    ...(await getAuthHeaders())
  };
  const next = {
    ...(await getCacheOptions('shippingOptions'))
  };

  return await (sdk.store.shippingOptions.query({
    cart_id: cartId,
    fetchOptions: { headers, next, cache: 'force-cache' }
  } as never) as unknown as Promise<{
    shipping_options: HttpTypes.StoreCartShippingOption[];
  }>);
}
