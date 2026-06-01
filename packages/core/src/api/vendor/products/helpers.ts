import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"

/**
 * Throws `NOT_FOUND` (rather than `NOT_ALLOWED`) when the seller does
 * not own the product. The product is technically queryable for them
 * if `status = published`, but mutations require ownership; the 404
 * shape avoids leaking the difference.
 */
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
