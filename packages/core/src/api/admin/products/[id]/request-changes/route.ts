import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { requestProductChangeWorkflow } from "../../../../../workflows/product/workflows/request-product-change"
import { AdminRequestProductChangesType } from "../../validators"

/**
 * Admin-side "ask the vendor to revise the submission". Delegates to
 * `requestProductChangeWorkflow` — validates the product is `proposed`,
 * stamps a confirmed `ProductChange` audit row with a single
 * `CHANGE_REQUESTED` action (applied), and emits
 * `product.change-requested` so a notification handler can email the
 * vendor. The product status stays put; the operator `message` lands
 * on the audit change's `external_note`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRequestProductChangesType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await requestProductChangeWorkflow(req.scope).run({
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
