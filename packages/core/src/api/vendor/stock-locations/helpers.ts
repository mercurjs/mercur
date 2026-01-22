import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerStockLocation = async (
  scope: MedusaContainer,
  sellerId: string,
  stockLocationId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerStockLocation],
  } = await query.graph({
    entity: "seller_stock_location",
    filters: {
      seller_id: sellerId,
      stock_location_id: stockLocationId,
    },
    fields: ["seller_id", "stock_location_id"],
  })

  if (!sellerStockLocation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock location with id: ${stockLocationId} was not found`
    )
  }
}

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
