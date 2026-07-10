'use server';

import { OfferDTO } from '@mercurjs/types';

import { sdk } from '../client';
import { getAuthHeaders, getCacheOptions } from './cookies';
import { getRegion } from './regions';

const OFFER_FIELDS =
  '*seller,*product_variant,*prices,+calculated_price,+inventory_quantity';

export const listOffers = async ({
  productId,
  sellerId,
  countryCode,
  regionId,
}: {
  productId?: string;
  sellerId?: string;
  countryCode?: string;
  regionId?: string;
}): Promise<{ offers: OfferDTO[]; count: number }> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  const next = { ...(await getCacheOptions('offers')) };

  return (
    sdk.store.offers.query({
      product_id: productId,
      seller_id: sellerId,
      region_id: region?.id,
      country_code: countryCode,
      fields: OFFER_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
      },
    } as never) as unknown as Promise<{ offers: OfferDTO[]; count: number }>
  )
    .then(({ offers, count }) => ({ offers, count }))
    .catch(() => ({ offers: [], count: 0 }));
};

export const retrieveOffer = async (
  id: string,
  { countryCode, regionId }: { countryCode?: string; regionId?: string } = {}
): Promise<OfferDTO | null> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  return (
    sdk.store.offers.$id.query({
      $id: id,
      region_id: region?.id,
      country_code: countryCode,
      fields: OFFER_FIELDS,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } },
    } as never) as unknown as Promise<{ offer: OfferDTO }>
  )
    .then(({ offer }) => offer)
    .catch(() => null);
};
