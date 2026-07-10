'use server';

import { revalidatePath } from 'next/cache';

import { Wishlist } from '@/types/wishlist';

import { fetchQuery, sdk } from '../config';
import { getAuthHeaders } from './cookies';
import { getRegion } from "@/lib/data/regions"

export const getUserWishlists = async ({regionId, countryCode} : {regionId?: string, countryCode?: string}) => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string
  };

  const query: Record<string, string> = {
    fields: '+variants.calculated_price.*,+variants.currency_code'
  };

  let finalRegionId = regionId;

  if (!finalRegionId && countryCode) {
    const region = await getRegion(countryCode);
    if (region) {
      finalRegionId = region.id;
    }
  }

  if (finalRegionId) {
    query.region_id = finalRegionId;
  }
  if (countryCode) {
    query.country_code = countryCode;
  }

  return sdk.client
    .fetch<Wishlist>(`/store/wishlist`, {
      cache: 'no-cache',
      headers,
      method: 'GET',
      query
    })
    .then(res => {
      return res;
    })
    .catch(() => {
      return { products: [] };
    });
};

export const addWishlistItem = async ({
  reference_id,
  reference
}: {
  reference_id: string;
  reference: 'product';
}) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const response = await fetchQuery('/store/wishlist', {
    headers,
    method: 'POST',
    body: {
      reference,
      reference_id
    }
  })

  revalidatePath('/wishlist');

  if (!response.ok) {
    throw new Error(response.error?.message || 'An error occured');
  }

  return response;
};

export const removeWishlistItem = async ({
  product_id
}: {
  product_id: string;
}) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const response = await fetchQuery(`/store/wishlist/product/${product_id}`, {
    headers,
    method: 'DELETE'
  })

  revalidatePath('/wishlist');

  if (!response.ok) {
    throw new Error(response.error?.message || 'An error occured');
  }

  return response;
};
