import { linkProductsToSalesChannelWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes as VendorHttpTypes } from "@mercurjs/types"

import { refetchSalesChannel } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBatchLink>,
  res: MedusaResponse<VendorHttpTypes.VendorSalesChannelResponse>
) => {
  const { id } = req.params
  const { add, remove } = req.validatedBody

  // A seller may only attach its own products to a sales channel. Verify
  // every product in `add` resolves through the seller's product_seller link.
  if (add?.length) {
    const sellerId = req.seller_context!.seller_id
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: links } = await query.graph({
      entity: "product_seller",
      fields: ["product_id"],
      filters: { seller_id: sellerId, product_id: add },
    })

    const ownedProductIds = new Set(
      links.map((link: { product_id: string | null }) => link.product_id)
    )
    const unowned = add.filter((productId) => !ownedProductIds.has(productId))

    if (unowned.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id: ${unowned.join(", ")} was not found`
      )
    }
  }

  await linkProductsToSalesChannelWorkflow(req.scope).run({
    input: {
      id,
      add,
      remove,
    },
  })

  const sales_channel = await refetchSalesChannel(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ sales_channel })
}
