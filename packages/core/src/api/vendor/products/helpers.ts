import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export const ensureSellerOwnsProduct = async (
  scope: MedusaContainer,
  sellerId: string,
  productId: string
): Promise<void> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: {
      seller_id: sellerId,
      product_id: productId,
    },
  })

  if (!data?.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }
}
