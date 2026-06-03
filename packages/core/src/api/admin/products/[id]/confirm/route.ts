import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { confirmProductsWorkflow } from "../../../../../workflows/product/workflows/confirm-products"
import { AdminConfirmProductType } from "../../validators"

/**
 * Admin-side "publish a vendor submission". Delegates to
 * `confirmProductsWorkflow`, which:
 *   - validates the product is `proposed`,
 *   - stamps a confirmed `ProductChange` (audit row) with a
 *     `STATUS_CHANGE → published` action,
 *   - updates the product status to `published`,
 *   - emits `product.published`.
 *
 * The operator's optional `internal_note` is recorded on the audit
 * change so the team can correlate the publish with a reason later.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminConfirmProductType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await confirmProductsWorkflow(req.scope).run({
    input: {
      product_ids: [productId],
      actor_id: req.auth_context?.actor_id,
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
