import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { requestProductRevisionWorkflow } from "../../../../../workflows/product/workflows/request-product-revision"
import { AdminRequestProductChangesType } from "../../validators"

/**
 * Admin-side "ask the vendor to revise the submission". Delegates to
 * `requestProductRevisionWorkflow` — validates the product is
 * `proposed`, stamps a confirmed `ProductChange` (audit row) with a
 * `STATUS_CHANGE → draft` action, drops the product back to `draft`
 * so the vendor can edit and re-propose, and emits
 * `product.requires-action`. The operator `message` lands on the
 * audit change's `external_note`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRequestProductChangesType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await requestProductRevisionWorkflow(req.scope).run({
    input: {
      product_id: productId,
      message: req.validatedBody?.message,
      actor_id: req.auth_context?.actor_id,
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
