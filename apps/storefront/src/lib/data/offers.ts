'use server';

import { OfferDTO } from '@mercurjs/types';

import { mercur } from '../mercur';
import { getAuthHeaders } from './cookies';
import { getRegion } from './regions';

const amountOf = (offer: OfferDTO) =>
  offer.calculated_price?.calculated_amount ?? Number.POSITIVE_INFINITY;

/**
 * Lists every offer for a product, enriched with the per-offer calculated price
 * and stock, sorted so `offers[0]` is the cheapest purchasable (in-stock) offer.
 */
export async function listProductOffers({
  productId,
  countryCode
}: {
  productId: string;
  countryCode: string;
}): Promise<OfferDTO[]> {
  const region = await getRegion(countryCode);

  if (!region) {
    return [];
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  const { offers } = await mercur.store.offers
    .query({
      product_id: productId,
      region_id: region.id,
      country_code: countryCode,
      fields: '+calculated_price,+inventory_quantity,+in_stock',
      limit: 50,
      fetchOptions: { headers, cache: 'no-cache' }
    })
    .catch(() => ({ offers: [] as OfferDTO[] }));

  return [...offers].sort((a, b) => {
    if (!!a.in_stock !== !!b.in_stock) {
      return a.in_stock ? -1 : 1;
    }
    return amountOf(a) - amountOf(b);
  });
}
