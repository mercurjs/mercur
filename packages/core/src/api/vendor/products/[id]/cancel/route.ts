import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { ProductChangeDTO, ProductChangeStatus } from "@mercurjs/types"

import { cancelProductChangeWorkflow } from "../../../../../workflows/product-edit/workflows/cancel-product-change"

/**
 * Vendor-side cancel of the seller's own pending `ProductChange`.
 * Resolves the active change via `(product_id, created_by, status: pending)`
 * — vendors can only cancel changes they authored. Marks the change
 * `CANCELED`; no underlying product mutation happens.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { data: changes } = await query.graph({
    entity: "product_change",
    fields: ["id"],
    filters: {
      product_id: productId,
      created_by: sellerId,
      status: ProductChangeStatus.PENDING,
    },
  })

  if (!changes.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No pending product change to cancel for product ${productId}`
    )
  }

  await cancelProductChangeWorkflow(req.scope).run({
    input: {
      id: changes[0].id,
      canceled_by: sellerId,
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: changes[0].id },
  })

  res.json({ product_change })
}
