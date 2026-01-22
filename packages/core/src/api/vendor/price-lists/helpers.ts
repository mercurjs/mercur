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
    entity: "seller_price_list",
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
