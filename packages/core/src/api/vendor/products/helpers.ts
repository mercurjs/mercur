import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export const ensureSellerOwnsProduct = async (
  scope: MedusaContainer,
  sellerId: string,
  productIds: string[]
): Promise<void> => {
  if (!productIds.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: {
      seller_id: sellerId,
      product_id: productIds,
    },
  })

  const ownedProductIds = new Set(data.map(({ product_id }) => product_id))
  const missingProductId = productIds.find((id) => !ownedProductIds.has(id))

  if (missingProductId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${missingProductId} was not found`
    )
  }
}
