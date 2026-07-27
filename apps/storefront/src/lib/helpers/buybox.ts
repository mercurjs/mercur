import { OfferDTO } from '@mercurjs/types';

/**
 * `inventory_quantity` is a computed field the store offers route adds when
 * `+inventory_quantity` is requested; it is not part of `OfferDTO`.
 */
export type StoreOffer = OfferDTO & { inventory_quantity?: number | null };

export const getOfferAmount = (offer: StoreOffer): number | null =>
  offer.calculated_price?.calculated_amount ?? null;

export const getOfferStock = (offer: StoreOffer): number =>
  offer.inventory_quantity ?? 0;

export const isPurchasable = (offer: StoreOffer): boolean =>
  getOfferStock(offer) > 0 && getOfferAmount(offer) !== null;

/**
 * Buybox comparator (best first): in-stock before out-of-stock, then lowest
 * price, then premium seller, then oldest offer as a stable tie-break.
 */
export const compareOffers = (a: StoreOffer, b: StoreOffer): number => {
  const aBuyable = isPurchasable(a);
  const bBuyable = isPurchasable(b);
  if (aBuyable !== bBuyable) return aBuyable ? -1 : 1;

  const aAmount = getOfferAmount(a) ?? Number.POSITIVE_INFINITY;
  const bAmount = getOfferAmount(b) ?? Number.POSITIVE_INFINITY;
  if (aAmount !== bAmount) return aAmount - bAmount;

  const aPremium = a.seller?.is_premium ? 1 : 0;
  const bPremium = b.seller?.is_premium ? 1 : 0;
  if (aPremium !== bPremium) return bPremium - aPremium;

  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
};

export const rankOffers = (offers: StoreOffer[]): StoreOffer[] =>
  [...offers].sort(compareOffers);

export const getVariantOffers = (
  offers: StoreOffer[],
  variantId: string
): StoreOffer[] =>
  rankOffers(offers.filter((offer) => offer.variant_id === variantId));

/** First purchasable offer in buybox order, else the top-ranked offer. */
export const getBuyboxWinner = (
  rankedOffers: StoreOffer[]
): StoreOffer | undefined =>
  rankedOffers.find(isPurchasable) ?? rankedOffers[0];
