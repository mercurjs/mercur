import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { rejectProductWorkflow } from "../../../../../workflows/product/workflows/reject-product"
import { AdminRejectProductType } from "../../validators"

/**
 * Admin-side "reject a vendor submission". Delegates to
 * `rejectProductWorkflow` — validates the product is `proposed`,
 * stamps a confirmed `ProductChange` with a `STATUS_CHANGE → rejected`
 * action, updates product status, and emits `product.rejected`. The
 * operator `message` is recorded on the audit change's `external_note`
 * so the vendor sees the reason on their product detail panel.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRejectProductType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await rejectProductWorkflow(req.scope).run({
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
