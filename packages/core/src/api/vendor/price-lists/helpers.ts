import { MedusaContainer } from "@medusajs/framework/types"
import {
  buildPriceListRules,
  buildPriceSetPricesForCore,
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerPriceList = async (
  scope: MedusaContainer,
  sellerId: string,
  priceListId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerPriceList],
  } = await query.graph({
    entity: "price_list_seller",
    filters: {
      seller_id: sellerId,
      price_list_id: priceListId,
    },
    fields: ["seller_id", "price_list_id"],
  })

  if (!sellerPriceList) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Price list with id: ${priceListId} was not found`
    )
  }
}

export const fetchPriceList = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [priceList],
  } = await query.graph({
    entity: "price_list",
    fields,
    filters: { id },
  })

  if (!priceList) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Price list with id: ${id} was not found`
    )
  }

  return transformPriceList(priceList)
}

export const transformPriceList = (priceList: any) => {
  if (priceList.price_list_rules) {
    priceList.rules = buildPriceListRules(priceList.price_list_rules)
    delete priceList.price_list_rules
  }

  if (priceList.prices) {
    priceList.prices = buildPriceSetPricesForCore(priceList.prices)
  }

  return priceList
}

export const fetchPriceListPriceIdsForProduct = async (
  priceListId: string,
  productIds: string[],
  scope: MedusaContainer
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: variants } = await query.graph({
    entity: "product_variant",
    filters: { product_id: productIds },
    fields: ["price_set.id"],
  })

  const priceSetIds: string[] = []
  for (const variant of variants) {
    if ((variant as any).price_set?.id) {
      priceSetIds.push((variant as any).price_set.id)
    }
  }

  if (!priceSetIds.length) {
    return []
  }

  const { data: productPrices } = await query.graph({
    entity: "price",
    filters: {
      price_set_id: priceSetIds,
      price_list_id: priceListId,
    },
    fields: ["id"],
  })

  return productPrices.map((price: any) => price.id)
}

export const validatePriceListPrices = async (
  scope: MedusaContainer,
  priceListId: string,
  priceIds: string[]
) => {
  const ids = Array.from(new Set(priceIds))
  if (!ids.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: prices } = await query.graph({
    entity: "price",
    filters: { id: ids, price_list_id: priceListId },
    fields: ["id"],
  })

  const owned = new Set(prices.map((price) => price.id))
  const missing = ids.find((id) => !owned.has(id))

  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Price with id: ${missing} was not found`
    )
  }
}

type PriceWithOfferRule = {
  variant_id?: string
  rules?: Record<string, string>
}

export const validateSellerPriceListPriceOffers = async (
  scope: MedusaContainer,
  sellerId: string,
  prices: PriceWithOfferRule[]
) => {
  const scoped = prices.filter((price) => price.rules?.offer_id)
  if (!scoped.length) {
    return
  }

  const offerIds = Array.from(
    new Set(scoped.map((price) => price.rules!.offer_id))
  )
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers } = await query.graph({
    entity: "offer",
    filters: { id: offerIds, seller_id: sellerId },
    fields: ["id", "variant_id"],
  })

  const variantByOffer = new Map(
    offers.map((offer) => [offer.id, offer.variant_id])
  )

  for (const price of scoped) {
    const offerId = price.rules!.offer_id
    const variantId = variantByOffer.get(offerId)

    if (!variantId || (price.variant_id && price.variant_id !== variantId)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Offer with id: ${offerId} was not found`
      )
    }
  }
}
