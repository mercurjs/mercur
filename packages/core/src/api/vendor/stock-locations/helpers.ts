import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerStockLocations = async (
  scope: MedusaContainer,
  sellerId: string,
  stockLocationIds: string[]
) => {
  const ids = Array.from(new Set(stockLocationIds))
  if (!ids.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links } = await query.graph({
    entity: "stock_location_seller",
    filters: {
      seller_id: sellerId,
      stock_location_id: ids,
    },
    fields: ["stock_location_id"],
  })

  const owned = new Set(
    links.map(
      (link) => (link as { stock_location_id?: string }).stock_location_id
    )
  )
  const missing = ids.find((id) => !owned.has(id))

  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock location with id: ${missing} was not found`
    )
  }
}

export const validateSellerStockLocation = (
  scope: MedusaContainer,
  sellerId: string,
  stockLocationId: string
) => validateSellerStockLocations(scope, sellerId, [stockLocationId])

export const refetchStockLocation = async (
  scope: MedusaContainer,
  stockLocationId: string,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [stockLocation],
  } = await query.graph({
    entity: "stock_location",
    filters: { id: stockLocationId },
    fields,
  })

  return stockLocation
}
