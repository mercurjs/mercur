import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, ProductChangeStatus } from "@mercurjs/types"

import { rejectProductChangeWorkflow } from "../../../../../workflows/product-edit/workflows/reject-product-change"
import { AdminRejectProductType } from "../../validators"

/**
 * Admin-side reject of the pending `ProductChange` attached to a
 * product. Resolves the pending change id from
 * `(product_id, status: pending)` and delegates to
 * `rejectProductChangeWorkflow`. The change is marked `DECLINED`; the
 * optional `message` is persisted as `declined_reason`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRejectProductType>,
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

  await rejectProductChangeWorkflow(req.scope).run({
    input: {
      id: changes[0].id,
      declined_by: req.auth_context?.actor_id,
      declined_reason: req.validatedBody?.message,
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
