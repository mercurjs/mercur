import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, ProductChangeStatus } from "@mercurjs/types"

import { confirmProductChangeWorkflow } from "../../../../../workflows/product-change/workflows/confirm-product-change"
import { AdminConfirmProductType } from "../../validators"

/**
 * Admin-side confirm of the pending `ProductChange` attached to a
 * product. Resolves the change id from `(product_id, status: pending)`
 * and delegates to `confirmProductChangeWorkflow`. The change's staged
 * actions are then applied to the product in a single transaction.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminConfirmProductType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { data: changes } = await query.graph({
    entity: "product_change",
    fields: ["id"],
    filters: {
      product_id: productId,
      status: ProductChangeStatus.PENDING,
    },
  })

  if (!changes.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No pending product change found for product ${productId}`,
    )
  }

  await confirmProductChangeWorkflow(req.scope).run({
    input: {
      ids: [changes[0].id],
      confirmed_by: req.auth_context?.actor_id,
      internal_note: req.validatedBody?.internal_note,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.json({ product })
}
