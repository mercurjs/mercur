import { cancelBeginOrderEditWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * `DELETE /vendor/order-edits/:id` — mirrors
 * `DELETE /admin/order-edits/:id`
 * (medusa/packages/medusa/src/api/admin/order-edits/[id]/route.ts).
 * Cancels a draft edit. Seller-scope enforced upstream by
 * `assertSellerOwnsOrderInParam`.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderEditDeleteResponse>
) => {
  const { id } = req.params

  await cancelBeginOrderEditWorkflow(req.scope).run({
    input: {
      order_id: id,
    },
  })

  res.status(200).json({
    id,
    object: "order-edit",
    deleted: true,
  })
}
