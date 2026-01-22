import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerProduct = async (
  scope: MedusaContainer,
  sellerId: string,
  productId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerProduct],
  } = await query.graph({
    entity: "seller_product",
    filters: {
      seller_id: sellerId,
      product_id: productId,
    },
    fields: ["seller_id", "product_id"],
  })

  if (!sellerProduct) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${productId} was not found`
    )
  }
}
