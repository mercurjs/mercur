import { requestOrderEditRequestWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * `POST /vendor/order-edits/:id/request` — mirrors
 * `POST /admin/order-edits/:id/request`. Flips a draft edit to
 * `requested`. `requested_by` is stamped with the seller's id (the
 * vendor equivalent of admin's `actor_id` — see
 * `packages/core/src/api/vendor/returns/[id]/request/route.ts`).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id } = req.params

  const { result } = await requestOrderEditRequestWorkflow(req.scope).run({
    input: {
      order_id: id,
      requested_by: req.seller_context!.seller_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
