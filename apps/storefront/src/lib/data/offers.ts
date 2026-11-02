import { OfferDTO } from '@mercurjs/types';
import { cacheLife, cacheTag } from 'next/cache';

import { sdk } from '../client';
import { CACHE_TAGS, cacheFailedRead } from './cache-tags';
import { getRegion } from './regions';

// All fields are `+`-prefixed so they MERGE with the route defaults instead of
// replacing them. The defaults carry `product_variant.price_set.id` and the
// `inventory_item_link.*.location_levels` fields that the computed
// `calculated_price` / `inventory_quantity` depend on — dropping them (via an
// unprefixed field) silently yields null prices and zero stock.
const OFFER_FIELDS =
  '+seller.logo,+seller.banner,+seller.is_premium,' +
  '+calculated_price,+inventory_quantity,' +
  '+product.id,+product.title,+product.handle,+product.thumbnail';

export const listOffers = async ({
  productId,
  sellerId,
  countryCode,
  regionId,
  limit,
  offset,
}: {
  productId?: string;
  sellerId?: string;
  countryCode?: string;
  regionId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ offers: OfferDTO[]; count: number }> => {
  'use cache';
  // Offer price and stock change with every order, which sends no webhook.
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.offers);
  if (productId) {
    cacheTag(CACHE_TAGS.productOffers(productId));
  }

  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  return (
    sdk.store.offers.query({
      product_id: productId,
      seller_id: sellerId,
      region_id: region?.id,
      country_code: countryCode,
      limit,
      offset,
      fields: OFFER_FIELDS,
      fetchOptions: { cache: 'no-store' },
    } as never) as unknown as Promise<{ offers: OfferDTO[]; count: number }>
  )
    .then(({ offers, count }) => ({ offers, count }))
    .catch(() => {
      cacheFailedRead();
      return { offers: [], count: 0 };
    });
};

export const retrieveOffer = async (
  id: string,
  { countryCode, regionId }: { countryCode?: string; regionId?: string } = {}
): Promise<OfferDTO | null> => {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.offers, CACHE_TAGS.offer(id));

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
      fetchOptions: { cache: 'no-store' },
    } as never) as unknown as Promise<{ offer: OfferDTO }>
  )
    .then(({ offer }) => offer)
    .catch(() => {
      cacheFailedRead();
      return null;
    });
};
