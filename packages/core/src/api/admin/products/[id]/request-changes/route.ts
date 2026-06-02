import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, ProductChangeStatus } from "@mercurjs/types"

import { requestProductChangesWorkflow } from "../../../../../workflows/product-change/workflows/request-product-changes"
import { AdminRequestProductChangesType } from "../../validators"

/**
 * Admin-side "request changes" — transitions the pending
 * `ProductChange` for a product to `REQUIRES_ACTION`, surfacing a
 * message back to the vendor. Resolves the change id from
 * `(product_id, status: pending)` and delegates to
 * `requestProductChangesWorkflow`. This flips the computed
 * `Product.requires_action` boolean to `true`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRequestProductChangesType>,
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

  await requestProductChangesWorkflow(req.scope).run({
    input: {
      id: changes[0].id,
      requires_action_by: req.auth_context?.actor_id,
      requires_action_reason: req.validatedBody?.message,
      external_note: req.validatedBody?.message,
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
