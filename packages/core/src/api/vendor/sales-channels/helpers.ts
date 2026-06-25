import { MedusaContainer } from "@medusajs/framework"
import { refetchEntity } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { getSellerOwnedProductIds } from "../products/helpers"

export const refetchSalesChannel = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  return await refetchEntity({
    entity: "sales_channel",
    idOrFilter: id,
    scope,
    fields,
  })
}

export const ensureSellerOwnsProducts = async (
  scope: MedusaContainer,
  sellerId: string,
  productIds: string[]
) => {
  if (!productIds.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  // Assigned via product_seller (eligibility) OR created by this seller.
  const { data: links } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: { seller_id: sellerId, product_id: productIds },
  })

  const ownedProductIds = new Set<string | null>(
    links.map((link: { product_id: string | null }) => link.product_id)
  )
  for (const id of await getSellerOwnedProductIds(scope, sellerId)) {
    ownedProductIds.add(id)
  }
  const unowned = productIds.filter((id) => !ownedProductIds.has(id))

  if (unowned.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${unowned.join(", ")} was not found`
    )
  }
}
